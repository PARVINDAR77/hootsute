import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Logger,
  Optional,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { MailService } from '../../mail/mail.service';
import {
  ApprovalWorkflowDto,
  ApprovalWorkflowStepDto,
  DraftApprovalProgressDto,
  DraftStepReviewDto,
  RecordReviewDecisionDto,
} from '@packages/shared';
import {
  WorkspaceRole,
  ApprovalStepStatus,
  DraftStatus,
} from '@prisma/client';
import { CreateApprovalWorkflowDto } from '../dto/create-approval-workflow.dto';

@Injectable()
export class ApprovalWorkflowsService {
  private readonly logger = new Logger(ApprovalWorkflowsService.name);

  constructor(
    private readonly prisma: PrismaService,
    @Optional() private readonly mailService?: MailService,
  ) {}

  /**
   * Creates a new approval workflow with ordered review steps
   */
  async createWorkflow(
    workspaceId: string,
    dto: CreateApprovalWorkflowDto,
  ): Promise<ApprovalWorkflowDto> {
    if (!dto.steps || dto.steps.length === 0) {
      throw new BadRequestException('Approval workflow must contain at least one review step.');
    }

    // If marked default, unset default on other workflows
    if (dto.isDefault) {
      await this.prisma.approvalWorkflow.updateMany({
        where: { workspaceId, isDefault: true },
        data: { isDefault: false },
      });
    }

    const workflow = await this.prisma.approvalWorkflow.create({
      data: {
        workspaceId,
        name: dto.name,
        description: dto.description,
        isDefault: dto.isDefault ?? false,
        steps: {
          create: dto.steps.map((s, idx) => ({
            stepOrder: s.stepOrder ?? idx + 1,
            name: s.name,
            requiredRole: s.requiredRole,
            isMandatory: s.isMandatory ?? true,
          })),
        },
      },
      include: {
        steps: {
          orderBy: { stepOrder: 'asc' },
        },
      },
    });

    return this.mapWorkflowToDto(workflow);
  }

