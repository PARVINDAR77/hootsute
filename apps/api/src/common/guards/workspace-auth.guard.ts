import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '../../prisma/prisma.service';
import { WORKSPACE_ROLES_KEY } from '../decorators/workspace-roles.decorator';
import { WorkspaceRole, WorkspaceStatus, WorkspaceMemberStatus, Role } from '@prisma/client';
import { AuthenticatedUser } from '../interfaces/jwt-payload.interface';

const ROLE_HIERARCHY: Record<WorkspaceRole, number> = {
  [WorkspaceRole.OWNER]: 4,
  [WorkspaceRole.ADMIN]: 3,
  [WorkspaceRole.EDITOR]: 2,
  [WorkspaceRole.VIEWER]: 1,
};

@Injectable()
export class WorkspaceAuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user as AuthenticatedUser;

    if (!user) {
      throw new ForbiddenException('User authentication context missing');
    }

    const workspaceId =
      request.params?.workspaceId ||
      request.params?.wsId ||
      request.headers?.['x-workspace-id'] ||
      request.body?.workspaceId;

    if (!workspaceId || typeof workspaceId !== 'string') {
      throw new BadRequestException('Workspace identifier is required for this operation');
    }

    const workspace = await this.prisma.workspace.findUnique({
      where: { id: workspaceId },
    });

    if (!workspace) {
      // Return 404 to avoid leaking valid workspace IDs to unauthorized users
      throw new NotFoundException('Workspace not found or unavailable');
    }

    if (workspace.status === WorkspaceStatus.SUSPENDED) {
      throw new ForbiddenException('This workspace has been suspended. Please contact support.');
    }

    // Check membership
    const member = await this.prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: {
          workspaceId: workspace.id,
          userId: user.id,
        },
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

    // If user is not an active member
    if (!member) {
      // SUPER_ADMIN platform role can access in read-only support mode if desired, but ordinary users are strictly blocked
      if (user.role === Role.SUPER_ADMIN) {
        request.workspace = workspace;
        request.workspaceMember = {
          id: 'super-admin-virtual',
          workspaceId: workspace.id,
          userId: user.id,
          role: WorkspaceRole.OWNER,
          status: WorkspaceMemberStatus.ACTIVE,
          joinedAt: new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        return true;
      }
      throw new ForbiddenException('You do not have access to this workspace');
    }

    if (member.status !== WorkspaceMemberStatus.ACTIVE) {
      throw new ForbiddenException('Your membership in this workspace is not active');
    }

    // Role check against route decorators
    const requiredRoles = this.reflector.getAllAndOverride<WorkspaceRole[]>(
      WORKSPACE_ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (requiredRoles && requiredRoles.length > 0) {
      const userLevel = ROLE_HIERARCHY[member.role] || 0;
      const minRequiredLevel = Math.min(
        ...requiredRoles.map((r) => ROLE_HIERARCHY[r] || 0),
      );

      const hasRequiredRole =
        requiredRoles.includes(member.role) || userLevel >= minRequiredLevel;

      if (!hasRequiredRole) {
        throw new ForbiddenException(
          `Insufficient workspace permissions. Required: ${requiredRoles.join(', ')}`,
        );
      }
    }

    // Attach to request
    request.workspace = workspace;
    request.workspaceMember = member;

    return true;
  }
}
