import { Test, TestingModule } from '@nestjs/testing';
import { InboxModerationService } from './inbox-moderation.service';
import { PrismaService } from '../../prisma/prisma.service';
import { NotFoundException } from '@nestjs/common';
import { InboxModerationAction } from '@packages/shared';

describe('InboxModerationService', () => {
  let service: InboxModerationService;
  let prisma: any;

  const mockWorkspaceId = 'ws-mod-111';
  const mockRuleId = 'rule-mod-222';
  const mockTemplateId = 'tmpl-mod-333';
  const mockInteractionId = 'inter-mod-444';

  const mockRule = {
    id: mockRuleId,
    workspaceId: mockWorkspaceId,
    name: 'Profanity & Crisis Auto-Flag',
    description: 'Flags urgent escalations',
    triggerSentiment: 'ALL',
    keywords: ['scam', 'lawsuit', 'terrible', 'fraud'],
    action: 'AUTO_FLAG',
    actionPayload: {},
    isEnabled: true,
    priority: 10,
    executionCount: 0,
    lastTriggeredAt: null,
    createdAt: new Date('2026-06-01T00:00:00Z'),
    updatedAt: new Date('2026-06-01T00:00:00Z'),
  };

  const mockTemplate = {
    id: mockTemplateId,
    workspaceId: mockWorkspaceId,
    title: 'Apology & Support Ticket',
    content: 'We sincerely apologize for the inconvenience. Our team is investigating.',
    category: 'SUPPORT',
    sentimentMatch: 'NEGATIVE',
    usageCount: 5,
    createdAt: new Date('2026-06-01T00:00:00Z'),
    updatedAt: new Date('2026-06-01T00:00:00Z'),
  };

  const mockInteraction = {
    id: mockInteractionId,
    workspaceId: mockWorkspaceId,
    content: 'This service is an absolute fraud and scam! Where is my order?',
    workflowStatus: 'OPEN',
    rawMetadata: { sentiment: 'NEGATIVE' },
  };

  beforeEach(async () => {
    prisma = {
      inboxModerationRule: {
        create: jest.fn(),
        findMany: jest.fn(),
        findFirst: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      inboxAutoReplyTemplate: {
        create: jest.fn(),
        findMany: jest.fn(),
        findFirst: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      socialInteraction: {
        findFirst: jest.fn(),
        update: jest.fn(),
      },
      workspaceMember: {
        findFirst: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InboxModerationService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<InboxModerationService>(InboxModerationService);
  });

  describe('Rules Management', () => {
    it('creates a new moderation rule', async () => {
      prisma.inboxModerationRule.create.mockResolvedValue(mockRule);

      const result = await service.createRule(mockWorkspaceId, {
        name: 'Profanity & Crisis Auto-Flag',
        action: InboxModerationAction.AUTO_FLAG,
        keywords: ['scam', 'fraud'],
      });

      expect(prisma.inboxModerationRule.create).toHaveBeenCalled();
      expect(result.name).toBe('Profanity & Crisis Auto-Flag');
      expect(result.action).toBe(InboxModerationAction.AUTO_FLAG);
    });

    it('lists moderation rules for workspace', async () => {
      prisma.inboxModerationRule.findMany.mockResolvedValue([mockRule]);

      const result = await service.getRules(mockWorkspaceId);

      expect(result.length).toBe(1);
      expect(result[0].id).toBe(mockRuleId);
    });
  });

  describe('Templates Management', () => {
    it('creates an auto-reply template', async () => {
      prisma.inboxAutoReplyTemplate.create.mockResolvedValue(mockTemplate);

      const result = await service.createTemplate(mockWorkspaceId, {
        title: 'Apology & Support Ticket',
        content: 'We sincerely apologize...',
        category: 'SUPPORT',
      });

      expect(prisma.inboxAutoReplyTemplate.create).toHaveBeenCalled();
      expect(result.title).toBe('Apology & Support Ticket');
    });

    it('lists templates with optional category filter', async () => {
      prisma.inboxAutoReplyTemplate.findMany.mockResolvedValue([mockTemplate]);

      const result = await service.getTemplates(mockWorkspaceId, 'SUPPORT');

      expect(prisma.inboxAutoReplyTemplate.findMany).toHaveBeenCalledWith({
        where: { workspaceId: mockWorkspaceId, category: 'SUPPORT' },
        orderBy: { createdAt: 'desc' },
      });
      expect(result.length).toBe(1);
    });
  });

  describe('Triage Evaluation Engine', () => {
    it('triggers AUTO_FLAG when interaction contains flagged keywords', async () => {
      prisma.socialInteraction.findFirst.mockResolvedValue(mockInteraction);
      prisma.inboxModerationRule.findMany.mockResolvedValue([mockRule]);
      prisma.inboxModerationRule.update.mockResolvedValue({ ...mockRule, executionCount: 1 });
      prisma.socialInteraction.update.mockResolvedValue({
        ...mockInteraction,
        workflowStatus: 'IN_PROGRESS',
      });

      const result = await service.evaluateInteraction(mockWorkspaceId, mockInteractionId);

      expect(prisma.inboxModerationRule.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: mockRuleId },
        }),
      );
      expect(prisma.socialInteraction.update).toHaveBeenCalledWith({
        where: { id: mockInteractionId },
        data: expect.objectContaining({
          workflowStatus: 'IN_PROGRESS',
        }),
      });
      expect(result.matchedRuleId).toBe(mockRuleId);
      expect(result.actionTaken).toBe(InboxModerationAction.AUTO_FLAG);
      expect(result.flagged).toBe(true);
    });

    it('triggers ASSIGN_TO_ROLE and sets assignedToUserId', async () => {
      const assignRule = {
        ...mockRule,
        id: 'rule-assign',
        name: 'VIP Escalate',
        action: 'ASSIGN_TO_ROLE',
        actionPayload: { targetRole: 'ADMIN' },
        keywords: ['fraud'],
      };

      prisma.socialInteraction.findFirst.mockResolvedValue(mockInteraction);
      prisma.inboxModerationRule.findMany.mockResolvedValue([assignRule]);
      prisma.workspaceMember.findFirst.mockResolvedValue({
        userId: 'admin-user-777',
        role: 'ADMIN',
      });
      prisma.inboxModerationRule.update.mockResolvedValue(assignRule);
      prisma.socialInteraction.update.mockResolvedValue(mockInteraction);

      const result = await service.evaluateInteraction(mockWorkspaceId, mockInteractionId);

      expect(result.actionTaken).toBe(InboxModerationAction.ASSIGN_TO_ROLE);
      expect(result.assignedUserId).toBe('admin-user-777');
      expect(prisma.socialInteraction.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            workflowStatus: 'ASSIGNED',
            assignedToUserId: 'admin-user-777',
          }),
        }),
      );
    });

    it('returns NONE when no rules match the interaction content', async () => {
      prisma.socialInteraction.findFirst.mockResolvedValue({
        ...mockInteraction,
        content: 'Love your product! Great customer service!',
      });
      prisma.inboxModerationRule.findMany.mockResolvedValue([mockRule]);

      const result = await service.evaluateInteraction(mockWorkspaceId, mockInteractionId);

      expect(result.actionTaken).toBe('NONE');
      expect(result.matchedRuleId).toBeNull();
      expect(prisma.socialInteraction.update).not.toHaveBeenCalled();
    });

    it('throws NotFoundException if interaction does not exist', async () => {
      prisma.socialInteraction.findFirst.mockResolvedValue(null);

      await expect(
        service.evaluateInteraction(mockWorkspaceId, 'fake-id'),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
