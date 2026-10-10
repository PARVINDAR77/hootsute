import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpsertBrandProfileDto } from './dto/upsert-brand-profile.dto';

@Injectable()
export class BrandProfileService {
  constructor(private readonly prisma: PrismaService) {}

  async getBrandProfile(workspaceId: string) {
    const profile = await this.prisma.workspaceBrandProfile.findUnique({
      where: { workspaceId },
    });

    if (!profile) {
      // If brand profile does not exist yet, fetch workspace details as smart defaults
      const workspace = await this.prisma.workspace.findUnique({
        where: { id: workspaceId },
      });

      if (!workspace) {
        throw new NotFoundException('Workspace not found');
      }

      return {
        id: null,
        workspaceId,
        businessName: workspace.name,
        industry: workspace.industry || null,
        businessDescription: workspace.description || null,
        targetAudience: null,
        productsAndServices: null,
        brandVoice: null,
        preferredLanguage: workspace.defaultLanguage || 'en',
        supportedLanguages: [workspace.defaultLanguage || 'en'],
        primaryColor: null,
        secondaryColor: null,
        logoUrl: workspace.logoUrl || null,
        slogan: null,
        websiteUrl: workspace.websiteUrl || null,
        contactDetails: null,
        brandGuidelines: null,
        createdAt: null,
        updatedAt: null,
      };
    }

    return profile;
  }

  async upsertBrandProfile(
    workspaceId: string,
    actorUserId: string,
    dto: UpsertBrandProfileDto,
  ) {
    // Verify workspace exists
    const workspace = await this.prisma.workspace.findUnique({
      where: { id: workspaceId },
    });

    if (!workspace) {
      throw new NotFoundException('Workspace not found');
    }

    // Safely upsert brand profile ensuring workspaceId cannot be manipulated
    const profile = await this.prisma.workspaceBrandProfile.upsert({
      where: { workspaceId },
      create: {
        workspaceId,
        businessName: dto.businessName.trim(),
        industry: dto.industry?.trim() || null,
        businessDescription: dto.businessDescription?.trim() || null,
        targetAudience: dto.targetAudience?.trim() || null,
        productsAndServices: dto.productsAndServices?.trim() || null,
        brandVoice: dto.brandVoice?.trim() || null,
        preferredLanguage: dto.preferredLanguage?.trim() || 'en',
        supportedLanguages: dto.supportedLanguages && dto.supportedLanguages.length > 0
          ? dto.supportedLanguages
          : ['en'],
        primaryColor: dto.primaryColor?.trim() || null,
        secondaryColor: dto.secondaryColor?.trim() || null,
        logoUrl: dto.logoUrl?.trim() || null,
        slogan: dto.slogan?.trim() || null,
        websiteUrl: dto.websiteUrl?.trim() || null,
        contactDetails: dto.contactDetails ? (dto.contactDetails as any) : null,
        brandGuidelines: dto.brandGuidelines?.trim() || null,
      },
      update: {
        businessName: dto.businessName.trim(),
        industry: dto.industry !== undefined ? dto.industry?.trim() || null : undefined,
        businessDescription: dto.businessDescription !== undefined ? dto.businessDescription?.trim() || null : undefined,
        targetAudience: dto.targetAudience !== undefined ? dto.targetAudience?.trim() || null : undefined,
        productsAndServices: dto.productsAndServices !== undefined ? dto.productsAndServices?.trim() || null : undefined,
        brandVoice: dto.brandVoice !== undefined ? dto.brandVoice?.trim() || null : undefined,
        preferredLanguage: dto.preferredLanguage !== undefined ? dto.preferredLanguage?.trim() || 'en' : undefined,
        supportedLanguages: dto.supportedLanguages !== undefined ? dto.supportedLanguages : undefined,
        primaryColor: dto.primaryColor !== undefined ? dto.primaryColor?.trim() || null : undefined,
        secondaryColor: dto.secondaryColor !== undefined ? dto.secondaryColor?.trim() || null : undefined,
        logoUrl: dto.logoUrl !== undefined ? dto.logoUrl?.trim() || null : undefined,
        slogan: dto.slogan !== undefined ? dto.slogan?.trim() || null : undefined,
        websiteUrl: dto.websiteUrl !== undefined ? dto.websiteUrl?.trim() || null : undefined,
        contactDetails: dto.contactDetails !== undefined ? (dto.contactDetails as any) : undefined,
        brandGuidelines: dto.brandGuidelines !== undefined ? dto.brandGuidelines?.trim() || null : undefined,
      },
    });

    // Record audit log
    await this.prisma.auditLog.create({
      data: {
        workspaceId,
        actorUserId,
        action: 'BRAND_PROFILE_UPSERT',
        entityType: 'WorkspaceBrandProfile',
        entityId: profile.id,
        metadata: {
          businessName: profile.businessName,
          preferredLanguage: profile.preferredLanguage,
          hasLogo: !!profile.logoUrl,
          primaryColor: profile.primaryColor,
        },
      },
    });

    return profile;
  }
}
