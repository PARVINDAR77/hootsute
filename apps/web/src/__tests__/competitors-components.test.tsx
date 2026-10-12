import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import CompetitorsPage from '../app/(dashboard)/competitors/page';
import { CompetitorCategory, SocialPlatform, AnalyticsMetricPeriod } from '@packages/shared';

// Mock workspace context
jest.mock('@/lib/workspace-context', () => ({
  useWorkspace: () => ({
    currentWorkspace: {
      id: 'ws-test-123',
      name: 'Omni Media Agency',
      currentUserRole: 'OWNER',
    },
  }),
}));

// Mock api client
const mockApiClient = jest.fn();
jest.mock('@/lib/api-client', () => ({
  apiClient: (...args: any[]) => mockApiClient(...args),
}));

describe('Phase 21: Competitor Benchmarking & Public Intelligence Hub Components', () => {
  const mockCompetitor = {
    id: 'comp-1',
    workspaceId: 'ws-test-123',
    name: 'Apex Social',
    websiteUrl: 'https://apex-social.com',
    avatarUrl: null,
    category: CompetitorCategory.DIRECT,
    notes: 'Direct competitive threat',
    isActive: true,
    createdAt: '2026-06-01T00:00:00Z',
    updatedAt: '2026-06-01T00:00:00Z',
    socialAccounts: [
      {
        id: 'acc-1',
        competitorProfileId: 'comp-1',
        platform: SocialPlatform.TWITTER_X,
        handle: 'apexsocial',
        followersCount: 34000,
        followingCount: 500,
        postsCount: 1200,
        isActive: true,
        createdAt: '2026-06-01T00:00:00Z',
        updatedAt: '2026-06-01T00:00:00Z',
      },
    ],
  };

  const mockSummary = {
    period: AnalyticsMetricPeriod.DAY,
    brandSummary: {
      totalFollowers: 28400,
      avgEngagementRate: 4.1,
      followerGrowthRate: 3.2,
      postingFrequencyWeekly: 5.5,
      sentimentScore: 82.0,
    },
    competitorBenchmarkAvg: {
      totalFollowers: 21900,
      avgEngagementRate: 2.9,
      followerGrowthRate: 1.8,
      postingFrequencyWeekly: 4.2,
      sentimentScore: 71.5,
    },
    leaderboard: [
      {
        name: 'Your Brand',
        isOwnBrand: true,
        category: 'OWN_BRAND',
        totalFollowers: 28400,
        avgEngagementRate: 4.1,
        followerGrowthRate: 3.2,
        postingFrequencyWeekly: 5.5,
        sentimentScore: 82.0,
      },
      {
        name: 'Apex Social',
        isOwnBrand: false,
        category: CompetitorCategory.DIRECT,
        totalFollowers: 34200,
        avgEngagementRate: 3.4,
        followerGrowthRate: 2.1,
        postingFrequencyWeekly: 6.0,
        sentimentScore: 74.0,
      },
    ],
    keyInsights: [
      'Your average engagement rate (4.1%) leads your competitor peer average (2.9%) by +1.2%.',
    ],
    topPerformingPosts: [
      {
        brandOrCompetitor: 'Your Brand',
        platform: SocialPlatform.LINKEDIN,
        excerpt: 'How we scaled our real-time social analytics engine with zero downtime 🚀',
        engagementRate: 5.8,
        date: '2026-06-01T00:00:00Z',
      },
    ],
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders header, benchmark cards, and leaderboard', async () => {
    mockApiClient
      .mockResolvedValueOnce([mockCompetitor]) // competitors
      .mockResolvedValueOnce(mockSummary); // summary

    render(<CompetitorsPage />);

    await waitFor(() => {
      expect(screen.getByText('Competitor Benchmarking & Public Intelligence')).toBeInTheDocument();
      expect(screen.getByText('Industry Leaderboard & Benchmark Matrix')).toBeInTheDocument();
      expect(screen.getByText('vs 2.9% avg')).toBeInTheDocument();
    });

    expect(screen.getAllByText('4.1%').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Apex Social').length).toBeGreaterThanOrEqual(1);
  });

  it('opens and closes Track Competitor modal', async () => {
    mockApiClient
      .mockResolvedValueOnce([mockCompetitor])
      .mockResolvedValueOnce(mockSummary);

    render(<CompetitorsPage />);

    await waitFor(() => {
      expect(screen.getAllByText('Apex Social').length).toBeGreaterThanOrEqual(1);
    });

    const trackBtns = screen.getAllByRole('button', { name: /Track Competitor/i });
    fireEvent.click(trackBtns[0]);

    expect(screen.getByText('Track New Competitor')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('e.g. Sprout Social, Hootsuite')).toBeInTheDocument();

    const cancelBtn = screen.getByRole('button', { name: /Cancel/i });
    fireEvent.click(cancelBtn);

    expect(screen.queryByPlaceholderText('e.g. Sprout Social, Hootsuite')).not.toBeInTheDocument();
  });

  it('renders top performing content and AI insights', async () => {
    mockApiClient
      .mockResolvedValueOnce([mockCompetitor])
      .mockResolvedValueOnce(mockSummary);

    render(<CompetitorsPage />);

    await waitFor(() => {
      expect(screen.getByText('AI Strategic Competitive Insights')).toBeInTheDocument();
      expect(screen.getByText('Top Performing Content')).toBeInTheDocument();
    });

    expect(
      screen.getByText('Your average engagement rate (4.1%) leads your competitor peer average (2.9%) by +1.2%.'),
    ).toBeInTheDocument();
    expect(
      screen.getByText('How we scaled our real-time social analytics engine with zero downtime 🚀'),
    ).toBeInTheDocument();
  });
});
