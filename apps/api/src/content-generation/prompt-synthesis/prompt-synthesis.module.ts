import { Module } from '@nestjs/common';
import { PromptSynthesisService } from './prompt-synthesis.service';

@Module({
  providers: [PromptSynthesisService],
  exports: [PromptSynthesisService],
})
export class PromptSynthesisModule {}
