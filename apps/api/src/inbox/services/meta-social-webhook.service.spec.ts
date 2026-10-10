import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { MetaSocialWebhookService } from './meta-social-webhook.service';
import { PrismaService } from '../../prisma/prisma.service';
import { UnauthorizedException, ForbiddenException } from '@nestjs/common';
import * as crypto from 'crypto';

describe('MetaSocialWebhookService', () => {
  let service: MetaSocialWebhookService;
  let prisma: any;

  const appSecret = 'test-meta-app-secret-12345';
  const verifyToken = 'test-verify-token';

  beforeEach(async () => {
    prisma = {
      socialWebhookEvent: {
        findUnique: jest.fn(),
        create: jest.fn().mockResolvedValue({}),
      },
      socialAccount: {
        findFirst: jest.fn(),
      },
      socialInteraction: {
        upsert: jest.fn().mockResolvedValue({}),
      },
    };

    const mockConfigService = {
      get: jest.fn().mockImplementation((key: string) => {
        if (key === 'META_APP_SECRET') return appSecret;
        if (key === 'META_WEBHOOK_VERIFY_TOKEN') return verifyToken;
        return null;
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MetaSocialWebhookService,
        { provide: ConfigService, useValue: mockConfigService },
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<MetaSocialWebhookService>(MetaSocialWebhookService);
  });

  describe('verifyChallenge', () => {
    it('returns challenge when mode is subscribe and token matches', () => {
      const result = service.verifyChallenge('subscribe', verifyToken, 'challenge_12345');
      expect(result).toBe('challenge_12345');
    });

    it('throws ForbiddenException when token mismatches', () => {
      expect(() =>
        service.verifyChallenge('subscribe', 'wrong-token', 'challenge_12345'),
      ).toThrow(ForbiddenException);
    });
  });

  describe('verifySignature', () => {
    it('passes verification when HMAC-SHA256 signature is valid', () => {
      const rawBody = Buffer.from('{"test":"payload"}');
      const signature = crypto.createHmac('sha256', appSecret).update(rawBody).digest('hex');

      const isValid = service.verifySignature(rawBody, `sha256=${signature}`);
      expect(isValid).toBe(true);
    });

    it('throws UnauthorizedException when signature is invalid or tampered', () => {
      const rawBody = Buffer.from('{"test":"payload"}');
      expect(() =>
        service.verifySignature(rawBody, 'sha256=invalidhexsignature000000000000000000000000000000000000000000000000'),
      ).toThrow(UnauthorizedException);
    });

    it('throws UnauthorizedException when signature is forged using different secret', () => {
      const rawBody = Buffer.from('{"test":"payload"}');
      const forgedSig = crypto.createHmac('sha256', 'wrong-attacker-secret').update(rawBody).digest('hex');
      expect(() => service.verifySignature(rawBody, `sha256=${forgedSig}`)).toThrow(
        UnauthorizedException,
      );
    });

    it('throws UnauthorizedException when header is missing', () => {
      const rawBody = Buffer.from('{"test":"payload"}');
      expect(() => service.verifySignature(rawBody, undefined)).toThrow(UnauthorizedException);
    });

    it('throws UnauthorizedException in production when app secret is not configured', async () => {
      const prodModule: TestingModule = await Test.createTestingModule({
        providers: [
          MetaSocialWebhookService,
          {
            provide: ConfigService,
            useValue: {
              get: jest.fn().mockImplementation((key: string) => {
                if (key === 'nodeEnv') return 'production';
                if (key === 'META_APP_SECRET') return '';
                return null;
              }),
            },
          },
          { provide: PrismaService, useValue: prisma },
        ],
      }).compile();

      const prodService = prodModule.get<MetaSocialWebhookService>(MetaSocialWebhookService);
      const rawBody = Buffer.from('{"test":"payload"}');
      const dummySig = 'sha256=abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890';

      expect(() => prodService.verifySignature(rawBody, dummySig)).toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('processWebhookPayload', () => {
    it('skips duplicate events if already processed', async () => {
      prisma.socialWebhookEvent.findUnique.mockResolvedValue({ id: 'existing-event' });

      const payload = {
        object: 'page',
        entry: [
          {
            id: 'page-101',
            changes: [
              {
                field: 'feed',
                value: { item: 'comment', comment_id: 'comm-99', message: 'Hello' },
              },
            ],
          },
        ],
      };

      const result = await service.processWebhookPayload(payload);
      expect(result.duplicates).toBe(1);
      expect(result.processed).toBe(0);
      expect(prisma.socialInteraction.upsert).not.toHaveBeenCalled();
    });

    it('processes new Facebook comment and upserts SocialInteraction', async () => {
      prisma.socialWebhookEvent.findUnique.mockResolvedValue(null);
      prisma.socialAccount.findFirst.mockResolvedValue({
        id: 'acc-1',
        workspaceId: 'ws-1',
        providerAccountId: 'page-101',
      });

      const payload = {
        object: 'page',
        entry: [
          {
            id: 'page-101',
            changes: [
              {
                field: 'feed',
                value: {
                  item: 'comment',
                  comment_id: 'comm-123',
                  post_id: 'post-555',
                  message: 'Interested in this product!',
                  from: { id: 'user-777', name: 'Alice Smith' },
                  created_time: 1760000000,
                },
              },
            ],
          },
        ],
      };

      const result = await service.processWebhookPayload(payload);
      expect(result.processed).toBe(1);
      expect(result.duplicates).toBe(0);
      expect(prisma.socialInteraction.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          create: expect.objectContaining({
            externalInteractionId: 'comm-123',
            authorName: 'Alice Smith',
            content: 'Interested in this product!',
          }),
        }),
      );
    });
  });
});
