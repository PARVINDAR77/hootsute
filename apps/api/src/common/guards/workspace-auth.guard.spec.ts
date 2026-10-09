import { WorkspaceAuthGuard } from './workspace-auth.guard';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '../../prisma/prisma.service';
import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
  ExecutionContext,
} from '@nestjs/common';
import {
  WorkspaceRole,
  WorkspaceStatus,
  WorkspaceMemberStatus,
  Role,
  UserStatus,
} from '@prisma/client';

describe('WorkspaceAuthGuard', () => {
  let guard: WorkspaceAuthGuard;
  let reflector: Reflector;
  let prisma: any;

  const mockWorkspace = {
    id: 'ws-123',
    name: 'Acme Workspace',
    slug: 'acme',
    status: WorkspaceStatus.ACTIVE,
  };

  const mockMember = {
    id: 'member-123',
    workspaceId: 'ws-123',
    userId: 'user-1',
    role: WorkspaceRole.ADMIN,
    status: WorkspaceMemberStatus.ACTIVE,
  };

  beforeEach(() => {
    reflector = new Reflector();
    prisma = {
      workspace: {
        findUnique: jest.fn(),
      },
      workspaceMember: {
        findUnique: jest.fn(),
      },
    };
    guard = new WorkspaceAuthGuard(reflector, prisma as any);
  });

  const createMockContext = (
    user: any,
    params: any = {},
    headers: any = {},
  ): { context: ExecutionContext; req: any } => {
    const req: any = {
      user,
      params,
      headers,
    };
    const context = {
      switchToHttp: () => ({
        getRequest: () => req,
      }),
      getHandler: jest.fn(),
      getClass: jest.fn(),
    } as unknown as ExecutionContext;
    return { context, req };
  };

  it('should throw BadRequestException if workspaceId is missing in request', async () => {
    const { context } = createMockContext({ id: 'user-1' }, {});
    await expect(guard.canActivate(context)).rejects.toThrow(BadRequestException);
  });

  it('should throw NotFoundException if workspace does not exist', async () => {
    prisma.workspace.findUnique.mockResolvedValue(null);
    const { context } = createMockContext({ id: 'user-1' }, { workspaceId: 'non-existent' });
    await expect(guard.canActivate(context)).rejects.toThrow(NotFoundException);
  });

  it('should throw ForbiddenException if workspace is suspended', async () => {
    prisma.workspace.findUnique.mockResolvedValue({
      ...mockWorkspace,
      status: WorkspaceStatus.SUSPENDED,
    });
    const { context } = createMockContext({ id: 'user-1' }, { workspaceId: 'ws-123' });
    await expect(guard.canActivate(context)).rejects.toThrow(ForbiddenException);
  });

  it('should throw ForbiddenException if user is not a member of the workspace', async () => {
    prisma.workspace.findUnique.mockResolvedValue(mockWorkspace);
    prisma.workspaceMember.findUnique.mockResolvedValue(null);

    const { context } = createMockContext(
      { id: 'user-2', role: Role.BUSINESS_OWNER, status: UserStatus.ACTIVE },
      { workspaceId: 'ws-123' },
    );
    await expect(guard.canActivate(context)).rejects.toThrow(ForbiddenException);
  });

  it('should attach workspace and workspaceMember and return true for active authorized member', async () => {
    prisma.workspace.findUnique.mockResolvedValue(mockWorkspace);
    prisma.workspaceMember.findUnique.mockResolvedValue(mockMember);
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([WorkspaceRole.ADMIN]);

    const { context, req } = createMockContext(
      { id: 'user-1', role: Role.BUSINESS_OWNER, status: UserStatus.ACTIVE },
      { workspaceId: 'ws-123' },
    );

    const result = await guard.canActivate(context);
    expect(result).toBe(true);
    expect(req.workspace).toEqual(mockWorkspace);
    expect(req.workspaceMember).toEqual(mockMember);
  });

  it('should allow OWNER access even if route requires ADMIN', async () => {
    prisma.workspace.findUnique.mockResolvedValue(mockWorkspace);
    prisma.workspaceMember.findUnique.mockResolvedValue({
      ...mockMember,
      role: WorkspaceRole.OWNER,
    });
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([WorkspaceRole.ADMIN]);

    const { context } = createMockContext(
      { id: 'user-1', role: Role.BUSINESS_OWNER, status: UserStatus.ACTIVE },
      { workspaceId: 'ws-123' },
    );

    expect(await guard.canActivate(context)).toBe(true);
  });

  it('should throw ForbiddenException if user role is lower than required role', async () => {
    prisma.workspace.findUnique.mockResolvedValue(mockWorkspace);
    prisma.workspaceMember.findUnique.mockResolvedValue({
      ...mockMember,
      role: WorkspaceRole.VIEWER,
    });
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([WorkspaceRole.ADMIN]);

    const { context } = createMockContext(
      { id: 'user-1', role: Role.BUSINESS_OWNER, status: UserStatus.ACTIVE },
      { workspaceId: 'ws-123' },
    );

    await expect(guard.canActivate(context)).rejects.toThrow(ForbiddenException);
  });
});
