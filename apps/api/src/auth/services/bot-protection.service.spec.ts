import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { BotProtectionService } from './bot-protection.service';

describe('BotProtectionService', () => {
  let service: BotProtectionService;

  const mockConfigService = {
    get: jest.fn((key: string) => {
      if (key === 'jwt.accessSecret') return 'test-salt-secret-key-at-least-32-chars';
      if (key === 'nodeEnv') return 'development';
      return null;
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BotProtectionService,
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<BotProtectionService>(BotProtectionService);
  });

  it('should generate a valid cryptographic challenge with timestamp, nonce, and HMAC signature', () => {
    const challenge = service.createChallenge();

    expect(challenge).toHaveProperty('challengeId');
    expect(challenge).toHaveProperty('nonce');
    expect(challenge).toHaveProperty('timestamp');
    expect(challenge).toHaveProperty('signature');
    expect(typeof challenge.timestamp).toBe('number');
    expect(challenge.signature).toHaveLength(64); // SHA-256 hex string
  });

  it('should successfully verify a built-in cryptographic challenge token', async () => {
    // Temporarily unset NODE_ENV=test to exercise real crypto verification
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'development';

    try {
      const challenge = service.createChallenge();
      const token = `crypto:${challenge.timestamp}:${challenge.nonce}:${challenge.signature}`;

      const result = await service.verifyToken(token, '127.0.0.1');
      expect(result.valid).toBe(true);
    } finally {
      process.env.NODE_ENV = originalEnv;
    }
  });

  it('should reject a tampered challenge token signature', async () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'development';

    try {
      const challenge = service.createChallenge();
      const fakeToken = `crypto:${challenge.timestamp}:${challenge.nonce}:0000000000000000000000000000000000000000000000000000000000000000`;

      const result = await service.verifyToken(fakeToken, '127.0.0.1');
      expect(result.valid).toBe(false);
      expect(result.reason).toContain('signature');
    } finally {
      process.env.NODE_ENV = originalEnv;
    }
  });

  it('should reject an expired challenge token (> 5 minutes old)', async () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'development';

    try {
      const expiredTimestamp = Date.now() - 6 * 60 * 1000; // 6 minutes ago
      const token = `crypto:${expiredTimestamp}:fake-nonce:fake-sig`;

      const result = await service.verifyToken(token, '127.0.0.1');
      expect(result.valid).toBe(false);
      expect(result.reason).toContain('expired');
    } finally {
      process.env.NODE_ENV = originalEnv;
    }
  });

  it('should reject missing or empty tokens', async () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'development';

    try {
      const result = await service.verifyToken('', '127.0.0.1');
      expect(result.valid).toBe(false);
      expect(result.reason).toContain('Human verification is required');
    } finally {
      process.env.NODE_ENV = originalEnv;
    }
  });
});
