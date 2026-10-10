import { Test, TestingModule } from '@nestjs/testing';
import { BrandProfileService } from './brand-profile.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotFoundException } from '@nestjs/common';

describe('BrandProfileService', () => {
  let service: BrandProfileService;
  let prisma: any;

  const mockPrismaService = {
    workspace: {
      findUnique: jest.fn(),
    },
    workspaceBrandProfile: {
      findUnique: jest.fn(),
      upsert: jest.fn(),
    },
    auditLog: {
      create: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BrandProfileService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<BrandProfileService>(BrandProfileService);
    prisma = module.get(PrismaService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getBrandProfile', () => {
    it('should return existing profile if found', async () => {
      const mockProfile = {
        id: 'bp-1',
        workspaceId: 'ws-1',
        businessName: 'Acme Crafts',
        industry: 'Handicrafts',
        preferredLanguage: 'en',
      };
      prisma.workspaceBrandProfile.findUnique.mockResolvedValue(mockProfile);

      const result = await service.getBrandProfile('ws-1');
      expect(result).toEqual(mockProfile);
      expect(prisma.workspaceBrandProfile.findUnique).toHaveBeenCalledWith({
        where: { workspaceId: 'ws-1' },
      });
    });

    it('should return workspace fallback defaults if profile does not exist', async () => {
      prisma.workspaceBrandProfile.findUnique.mockResolvedValue(null);
      prisma.workspace.findUnique.mockResolvedValue({
        id: 'ws-1',
        name: 'Workspace One',
        industry: 'Retail',
        description: 'Retail business',
        defaultLanguage: 'gu',
        logoUrl: 'https://logo.png',
        websiteUrl: 'https://acme.com',
      });

      const result = await service.getBrandProfile('ws-1');
      expect(result.businessName).toBe('Workspace One');
      expect(result.industry).toBe('Retail');
      expect(result.preferredLanguage).toBe('gu');
      expect(result.id).toBeNull();
    });

    it('should throw NotFoundException if workspace does not exist', async () => {
      prisma.workspaceBrandProfile.findUnique.mockResolvedValue(null);
      prisma.workspace.findUnique.mockResolvedValue(null);

      await expect(service.getBrandProfile('invalid-ws')).rejects.toThrow(NotFoundException);
    });
  });

  describe('upsertBrandProfile', () => {
    it('should upsert profile and record audit log', async () => {
      prisma.workspace.findUnique.mockResolvedValue({ id: 'ws-1', name: 'Acme' });
      prisma.workspaceBrandProfile.upsert.mockResolvedValue({
        id: 'bp-1',
        workspaceId: 'ws-1',
        businessName: 'Acme Updated',
        primaryColor: '#2E5BFF',
      });
      prisma.auditLog.create.mockResolvedValue({ id: 'audit-1' });

      const result = await service.upsertBrandProfile('ws-1', 'user-1', {
        businessName: 'Acme Updated',
        primaryColor: '#2E5BFF',
      });

      expect(result.businessName).toBe('Acme Updated');
      expect(prisma.workspaceBrandProfile.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { workspaceId: 'ws-1' },
        }),
      );
      expect(prisma.auditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            action: 'BRAND_PROFILE_UPSERT',
            workspaceId: 'ws-1',
            actorUserId: 'user-1',
          }),
        }),
      );
    });

    it('should throw NotFoundException if workspace does not exist during upsert', async () => {
      prisma.workspace.findUnique.mockResolvedValue(null);

      await expect(
        service.upsertBrandProfile('invalid-ws', 'user-1', { businessName: 'Test' }),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
