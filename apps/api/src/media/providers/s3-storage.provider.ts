import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommandOutput,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import {
  StorageProvider,
  UploadSignedUrlParams,
  UploadSignedUrlResult,
  DownloadSignedUrlParams,
  ObjectMetadata,
  PutObjectResult,
} from './storage-provider.interface';

@Injectable()
export class S3StorageProvider implements StorageProvider {
  readonly providerName = 's3';
  private readonly logger = new Logger(S3StorageProvider.name);
  private readonly s3Client: S3Client;
  private readonly bucketName: string;

  constructor(private readonly configService: ConfigService) {
    const region = this.configService.get<string>('AWS_REGION') || 'us-east-1';
    this.bucketName = this.configService.get<string>('AWS_S3_BUCKET') || '';

    const accessKeyId = this.configService.get<string>('AWS_ACCESS_KEY_ID');
    const secretAccessKey = this.configService.get<string>('AWS_SECRET_ACCESS_KEY');
    const endpoint = this.configService.get<string>('AWS_ENDPOINT');

    const clientConfig: any = { region };

    if (accessKeyId && secretAccessKey) {
      clientConfig.credentials = {
        accessKeyId,
        secretAccessKey,
      };
    }

    if (endpoint) {
      clientConfig.endpoint = endpoint;
      clientConfig.forcePathStyle = true; // Required for MinIO / LocalStack
    }

    this.s3Client = new S3Client(clientConfig);
  }

  async getUploadSignedUrl(params: UploadSignedUrlParams): Promise<UploadSignedUrlResult> {
    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: params.storageKey,
      ContentType: params.mimeType,
    });

    const uploadUrl = await getSignedUrl(this.s3Client, command, {
      expiresIn: params.expiresInSeconds,
    });

    return {
      uploadUrl,
      method: 'PUT',
      headers: {
        'Content-Type': params.mimeType,
      },
      expiresInSeconds: params.expiresInSeconds,
    };
  }

  async getDownloadSignedUrl(params: DownloadSignedUrlParams): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: this.bucketName,
      Key: params.storageKey,
      ResponseContentDisposition: params.downloadFilename
        ? `attachment; filename="${encodeURIComponent(params.downloadFilename)}"`
        : undefined,
    });

    return getSignedUrl(this.s3Client, command, {
      expiresIn: params.expiresInSeconds,
    });
  }

  async objectExists(storageKey: string): Promise<boolean> {
    try {
      await this.s3Client.send(
        new HeadObjectCommand({
          Bucket: this.bucketName,
          Key: storageKey,
        }),
      );
      return true;
    } catch (error: any) {
      if (error?.name === 'NotFound' || error?.$metadata?.httpStatusCode === 404) {
        return false;
      }
      this.logger.error(`Failed to check object existence for key [${storageKey}]: ${error.message}`);
      throw error;
    }
  }

  async getObjectMetadata(storageKey: string): Promise<ObjectMetadata | null> {
    try {
      const response: HeadObjectCommandOutput = await this.s3Client.send(
        new HeadObjectCommand({
          Bucket: this.bucketName,
          Key: storageKey,
        }),
      );

      return {
        sizeBytes: response.ContentLength || 0,
        contentType: response.ContentType || 'application/octet-stream',
        etag: response.ETag?.replace(/"/g, ''),
        lastModified: response.LastModified,
      };
    } catch (error: any) {
      if (error?.name === 'NotFound' || error?.$metadata?.httpStatusCode === 404) {
        return null;
      }
      this.logger.error(`Failed to fetch metadata for object [${storageKey}]: ${error.message}`);
      throw error;
    }
  }

  async getObjectBuffer(storageKey: string, maxBytes = 4096): Promise<Buffer | null> {
    try {
      const command = new GetObjectCommand({
        Bucket: this.bucketName,
        Key: storageKey,
        Range: `bytes=0-${maxBytes - 1}`,
      });

      const response = await this.s3Client.send(command);
      if (!response.Body) {
        return null;
      }

      const chunks: Uint8Array[] = [];
      for await (const chunk of response.Body as any) {
        chunks.push(chunk);
      }

      return Buffer.concat(chunks);
    } catch (error: any) {
      if (error?.name === 'NoSuchKey' || error?.$metadata?.httpStatusCode === 404) {
        return null;
      }
      this.logger.error(`Failed to get object buffer for [${storageKey}]: ${error.message}`);
      throw error;
    }
  }

  async putObject(storageKey: string, buffer: Buffer, mimeType: string): Promise<PutObjectResult> {
    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: storageKey,
      Body: buffer,
      ContentType: mimeType,
    });

    const response = await this.s3Client.send(command);
    return {
      sizeBytes: buffer.length,
      etag: response.ETag?.replace(/"/g, ''),
    };
  }

  async deleteObject(storageKey: string): Promise<void> {
    try {
      await this.s3Client.send(
        new DeleteObjectCommand({
          Bucket: this.bucketName,
          Key: storageKey,
        }),
      );
    } catch (error: any) {
      this.logger.error(`Failed to delete object [${storageKey}]: ${error.message}`);
      throw error;
    }
  }
}
