import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { BrandProfileModule } from '../brand-profile/brand-profile.module';
import { PromptSynthesisModule } from '../content-generation/prompt-synthesis/prompt-synthesis.module';
import { AiProviderModule } from '../content-generation/ai-provider/ai-provider.module';
import { ContentDraftsService } from './content-drafts.service';
import { ContentDraftsController } from './content-drafts.controller';

@Module({
  imports: [
    PrismaModule,
    BrandProfileModule,
    PromptSynthesisModule,
    AiProviderModule,
  ],
  controllers: [ContentDraftsController],
  providers: [ContentDraftsService],
  exports: [ContentDraftsService],
})
export class ContentDraftsModule {}
