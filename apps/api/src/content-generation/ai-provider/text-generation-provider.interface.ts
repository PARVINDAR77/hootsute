export interface TextGenerationRequest {
  systemPrompt: string;
  userPrompt: string;
  temperature?: number;
  maxTokens?: number;
  timeoutMs?: number;
}

export interface TextGenerationUsage {
  promptTokens?: number;
  completionTokens?: number;
  totalTokens?: number;
  estimatedCostUsd?: number;
}

export interface TextGenerationResult {
  rawText: string;
  parsedContent?: any;
  provider: string;
  model: string;
  usage?: TextGenerationUsage;
}

export interface TextGenerationProvider {
  readonly providerName: string;
  generateText(request: TextGenerationRequest): Promise<TextGenerationResult>;
}

export const TEXT_GENERATION_PROVIDER = Symbol('TEXT_GENERATION_PROVIDER');
