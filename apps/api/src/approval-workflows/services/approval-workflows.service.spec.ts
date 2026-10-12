import { Test, TestingModule } from '@nestjs/testing';
import { ApprovalWorkflowsService } from './approval-workflows.service';
import { PrismaService } from '../../prisma/prisma.service';
import { BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { WorkspaceRole, ApprovalStepStatus, DraftStatus } from '@prisma/client';

describe('ApprovalWorkflowsService', () => {
  let service: ApprovalWorkflowsService;
  let prisma: any;

  const mockWorkspaceId = 'ws-test-111';
  const mockWorkflowId = 'wf-test-222';
  const mockDraftId = 'draft-test-333';
  const mockStepId = 'step-test-444';
  const mockUserId = 'user-test-555';

  const mockWorkflow = {
    id: mockWorkflowId,
    workspaceId: mockWorkspaceId,
    name: 'Two-Tier Review',
    description: 'Internal & Client Sign-Off',
    isDefault: true,
    steps: [
      {
        id: mockStepId,
        workflowId: mockWorkflowId,
        stepOrder: 1,
        name: 'Internal Review',
        requiredRole: WorkspaceRole.EDITOR,
        isMandatory: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockDraft = {
    id: mockDraftId,
    workspaceId: mockWorkspaceId,
    title: 'New Product Announcement',
    status: DraftStatus.DRAFT,
    approvalWorkflowId: null,
    stepReviews: [],
  };

  beforeEach(async () => {
    prisma = {
      approvalWorkflow: {
        create: jest.fn(),
        findMany: jest.fn(),
        findFirst: jest.fn(),
        update: jest.fn(),
        updateMany: jest.fn(),
        delete: jest.fn(),
      },
      approvalWorkflowStep: {
        deleteMany: jest.fn(),
        createMany: jest.fn(),
      },
      contentDraft: {
        findFirst: jest.fn(),
        update: jest.fn(),
      },
      draftStepReview: {
        create: jest.fn(),
        findMany: jest.fn(),
        update: jest.fn(),
      },
      $transaction: jest.fn((actions) => Promise.all(actions)),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ApprovalWorkflowsService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<ApprovalWorkflowsService>(ApprovalWorkflowsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createWorkflow', () => {
    it('should throw BadRequestException if steps are empty', async () => {
      await expect(
        service.createWorkflow(mockWorkspaceId, {
          name: 'Invalid Workflow',
          steps: [],
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should create workflow and unset previous defaults if isDefault=true', async () => {
      prisma.approvalWorkflow.updateMany.mockResolvedValue({ count: 1 });
      prisma.approvalWorkflow.create.mockResolvedValue(mockWorkflow);

      const result = await service.createWorkflow(mockWorkspaceId, {
        name: 'Two-Tier Review',
        isDefault: true,
        steps: [
          {
            stepOrder: 1,
            name: 'Internal Review',
            requiredRole: WorkspaceRole.EDITOR,
            isMandatory: true,
          },
        ],
      });

      expect(result).toBeDefined();
      expect(result.id).toBe(mockWorkflowId);
      expect(prisma.approvalWorkflow.updateMany).toHaveBeenCalledWith({
        where: { workspaceId: mockWorkspaceId, isDefault: true },
        data: { isDefault: false },
      });
    });
  });

  describe('ensureDraftApprovalSteps', () => {
    it('should throw NotFoundException if draft not found', async () => {
      prisma.contentDraft.findFirst.mockResolvedValue(null);

      await expect(
        service.ensureDraftApprovalSteps(mockWorkspaceId, 'non-existent'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should spawn step reviews and transition draft to IN_REVIEW', async () => {
      prisma.contentDraft.findFirst
        .mockResolvedValueOnce(mockDraft) // first check
        .mockResolvedValueOnce({
          // getDraftApprovalProgress call
          ...mockDraft,
          approvalWorkflow: mockWorkflow,
          stepReviews: [
            {
              id: 'rev-1',
              draftId: mockDraftId,
              stepId: mockStepId,
              status: ApprovalStepStatus.PENDING,
              step: mockWorkflow.steps[0],
              reviewer: null,
              createdAt: new Date(),
              updatedAt: new Date(),
            },
          ],
        });

      prisma.approvalWorkflow.findFirst.mockResolvedValue(mockWorkflow);
      prisma.draftStepReview.create.mockResolvedValue({});
      prisma.contentDraft.update.mockResolvedValue({});

      const progress = await service.ensureDraftApprovalSteps(mockWorkspaceId, mockDraftId);

      expect(progress.draftId).toBe(mockDraftId);
      expect(progress.steps).toHaveLength(1);
      expect(progress.steps[0].status).toBe(ApprovalStepStatus.PENDING);
      expect(prisma.contentDraft.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: mockDraftId },
          data: expect.objectContaining({ status: DraftStatus.IN_REVIEW }),
        }),
      );
    });
  });

  describe('recordReviewDecision', () => {
    it('should reject decision with ForbiddenException if user has insufficient role', async () => {
      prisma.contentDraft.findFirst.mockResolvedValue({
        ...mockDraft,
        stepReviews: [
          {
            id: 'rev-1',
            stepId: mockStepId,
            step: {
              ...mockWorkflow.steps[0],
              requiredRole: WorkspaceRole.ADMIN,
            },
          },
        ],
      });

      await expect(
        service.recordReviewDecision(
          mockWorkspaceId,
          mockDraftId,
          mockStepId,
          mockUserId,
          WorkspaceRole.VIEWER, // VIEWER < ADMIN
          { decision: 'APPROVE' },
        ),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should mark draft APPROVED when all mandatory steps approve', async () => {
      const mockStepReview = {
        id: 'rev-1',
        stepId: mockStepId,
        step: mockWorkflow.steps[0],
      };

      prisma.contentDraft.findFirst
        .mockResolvedValueOnce({
          ...mockDraft,
          stepReviews: [mockStepReview],
        })
        .mockResolvedValueOnce({
          ...mockDraft,
          status: DraftStatus.APPROVED,
          approvalWorkflow: mockWorkflow,
          stepReviews: [
            {
              ...mockStepReview,
              status: ApprovalStepStatus.APPROVED,
              reviewer: { id: mockUserId, name: 'Admin Approver', email: 'admin@test.com' },
              decidedAt: new Date(),
              createdAt: new Date(),
              updatedAt: new Date(),
            },
          ],
        });

      prisma.draftStepReview.update.mockResolvedValue({});
      prisma.draftStepReview.findMany.mockResolvedValue([
        { ...mockStepReview, status: ApprovalStepStatus.APPROVED },
      ]);
      prisma.contentDraft.update.mockResolvedValue({});

      const progress = await service.recordReviewDecision(
        mockWorkspaceId,
        mockDraftId,
        mockStepId,
        mockUserId,
        WorkspaceRole.OWNER,
        { decision: 'APPROVE', notes: 'Looks awesome!' },
      );

      expect(progress.isFullyApproved).toBe(true);
      expect(prisma.contentDraft.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: mockDraftId },
          data: expect.objectContaining({ status: DraftStatus.APPROVED }),
        }),
      );
    });

    it('should transition draft to CHANGES_REQUESTED when request changes decision is made', async () => {
      const mockStepReview = {
        id: 'rev-1',
        stepId: mockStepId,
        step: mockWorkflow.steps[0],
      };

      prisma.contentDraft.findFirst
        .mockResolvedValueOnce({
          ...mockDraft,
          stepReviews: [mockStepReview],
        })
        .mockResolvedValueOnce({
          ...mockDraft,
          status: DraftStatus.CHANGES_REQUESTED,
          approvalWorkflow: mockWorkflow,
          stepReviews: [
            {
              ...mockStepReview,
              status: ApprovalStepStatus.CHANGES_REQUESTED,
              reviewer: { id: mockUserId, name: 'Lead Editor', email: 'editor@test.com' },
              decisionNotes: 'Needs more hashtags',
              decidedAt: new Date(),
              createdAt: new Date(),
              updatedAt: new Date(),
            },
          ],
        });

      prisma.draftStepReview.update.mockResolvedValue({});
      prisma.contentDraft.update.mockResolvedValue({});

      const progress = await service.recordReviewDecision(
        mockWorkspaceId,
        mockDraftId,
        mockStepId,
        mockUserId,
        WorkspaceRole.EDITOR,
        { decision: 'REQUEST_CHANGES', notes: 'Needs more hashtags' },
      );

      expect(progress.isChangesRequested).toBe(true);
      expect(prisma.contentDraft.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: mockDraftId },
          data: expect.objectContaining({ status: DraftStatus.CHANGES_REQUESTED }),
        }),
      );
    });
  });
});
