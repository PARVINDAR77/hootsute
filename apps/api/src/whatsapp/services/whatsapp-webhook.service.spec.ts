import { Test, TestingModule } from '@nestjs/testing';
import { WhatsAppWebhookService } from './whatsapp-webhook.service';
import { PrismaService } from '../../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import { WhatsAppConsentService } from './whatsapp-consent.service';
import { WhatsAppApprovalService } from './whatsapp-approval.service';
import { UnauthorizedException, ForbiddenException } from '@nestjs/common';
import * as crypto from 'crypto';
import { WhatsAppMessageStatus } from '@prisma/client';

describe('WhatsAppWebhookService', () => {
  let service: WhatsAppWebhookService;
  let prisma: any;
  let consentService: any;

  const appSecret = 'test-meta-app-secret-12345';
  const verifyToken = 'test-verify-token-omnisocial';

  const mockPrisma = {
    whatsAppWebhookEvent: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    whatsAppNotificationMessage: {
      updateMany: jest.fn(),
    },
  };

  const mockConfigService = {
    get: jest.fn((key: string, defaultValue?: any) => {
      if (key === 'whatsapp.appSecret') return appSecret;
      if (key === 'whatsapp.verifyToken') return verifyToken;
      return defaultValue;
    }),
  };

  const mockConsentService = {
    handleInboundOptOut: jest.fn(),
  };

  const mockApprovalService = {
    handleInboundApprovalReply: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WhatsAppWebhookService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: ConfigService, useValue: mockConfigService },
        { provide: WhatsAppConsentService, useValue: mockConsentService },
        { provide: WhatsAppApprovalService, useValue: mockApprovalService },
      ],
    }).compile();

    service = module.get<WhatsAppWebhookService>(WhatsAppWebhookService);
    prisma = module.get(PrismaService);
    consentService = module.get(WhatsAppConsentService);
  });

  describe('verifyChallenge', () => {
    it('returns challenge when mode is subscribe and token matches', () => {
      const challenge = 'test-random-challenge-code-999';
      const result = service.verifyChallenge('subscribe', verifyToken, challenge);
      expect(result).toBe(challenge);
    });

    it('throws ForbiddenException when token does not match', () => {
      expect(() =>
        service.verifyChallenge('subscribe', 'wrong-token', 'challenge'),
      ).toThrow(ForbiddenException);
    });

    it('throws ForbiddenException when mode is not subscribe', () => {
      expect(() =>
        service.verifyChallenge('other-mode', verifyToken, 'challenge'),
      ).toThrow(ForbiddenException);
    });
  });

  describe('verifySignature', () => {
    it('accepts valid HMAC-SHA256 signature calculated over raw body', () => {
      const rawPayload = Buffer.from(JSON.stringify({ object: 'whatsapp_business_account' }));
      const hmac = crypto.createHmac('sha256', appSecret).update(rawPayload).digest('hex');
      const signatureHeader = `sha256=${hmac}`;

      expect(service.verifySignature(rawPayload, signatureHeader)).toBe(true);
    });

    it('rejects tampered raw body or invalid signature header', () => {
      const rawPayload = Buffer.from(JSON.stringify({ object: 'whatsapp_business_account' }));
      expect(() =>
        service.verifySignature(rawPayload, 'sha256=invalid-signature-hash'),
      ).toThrow(UnauthorizedException);
      expect(() => service.verifySignature(rawPayload, undefined)).toThrow(UnauthorizedException);
    });

    it('rejects forged signature calculated with attacker secret', () => {
      const rawPayload = Buffer.from(JSON.stringify({ object: 'whatsapp_business_account' }));
      const forgedHmac = crypto.createHmac('sha256', 'attacker-secret-key').update(rawPayload).digest('hex');
      expect(() =>
        service.verifySignature(rawPayload, `sha256=${forgedHmac}`),
      ).toThrow(UnauthorizedException);
    });

    it('throws UnauthorizedException in production when WhatsApp app secret is missing', async () => {
      const prodModule: TestingModule = await Test.createTestingModule({
        providers: [
          WhatsAppWebhookService,
          { provide: PrismaService, useValue: mockPrisma },
          {
            provide: ConfigService,
            useValue: {
              get: jest.fn().mockImplementation((key: string) => {
                if (key === 'nodeEnv') return 'production';
                if (key === 'whatsapp.appSecret') return '';
                return null;
              }),
            },
          },
          { provide: WhatsAppConsentService, useValue: mockConsentService },
          { provide: WhatsAppApprovalService, useValue: mockApprovalService },
        ],
      }).compile();

      const prodService = prodModule.get<WhatsAppWebhookService>(WhatsAppWebhookService);
      const rawPayload = Buffer.from(JSON.stringify({ object: 'whatsapp_business_account' }));
      const dummySig = 'sha256=abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890';

      expect(() => prodService.verifySignature(rawPayload, dummySig)).toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('processWebhookPayload', () => {
    it('deduplicates events when eventId already exists in database', async () => {
      mockPrisma.whatsAppWebhookEvent.findUnique.mockResolvedValue({
        id: 'existing-event',
        eventId: 'msg_wamid.HBgL1234567890',
      });

      const payload = {
        entry: [
          {
            changes: [
              {
                value: {
                  messages: [
                    {
                      id: 'wamid.HBgL1234567890',
                      from: '919876543210',
                      type: 'text',
                      text: { body: 'Hello' },
                    },
                  ],
                },
              },
            ],
          },
        ],
      };

      const result = await service.processWebhookPayload(payload);
      expect(result.processed).toBe(0);
      expect(result.duplicates).toBe(1);
      expect(mockPrisma.whatsAppWebhookEvent.create).not.toHaveBeenCalled();
    });

    it('processes inbound "STOP" message and revokes recipient consent', async () => {
      mockPrisma.whatsAppWebhookEvent.findUnique.mockResolvedValue(null);
      mockPrisma.whatsAppWebhookEvent.create.mockResolvedValue({ id: 'evt-1' });

      const payload = {
        entry: [
          {
            changes: [
              {
                value: {
                  messages: [
                    {
                      id: 'wamid.HBgL1234567891',
                      from: '919876543210',
                      type: 'text',
                      text: { body: 'STOP' },
                    },
                  ],
                },
              },
            ],
          },
        ],
      };

      const result = await service.processWebhookPayload(payload);
      expect(result.processed).toBe(1);
      expect(consentService.handleInboundOptOut).toHaveBeenCalledWith('919876543210');
      expect(mockPrisma.whatsAppWebhookEvent.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          eventId: 'msg_wamid.HBgL1234567891',
          eventType: 'inbound_message',
        }),
      });
    });

    it('processes status updates (DELIVERED, READ, FAILED)', async () => {
      mockPrisma.whatsAppWebhookEvent.findUnique.mockResolvedValue(null);
      mockPrisma.whatsAppWebhookEvent.create.mockResolvedValue({ id: 'evt-2' });
      mockPrisma.whatsAppNotificationMessage.updateMany.mockResolvedValue({ count: 1 });

      const payload = {
        entry: [
          {
            changes: [
              {
                value: {
                  statuses: [
                    {
                      id: 'wamid.HBgL_SENT_MESSAGE',
                      status: 'delivered',
                      timestamp: '1728460000',
                    },
                  ],
                },
              },
            ],
          },
        ],
      };

      const result = await service.processWebhookPayload(payload);
      expect(result.processed).toBe(1);
      expect(mockPrisma.whatsAppNotificationMessage.updateMany).toHaveBeenCalledWith({
        where: { providerMessageId: 'wamid.HBgL_SENT_MESSAGE' },
        data: expect.objectContaining({
          status: WhatsAppMessageStatus.DELIVERED,
          deliveredAt: expect.any(Date),
        }),
      });
    });
  });
});