  /**
   * Retrieves all approval workflows configured for a workspace
   */
  async getWorkflows(workspaceId: string): Promise<ApprovalWorkflowDto[]> {
    const workflows = await this.prisma.approvalWorkflow.findMany({
      where: { workspaceId },
      include: {
        steps: {
          orderBy: { stepOrder: 'asc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return workflows.map((w) => this.mapWorkflowToDto(w));
  }

  /**
   * Retrieves a single workflow by ID
   */
  async getWorkflowById(workspaceId: string, workflowId: string): Promise<ApprovalWorkflowDto> {
    const workflow = await this.prisma.approvalWorkflow.findFirst({
      where: { id: workflowId, workspaceId },
      include: {
        steps: {
          orderBy: { stepOrder: 'asc' },
        },
      },
    });

    if (!workflow) {
      throw new NotFoundException(`Approval workflow "${workflowId}" not found.`);
    }

    return this.mapWorkflowToDto(workflow);
  }

  /**
   * Updates an approval workflow
   */
  async updateWorkflow(
    workspaceId: string,
    workflowId: string,
    dto: Partial<CreateApprovalWorkflowDto>,
  ): Promise<ApprovalWorkflowDto> {
    const existing = await this.prisma.approvalWorkflow.findFirst({
      where: { id: workflowId, workspaceId },
    });

    if (!existing) {
      throw new NotFoundException(`Approval workflow "${workflowId}" not found.`);
    }

    if (dto.isDefault) {
      await this.prisma.approvalWorkflow.updateMany({
        where: { workspaceId, id: { not: workflowId }, isDefault: true },
        data: { isDefault: false },
      });
    }

    // If steps provided, replace them transactionally
    if (dto.steps && dto.steps.length > 0) {
      await this.prisma.$transaction([
        this.prisma.approvalWorkflowStep.deleteMany({
          where: { workflowId },
        }),
        this.prisma.approvalWorkflowStep.createMany({
          data: dto.steps.map((s, idx) => ({
            workflowId,
            stepOrder: s.stepOrder ?? idx + 1,
            name: s.name,
            requiredRole: s.requiredRole,
            isMandatory: s.isMandatory ?? true,
          })),
        }),
      ]);
    }

    const updated = await this.prisma.approvalWorkflow.update({
      where: { id: workflowId },
      data: {
        ...(dto.name ? { name: dto.name } : {}),
        ...(dto.description !== undefined ? { description: dto.description } : {}),
        ...(dto.isDefault !== undefined ? { isDefault: dto.isDefault } : {}),
      },
      include: {
        steps: {
          orderBy: { stepOrder: 'asc' },
        },
      },
    });

    return this.mapWorkflowToDto(updated);
  }

  /**
   * Deletes a workflow
   */
  async deleteWorkflow(workspaceId: string, workflowId: string): Promise<{ success: boolean }> {
    const existing = await this.prisma.approvalWorkflow.findFirst({
      where: { id: workflowId, workspaceId },
    });

    if (!existing) {
      throw new NotFoundException(`Approval workflow "${workflowId}" not found.`);
    }

    await this.prisma.approvalWorkflow.delete({
      where: { id: workflowId },
    });

    return { success: true };
  }

  /**
   * Attaches approval workflow steps to a draft when review is requested
   */
  async ensureDraftApprovalSteps(
    workspaceId: string,
    draftId: string,
    workflowId?: string,
  ): Promise<DraftApprovalProgressDto> {
    const draft = await this.prisma.contentDraft.findFirst({
      where: { id: draftId, workspaceId },
      include: {
        stepReviews: true,
      },
    });

    if (!draft) {
      throw new NotFoundException(`Draft "${draftId}" not found in workspace.`);
    }

    // If already has steps initialized, return current progress
    if (draft.stepReviews && draft.stepReviews.length > 0) {
      return this.getDraftApprovalProgress(workspaceId, draftId);
    }

    // Resolve which workflow to use: explicit or default or create standard fallback
    let targetWorkflow = null;
    if (workflowId) {
      targetWorkflow = await this.prisma.approvalWorkflow.findFirst({
        where: { id: workflowId, workspaceId },
        include: { steps: { orderBy: { stepOrder: 'asc' } } },
      });
    }

    if (!targetWorkflow) {
      targetWorkflow = await this.prisma.approvalWorkflow.findFirst({
        where: { workspaceId, isDefault: true },
        include: { steps: { orderBy: { stepOrder: 'asc' } } },
      });
    }

    if (!targetWorkflow) {
      targetWorkflow = await this.prisma.approvalWorkflow.findFirst({
        where: { workspaceId },
        include: { steps: { orderBy: { stepOrder: 'asc' } } },
      });
    }

    // If still no workflow exists in workspace, create an automatic 2-tier default workflow
    if (!targetWorkflow) {
      targetWorkflow = await this.prisma.approvalWorkflow.create({
        data: {
          workspaceId,
          name: 'Default Two-Tier Review Matrix',
          description: 'Standard editorial verification followed by admin approval sign-off.',
          isDefault: true,
          steps: {
            create: [
              {
                stepOrder: 1,
                name: 'Internal Editorial Review',
                requiredRole: WorkspaceRole.EDITOR,
                isMandatory: true,
              },
              {
                stepOrder: 2,
                name: 'Client / Admin Final Sign-Off',
                requiredRole: WorkspaceRole.ADMIN,
                isMandatory: true,
              },
            ],
          },
        },
        include: { steps: { orderBy: { stepOrder: 'asc' } } },
      });
    }

    // Create DraftStepReview records
    await this.prisma.$transaction(
      targetWorkflow.steps.map((step) =>
        this.prisma.draftStepReview.create({
          data: {
            draftId,
            stepId: step.id,
            status: ApprovalStepStatus.PENDING,
          },
        }),
      ),
    );

    // Link workflow to draft and mark IN_REVIEW
    await this.prisma.contentDraft.update({
      where: { id: draftId },
      data: {
        approvalWorkflowId: targetWorkflow.id,
        status: DraftStatus.IN_REVIEW,
      },
    });

    return this.getDraftApprovalProgress(workspaceId, draftId);
  }

  /**
   * Retrieves the approval progress matrix for a draft
   */
  async getDraftApprovalProgress(
    workspaceId: string,
    draftId: string,
  ): Promise<DraftApprovalProgressDto> {
    const draft = await this.prisma.contentDraft.findFirst({
      where: { id: draftId, workspaceId },
      include: {
        approvalWorkflow: true,
        stepReviews: {
          include: {
            step: true,
            reviewer: { select: { id: true, name: true, email: true } },
          },
          orderBy: { step: { stepOrder: 'asc' } },
        },
      },
    });

    if (!draft) {
      throw new NotFoundException(`Draft "${draftId}" not found.`);
    }

    const stepsDto: DraftStepReviewDto[] = (draft.stepReviews || []).map((r) => ({
      id: r.id,
      draftId: r.draftId,
      stepId: r.stepId,
      stepName: r.step.name,
      stepOrder: r.step.stepOrder,
      requiredRole: r.step.requiredRole as any,
      isMandatory: r.step.isMandatory,
      reviewerUserId: r.reviewerUserId,
      reviewerName: r.reviewer?.name || null,
      status: r.status as any,
      decisionNotes: r.decisionNotes,
      decidedAt: r.decidedAt ? r.decidedAt.toISOString() : null,
      createdAt: r.createdAt.toISOString(),
      updatedAt: r.updatedAt.toISOString(),
    }));

    const totalSteps = stepsDto.length;
    const isChangesRequested = stepsDto.some((s) => s.status === 'CHANGES_REQUESTED');
    const isFullyApproved =
      totalSteps > 0 &&
      stepsDto.every((s) => !s.isMandatory || s.status === 'APPROVED');

    const firstPendingStep = stepsDto.find((s) => s.status === 'PENDING');
    const currentStepOrder = firstPendingStep ? firstPendingStep.stepOrder : totalSteps;

    return {
      draftId,
      workflowId: draft.approvalWorkflowId,
      workflowName: draft.approvalWorkflow?.name || null,
      currentStepOrder,
      totalSteps,
      isFullyApproved,
      isChangesRequested,
      steps: stepsDto,
    };
  }

  /**
   * Records an approval or change request decision on a step
   */
  async recordReviewDecision(
    workspaceId: string,
    draftId: string,
    stepId: string,
    userId: string,
    userRole: WorkspaceRole,
    dto: RecordReviewDecisionDto,
  ): Promise<DraftApprovalProgressDto> {
    const draft = await this.prisma.contentDraft.findFirst({
      where: { id: draftId, workspaceId },
      include: {
        stepReviews: {
          include: { step: true },
        },
      },
    });

    if (!draft) {
      throw new NotFoundException(`Draft "${draftId}" not found.`);
    }

    const targetReview = draft.stepReviews.find((r) => r.stepId === stepId || r.id === stepId);
    if (!targetReview) {
      throw new NotFoundException(`Approval step "${stepId}" not found for this draft.`);
    }

    // Permission check: Role must be >= step.requiredRole or OWNER/ADMIN
    const roleRank: Record<WorkspaceRole, number> = {
      VIEWER: 1,
      EDITOR: 2,
      ADMIN: 3,
      OWNER: 4,
    };

    const userRank = roleRank[userRole] || 1;
    const requiredRank = roleRank[targetReview.step.requiredRole] || 2;

    if (userRank < requiredRank) {
      throw new ForbiddenException(
        `Insufficient permissions. Step "${targetReview.step.name}" requires at least ${targetReview.step.requiredRole} role.`,
      );
    }

    const now = new Date();
    const newStatus =
      dto.decision === 'APPROVE'
        ? ApprovalStepStatus.APPROVED
        : ApprovalStepStatus.CHANGES_REQUESTED;

    await this.prisma.draftStepReview.update({
      where: { id: targetReview.id },
      data: {
        status: newStatus,
        decisionNotes: dto.notes || null,
        reviewerUserId: userId,
        decidedAt: now,
      },
    });

    // Check overall draft status updates
    if (dto.decision === 'REQUEST_CHANGES') {
      await this.prisma.contentDraft.update({
        where: { id: draftId },
        data: {
          status: DraftStatus.CHANGES_REQUESTED,
          rejectionReason: dto.notes || 'Changes requested during review step.',
        },
      });
    } else {
      // Check if all mandatory steps are now approved
      const allReviews = await this.prisma.draftStepReview.findMany({
        where: { draftId },
        include: { step: true },
      });

      const allMandatoryApproved = allReviews.every(
        (r) => !r.step.isMandatory || r.status === ApprovalStepStatus.APPROVED,
      );

      if (allMandatoryApproved) {
        await this.prisma.contentDraft.update({
          where: { id: draftId },
          data: {
            status: DraftStatus.APPROVED,
            approvedByUserId: userId,
            approvedAt: now,
          },
        });
      }
    }

    if (this.mailService) {
      try {
        const fullDraft = await this.prisma.contentDraft.findUnique({
          where: { id: draftId },
          include: {
            createdBy: { select: { email: true, name: true } },
            workspace: { select: { name: true } },
          },
        });

        if (fullDraft?.createdBy?.email) {
          const appUrl = process.env.CORS_ORIGIN || 'http://localhost:3000';
          const reviewer = await this.prisma.user.findUnique({
            where: { id: userId },
            select: { name: true },
          });

          const mappedDecision =
            dto.decision === 'APPROVE' ? 'APPROVED' : 'CHANGES_REQUESTED';

          this.mailService
            .sendApprovalDecisionEmail(fullDraft.createdBy.email, {
              workspaceName: fullDraft.workspace.name,
              draftTitle: fullDraft.title || 'Untitled Draft',
              decision: mappedDecision,
              reviewerName: reviewer?.name || 'Reviewer',
              notes: dto.notes,
              draftUrl: `${appUrl}/content/drafts/${draftId}`,
            })
            .catch((err) => {
              this.logger.error(`Failed to dispatch decision email: ${err.message}`);
            });
        }
      } catch (err: any) {
        this.logger.error(`Error notifying draft author: ${err.message}`);
      }
    }

    return this.getDraftApprovalProgress(workspaceId, draftId);
  }

  private mapWorkflowToDto(workflow: any): ApprovalWorkflowDto {
    return {
      id: workflow.id,
      workspaceId: workflow.workspaceId,
      name: workflow.name,
      description: workflow.description,
      isDefault: workflow.isDefault,
      steps: (workflow.steps || []).map((s: any) => ({
        id: s.id,
        workflowId: s.workflowId,
        stepOrder: s.stepOrder,
        name: s.name,
        requiredRole: s.requiredRole,
        isMandatory: s.isMandatory,
        createdAt: s.createdAt.toISOString(),
        updatedAt: s.updatedAt.toISOString(),
      })),
      createdAt: workflow.createdAt.toISOString(),
      updatedAt: workflow.updatedAt.toISOString(),
    };
  }
}
