import {
  Injectable,
  ConflictException,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  Logger,
  Optional,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MailService } from '../mail/mail.service';
import {
  WorkspaceRole,
  WorkspaceStatus,
  WorkspaceMemberStatus,
} from '@prisma/client';
import { CreateWorkspaceDto } from './dto/create-workspace.dto';
import { UpdateWorkspaceDto } from './dto/update-workspace.dto';
import { InviteMemberDto } from './dto/invite-member.dto';
import { UpdateMemberDto } from './dto/update-member.dto';
import * as crypto from 'crypto';

@Injectable()
export class WorkspacesService {
  private readonly logger = new Logger(WorkspacesService.name);

  constructor(
    private readonly prisma: PrismaService,
    @Optional() private readonly mailService?: MailService,
  ) {}

  private hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  private slugify(text: string): string {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  async create(userId: string, dto: CreateWorkspaceDto) {
    let baseSlug = dto.slug ? this.slugify(dto.slug) : this.slugify(dto.name);
    if (!baseSlug || baseSlug.length < 2) {
      baseSlug = `ws-${crypto.randomBytes(3).toString('hex')}`;
    }

    // Check slug collision and auto-suffix if generated
    let finalSlug = baseSlug;
    let collisionCount = 0;
    while (await this.prisma.workspace.findUnique({ where: { slug: finalSlug } })) {
      collisionCount++;
      if (dto.slug && collisionCount === 1) {
        // If user explicitly supplied this slug and it is taken, throw conflict
        throw new ConflictException(
          `Workspace slug '${dto.slug}' is already taken. Please choose another.`,
        );
      }
      finalSlug = `${baseSlug}-${crypto.randomBytes(2).toString('hex')}`;
    }

    // Transactional creation of Workspace + OWNER Member + AuditLog
    const result = await this.prisma.$transaction(async (tx) => {
      const workspace = await tx.workspace.create({
        data: {
          name: dto.name.trim(),
          slug: finalSlug,
          description: dto.description?.trim() || null,
          logoUrl: dto.logoUrl || null,
          websiteUrl: dto.websiteUrl || null,
          industry: dto.industry || null,
          timezone: dto.timezone || 'UTC',
          defaultLanguage: dto.defaultLanguage || 'en',
          status: WorkspaceStatus.ACTIVE,
          createdById: userId,
        },
      });

      const member = await tx.workspaceMember.create({
        data: {
          workspaceId: workspace.id,
          userId,
          role: WorkspaceRole.OWNER,
          status: WorkspaceMemberStatus.ACTIVE,
          joinedAt: new Date(),
        },
      });

      await tx.auditLog.create({
        data: {
          workspaceId: workspace.id,
          actorUserId: userId,
          action: 'WORKSPACE_CREATE',
          entityType: 'Workspace',
          entityId: workspace.id,
          metadata: {
            name: workspace.name,
            slug: workspace.slug,
            ownerMemberId: member.id,
          },
        },
      });

      return {
        ...workspace,
        currentUserRole: WorkspaceRole.OWNER,
      };
    });

    this.logger.log(`Created workspace [${result.id}] '${result.name}' (owner: ${userId})`);
    return result;
  }

  async findAllForUser(userId: string) {
    const memberships = await this.prisma.workspaceMember.findMany({
      where: {
        userId,
        status: WorkspaceMemberStatus.ACTIVE,
        workspace: {
          status: WorkspaceStatus.ACTIVE,
        },
      },
      include: {
        workspace: true,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    return memberships.map((m) => ({
      ...m.workspace,
      currentUserRole: m.role,
      joinedAt: m.joinedAt,
    }));
  }

  async findById(workspaceId: string, userId: string) {
    const workspace = await this.prisma.workspace.findUnique({
      where: { id: workspaceId },
      include: {
        _count: {
          select: {
            members: { where: { status: WorkspaceMemberStatus.ACTIVE } },
          },
        },
      },
    });

    if (!workspace) {
      throw new NotFoundException('Workspace not found');
    }

    const membership = await this.prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: {
          workspaceId,
          userId,
        },
      },
    });

    return {
      ...workspace,
      currentUserRole: membership?.role || null,
      memberCount: workspace._count.members,
    };
  }

  async update(workspaceId: string, dto: UpdateWorkspaceDto, actorUserId: string) {
    const updated = await this.prisma.workspace.update({
      where: { id: workspaceId },
      data: {
        ...(dto.name && { name: dto.name.trim() }),
        ...(dto.description !== undefined && { description: dto.description?.trim() || null }),
        ...(dto.logoUrl !== undefined && { logoUrl: dto.logoUrl || null }),
        ...(dto.websiteUrl !== undefined && { websiteUrl: dto.websiteUrl || null }),
        ...(dto.industry !== undefined && { industry: dto.industry || null }),
        ...(dto.timezone && { timezone: dto.timezone }),
        ...(dto.defaultLanguage && { defaultLanguage: dto.defaultLanguage }),
      },
    });

    await this.prisma.auditLog.create({
      data: {
        workspaceId,
        actorUserId,
        action: 'WORKSPACE_UPDATE',
        entityType: 'Workspace',
        entityId: workspaceId,
        metadata: dto as any,
      },
    });

    return updated;
  }

  async listMembers(workspaceId: string) {
    const members = await this.prisma.workspaceMember.findMany({
      where: { workspaceId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            status: true,
          },
        },
      },
      orderBy: [
        { role: 'asc' }, // OWNER first
        { createdAt: 'asc' },
      ],
    });

