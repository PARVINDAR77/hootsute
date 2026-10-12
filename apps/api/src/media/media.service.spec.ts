import { Test, TestingModule } from '@nestjs/testing';
import { MediaService } from './media.service';
import { PrismaService } from '../prisma/prisma.service';
import { StorageProviderFactory } from './providers/storage-provider.factory';
import { ConfigService } from '@nestjs/config';
import { MockStorageProvider } from './providers/mock-storage.provider';
import { BadRequestException, ConflictException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { MediaType, MediaProcessingStatus } from '@packages/shared';

describe('MediaService', () => {
  let service: MediaService;
  let prisma: any;
  let mockStorage: MockStorageProvider;

  const mockDate = new Date('2026-10-12T10:00:00Z');

  beforeEach(async () => {
    mockStorage = new MockStorageProvider();

    prisma = {
      workspace: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'ws-1',
          planTier: 'FREE',
          storageQuotaBytes: BigInt(5368709120),
          maxMediaAssets: 500,
        }),
      },
      mediaAsset: {
        create: jest.fn(),
        findFirst: jest.fn(),
        findMany: jest.fn(),
        count: jest.fn().mockResolvedValue(5),
        aggregate: jest.fn().mockResolvedValue({ _sum: { sizeBytes: 1048576 } }),
        update: jest.fn(),
      },
      contentVariant: {
        updateMany: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MediaService,
        {
          provide: PrismaService,
          useValue: prisma,
        },
        {
          provide: StorageProviderFactory,
          useValue: {
            getProvider: () => mockStorage,
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockImplementation((key: string) => {
              if (key === 'MEDIA_MAX_IMAGE_BYTES') return '15728640';
              if (key === 'MEDIA_MAX_VIDEO_BYTES') return '104857600';
              if (key === 'MEDIA_UPLOAD_URL_TTL_SECONDS') return '900';
              if (key === 'MEDIA_DOWNLOAD_URL_TTL_SECONDS') return '3600';
              return undefined;
            }),
          },
        },
      ],
    }).compile();

    service = module.get<MediaService>(MediaService);
  });

  describe('createUploadSession', () => {
    it('rejects an upload request exceeding maximum allowed bytes', async () => {
      await expect(
        service.createUploadSession('ws-1', 'user-1', {
          filename: 'giant-photo.jpg',
          mimeType: 'image/jpeg',
          sizeBytes: 25 * 1024 * 1024, // 25MB > 15MB limit
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('creates an upload session with unique key and signed upload URL', async () => {
      prisma.mediaAsset.create.mockResolvedValue({
        id: 'asset-123',
        workspaceId: 'ws-1',
        uploadedByUserId: 'user-1',
      });

      const res = await service.createUploadSession('ws-1', 'user-1', {
        filename: 'banner.png',
        mimeType: 'image/png',
        sizeBytes: 2 * 1024 * 1024,
      });

      expect(res.assetId).toBeDefined();
      expect(res.storageKey).toContain('workspaces/ws-1/media/');
      expect(res.storageKey).toMatch(/\.png$/);
      expect(res.uploadUrl).toBeDefined();
      expect(res.method).toBe('PUT');
      expect(res.expiresInSeconds).toBe(900);
      expect(prisma.mediaAsset.create).toHaveBeenCalled();
    });
  });

  describe('completeUpload', () => {
    it('throws NotFoundException if asset is not found in workspace', async () => {
      prisma.mediaAsset.findFirst.mockResolvedValue(null);

      await expect(
        service.completeUpload('ws-1', 'asset-404'),
      ).rejects.toThrow(NotFoundException);
    });

    it('marks asset FAILED if file does not exist in storage', async () => {
      prisma.mediaAsset.findFirst.mockResolvedValue({
        id: 'asset-1',
        workspaceId: 'ws-1',
        storageKey: 'workspaces/ws-1/media/missing.png',
        processingStatus: MediaProcessingStatus.UPLOADING,
        sizeBytes: 1000,
        mimeType: 'image/png',
      });

      await expect(
        service.completeUpload('ws-1', 'asset-1'),
      ).rejects.toThrow(BadRequestException);

      expect(prisma.mediaAsset.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'asset-1' },
          data: expect.objectContaining({
            processingStatus: MediaProcessingStatus.FAILED,
          }),
        }),
      );
    });

    it('verifies valid PNG file signature and marks asset READY with extracted dimensions', async () => {
      const storageKey = 'workspaces/ws-1/media/valid.png';

      // Build valid PNG buffer (800x600)
      const pngBuffer = Buffer.alloc(32);
      pngBuffer[0] = 0x89;
      pngBuffer[1] = 0x50;
      pngBuffer[2] = 0x4e;
      pngBuffer[3] = 0x47;
      pngBuffer[4] = 0x0d;
      pngBuffer[5] = 0x0a;
      pngBuffer[6] = 0x1a;
      pngBuffer[7] = 0x0a;
      pngBuffer.writeUInt32BE(13, 8);
      pngBuffer.write('IHDR', 12, 'ascii');
      pngBuffer.writeUInt32BE(800, 16);
      pngBuffer.writeUInt32BE(600, 20);

      await mockStorage.putObject(storageKey, pngBuffer, 'image/png');

      prisma.mediaAsset.findFirst.mockResolvedValue({
        id: 'asset-png',
        workspaceId: 'ws-1',
        storageKey,
        processingStatus: MediaProcessingStatus.UPLOADING,
        sizeBytes: pngBuffer.length,
        mimeType: 'image/png',
      });

      prisma.mediaAsset.update.mockResolvedValue({
        id: 'asset-png',
        workspaceId: 'ws-1',
        uploadedByUserId: 'user-1',
        originalFilename: 'valid.png',
        storageKey,
        storageProvider: 'LOCAL_MOCK',
        mimeType: 'image/png',
        mediaType: 'IMAGE',
        sizeBytes: pngBuffer.length,
        width: 800,
        height: 600,
        processingStatus: 'READY',
        createdAt: mockDate,
        updatedAt: mockDate,
        uploadedBy: { id: 'user-1', name: 'Alice', email: 'alice@example.com' },
      });

      const res = await service.completeUpload('ws-1', 'asset-png');
      expect(res.processingStatus).toBe(MediaProcessingStatus.READY);
      expect(res.width).toBe(800);
      expect(res.height).toBe(600);
      expect(res.accessUrl).toBeDefined();
    });
  });

  describe('deleteMediaAsset', () => {
    it('blocks deletion if asset is referenced by an active SCHEDULED post', async () => {
      prisma.mediaAsset.findFirst.mockResolvedValue({
        id: 'asset-scheduled',
        workspaceId: 'ws-1',
        uploadedByUserId: 'user-1',
        variants: [
          {
            id: 'variant-1',
            draft: {
              scheduledPosts: [
                { id: 'post-1', status: 'SCHEDULED' },
              ],
            },
          },
        ],
      });

      await expect(
        service.deleteMediaAsset('ws-1', 'user-1', 'OWNER', 'asset-scheduled'),
      ).rejects.toThrow(ConflictException);
    });

    it('blocks deletion if non-admin tries to delete an asset uploaded by another user', async () => {
      prisma.mediaAsset.findFirst.mockResolvedValue({
        id: 'asset-other',
        workspaceId: 'ws-1',
        uploadedByUserId: 'user-creator',
        variants: [],
      });

      await expect(
        service.deleteMediaAsset('ws-1', 'intruder-user', 'EDITOR', 'asset-other'),
      ).rejects.toThrow(ForbiddenException);
    });

    it('soft-deletes asset and unlinks variants when safe', async () => {
      prisma.mediaAsset.findFirst.mockResolvedValue({
        id: 'asset-safe',
        workspaceId: 'ws-1',
        uploadedByUserId: 'user-1',
        variants: [
          {
            id: 'variant-1',
            draft: {
              scheduledPosts: [], // No active scheduled posts
            },
          },
        ],
      });

      prisma.mediaAsset.update.mockResolvedValue({});
      prisma.contentVariant.updateMany.mockResolvedValue({ count: 1 });

      const res = await service.deleteMediaAsset('ws-1', 'user-1', 'EDITOR', 'asset-safe');
      expect(res.message).toContain('deleted successfully');
      expect(prisma.mediaAsset.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'asset-safe' },
          data: expect.objectContaining({ deletedAt: expect.any(Date) }),
        }),
      );
      expect(prisma.contentVariant.updateMany).toHaveBeenCalledWith({
        where: { mediaAssetId: 'asset-safe' },
        data: { mediaAssetId: null },
      });
    });
  });

  describe('getMediaAssets', () => {
    it('returns paginated list with enriched access URLs and usage counts', async () => {
      prisma.mediaAsset.findMany.mockResolvedValue([
        {
          id: 'asset-1',
          workspaceId: 'ws-1',
          uploadedByUserId: 'user-1',
          originalFilename: 'pic.jpg',
          storageKey: 'workspaces/ws-1/media/pic.jpg',
          storageProvider: 'LOCAL_MOCK',
          mimeType: 'image/jpeg',
          mediaType: 'IMAGE',
          sizeBytes: 5000,
          processingStatus: 'READY',
          createdAt: mockDate,
          updatedAt: mockDate,
          uploadedBy: { id: 'user-1', name: 'Alice', email: 'alice@example.com' },
          _count: { variants: 3 },
        },
      ]);
      prisma.mediaAsset.count.mockResolvedValue(1);

      const res = await service.getMediaAssets('ws-1', { page: 1, limit: 10 });
      expect(res.total).toBe(1);
      expect(res.data.length).toBe(1);
      expect(res.data[0].usageCount).toBe(3);
      expect(res.data[0].accessUrl).toBeDefined();
    });
  });

  describe('getStorageUsage & quota enforcement', () => {
    it('returns accurate usage metrics and breakdown', async () => {
      prisma.workspace.findUnique.mockResolvedValue({
        id: 'ws-1',
        planTier: 'PRO',
        storageQuotaBytes: BigInt(10737418240), // 10GB
        maxMediaAssets: 1000,
      });

      prisma.mediaAsset.aggregate.mockResolvedValue({ _sum: { sizeBytes: 1073741824 } }); // 1GB
      prisma.mediaAsset.count
        .mockResolvedValueOnce(50) // total
        .mockResolvedValueOnce(40) // images
        .mockResolvedValueOnce(10); // videos

      const usage = await service.getStorageUsage('ws-1');

      expect(usage.workspaceId).toBe('ws-1');
      expect(usage.planTier).toBe('PRO');
      expect(usage.usedBytes).toBe(1073741824);
      expect(usage.quotaBytes).toBe(10737418240);
      expect(usage.usagePercentage).toBe(10);
      expect(usage.isQuotaExceeded).toBe(false);
      expect(usage.assetCounts.total).toBe(50);
      expect(usage.assetCounts.images).toBe(40);
      expect(usage.assetCounts.videos).toBe(10);
    });

    it('blocks upload session when storage quota is exceeded', async () => {
      prisma.workspace.findUnique.mockResolvedValue({
        id: 'ws-1',
        planTier: 'FREE',
        storageQuotaBytes: BigInt(1000000), // 1MB quota
        maxMediaAssets: 500,
      });

      prisma.mediaAsset.aggregate.mockResolvedValue({ _sum: { sizeBytes: 950000 } }); // 950KB used

      await expect(
        service.createUploadSession('ws-1', 'user-1', {
          filename: 'photo.jpg',
          mimeType: 'image/jpeg',
          sizeBytes: 100000, // 100KB exceeds 1MB limit
        }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('blocks upload session when max assets limit is reached', async () => {
      prisma.workspace.findUnique.mockResolvedValue({
        id: 'ws-1',
        planTier: 'FREE',
        storageQuotaBytes: BigInt(5368709120),
        maxMediaAssets: 5,
      });

      prisma.mediaAsset.count.mockResolvedValue(5); // 5 assets already exist

      await expect(
        service.createUploadSession('ws-1', 'user-1', {
          filename: 'photo.jpg',
          mimeType: 'image/jpeg',
          sizeBytes: 10000,
        }),
      ).rejects.toThrow(ForbiddenException);
    });
  });
});

