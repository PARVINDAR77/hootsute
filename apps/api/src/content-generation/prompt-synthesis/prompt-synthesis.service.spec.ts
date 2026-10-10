import { Test, TestingModule } from '@nestjs/testing';
import { PromptSynthesisService } from './prompt-synthesis.service';
import {
  CampaignObjective,
  SocialPlatform,
} from '@prisma/client';
import { BrandTone } from '@packages/shared';
import { BadGatewayException } from '@nestjs/common';

describe('PromptSynthesisService', () => {
  let service: PromptSynthesisService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PromptSynthesisService],
    }).compile();

    service = module.get<PromptSynthesisService>(PromptSynthesisService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('synthesizeGenerationPrompt', () => {
    it('should incorporate workspace brand profile and campaign parameters into prompt', () => {
      const result = service.synthesizeGenerationPrompt({
        brandProfile: {
          businessName: 'Gujarat Textiles Ltd',
          industry: 'Handloom & Fashion',
          businessDescription: 'Authentic Patola and Bandhani artisans',
          brandVoice: 'Culturally rooted and proud',
          targetAudience: 'Ethnic fashion enthusiasts',
        },
        objective: CampaignObjective.FESTIVAL_WISHES,
        platform: SocialPlatform.INSTAGRAM,
        language: 'en',
        tone: BrandTone.FESTIVE_WARM,
        occasion: {
          name: 'Navratri',
          description: 'Nine nights of Garba',
          culturalContext: 'Fervent dance circles and devotion in Gujarat',
          typicalPeriod: 'September - October',
          promptGuidance: 'Highlight Garba beats and vibrant chaniya choli colors',
          suggestedHashtags: ['#Navratri2026', '#GarbaVibes'],
        },
        userInstructions: 'Emphasize royal blue and yellow collection',
      });

      expect(result.systemPrompt).toContain('CRITICAL FACTUAL AND SAFETY RULES');
      expect(result.systemPrompt).toContain('NEVER invent exact prices');
      expect(result.userPrompt).toContain('Gujarat Textiles Ltd');
      expect(result.userPrompt).toContain('FESTIVAL_WISHES');
      expect(result.userPrompt).toContain('INSTAGRAM');
      expect(result.userPrompt).toContain('Navratri');
      expect(result.userPrompt).toContain('royal blue and yellow collection');
    });
  });

  describe('parseAndValidateOutput', () => {
    it('should parse valid plain JSON', () => {
      const raw = JSON.stringify({
        headline: 'Celebrate in Style',
        body: 'Embrace traditional elegance this festive season.',
        callToAction: 'Shop the collection now',
        hashtags: ['Festive', '#Tradition'],
        mediaBrief: 'Close up of intricate embroidery',
      });

      const parsed = service.parseAndValidateOutput(raw);
      expect(parsed.headline).toBe('Celebrate in Style');
      expect(parsed.body).toBe('Embrace traditional elegance this festive season.');
      expect(parsed.callToAction).toBe('Shop the collection now');
      expect(parsed.hashtags).toEqual(['#Festive', '#Tradition']);
      expect(parsed.mediaBrief).toBe('Close up of intricate embroidery');
    });

    it('should parse JSON wrapped in markdown code blocks', () => {
      const raw = '```json\n{"headline":"Hi","body":"Welcome to our store","hashtags":["#Welcome"]}\n```';
      const parsed = service.parseAndValidateOutput(raw);
      expect(parsed.headline).toBe('Hi');
      expect(parsed.body).toBe('Welcome to our store');
      expect(parsed.hashtags).toEqual(['#Welcome']);
    });

    it('should reject malformed non-JSON output', () => {
      expect(() => {
        service.parseAndValidateOutput('Sorry, I cannot help with that as an AI.');
      }).toThrow(BadGatewayException);
    });

    it('should reject output missing body text', () => {
      expect(() => {
        service.parseAndValidateOutput(JSON.stringify({ headline: 'Just a headline' }));
      }).toThrow(BadGatewayException);
    });

    it('should sanitize hashtags and prefix them with #', () => {
      const raw = JSON.stringify({
        body: 'Post content here',
        hashtags: ['diwali', '#festival', ' light '],
      });
      const parsed = service.parseAndValidateOutput(raw);
      expect(parsed.hashtags).toEqual(['#diwali', '#festival', '#light']);
    });
  });
});
