import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { PostInspectorModal } from '../components/calendar/PostInspectorModal';
import { SchedulePostModal } from '../components/calendar/SchedulePostModal';
import {
  ScheduledPostStatus,
  PublishTargetStatus,
  SocialPlatform,
  SocialAccountType,
  DraftStatus,
} from '@packages/shared';

// Mock workspace context
jest.mock('@/lib/workspace-context', () => ({
  useWorkspace: () => ({
    currentWorkspace: {
      id: 'ws-test-123',
      name: 'Test Workspace',
      currentUserRole: 'OWNER',
    },
  }),
}));

// Mock api client
const mockApiClient = jest.fn();
jest.mock('@/lib/api-client', () => ({
  apiClient: (...args: any[]) => mockApiClient(...args),
}));

describe('PostInspectorModal Component', () => {
  const mockPost: any = {
    id: 'post-1',
    workspaceId: 'ws-test-123',
    draftId: 'draft-1',
    createdById: 'user-1',
    scheduledAt: '2026-10-20T14:00:00.000Z',
    timezone: 'UTC',
    status: ScheduledPostStatus.SCHEDULED,
    approvedRevisionNumber: 2,
    contentSnapshot: {
      draftId: 'draft-1',
      approvedRevisionNumber: 2,
      title: 'Diwali Festive Launch Campaign',
      variants: [
        {
          platform: SocialPlatform.FACEBOOK,
          headline: 'Diwali Special Offer',
          body: 'Celebrate this festival of lights with our exclusive 30% discount!',
          hashtags: ['Diwali2026', 'FestiveOffer'],
        },
      ],
    },
    snapshotHash: 'mock-hash-123',
    draft: {
      id: 'draft-1',
      title: 'Diwali Festive Launch Campaign',
      status: DraftStatus.APPROVED,
    },
    targets: [
      {
        id: 'target-fb-1',
        platform: SocialPlatform.FACEBOOK,
        status: PublishTargetStatus.PUBLISHED,
        socialAccount: {
          id: 'acc-1',
          accountName: 'Acme Official Facebook Page',
        },
        externalPostId: 'fb_post_999888',
        attemptCount: 1,
        maxAttempts: 3,
        publishedAt: '2026-10-20T14:00:02.000Z',
      },
      {
        id: 'target-ig-1',
        platform: SocialPlatform.INSTAGRAM,
        status: PublishTargetStatus.AMBIGUOUS_TIMEOUT,
        socialAccount: {
          id: 'acc-2',
          accountName: 'Acme Instagram Business',
        },
        attemptCount: 1,
        maxAttempts: 3,
        errorMessage: 'Network timeout during Instagram container check',
      },
    ],
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders scheduled post details, draft title, and targets accurately', () => {
    render(
      <PostInspectorModal
        post={mockPost}
        isOpen={true}
        onClose={jest.fn()}
        onPostUpdated={jest.fn()}
      />,
    );

    expect(screen.getByText('Diwali Festive Launch Campaign')).toBeInTheDocument();
    expect(screen.getByText(/Approved Revision #2/)).toBeInTheDocument();
    expect(screen.getByText('Acme Official Facebook Page')).toBeInTheDocument();
    expect(screen.getByText('Acme Instagram Business')).toBeInTheDocument();
  });

  it('renders reconciliation alert button for AMBIGUOUS_TIMEOUT target', () => {
    render(
      <PostInspectorModal
        post={mockPost}
        isOpen={true}
        onClose={jest.fn()}
        onPostUpdated={jest.fn()}
      />,
    );

    expect(screen.getByText('Ambiguous Network Outcome')).toBeInTheDocument();
    expect(screen.getByText(/Verify & Reconcile/i)).toBeInTheDocument();
  });

  it('allows switching to Reschedule Time tab and displays date/time inputs', () => {
    render(
      <PostInspectorModal
        post={mockPost}
        isOpen={true}
        onClose={jest.fn()}
        onPostUpdated={jest.fn()}
      />,
    );

    const rescheduleTab = screen.getByRole('button', { name: /Reschedule Time/i });
    fireEvent.click(rescheduleTab);

    expect(screen.getByText(/Select a new future timestamp to reschedule/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Save New Schedule/i })).toBeInTheDocument();
  });

  it('allows switching to Cancel Post tab', () => {
    render(
      <PostInspectorModal
        post={mockPost}
        isOpen={true}
        onClose={jest.fn()}
        onPostUpdated={jest.fn()}
      />,
    );

    const cancelTab = screen.getByRole('button', { name: /Cancel Post/i });
    fireEvent.click(cancelTab);

    expect(screen.getByText(/Cancelling will prevent this post and all its targets/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Confirm Cancellation/i })).toBeInTheDocument();
  });
});

describe('SchedulePostModal Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('loads approved drafts and connected accounts on open', async () => {
    const mockDrafts = [
      {
        id: 'draft-approved-1',
        title: 'New Year Product Launch',
        status: DraftStatus.APPROVED,
        revisions: [{ id: 'rev-1', revisionNumber: 1, draftId: 'draft-approved-1', action: 'CREATE', outputSnapshot: {}, createdByUserId: 'u-1', createdAt: '2026-10-09' }],
        variants: [
          {
            id: 'var-fb',
            platform: SocialPlatform.FACEBOOK,
            body: 'Happy New Year! Explore our collection.',
          },
        ],
      },
    ];

    const mockAccounts = [
      {
        id: 'acc-fb-1',
        accountName: 'Acme Facebook Page',
        accountType: SocialAccountType.FACEBOOK_PAGE,
        connectionStatus: 'CONNECTED',
      },
    ];

    mockApiClient.mockImplementation((endpoint: string) => {
      if (endpoint.includes('content-drafts')) {
        return Promise.resolve(mockDrafts);
      }
      if (endpoint.includes('social-accounts')) {
        return Promise.resolve(mockAccounts);
      }
      return Promise.resolve({});
    });

    render(
      <SchedulePostModal
        isOpen={true}
        onClose={jest.fn()}
        onScheduled={jest.fn()}
      />,
    );

    await waitFor(() => {
      expect(screen.getAllByText(/New Year Product Launch/).length).toBeGreaterThan(0);
      expect(screen.getByText('Acme Facebook Page')).toBeInTheDocument();
    });
  });
});
