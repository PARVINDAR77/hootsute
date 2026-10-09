import { Test, TestingModule } from '@nestjs/testing';
import { WorkspacesService } from './workspaces.service';
import { PrismaService } from '../prisma/prisma.service';
import {
  ConflictException,
  ForbiddenException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import {
  WorkspaceRole,
  WorkspaceStatus,
  WorkspaceMemberStatus,
} from '@prisma/client';

describe('WorkspacesService', () => {
  let service: WorkspacesService;
  let prisma: any;

  const mockPrisma = {
    $transaction: jest.fn(),
    workspace: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
    },
    workspaceMember: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    workspaceInvitation: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
    },
    auditLog: {
      create: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WorkspacesService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<WorkspacesService>(WorkspacesService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should transactionally create a workspace and assign caller as OWNER', async () => {
      mockPrisma.workspace.findUnique.mockResolvedValue(null);
      mockPrisma.$transaction.mockImplementation(async (callback) => {
        return callback({
          workspace: {
            create: jest.fn().mockResolvedValue({
              id: 'ws-uuid-1',
              name: 'Acme Brand',
              slug: 'acme-brand',
              status: WorkspaceStatus.ACTIVE,
              createdById: 'user-1',
            }),
          },
          workspaceMember: {
            create: jest.fn().mockResolvedValue({
              id: 'member-1',
              workspaceId: 'ws-uuid-1',
              userId: 'user-1',
              role: WorkspaceRole.OWNER,
            }),
          },
          auditLog: {
            create: jest.fn().mockResolvedValue({ id: 'audit-1' }),
          },
        });
      });

      const result = await service.create('user-1', {
        name: 'Acme Brand',
      });

      expect(result).toHaveProperty('id', 'ws-uuid-1');
      expect(result).toHaveProperty('currentUserRole', WorkspaceRole.OWNER);
      expect(result).toHaveProperty('slug', 'acme-brand');
    });

    it('should throw ConflictException if custom slug is already taken', async () => {
      mockPrisma.workspace.findUnique.mockResolvedValue({ id: 'existing-ws' });

      await expect(
        service.create('user-1', {
          name: 'Acme Brand',
          slug: 'existing-slug',
        }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('updateMemberRole', () => {
    it('should prevent modifying the role of the OWNER', async () => {
      mockPrisma.workspaceMember.findUnique.mockResolvedValueOnce({
        id: 'owner-member',
        workspaceId: 'ws-1',
        userId: 'user-owner',
        role: WorkspaceRole.OWNER,
      });

      await expect(
        service.updateMemberRole(
          'ws-1',
          'owner-member',
          { role: WorkspaceRole.ADMIN },
          'user-admin',
        ),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should prevent promoting someone to OWNER via role update', async () => {
      mockPrisma.workspaceMember.findUnique.mockResolvedValueOnce({
        id: 'editor-member',
        workspaceId: 'ws-1',
        userId: 'user-editor',
        role: WorkspaceRole.EDITOR,
      });

      await expect(
        service.updateMemberRole(
          'ws-1',
          'editor-member',
          { role: WorkspaceRole.OWNER },
          'user-owner',
        ),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('removeMember', () => {
    it('should prevent removing the OWNER of the workspace', async () => {
      mockPrisma.workspaceMember.findUnique.mockResolvedValueOnce({
        id: 'owner-member',
        workspaceId: 'ws-1',
        userId: 'user-owner',
        role: WorkspaceRole.OWNER,
      });

      await expect(
        service.removeMember('ws-1', 'owner-member', 'user-owner'),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should prevent an ADMIN from removing another ADMIN', async () => {
      mockPrisma.workspaceMember.findUnique
        .mockResolvedValueOnce({
          id: 'admin-target',
          workspaceId: 'ws-1',
          userId: 'user-target',
          role: WorkspaceRole.ADMIN,
        })
        .mockResolvedValueOnce({
          id: 'admin-actor',
          workspaceId: 'ws-1',
          userId: 'user-actor',
          role: WorkspaceRole.ADMIN,
        });

      await expect(
        service.removeMember('ws-1', 'admin-target', 'user-actor'),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('transferOwnership', () => {
    it('should atomically swap roles between current OWNER and target member', async () => {
      mockPrisma.workspaceMember.findUnique
        .mockResolvedValueOnce({
          id: 'member-owner',
          workspaceId: 'ws-1',
          userId: 'user-owner',
          role: WorkspaceRole.OWNER,
        })
        .mockResolvedValueOnce({
          id: 'member-target',
          workspaceId: 'ws-1',
          userId: 'user-target',
          role: WorkspaceRole.ADMIN,
          status: WorkspaceMemberStatus.ACTIVE,
          user: { name: 'New Owner' },
        });

      mockPrisma.$transaction.mockResolvedValue([{}, {}, {}]);

      const result = await service.transferOwnership('ws-1', 'member-target', 'user-owner');
      expect(result.success).toBe(true);
      expect(mockPrisma.$transaction).toHaveBeenCalled();
    });

    it('should throw ForbiddenException if caller is not the OWNER', async () => {
      mockPrisma.workspaceMember.findUnique.mockResolvedValueOnce({
        id: 'member-admin',
        workspaceId: 'ws-1',
        userId: 'user-admin',
        role: WorkspaceRole.ADMIN,
      });

      await expect(
        service.transferOwnership('ws-1', 'member-target', 'user-admin'),
      ).rejects.toThrow(ForbiddenException);
    });
  });
});
