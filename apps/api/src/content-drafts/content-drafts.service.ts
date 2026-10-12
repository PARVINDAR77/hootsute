import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  Inject,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PromptSynthesisService } from '../content-generation/prompt-synthesis/prompt-synthesis.service';
import {
  TEXT_GENERATION_PROVIDER,
  TextGenerationProvider,
} from '../content-generation/ai-provider/text-generation-provider.interface';
import {
  IMAGE_GENERATION_PROVIDER,
  ImageGenerationProvider,
} from '../content-generation/ai-provider/image-generation-provider.interface';
import { BrandProfileService } from '../brand-profile/brand-profile.service';
import { CreateContentDraftDto } from './dto/create-draft.dto';
import { UpdateContentDraftDto } from './dto/update-draft.dto';
import { QueryDraftsDto } from './dto/query-drafts.dto';
import { RegenerateVariantDto } from './dto/regenerate-variant.dto';
import { TranslateVariantDto } from './dto/translate-variant.dto';
import { AdaptVariantDto } from './dto/adapt-variant.dto';
import { RejectDraftDto } from './dto/approval-action.dto';
import { GenerateCreativeBriefDto } from './dto/creative-brief.dto';
import {
  DraftStatus,
  WorkspaceRole,
  Prisma,
} from '@prisma/client';
import { BrandTone } from '@packages/shared';

function sanitizeSnapshot(data: any): any {
  if (!data || typeof data !== 'object') return data;
  if (Array.isArray(data)) return data.map(sanitizeSnapshot);

  const sensitiveKeys = ['password', 'secret', 'token', 'authorization', 'cookie', 'key', 'encryptedaccesstoken'];
  const sanitized: any = {};
  for (const [k, v] of Object.entries(data)) {
    if (sensitiveKeys.some((s) => k.toLowerCase().includes(s))) {
      sanitized[k] = '[REDACTED]';
    } else if (typeof v === 'object' && v !== null) {
      sanitized[k] = sanitizeSnapshot(v);
    } else {
      sanitized[k] = v;
    }
  }
  return sanitized;
}

@Injectable()
export class ContentDraftsService {
  private readonly logger = new Logger(ContentDraftsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly promptSynthesis: PromptSynthesisService,
    private readonly brandProfileService: BrandProfileService,
    @Inject(TEXT_GENERATION_PROVIDER)
    private readonly textProvider: TextGenerationProvider,
    @Inject(IMAGE_GENERATION_PROVIDER)
    private readonly imageProvider: ImageGenerationProvider,
  ) {}

  async createDraft(
    workspaceId: string,
    userId: string,
    dto: CreateContentDraftDto,
  ) {
    return this.prisma.$transaction(async (tx) => {
      const draft = await tx.contentDraft.create({
        data: {
          workspaceId,
          createdByUserId: userId,
          title: dto.title.trim(),
          objective: dto.objective,
          contentType: dto.contentType,
          language: dto.language?.trim() || 'en',
          status: DraftStatus.DRAFT,
          variants: dto.variants?.length
            ? {
                create: dto.variants.map((v) => ({
                  platform: v.platform,
                  headline: v.headline?.trim() || null,
                  body: v.body.trim(),
                  callToAction: v.callToAction?.trim() || null,
                  hashtags: v.hashtags || [],
                  linkUrl: v.linkUrl?.trim() || null,
                  mediaBrief: v.mediaBrief?.trim() || null,
                  mediaAssetUrl: v.mediaAssetUrl?.trim() || null,
                  mediaAssetId: v.mediaAssetId || null,
                })),
              }
            : undefined,
        },
        include: {
          variants: {
            include: {
              mediaAsset: true,
            },
          },
        },
      });

      // Append initial revision
      await tx.contentRevision.create({
        data: {
          draftId: draft.id,
          revisionNumber: 1,
          action: 'INITIAL_CREATION',
          promptSummary: 'Initial draft and variants created',
          inputSnapshot: sanitizeSnapshot(dto),
          outputSnapshot: {
            title: draft.title,
            objective: draft.objective,
            variants: draft.variants,
          },
          createdByUserId: userId,
        },
      });

      // Audit log
      await tx.auditLog.create({
        data: {
          workspaceId,
          actorUserId: userId,
          action: 'CONTENT_DRAFT_CREATE',
          entityType: 'ContentDraft',
          entityId: draft.id,
          metadata: {
            title: draft.title,
            variantCount: draft.variants.length,
          },
        },
      });

      return draft;
    });
  }

