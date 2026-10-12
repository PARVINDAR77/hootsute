import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  CreateInboxModerationRuleDto,
  UpdateInboxModerationRuleDto,
  CreateInboxAutoReplyTemplateDto,
  UpdateInboxAutoReplyTemplateDto,
} from '../dto/inbox-moderation.dto';
import {
  InboxModerationRuleDto,
  InboxAutoReplyTemplateDto,
  InboxTriageResultDto,
  InboxModerationAction,
} from '@packages/shared';

@Injectable()
export class InboxModerationService {
  constructor(private readonly prisma: PrismaService) {}

  // ==========================================
  // 1. Moderation Rules CRUD
  // ==========================================

  async createRule(
    workspaceId: string,
    dto: CreateInboxModerationRuleDto,
  ): Promise<InboxModerationRuleDto> {
    const rule = await this.prisma.inboxModerationRule.create({
      data: {
        workspaceId,
        name: dto.name,
        description: dto.description || null,
        triggerSentiment: dto.triggerSentiment || 'ALL',
        keywords: dto.keywords || [],
        action: dto.action as any,
        actionPayload: (dto.actionPayload as any) || {},
        isEnabled: dto.isEnabled ?? true,
        priority: dto.priority ?? 0,
      },
    });

    return this.mapRuleToDto(rule);
  }

  async getRules(workspaceId: string): Promise<InboxModerationRuleDto[]> {
    const rules = await this.prisma.inboxModerationRule.findMany({
      where: { workspaceId },
      orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
    });

    return rules.map((r) => this.mapRuleToDto(r));
  }

  async getRuleById(workspaceId: string, id: string): Promise<InboxModerationRuleDto> {
    const rule = await this.prisma.inboxModerationRule.findFirst({
      where: { id, workspaceId },
    });

    if (!rule) {
      throw new NotFoundException(`Moderation rule ${id} not found`);
    }

    return this.mapRuleToDto(rule);
  }

  async updateRule(
    workspaceId: string,
    id: string,
    dto: UpdateInboxModerationRuleDto,
  ): Promise<InboxModerationRuleDto> {
    await this.getRuleById(workspaceId, id);

    const updated = await this.prisma.inboxModerationRule.update({
      where: { id },
      data: {
        name: dto.name,
        description: dto.description,
        triggerSentiment: dto.triggerSentiment,
        keywords: dto.keywords,
        action: dto.action as any,
        actionPayload: dto.actionPayload as any,
        isEnabled: dto.isEnabled,
        priority: dto.priority,
      },
    });

    return this.mapRuleToDto(updated);
  }

  async deleteRule(workspaceId: string, id: string): Promise<{ success: boolean }> {
    await this.getRuleById(workspaceId, id);

    await this.prisma.inboxModerationRule.delete({
      where: { id },
    });

    return { success: true };
  }

  // ==========================================
  // 2. Auto-Reply Templates CRUD
  // ==========================================

  async createTemplate(
    workspaceId: string,
    dto: CreateInboxAutoReplyTemplateDto,
  ): Promise<InboxAutoReplyTemplateDto> {
    const template = await this.prisma.inboxAutoReplyTemplate.create({
      data: {
        workspaceId,
        title: dto.title,
        content: dto.content,
        category: dto.category || 'GENERAL',
        sentimentMatch: dto.sentimentMatch || null,
      },
    });

    return this.mapTemplateToDto(template);
  }

  async getTemplates(workspaceId: string, category?: string): Promise<InboxAutoReplyTemplateDto[]> {
    const where: any = { workspaceId };
    if (category) {
      where.category = category;
    }

    const templates = await this.prisma.inboxAutoReplyTemplate.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    return templates.map((t) => this.mapTemplateToDto(t));
  }

  async getTemplateById(workspaceId: string, id: string): Promise<InboxAutoReplyTemplateDto> {
    const template = await this.prisma.inboxAutoReplyTemplate.findFirst({
      where: { id, workspaceId },
    });

    if (!template) {
      throw new NotFoundException(`Reply template ${id} not found`);
    }

    return this.mapTemplateToDto(template);
  }

  async updateTemplate(
    workspaceId: string,
    id: string,
    dto: UpdateInboxAutoReplyTemplateDto,
  ): Promise<InboxAutoReplyTemplateDto> {
    await this.getTemplateById(workspaceId, id);

    const updated = await this.prisma.inboxAutoReplyTemplate.update({
      where: { id },
      data: {
        title: dto.title,
        content: dto.content,
        category: dto.category,
        sentimentMatch: dto.sentimentMatch,
      },
    });

    return this.mapTemplateToDto(updated);
  }

  async deleteTemplate(workspaceId: string, id: string): Promise<{ success: boolean }> {
    await this.getTemplateById(workspaceId, id);

    await this.prisma.inboxAutoReplyTemplate.delete({
      where: { id },
    });

    return { success: true };
  }

  // ==========================================
  // 3. Triage & Auto-Moderation Evaluation Engine
  // ==========================================

