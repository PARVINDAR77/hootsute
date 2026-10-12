import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { StorageProviderFactory } from './providers/storage-provider.factory';
import { FileSignatureValidator } from './utils/file-signature.validator';
import {
  MediaType,
  MediaProcessingStatus,
  MediaStorageProvider,
  MediaAssetDto,
  UploadSessionResponseDto,
  MediaAccessUrlDto,
  WorkspaceStorageUsageDto,
} from '@packages/shared';
import { CreateUploadSessionDto } from './dto/create-upload-session.dto';
import { CompleteUploadDto } from './dto/complete-upload.dto';
import { QueryMediaDto } from './dto/query-media.dto';
import { randomUUID } from 'crypto';
import * as path from 'path';

@Injectable()
export class MediaService {
  private readonly logger = new Logger(MediaService.name);
  private readonly uploadTtlSeconds: number;
  private readonly downloadTtlSeconds: number;
  private readonly maxImageBytes: number;
  private readonly maxVideoBytes: number;

  constructor(
    private readonly prisma: PrismaService,
    private readonly storageFactory: StorageProviderFactory,
    private readonly configService: ConfigService,
  ) {
    this.uploadTtlSeconds = parseInt(
      this.configService.get<string>('MEDIA_UPLOAD_URL_TTL_SECONDS') || '900',
      10,
    );
    this.downloadTtlSeconds = parseInt(
      this.configService.get<string>('MEDIA_DOWNLOAD_URL_TTL_SECONDS') || '3600',
      10,
    );
    this.maxImageBytes = parseInt(
      this.configService.get<string>('MEDIA_MAX_IMAGE_BYTES') || '15728640', // 15MB
      10,
    );
    this.maxVideoBytes = parseInt(
      this.configService.get<string>('MEDIA_MAX_VIDEO_BYTES') || '104857600', // 100MB
      10,
    );
  }

  /**
   * Step 1: Create upload session with server-generated key and signed upload URL
   */
  async createUploadSession(
    workspaceId: string,
    userId: string,
    dto: CreateUploadSessionDto,
  ): Promise<UploadSessionResponseDto> {
    const isVideo = dto.mimeType.startsWith('video/');
    const mediaType = isVideo ? MediaType.VIDEO : MediaType.IMAGE;
    const maxAllowed = isVideo ? this.maxVideoBytes : this.maxImageBytes;

    if (dto.sizeBytes > maxAllowed) {
      throw new BadRequestException(
        `File size exceeds maximum allowed for ${mediaType} (${Math.round(maxAllowed / (1024 * 1024))}MB)`,
      );
    }

    // Enforce workspace storage quota and asset capacity limits
    await this.assertStorageQuota(workspaceId, dto.sizeBytes);

    const sanitizedExt = this.sanitizeExtension(dto.filename, dto.mimeType);
    const assetId = randomUUID();
    const storageKey = `workspaces/${workspaceId}/media/${assetId}${sanitizedExt}`;

    const provider = this.storageFactory.getProvider();
    const storageProviderEnum =
      provider.providerName === 's3'
        ? MediaStorageProvider.S3
        : MediaStorageProvider.LOCAL_MOCK;

    // Persist pending asset record
    await this.prisma.mediaAsset.create({
      data: {
        id: assetId,
        workspaceId,
        uploadedByUserId: userId,
        originalFilename: path.basename(dto.filename),
        storageKey,
        storageProvider: storageProviderEnum,
        mimeType: dto.mimeType,
        mediaType,
        sizeBytes: dto.sizeBytes,
        processingStatus: MediaProcessingStatus.UPLOADING,
      },
    });

    const session = await provider.getUploadSignedUrl({
      storageKey,
      mimeType: dto.mimeType,
      maxSizeBytes: maxAllowed,
      expiresInSeconds: this.uploadTtlSeconds,
    });

    return {
      assetId,
      storageKey,
      uploadUrl: session.uploadUrl,
      method: session.method,
      headers: session.headers,
      expiresInSeconds: session.expiresInSeconds,
      maxSizeBytes: maxAllowed,
    };
  }

