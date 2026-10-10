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

const SUPPORTED_OPENAI_MODELS = [
  'gpt-4o',
  'gpt-4o-mini',
  'gpt-4-turbo',
  'gpt-3.5-turbo',
];

@Injectable()
export class OpenAITextProvider implements TextGenerationProvider {
  readonly providerName = 'openai';
  private readonly logger = new Logger(OpenAITextProvider.name);

  constructor(
    private readonly apiKey: string,
    private readonly model: string = 'gpt-4o-mini',
    private readonly defaultTimeoutMs: number = 30000,
    private readonly maxRetries: number = 2,
  ) {}

  async generateText(request: TextGenerationRequest): Promise<TextGenerationResult> {
    if (!this.apiKey || this.apiKey.trim().length === 0) {
      throw new ServiceUnavailableException(
        'OpenAI text generation is currently unconfigured. Please configure a valid OPENAI_API_KEY in server environment variables.',
      );
    }

    const selectedModel = SUPPORTED_OPENAI_MODELS.includes(this.model)
      ? this.model
      : 'gpt-4o-mini';

    const url = 'https://api.openai.com/v1/chat/completions';
    const timeoutMs = request.timeoutMs || this.defaultTimeoutMs;

    const payload = {
      model: selectedModel,
      messages: [
        { role: 'system', content: request.systemPrompt },
        { role: 'user', content: request.userPrompt },
      ],
      temperature: request.temperature ?? 0.7,
      max_tokens: request.maxTokens ?? 2048,
      response_format: { type: 'json_object' },
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
            Authorization: `Bearer ${this.apiKey}`,
          },
          body: JSON.stringify(payload),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          const status = response.status;
          const errorBody = await response.text().catch(() => '');

          if (status === 429) {
            this.logger.warn(`OpenAI rate limit (429) on attempt ${attempt}.`);
            if (attempt <= this.maxRetries) {
              await this.sleep(1000 * Math.pow(2, attempt));
              continue;
            }
            throw new ServiceUnavailableException('AI provider rate limit exceeded. Please try again shortly.');
          }

          if (status >= 500 && attempt <= this.maxRetries) {
            this.logger.warn(`OpenAI transient 5xx error (${status}) on attempt ${attempt}. Retrying...`);
            await this.sleep(1000 * attempt);
            continue;
          }

          this.logger.error(`OpenAI API returned error HTTP ${status}: ${errorBody.slice(0, 200)}`);
          throw new BadGatewayException(`AI provider returned an unexpected error (${status})`);
        }

        const data = await response.json();
        const rawText = data.choices?.[0]?.message?.content;

        if (!rawText) {
          throw new BadGatewayException('AI provider returned an empty or malformed response');
        }

        const usage = data.usage;
        return {
          rawText,
          provider: this.providerName,
          model: selectedModel,
          usage: usage
            ? {
                promptTokens: usage.prompt_tokens,
                completionTokens: usage.completion_tokens,
                totalTokens: usage.total_tokens,
              }
            : undefined,
        };
      } catch (err: any) {
        clearTimeout(timeoutId);

        if (err.name === 'AbortError') {
          this.logger.warn(`OpenAI request timed out after ${timeoutMs}ms (attempt ${attempt})`);
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

    this.logger.error(`OpenAI provider failed after ${attempt} attempts: ${lastError?.message}`);
    throw new BadGatewayException('Unable to reach AI provider after retry attempts');
  }

  private sleep(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
