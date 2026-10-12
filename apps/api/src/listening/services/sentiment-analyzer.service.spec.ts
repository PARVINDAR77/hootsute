import { Test, TestingModule } from '@nestjs/testing';
import { SentimentAnalyzerService } from './sentiment-analyzer.service';
import { ListeningSentiment } from '@packages/shared';

describe('SentimentAnalyzerService', () => {
  let service: SentimentAnalyzerService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SentimentAnalyzerService],
    }).compile();

    service = module.get<SentimentAnalyzerService>(SentimentAnalyzerService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should classify highly enthusiastic praise as POSITIVE with positive score', () => {
    const text = 'OmniSocial is absolutely amazing, great support and love the intuitive interface!';
    const result = service.analyze(text);

    expect(result.sentiment).toBe(ListeningSentiment.POSITIVE);
    expect(result.sentimentScore).toBeGreaterThan(0.2);
    expect(result.isCrisisAlert).toBe(false);
  });

  it('should classify frustration and bugs as NEGATIVE with negative score', () => {
    const text = 'Terrible experience today. The publisher is broken, buggy, and completely failed.';
    const result = service.analyze(text);

    expect(result.sentiment).toBe(ListeningSentiment.NEGATIVE);
    expect(result.sentimentScore).toBeLessThan(-0.2);
    expect(result.isCrisisAlert).toBe(false);
  });

  it('should flag crisis keywords and alert even if mixed words are used', () => {
    const text = 'Hearing rumors of an investigation and data breach regarding user tokens.';
    const result = service.analyze(text);

    expect(result.sentiment).toBe(ListeningSentiment.NEGATIVE);
    expect(result.isCrisisAlert).toBe(true);
    expect(result.detectedKeywords).toContain('data breach');
  });

  it('should handle negations correctly (e.g., "not good")', () => {
    const text = 'The new update is not good, does not work smoothly.';
    const result = service.analyze(text);

    expect(result.sentiment).toBe(ListeningSentiment.NEGATIVE);
    expect(result.sentimentScore).toBeLessThan(0);
  });

  it('should return NEUTRAL for neutral factual statements', () => {
    const text = 'The quarterly earnings report will be posted tomorrow morning at 9am.';
    const result = service.analyze(text);

    expect(result.sentiment).toBe(ListeningSentiment.NEUTRAL);
    expect(result.sentimentScore).toBe(0.0);
    expect(result.isCrisisAlert).toBe(false);
  });
});
