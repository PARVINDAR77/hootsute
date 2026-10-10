import { Test, TestingModule } from '@nestjs/testing';
import { WhatsAppConsentService } from './whatsapp-consent.service';
import { PrismaService } from '../../prisma/prisma.service';
import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { RecipientConsentStatus } from '@prisma/client';

describe('WhatsAppConsentService', () => {
  let service: WhatsAppConsentService;
  let prisma: any;

  const mockPrisma = {
    whatsAppRecipientConsent: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
    },
    auditLog: {
      create: jest.fn(),
    },
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WhatsAppConsentService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<WhatsAppConsentService>(WhatsAppConsentService);
    prisma = module.get(PrismaService);
  });

  describe('normalizePhoneNumber', () => {
    it('normalizes spaces, dashes, brackets into standard E.164', () => {
      expect(service.normalizePhoneNumber('+91 98765-43210')).toBe('+919876543210');
      expect(service.normalizePhoneNumber('(1) 555-123-4567')).toBe('+15551234567');
      expect(service.normalizePhoneNumber('919876543210')).toBe('+919876543210');
    });

    it('throws BadRequestException for invalid phone numbers', () => {
      expect(() => service.normalizePhoneNumber('123')).toThrow(BadRequestException);
      expect(() => service.normalizePhoneNumber('invalid-phone')).toThrow(BadRequestException);
      expect(() => service.normalizePhoneNumber('+0123456789')).toThrow(BadRequestException);
    });
  });

  describe('maskPhoneNumber', () => {
    it('masks middle digits for privacy protection', () => {
      const masked = service.maskPhoneNumber('+919876543210');
      expect(masked).toBe('+91****3210');
    });
  });

  describe('addRecipient', () => {
    const wsId = 'ws-uuid-1';
    const adminId = 'admin-user-1';

    it('throws BadRequestException if consent is not explicitly acknowledged', async () => {
      await expect(
        service.addRecipient(
          wsId,
          { phoneNumber: '+919876543210', displayName: 'Approver One', consentAcknowledged: false },
          adminId,
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('creates new recipient and logs audit record when recipient does not exist', async () => {
      mockPrisma.whatsAppRecipientConsent.findUnique.mockResolvedValue(null);
      mockPrisma.whatsAppRecipientConsent.create.mockResolvedValue({
        id: 'rec-1',
        workspaceId: wsId,
        phoneNumber: '+919876543210',
        displayName: 'Approver One',
        status: RecipientConsentStatus.OPTED_IN,
      });

      const result = await service.addRecipient(
        wsId,
        { phoneNumber: '+91 98765 43210', displayName: 'Approver One', consentAcknowledged: true },
        adminId,
      );

      expect(result.id).toBe('rec-1');
      expect(mockPrisma.whatsAppRecipientConsent.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          workspaceId: wsId,
          phoneNumber: '+919876543210',
          displayName: 'Approver One',
          status: RecipientConsentStatus.OPTED_IN,
        }),
      });
      expect(mockPrisma.auditLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          action: 'WHATSAPP_RECIPIENT_REGISTER',
          workspaceId: wsId,
        }),
      });
    });

    it('throws ConflictException if recipient is already registered and opted in', async () => {
      mockPrisma.whatsAppRecipientConsent.findUnique.mockResolvedValue({
        id: 'rec-existing',
        status: RecipientConsentStatus.OPTED_IN,
      });

      await expect(
        service.addRecipient(
          wsId,
          { phoneNumber: '+919876543210', displayName: 'Approver One', consentAcknowledged: true },
          adminId,
        ),
      ).rejects.toThrow(ConflictException);
    });

    it('re-activates opted-out recipient if previously registered', async () => {
      mockPrisma.whatsAppRecipientConsent.findUnique.mockResolvedValue({
        id: 'rec-existing',
        status: RecipientConsentStatus.OPTED_OUT,
      });
      mockPrisma.whatsAppRecipientConsent.update.mockResolvedValue({
        id: 'rec-existing',
        status: RecipientConsentStatus.OPTED_IN,
      });

      const result = await service.addRecipient(
        wsId,
        { phoneNumber: '+919876543210', displayName: 'Approver One', consentAcknowledged: true },
        adminId,
      );

      expect(mockPrisma.whatsAppRecipientConsent.update).toHaveBeenCalledWith({
        where: { id: 'rec-existing' },
        data: expect.objectContaining({
          status: RecipientConsentStatus.OPTED_IN,
        }),
      });
      expect(result.status).toBe(RecipientConsentStatus.OPTED_IN);
    });
  });

  describe('revokeConsent', () => {
    it('throws NotFoundException if recipient does not exist in workspace', async () => {
      mockPrisma.whatsAppRecipientConsent.findUnique.mockResolvedValue(null);
      await expect(service.revokeConsent('ws-1', 'rec-1', 'admin-1')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('updates status to OPTED_OUT and logs audit entry', async () => {
      mockPrisma.whatsAppRecipientConsent.findUnique.mockResolvedValue({
        id: 'rec-1',
        workspaceId: 'ws-1',
        phoneNumber: '+919876543210',
        displayName: 'Approver One',
      });
      mockPrisma.whatsAppRecipientConsent.update.mockResolvedValue({
        id: 'rec-1',
        status: RecipientConsentStatus.OPTED_OUT,
      });

      const result = await service.revokeConsent('ws-1', 'rec-1', 'admin-1');

      expect(result.status).toBe(RecipientConsentStatus.OPTED_OUT);
      expect(mockPrisma.whatsAppRecipientConsent.update).toHaveBeenCalledWith({
        where: { id: 'rec-1' },
        data: expect.objectContaining({
          status: RecipientConsentStatus.OPTED_OUT,
        }),
      });
      expect(mockPrisma.auditLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          action: 'WHATSAPP_RECIPIENT_OPT_OUT',
          workspaceId: 'ws-1',
        }),
      });
    });
  });

  describe('handleInboundOptOut', () => {
    it('sets status to OPTED_OUT for matching phone number across workspaces', async () => {
      mockPrisma.whatsAppRecipientConsent.updateMany.mockResolvedValue({ count: 2 });

      const count = await service.handleInboundOptOut('+91 98765 43210');
      expect(count).toBe(2);
      expect(mockPrisma.whatsAppRecipientConsent.updateMany).toHaveBeenCalledWith({
        where: {
          phoneNumber: '+919876543210',
          status: RecipientConsentStatus.OPTED_IN,
        },
        data: expect.objectContaining({
          status: RecipientConsentStatus.OPTED_OUT,
        }),
      });
    });
  });
});
