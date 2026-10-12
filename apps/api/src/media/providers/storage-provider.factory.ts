import { Injectable, Logger, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { StorageProvider } from './storage-provider.interface';
import { S3StorageProvider } from './s3-storage.provider';
import { MockStorageProvider } from './mock-storage.provider';

@Injectable()
export class StorageProviderFactory {
  private readonly logger = new Logger(StorageProviderFactory.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly s3Provider: S3StorageProvider,
    private readonly mockProvider: MockStorageProvider,
  ) {}

  getProvider(): StorageProvider {
    const nodeEnv = (this.configService.get<string>('nodeEnv') || this.configService.get<string>('NODE_ENV') || 'development').toLowerCase();
    const providerSetting = (this.configService.get<string>('MEDIA_STORAGE_PROVIDER') || 's3').toLowerCase();
    const isProduction = nodeEnv === 'production';

    if (isProduction) {
      if (providerSetting === 'local_mock' || providerSetting === 'mock') {
        this.logger.error('CRITICAL: Attempted to use mock storage in production environment!');
        throw new InternalServerErrorException('Invalid storage provider configuration in production');
      }
      return this.s3Provider;
    }

    if (providerSetting === 'local_mock' || providerSetting === 'mock' || nodeEnv === 'test') {
      return this.mockProvider;
    }

    // Default to S3 provider if configured
    const s3Bucket = this.configService.get<string>('AWS_S3_BUCKET');
    if (!s3Bucket) {
      this.logger.warn('AWS_S3_BUCKET is not set; falling back to mock storage provider in non-production mode');
      return this.mockProvider;
    }

    return this.s3Provider;
  }
}
