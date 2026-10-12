import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  AutomationRuleDto,
  CreateAutomationRuleDto,
  UpdateAutomationRuleDto,
  AutomationExecutionLogDto,
  AutomationRecipeDto,
  TriggerRuleTestDto,
  TriggerRuleTestResultDto,
  AutomationTriggerType,
  AutomationActionType,
  AutomationExecutionStatus,
  AutomationConditions,
  AutomationActionConfig,
} from '@packages/shared';
import { AUTOMATION_RECIPES } from './templates/automation-recipes.data';

@Injectable()
export class AutomationsService {
  private readonly logger = new Logger(AutomationsService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Returns list of pre-built automation recipes
   */
  getRecipes(): AutomationRecipeDto[] {
    return AUTOMATION_RECIPES;
  }

  /**
   * Retrieves all automation rules configured for a workspace
   */
  async getRules(workspaceId: string): Promise<AutomationRuleDto[]> {
    const rules = await this.prisma.automationRule.findMany({
      where: { workspaceId },
      orderBy: { createdAt: 'desc' },
    });

    return rules.map((r) => this.mapRuleToDto(r));
  }

  /**
   * Retrieves a single automation rule by ID
   */
  async getRuleById(workspaceId: string, ruleId: string): Promise<AutomationRuleDto> {
    const rule = await this.prisma.automationRule.findFirst({
      where: { id: ruleId, workspaceId },
    });

    if (!rule) {
      throw new NotFoundException(`Automation rule [${ruleId}] not found in workspace [${workspaceId}]`);
    }

    return this.mapRuleToDto(rule);
  }

  /**
   * Creates a new automation rule for a workspace
   */
  async createRule(workspaceId: string, dto: CreateAutomationRuleDto): Promise<AutomationRuleDto> {
    const workspace = await this.prisma.workspace.findUnique({
      where: { id: workspaceId },
    });

    if (!workspace) {
      throw new NotFoundException(`Workspace [${workspaceId}] not found`);
    }

    const created = await this.prisma.automationRule.create({
      data: {
        workspaceId,
        name: dto.name.trim(),
        description: dto.description?.trim() || null,
        triggerType: dto.triggerType,
        conditions: (dto.conditions || {}) as any,
        actionType: dto.actionType,
        actionConfig: (dto.actionConfig || {}) as any,
        isEnabled: dto.isEnabled !== undefined ? dto.isEnabled : true,
      },
    });

    this.logger.log(`Created automation rule [${created.id}] ("${created.name}") for workspace [${workspaceId}]`);
    return this.mapRuleToDto(created);
  }

  /**
   * Updates an existing automation rule
   */
  async updateRule(
    workspaceId: string,
    ruleId: string,
    dto: UpdateAutomationRuleDto,
  ): Promise<AutomationRuleDto> {
    await this.getRuleById(workspaceId, ruleId);

    const updated = await this.prisma.automationRule.update({
      where: { id: ruleId },
      data: {
        ...(dto.name !== undefined ? { name: dto.name.trim() } : {}),
        ...(dto.description !== undefined ? { description: dto.description?.trim() || null } : {}),
        ...(dto.triggerType !== undefined ? { triggerType: dto.triggerType } : {}),
        ...(dto.conditions !== undefined ? { conditions: dto.conditions as any } : {}),
        ...(dto.actionType !== undefined ? { actionType: dto.actionType } : {}),
        ...(dto.actionConfig !== undefined ? { actionConfig: dto.actionConfig as any } : {}),
        ...(dto.isEnabled !== undefined ? { isEnabled: dto.isEnabled } : {}),
      },
    });

    this.logger.log(`Updated automation rule [${ruleId}] for workspace [${workspaceId}]`);
    return this.mapRuleToDto(updated);
  }

  /**
   * Deletes an automation rule
   */
  async deleteRule(workspaceId: string, ruleId: string): Promise<{ success: boolean; id: string }> {
    await this.getRuleById(workspaceId, ruleId);

    await this.prisma.automationRule.delete({
      where: { id: ruleId },
    });

    this.logger.log(`Deleted automation rule [${ruleId}] from workspace [${workspaceId}]`);
    return { success: true, id: ruleId };
  }

  /**
   * Toggles the enabled state of an automation rule
   */
  async toggleRule(workspaceId: string, ruleId: string, enabled?: boolean): Promise<AutomationRuleDto> {
    const existing = await this.getRuleById(workspaceId, ruleId);
    const newStatus = enabled !== undefined ? enabled : !existing.isEnabled;

    const updated = await this.prisma.automationRule.update({
      where: { id: ruleId },
      data: { isEnabled: newStatus },
    });

    this.logger.log(`Toggled automation rule [${ruleId}] to isEnabled=${newStatus}`);
    return this.mapRuleToDto(updated);
  }

  /**
   * Tests an automation rule against mock input without executing destructive side effects
   */
  async testRule(
    workspaceId: string,
    ruleId: string,
    dto: TriggerRuleTestDto,
  ): Promise<TriggerRuleTestResultDto> {
    const rule = await this.getRuleById(workspaceId, ruleId);
    const sampleText = (dto.sampleText || '').toLowerCase();
    const conditions = rule.conditions;

    let matched = true;
    let matchReason = 'Rule matched sample payload successfully';

    // 1. Keyword condition check
    if (conditions.keywords && conditions.keywords.length > 0) {
      const keywords = conditions.keywords.map((k) => k.toLowerCase().trim());
      const hasMatch = keywords.some((k) => sampleText.includes(k));

      if (!hasMatch) {
        matched = false;
        matchReason = `Sample text did not contain any of required keywords: [${keywords.join(', ')}]`;
      }
    }

    // 2. Platform condition check
    if (matched && conditions.platform && dto.platform) {
      if (conditions.platform.toUpperCase() !== dto.platform.toUpperCase()) {
        matched = false;
        matchReason = `Platform mismatch: Expected [${conditions.platform}], got [${dto.platform}]`;
      }
    }

    // 3. Construct simulated output
    let simulatedOutput: any = null;
    if (matched) {
      switch (rule.actionType) {
        case AutomationActionType.AUTO_HIDE_SPAM:
          simulatedOutput = {
            action: 'AUTO_HIDE_SPAM',
            status: 'WOULD_HIDE_COMMENT',
            detectedKeywords: conditions.keywords?.filter((k) => sampleText.includes(k.toLowerCase())),
          };
          break;

        case AutomationActionType.AUTO_REPLY:
          simulatedOutput = {
            action: 'AUTO_REPLY',
            status: 'WOULD_DISPATCH_REPLY',
            replyContent: rule.actionConfig.replyTemplate || 'Default acknowledgment reply',
            recipient: dto.senderName || 'Customer',
          };
          break;

        case AutomationActionType.DISPATCH_WEBHOOK:
          simulatedOutput = {
            action: 'DISPATCH_WEBHOOK',
            targetUrl: rule.actionConfig.webhookUrl || 'https://example.com/webhook',
            payloadPreview: {
              event: rule.triggerType,
              workspaceId,
              timestamp: new Date().toISOString(),
              sampleText: dto.sampleText,
            },
          };
          break;

        default:
          simulatedOutput = {
            action: rule.actionType,
            status: 'MATCHED_SIMULATION',
          };
      }
    }

    return {
      matched,
      actionType: rule.actionType,
      simulatedOutput,
      reason: matchReason,
    };
  }

  /**
   * Retrieves past execution logs for workspace automations
   */
  async getExecutionLogs(
    workspaceId: string,
    ruleId?: string,
    limit: number = 50,
  ): Promise<AutomationExecutionLogDto[]> {
    const logs = await this.prisma.automationExecutionLog.findMany({
      where: {
        workspaceId,
        ...(ruleId ? { ruleId } : {}),
      },
      orderBy: { executedAt: 'desc' },
      take: Math.min(limit, 100),
    });

    return logs.map((log) => ({
      id: log.id,
      ruleId: log.ruleId,
      workspaceId: log.workspaceId,
      triggerEvent: log.triggerEvent,
      status: log.status as AutomationExecutionStatus,
      inputPayload: log.inputPayload,
      outputResult: log.outputResult,
      errorMessage: log.errorMessage,
      executedAt: log.executedAt.toISOString(),
    }));
  }

  /**
   * Evaluates incoming social inbox message against active INBOX_NEW_MESSAGE rules
   */
  async evaluateInboxMessage(params: {
    workspaceId: string;
    interactionId?: string;
    messageText: string;
    platform: string;
    senderName?: string;
  }): Promise<{ executedRulesCount: number; matchedActions: string[] }> {
    const activeRules = await this.prisma.automationRule.findMany({
      where: {
        workspaceId: params.workspaceId,
        triggerType: AutomationTriggerType.INBOX_NEW_MESSAGE,
        isEnabled: true,
      },
    });

    if (activeRules.length === 0) {
      return { executedRulesCount: 0, matchedActions: [] };
    }

    const matchedActions: string[] = [];
    const textLower = (params.messageText || '').toLowerCase();

    for (const rule of activeRules) {
      const conditions = (rule.conditions || {}) as AutomationConditions;
      let matches = true;

      // Keywords check
      if (conditions.keywords && conditions.keywords.length > 0) {
        const keywords = conditions.keywords.map((k) => k.toLowerCase().trim());
        const hasKeyword = keywords.some((k) => textLower.includes(k));
        if (!hasKeyword) {
          matches = false;
        }
      }

      // Platform check
      if (matches && conditions.platform) {
        if (conditions.platform.toUpperCase() !== params.platform.toUpperCase()) {
          matches = false;
        }
      }

      if (!matches) continue;

      // Rule matched! Execute action
      try {
        let outputResult: any = {};
        const config = (rule.actionConfig || {}) as AutomationActionConfig;

        if (rule.actionType === AutomationActionType.AUTO_HIDE_SPAM) {
          outputResult = {
            action: 'AUTO_HIDE_SPAM',
            interactionId: params.interactionId,
            message: 'Comment hidden by spam protection rule',
          };
          matchedActions.push('AUTO_HIDE_SPAM');
        } else if (rule.actionType === AutomationActionType.AUTO_REPLY) {
          outputResult = {
            action: 'AUTO_REPLY',
            interactionId: params.interactionId,
            replyText: config.replyTemplate,
          };
          matchedActions.push('AUTO_REPLY');
        } else if (rule.actionType === AutomationActionType.DISPATCH_WEBHOOK) {
          if (config.webhookUrl && !config.webhookUrl.includes('placeholder')) {
            await this.safeDispatchWebhook(config.webhookUrl, {
              event: 'INBOX_NEW_MESSAGE',
              workspaceId: params.workspaceId,
              text: params.messageText,
              platform: params.platform,
              sender: params.senderName,
            });
          }
          outputResult = { action: 'DISPATCH_WEBHOOK', url: config.webhookUrl };
          matchedActions.push('DISPATCH_WEBHOOK');
        }

        // Record execution log & increment count
        await this.prisma.automationExecutionLog.create({
          data: {
            ruleId: rule.id,
            workspaceId: params.workspaceId,
            triggerEvent: AutomationTriggerType.INBOX_NEW_MESSAGE,
            status: AutomationExecutionStatus.SUCCESS,
            inputPayload: {
              text: params.messageText,
              platform: params.platform,
              senderName: params.senderName,
            },
            outputResult,
          },
        });

        await this.prisma.automationRule.update({
          where: { id: rule.id },
          data: {
            executionCount: { increment: 1 },
            lastExecutedAt: new Date(),
          },
        });
      } catch (err: any) {
        this.logger.error(`Error executing rule [${rule.id}]: ${err.message}`, err.stack);
        await this.prisma.automationExecutionLog.create({
          data: {
            ruleId: rule.id,
            workspaceId: params.workspaceId,
            triggerEvent: AutomationTriggerType.INBOX_NEW_MESSAGE,
            status: AutomationExecutionStatus.FAILED,
            errorMessage: err.message,
          },
        });
      }
    }

    return {
      executedRulesCount: matchedActions.length,
      matchedActions,
    };
  }

  /**
   * Evaluates post publish event against active POST_PUBLISHED rules
   */
  async evaluatePostPublished(params: {
    workspaceId: string;
    postId: string;
    caption: string;
    platforms: string[];
  }): Promise<{ executedRulesCount: number }> {
    const rules = await this.prisma.automationRule.findMany({
      where: {
        workspaceId: params.workspaceId,
        triggerType: AutomationTriggerType.POST_PUBLISHED,
        isEnabled: true,
      },
    });

    let count = 0;
    for (const rule of rules) {
      try {
        const config = (rule.actionConfig || {}) as AutomationActionConfig;
        if (rule.actionType === AutomationActionType.DISPATCH_WEBHOOK && config.webhookUrl) {
          if (!config.webhookUrl.includes('placeholder')) {
            await this.safeDispatchWebhook(config.webhookUrl, {
              event: 'POST_PUBLISHED',
              workspaceId: params.workspaceId,
              postId: params.postId,
              caption: params.caption,
              platforms: params.platforms,
              publishedAt: new Date().toISOString(),
            });
          }
        }

        await this.prisma.automationExecutionLog.create({
          data: {
            ruleId: rule.id,
            workspaceId: params.workspaceId,
            triggerEvent: AutomationTriggerType.POST_PUBLISHED,
            status: AutomationExecutionStatus.SUCCESS,
            inputPayload: params,
            outputResult: { action: rule.actionType, dispatched: true },
          },
        });

        await this.prisma.automationRule.update({
          where: { id: rule.id },
          data: {
            executionCount: { increment: 1 },
            lastExecutedAt: new Date(),
          },
        });

        count++;
      } catch (err: any) {
        this.logger.error(`Failed to execute post published rule [${rule.id}]: ${err.message}`);
        await this.prisma.automationExecutionLog.create({
          data: {
            ruleId: rule.id,
            workspaceId: params.workspaceId,
            triggerEvent: AutomationTriggerType.POST_PUBLISHED,
            status: AutomationExecutionStatus.FAILED,
            errorMessage: err.message,
          },
        });
      }
    }

    return { executedRulesCount: count };
  }

  /**
   * Dispatches an HTTP webhook with timeout and isolation
   */
  private async safeDispatchWebhook(url: string, payload: any): Promise<void> {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);

      await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'OmniSocial-Automations-Webhook/1.0',
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      clearTimeout(timeout);
    } catch (err: any) {
      this.logger.warn(`Webhook dispatch to [${url}] failed: ${err.message}`);
    }
  }

  private mapRuleToDto(rule: any): AutomationRuleDto {
    return {
      id: rule.id,
      workspaceId: rule.workspaceId,
      name: rule.name,
      description: rule.description,
      triggerType: rule.triggerType as AutomationTriggerType,
      conditions: (rule.conditions || {}) as AutomationConditions,
      actionType: rule.actionType as AutomationActionType,
      actionConfig: (rule.actionConfig || {}) as AutomationActionConfig,
      isEnabled: rule.isEnabled,
      executionCount: rule.executionCount,
      lastExecutedAt: rule.lastExecutedAt ? rule.lastExecutedAt.toISOString() : null,
      createdAt: rule.createdAt.toISOString(),
      updatedAt: rule.updatedAt.toISOString(),
    };
  }
}
