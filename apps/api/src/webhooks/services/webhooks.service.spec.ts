import { Test, TestingModule } from '@nestjs/testing';
import { WebhooksService } from './webhooks.service';
import { PrismaService } from '../../prisma/prisma.service';
import { NotFoundException } from '@nestjs/common';
import { WebhookDeliveryStatus } from '@packages/shared';

describe('WebhooksService', () => {
  let service: WebhooksService;
  let prisma: any;

  const mockWorkspaceId = 'ws-wh-111';
  const mockSubId = 'sub-wh-222';
  const mockDeliveryId = 'del-wh-333';

  const mockSubscription = {
    id: mockSubId,
    workspaceId: mockWorkspaceId,
    name: 'Slack Alerts Webhook',
    targetUrl: 'https://hooks.slack.com/services/T00/B00/X00',
    secretKey: 'whsec_abcdef1234567890abcdef1234567890',
    eventTypes: ['post.published', 'inbox.crisis_flagged'],
    isActive: true,
    description: 'Post and crisis notifications',
    failureCount: 0,
    lastTriggeredAt: null,
    createdAt: new Date('2026-06-01T00:00:00Z'),
    updatedAt: new Date('2026-06-01T00:00:00Z'),
    deliveries: [],
  };

  const mockDeliveryLog = {
    id: mockDeliveryId,
    subscriptionId: mockSubId,
    workspaceId: mockWorkspaceId,
    eventType: 'post.published',
    payload: { id: 'post-1' },
    statusCode: 200,
    durationMs: 140,
    responseBody: '{"ok":true}',
    errorMessage: null,
    status: WebhookDeliveryStatus.SUCCESS,
    attemptNumber: 1,
    nextRetryAt: null,
    createdAt: new Date('2026-06-01T00:00:00Z'),
    subscription: mockSubscription,
  };

  beforeEach(async () => {
    prisma = {
      webhookSubscription: {
        create: jest.fn(),
        findMany: jest.fn(),
        findFirst: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      webhookDeliveryLog: {
        create: jest.fn(),
        findMany: jest.fn(),
        findFirst: jest.fn(),
        update: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WebhooksService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<WebhooksService>(WebhooksService);
  });

  describe('create', () => {
    it('should generate an HMAC secret and create a webhook subscription', async () => {
      prisma.webhookSubscription.create.mockResolvedValue(mockSubscription);

      const result = await service.create(mockWorkspaceId, {
        name: 'Slack Alerts Webhook',
        targetUrl: 'https://hooks.slack.com/services/T00/B00/X00',
        eventTypes: ['post.published'],
      });

      expect(prisma.webhookSubscription.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            workspaceId: mockWorkspaceId,
            secretKey: expect.stringMatching(/^whsec_/),
          }),
        }),
      );
      expect(result.id).toBe(mockSubId);
      expect(result.name).toBe('Slack Alerts Webhook');
    });
  });

  describe('findAll', () => {
    it('should list all webhook subscriptions for workspace', async () => {
      prisma.webhookSubscription.findMany.mockResolvedValue([mockSubscription]);

      const result = await service.findAll(mockWorkspaceId);

      expect(prisma.webhookSubscription.findMany).toHaveBeenCalledWith({
        where: { workspaceId: mockWorkspaceId },
        include: { deliveries: { orderBy: { createdAt: 'desc' }, take: 3 } },
        orderBy: { createdAt: 'desc' },
      });
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(mockSubId);
    });
  });

  describe('findOne', () => {
    it('should return subscription if found', async () => {
      prisma.webhookSubscription.findFirst.mockResolvedValue(mockSubscription);

      const result = await service.findOne(mockWorkspaceId, mockSubId);

      expect(result.id).toBe(mockSubId);
    });

    it('should throw NotFoundException if subscription does not exist', async () => {
      prisma.webhookSubscription.findFirst.mockResolvedValue(null);

      await expect(
        service.findOne(mockWorkspaceId, 'invalid-id'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('rotateSecret', () => {
    it('should generate a new secret key and update database', async () => {
      prisma.webhookSubscription.findFirst.mockResolvedValue(mockSubscription);
      prisma.webhookSubscription.update.mockResolvedValue({
        ...mockSubscription,
        secretKey: 'whsec_newsecret123',
      });

      const result = await service.rotateSecret(mockWorkspaceId, mockSubId);

      expect(result.newSecretKey).toMatch(/^whsec_/);
      expect(prisma.webhookSubscription.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: mockSubId },
          data: { secretKey: expect.stringMatching(/^whsec_/) },
        }),
      );
    });
  });

  describe('signPayload', () => {
    it('should generate a reproducible HMAC-SHA256 signature', () => {
      const secret = 'whsec_testsecret123';
      const payload = { event: 'test' };
      const timestamp = 1700000000;

      const sig1 = service.signPayload(secret, payload, timestamp);
      const sig2 = service.signPayload(secret, payload, timestamp);

      expect(sig1).toBe(sig2);
      expect(sig1).toMatch(/^sha256=[a-f0-9]{64}$/);
    });
  });

  describe('sendTestPing', () => {
    it('should dispatch test event to endpoint and record delivery log', async () => {
      prisma.webhookSubscription.findFirst.mockResolvedValue(mockSubscription);
      prisma.webhookDeliveryLog.create.mockResolvedValue(mockDeliveryLog);

      // Mock global fetch
      const mockFetch = jest.fn().mockResolvedValue({
        ok: true,
        status: 200,
        text: () => Promise.resolve('{"received":true}'),
      });
      global.fetch = mockFetch;

      const result = await service.sendTestPing(mockWorkspaceId, mockSubId);

      expect(mockFetch).toHaveBeenCalledWith(
        mockSubscription.targetUrl,
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'X-OmniSocial-Event': 'webhook.test_ping',
          }),
        }),
      );
      expect(result.delivered).toBe(true);
      expect(result.statusCode).toBe(200);
      expect(prisma.webhookDeliveryLog.create).toHaveBeenCalled();
    });
  });

  describe('dispatch', () => {
    it('should find subscribed endpoints and dispatch payload with signed headers', async () => {
      prisma.webhookSubscription.findMany.mockResolvedValue([mockSubscription]);
      prisma.webhookDeliveryLog.create.mockResolvedValue(mockDeliveryLog);
      prisma.webhookSubscription.update.mockResolvedValue(mockSubscription);

      const mockFetch = jest.fn().mockResolvedValue({
        ok: true,
        status: 200,
        text: () => Promise.resolve('OK'),
      });
      global.fetch = mockFetch;

      const result = await service.dispatch(mockWorkspaceId, 'post.published', {
        postId: 'post-123',
      });

      expect(result.deliveredCount).toBe(1);
      expect(result.failedCount).toBe(0);
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });
  });

  describe('getDeliveries', () => {
    it('should retrieve delivery logs with subscription names', async () => {
      prisma.webhookDeliveryLog.findMany.mockResolvedValue([mockDeliveryLog]);

      const result = await service.getDeliveries(mockWorkspaceId);

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(mockDeliveryId);
      expect(result[0].subscriptionName).toBe('Slack Alerts Webhook');
    });
  });

  describe('retryDelivery', () => {
    it('should re-execute delivery for a given delivery log', async () => {
      prisma.webhookDeliveryLog.findFirst.mockResolvedValue(mockDeliveryLog);
      prisma.webhookDeliveryLog.update.mockResolvedValue({
        ...mockDeliveryLog,
        attemptNumber: 2,
      });

      const mockFetch = jest.fn().mockResolvedValue({
        ok: true,
        status: 200,
        text: () => Promise.resolve('OK'),
      });
      global.fetch = mockFetch;

      const result = await service.retryDelivery(mockWorkspaceId, mockDeliveryId);

      expect(mockFetch).toHaveBeenCalled();
      expect(result.attemptNumber).toBe(2);
    });
  });
});