  async listDrafts(workspaceId: string, query: QueryDraftsDto) {
    const page = Math.max(1, query.page || 1);
    const limit = Math.min(100, Math.max(1, query.limit || 20));
    const skip = (page - 1) * limit;

    const where: Prisma.ContentDraftWhereInput = {
      workspaceId,
    };

    if (query.status) {
      where.status = query.status;
    }

    if (query.objective) {
      where.objective = query.objective;
    }

    if (query.contentType) {
      where.contentType = query.contentType;
    }

    if (query.search) {
      where.title = {
        contains: query.search.trim(),
        mode: 'insensitive',
      };
    }

    const [total, drafts] = await Promise.all([
      this.prisma.contentDraft.count({ where }),
      this.prisma.contentDraft.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          variants: true,
          createdBy: {
            select: { id: true, name: true, email: true },
          },
          approvalRequestedBy: {
            select: { id: true, name: true, email: true },
          },
          approvedBy: {
            select: { id: true, name: true, email: true },
          },
        },
      }),
    ]);

    return {
      items: drafts,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getDraft(workspaceId: string, draftId: string) {
    const draft = await this.prisma.contentDraft.findUnique({
      where: { id: draftId },
      include: {
        variants: {
          include: {
            mediaAsset: true,
          },
        },
        revisions: {
          orderBy: { revisionNumber: 'desc' },
          take: 20,
          include: {
            createdByUser: {
              select: { id: true, name: true, email: true },
            },
          },
        },
        createdBy: {
          select: { id: true, name: true, email: true },
        },
        approvalRequestedBy: {
          select: { id: true, name: true, email: true },
        },
        approvedBy: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    if (!draft || draft.workspaceId !== workspaceId) {
      throw new NotFoundException('Content draft not found in this workspace');
    }

    return draft;
  }

  async updateDraft(
    workspaceId: string,
    draftId: string,
    userId: string,
    dto: UpdateContentDraftDto,
  ) {
    const existing = await this.getDraft(workspaceId, draftId);

    if (existing.status === DraftStatus.APPROVED) {
      throw new BadRequestException('Approved content drafts cannot be directly modified. Duplicate or resubmit for review.');
    }

    return this.prisma.$transaction(async (tx) => {
      // If draft was REJECTED, editing it resets lifecycle back to DRAFT with explicit audit and revision
      const isReopeningFromRejection = existing.status === DraftStatus.REJECTED;
      const newStatus = isReopeningFromRejection ? DraftStatus.DRAFT : existing.status;
      const revisionAction = isReopeningFromRejection ? 'REOPEN_AFTER_REJECTION' : 'MANUAL_EDIT';
      const promptSummary = isReopeningFromRejection
        ? `Draft reopened and reset to DRAFT upon editor revisions (Previous rejection: ${existing.rejectionReason || 'No reason provided'})`
        : 'Draft updated by user';

      const updatedDraft = await tx.contentDraft.update({
        where: { id: draftId },
        data: {
          title: dto.title !== undefined ? dto.title.trim() : undefined,
          objective: dto.objective,
          contentType: dto.contentType,
          language: dto.language !== undefined ? dto.language.trim() : undefined,
          status: newStatus,
          updatedByUserId: userId,
          rejectionReason: newStatus === DraftStatus.DRAFT ? null : undefined,
        },
      });

      // Update or create variants if provided
      if (dto.variants && dto.variants.length > 0) {
        for (const v of dto.variants) {
          if (v.id) {
            // Verify variant belongs to this draft
            const existingVar = existing.variants.find((ev) => ev.id === v.id);
            if (!existingVar) {
              throw new BadRequestException(`Variant ${v.id} does not belong to draft ${draftId}`);
            }

            await tx.contentVariant.update({
              where: { id: v.id },
              data: {
                headline: v.headline !== undefined ? v.headline?.trim() || null : undefined,
                body: v.body !== undefined ? v.body.trim() : undefined,
                callToAction: v.callToAction !== undefined ? v.callToAction?.trim() || null : undefined,
                hashtags: v.hashtags !== undefined ? v.hashtags : undefined,
                linkUrl: v.linkUrl !== undefined ? v.linkUrl?.trim() || null : undefined,
                mediaBrief: v.mediaBrief !== undefined ? v.mediaBrief?.trim() || null : undefined,
                mediaAssetUrl: v.mediaAssetUrl !== undefined ? v.mediaAssetUrl?.trim() || null : undefined,
                mediaAssetId: v.mediaAssetId !== undefined ? v.mediaAssetId || null : undefined,
              },
            });
          } else if (v.platform && v.body) {
            await tx.contentVariant.create({
              data: {
                draftId,
                platform: v.platform,
                headline: v.headline?.trim() || null,
                body: v.body.trim(),
                callToAction: v.callToAction?.trim() || null,
                hashtags: v.hashtags || [],
                linkUrl: v.linkUrl?.trim() || null,
                mediaBrief: v.mediaBrief?.trim() || null,
                mediaAssetUrl: v.mediaAssetUrl?.trim() || null,
                mediaAssetId: v.mediaAssetId || null,
              },
            });
          }
        }
      }

      const nextRevNumber = await this.getNextRevisionNumber(tx, draftId);

      // Append revision with sanitized snapshot
      await tx.contentRevision.create({
        data: {
          draftId,
          revisionNumber: nextRevNumber,
          action: revisionAction,
          promptSummary,
          inputSnapshot: sanitizeSnapshot(dto),
          outputSnapshot: {
            title: updatedDraft.title,
            objective: updatedDraft.objective,
            status: updatedDraft.status,
          },
          createdByUserId: userId,
        },
      });

      // Audit log
      await tx.auditLog.create({
        data: {
          workspaceId,
          actorUserId: userId,
          action: isReopeningFromRejection ? 'CONTENT_DRAFT_REOPEN' : 'CONTENT_DRAFT_UPDATE',
          entityType: 'ContentDraft',
          entityId: draftId,
          metadata: {
            title: updatedDraft.title,
            previousStatus: existing.status,
            newStatus,
            reopenedFromRejection: isReopeningFromRejection,
          },
        },
      });

      return tx.contentDraft.findUnique({
        where: { id: draftId },
        include: {
          variants: {
            include: {
              mediaAsset: true,
            },
          },
        },
      });
    });
  }

  async duplicateDraft(workspaceId: string, draftId: string, userId: string) {
    const source = await this.getDraft(workspaceId, draftId);

    return this.prisma.$transaction(async (tx) => {
      const copy = await tx.contentDraft.create({
        data: {
          workspaceId,
          createdByUserId: userId,
          title: `${source.title} (Copy)`,
          objective: source.objective,
          contentType: source.contentType,
          language: source.language,
          status: DraftStatus.DRAFT,
          variants: {
            create: source.variants.map((v) => ({
              platform: v.platform,
              headline: v.headline,
              body: v.body,
              callToAction: v.callToAction,
              hashtags: v.hashtags,
              linkUrl: v.linkUrl,
              mediaBrief: v.mediaBrief,
              mediaAssetUrl: v.mediaAssetUrl,
            })),
          },
        },
        include: {
          variants: true,
        },
      });

      await tx.contentRevision.create({
        data: {
          draftId: copy.id,
          revisionNumber: 1,
          action: 'DUPLICATE',
          promptSummary: `Cloned from draft ${draftId}`,
          inputSnapshot: { sourceDraftId: draftId },
          outputSnapshot: {
            title: copy.title,
            variantsCount: copy.variants.length,
          },
          createdByUserId: userId,
        },
      });

      await tx.auditLog.create({
        data: {
          workspaceId,
          actorUserId: userId,
          action: 'CONTENT_DRAFT_DUPLICATE',
          entityType: 'ContentDraft',
          entityId: copy.id,
          metadata: {
            sourceDraftId: draftId,
            newDraftId: copy.id,
          },
        },
      });

      return copy;
    });
  }

  async deleteDraft(
    workspaceId: string,
    draftId: string,
    userRole: WorkspaceRole,
    userId: string,
  ) {
    const draft = await this.getDraft(workspaceId, draftId);

    // Lifecycle check: Approved drafts cannot be deleted by ordinary editors
    if (draft.status === DraftStatus.APPROVED && userRole === WorkspaceRole.EDITOR) {
      throw new ForbiddenException('Approved drafts can only be deleted by workspace Admins or Owners');
    }

    if (userRole === WorkspaceRole.EDITOR && draft.createdByUserId !== userId) {
      throw new ForbiddenException('You can only delete content drafts created by yourself');
    }

    await this.prisma.contentDraft.delete({
      where: { id: draftId },
    });

    await this.prisma.auditLog.create({
      data: {
        workspaceId,
        actorUserId: userId,
        action: 'CONTENT_DRAFT_DELETE',
        entityType: 'ContentDraft',
        entityId: draftId,
        metadata: {
          deletedDraftTitle: draft.title,
        },
      },
    });

    return { success: true, message: 'Draft deleted successfully' };
  }

  async regenerateVariant(
    workspaceId: string,
    draftId: string,
    variantId: string,
    userId: string,
    dto: RegenerateVariantDto,
  ) {
    const draft = await this.getDraft(workspaceId, draftId);
    if (draft.status === DraftStatus.APPROVED) {
      throw new BadRequestException('Cannot regenerate variants of an approved draft. Create a revision or duplicate draft.');
    }

    const variant = draft.variants.find((v) => v.id === variantId);
    if (!variant) {
      throw new NotFoundException(`Variant with id ${variantId} does not belong to draft ${draftId}`);
    }

    const brandProfile = await this.brandProfileService.getBrandProfile(workspaceId);

    const promptObj = this.promptSynthesis.synthesizeRegenerationPrompt({
      brandProfile,
      platform: variant.platform,
      language: draft.language,
      tone: dto.tone || BrandTone.PROFESSIONAL,
      field: dto.field || 'all',
      currentContent: {
        headline: variant.headline,
        body: variant.body,
        callToAction: variant.callToAction,
        hashtags: variant.hashtags,
      },
      userInstructions: dto.instructions,
    });

    const aiResult = await this.textProvider.generateText({
      systemPrompt: promptObj.systemPrompt,
      userPrompt: promptObj.userPrompt,
    });

    const parsed = this.promptSynthesis.parseAndValidateOutput(aiResult.rawText);

    // CRITICAL: Preserve all unrelated fields when regenerating a targeted field
    const field = dto.field || 'all';
    const updatedData: any = {};

    if (field === 'headline') {
      updatedData.headline = parsed.headline || variant.headline;
    } else if (field === 'body') {
      updatedData.body = parsed.body || variant.body;
    } else if (field === 'callToAction') {
      updatedData.callToAction = parsed.callToAction || variant.callToAction;
    } else if (field === 'hashtags') {
      updatedData.hashtags = parsed.hashtags.length > 0 ? parsed.hashtags : variant.hashtags;
    } else {
      // 'all'
      updatedData.headline = parsed.headline !== undefined ? parsed.headline : variant.headline;
      updatedData.body = parsed.body;
      updatedData.callToAction = parsed.callToAction !== undefined ? parsed.callToAction : variant.callToAction;
      updatedData.hashtags = parsed.hashtags;
      if (parsed.mediaBrief) {
        updatedData.mediaBrief = parsed.mediaBrief;
      }
    }

    return this.prisma.$transaction(async (tx) => {
      const updatedVariant = await tx.contentVariant.update({
        where: { id: variantId },
        data: updatedData,
      });

      const nextRevNumber = await this.getNextRevisionNumber(tx, draftId);

      await tx.contentRevision.create({
        data: {
          draftId,
          variantId,
          revisionNumber: nextRevNumber,
          action: 'TARGETED_REGENERATION',
          promptSummary: `Regenerated ${field} via AI provider (${aiResult.provider}/${aiResult.model})`,
          inputSnapshot: sanitizeSnapshot(dto),
          outputSnapshot: updatedVariant as any,
          createdByUserId: userId,
        },
      });

      // If draft was rejected, reset to DRAFT
      if (draft.status === DraftStatus.REJECTED) {
        await tx.contentDraft.update({
          where: { id: draftId },
          data: { status: DraftStatus.DRAFT, rejectionReason: null },
        });
      }

      return updatedVariant;
    });
  }

  async translateVariant(
    workspaceId: string,
    draftId: string,
    variantId: string,
    userId: string,
    dto: TranslateVariantDto,
  ) {
    const draft = await this.getDraft(workspaceId, draftId);
    if (draft.status === DraftStatus.APPROVED) {
      throw new BadRequestException('Approved content drafts cannot be modified. Duplicate or create a new draft.');
    }

    const variant = draft.variants.find((v) => v.id === variantId);
    if (!variant) {
      throw new NotFoundException(`Variant ${variantId} does not belong to draft ${draftId}`);
    }

    const promptObj = this.promptSynthesis.synthesizeTranslationPrompt({
      targetLanguage: dto.targetLanguage,
      platform: variant.platform,
      currentContent: {
        headline: variant.headline,
        body: variant.body,
        callToAction: variant.callToAction,
        hashtags: variant.hashtags,
      },
    });

    const aiResult = await this.textProvider.generateText({
      systemPrompt: promptObj.systemPrompt,
      userPrompt: promptObj.userPrompt,
    });

    const parsed = this.promptSynthesis.parseAndValidateOutput(aiResult.rawText);

    return this.prisma.$transaction(async (tx) => {
      const updatedVariant = await tx.contentVariant.update({
        where: { id: variantId },
        data: {
          headline: parsed.headline || variant.headline,
          body: parsed.body,
          callToAction: parsed.callToAction || variant.callToAction,
          hashtags: parsed.hashtags.length ? parsed.hashtags : variant.hashtags,
          mediaBrief: parsed.mediaBrief || variant.mediaBrief,
        },
      });

      const nextRevNumber = await this.getNextRevisionNumber(tx, draftId);

      await tx.contentRevision.create({
        data: {
          draftId,
          variantId,
          revisionNumber: nextRevNumber,
          action: 'TRANSLATION',
          promptSummary: `Translated to ${dto.targetLanguage} via AI provider`,
          inputSnapshot: sanitizeSnapshot(dto),
          outputSnapshot: updatedVariant as any,
          createdByUserId: userId,
        },
      });

      return updatedVariant;
    });
  }

  async adaptVariant(
    workspaceId: string,
    draftId: string,
    variantId: string,
    userId: string,
    dto: AdaptVariantDto,
  ) {
    const draft = await this.getDraft(workspaceId, draftId);
    if (draft.status === DraftStatus.APPROVED) {
      throw new BadRequestException('Approved content drafts cannot be modified. Duplicate or create a new draft.');
    }

    const variant = draft.variants.find((v) => v.id === variantId);
    if (!variant) {
      throw new NotFoundException(`Variant ${variantId} does not belong to draft ${draftId}`);
    }

    const brandProfile = await this.brandProfileService.getBrandProfile(workspaceId);

    const promptObj = this.promptSynthesis.synthesizeAdaptationPrompt({
      targetPlatform: dto.targetPlatform,
      brandProfile,
      currentContent: {
        headline: variant.headline,
        body: variant.body,
        callToAction: variant.callToAction,
        hashtags: variant.hashtags,
      },
    });

    const aiResult = await this.textProvider.generateText({
      systemPrompt: promptObj.systemPrompt,
      userPrompt: promptObj.userPrompt,
    });

    const parsed = this.promptSynthesis.parseAndValidateOutput(aiResult.rawText);

    return this.prisma.$transaction(async (tx) => {
      // Check if target platform variant already exists for draft
      const existingTargetVariant = draft.variants.find(
        (v) => v.platform === dto.targetPlatform,
      );

      let savedVariant;
      if (existingTargetVariant) {
        savedVariant = await tx.contentVariant.update({
          where: { id: existingTargetVariant.id },
          data: {
            headline: parsed.headline || existingTargetVariant.headline,
            body: parsed.body,
            callToAction: parsed.callToAction || existingTargetVariant.callToAction,
            hashtags: parsed.hashtags,
            mediaBrief: parsed.mediaBrief || existingTargetVariant.mediaBrief,
          },
        });
      } else {
        savedVariant = await tx.contentVariant.create({
          data: {
            draftId,
            platform: dto.targetPlatform,
            headline: parsed.headline || null,
            body: parsed.body,
            callToAction: parsed.callToAction || null,
            hashtags: parsed.hashtags,
            mediaBrief: parsed.mediaBrief || null,
          },
        });
      }

      const nextRevNumber = await this.getNextRevisionNumber(tx, draftId);

      await tx.contentRevision.create({
        data: {
          draftId,
          variantId: savedVariant.id,
          revisionNumber: nextRevNumber,
          action: 'PLATFORM_ADAPTATION',
          promptSummary: `Adapted for ${dto.targetPlatform} via AI provider`,
          inputSnapshot: sanitizeSnapshot(dto),
          outputSnapshot: savedVariant as any,
          createdByUserId: userId,
        },
      });

      return savedVariant;
    });
  }

  async generateCreativeBrief(
    workspaceId: string,
    draftId: string,
    variantId: string,
    userId: string,
    dto: GenerateCreativeBriefDto,
  ) {
    const draft = await this.getDraft(workspaceId, draftId);
    if (draft.status === DraftStatus.APPROVED) {
      throw new BadRequestException('Approved content drafts cannot be modified. Duplicate or create a new draft.');
    }

    const variant = draft.variants.find((v) => v.id === variantId);
    if (!variant) {
      throw new NotFoundException(`Variant ${variantId} does not belong to draft ${draftId}`);
    }

    const brandProfile = await this.brandProfileService.getBrandProfile(workspaceId);

    const briefResult = await this.imageProvider.generateCreativeBrief({
      brandName: brandProfile.businessName,
      brandColors: {
        primary: brandProfile.primaryColor,
        secondary: brandProfile.secondaryColor,
      },
      platform: variant.platform,
      postContent: variant.body,
      visualPreferences: dto.visualPreferences,
    });

    const formattedBrief = `${briefResult.headline}\nComposition: ${briefResult.visualComposition}\nImagery: ${briefResult.recommendedImagery}\nColors: ${briefResult.colorPaletteSuggestions.join(', ')}\nAspect Ratio: ${briefResult.aspectRatio}\nText Overlay: ${briefResult.textOverlayRecommendations}`;

    return this.prisma.$transaction(async (tx) => {
      const updatedVariant = await tx.contentVariant.update({
        where: { id: variantId },
        data: { mediaBrief: formattedBrief },
      });

      const nextRevNumber = await this.getNextRevisionNumber(tx, draftId);

      await tx.contentRevision.create({
        data: {
          draftId,
          variantId,
          revisionNumber: nextRevNumber,
          action: 'CREATIVE_BRIEF_GENERATION',
          promptSummary: 'Generated visual creative brief',
          inputSnapshot: sanitizeSnapshot(dto),
          outputSnapshot: { mediaBrief: formattedBrief },
          createdByUserId: userId,
        },
      });

      return updatedVariant;
    });
  }

  async getRevisions(workspaceId: string, draftId: string) {
    // IDOR protection check
    await this.getDraft(workspaceId, draftId);

    return this.prisma.contentRevision.findMany({
      where: { draftId },
      orderBy: { revisionNumber: 'desc' },
      include: {
        createdByUser: {
          select: { id: true, name: true, email: true },
        },
        variant: {
          select: { id: true, platform: true },
        },
      },
    });
  }

  // APPROVAL WORKFLOWS

  async submitReview(workspaceId: string, draftId: string, userId: string) {
    const draft = await this.getDraft(workspaceId, draftId);

    if (draft.status !== DraftStatus.DRAFT && draft.status !== DraftStatus.REJECTED) {
      throw new BadRequestException(`Draft in status ${draft.status} cannot be submitted for review. Only DRAFT or REJECTED drafts can be submitted.`);
    }

    if (!draft.variants || draft.variants.length === 0) {
      throw new BadRequestException('Cannot submit draft for review without at least one platform variant');
    }

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.contentDraft.update({
        where: { id: draftId },
        data: {
          status: DraftStatus.IN_REVIEW,
          approvalRequestedByUserId: userId,
          rejectionReason: null,
        },
        include: { variants: true },
      });

      const nextRevNumber = await this.getNextRevisionNumber(tx, draftId);

      await tx.contentRevision.create({
        data: {
          draftId,
          revisionNumber: nextRevNumber,
          action: 'SUBMIT_FOR_REVIEW',
          promptSummary: 'Draft submitted for workspace review',
          outputSnapshot: { status: DraftStatus.IN_REVIEW },
          createdByUserId: userId,
        },
      });

      await tx.auditLog.create({
        data: {
          workspaceId,
          actorUserId: userId,
          action: 'CONTENT_DRAFT_SUBMIT_REVIEW',
          entityType: 'ContentDraft',
          entityId: draftId,
        },
      });

      return updated;
    });
  }

  async approveDraft(
    workspaceId: string,
    draftId: string,
    userId: string,
    memberRole: WorkspaceRole,
  ) {
    // RBAC: Only OWNER or ADMIN can approve
    if (memberRole !== WorkspaceRole.OWNER && memberRole !== WorkspaceRole.ADMIN) {
      throw new ForbiddenException('Only workspace Owners and Admins have permission to approve content drafts');
    }

    const draft = await this.getDraft(workspaceId, draftId);

    // Strict self-approval prevention: Content creators or review requesters cannot approve their own drafts,
    // ensuring the four-eyes separation of duties principle unless the user is the workspace OWNER.
    if (
      memberRole !== WorkspaceRole.OWNER &&
      (draft.createdByUserId === userId || draft.approvalRequestedByUserId === userId)
    ) {
      throw new ForbiddenException(
        'You cannot approve your own content draft. Content approval requires review by another authorized administrator or the workspace owner.',
      );
    }

    if (draft.status !== DraftStatus.IN_REVIEW) {
      throw new BadRequestException(`Draft must be IN_REVIEW to be approved. Current status: ${draft.status}`);
    }

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.contentDraft.update({
        where: { id: draftId },
        data: {
          status: DraftStatus.APPROVED,
          approvedByUserId: userId,
          approvedAt: new Date(),
          rejectionReason: null,
        },
        include: { variants: true },
      });

      const nextRevNumber = await this.getNextRevisionNumber(tx, draftId);

      await tx.contentRevision.create({
        data: {
          draftId,
          revisionNumber: nextRevNumber,
          action: 'APPROVE',
          promptSummary: 'Draft approved for publishing schedule',
          outputSnapshot: {
            status: DraftStatus.APPROVED,
            approvedByUserId: userId,
            approvedAt: updated.approvedAt,
          },
          createdByUserId: userId,
        },
      });

      await tx.auditLog.create({
        data: {
          workspaceId,
          actorUserId: userId,
          action: 'CONTENT_DRAFT_APPROVE',
          entityType: 'ContentDraft',
          entityId: draftId,
        },
      });

      return updated;
    });
  }

  async rejectDraft(
    workspaceId: string,
    draftId: string,
    userId: string,
    memberRole: WorkspaceRole,
    dto: RejectDraftDto,
  ) {
    // RBAC: Only OWNER or ADMIN can reject
    if (memberRole !== WorkspaceRole.OWNER && memberRole !== WorkspaceRole.ADMIN) {
      throw new ForbiddenException('Only workspace Owners and Admins have permission to reject content drafts');
    }

    const draft = await this.getDraft(workspaceId, draftId);

    if (draft.status !== DraftStatus.IN_REVIEW) {
      throw new BadRequestException(`Draft must be IN_REVIEW to be rejected. Current status: ${draft.status}`);
    }

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.contentDraft.update({
        where: { id: draftId },
        data: {
          status: DraftStatus.REJECTED,
          rejectionReason: dto.rejectionReason.trim(),
        },
        include: { variants: true },
      });

      const nextRevNumber = await this.getNextRevisionNumber(tx, draftId);

      await tx.contentRevision.create({
        data: {
          draftId,
          revisionNumber: nextRevNumber,
          action: 'REJECT',
          promptSummary: `Draft rejected: ${dto.rejectionReason}`,
          inputSnapshot: sanitizeSnapshot(dto),
          outputSnapshot: {
            status: DraftStatus.REJECTED,
            rejectionReason: dto.rejectionReason,
          },
          createdByUserId: userId,
        },
      });

      await tx.auditLog.create({
        data: {
          workspaceId,
          actorUserId: userId,
          action: 'CONTENT_DRAFT_REJECT',
          entityType: 'ContentDraft',
          entityId: draftId,
          metadata: {
            rejectionReason: dto.rejectionReason,
          },
        },
      });

      return updated;
    });
  }

  private async getNextRevisionNumber(
    tx: Prisma.TransactionClient,
    draftId: string,
  ): Promise<number> {
    try {
      // In PostgreSQL, row-level lock serializes concurrent revisions for the same draft
      await tx.$executeRaw`SELECT 1 FROM content_drafts WHERE id = ${draftId} FOR UPDATE`;
    } catch (err: any) {
      // Graceful fallback for mock unit tests
      this.logger.debug(`Row lock skipped or unavailable: ${err?.message}`);
    }

    const latestRevision = await tx.contentRevision.findFirst({
      where: { draftId },
      orderBy: { revisionNumber: 'desc' },
      select: { revisionNumber: true },
    });

    return (latestRevision?.revisionNumber || 0) + 1;
  }
}

