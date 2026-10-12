import { Test, TestingModule } from '@nestjs/testing';
import { WhiteLabelService } from './white-label.service';
import { PrismaService } from '../../prisma/prisma.service';
import { NotFoundException } from '@nestjs/common';

describe('WhiteLabelService', () => {
  let service: WhiteLabelService;
  let prisma: any;

  const mockWorkspaceId = 'ws-wl-123';
  const mockConfigId = 'wl-conf-456';

  const mockConfig = {
    id: mockConfigId,
    workspaceId: mockWorkspaceId,
    brandName: 'Vertex Marketing Agency',
    customDomain: 'portal.vertexagency.com',
    logoUrl: 'https://vertexagency.com/logo.png',
    faviconUrl: 'https://vertexagency.com/favicon.ico',
    primaryColor: '#7c3aed',
    secondaryColor: '#6d28d9',
    accentColor: '#10b981',
    supportEmail: 'ops@vertexagency.com',
    portalTitle: 'Vertex Client Intelligence Portal',
    customCss: ':root { --brand: #7c3aed; }',
    hidePoweredBy: true,
    clientAccessUrl: 'https://portal.vertexagency.com/client',
    isEnabled: true,
    createdAt: new Date('2026-06-01T12:00:00Z'),
    updatedAt: new Date('2026-06-01T12:00:00Z'),
  };

  beforeEach(async () => {
    prisma = {
      workspace: {
        findUnique: jest.fn(),
      },
      whiteLabelConfig: {
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        upsert: jest.fn(),
        deleteMany: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WhiteLabelService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<WhiteLabelService>(WhiteLabelService);
  });

  describe('getConfig', () => {
    it('returns white label configuration when found', async () => {
      prisma.whiteLabelConfig.findUnique.mockResolvedValue(mockConfig);

      const result = await service.getConfig(mockWorkspaceId);

      expect(prisma.whiteLabelConfig.findUnique).toHaveBeenCalledWith({
        where: { workspaceId: mockWorkspaceId },
      });
      expect(result).toBeDefined();
      expect(result?.brandName).toBe('Vertex Marketing Agency');
      expect(result?.customDomain).toBe('portal.vertexagency.com');
      expect(result?.hidePoweredBy).toBe(true);
    });

    it('returns null if no configuration exists for workspace', async () => {
      prisma.whiteLabelConfig.findUnique.mockResolvedValue(null);

      const result = await service.getConfig(mockWorkspaceId);

      expect(result).toBeNull();
    });
  });

  describe('upsertConfig', () => {
    it('throws NotFoundException if workspace does not exist', async () => {
      prisma.workspace.findUnique.mockResolvedValue(null);

      await expect(
        service.upsertConfig('invalid-ws', {
          brandName: 'New Brand',
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('upserts white-label configuration cleanly', async () => {
      prisma.workspace.findUnique.mockResolvedValue({ id: mockWorkspaceId });
      prisma.whiteLabelConfig.upsert.mockResolvedValue(mockConfig);

      const result = await service.upsertConfig(mockWorkspaceId, {
        brandName: 'Vertex Marketing Agency',
        customDomain: 'portal.vertexagency.com',
        primaryColor: '#7c3aed',
      });

      expect(prisma.whiteLabelConfig.upsert).toHaveBeenCalled();
      expect(result.brandName).toBe('Vertex Marketing Agency');
      expect(result.primaryColor).toBe('#7c3aed');
    });
  });

  describe('getPublicPortalConfig', () => {
    it('resolves branding by custom domain', async () => {
      prisma.whiteLabelConfig.findFirst.mockResolvedValue(mockConfig);

      const result = await service.getPublicPortalConfig('portal.vertexagency.com');

      expect(prisma.whiteLabelConfig.findFirst).toHaveBeenCalledWith({
        where: {
          customDomain: 'portal.vertexagency.com',
          isEnabled: true,
        },
        include: { workspace: true },
      });
      expect(result?.brandName).toBe('Vertex Marketing Agency');
    });

    it('resolves branding by workspace slug if domain not matched', async () => {
      prisma.whiteLabelConfig.findFirst.mockResolvedValue(null);
      prisma.workspace.findUnique.mockResolvedValue({
        id: mockWorkspaceId,
        slug: 'vertex-agency',
        whiteLabelConfig: mockConfig,
      });

      const result = await service.getPublicPortalConfig('vertex-agency');

      expect(result).toBeDefined();
      expect(result?.brandName).toBe('Vertex Marketing Agency');
    });

    it('returns null if identifier matches nothing', async () => {
      prisma.whiteLabelConfig.findFirst.mockResolvedValue(null);
      prisma.workspace.findUnique.mockResolvedValue(null);

      const result = await service.getPublicPortalConfig('unknown-portal');

      expect(result).toBeNull();
    });
  });

  describe('resetConfig', () => {
    it('deletes white-label config for workspace', async () => {
      prisma.whiteLabelConfig.deleteMany.mockResolvedValue({ count: 1 });

      const result = await service.resetConfig(mockWorkspaceId);

      expect(prisma.whiteLabelConfig.deleteMany).toHaveBeenCalledWith({
        where: { workspaceId: mockWorkspaceId },
      });
      expect(result).toEqual({ success: true });
    });
  });
});
