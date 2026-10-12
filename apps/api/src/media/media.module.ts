import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from '../prisma/prisma.module';
import { MediaController } from './media.controller';
import { MediaService } from './media.service';
import { StorageProviderFactory } from './providers/storage-provider.factory';
import { S3StorageProvider } from './providers/s3-storage.provider';
import { MockStorageProvider } from './providers/mock-storage.provider';

@Module({
  imports: [PrismaModule, ConfigModule],
  controllers: [MediaController],
  providers: [
    MediaService,
    StorageProviderFactory,
    S3StorageProvider,
    MockStorageProvider,
  ],
  exports: [MediaService, StorageProviderFactory],
})
export class MediaModule {}
