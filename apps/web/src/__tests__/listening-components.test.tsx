import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import SocialListeningPage from '../app/(dashboard)/listening/page';
import { CreateQueryModal } from '../components/listening/CreateQueryModal';
import { SocialPlatform, ListeningSentiment } from '@packages/shared';

// Mock Next router
const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

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

// Mock API client
const mockApiClient = jest.fn();
jest.mock('@/lib/api-client', () => ({
  apiClient: (...args: any[]) => mockApiClient(...args),
}));

describe('Phase 17 Social Listening Components', () => {
  const mockQuery = {
    id: 'query-1',
    workspaceId: 'ws-test-123',
    createdById: 'user-1',
    name: 'Brand Mentions',
    keywords: ['OmniSocial'],
    excludedKeywords: ['jobs'],
    platforms: [SocialPlatform.TWITTER_X, SocialPlatform.LINKEDIN],
    languages: ['en'],
    isActive: true,
    sentimentFilter: 'ALL',
    totalMentions: 12,
    createdAt: '2026-05-01T10:00:00.000Z',
    updatedAt: '2026-05-01T10:00:00.000Z',
  };

  const mockMention = {
    id: 'mention-1',
    queryId: 'query-1',
    queryName: 'Brand Mentions',
    workspaceId: 'ws-test-123',
    platform: SocialPlatform.TWITTER_X,
    externalId: 'ext-101',
    authorHandle: '@tech_reviewer',
    authorName: 'Tech Reviewer',
    authorAvatarUrl: null,
    authorFollowersCount: 15400,
    content: 'OmniSocial AI has completely revolutionized our content scheduling. Great tool!',
    url: 'https://twitter.com/tech_reviewer/status/ext-101',
    publishedAt: '2026-05-02T12:00:00.000Z',
    sentiment: ListeningSentiment.POSITIVE,
    sentimentScore: 0.8,
    reachEstimate: 14000,
    engagementCount: 45,
    isRead: false,
    isStarred: false,
    createdAt: '2026-05-02T12:05:00.000Z',
  };

  const mockAnalytics = {
    totalMentions: 1,
    estimatedTotalReach: 14000,
    averageSentimentScore: 0.8,
    sentimentBreakdown: [
      { sentiment: ListeningSentiment.POSITIVE, count: 1, percentage: 100 },
      { sentiment: ListeningSentiment.NEUTRAL, count: 0, percentage: 0 },
      { sentiment: ListeningSentiment.NEGATIVE, count: 0, percentage: 0 },
    ],
    mentionsOverTime: [{ date: '2026-05-02', positive: 1, neutral: 0, negative: 0, total: 1 }],
    topAuthors: [
      {
        authorHandle: '@tech_reviewer',
        authorName: 'Tech Reviewer',
        platform: SocialPlatform.TWITTER_X,
        followersCount: 15400,
        mentionsCount: 1,
      },
    ],
    platformBreakdown: [{ platform: SocialPlatform.TWITTER_X, count: 1, percentage: 100 }],
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('SocialListeningPage', () => {
    it('should render empty state when no queries or mentions exist', async () => {
      mockApiClient.mockImplementation((url: string) => {
        if (url.includes('/queries')) return Promise.resolve({ success: true, data: [] });
        if (url.includes('/feed')) return Promise.resolve({ success: true, data: { data: [], total: 0 } });
        if (url.includes('/analytics')) return Promise.resolve({ success: true, data: null });
        return Promise.resolve({});
      });

      render(<SocialListeningPage />);

      await waitFor(() => {
        expect(screen.getByText('No mentions found')).toBeInTheDocument();
      });
      expect(screen.getByText('Social Listening & Brand Monitoring')).toBeInTheDocument();
      expect(screen.getByText('New Listening Query')).toBeInTheDocument();
    });

    it('should render queries tabs, KPI cards, and mentions feed when data exists', async () => {
      mockApiClient.mockImplementation((url: string) => {
        if (url.includes('/queries')) return Promise.resolve({ success: true, data: [mockQuery] });
        if (url.includes('/feed')) return Promise.resolve({ success: true, data: { data: [mockMention], total: 1 } });
        if (url.includes('/analytics')) return Promise.resolve({ success: true, data: mockAnalytics });
        return Promise.resolve({});
      });

      render(<SocialListeningPage />);

      await waitFor(() => {
        expect(screen.getByText('Brand Mentions')).toBeInTheDocument();
      });

      expect(screen.getByText('Tech Reviewer')).toBeInTheDocument();
      expect(screen.getByText(/OmniSocial AI has completely revolutionized/)).toBeInTheDocument();
      expect(screen.getByText(/Positive \(\+0\.8\)/)).toBeInTheDocument();
      expect(screen.getAllByText('14,000').length).toBeGreaterThanOrEqual(1); // reach estimate
    });

    it('should toggle star on mention', async () => {
      mockApiClient.mockImplementation((url: string, opts?: any) => {
        if (opts?.method === 'PATCH' && url.includes('/star')) {
          return Promise.resolve({ success: true, data: { ...mockMention, isStarred: true } });
        }
        if (url.includes('/queries')) return Promise.resolve({ success: true, data: [mockQuery] });
        if (url.includes('/feed')) return Promise.resolve({ success: true, data: { data: [mockMention], total: 1 } });
        if (url.includes('/analytics')) return Promise.resolve({ success: true, data: mockAnalytics });
        return Promise.resolve({});
      });

      render(<SocialListeningPage />);

      await waitFor(() => {
        expect(screen.getByTitle('Star mention')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByTitle('Star mention'));

      await waitFor(() => {
        expect(mockApiClient).toHaveBeenCalledWith(
          expect.stringContaining('/mentions/mention-1/star'),
          expect.objectContaining({ method: 'PATCH' }),
        );
      });
    });
  });

  describe('CreateQueryModal', () => {
    it('should allow adding new keywords and submitting', async () => {
      const onCreated = jest.fn();
      const onClose = jest.fn();
      mockApiClient.mockResolvedValueOnce({
        success: true,
        data: { ...mockQuery, id: 'new-query-id', name: 'Competitor Buzz' },
      });

      render(
        <CreateQueryModal
          workspaceId="ws-test-123"
          isOpen={true}
          onClose={onClose}
          onCreated={onCreated}
        />,
      );

      expect(screen.getByText('New Listening Query')).toBeInTheDocument();

      const nameInput = screen.getByPlaceholderText(/e\.g\. Brand Mentions/);
      fireEvent.change(nameInput, { target: { value: 'Competitor Buzz' } });

      const kwInput = screen.getByPlaceholderText(/Type keyword and press Enter/);
      fireEvent.change(kwInput, { target: { value: 'Hootsuite' } });
      fireEvent.click(screen.getByRole('button', { name: /Add/ }));

      expect(screen.getByText('Hootsuite')).toBeInTheDocument();

      fireEvent.click(screen.getByRole('button', { name: /Create Query & Start Listening/ }));

      await waitFor(() => {
        expect(mockApiClient).toHaveBeenCalledWith(
          '/workspaces/ws-test-123/listening/queries',
          expect.objectContaining({
            method: 'POST',
            body: expect.stringContaining('Competitor Buzz'),
          }),
        );
      });

      expect(onCreated).toHaveBeenCalled();
      expect(onClose).toHaveBeenCalled();
    });
  });
});
