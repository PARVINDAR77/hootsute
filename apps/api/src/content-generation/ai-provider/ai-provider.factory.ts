import { ConfigService } from '@nestjs/config';
import { GeminiTextProvider } from './gemini-text.provider';
import { OpenAITextProvider } from './openai-text.provider';
import { MockTextProvider } from './mock-text.provider';
import { TextGenerationProvider } from './text-generation-provider.interface';

export function createTextGenerationProvider(configService: ConfigService): TextGenerationProvider {
  const provider = (
    configService.get<string>('ai.textProvider') ||
    (process.env.NODE_ENV === 'test' ? 'mock' : 'gemini')
  ).toLowerCase();
  const timeoutMs = configService.get<number>('ai.timeoutMs') || 30000;
  const maxRetries = configService.get<number>('ai.maxRetries') || 2;

  const isProduction = process.env.NODE_ENV === 'production';

  if (isProduction && provider === 'mock') {
    throw new Error(
      '[Security Policy] Mock AI text generation provider is strictly forbidden in production environments. Configure a valid GEMINI_API_KEY or OPENAI_API_KEY.',
    );
  }

  if (provider === 'mock' || (process.env.NODE_ENV === 'test' && provider !== 'gemini' && provider !== 'openai')) {
    return new MockTextProvider();
  }

  if (provider === 'openai') {
    const apiKey = configService.get<string>('ai.openaiApiKey') || '';
    const model = configService.get<string>('ai.openaiModel') || 'gpt-4o-mini';
    return new OpenAITextProvider(apiKey, model, timeoutMs, maxRetries);
  }

  // Default: Gemini
  const apiKey = configService.get<string>('ai.geminiApiKey') || '';
  const model = configService.get<string>('ai.textModel') || 'gemini-1.5-flash';
  return new GeminiTextProvider(apiKey, model, timeoutMs, maxRetries);
}
