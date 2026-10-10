import { Module } from '@nestjs/common';
import { PromptSynthesisModule } from './prompt-synthesis/prompt-synthesis.module';
import { BrandProfileModule } from '../brand-profile/brand-profile.module';
import { OccasionsModule } from '../occasions/occasions.module';
import { ContentDraftsModule } from '../content-drafts/content-drafts.module';
import { AiProviderModule } from './ai-provider/ai-provider.module';
import { ContentGenerationService } from './content-generation.service';
import { ContentGenerationController } from './content-generation.controller';

@Module({
  imports: [
    PromptSynthesisModule,
    BrandProfileModule,
    OccasionsModule,
    ContentDraftsModule,
    AiProviderModule,
  ],
  controllers: [ContentGenerationController],
  providers: [ContentGenerationService],
  exports: [ContentGenerationService],
})
export class ContentGenerationModule {}
