export interface CreativeBriefRequest {
  brandName: string;
  brandColors?: {
    primary?: string | null;
    secondary?: string | null;
  };
  platform: string;
  postContent: string;
  occasionName?: string;
  visualPreferences?: string;
}

export interface CreativeBriefResult {
  headline: string;
  visualComposition: string;
  recommendedImagery: string;
  colorPaletteSuggestions: string[];
  aspectRatio: string;
  textOverlayRecommendations: string;
  rawBrief: string;
}

export interface ImageGenerationProvider {
  readonly providerName: string;
  generateCreativeBrief(request: CreativeBriefRequest): Promise<CreativeBriefResult>;
}

export const IMAGE_GENERATION_PROVIDER = Symbol('IMAGE_GENERATION_PROVIDER');