  async evaluateInteraction(
    workspaceId: string,
    interactionId: string,
  ): Promise<InboxTriageResultDto> {
    const interaction = await this.prisma.socialInteraction.findFirst({
      where: { id: interactionId, workspaceId },
    });

    if (!interaction) {
      throw new NotFoundException(`Interaction ${interactionId} not found`);
    }

    const rules = await this.prisma.inboxModerationRule.findMany({
      where: { workspaceId, isEnabled: true },
      orderBy: [{ priority: 'desc' }, { createdAt: 'asc' }],
    });

    const contentLower = interaction.content.toLowerCase();
    const existingMeta = (interaction.rawMetadata as Record<string, any>) || {};

    for (const rule of rules) {
      // 1. Keyword check
      let keywordMatched = false;
      if (!rule.keywords || rule.keywords.length === 0) {
        keywordMatched = true; // matches all text if keywords array is empty
      } else {
        keywordMatched = rule.keywords.some((kw) =>
          contentLower.includes(kw.trim().toLowerCase()),
        );
      }

      if (!keywordMatched) {
        continue;
      }

      // 2. Sentiment check (if metadata has sentiment tagged)
      const interactionSentiment = existingMeta.sentiment || 'NEUTRAL';
      if (rule.triggerSentiment !== 'ALL' && rule.triggerSentiment !== interactionSentiment) {
        continue;
      }

      // Execute matched rule action
      await this.prisma.inboxModerationRule.update({
        where: { id: rule.id },
        data: {
          executionCount: { increment: 1 },
          lastTriggeredAt: new Date(),
        },
      });

      const updatedMeta: Record<string, any> = {
        ...existingMeta,
        triageMatchedRule: rule.name,
        triageAction: rule.action,
        triageAt: new Date().toISOString(),
      };

      let assignedUserId: string | null = null;
      let flagged = false;
      let hidden = false;
      let autoReplied = false;
      let actionDetails = `Matched rule: "${rule.name}"`;

      if (rule.action === 'AUTO_FLAG') {
        flagged = true;
        updatedMeta.isFlagged = true;
        await this.prisma.socialInteraction.update({
          where: { id: interactionId },
          data: {
            workflowStatus: 'IN_PROGRESS',
            rawMetadata: updatedMeta,
          },
        });
        actionDetails = `Interaction automatically flagged for urgent team review by "${rule.name}"`;
      } else if (rule.action === 'AUTO_HIDE') {
        hidden = true;
        updatedMeta.isHidden = true;
        await this.prisma.socialInteraction.update({
          where: { id: interactionId },
          data: {
            rawMetadata: updatedMeta,
          },
        });
        actionDetails = `Interaction hidden due to blocked content by "${rule.name}"`;
      } else if (rule.action === 'CLOSE_INTERACTION') {
        await this.prisma.socialInteraction.update({
          where: { id: interactionId },
          data: {
            workflowStatus: 'RESOLVED',
            resolvedAt: new Date(),
            rawMetadata: updatedMeta,
          },
        });
        actionDetails = `Interaction automatically closed by rule "${rule.name}"`;
      } else if (rule.action === 'ASSIGN_TO_ROLE') {
        const payload = rule.actionPayload as Record<string, any>;
        const targetRole = payload.targetRole || 'ADMIN';
        const member = await this.prisma.workspaceMember.findFirst({
          where: { workspaceId, role: targetRole as any },
        });

        if (member) {
          assignedUserId = member.userId;
          await this.prisma.socialInteraction.update({
            where: { id: interactionId },
            data: {
              workflowStatus: 'ASSIGNED',
              assignedToUserId: member.userId,
              assignedAt: new Date(),
              rawMetadata: updatedMeta,
            },
          });
          actionDetails = `Assigned to role [${targetRole}] by "${rule.name}"`;
        }
      } else if (rule.action === 'AUTO_REPLY') {
        autoReplied = true;
        const payload = rule.actionPayload as Record<string, any>;
        const replyText = payload.replyText || 'Thank you for reaching out! Our team is reviewing this.';
        updatedMeta.autoRepliedText = replyText;
        await this.prisma.socialInteraction.update({
          where: { id: interactionId },
          data: {
            workflowStatus: 'IN_PROGRESS',
            rawMetadata: updatedMeta,
          },
        });
        actionDetails = `Auto-reply queued: "${replyText.slice(0, 40)}..."`;
      }

      return {
        matchedRuleId: rule.id,
        matchedRuleName: rule.name,
        actionTaken: rule.action as InboxModerationAction,
        actionDetails,
        autoReplied,
        flagged,
        hidden,
        assignedUserId,
      };
    }

    return {
      matchedRuleId: null,
      matchedRuleName: null,
      actionTaken: 'NONE',
      actionDetails: 'No moderation rules matched this interaction.',
      autoReplied: false,
      flagged: false,
      hidden: false,
      assignedUserId: null,
    };
  }

  // ==========================================
  // Helper Mappers
  // ==========================================

  private mapRuleToDto(raw: any): InboxModerationRuleDto {
    return {
      id: raw.id,
      workspaceId: raw.workspaceId,
      name: raw.name,
      description: raw.description,
      triggerSentiment: raw.triggerSentiment,
      keywords: raw.keywords,
      action: raw.action as InboxModerationAction,
      actionPayload: (raw.actionPayload as Record<string, any>) || {},
      isEnabled: raw.isEnabled,
      priority: raw.priority,
      executionCount: raw.executionCount,
      lastTriggeredAt: raw.lastTriggeredAt ? raw.lastTriggeredAt.toISOString() : null,
      createdAt: raw.createdAt.toISOString(),
      updatedAt: raw.updatedAt.toISOString(),
    };
  }

  private mapTemplateToDto(raw: any): InboxAutoReplyTemplateDto {
    return {
      id: raw.id,
      workspaceId: raw.workspaceId,
      title: raw.title,
      content: raw.content,
      category: raw.category,
      sentimentMatch: raw.sentimentMatch,
      usageCount: raw.usageCount,
      createdAt: raw.createdAt.toISOString(),
      updatedAt: raw.updatedAt.toISOString(),
    };
  }
}
