import { Test, TestingModule } from '@nestjs/testing';
import { WhatsAppNotificationService } from './whatsapp-notification.service';
import { PrismaService } from '../../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import { WHATSAPP_CLIENT } from '../provider/whatsapp-client.interface';
import { WhatsAppConfigService } from './whatsapp-config.service';
import { WhatsAppConsentService } from './whatsapp-consent.service';
import { WhatsAppActionTokenService } from './whatsapp-action-token.service';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { RecipientConsentStatus, WhatsAppMessageStatus, SocialPlatform } from '@prisma/client';

describe('WhatsAppNotificationService', () => {
  let service: WhatsAppNotificationService;
  let prisma: any;
  let whatsAppClient: any;

  const mockPrisma = {
    contentDraft: {
      findUnique: jest.fn(),
    },
    whatsAppRecipientConsent: {
      findUnique: jest.fn(),
    },
    whatsAppNotificationMessage: {
      create: jest.fn(),
      update: jest.fn(),
      findMany: jest.fn(),
    },
    auditLog: {
      create: jest.fn(),
    },
  };

  const mockConfigService = {
    get: jest.fn((key: string, defaultValue?: any) => {
      if (key === 'whatsapp.reviewBaseUrl') return 'http://localhost:3000';
      return defaultValue;
    }),
  };

  const mockWhatsAppClient = {
    sendMessage: jest.fn(),
  };

  const mockConfigManager = {
    getDecryptedToken: jest.fn().mockResolvedValue({
      accessToken: 'decrypted-access-token',
      phoneNumberId: '1234567890',
    }),
  };

  const mockConsentManager = {
    maskPhoneNumber: jest.fn((p) => p),
  };

  const mockActionTokenManager = {
    generateToken: jest.fn().mockReturnValue('signed.action.token'),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WhatsAppNotificationService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: ConfigService, useValue: mockConfigService },
        { provide: WHATSAPP_CLIENT, useValue: mockWhatsAppClient },
        { provide: WhatsAppConfigService, useValue: mockConfigManager },
        { provide: WhatsAppConsentService, useValue: mockConsentManager },
        { provide: WhatsAppActionTokenService, useValue: mockActionTokenManager },
      ],
    }).compile();

    service = module.get<WhatsAppNotificationService>(WhatsAppNotificationService);
    prisma = module.get(PrismaService);
    whatsAppClient = module.get(WHATSAPP_CLIENT);
  });

  const wsId = 'ws-uuid-1';
  const draftId = 'draft-uuid-1';
  const userId = 'user-uuid-1';
  const recipientId = 'rec-uuid-1';

  it('throws NotFoundException if draft does not exist', async () => {
    mockPrisma.contentDraft.findUnique.mockResolvedValue(null);

    await expect(
      service.sendDraftPreview(wsId, draftId, [recipientId], userId),
    ).rejects.toThrow(NotFoundException);
  });

  it('throws BadRequestException if draft has no platform variants', async () => {
    mockPrisma.contentDraft.findUnique.mockResolvedValue({
      id: draftId,
      workspaceId: wsId,
      variants: [],
      workspace: { name: 'Acme Corp' },
      createdBy: { name: 'Alice' },
    });

    await expect(
      service.sendDraftPreview(wsId, draftId, [recipientId], userId),
    ).rejects.toThrow(BadRequestException);
  });

  it('throws BadRequestException if recipient is OPTED_OUT', async () => {
    mockPrisma.contentDraft.findUnique.mockResolvedValue({
      id: draftId,
      workspaceId: wsId,
      title: 'Diwali Special Post',
      language: 'en',
      variants: [{ platform: SocialPlatform.INSTAGRAM, content: 'Exciting offer!' }],
      workspace: { name: 'Acme Corp' },
      createdBy: { name: 'Alice' },
    });

    mockPrisma.whatsAppRecipientConsent.findUnique.mockResolvedValue({
      id: recipientId,
      workspaceId: wsId,
      displayName: 'Bob Reviewer',
      phoneNumber: '+919876543210',
      status: RecipientConsentStatus.OPTED_OUT,
    });

    await expect(
      service.sendDraftPreview(wsId, draftId, [recipientId], userId),
    ).rejects.toThrow(BadRequestException);
  });

  it('dispatches preview to opted-in recipient and records message in database', async () => {
    mockPrisma.contentDraft.findUnique.mockResolvedValue({
      id: draftId,
      workspaceId: wsId,
      title: 'Diwali Special Post',
      language: 'en',
      variants: [{ platform: SocialPlatform.INSTAGRAM, content: 'Exciting offer!' }],
      workspace: { name: 'Acme Corp' },
      createdBy: { name: 'Alice' },
    });

    mockPrisma.whatsAppRecipientConsent.findUnique.mockResolvedValue({
      id: recipientId,
      workspaceId: wsId,
      displayName: 'Bob Reviewer',
      phoneNumber: '+919876543210',
      status: RecipientConsentStatus.OPTED_IN,
    });

    mockPrisma.whatsAppNotificationMessage.create.mockResolvedValue({
      id: 'msg-rec-1',
      status: WhatsAppMessageStatus.QUEUED,
    });

    mockWhatsAppClient.sendMessage.mockResolvedValue({
      messageId: 'wamid.HBgL123456789',
    });

    mockPrisma.whatsAppNotificationMessage.update.mockResolvedValue({
      id: 'msg-rec-1',
      status: WhatsAppMessageStatus.SENT,
      providerMessageId: 'wamid.HBgL123456789',
    });

    const result = await service.sendDraftPreview(wsId, draftId, [recipientId], userId);

    expect(result.success).toBe(true);
    expect(result.dispatchedCount).toBe(1);
    expect(mockWhatsAppClient.sendMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        to: '+919876543210',
        templateName: 'content_draft_approval_request',
        buttonUrlParameter: 'signed.action.token',
      }),
    );
    expect(mockPrisma.auditLog.create).toHaveBeenCalled();
  });
});
