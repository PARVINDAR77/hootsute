import { Test, TestingModule } from '@nestjs/testing';
import { WhatsAppConfigService } from './whatsapp-config.service';
import { PrismaService } from '../../prisma/prisma.service';
import { TokenVaultService } from '../../social-accounts/token-vault/token-vault.service';

describe('WhatsAppConfigService', () => {
  let service: WhatsAppConfigService;
  let prisma: any;
  let tokenVault: any;

  const mockPrisma = {
    workspaceWhatsAppConfig: {
      findUnique: jest.fn(),
      upsert: jest.fn(),
    },
    auditLog: {
      create: jest.fn(),
    },
  };

  const mockTokenVault = {
    encrypt: jest.fn((text: string) => `encrypted_${text}`),
    decrypt: jest.fn((text: string) => text.replace('encrypted_', '')),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WhatsAppConfigService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: TokenVaultService, useValue: mockTokenVault },
      ],
    }).compile();

    service = module.get<WhatsAppConfigService>(WhatsAppConfigService);
    prisma = module.get(PrismaService);
    tokenVault = module.get(TokenVaultService);
  });

  const wsId = 'ws-uuid-1';
  const userId = 'user-uuid-1';

  it('upserts workspace WhatsApp config with encrypted token and logs audit event', async () => {
    mockPrisma.workspaceWhatsAppConfig.upsert.mockResolvedValue({
      id: 'cfg-1',
      workspaceId: wsId,
      wabaId: 'waba-12345',
      phoneNumberId: 'phone-id-67890',
      businessPhoneNumber: '+15551234567',
      encryptedAccessToken: 'encrypted_raw_token_xyz',
      isActive: true,
      updatedAt: new Date(),
    });

    const result = await service.upsertWorkspaceConfig(
      wsId,
      {
        wabaId: 'waba-12345',
        phoneNumberId: 'phone-id-67890',
        systemUserAccessToken: 'raw_token_xyz',
        businessPhoneNumber: '+15551234567',
      },
      userId,
    );

    expect(tokenVault.encrypt).toHaveBeenCalledWith('raw_token_xyz');
    expect(mockPrisma.workspaceWhatsAppConfig.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { workspaceId: wsId },
        create: expect.objectContaining({
          encryptedAccessToken: 'encrypted_raw_token_xyz',
        }),
      }),
    );
    expect(result.hasConfiguredToken).toBe(true);
    expect((result as any).encryptedAccessToken).toBeUndefined(); // Never leaks token
    expect(mockPrisma.auditLog.create).toHaveBeenCalled();
  });

  it('returns decrypted credentials safely via getDecryptedToken', async () => {
    mockPrisma.workspaceWhatsAppConfig.findUnique.mockResolvedValue({
      workspaceId: wsId,
      encryptedAccessToken: 'encrypted_secret_token_123',
      phoneNumberId: 'phone-id-123',
      isActive: true,
    });

    const credentials = await service.getDecryptedToken(wsId);
    expect(credentials).toEqual({
      accessToken: 'secret_token_123',
      phoneNumberId: 'phone-id-123',
    });
  });

  it('returns null for unconfigured workspace', async () => {
    mockPrisma.workspaceWhatsAppConfig.findUnique.mockResolvedValue(null);
    const result = await service.getWorkspaceConfig(wsId);
    expect(result).toBeNull();
  });
});
