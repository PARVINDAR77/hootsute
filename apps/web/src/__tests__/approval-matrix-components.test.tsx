import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ApprovalMatrixStepper } from '../components/approvals/ApprovalMatrixStepper';
import { DraftCommentsDrawer } from '../components/approvals/DraftCommentsDrawer';
import {
  ApprovalStepStatus,
  WorkspaceRole,
  DraftApprovalProgressDto,
  DraftCommentDto,
} from '@packages/shared';

// Mock api client
const mockApiClient = jest.fn();
jest.mock('@/lib/api-client', () => ({
  apiClient: (...args: any[]) => mockApiClient(...args),
}));

describe('Phase 18 Approval Matrix & Comments Components', () => {
  const mockProgress: DraftApprovalProgressDto = {
    draftId: 'draft-1',
    workflowId: 'wf-1',
    workflowName: 'Two-Tier Agency Matrix',
    currentStepOrder: 1,
    totalSteps: 2,
    isFullyApproved: false,
    isChangesRequested: false,
    steps: [
      {
        id: 'rev-1',
        draftId: 'draft-1',
        stepId: 'step-1',
        stepName: 'Internal Editorial Review',
        stepOrder: 1,
        requiredRole: WorkspaceRole.EDITOR,
        isMandatory: true,
        reviewerUserId: null,
        reviewerName: null,
        status: ApprovalStepStatus.PENDING,
        decisionNotes: null,
        decidedAt: null,
        createdAt: '2026-05-01T10:00:00.000Z',
        updatedAt: '2026-05-01T10:00:00.000Z',
      },
      {
        id: 'rev-2',
        draftId: 'draft-1',
        stepId: 'step-2',
        stepName: 'Client Final Sign-off',
        stepOrder: 2,
        requiredRole: WorkspaceRole.ADMIN,
        isMandatory: true,
        reviewerUserId: null,
        reviewerName: null,
        status: ApprovalStepStatus.PENDING,
        decisionNotes: null,
        decidedAt: null,
        createdAt: '2026-05-01T10:00:00.000Z',
        updatedAt: '2026-05-01T10:00:00.000Z',
      },
    ],
  };

  const mockComment: DraftCommentDto = {
    id: 'comm-1',
    draftId: 'draft-1',
    workspaceId: 'ws-1',
    authorUserId: 'user-1',
    authorName: 'Alex Rivers',
    authorEmail: 'alex@agency.com',
    content: 'Please adjust copy tone on line 2.',
    parentCommentId: null,
    isResolved: false,
    resolvedByUserId: null,
    resolvedByName: null,
    resolvedAt: null,
    replies: [
      {
        id: 'reply-1',
        draftId: 'draft-1',
        workspaceId: 'ws-1',
        authorUserId: 'user-2',
        authorName: 'Sarah Jenkins',
        authorEmail: 'sarah@agency.com',
        content: 'Done! Tone has been softened.',
        parentCommentId: 'comm-1',
        isResolved: false,
        resolvedByUserId: null,
        resolvedByName: null,
        resolvedAt: null,
        replies: [],
        createdAt: '2026-05-01T11:00:00.000Z',
        updatedAt: '2026-05-01T11:00:00.000Z',
      },
    ],
    createdAt: '2026-05-01T10:30:00.000Z',
    updatedAt: '2026-05-01T10:30:00.000Z',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('ApprovalMatrixStepper', () => {
    it('should render all approval steps and required roles', () => {
      render(
        <ApprovalMatrixStepper
          workspaceId="ws-1"
          draftId="draft-1"
          progress={mockProgress}
          onRefresh={jest.fn()}
        />,
      );

      expect(screen.getByText('Approval Matrix & Multi-Stage Review')).toBeInTheDocument();
      expect(screen.getByText('Two-Tier Agency Matrix (2 stages)')).toBeInTheDocument();
      expect(screen.getByText('1. Internal Editorial Review')).toBeInTheDocument();
      expect(screen.getByText('2. Client Final Sign-off')).toBeInTheDocument();
      expect(screen.getByText('Req: EDITOR')).toBeInTheDocument();
      expect(screen.getByText('Req: ADMIN')).toBeInTheDocument();
    });

    it('should open decision panel and submit approval decision', async () => {
      const onRefresh = jest.fn();
      mockApiClient.mockResolvedValueOnce({ success: true });

      render(
        <ApprovalMatrixStepper
          workspaceId="ws-1"
          draftId="draft-1"
          progress={mockProgress}
          onRefresh={onRefresh}
        />,
      );

      const reviewBtns = screen.getAllByRole('button', { name: /Review Step/i });
      fireEvent.click(reviewBtns[0]);

      expect(screen.getByRole('button', { name: /Approve Step/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Request Changes/i })).toBeInTheDocument();

      const notesInput = screen.getByPlaceholderText(/Optional praise or sign-off notes/i);
      fireEvent.change(notesInput, { target: { value: 'Approved by editorial team' } });

      fireEvent.click(screen.getByRole('button', { name: /Confirm Approval/i }));

      await waitFor(() => {
        expect(mockApiClient).toHaveBeenCalledWith(
          '/workspaces/ws-1/drafts/draft-1/approval/steps/step-1/decision',
          expect.objectContaining({
            method: 'POST',
            body: JSON.stringify({
              decision: 'APPROVE',
              notes: 'Approved by editorial team',
            }),
          }),
        );
      });

      expect(onRefresh).toHaveBeenCalled();
    }, 15000);
  });

  describe('DraftCommentsDrawer', () => {
    it('should render comments and threaded replies when open', async () => {
      mockApiClient.mockResolvedValueOnce({ success: true, data: [mockComment] });

      render(
        <DraftCommentsDrawer
          workspaceId="ws-1"
          draftId="draft-1"
          isOpen={true}
          onClose={jest.fn()}
        />,
      );

      await waitFor(() => {
        expect(screen.getByText('Alex Rivers')).toBeInTheDocument();
      });

      expect(screen.getByText('Please adjust copy tone on line 2.')).toBeInTheDocument();
      expect(screen.getByText('Sarah Jenkins')).toBeInTheDocument();
      expect(screen.getByText('Done! Tone has been softened.')).toBeInTheDocument();
    });

    it('should submit a new root comment', async () => {
      mockApiClient
        .mockResolvedValueOnce({ success: true, data: [] }) // initial fetch
        .mockResolvedValueOnce({ success: true, data: mockComment }) // post comment
        .mockResolvedValueOnce({ success: true, data: [mockComment] }); // refetch

      render(
        <DraftCommentsDrawer
          workspaceId="ws-1"
          draftId="draft-1"
          isOpen={true}
          onClose={jest.fn()}
        />,
      );

      await waitFor(() => {
        expect(screen.getByPlaceholderText('Add review feedback...')).toBeInTheDocument();
      });

      const input = screen.getByPlaceholderText('Add review feedback...');
      fireEvent.change(input, { target: { value: 'Check punctuation on slide 3.' } });

      const submitBtn = input.closest('form')!.querySelector('button[type="submit"]')!;
      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(mockApiClient).toHaveBeenCalledWith(
          '/workspaces/ws-1/drafts/draft-1/comments',
          expect.objectContaining({
            method: 'POST',
            body: JSON.stringify({ content: 'Check punctuation on slide 3.' }),
          }),
        );
      });
    });
  });
});
