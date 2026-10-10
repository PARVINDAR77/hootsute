import { Test, TestingModule } from '@nestjs/testing';
import { InboxService } from './inbox.service';
import { PrismaService } from '../../prisma/prisma.service';
import { TokenVaultService } from '../../social-accounts/token-vault/token-vault.service';
import { InboxAdapterFactory } from '../adapters/inbox-adapter.factory';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { InteractionWorkflowStatus, ReplyAttemptStatus } from '@prisma/client';

describe('InboxService', () => {
  let service: InboxService;
  let prisma: any;
  let tokenVault: any;
  let adapterFactory: any;

  const mockAdapter = {
    postReply: jest.fn(),
  };

  const sampleUser = {
    id: 'user-editor-1',
    email: 'editor@example.com',
    name: 'Editor User',
  };

  const sampleInteraction: any = {
    id: 'int-1',
    workspaceId: 'ws-1',
    socialAccountId: 'acc-1',
    content: 'Do you ship internationally?',
    authorName: 'Customer Bob',
    workflowStatus: InteractionWorkflowStatus.OPEN,
    isRead: false,
    socialAccount: {
      id: 'acc-1',
      encryptedAccessToken: 'enc:token',
    },
  };

  beforeEach(async () => {
    prisma = {
      socialInteraction: {
        findMany: jest.fn(),
        findFirst: jest.fn(),
        count: jest.fn(),
        update: jest.fn(),
      },
      interactionReplyAttempt: {
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      interactionNote: {
        create: jest.fn(),
        findMany: jest.fn(),
      },
      inboxNotification: {
        create: jest.fn(),
        findMany: jest.fn(),
        findFirst: jest.fn(),
        update: jest.fn(),
      },
      workspaceMember: {
        findUnique: jest.fn(),
      },
      auditLog: {
        create: jest.fn().mockResolvedValue({}),
      },
    };

    tokenVault = {
      decrypt: jest.fn().mockReturnValue('decrypted-token'),
    };

    adapterFactory = {
      getAdapter: jest.fn().mockReturnValue(mockAdapter),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InboxService,
        { provide: PrismaService, useValue: prisma },
        { provide: TokenVaultService, useValue: tokenVault },
        { provide: InboxAdapterFactory, useValue: adapterFactory },
      ],
    }).compile();

    service = module.get<InboxService>(InboxService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('listInteractions', () => {
    it('returns interactions with pagination and counts', async () => {
      prisma.socialInteraction.findMany.mockResolvedValue([sampleInteraction]);
      prisma.socialInteraction.count
        .mockResolvedValueOnce(1) // total
        .mockResolvedValueOnce(1) // unread
        .mockResolvedValueOnce(1) // open
        .mockResolvedValueOnce(0); // assignedToMe

      const result = await service.listInteractions('ws-1', { page: 1, limit: 10 }, sampleUser as any);

      expect(result.items).toHaveLength(1);
      expect(result.pagination.total).toBe(1);
      expect(result.counts.unread).toBe(1);
    });
  });

  describe('getInteractionById', () => {
    it('enforces workspace isolation and throws NotFoundException when accessing other workspace', async () => {
      prisma.socialInteraction.findFirst.mockResolvedValue(null);

      await expect(service.getInteractionById('ws-1', 'int-other')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('returns interaction with thread replies when found', async () => {
      prisma.socialInteraction.findFirst.mockResolvedValue(sampleInteraction);
      prisma.socialInteraction.findMany.mockResolvedValue([]);

      const result = await service.getInteractionById('ws-1', 'int-1');
      expect(result.id).toBe('int-1');
      expect(result.threadReplies).toEqual([]);
    });
  });

  describe('postReply', () => {
    it('returns existing attempt if idempotency key was already SENT', async () => {
      prisma.socialInteraction.findFirst.mockResolvedValue(sampleInteraction);
      prisma.interactionReplyAttempt.findUnique.mockResolvedValue({
        id: 'attempt-1',
        status: ReplyAttemptStatus.SENT,
      });

      const result = await service.postReply(
        'ws-1',
        'int-1',
        { content: 'Yes we do!', idempotencyKey: '7c9b6679-7425-40de-944b-e07fc1f90ae7' },
        sampleUser as any,
      );

      expect(result.success).toBe(true);
      expect(result.message).toContain('idempotent duplicate');
      expect(mockAdapter.postReply).not.toHaveBeenCalled();
    });

    it('publishes reply, updates attempt to SENT, and marks interaction RESOLVED', async () => {
      prisma.socialInteraction.findFirst.mockResolvedValue(sampleInteraction);
      prisma.interactionReplyAttempt.findUnique.mockResolvedValue(null);
      prisma.interactionReplyAttempt.create.mockResolvedValue({ id: 'attempt-new' });

      mockAdapter.postReply.mockResolvedValue({
        success: true,
        outcome: 'SUCCESS',
        externalReplyId: 'fb-reply-99',
      });

      prisma.interactionReplyAttempt.update.mockResolvedValue({
        id: 'attempt-new',
        status: ReplyAttemptStatus.SENT,
        externalReplyId: 'fb-reply-99',
      });

      const result = await service.postReply(
        'ws-1',
        'int-1',
        { content: 'Yes, international shipping is available!', idempotencyKey: '7c9b6679-7425-40de-944b-e07fc1f90ae7' },
        sampleUser as any,
      );

      expect(result.success).toBe(true);
      expect(prisma.socialInteraction.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'int-1' },
          data: expect.objectContaining({
            workflowStatus: InteractionWorkflowStatus.RESOLVED,
            isRead: true,
          }),
        }),
      );
      expect(prisma.auditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            action: 'INBOX_REPLY_POSTED',
          }),
        }),
      );
    });

    it('handles ambiguous timeout gracefully without throwing', async () => {
      prisma.socialInteraction.findFirst.mockResolvedValue(sampleInteraction);
      prisma.interactionReplyAttempt.findUnique.mockResolvedValue(null);
      prisma.interactionReplyAttempt.create.mockResolvedValue({ id: 'attempt-timeout' });

      mockAdapter.postReply.mockResolvedValue({
        success: false,
        outcome: 'AMBIGUOUS_TIMEOUT',
        sanitizedErrorMessage: 'Request timed out after submission.',
      });

      prisma.interactionReplyAttempt.update.mockResolvedValue({
        id: 'attempt-timeout',
        status: ReplyAttemptStatus.AMBIGUOUS_TIMEOUT,
      });

      const result = await service.postReply(
        'ws-1',
        'int-1',
        { content: 'Testing timeout', idempotencyKey: '7c9b6679-7425-40de-944b-e07fc1f90ae8' },
        sampleUser as any,
      );

      expect(result.success).toBe(false);
      expect(result.ambiguous).toBe(true);
      expect(prisma.inboxNotification.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            type: 'REPLY_AMBIGUOUS_TIMEOUT',
          }),
        }),
      );
    });
  });

  describe('assignInteraction', () => {
    it('rejects assignment if target user is not an active workspace member', async () => {
      prisma.socialInteraction.findFirst.mockResolvedValue(sampleInteraction);
      prisma.workspaceMember.findUnique.mockResolvedValue(null); // not a member

      await expect(
        service.assignInteraction(
          'ws-1',
          'int-1',
          { assignedToUserId: 'user-stranger' },
          sampleUser as any,
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('assigns interaction to active workspace member and creates notification', async () => {
      prisma.socialInteraction.findFirst.mockResolvedValue(sampleInteraction);
      prisma.workspaceMember.findUnique.mockResolvedValue({
        status: 'ACTIVE',
        user: { id: 'user-member-2', name: 'Support Rep', email: 'rep@example.com' },
      });
      prisma.socialInteraction.update.mockResolvedValue({ id: 'int-1', assignedToUserId: 'user-member-2' });

      const result = await service.assignInteraction(
        'ws-1',
        'int-1',
        { assignedToUserId: 'user-member-2' },
        sampleUser as any,
      );

      expect(prisma.socialInteraction.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            assignedToUserId: 'user-member-2',
            workflowStatus: InteractionWorkflowStatus.ASSIGNED,
          }),
        }),
      );
      expect(prisma.inboxNotification.create).toHaveBeenCalled();
      expect(prisma.auditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            action: 'INBOX_INTERACTION_ASSIGNED',
          }),
        }),
      );
    });
  });

  describe('addNote', () => {
    it('adds internal note and writes audit log', async () => {
      prisma.socialInteraction.findFirst.mockResolvedValue(sampleInteraction);
      prisma.interactionNote.create.mockResolvedValue({ id: 'note-1', content: 'Customer called via phone' });

      const note = await service.addNote(
        'ws-1',
        'int-1',
        { content: 'Customer called via phone' },
        sampleUser as any,
      );

      expect(note.id).toBe('note-1');
      expect(prisma.auditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            action: 'INBOX_NOTE_ADDED',
          }),
        }),
      );
    });
  });
});
