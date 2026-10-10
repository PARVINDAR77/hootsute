import {
  Injectable,
  ServiceUnavailableException,
  BadGatewayException,
  RequestTimeoutException,
} from '@nestjs/common';
import {
  TextGenerationProvider,
  TextGenerationRequest,
  TextGenerationResult,
} from './text-generation-provider.interface';

export type MockBehaviorMode = 'success' | 'malformed' | 'rate_limit' | 'timeout' | 'unconfigured' | 'empty';

@Injectable()
export class MockTextProvider implements TextGenerationProvider {
  readonly providerName = 'mock';
  public behaviorMode: MockBehaviorMode = 'success';
  public customHeadline?: string;
  public customBody?: string;
  public callCount = 0;
  public lastRequest?: TextGenerationRequest;

  async generateText(request: TextGenerationRequest): Promise<TextGenerationResult> {
    this.callCount++;
    this.lastRequest = request;

    if (this.behaviorMode === 'unconfigured') {
      throw new ServiceUnavailableException('AI text generation is currently unconfigured. Please configure a valid API key.');
    }

    if (this.behaviorMode === 'rate_limit') {
      throw new ServiceUnavailableException('AI provider rate limit exceeded. Please try again shortly.');
    }

    if (this.behaviorMode === 'timeout') {
      throw new RequestTimeoutException('AI provider request timed out. Please try again.');
    }

    if (this.behaviorMode === 'empty') {
      throw new BadGatewayException('AI provider returned an empty or malformed response');
    }

    if (this.behaviorMode === 'malformed') {
      return {
        rawText: 'This is plain text with no JSON structure or brackets whatsoever.',
        provider: this.providerName,
        model: 'mock-model-v1',
      };
    }

    // Default: Deterministic valid JSON
    const payload = {
      headline: this.customHeadline || 'Celebrate Heritage and Modern Elegance with Festive Styles',
      body: this.customBody || 'Discover vibrant handcrafted ensembles designed to elevate your celebrations. Thoughtfully woven with tradition and tailored for your modern lifestyle.',
      callToAction: 'Explore our latest festive arrivals today.',
      hashtags: ['#FestiveVibes', '#EthnicElegance', '#ModernTradition', '#CelebrateInStyle'],
      mediaBrief: 'Crisp bright studio shot of festive attire with warm ambient diya lighting and golden reflections.',
    };

    return {
      rawText: JSON.stringify(payload),
      provider: this.providerName,
      model: 'mock-model-v1',
      usage: {
        promptTokens: 120,
        completionTokens: 85,
        totalTokens: 205,
      },
    };
  }
}
