import { Injectable, Inject, Logger } from '@nestjs/common';
import { PromptSynthesisService } from './prompt-synthesis/prompt-synthesis.service';
import {
  TEXT_GENERATION_PROVIDER,
  TextGenerationProvider,
} from './ai-provider/text-generation-provider.interface';
import { BrandProfileService } from '../brand-profile/brand-profile.service';
import { OccasionsService } from '../occasions/occasions.service';
import { ContentDraftsService } from '../content-drafts/content-drafts.service';
import { GenerateContentDto } from './dto/generate-content.dto';
import { CreateVariantDto } from '../content-drafts/dto/create-draft.dto';
import { BrandTone } from '@packages/shared';

@Injectable()
export class ContentGenerationService {
  private readonly logger = new Logger(ContentGenerationService.name);

  constructor(
    private readonly promptSynthesis: PromptSynthesisService,
    private readonly brandProfileService: BrandProfileService,
    private readonly occasionsService: OccasionsService,
    private readonly contentDraftsService: ContentDraftsService,
    @Inject(TEXT_GENERATION_PROVIDER)
    private readonly textProvider: TextGenerationProvider,
  ) {}

  async generateContent(
    workspaceId: string,
    userId: string,
    dto: GenerateContentDto,
  ) {
    // 1. Fetch workspace brand profile
    const brandProfile = await this.brandProfileService.getBrandProfile(workspaceId);

    // 2. Fetch occasion if requested
    let occasionDetails: any = null;
    if (dto.occasionSlug) {
      const occasion = await this.occasionsService.getOccasionBySlug(dto.occasionSlug);
      occasionDetails = {
        name: occasion.name,
        description: occasion.description,
        culturalContext: occasion.culturalContext,
        typicalPeriod: occasion.typicalPeriod,
        promptGuidance: occasion.promptGuidance,
        suggestedHashtags: occasion.suggestedHashtags,
      };
    }

    const language = dto.language || brandProfile.preferredLanguage || 'en';
    const tone = dto.tone || BrandTone.PROFESSIONAL;

    // 3. Generate platform-specific variants in parallel
    const variantPromises = dto.platforms.map(async (platform): Promise<CreateVariantDto> => {
      const promptObj = this.promptSynthesis.synthesizeGenerationPrompt({
        brandProfile,
        objective: dto.objective,
        platform,
        language,
        tone,
        targetAudienceOverride: dto.targetAudience,
        occasion: occasionDetails,
        userInstructions: dto.userInstructions,
        callToActionPreference: dto.callToActionPreference,
      });

      const aiResult = await this.textProvider.generateText({
        systemPrompt: promptObj.systemPrompt,
        userPrompt: promptObj.userPrompt,
      });

      const parsed = this.promptSynthesis.parseAndValidateOutput(aiResult.rawText);

      return {
        platform,
        headline: parsed.headline || null,
        body: parsed.body,
        callToAction: parsed.callToAction || null,
        hashtags: parsed.hashtags,
        mediaBrief: parsed.mediaBrief || null,
      };
    });

    const generatedVariants = await Promise.all(variantPromises);

    // 4. Default title if not provided
    const draftTitle =
      dto.title?.trim() ||
      `${dto.objective} - ${occasionDetails ? occasionDetails.name : brandProfile.businessName} (${new Date().toISOString().split('T')[0]})`;

    // 5. Persist as ContentDraft with variants and revision
    const draft = await this.contentDraftsService.createDraft(workspaceId, userId, {
      title: draftTitle,
      objective: dto.objective,
      language,
      variants: generatedVariants,
    });

    return draft;
  }
}
