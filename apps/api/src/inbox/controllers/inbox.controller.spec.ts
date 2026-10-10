import { Test, TestingModule } from '@nestjs/testing';
import { InboxController } from './inbox.controller';
import { InboxService } from '../services/inbox.service';
import { InboxSyncService } from '../services/inbox-sync.service';
import { ForbiddenException } from '@nestjs/common';
import { WorkspaceRole, InteractionWorkflowStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

describe('InboxController', () => {
  let controller: InboxController;
  let inboxService: any;
  let syncService: any;

  beforeEach(async () => {
    inboxService = {
      listInteractions: jest.fn().mockResolvedValue({ items: [], pagination: {}, counts: {} }),
      getInteractionById: jest.fn().mockResolvedValue({ id: 'int-1' }),
      postReply: jest.fn().mockResolvedValue({ success: true, message: 'Reply sent', attempt: {} }),
      updateWorkflowStatus: jest.fn().mockResolvedValue({ id: 'int-1', workflowStatus: 'RESOLVED' }),
      assignInteraction: jest.fn().mockResolvedValue({ id: 'int-1', assignedToUserId: 'user-2' }),
      markRead: jest.fn().mockResolvedValue({ id: 'int-1', isRead: true }),
      addNote: jest.fn().mockResolvedValue({ id: 'note-1' }),
      listNotes: jest.fn().mockResolvedValue([]),
      listNotifications: jest.fn().mockResolvedValue([]),
      markNotificationRead: jest.fn().mockResolvedValue({ id: 'notif-1' }),
    };

    syncService = {
      syncWorkspaceInteractions: jest.fn().mockResolvedValue({
        success: true,
        totalNew: 2,
        totalUpdated: 1,
        accounts: [],
      }),
      getSyncStatus: jest.fn().mockResolvedValue([]),
    };

    const mockPrismaService = {
      workspaceMember: { findUnique: jest.fn() },
      workspace: { findUnique: jest.fn() },
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [InboxController],
      providers: [
        { provide: InboxService, useValue: inboxService },
        { provide: InboxSyncService, useValue: syncService },
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    controller = module.get<InboxController>(InboxController);
  });

  describe('listInteractions', () => {
    it('returns envelope with items, pagination, and counts', async () => {
      const res = await controller.listInteractions('ws-1', {}, { user: { id: 'u-1' } });
      expect(res.success).toBe(true);
      expect(inboxService.listInteractions).toHaveBeenCalledWith('ws-1', {}, { id: 'u-1' });
    });
  });

  describe('syncInteractions', () => {
    it('rejects force-refresh if requester is not an ADMIN or OWNER', async () => {
      const req = {
        workspaceMember: { role: WorkspaceRole.EDITOR },
      };

      await expect(
        controller.syncInteractions('ws-1', { force: true }, req),
      ).rejects.toThrow(ForbiddenException);
    });

    it('allows force-refresh for OWNER', async () => {
      const req = {
        workspaceMember: { role: WorkspaceRole.OWNER },
      };

      const res = await controller.syncInteractions('ws-1', { force: true }, req);
      expect(res.success).toBe(true);
      expect(syncService.syncWorkspaceInteractions).toHaveBeenCalledWith('ws-1', {
        accountId: undefined,
        force: true,
      });
    });
  });
});
