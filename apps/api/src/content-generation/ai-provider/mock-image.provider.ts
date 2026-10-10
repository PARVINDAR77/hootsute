import { Injectable } from '@nestjs/common';
import {
  ImageGenerationProvider,
  CreativeBriefRequest,
  CreativeBriefResult,
} from './image-generation-provider.interface';

@Injectable()
export class MockImageProvider implements ImageGenerationProvider {
  readonly providerName = 'mock-image';

  async generateCreativeBrief(request: CreativeBriefRequest): Promise<CreativeBriefResult> {
    const primary = request.brandColors?.primary || '#2E5BFF';
    const secondary = request.brandColors?.secondary || '#FF6B6B';

    return {
      headline: `Visual Direction for ${request.brandName}`,
      visualComposition: `High-impact hero visual optimized for ${request.platform}. Focused central subject with clean typography alignment.`,
      recommendedImagery: `Authentic, culturally resonant photographic style reflecting ${request.occasionName || 'brand lifestyle'}. Clean depth of field.`,
      colorPaletteSuggestions: [primary, secondary, '#FFFFFF', '#1A1A1A'],
      aspectRatio: request.platform === 'INSTAGRAM' ? '1:1' : request.platform === 'LINKEDIN' ? '1.91:1' : '16:9',
      textOverlayRecommendations: 'Keep headline in top third. High contrast text against background, minimum 15% clear margin.',
      rawBrief: `Creative Brief for ${request.brandName}: Professional aesthetic aligned with ${request.platform} best practices.`,
    };
  }
}
