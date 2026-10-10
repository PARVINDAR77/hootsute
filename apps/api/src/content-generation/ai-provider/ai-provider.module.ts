import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TEXT_GENERATION_PROVIDER } from './text-generation-provider.interface';
import { IMAGE_GENERATION_PROVIDER } from './image-generation-provider.interface';
import { createTextGenerationProvider } from './ai-provider.factory';
import { MockImageProvider } from './mock-image.provider';

@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: TEXT_GENERATION_PROVIDER,
      useFactory: (configService: ConfigService) => createTextGenerationProvider(configService),
      inject: [ConfigService],
    },
    {
      provide: IMAGE_GENERATION_PROVIDER,
      useClass: MockImageProvider,
    },
  ],
  exports: [TEXT_GENERATION_PROVIDER, IMAGE_GENERATION_PROVIDER],
})
export class AiProviderModule {}