  /**
   * Step 3 & 4: Verify upload completion, inspect file signature, and mark READY
   */
  async completeUpload(
    workspaceId: string,
    assetId: string,
    _dto?: CompleteUploadDto,
  ): Promise<MediaAssetDto> {
    const asset = await this.prisma.mediaAsset.findFirst({
      where: {
        id: assetId,
        workspaceId,
        deletedAt: null,
      },
    });

    if (!asset) {
      throw new NotFoundException(`Media asset [${assetId}] not found in workspace [${workspaceId}]`);
    }

    if (asset.processingStatus === MediaProcessingStatus.READY) {
      return this.enrichAssetWithUrl(asset);
    }

    const provider = this.storageFactory.getProvider();
    const exists = await provider.objectExists(asset.storageKey);

    if (!exists) {
      await this.prisma.mediaAsset.update({
        where: { id: assetId },
        data: {
          processingStatus: MediaProcessingStatus.FAILED,
          errorMessage: 'Uploaded file could not be found in cloud storage',
        },
      });
      throw new BadRequestException('Object was not found in storage. Upload may have failed or timed out.');
    }

    const metadata = await provider.getObjectMetadata(asset.storageKey);
    const actualSize = metadata?.sizeBytes || asset.sizeBytes;

    // Buffer inspection (magic bytes & dimensions)
    const headerBuffer = await provider.getObjectBuffer(asset.storageKey, 4096);
    let width: number | undefined;
    let height: number | undefined;

    if (headerBuffer) {
      const inspection = FileSignatureValidator.inspectBuffer(headerBuffer, asset.mimeType);
      if (!inspection.isValid) {
        await this.prisma.mediaAsset.update({
          where: { id: assetId },
          data: {
            processingStatus: MediaProcessingStatus.FAILED,
            errorMessage: inspection.error || 'Invalid file signature',
          },
        });
        throw new BadRequestException(inspection.error || 'Uploaded file failed signature validation');
      }

      width = inspection.width;
      height = inspection.height;
    }

    const updated = await this.prisma.mediaAsset.update({
      where: { id: assetId },
      data: {
        processingStatus: MediaProcessingStatus.READY,
        sizeBytes: actualSize,
        width,
        height,
        checksumSha256: metadata?.etag,
        errorMessage: null,
      },
      include: {
        uploadedBy: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    return this.enrichAssetWithUrl(updated);
  }

  /**
   * Direct server-mediated upload (for local dev / small assets)
   */
  async directUpload(
    workspaceId: string,
    userId: string,
    file: { originalname: string; mimetype: string; size: number; buffer: Buffer },
  ): Promise<MediaAssetDto> {
    const isVideo = file.mimetype.startsWith('video/');
    const mediaType = isVideo ? MediaType.VIDEO : MediaType.IMAGE;
    const maxAllowed = isVideo ? this.maxVideoBytes : this.maxImageBytes;

    if (file.size > maxAllowed) {
      throw new BadRequestException(`File size exceeds maximum allowed (${Math.round(maxAllowed / (1024 * 1024))}MB)`);
    }

    // Enforce workspace storage quota and asset capacity limits
    await this.assertStorageQuota(workspaceId, file.size);

    // Inspect buffer directly
    const inspection = FileSignatureValidator.inspectBuffer(file.buffer, file.mimetype);
    if (!inspection.isValid) {
      throw new BadRequestException(inspection.error || 'Uploaded file failed signature validation');
    }

    const sanitizedExt = this.sanitizeExtension(file.originalname, file.mimetype);
    const assetId = randomUUID();
    const storageKey = `workspaces/${workspaceId}/media/${assetId}${sanitizedExt}`;

    const provider = this.storageFactory.getProvider();
    const putResult = await provider.putObject(storageKey, file.buffer, file.mimetype);

    const storageProviderEnum =
      provider.providerName === 's3'
        ? MediaStorageProvider.S3
        : MediaStorageProvider.LOCAL_MOCK;

    const asset = await this.prisma.mediaAsset.create({
      data: {
        id: assetId,
        workspaceId,
        uploadedByUserId: userId,
        originalFilename: path.basename(file.originalname),
        storageKey,
        storageProvider: storageProviderEnum,
        mimeType: file.mimetype,
        mediaType,
        sizeBytes: putResult.sizeBytes,
        width: inspection.width,
        height: inspection.height,
        checksumSha256: putResult.etag,
        processingStatus: MediaProcessingStatus.READY,
      },
      include: {
        uploadedBy: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    return this.enrichAssetWithUrl(asset);
  }

  /**
   * Paginated listing of workspace media assets
   */
  async getMediaAssets(
    workspaceId: string,
    query: QueryMediaDto,
  ): Promise<{ data: MediaAssetDto[]; total: number; page: number; limit: number }> {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = {
      workspaceId,
      deletedAt: null,
    };

    if (query.mediaType) {
      where.mediaType = query.mediaType;
    }

    if (query.status) {
      where.processingStatus = query.status;
    }

    if (query.search && query.search.trim().length > 0) {
      where.originalFilename = {
        contains: query.search.trim(),
        mode: 'insensitive',
      };
    }

    const [assets, total] = await Promise.all([
      this.prisma.mediaAsset.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          uploadedBy: {
            select: { id: true, name: true, email: true },
          },
          _count: {
            select: { variants: true },
          },
        },
      }),
      this.prisma.mediaAsset.count({ where }),
    ]);

    const enriched = await Promise.all(
      assets.map(async (asset) => {
        const enrichedAsset = await this.enrichAssetWithUrl(asset);
        enrichedAsset.usageCount = (asset as any)._count?.variants || 0;
        return enrichedAsset;
      }),
    );

    return {
      data: enriched,
      total,
      page,
      limit,
    };
  }

  /**
   * Get single asset detail
   */
  async getMediaAssetById(workspaceId: string, assetId: string): Promise<MediaAssetDto> {
    const asset = await this.prisma.mediaAsset.findFirst({
      where: {
        id: assetId,
        workspaceId,
        deletedAt: null,
      },
      include: {
        uploadedBy: {
          select: { id: true, name: true, email: true },
        },
        _count: {
          select: { variants: true },
        },
      },
    });

    if (!asset) {
      throw new NotFoundException(`Media asset [${assetId}] not found in workspace [${workspaceId}]`);
    }

    const enriched = await this.enrichAssetWithUrl(asset);
    enriched.usageCount = (asset as any)._count?.variants || 0;
    return enriched;
  }

  /**
   * Generates a signed access URL for private asset preview/download
   */
  async getAccessUrl(
    workspaceId: string,
    assetId: string,
    ttlSeconds?: number,
  ): Promise<MediaAccessUrlDto> {
    const asset = await this.prisma.mediaAsset.findFirst({
      where: {
        id: assetId,
        workspaceId,
        deletedAt: null,
      },
    });

    if (!asset) {
      throw new NotFoundException(`Media asset [${assetId}] not found in workspace [${workspaceId}]`);
    }

    const effectiveTtl = ttlSeconds || this.downloadTtlSeconds;
    const provider = this.storageFactory.getProvider();
    const url = await provider.getDownloadSignedUrl({
      storageKey: asset.storageKey,
      expiresInSeconds: effectiveTtl,
      downloadFilename: asset.originalFilename,
    });

    return {
      assetId,
      url,
      expiresInSeconds: effectiveTtl,
    };
  }

  /**
   * Safe asset deletion with protected active scheduled post checks
   */
  async deleteMediaAsset(
    workspaceId: string,
    userId: string,
    userRole: string,
    assetId: string,
  ): Promise<{ message: string }> {
    const asset = await this.prisma.mediaAsset.findFirst({
      where: {
        id: assetId,
        workspaceId,
        deletedAt: null,
      },
      include: {
        variants: {
          include: {
            draft: {
              include: {
                scheduledPosts: {
                  where: {
                    status: {
                      in: ['SCHEDULED', 'PROCESSING'],
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!asset) {
      throw new NotFoundException(`Media asset [${assetId}] not found in workspace [${workspaceId}]`);
    }

    // Role check: Only asset uploader or ADMIN / OWNER can delete
    if (asset.uploadedByUserId !== userId && userRole !== 'OWNER' && userRole !== 'ADMIN') {
      throw new ForbiddenException('Only the asset uploader or a workspace administrator can delete this asset');
    }

    // Protection check: Cannot delete media referenced by an active SCHEDULED or PROCESSING post
    const hasActiveScheduledPosts = asset.variants.some(
      (v) => v.draft?.scheduledPosts && v.draft.scheduledPosts.length > 0,
    );

    if (hasActiveScheduledPosts) {
      throw new ConflictException(
        'Cannot delete media asset: It is actively attached to one or more upcoming scheduled posts. Cancel or reschedule the posts before deleting this asset.',
      );
    }

    // Soft delete asset record
    await this.prisma.mediaAsset.update({
      where: { id: assetId },
      data: {
        deletedAt: new Date(),
      },
    });

    // Nullify references in non-scheduled content variants
    await this.prisma.contentVariant.updateMany({
      where: { mediaAssetId: assetId },
      data: { mediaAssetId: null },
    });

    return { message: 'Media asset deleted successfully' };
  }

  /**
   * Retry failed processing
   */
  async retryProcessing(workspaceId: string, assetId: string): Promise<MediaAssetDto> {
    const asset = await this.prisma.mediaAsset.findFirst({
      where: { id: assetId, workspaceId, deletedAt: null },
    });

    if (!asset) {
      throw new NotFoundException(`Media asset [${assetId}] not found in workspace [${workspaceId}]`);
    }

    await this.prisma.mediaAsset.update({
      where: { id: assetId },
      data: {
        processingStatus: MediaProcessingStatus.UPLOADING,
        errorMessage: null,
      },
    });

    return this.completeUpload(workspaceId, assetId);
  }

  /**
   * Enriches an asset record with a signed access URL for display in frontend
   */
  private async enrichAssetWithUrl(asset: any): Promise<MediaAssetDto> {
    const provider = this.storageFactory.getProvider();
    let accessUrl: string | null = null;

    try {
      if (asset.processingStatus === MediaProcessingStatus.READY) {
        accessUrl = await provider.getDownloadSignedUrl({
          storageKey: asset.storageKey,
          expiresInSeconds: this.downloadTtlSeconds,
          downloadFilename: asset.originalFilename,
        });
      }
    } catch (err: any) {
      this.logger.warn(`Could not generate signed access URL for asset [${asset.id}]: ${err.message}`);
    }

    return {
      id: asset.id,
      workspaceId: asset.workspaceId,
      uploadedByUserId: asset.uploadedByUserId,
      originalFilename: asset.originalFilename,
      storageKey: asset.storageKey,
      storageProvider: asset.storageProvider as MediaStorageProvider,
      mimeType: asset.mimeType,
      mediaType: asset.mediaType as MediaType,
      sizeBytes: asset.sizeBytes,
      width: asset.width,
      height: asset.height,
      durationSeconds: asset.durationSeconds,
      processingStatus: asset.processingStatus as MediaProcessingStatus,
      errorMessage: asset.errorMessage,
      checksumSha256: asset.checksumSha256,
      metadata: asset.metadata,
      accessUrl,
      createdAt: asset.createdAt.toISOString(),
      updatedAt: asset.updatedAt.toISOString(),
      deletedAt: asset.deletedAt ? asset.deletedAt.toISOString() : null,
      uploadedBy: asset.uploadedBy,
    };
  }

  /**
   * Retrieves workspace storage quota and metering statistics
   */
  async getStorageUsage(workspaceId: string): Promise<WorkspaceStorageUsageDto> {
    const workspace = await this.prisma.workspace.findUnique({
      where: { id: workspaceId },
      select: {
        id: true,
        planTier: true,
        storageQuotaBytes: true,
        maxMediaAssets: true,
      },
    });

    if (!workspace) {
      throw new NotFoundException(`Workspace [${workspaceId}] not found`);
    }

    const quotaBytes = Number(workspace.storageQuotaBytes || 5368709120);
    const maxAssets = workspace.maxMediaAssets || 500;

    // Aggregate storage used by active media assets
    const [aggregate, totalCount, imageCount, videoCount] = await Promise.all([
      this.prisma.mediaAsset.aggregate({
        where: {
          workspaceId,
          deletedAt: null,
          processingStatus: { not: MediaProcessingStatus.FAILED },
        },
        _sum: {
          sizeBytes: true,
        },
      }),
      this.prisma.mediaAsset.count({
        where: {
          workspaceId,
          deletedAt: null,
          processingStatus: { not: MediaProcessingStatus.FAILED },
        },
      }),
      this.prisma.mediaAsset.count({
        where: {
          workspaceId,
          mediaType: MediaType.IMAGE,
          deletedAt: null,
          processingStatus: { not: MediaProcessingStatus.FAILED },
        },
      }),
      this.prisma.mediaAsset.count({
        where: {
          workspaceId,
          mediaType: MediaType.VIDEO,
          deletedAt: null,
          processingStatus: { not: MediaProcessingStatus.FAILED },
        },
      }),
    ]);

    const usedBytes = aggregate._sum.sizeBytes || 0;
    const remainingBytes = Math.max(0, quotaBytes - usedBytes);
    const usagePercentage = quotaBytes > 0
      ? Math.min(100, Math.round((usedBytes / quotaBytes) * 1000) / 10)
      : 0;
    const isQuotaExceeded = usedBytes >= quotaBytes || totalCount >= maxAssets;

    return {
      workspaceId,
      planTier: workspace.planTier || 'FREE',
      usedBytes,
      quotaBytes,
      usagePercentage,
      isQuotaExceeded,
      remainingBytes,
      assetCounts: {
        total: totalCount,
        images: imageCount,
        videos: videoCount,
        maxAssets,
      },
    };
  }

  /**
   * Asserts that the workspace has sufficient storage and asset capacity
   */
  async assertStorageQuota(workspaceId: string, incomingBytes: number): Promise<void> {
    const usage = await this.getStorageUsage(workspaceId);

    if (usage.assetCounts.total + 1 > usage.assetCounts.maxAssets) {
      throw new ForbiddenException(
        `Workspace asset limit reached (${usage.assetCounts.total}/${usage.assetCounts.maxAssets} assets). Upgrade your plan to upload more assets.`,
      );
    }

    if (usage.usedBytes + incomingBytes > usage.quotaBytes) {
      const usedMb = (usage.usedBytes / (1024 * 1024)).toFixed(1);
      const quotaMb = (usage.quotaBytes / (1024 * 1024)).toFixed(0);
      throw new ForbiddenException(
        `Workspace storage quota exceeded (${usedMb}MB used of ${quotaMb}MB limit). Upgrade your plan to increase media storage capacity.`,
      );
    }
  }

  private sanitizeExtension(filename: string, mimeType: string): string {
    const ext = path.extname(filename).toLowerCase();
    if (ext && /^\.[a-z0-9]{2,5}$/.test(ext)) {
      return ext;
    }

    const mimeMap: Record<string, string> = {
      'image/jpeg': '.jpg',
      'image/png': '.png',
      'image/webp': '.webp',
      'video/mp4': '.mp4',
      'video/quicktime': '.mov',
    };

    return mimeMap[mimeType] || '.bin';
  }
}