    return members;
  }

  async updateMemberRole(
    workspaceId: string,
    memberId: string,
    dto: UpdateMemberDto,
    actorUserId: string,
  ) {
    const member = await this.prisma.workspaceMember.findUnique({
      where: { id: memberId },
    });

    if (!member || member.workspaceId !== workspaceId) {
      throw new NotFoundException('Workspace member not found');
    }

    // Protect OWNER
    if (member.role === WorkspaceRole.OWNER) {
      throw new ForbiddenException(
        'The OWNER role cannot be modified. Use transfer-ownership instead.',
      );
    }

    // Caller cannot promote anyone to OWNER via role update
    if (dto.role === WorkspaceRole.OWNER) {
      throw new BadRequestException(
        'Cannot assign OWNER role via membership update. Use transfer-ownership.',
      );
    }

    // Check caller permission level
    const actorMember = await this.prisma.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId, userId: actorUserId } },
    });

    if (!actorMember) {
      throw new ForbiddenException('Actor is not a member of this workspace');
    }

    // If caller is ADMIN, they cannot modify another ADMIN
    if (actorMember.role === WorkspaceRole.ADMIN && member.role === WorkspaceRole.ADMIN) {
      throw new ForbiddenException('ADMIN members cannot modify the role of another ADMIN');
    }

    const updated = await this.prisma.workspaceMember.update({
      where: { id: memberId },
      data: {
        role: dto.role,
        ...(dto.status && { status: dto.status }),
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            status: true,
          },
        },
      },
    });

    await this.prisma.auditLog.create({
      data: {
        workspaceId,
        actorUserId,
        action: 'MEMBER_ROLE_UPDATE',
        entityType: 'WorkspaceMember',
        entityId: memberId,
        metadata: {
          oldRole: member.role,
          newRole: dto.role,
          targetUserId: member.userId,
        },
      },
    });

    return updated;
  }

  async removeMember(workspaceId: string, memberId: string, actorUserId: string) {
    const member = await this.prisma.workspaceMember.findUnique({
      where: { id: memberId },
    });

    if (!member || member.workspaceId !== workspaceId) {
      throw new NotFoundException('Workspace member not found');
    }

    // Final Owner protection: cannot remove OWNER
    if (member.role === WorkspaceRole.OWNER) {
      throw new ForbiddenException(
        'The OWNER cannot be removed from the workspace. Transfer ownership first.',
      );
    }

    const actorMember = await this.prisma.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId, userId: actorUserId } },
    });

    if (!actorMember) {
      throw new ForbiddenException('Actor is not a member of this workspace');
    }

    const isSelf = member.userId === actorUserId;

    // If not self-removal, check privileges
    if (!isSelf) {
      if (actorMember.role === WorkspaceRole.ADMIN && member.role === WorkspaceRole.ADMIN) {
        throw new ForbiddenException('ADMIN members cannot remove another ADMIN');
      }
      if (actorMember.role !== WorkspaceRole.OWNER && actorMember.role !== WorkspaceRole.ADMIN) {
        throw new ForbiddenException('Insufficient permissions to remove members');
      }
    }

    await this.prisma.$transaction([
      this.prisma.workspaceMember.delete({ where: { id: memberId } }),
      this.prisma.auditLog.create({
        data: {
          workspaceId,
          actorUserId,
          action: isSelf ? 'MEMBER_LEAVE' : 'MEMBER_REMOVE',
          entityType: 'WorkspaceMember',
          entityId: memberId,
          metadata: {
            removedUserId: member.userId,
            role: member.role,
          },
        },
      }),
    ]);

    return { success: true, message: 'Member successfully removed' };
  }

  async transferOwnership(
    workspaceId: string,
    targetMemberId: string,
    currentOwnerUserId: string,
  ) {
    const currentOwnerMember = await this.prisma.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId, userId: currentOwnerUserId } },
    });

    if (!currentOwnerMember || currentOwnerMember.role !== WorkspaceRole.OWNER) {
      throw new ForbiddenException('Only the current OWNER can transfer workspace ownership');
    }

    const targetMember = await this.prisma.workspaceMember.findUnique({
      where: { id: targetMemberId },
      include: { user: true },
    });

    if (!targetMember || targetMember.workspaceId !== workspaceId) {
      throw new NotFoundException('Target member not found in this workspace');
    }

    if (targetMember.status !== WorkspaceMemberStatus.ACTIVE) {
      throw new BadRequestException('Cannot transfer ownership to an inactive or suspended member');
    }

    if (targetMember.id === currentOwnerMember.id) {
      throw new BadRequestException('You are already the OWNER of this workspace');
    }

    // Atomic ownership transfer
    await this.prisma.$transaction([
      this.prisma.workspaceMember.update({
        where: { id: currentOwnerMember.id },
        data: { role: WorkspaceRole.ADMIN },
      }),
      this.prisma.workspaceMember.update({
        where: { id: targetMember.id },
        data: { role: WorkspaceRole.OWNER },
      }),
      this.prisma.auditLog.create({
        data: {
          workspaceId,
          actorUserId: currentOwnerUserId,
          action: 'OWNERSHIP_TRANSFER',
          entityType: 'Workspace',
          entityId: workspaceId,
          metadata: {
            previousOwnerUserId: currentOwnerUserId,
            newOwnerUserId: targetMember.userId,
            newOwnerMemberId: targetMember.id,
          },
        },
      }),
    ]);

    this.logger.log(
      `Ownership of workspace [${workspaceId}] transferred from ${currentOwnerUserId} to ${targetMember.userId}`,
    );

    return {
      success: true,
      message: `Ownership successfully transferred to ${targetMember.user.name}`,
    };
  }

  async createInvitation(
    workspaceId: string,
    dto: InviteMemberDto,
    actorUserId: string,
  ) {
    const normalizedEmail = dto.email.toLowerCase().trim();

    // Check if user is already a member
    const existingMember = await this.prisma.workspaceMember.findFirst({
      where: {
        workspaceId,
        user: { email: normalizedEmail },
      },
    });

    if (existingMember) {
      throw new ConflictException(
        `User ${normalizedEmail} is already a member of this workspace`,
      );
    }

    // Invalidate any prior active invitation for this email in this workspace
    await this.prisma.workspaceInvitation.updateMany({
      where: {
        workspaceId,
        email: normalizedEmail,
        revokedAt: null,
        acceptedAt: null,
      },
      data: { revokedAt: new Date() },
    });

    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = this.hashToken(rawToken);

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days expiration

    const invitation = await this.prisma.workspaceInvitation.create({
      data: {
        workspaceId,
        email: normalizedEmail,
        role: dto.role,
        tokenHash,
        expiresAt,
        invitedById: actorUserId,
      },
      include: {
        invitedBy: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    await this.prisma.auditLog.create({
      data: {
        workspaceId,
        actorUserId,
        action: 'INVITATION_CREATE',
        entityType: 'WorkspaceInvitation',
        entityId: invitation.id,
        metadata: {
          invitedEmail: normalizedEmail,
          role: dto.role,
          expiresAt,
        },
      },
    });

    // In development mode only, return the token & url for test/local convenience.
    // In production, invitation tokens are strictly delivered via email provider and never exposed in API responses.
    const isDevelopment = process.env.NODE_ENV !== 'production';
    const appUrl = process.env.CORS_ORIGIN || 'http://localhost:3000';
    const invitationUrl = isDevelopment ? `${appUrl}/invitations/accept?token=${rawToken}` : undefined;

    if (this.mailService) {
      const workspace = await this.prisma.workspace.findUnique({
        where: { id: workspaceId },
        select: { name: true },
      });
      const deliveryUrl = `${appUrl}/invitations/accept?token=${rawToken}`;
      this.mailService
        .sendInvitationEmail(normalizedEmail, {
          workspaceName: workspace?.name || 'OmniSocial Workspace',
          inviterName: invitation.invitedBy?.name || 'A team member',
          role: dto.role,
          acceptUrl: deliveryUrl,
          expiresAt,
        })
        .catch((err) => {
          this.logger.error(
            `Failed to dispatch invitation email to ${normalizedEmail}: ${err.message}`,
          );
        });
    }

    return {
      ...invitation,
      ...(isDevelopment && { rawToken, invitationUrl }),
    };
  }

  async listInvitations(workspaceId: string) {
    return this.prisma.workspaceInvitation.findMany({
      where: {
        workspaceId,
        revokedAt: null,
        acceptedAt: null,
        expiresAt: { gt: new Date() },
      },
      include: {
        invitedBy: {
          select: { id: true, name: true, email: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async revokeInvitation(workspaceId: string, invitationId: string, actorUserId: string) {
    const invitation = await this.prisma.workspaceInvitation.findUnique({
      where: { id: invitationId },
    });

    if (!invitation || invitation.workspaceId !== workspaceId) {
      throw new NotFoundException('Invitation not found');
    }

    if (invitation.revokedAt) {
      throw new BadRequestException('Invitation is already revoked');
    }

    if (invitation.acceptedAt) {
      throw new BadRequestException('Invitation has already been accepted');
    }

    const updated = await this.prisma.workspaceInvitation.update({
      where: { id: invitationId },
      data: { revokedAt: new Date() },
    });

    await this.prisma.auditLog.create({
      data: {
        workspaceId,
        actorUserId,
        action: 'INVITATION_REVOKE',
        entityType: 'WorkspaceInvitation',
        entityId: invitationId,
        metadata: { email: invitation.email },
      },
    });

    return updated;
  }

  async getInvitationByToken(rawToken: string) {
    const tokenHash = this.hashToken(rawToken);
    const invitation = await this.prisma.workspaceInvitation.findUnique({
      where: { tokenHash },
      include: {
        workspace: {
          select: {
            id: true,
            name: true,
            slug: true,
            logoUrl: true,
            description: true,
          },
        },
        invitedBy: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });

    if (!invitation) {
      throw new NotFoundException('Invalid or expired invitation token');
    }

    if (invitation.revokedAt) {
      throw new BadRequestException('This invitation has been revoked');
    }

    if (invitation.acceptedAt) {
      throw new ConflictException('This invitation has already been accepted');
    }

    if (invitation.expiresAt < new Date()) {
      throw new BadRequestException('This invitation has expired');
    }

    return invitation;
  }

  async acceptInvitation(rawToken: string, userId: string, userEmail: string) {
    const tokenHash = this.hashToken(rawToken);

    const invitation = await this.prisma.workspaceInvitation.findUnique({
      where: { tokenHash },
      include: { workspace: true },
    });

    if (!invitation) {
      throw new NotFoundException('Invalid invitation token');
    }

    if (invitation.revokedAt) {
      throw new BadRequestException('This invitation has been revoked by an administrator');
    }

    if (invitation.acceptedAt) {
      throw new ConflictException('This invitation has already been accepted');
    }

    if (invitation.expiresAt < new Date()) {
      throw new BadRequestException('This invitation has expired');
    }

    // Check if user is already a member
    const existing = await this.prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: {
          workspaceId: invitation.workspaceId,
          userId,
        },
      },
    });

    if (existing) {
      // Mark accepted and return
      await this.prisma.workspaceInvitation.update({
        where: { id: invitation.id },
        data: { acceptedAt: new Date() },
      });
      return {
        success: true,
        message: 'You are already a member of this workspace',
        workspace: invitation.workspace,
      };
    }

    // Atomic accept + member creation
    const result = await this.prisma.$transaction(async (tx) => {
      const member = await tx.workspaceMember.create({
        data: {
          workspaceId: invitation.workspaceId,
          userId,
          role: invitation.role,
          status: WorkspaceMemberStatus.ACTIVE,
          joinedAt: new Date(),
        },
      });

      await tx.workspaceInvitation.update({
        where: { id: invitation.id },
        data: { acceptedAt: new Date() },
      });

      await tx.auditLog.create({
        data: {
          workspaceId: invitation.workspaceId,
          actorUserId: userId,
          action: 'INVITATION_ACCEPT',
          entityType: 'WorkspaceMember',
          entityId: member.id,
          metadata: {
            invitationId: invitation.id,
            role: invitation.role,
            userEmail,
          },
        },
      });

      return {
        member,
        workspace: invitation.workspace,
      };
    });

    return {
      success: true,
      message: `You have successfully joined ${result.workspace.name}`,
      workspace: result.workspace,
      member: result.member,
    };
  }
}
