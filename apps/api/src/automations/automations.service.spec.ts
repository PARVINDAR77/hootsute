import { Test, TestingModule } from '@nestjs/testing';
import { AutomationsService } from './automations.service';
import { PrismaService } from '../prisma/prisma.service';
import {
  AutomationTriggerType,
  AutomationActionType,
  AutomationExecutionStatus,
} from '@packages/shared';
import { NotFoundException } from '@nestjs/common';

describe('AutomationsService', () => {
  let service: AutomationsService;
  let prisma: any;

  beforeEach(async () => {
    prisma = {
      workspace: {
        findUnique: jest.fn(),
      },
      automationRule: {
        findMany: jest.fn(),
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      automationExecutionLog: {
        findMany: jest.fn(),
        create: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AutomationsService,
        {
          provide: PrismaService,
          useValue: prisma,
        },
      ],
    }).compile();

    service = module.get<AutomationsService>(AutomationsService);
  });

  describe('getRecipes', () => {
    it('should return pre-built automation recipes', () => {
      const recipes = service.getRecipes();
      expect(recipes.length).toBeGreaterThanOrEqual(4);
      expect(recipes.some((r) => r.id === 'recipe-spam-shield')).toBe(true);
      expect(recipes.some((r) => r.id === 'recipe-lead-responder')).toBe(true);
    });
  });

  describe('createRule', () => {
    it('should create an automation rule in the database', async () => {
      prisma.workspace.findUnique.mockResolvedValue({ id: 'ws-1', name: 'Omni Workspace' });
      prisma.automationRule.create.mockResolvedValue({
        id: 'rule-1',
        workspaceId: 'ws-1',
        name: 'Spam Filter',
        description: 'Auto-hides spam',
        triggerType: AutomationTriggerType.INBOX_NEW_MESSAGE,
        conditions: { keywords: ['crypto'] },
        actionType: AutomationActionType.AUTO_HIDE_SPAM,
        actionConfig: {},
        isEnabled: true,
        executionCount: 0,
        lastExecutedAt: null,
        createdAt: new Date('2026-10-12T00:00:00Z'),
        updatedAt: new Date('2026-10-12T00:00:00Z'),
      });

      const result = await service.createRule('ws-1', {
        name: 'Spam Filter',
        description: 'Auto-hides spam',
        triggerType: AutomationTriggerType.INBOX_NEW_MESSAGE,
        conditions: { keywords: ['crypto'] },
        actionType: AutomationActionType.AUTO_HIDE_SPAM,
        actionConfig: {},
      });

      expect(result.id).toBe('rule-1');
      expect(result.name).toBe('Spam Filter');
      expect(prisma.automationRule.create).toHaveBeenCalled();
    });

    it('should throw NotFoundException if workspace does not exist', async () => {
      prisma.workspace.findUnique.mockResolvedValue(null);
      await expect(
        service.createRule('ws-missing', {
          name: 'Test Rule',
          triggerType: AutomationTriggerType.INBOX_NEW_MESSAGE,
          conditions: {},
          actionType: AutomationActionType.AUTO_REPLY,
          actionConfig: {},
        }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateRule & deleteRule', () => {
    it('should update rule properties', async () => {
      prisma.automationRule.findFirst.mockResolvedValue({
        id: 'rule-1',
        workspaceId: 'ws-1',
        name: 'Old Name',
        triggerType: AutomationTriggerType.INBOX_NEW_MESSAGE,
        conditions: {},
        actionType: AutomationActionType.AUTO_REPLY,
        actionConfig: {},
        isEnabled: true,
        executionCount: 0,
        lastExecutedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      prisma.automationRule.update.mockResolvedValue({
        id: 'rule-1',
        workspaceId: 'ws-1',
        name: 'New Name',
        triggerType: AutomationTriggerType.INBOX_NEW_MESSAGE,
        conditions: {},
        actionType: AutomationActionType.AUTO_REPLY,
        actionConfig: {},
        isEnabled: true,
        executionCount: 0,
        lastExecutedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const updated = await service.updateRule('ws-1', 'rule-1', { name: 'New Name' });
      expect(updated.name).toBe('New Name');
    });

    it('should delete rule', async () => {
      prisma.automationRule.findFirst.mockResolvedValue({
        id: 'rule-1',
        workspaceId: 'ws-1',
        triggerType: AutomationTriggerType.INBOX_NEW_MESSAGE,
        conditions: {},
        actionType: AutomationActionType.AUTO_REPLY,
        actionConfig: {},
        isEnabled: true,
        executionCount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      prisma.automationRule.delete.mockResolvedValue({});

      const res = await service.deleteRule('ws-1', 'rule-1');
      expect(res.success).toBe(true);
      expect(prisma.automationRule.delete).toHaveBeenCalledWith({ where: { id: 'rule-1' } });
    });
  });

  describe('toggleRule', () => {
    it('should invert rule enabled state', async () => {
      prisma.automationRule.findFirst.mockResolvedValue({
        id: 'rule-1',
        workspaceId: 'ws-1',
        triggerType: AutomationTriggerType.INBOX_NEW_MESSAGE,
        conditions: {},
        actionType: AutomationActionType.AUTO_REPLY,
        actionConfig: {},
        isEnabled: true,
        executionCount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      prisma.automationRule.update.mockResolvedValue({
        id: 'rule-1',
        workspaceId: 'ws-1',
        triggerType: AutomationTriggerType.INBOX_NEW_MESSAGE,
        conditions: {},
        actionType: AutomationActionType.AUTO_REPLY,
        actionConfig: {},
        isEnabled: false,
        executionCount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const res = await service.toggleRule('ws-1', 'rule-1');
      expect(res.isEnabled).toBe(false);
    });
  });

  describe('testRule', () => {
    it('should match keywords and return simulation output', async () => {
      prisma.automationRule.findFirst.mockResolvedValue({
        id: 'rule-1',
        workspaceId: 'ws-1',
        name: 'Price Responder',
        triggerType: AutomationTriggerType.INBOX_NEW_MESSAGE,
        conditions: { keywords: ['price', 'cost'], platform: 'INSTAGRAM' },
        actionType: AutomationActionType.AUTO_REPLY,
        actionConfig: { replyTemplate: 'Check DM for prices!' },
        isEnabled: true,
        executionCount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const testResult = await service.testRule('ws-1', 'rule-1', {
        sampleText: 'What is the price of this product?',
        platform: 'INSTAGRAM',
        senderName: 'Rajesh',
      });

      expect(testResult.matched).toBe(true);
      expect(testResult.actionType).toBe(AutomationActionType.AUTO_REPLY);
      expect(testResult.simulatedOutput.replyContent).toBe('Check DM for prices!');
    });

    it('should report non-match if keywords do not match', async () => {
      prisma.automationRule.findFirst.mockResolvedValue({
        id: 'rule-1',
        workspaceId: 'ws-1',
        triggerType: AutomationTriggerType.INBOX_NEW_MESSAGE,
        conditions: { keywords: ['scam', 'crypto'] },
        actionType: AutomationActionType.AUTO_HIDE_SPAM,
        actionConfig: {},
        isEnabled: true,
        executionCount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const testResult = await service.testRule('ws-1', 'rule-1', {
        sampleText: 'Hello, great post today!',
      });

      expect(testResult.matched).toBe(false);
      expect(testResult.reason).toContain('did not contain any of required keywords');
    });
  });

  describe('evaluateInboxMessage', () => {
    it('should trigger AUTO_HIDE_SPAM action and record execution log', async () => {
      prisma.automationRule.findMany.mockResolvedValue([
        {
          id: 'rule-spam',
          workspaceId: 'ws-1',
          name: 'Spam Shield',
          triggerType: AutomationTriggerType.INBOX_NEW_MESSAGE,
          conditions: { keywords: ['whatsapp me', 'telegram'] },
          actionType: AutomationActionType.AUTO_HIDE_SPAM,
          actionConfig: {},
          isEnabled: true,
          executionCount: 5,
        },
      ]);
      prisma.automationExecutionLog.create.mockResolvedValue({});
      prisma.automationRule.update.mockResolvedValue({});

      const result = await service.evaluateInboxMessage({
        workspaceId: 'ws-1',
        interactionId: 'int-123',
        messageText: 'Earn $500 daily whatsapp me now!',
        platform: 'FACEBOOK',
        senderName: 'Spammer Bot',
      });

      expect(result.executedRulesCount).toBe(1);
      expect(result.matchedActions).toContain('AUTO_HIDE_SPAM');
      expect(prisma.automationExecutionLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            ruleId: 'rule-spam',
            status: AutomationExecutionStatus.SUCCESS,
          }),
        }),
      );
      expect(prisma.automationRule.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'rule-spam' },
          data: expect.objectContaining({
            executionCount: { increment: 1 },
          }),
        }),
      );
    });
  });

  describe('evaluatePostPublished', () => {
    it('should evaluate post published rules and record log', async () => {
      prisma.automationRule.findMany.mockResolvedValue([
        {
          id: 'rule-pub',
          workspaceId: 'ws-1',
          triggerType: AutomationTriggerType.POST_PUBLISHED,
          actionType: AutomationActionType.DISPATCH_WEBHOOK,
          actionConfig: { webhookUrl: 'https://hooks.slack.com/services/placeholder' },
          isEnabled: true,
        },
      ]);
      prisma.automationExecutionLog.create.mockResolvedValue({});
      prisma.automationRule.update.mockResolvedValue({});

      const result = await service.evaluatePostPublished({
        workspaceId: 'ws-1',
        postId: 'post-1',
        caption: 'Happy Independence Day!',
        platforms: ['FACEBOOK', 'INSTAGRAM'],
      });

      expect(result.executedRulesCount).toBe(1);
      expect(prisma.automationExecutionLog.create).toHaveBeenCalled();
    });
  });

  describe('getExecutionLogs', () => {
    it('should return past execution logs for workspace', async () => {
      prisma.automationExecutionLog.findMany.mockResolvedValue([
        {
          id: 'log-1',
          ruleId: 'rule-1',
          workspaceId: 'ws-1',
          triggerEvent: 'INBOX_NEW_MESSAGE',
          status: 'SUCCESS',
          inputPayload: { text: 'test' },
          outputResult: { action: 'AUTO_REPLY' },
          errorMessage: null,
          executedAt: new Date('2026-10-12T00:00:00Z'),
        },
      ]);

      const logs = await service.getExecutionLogs('ws-1');
      expect(logs).toHaveLength(1);
      expect(logs[0].status).toBe(AutomationExecutionStatus.SUCCESS);
    });
  });
});
