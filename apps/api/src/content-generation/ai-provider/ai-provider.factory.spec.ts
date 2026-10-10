import { ConfigService } from '@nestjs/config';
import { createTextGenerationProvider } from './ai-provider.factory';
import { MockTextProvider } from './mock-text.provider';
import { GeminiTextProvider } from './gemini-text.provider';
import { OpenAITextProvider } from './openai-text.provider';

describe('createTextGenerationProvider (Security & Configuration Audit)', () => {
  const originalEnv = process.env.NODE_ENV;

  afterEach(() => {
    process.env.NODE_ENV = originalEnv;
  });

  it('should STRICTLY FORBID mock provider in production environment', () => {
    process.env.NODE_ENV = 'production';
    const configService = {
      get: jest.fn((key: string) => {
        if (key === 'ai.textProvider') return 'mock';
        return undefined;
      }),
    } as unknown as ConfigService;

    expect(() => createTextGenerationProvider(configService)).toThrow(
      '[Security Policy] Mock AI text generation provider is strictly forbidden in production environments',
    );
  });

  it('should create MockTextProvider in test environment by default', () => {
    process.env.NODE_ENV = 'test';
    const configService = {
      get: jest.fn(() => undefined),
    } as unknown as ConfigService;

    const provider = createTextGenerationProvider(configService);
    expect(provider).toBeInstanceOf(MockTextProvider);
    expect(provider.providerName).toBe('mock');
  });

  it('should create OpenAITextProvider when configured with openai', () => {
    process.env.NODE_ENV = 'development';
    const configService = {
      get: jest.fn((key: string) => {
        if (key === 'ai.textProvider') return 'openai';
        if (key === 'ai.openaiApiKey') return 'sk-test-key';
        if (key === 'ai.openaiModel') return 'gpt-4o-mini';
        return undefined;
      }),
    } as unknown as ConfigService;

    const provider = createTextGenerationProvider(configService);
    expect(provider).toBeInstanceOf(OpenAITextProvider);
    expect(provider.providerName).toBe('openai');
  });

  it('should create GeminiTextProvider when configured with gemini', () => {
    process.env.NODE_ENV = 'development';
    const configService = {
      get: jest.fn((key: string) => {
        if (key === 'ai.textProvider') return 'gemini';
        if (key === 'ai.geminiApiKey') return 'AIzaSy-test';
        if (key === 'ai.textModel') return 'gemini-1.5-flash';
        return undefined;
      }),
    } as unknown as ConfigService;

    const provider = createTextGenerationProvider(configService);
    expect(provider).toBeInstanceOf(GeminiTextProvider);
    expect(provider.providerName).toBe('gemini');
  });
});
