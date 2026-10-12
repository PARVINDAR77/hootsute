import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { UpsertWhiteLabelConfigDto } from '../dto/upsert-white-label.dto';
import { WhiteLabelConfigDto } from '@packages/shared';

@Injectable()
export class WhiteLabelService {
  constructor(private readonly prisma: PrismaService) {}

  async getConfig(workspaceId: string): Promise<WhiteLabelConfigDto | null> {
    const config = await this.prisma.whiteLabelConfig.findUnique({
      where: { workspaceId },
    });

    if (!config) {
      return null;
    }

    return this.mapToDto(config);
  }

  async upsertConfig(
    workspaceId: string,
    dto: UpsertWhiteLabelConfigDto,
  ): Promise<WhiteLabelConfigDto> {
    const workspace = await this.prisma.workspace.findUnique({
      where: { id: workspaceId },
    });

    if (!workspace) {
      throw new NotFoundException(`Workspace ${workspaceId} not found`);
    }

    const config = await this.prisma.whiteLabelConfig.upsert({
      where: { workspaceId },
      create: {
        workspaceId,
        brandName: dto.brandName,
        customDomain: dto.customDomain?.trim().toLowerCase() || null,
        logoUrl: dto.logoUrl || null,
        faviconUrl: dto.faviconUrl || null,
        primaryColor: dto.primaryColor || '#6366f1',
        secondaryColor: dto.secondaryColor || '#4f46e5',
        accentColor: dto.accentColor || '#06b6d4',
        supportEmail: dto.supportEmail || null,
        portalTitle: dto.portalTitle || `${dto.brandName} Client Portal`,
        customCss: dto.customCss || null,
        hidePoweredBy: dto.hidePoweredBy ?? false,
        clientAccessUrl: dto.clientAccessUrl || null,
        isEnabled: dto.isEnabled ?? true,
      },
      update: {
        brandName: dto.brandName,
        customDomain: dto.customDomain?.trim().toLowerCase() || null,
        logoUrl: dto.logoUrl !== undefined ? dto.logoUrl : undefined,
        faviconUrl: dto.faviconUrl !== undefined ? dto.faviconUrl : undefined,
        primaryColor: dto.primaryColor,
        secondaryColor: dto.secondaryColor,
        accentColor: dto.accentColor,
        supportEmail: dto.supportEmail !== undefined ? dto.supportEmail : undefined,
        portalTitle: dto.portalTitle,
        customCss: dto.customCss !== undefined ? dto.customCss : undefined,
        hidePoweredBy: dto.hidePoweredBy,
        clientAccessUrl: dto.clientAccessUrl !== undefined ? dto.clientAccessUrl : undefined,
        isEnabled: dto.isEnabled,
      },
    });

    return this.mapToDto(config);
  }

  async getPublicPortalConfig(domainOrSlug: string): Promise<Partial<WhiteLabelConfigDto> | null> {
    const cleanIdentifier = domainOrSlug.trim().toLowerCase();

    // Check by custom domain first
    let config = await this.prisma.whiteLabelConfig.findFirst({
      where: {
        customDomain: cleanIdentifier,
        isEnabled: true,
      },
      include: { workspace: true },
    });

    // If not found, check by workspace slug
    if (!config) {
      const workspace = await this.prisma.workspace.findUnique({
        where: { slug: cleanIdentifier },
        include: { whiteLabelConfig: true },
      });
      if (workspace?.whiteLabelConfig?.isEnabled) {
        config = workspace.whiteLabelConfig as any;
      }
    }

    if (!config) {
      return null;
    }

    return {
      id: config.id,
      workspaceId: config.workspaceId,
      brandName: config.brandName,
      logoUrl: config.logoUrl,
      faviconUrl: config.faviconUrl,
      primaryColor: config.primaryColor,
      secondaryColor: config.secondaryColor,
      accentColor: config.accentColor,
      portalTitle: config.portalTitle,
      customCss: config.customCss,
      hidePoweredBy: config.hidePoweredBy,
    };
  }

  async resetConfig(workspaceId: string): Promise<{ success: boolean }> {
    await this.prisma.whiteLabelConfig.deleteMany({
      where: { workspaceId },
    });
    return { success: true };
  }

  private mapToDto(raw: any): WhiteLabelConfigDto {
    return {
      id: raw.id,
      workspaceId: raw.workspaceId,
      brandName: raw.brandName,
      customDomain: raw.customDomain,
      logoUrl: raw.logoUrl,
      faviconUrl: raw.faviconUrl,
      primaryColor: raw.primaryColor,
      secondaryColor: raw.secondaryColor,
      accentColor: raw.accentColor,
      supportEmail: raw.supportEmail,
      portalTitle: raw.portalTitle,
      customCss: raw.customCss,
      hidePoweredBy: raw.hidePoweredBy,
      clientAccessUrl: raw.clientAccessUrl,
      isEnabled: raw.isEnabled,
      createdAt: raw.createdAt.toISOString(),
      updatedAt: raw.updatedAt.toISOString(),
    };
  }
}
