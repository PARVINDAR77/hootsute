import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { TokenVaultService } from '../../social-accounts/token-vault/token-vault.service';
import { UpsertWhatsAppConfigDto } from '../dto/upsert-whatsapp-config.dto';

@Injectable()
export class WhatsAppConfigService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tokenVault: TokenVaultService,
  ) {}

  async getWorkspaceConfig(workspaceId: string) {
    const config = await this.prisma.workspaceWhatsAppConfig.findUnique({
      where: { workspaceId },
    });

    if (!config) {
      return null;
    }

    return {
      id: config.id,
      workspaceId: config.workspaceId,
      wabaId: config.wabaId,
      phoneNumberId: config.phoneNumberId,
      businessPhoneNumber: config.businessPhoneNumber,
      hasConfiguredToken: !!config.encryptedAccessToken,
      isActive: config.isActive,
      createdAt: config.createdAt,
      updatedAt: config.updatedAt,
    };
  }

  async getDecryptedToken(workspaceId: string): Promise<{ accessToken: string; phoneNumberId: string } | null> {
    const config = await this.prisma.workspaceWhatsAppConfig.findUnique({
      where: { workspaceId },
    });

    if (!config || !config.encryptedAccessToken || !config.isActive) {
      return null;
    }

    const decrypted = this.tokenVault.decrypt(config.encryptedAccessToken);
    return {
      accessToken: decrypted,
      phoneNumberId: config.phoneNumberId,
    };
  }

  async upsertWorkspaceConfig(
    workspaceId: string,
    dto: UpsertWhatsAppConfigDto,
    userId: string,
  ) {
    const encryptedToken = this.tokenVault.encrypt(dto.systemUserAccessToken.trim());

    const result = await this.prisma.workspaceWhatsAppConfig.upsert({
      where: { workspaceId },
      create: {
        workspaceId,
        wabaId: dto.wabaId.trim(),
        phoneNumberId: dto.phoneNumberId.trim(),
        encryptedAccessToken: encryptedToken,
        businessPhoneNumber: dto.businessPhoneNumber?.trim() || null,
        isActive: true,
      },
      update: {
        wabaId: dto.wabaId.trim(),
        phoneNumberId: dto.phoneNumberId.trim(),
        encryptedAccessToken: encryptedToken,
        businessPhoneNumber: dto.businessPhoneNumber?.trim() || null,
        isActive: true,
      },
    });

    await this.prisma.auditLog.create({
      data: {
        workspaceId,
        actorUserId: userId,
        action: 'WHATSAPP_CONFIG_UPSERT',
        entityType: 'WorkspaceWhatsAppConfig',
        entityId: result.id,
        metadata: {
          wabaId: dto.wabaId,
          phoneNumberId: dto.phoneNumberId,
        },
      },
    });

    return {
      id: result.id,
      workspaceId: result.workspaceId,
      wabaId: result.wabaId,
      phoneNumberId: result.phoneNumberId,
      businessPhoneNumber: result.businessPhoneNumber,
      hasConfiguredToken: true,
      isActive: result.isActive,
      updatedAt: result.updatedAt,
    };
  }
}
