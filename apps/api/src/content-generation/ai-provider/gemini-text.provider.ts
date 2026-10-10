import {
  Injectable,
  Logger,
  ServiceUnavailableException,
  BadGatewayException,
  RequestTimeoutException,
} from '@nestjs/common';
import {
  TextGenerationProvider,
  TextGenerationRequest,
  TextGenerationResult,
} from './text-generation-provider.interface';

const SUPPORTED_GEMINI_MODELS = [
  'gemini-1.5-flash',
  'gemini-1.5-pro',
  'gemini-2.0-flash',
  'gemini-1.0-pro',
];

@Injectable()
export class GeminiTextProvider implements TextGenerationProvider {
  readonly providerName = 'gemini';
  private readonly logger = new Logger(GeminiTextProvider.name);

  constructor(
    private readonly apiKey: string,
    private readonly model: string = 'gemini-1.5-flash',
    private readonly defaultTimeoutMs: number = 30000,
    private readonly maxRetries: number = 2,
  ) {}

  async generateText(request: TextGenerationRequest): Promise<TextGenerationResult> {
    if (!this.apiKey || this.apiKey.trim().length === 0) {
      throw new ServiceUnavailableException(
        'Gemini text generation is currently unconfigured. Please configure a valid GEMINI_API_KEY in server environment variables.',
      );
    }

    const selectedModel = SUPPORTED_GEMINI_MODELS.includes(this.model)
      ? this.model
      : 'gemini-1.5-flash';

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${selectedModel}:generateContent?key=${encodeURIComponent(this.apiKey)}`;
    const timeoutMs = request.timeoutMs || this.defaultTimeoutMs;

    const payload = {
      contents: [
        {
          role: 'user',
          parts: [{ text: request.userPrompt }],
        },
      ],
      systemInstruction: {
        parts: [{ text: request.systemPrompt }],
      },
      generationConfig: {
        temperature: request.temperature ?? 0.7,
        maxOutputTokens: request.maxTokens ?? 2048,
        responseMimeType: 'application/json',
      },
    };

    let attempt = 0;
    let lastError: Error | null = null;

    while (attempt <= this.maxRetries) {
      attempt++;
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

      try {
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          const status = response.status;
          const errorBody = await response.text().catch(() => '');

          if (status === 429) {
            this.logger.warn(`Gemini rate limit (429) on attempt ${attempt}.`);
            if (attempt <= this.maxRetries) {
              await this.sleep(1000 * Math.pow(2, attempt));
              continue;
            }
            throw new ServiceUnavailableException('AI provider rate limit exceeded. Please try again shortly.');
          }

          if (status >= 500 && attempt <= this.maxRetries) {
            this.logger.warn(`Gemini transient 5xx error (${status}) on attempt ${attempt}. Retrying...`);
            await this.sleep(1000 * attempt);
            continue;
          }

          this.logger.error(`Gemini API returned error HTTP ${status}: ${errorBody.slice(0, 200)}`);
          throw new BadGatewayException(`AI provider returned an unexpected error (${status})`);
        }

        const data = await response.json();
        const candidate = data.candidates?.[0];
        const rawText = candidate?.content?.parts?.[0]?.text;

        if (!rawText) {
          throw new BadGatewayException('AI provider returned an empty or malformed response');
        }

        const usageMetadata = data.usageMetadata;
        return {
          rawText,
          provider: this.providerName,
          model: selectedModel,
          usage: usageMetadata
            ? {
                promptTokens: usageMetadata.promptTokenCount,
                completionTokens: usageMetadata.candidatesTokenCount,
                totalTokens: usageMetadata.totalTokenCount,
              }
            : undefined,
        };
      } catch (err: any) {
        clearTimeout(timeoutId);

        if (err.name === 'AbortError') {
          this.logger.warn(`Gemini request timed out after ${timeoutMs}ms (attempt ${attempt})`);
          if (attempt <= this.maxRetries) {
            continue;
          }
          throw new RequestTimeoutException('AI provider request timed out. Please try again.');
        }

        if (err instanceof ServiceUnavailableException || err instanceof BadGatewayException || err instanceof RequestTimeoutException) {
          throw err;
        }

        lastError = err;
        if (attempt <= this.maxRetries) {
          await this.sleep(1000 * attempt);
          continue;
        }
      }
    }

    this.logger.error(`Gemini provider failed after ${attempt} attempts: ${lastError?.message}`);
    throw new BadGatewayException('Unable to reach AI provider after retry attempts');
  }

  private sleep(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
