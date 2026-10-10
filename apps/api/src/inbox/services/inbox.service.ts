import {
  Injectable,
  Logger,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { TokenVaultService } from '../../social-accounts/token-vault/token-vault.service';
import { InboxAdapterFactory } from '../adapters/inbox-adapter.factory';
import {
  ListInteractionsQueryDto,
  PostReplyBodyDto,
  UpdateWorkflowStatusDto,
  AssignInteractionDto,
  AddInternalNoteDto,
} from '../dto';
import { AuthenticatedUser } from '../../common/interfaces/jwt-payload.interface';
import { InteractionWorkflowStatus, ReplyAttemptStatus } from '@prisma/client';

@Injectable()
export class InboxService {
  private readonly logger = new Logger(InboxService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly tokenVault: TokenVaultService,
    private readonly adapterFactory: InboxAdapterFactory,
  ) {}

  async listInteractions(
    workspaceId: string,
    query: ListInteractionsQueryDto,
    currentUser: AuthenticatedUser,
  ) {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = {
      workspaceId,
    };

    if (query.platform) {
      where.platform = query.platform;
    }

    if (query.socialAccountId) {
      where.socialAccountId = query.socialAccountId;
    }

    if (query.workflowStatus) {
      where.workflowStatus = query.workflowStatus;
    }

    if (query.interactionType) {
      where.interactionType = query.interactionType;
    }

    if (query.isRead !== undefined) {
      where.isRead = query.isRead;
    }

    if (query.assignedToMe) {
      where.assignedToUserId = currentUser.id;
    } else if (query.assignedToUserId) {
      where.assignedToUserId = query.assignedToUserId;
    }

    if (query.search && query.search.trim()) {
      const term = query.search.trim();
      where.OR = [
        { content: { contains: term, mode: 'insensitive' } },
        { authorName: { contains: term, mode: 'insensitive' } },
        { authorUsername: { contains: term, mode: 'insensitive' } },
      ];
    }

    if (query.startDate || query.endDate) {
      where.publishedAt = {};
      if (query.startDate) where.publishedAt.gte = new Date(query.startDate);
      if (query.endDate) where.publishedAt.lte = new Date(query.endDate);
    }

    const orderBy: any = {};
    const sortField = query.sortBy === 'createdAt' ? 'createdAt' : 'publishedAt';
    orderBy[sortField] = query.sortOrder === 'asc' ? 'asc' : 'desc';

    const [items, total, unreadCount, openCount, assignedToMeCount] = await Promise.all([
      this.prisma.socialInteraction.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          socialAccount: {
            select: {
              id: true,
              accountName: true,
              accountUsername: true,
              accountType: true,
              profileImageUrl: true,
              connectionStatus: true,
            },
          },
          assignedTo: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          replyAttempts: {
            take: 1,
            orderBy: { createdAt: 'desc' },
            select: {
              id: true,
              status: true,
              createdAt: true,
            },
          },
          _count: {
            select: {
              notes: true,
              replyAttempts: true,
            },
          },
        },
      }),
      this.prisma.socialInteraction.count({ where }),
      this.prisma.socialInteraction.count({ where: { workspaceId, isRead: false } }),
      this.prisma.socialInteraction.count({ where: { workspaceId, workflowStatus: 'OPEN' } }),
      this.prisma.socialInteraction.count({ where: { workspaceId, assignedToUserId: currentUser.id } }),
    ]);

    return {
      items,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      },
      counts: {
        unread: unreadCount,
        open: openCount,
        assignedToMe: assignedToMeCount,
      },
    };
  }

  async getInteractionById(workspaceId: string, interactionId: string) {
    const interaction = await this.prisma.socialInteraction.findFirst({
      where: {
        id: interactionId,
        workspaceId,
      },
      include: {
        socialAccount: {
          select: {
            id: true,
            accountName: true,
            accountUsername: true,
            accountType: true,
            profileImageUrl: true,
            connectionStatus: true,
            grantedScopes: true,
          },
        },
        assignedTo: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        assignedBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        resolvedBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        replyAttempts: {
          orderBy: { createdAt: 'asc' },
          include: {
            authorUser: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
        notes: {
          orderBy: { createdAt: 'asc' },
          include: {
            authorUser: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
    });

    if (!interaction) {
      throw new NotFoundException('Interaction not found or does not belong to this workspace.');
    }

    // Find conversation thread replies if any exist
    const threadReplies = await this.prisma.socialInteraction.findMany({
      where: {
        workspaceId,
        socialAccountId: interaction.socialAccountId,
        parentExternalId: interaction.externalInteractionId,
      },
      orderBy: { publishedAt: 'asc' },
    });

    return {
      ...interaction,
      threadReplies,
    };
  }

  async postReply(
    workspaceId: string,
    interactionId: string,
    dto: PostReplyBodyDto,
    currentUser: AuthenticatedUser,
  ) {
    const interaction = await this.prisma.socialInteraction.findFirst({
      where: { id: interactionId, workspaceId },
      include: { socialAccount: true },
    });

    if (!interaction) {
      throw new NotFoundException('Interaction not found or does not belong to this workspace.');
    }

    // 1. Idempotency Check
    const existingAttempt = await this.prisma.interactionReplyAttempt.findUnique({
      where: { idempotencyKey: dto.idempotencyKey },
      include: {
        authorUser: { select: { id: true, name: true, email: true } },
      },
    });

    if (existingAttempt) {
      if (existingAttempt.status === ReplyAttemptStatus.SENT) {
        return {
          success: true,
          message: 'Reply already submitted successfully (idempotent duplicate request).',
          attempt: existingAttempt,
        };
      }
      if (existingAttempt.status === ReplyAttemptStatus.PENDING) {
        return {
          success: false,
          message: 'A reply attempt with this idempotency key is currently dispatching.',
          attempt: existingAttempt,
        };
      }
    }

    // 2. Create pending attempt record
    const attempt = await this.prisma.interactionReplyAttempt.create({
      data: {
        interactionId: interaction.id,
        workspaceId,
        authorUserId: currentUser.id,
        content: dto.content,
        idempotencyKey: dto.idempotencyKey,
        status: ReplyAttemptStatus.PENDING,
      },
    });

    // 3. Decrypt social account token
    let decryptedToken: string;
    try {
      decryptedToken = this.tokenVault.decrypt(interaction.socialAccount.encryptedAccessToken);
    } catch (err: any) {
      await this.prisma.interactionReplyAttempt.update({
        where: { id: attempt.id },
        data: {
          status: ReplyAttemptStatus.FAILED,
          errorCode: 'TOKEN_DECRYPTION_ERROR',
          errorMessage: 'Unable to decrypt social account access token.',
        },
      });
      throw new BadRequestException('Failed to decrypt social account credentials. Please reconnect the account.');
    }

    // 4. Dispatch reply via provider adapter
    const adapter = this.adapterFactory.getAdapter(interaction.socialAccount);
    const replyResult = await adapter.postReply(
      interaction.socialAccount,
      decryptedToken,
      interaction,
      dto.content,
    );

    // 5. Update attempt record with provider outcome
    const updatedAttempt = await this.prisma.interactionReplyAttempt.update({
      where: { id: attempt.id },
      data: {
        status:
          replyResult.outcome === 'SUCCESS'
            ? ReplyAttemptStatus.SENT
            : replyResult.outcome === 'AMBIGUOUS_TIMEOUT'
            ? ReplyAttemptStatus.AMBIGUOUS_TIMEOUT
            : ReplyAttemptStatus.FAILED,
        externalReplyId: replyResult.externalReplyId,
        errorCode: replyResult.sanitizedErrorCode,
        errorMessage: replyResult.sanitizedErrorMessage,
        rawResponse: replyResult.rawResponse ? (replyResult.rawResponse as any) : undefined,
      },
      include: {
        authorUser: { select: { id: true, name: true, email: true } },
      },
    });

    // 6. If success, update interaction workflow triage state
    if (replyResult.success) {
      await this.prisma.socialInteraction.update({
        where: { id: interaction.id },
        data: {
          workflowStatus: InteractionWorkflowStatus.RESOLVED,
          isRead: true,
          resolvedAt: new Date(),
          resolvedByUserId: currentUser.id,
        },
      });

      // Audit log
      await this.prisma.auditLog.create({
        data: {
          workspaceId,
          actorUserId: currentUser.id,
          action: 'INBOX_REPLY_POSTED',
          entityType: 'SocialInteraction',
          entityId: interaction.id,
          metadata: {
            attemptId: attempt.id,
            platform: interaction.platform,
            externalReplyId: replyResult.externalReplyId,
          },
        },
      });

      return {
        success: true,
        message: 'Reply published successfully to social platform.',
        attempt: updatedAttempt,
      };
    }

    // Handle failure
    if (replyResult.outcome === 'AMBIGUOUS_TIMEOUT') {
      await this.prisma.inboxNotification.create({
        data: {
          workspaceId,
          recipientUserId: currentUser.id,
          interactionId: interaction.id,
          type: 'REPLY_AMBIGUOUS_TIMEOUT',
          title: 'Reply submission timeout',
          message: 'Your reply timed out with Meta. Please verify provider status before retrying.',
        },
      });

      return {
        success: false,
        ambiguous: true,
        message:
          replyResult.sanitizedErrorMessage ||
          'Request timed out after submission. Outcome is ambiguous; reconciliation required before retrying.',
        attempt: updatedAttempt,
      };
    }

    // Definitive or auth failure
    await this.prisma.inboxNotification.create({
      data: {
        workspaceId,
        recipientUserId: currentUser.id,
        interactionId: interaction.id,
        type: 'REPLY_FAILURE',
        title: 'Reply failed to send',
        message: replyResult.sanitizedErrorMessage || 'Meta API rejected reply.',
      },
    });

    return {
      success: false,
      message: replyResult.sanitizedErrorMessage || 'Failed to publish reply.',
      attempt: updatedAttempt,
    };
  }

  async updateWorkflowStatus(
    workspaceId: string,
    interactionId: string,
    dto: UpdateWorkflowStatusDto,
    currentUser: AuthenticatedUser,
  ) {
    const interaction = await this.prisma.socialInteraction.findFirst({
      where: { id: interactionId, workspaceId },
    });

    if (!interaction) {
      throw new NotFoundException('Interaction not found or does not belong to this workspace.');
    }

    const isResolved = dto.status === InteractionWorkflowStatus.RESOLVED;

    const updated = await this.prisma.socialInteraction.update({
      where: { id: interaction.id },
      data: {
        workflowStatus: dto.status,
        resolvedAt: isResolved ? new Date() : null,
        resolvedByUserId: isResolved ? currentUser.id : null,
      },
    });

    await this.prisma.auditLog.create({
      data: {
        workspaceId,
        actorUserId: currentUser.id,
        action: 'INBOX_STATUS_CHANGED',
        entityType: 'SocialInteraction',
        entityId: interaction.id,
        metadata: {
          previousStatus: interaction.workflowStatus,
          newStatus: dto.status,
        },
      },
    });

    return updated;
  }

  async assignInteraction(
    workspaceId: string,
    interactionId: string,
    dto: AssignInteractionDto,
    currentUser: AuthenticatedUser,
  ) {
    const interaction = await this.prisma.socialInteraction.findFirst({
      where: { id: interactionId, workspaceId },
    });

    if (!interaction) {
      throw new NotFoundException('Interaction not found or does not belong to this workspace.');
    }

    let assigneeUser = null;
    if (dto.assignedToUserId) {
      // Validate that assignee is an active member of this workspace
      const member = await this.prisma.workspaceMember.findUnique({
        where: {
          workspaceId_userId: {
            workspaceId,
            userId: dto.assignedToUserId,
          },
        },
        include: {
          user: { select: { id: true, name: true, email: true } },
        },
      });

      if (!member || member.status !== 'ACTIVE') {
        throw new BadRequestException('Assigned user must be an active member of this workspace.');
      }

      assigneeUser = member.user;
    }

    const nextStatus =
      dto.assignedToUserId && interaction.workflowStatus === InteractionWorkflowStatus.OPEN
        ? InteractionWorkflowStatus.ASSIGNED
        : interaction.workflowStatus;

    const updated = await this.prisma.socialInteraction.update({
      where: { id: interaction.id },
      data: {
        assignedToUserId: dto.assignedToUserId || null,
        assignedAt: dto.assignedToUserId ? new Date() : null,
        assignedByUserId: dto.assignedToUserId ? currentUser.id : null,
        workflowStatus: nextStatus,
      },
      include: {
        assignedTo: { select: { id: true, name: true, email: true } },
      },
    });

    // Create in-app notification for the assignee
    if (dto.assignedToUserId && dto.assignedToUserId !== currentUser.id) {
      await this.prisma.inboxNotification.create({
        data: {
          workspaceId,
          recipientUserId: dto.assignedToUserId,
          interactionId: interaction.id,
          type: 'ASSIGNMENT',
          title: 'Interaction assigned to you',
          message: `${currentUser.name || 'A team member'} assigned an interaction from ${interaction.authorName} to you.`,
        },
      });
    }

    // Audit log
    await this.prisma.auditLog.create({
      data: {
        workspaceId,
        actorUserId: currentUser.id,
        action: 'INBOX_INTERACTION_ASSIGNED',
        entityType: 'SocialInteraction',
        entityId: interaction.id,
        metadata: {
          assignedToUserId: dto.assignedToUserId,
          assignedByUserId: currentUser.id,
        },
      },
    });

    return updated;
  }

  async markRead(workspaceId: string, interactionId: string, isRead: boolean) {
    const interaction = await this.prisma.socialInteraction.findFirst({
      where: { id: interactionId, workspaceId },
    });

    if (!interaction) {
      throw new NotFoundException('Interaction not found or does not belong to this workspace.');
    }

    return this.prisma.socialInteraction.update({
      where: { id: interaction.id },
      data: { isRead },
    });
  }

  async addNote(
    workspaceId: string,
    interactionId: string,
    dto: AddInternalNoteDto,
    currentUser: AuthenticatedUser,
  ) {
    const interaction = await this.prisma.socialInteraction.findFirst({
      where: { id: interactionId, workspaceId },
    });

    if (!interaction) {
      throw new NotFoundException('Interaction not found or does not belong to this workspace.');
    }

    const note = await this.prisma.interactionNote.create({
      data: {
        interactionId: interaction.id,
        workspaceId,
        authorUserId: currentUser.id,
        content: dto.content,
      },
      include: {
        authorUser: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    await this.prisma.auditLog.create({
      data: {
        workspaceId,
        actorUserId: currentUser.id,
        action: 'INBOX_NOTE_ADDED',
        entityType: 'SocialInteraction',
        entityId: interaction.id,
        metadata: { noteId: note.id },
      },
    });

    return note;
  }

  async listNotes(workspaceId: string, interactionId: string) {
    const interaction = await this.prisma.socialInteraction.findFirst({
      where: { id: interactionId, workspaceId },
    });

    if (!interaction) {
      throw new NotFoundException('Interaction not found or does not belong to this workspace.');
    }

    return this.prisma.interactionNote.findMany({
      where: { interactionId: interaction.id, workspaceId },
      orderBy: { createdAt: 'asc' },
      include: {
        authorUser: {
          select: { id: true, name: true, email: true },
        },
      },
    });
  }

  async listNotifications(workspaceId: string, currentUser: AuthenticatedUser) {
    return this.prisma.inboxNotification.findMany({
      where: {
        workspaceId,
        recipientUserId: currentUser.id,
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });
  }

  async markNotificationRead(
    workspaceId: string,
    notificationId: string,
    currentUser: AuthenticatedUser,
  ) {
    const notification = await this.prisma.inboxNotification.findFirst({
      where: {
        id: notificationId,
        workspaceId,
        recipientUserId: currentUser.id,
      },
    });

    if (!notification) {
      throw new NotFoundException('Notification not found.');
    }

    return this.prisma.inboxNotification.update({
      where: { id: notification.id },
      data: { isRead: true },
    });
  }
}
