import { Test, TestingModule } from '@nestjs/testing';
import { WhatsAppActionTokenService } from './whatsapp-action-token.service';
import { ConfigService } from '@nestjs/config';
import { UnauthorizedException, BadRequestException } from '@nestjs/common';

describe('WhatsAppActionTokenService', () => {
  let service: WhatsAppActionTokenService;

  const mockConfigService = {
    get: jest.fn((key: string, defaultValue?: any) => {
      if (key === 'whatsapp.actionTokenSecret') return 'test-super-secret-action-token-key-32chars';
      return defaultValue;
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WhatsAppActionTokenService,
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<WhatsAppActionTokenService>(WhatsAppActionTokenService);
  });

  it('generates a valid, signed action token and verifies it successfully', () => {
    const wsId = 'ws-uuid-123';
    const draftId = 'draft-uuid-456';
    const recipientId = 'recipient-uuid-789';

    const token = service.generateToken(wsId, draftId, recipientId, 24);
    expect(typeof token).toBe('string');
    expect(token.includes('.')).toBe(true);

    const payload = service.verifyToken(token);
    expect(payload.workspaceId).toBe(wsId);
    expect(payload.draftId).toBe(draftId);
    expect(payload.recipientConsentId).toBe(recipientId);
    expect(payload.expiresAt).toBeGreaterThan(Date.now());
  });

  it('rejects tampered payload content', () => {
    const token = service.generateToken('ws-1', 'draft-1', 'rec-1', 24);
    const [payloadB64, sig] = token.split('.');

    // Tamper with payload b64
    const decoded = JSON.parse(Buffer.from(payloadB64, 'base64url').toString('utf8'));
    decoded.workspaceId = 'ws-hacked';
    const tamperedPayloadB64 = Buffer.from(JSON.stringify(decoded)).toString('base64url');
    const tamperedToken = `${tamperedPayloadB64}.${sig}`;

    expect(() => service.verifyToken(tamperedToken)).toThrow(UnauthorizedException);
  });

  it('rejects tampered signature', () => {
    const token = service.generateToken('ws-1', 'draft-1', 'rec-1', 24);
    const [payloadB64, sig] = token.split('.');
    const badSig = sig.replace(/^[a-zA-Z0-9]/, (c) => (c === 'a' ? 'b' : 'a'));
    const tamperedToken = `${payloadB64}.${badSig}`;

    expect(() => service.verifyToken(tamperedToken)).toThrow(UnauthorizedException);
  });

  it('rejects expired tokens', () => {
    // Generate token with negative validity (-1 hour)
    const token = service.generateToken('ws-1', 'draft-1', 'rec-1', -1);
    expect(() => service.verifyToken(token)).toThrow(UnauthorizedException);
  });

  it('rejects malformed token format without period', () => {
    expect(() => service.verifyToken('malformed-token')).toThrow(BadRequestException);
  });
});
