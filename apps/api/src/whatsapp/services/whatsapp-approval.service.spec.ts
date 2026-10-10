import { Test, TestingModule } from '@nestjs/testing';
import { WhatsAppApprovalService } from './whatsapp-approval.service';
import { PrismaService } from '../../prisma/prisma.service';
import { WhatsAppActionTokenService } from './whatsapp-action-token.service';
import { WhatsAppConsentService } from './whatsapp-consent.service';
import { WhatsAppConfigService } from './whatsapp-config.service';
import { WHATSAPP_CLIENT } from '../provider/whatsapp-client.interface';
import { DraftStatus, WorkspaceRole, RecipientConsentStatus } from '@prisma/client';
import { ForbiddenException, BadRequestException, NotFoundException } from '@nestjs/common';

describe('WhatsAppApprovalService', () => {
  let service: WhatsAppApprovalService;
  let prisma: any;
  let tokenService: any;
  let consentService: any;
  let whatsAppClient: any;

  const mockPrisma: any = {
    contentDraft: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    whatsAppRecipientConsent: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
    },
    workspaceMember: {
      findUnique: jest.fn(),
    },
    contentRevision: {
      findFirst: jest.fn(),
      create: jest.fn(),
    },
    auditLog: {
      create: jest.fn(),
    },
    whatsAppNotificationMessage: {
      findFirst: jest.fn(),
    },
    $transaction: jest.fn((callback) => callback(mockPrisma)),
  };

  const mockTokenService = {
    verifyToken: jest.fn(),
  };

  const mockConsentService = {
    normalizePhoneNumber: jest.fn((p) => (p.startsWith('+') ? p : `+${p}`)),
    maskPhoneNumber: jest.fn((p) => `${p.slice(0, 3)}****${p.slice(-4)}`),
  };

  const mockConfigService = {
    getDecryptedToken: jest.fn().mockResolvedValue({
      accessToken: 'token-123',
      phoneNumberId: 'phone-123',
    }),
  };

  const mockWhatsAppClient = {
    sendTextMessage: jest.fn().mockResolvedValue({ success: true, messageId: 'wamid.receipt123' }),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WhatsAppApprovalService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: WhatsAppActionTokenService, useValue: mockTokenService },
        { provide: WhatsAppConsentService, useValue: mockConsentService },
        { provide: WhatsAppConfigService, useValue: mockConfigService },
        { provide: WHATSAPP_CLIENT, useValue: mockWhatsAppClient },
      ],
    }).compile();

    service = module.get<WhatsAppApprovalService>(WhatsAppApprovalService);
    prisma = module.get(PrismaService);
    tokenService = module.get(WhatsAppActionTokenService);
    consentService = module.get(WhatsAppConsentService);
    whatsAppClient = module.get(WHATSAPP_CLIENT);
  });

  const wsId = 'ws-uuid-1';
  const draftId = 'draft-uuid-1';
  const creatorId = 'creator-user-uuid';
  const reviewerId = 'reviewer-user-uuid';
  const consentId = 'consent-uuid-1';

  describe('resolveReviewDetails', () => {
    it('returns preview data and canApprove=true when reviewer is distinct from creator', async () => {
      mockTokenService.verifyToken.mockReturnValue({
        workspaceId: wsId,
        draftId,
        recipientConsentId: consentId,
        expiresAt: Date.now() + 3600000,
      });

      mockPrisma.contentDraft.findUnique.mockResolvedValue({
        id: draftId,
        workspaceId: wsId,
        title: 'Festival Sale',
        createdByUserId: creatorId,
        createdBy: { id: creatorId, name: 'Alice Author' },
        workspace: { id: wsId, name: 'Om Retail', slug: 'om-retail', logoUrl: null },
        variants: [],
      });

      mockPrisma.whatsAppRecipientConsent.findUnique.mockResolvedValue({
        id: consentId,
        workspaceId: wsId,
        userId: reviewerId,
        displayName: 'Bob Approver',
        phoneNumber: '+919876543210',
      });

      const details = await service.resolveReviewDetails('valid.token');
      expect(details.canApprove).toBe(true);
      expect(details.cannotApproveReason).toBeUndefined();
      expect(details.draft.title).toBe('Festival Sale');
      expect(details.reviewer.displayName).toBe('Bob Approver');
    });

    it('sets canApprove=false under four-eyes policy if recipient created the draft and is not Owner', async () => {
      mockTokenService.verifyToken.mockReturnValue({
        workspaceId: wsId,
        draftId,
        recipientConsentId: consentId,
        expiresAt: Date.now() + 3600000,
      });

      mockPrisma.contentDraft.findUnique.mockResolvedValue({
        id: draftId,
        workspaceId: wsId,
        title: 'Festival Sale',
        createdByUserId: creatorId,
        createdBy: { id: creatorId, name: 'Alice Author' },
        workspace: { id: wsId, name: 'Om Retail', slug: 'om-retail', logoUrl: null },
        variants: [],
      });

      mockPrisma.whatsAppRecipientConsent.findUnique.mockResolvedValue({
        id: consentId,
        workspaceId: wsId,
        userId: creatorId, // Same as creator!
        displayName: 'Alice Author',
        phoneNumber: '+919876543210',
      });

      mockPrisma.workspaceMember.findUnique.mockResolvedValue({
        workspaceId: wsId,
        userId: creatorId,
        role: WorkspaceRole.EDITOR, // Not OWNER!
      });

      const details = await service.resolveReviewDetails('valid.token');
      expect(details.canApprove).toBe(false);
      expect(details.cannotApproveReason).toContain('four-eyes approval policy');
    });
  });

  describe('approveViaActionToken', () => {
    it('approves draft and records revision and audit log', async () => {
      mockTokenService.verifyToken.mockReturnValue({
        workspaceId: wsId,
        draftId,
        recipientConsentId: consentId,
      });

      mockPrisma.contentDraft.findUnique.mockResolvedValue({
        id: draftId,
        workspaceId: wsId,
        title: 'Festival Sale',
        status: DraftStatus.IN_REVIEW,
        createdByUserId: creatorId,
      });

      mockPrisma.whatsAppRecipientConsent.findUnique.mockResolvedValue({
        id: consentId,
        workspaceId: wsId,
        userId: reviewerId,
        displayName: 'Bob Approver',
        phoneNumber: '+919876543210',
      });

      mockPrisma.contentDraft.update.mockResolvedValue({
        id: draftId,
        status: DraftStatus.APPROVED,
        approvedAt: new Date(),
      });

      mockPrisma.contentRevision.findFirst.mockResolvedValue({ revisionNumber: 1 });

      const result = await service.approveViaActionToken('valid.token');
      expect(result.success).toBe(true);
      expect(mockPrisma.contentDraft.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: DraftStatus.APPROVED,
          }),
        }),
      );
      expect(mockPrisma.contentRevision.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            action: 'APPROVE',
            revisionNumber: 2,
          }),
        }),
      );
      expect(mockPrisma.auditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            action: 'WHATSAPP_DRAFT_APPROVE',
          }),
        }),
      );
    });

    it('rejects self-approval under four-eyes principle with ForbiddenException', async () => {
      mockTokenService.verifyToken.mockReturnValue({
        workspaceId: wsId,
        draftId,
        recipientConsentId: consentId,
      });

      mockPrisma.contentDraft.findUnique.mockResolvedValue({
        id: draftId,
        workspaceId: wsId,
        title: 'Festival Sale',
        status: DraftStatus.IN_REVIEW,
        createdByUserId: creatorId,
      });

      mockPrisma.whatsAppRecipientConsent.findUnique.mockResolvedValue({
        id: consentId,
        workspaceId: wsId,
        userId: creatorId, // Same as creator
        displayName: 'Alice Author',
        phoneNumber: '+919876543210',
      });

      mockPrisma.workspaceMember.findUnique.mockResolvedValue({
        workspaceId: wsId,
        userId: creatorId,
        role: WorkspaceRole.ADMIN, // Not OWNER
      });

      await expect(service.approveViaActionToken('valid.token')).rejects.toThrow(ForbiddenException);
    });
  });

  describe('rejectViaActionToken', () => {
    it('rejects draft with valid reason and records revision', async () => {
      mockTokenService.verifyToken.mockReturnValue({
        workspaceId: wsId,
        draftId,
        recipientConsentId: consentId,
      });

      mockPrisma.contentDraft.findUnique.mockResolvedValue({
        id: draftId,
        workspaceId: wsId,
        title: 'Festival Sale',
        status: DraftStatus.IN_REVIEW,
        createdByUserId: creatorId,
      });

      mockPrisma.whatsAppRecipientConsent.findUnique.mockResolvedValue({
        id: consentId,
        workspaceId: wsId,
        displayName: 'Bob Reviewer',
        phoneNumber: '+919876543210',
      });

      mockPrisma.contentDraft.update.mockResolvedValue({
        id: draftId,
        status: DraftStatus.REJECTED,
        rejectionReason: 'Needs stronger CTA',
      });

      mockPrisma.contentRevision.findFirst.mockResolvedValue({ revisionNumber: 2 });

      const result = await service.rejectViaActionToken('valid.token', 'Needs stronger CTA');
      expect(result.success).toBe(true);
      expect(mockPrisma.contentDraft.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: DraftStatus.REJECTED,
            rejectionReason: 'Needs stronger CTA',
          }),
        }),
      );
    });

    it('throws BadRequestException if rejection reason is empty or too short', async () => {
      await expect(service.rejectViaActionToken('valid.token', '  ')).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.rejectViaActionToken('valid.token', 'no')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('throws BadRequestException if trying to reject an already approved draft', async () => {
      mockTokenService.verifyToken.mockReturnValue({
        workspaceId: wsId,
        draftId,
        recipientConsentId: consentId,
      });

      mockPrisma.contentDraft.findUnique.mockResolvedValue({
        id: draftId,
        workspaceId: wsId,
        status: DraftStatus.APPROVED,
      });

      await expect(
        service.rejectViaActionToken('valid.token', 'Late rejection attempt'),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('handleInboundApprovalReply', () => {
    it('approves draft on inbound "APPROVE" message and sends confirmation SMS/WhatsApp receipt', async () => {
      mockPrisma.whatsAppRecipientConsent.findFirst.mockResolvedValue({
        id: consentId,
        workspaceId: wsId,
        userId: reviewerId,
        displayName: 'Bob Approver',
        phoneNumber: '+919876543210',
      });

      mockPrisma.whatsAppNotificationMessage.findFirst.mockResolvedValue({
        id: 'msg-1',
        draft: {
          id: draftId,
          workspaceId: wsId,
          title: 'Festival Sale',
          createdByUserId: creatorId,
        },
      });

      mockPrisma.contentRevision.findFirst.mockResolvedValue({ revisionNumber: 1 });

      const result = await service.handleInboundApprovalReply('+91 98765 43210', 'APPROVE');
      expect(result.processed).toBe(true);
      expect(result.action).toBe('APPROVE');
      expect(mockPrisma.contentDraft.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: draftId },
          data: expect.objectContaining({ status: DraftStatus.APPROVED }),
        }),
      );
      expect(mockWhatsAppClient.sendTextMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          to: '+919876543210',
          text: expect.stringContaining('has been approved'),
        }),
      );
    });

    it('rejects draft on inbound "REJECT: Bad wording" and sends rejection receipt', async () => {
      mockPrisma.whatsAppRecipientConsent.findFirst.mockResolvedValue({
        id: consentId,
        workspaceId: wsId,
        userId: reviewerId,
        displayName: 'Bob Approver',
        phoneNumber: '+919876543210',
      });

      mockPrisma.whatsAppNotificationMessage.findFirst.mockResolvedValue({
        id: 'msg-1',
        draft: {
          id: draftId,
          workspaceId: wsId,
          title: 'Festival Sale',
          createdByUserId: creatorId,
        },
      });

      mockPrisma.contentRevision.findFirst.mockResolvedValue({ revisionNumber: 1 });

      const result = await service.handleInboundApprovalReply(
        '+919876543210',
        'REJECT: Fix promotional date',
      );
      expect(result.processed).toBe(true);
      expect(result.action).toBe('REJECT');
      expect(mockPrisma.contentDraft.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: draftId },
          data: expect.objectContaining({
            status: DraftStatus.REJECTED,
            rejectionReason: 'Fix promotional date',
          }),
        }),
      );
      expect(mockWhatsAppClient.sendTextMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          to: '+919876543210',
          text: expect.stringContaining('marked as rejected'),
        }),
      );
    });
  });
});
