import { Test, TestingModule } from '@nestjs/testing';
import { ContentGenerationService } from './content-generation.service';
import { PromptSynthesisService } from './prompt-synthesis/prompt-synthesis.service';
import { BrandProfileService } from '../brand-profile/brand-profile.service';
import { OccasionsService } from '../occasions/occasions.service';
import { ContentDraftsService } from '../content-drafts/content-drafts.service';
import { TEXT_GENERATION_PROVIDER } from './ai-provider/text-generation-provider.interface';
import { MockTextProvider } from './ai-provider/mock-text.provider';
import {
  CampaignObjective,
  SocialPlatform,
  DraftStatus,
} from '@prisma/client';
import { BrandTone } from '@packages/shared';
import {
  ServiceUnavailableException,
  BadGatewayException,
  RequestTimeoutException,
} from '@nestjs/common';

describe('ContentGenerationService', () => {
  let service: ContentGenerationService;
  let mockTextProvider: MockTextProvider;

  const mockBrandProfileService = {
    getBrandProfile: jest.fn().mockResolvedValue({
      businessName: 'Axion Apparel',
      industry: 'Fashion & Retail',
      businessDescription: 'Contemporary Indian ethnic wear',
      preferredLanguage: 'en',
    }),
  };

  const mockOccasionsService = {
    getOccasionBySlug: jest.fn().mockResolvedValue({
      name: 'Diwali',
      slug: 'diwali',
      description: 'Festival of lights',
      culturalContext: 'Auspicious celebratory season',
      typicalPeriod: 'October - November',
      promptGuidance: 'Warm, prosperous greetings',
      suggestedHashtags: ['#Diwali2026'],
    }),
  };

  const mockContentDraftsService = {
    createDraft: jest.fn().mockImplementation((workspaceId, userId, data) => {
      return Promise.resolve({
        id: 'draft-gen-1',
        workspaceId,
        createdByUserId: userId,
        title: data.title,
        status: DraftStatus.DRAFT,
        variants: data.variants.map((v: any, index: number) => ({
          id: `var-${index}`,
          ...v,
        })),
      });
    }),
  };

  beforeEach(async () => {
    mockTextProvider = new MockTextProvider();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ContentGenerationService,
        PromptSynthesisService,
        { provide: BrandProfileService, useValue: mockBrandProfileService },
        { provide: OccasionsService, useValue: mockOccasionsService },
        { provide: ContentDraftsService, useValue: mockContentDraftsService },
        { provide: TEXT_GENERATION_PROVIDER, useValue: mockTextProvider },
      ],
    }).compile();

    service = module.get<ContentGenerationService>(ContentGenerationService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('generateContent', () => {
    it('should coordinate prompt synthesis, mock AI provider, and draft persistence for multiple platforms', async () => {
      const result = await service.generateContent('ws-1', 'user-1', {
        objective: CampaignObjective.FESTIVAL_WISHES,
        platforms: [SocialPlatform.INSTAGRAM, SocialPlatform.FACEBOOK],
        occasionSlug: 'diwali',
        tone: BrandTone.FESTIVE_WARM,
      });

      expect(result).toBeDefined();
      expect(result.id).toBe('draft-gen-1');
      expect(result.variants).toHaveLength(2);
      expect(mockOccasionsService.getOccasionBySlug).toHaveBeenCalledWith('diwali');
      expect(mockBrandProfileService.getBrandProfile).toHaveBeenCalledWith('ws-1');
      expect(mockContentDraftsService.createDraft).toHaveBeenCalledWith(
        'ws-1',
        'user-1',
        expect.objectContaining({
          objective: CampaignObjective.FESTIVAL_WISHES,
          variants: expect.arrayContaining([
            expect.objectContaining({ platform: SocialPlatform.INSTAGRAM }),
            expect.objectContaining({ platform: SocialPlatform.FACEBOOK }),
          ]),
        }),
      );
    });

    it('should propagate ServiceUnavailableException if AI provider is unconfigured without saving fake posts', async () => {
      mockTextProvider.behaviorMode = 'unconfigured';

      await expect(
        service.generateContent('ws-1', 'user-1', {
          objective: CampaignObjective.ENGAGEMENT,
          platforms: [SocialPlatform.INSTAGRAM],
        }),
      ).rejects.toThrow(ServiceUnavailableException);

      expect(mockContentDraftsService.createDraft).not.toHaveBeenCalled();
    });

    it('should propagate ServiceUnavailableException on rate limit', async () => {
      mockTextProvider.behaviorMode = 'rate_limit';

      await expect(
        service.generateContent('ws-1', 'user-1', {
          objective: CampaignObjective.ENGAGEMENT,
          platforms: [SocialPlatform.INSTAGRAM],
        }),
      ).rejects.toThrow(ServiceUnavailableException);
    });

    it('should propagate RequestTimeoutException on provider timeout', async () => {
      mockTextProvider.behaviorMode = 'timeout';

      await expect(
        service.generateContent('ws-1', 'user-1', {
          objective: CampaignObjective.ENGAGEMENT,
          platforms: [SocialPlatform.INSTAGRAM],
        }),
      ).rejects.toThrow(RequestTimeoutException);
    });

    it('should throw BadGatewayException if AI provider returns malformed non-JSON', async () => {
      mockTextProvider.behaviorMode = 'malformed';

      await expect(
        service.generateContent('ws-1', 'user-1', {
          objective: CampaignObjective.ENGAGEMENT,
          platforms: [SocialPlatform.INSTAGRAM],
        }),
      ).rejects.toThrow(BadGatewayException);
    });
  });
});
