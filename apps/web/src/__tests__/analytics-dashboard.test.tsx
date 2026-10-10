import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AnalyticsKPICard } from '../components/analytics/AnalyticsKPICard';
import { AnalyticsChart } from '../components/analytics/AnalyticsChart';
import { PostPerformanceTable } from '../components/analytics/PostPerformanceTable';
import { TopPerformingWidget } from '../components/analytics/TopPerformingWidget';
import { SyncStatusPanel } from '../components/analytics/SyncStatusPanel';
import { GrowthInsightsPanel } from '../components/analytics/GrowthInsightsPanel';
import { Users, Eye, Radio } from 'lucide-react';

describe('Analytics Dashboard Components', () => {
  describe('AnalyticsKPICard', () => {
    it('renders valid numeric metric with previous comparison and platform breakdown', () => {
      render(
        <AnalyticsKPICard
          title="Total Followers"
          metricKey="totalFollowers"
          value={1540}
          previousValue={1200}
          percentageChange={28.3}
          changeDirection="up"
          status="AVAILABLE"
          icon={Users}
          tooltip="Audience size"
          platformBreakdown={{ facebook: 540, instagram: 1000 }}
        />,
      );

      expect(screen.getByText('Total Followers')).toBeInTheDocument();
      expect(screen.getByText('1.5K')).toBeInTheDocument();
      expect(screen.getByText('+28.3%')).toBeInTheDocument();
      expect(screen.getByText('vs 1.2K prior')).toBeInTheDocument();
      expect(screen.getByText('FB: 540')).toBeInTheDocument();
      expect(screen.getByText('IG: 1.0K')).toBeInTheDocument();
    });

    it('honestly displays "Not available" when metric value is null or status is UNAVAILABLE', () => {
      render(
        <AnalyticsKPICard
          title="Total Reach"
          metricKey="reach"
          value={null}
          status="UNAVAILABLE"
          icon={Radio}
          tooltip="Unique reach"
        />,
      );

      expect(screen.getByText('Total Reach')).toBeInTheDocument();
      expect(screen.getByText('Not available')).toBeInTheDocument();
      expect(screen.getByText('Connect permissions to unlock')).toBeInTheDocument();
      expect(screen.queryByText('0')).not.toBeInTheDocument(); // Never fabricate 0
    });

    it('displays "No prior baseline data" when current value is valid but baseline is absent', () => {
      render(
        <AnalyticsKPICard
          title="Impressions"
          metricKey="impressions"
          value={4500}
          previousValue={null}
          percentageChange={null}
          status="NO_BASELINE"
          icon={Eye}
          tooltip="Display impressions"
        />,
      );

      expect(screen.getByText('4.5K')).toBeInTheDocument();
      expect(screen.getByText('No prior baseline data')).toBeInTheDocument();
    });
  });

  describe('AnalyticsChart', () => {
    it('renders SVG chart with observation dates and handles missing date gaps', () => {
      const dataPoints = [
        {
          date: '2026-10-01',
          impressions: 500,
          reach: 400,
          engagements: 50,
          engagementRate: 0.125,
          followers: 1200,
        },
        // 2026-10-02 has null values (gap)
        {
          date: '2026-10-02',
          impressions: null,
          reach: null,
          engagements: null,
          engagementRate: null,
          followers: null,
        },
        {
          date: '2026-10-03',
          impressions: 700,
          reach: 550,
          engagements: 80,
          engagementRate: 0.145,
          followers: 1210,
        },
      ];

      const { container } = render(<AnalyticsChart dataPoints={dataPoints} />);

      expect(screen.getByText('Performance Over Time')).toBeInTheDocument();
      expect(container.querySelector('svg')).toBeInTheDocument();

      // Tab switching
      const followersTab = screen.getByRole('button', { name: /Followers/i });
      fireEvent.click(followersTab);

      const rateTab = screen.getByRole('button', { name: /Rate/i });
      fireEvent.click(rateTab);
    });
  });

  describe('PostPerformanceTable', () => {
    const mockPosts: any[] = [
      {
        id: 'post-1',
        externalPostId: 'fb-post-12345',
        platform: 'FACEBOOK',
        postType: 'POST',
        publishedAt: '2026-10-05T10:00:00Z',
        snapshotDate: '2026-10-05T00:00:00Z',
        likesCount: 45,
        commentsCount: 12,
        sharesCount: 3,
        savesCount: 1,
        impressions: 800,
        reach: 650,
        engagementRate: 0.0938,
        isScheduledViaOmniSocial: true,
        externalPostUrl: 'https://facebook.com/123/posts/12345',
        previewText: 'Announcing our new autumn collection!',
        socialAccount: { accountName: 'Main Brand Page' },
      },
      {
        id: 'post-2',
        externalPostId: 'ig-media-98765',
        platform: 'INSTAGRAM',
        postType: 'REEL',
        publishedAt: '2026-10-04T15:30:00Z',
        snapshotDate: '2026-10-04T00:00:00Z',
        likesCount: 120,
        commentsCount: 25,
        sharesCount: 15,
        savesCount: 30,
        impressions: 2100,
        reach: 1800,
        engagementRate: 0.1055,
        isScheduledViaOmniSocial: false,
        externalPostUrl: 'https://instagram.com/p/98765',
        previewText: 'Behind the scenes reel',
        socialAccount: { accountName: 'IG Fashion' },
      },
    ];

    it('renders post performance rows with OmniSocial vs platform-native badges', () => {
      const onSortChange = jest.fn();
      const onPageChange = jest.fn();
      const onPostTypeChange = jest.fn();

      render(
        <PostPerformanceTable
          posts={mockPosts}
          total={2}
          page={1}
          limit={10}
          totalPages={1}
          sortBy="publishedAt"
          sortOrder="desc"
          onSortChange={onSortChange}
          onPageChange={onPageChange}
          selectedPostType="ALL"
          onPostTypeChange={onPostTypeChange}
        />,
      );

      expect(screen.getByText('Announcing our new autumn collection!')).toBeInTheDocument();
      expect(screen.getByText('Behind the scenes reel')).toBeInTheDocument();

      // Check attribution badges
      expect(screen.getByText('OmniSocial')).toBeInTheDocument();
      expect(screen.getByText('Platform Native')).toBeInTheDocument();

      // Sort click
      const likesHeader = screen.getByText('Likes');
      fireEvent.click(likesHeader);
      expect(onSortChange).toHaveBeenCalledWith('likesCount');
    });

    it('renders empty state when no posts match filters', () => {
      render(
        <PostPerformanceTable
          posts={[]}
          total={0}
          page={1}
          limit={10}
          totalPages={1}
          sortBy="publishedAt"
          sortOrder="desc"
          onSortChange={jest.fn()}
          onPageChange={jest.fn()}
          selectedPostType="ALL"
          onPostTypeChange={jest.fn()}
        />,
      );

      expect(screen.getByText('No post records found')).toBeInTheDocument();
    });
  });

  describe('TopPerformingWidget', () => {
    const mockItems: any[] = [
      {
        id: 'top-1',
        externalPostId: 'fb-101',
        platform: 'FACEBOOK',
        postType: 'POST',
        publishedAt: '2026-10-06T12:00:00Z',
        metricName: 'engagementRate',
        metricValue: 0.185,
        isScheduledViaOmniSocial: true,
        externalPostUrl: 'https://facebook.com/101',
        previewText: 'Top engagement post announcement',
      },
    ];

    it('ranks posts and allows metric switching', () => {
      const onMetricChange = jest.fn();
      render(
        <TopPerformingWidget
          items={mockItems}
          selectedMetric="engagementRate"
          onMetricChange={onMetricChange}
        />,
      );

      expect(screen.getByText('Top engagement post announcement')).toBeInTheDocument();
      expect(screen.getByText('18.5%')).toBeInTheDocument();

      const reachBtn = screen.getByRole('button', { name: 'Reach' });
      fireEvent.click(reachBtn);
      expect(onMetricChange).toHaveBeenCalledWith('reach');
    });
  });

  describe('SyncStatusPanel', () => {
    it('displays sync timestamp and permission warning when active', async () => {
      const onRefresh = jest.fn().mockResolvedValue({ success: true });

      render(
        <SyncStatusPanel
          syncStatus={{
            lastSuccessfulSyncAt: '2026-10-10T08:30:00Z',
            lastAttemptedSyncAt: '2026-10-10T08:30:00Z',
            lastJobStatus: 'COMPLETED',
            hasActivePermissionErrors: true,
          }}
          userRole="ADMIN"
          onRefresh={onRefresh}
        />,
      );

      expect(screen.getByText(/Missing Analytics Permissions Detected/i)).toBeInTheDocument();
      expect(screen.getByText('COMPLETED')).toBeInTheDocument();

      const syncBtn = screen.getByRole('button', { name: /Sync Now/i });
      fireEvent.click(syncBtn);
      await waitFor(() => {
        expect(onRefresh).toHaveBeenCalled();
      });
    });

    it('displays throttled alert when sync is rejected by server throttling policy', async () => {
      const onRefresh = jest.fn().mockResolvedValue({
        success: false,
        throttled: true,
        message: 'Manual synchronization is throttled. Please try again in 12 minute(s).',
      });

      render(
        <SyncStatusPanel
          syncStatus={{
            lastSuccessfulSyncAt: '2026-10-10T08:30:00Z',
            lastAttemptedSyncAt: '2026-10-10T08:30:00Z',
            lastJobStatus: 'COMPLETED',
            hasActivePermissionErrors: false,
          }}
          userRole="OWNER"
          onRefresh={onRefresh}
        />,
      );

      const syncBtn = screen.getByRole('button', { name: /Sync Now/i });
      fireEvent.click(syncBtn);

      await waitFor(() => {
        expect(
          screen.getByText(/Manual synchronization is throttled/i),
        ).toBeInTheDocument();
      });
    });
  });

  describe('GrowthInsightsPanel', () => {
    it('displays evidence-backed insight and allows authorized dismissal', async () => {
      const onDismiss = jest.fn().mockResolvedValue(undefined);
      const mockInsights: any[] = [
        {
          id: 'insight-1',
          category: 'TIMING',
          title: 'Post on Wednesday afternoons',
          summary: 'Historical engagement peaks on Wednesdays between 2 PM and 4 PM.',
          suggestedAction: 'Schedule your next promotion for Wednesday at 2:30 PM.',
          confidenceScore: 0.92,
          evidence: {
            optimalBucket: 'Wednesday afternoon',
            recentRate: 0.082,
            percentageChange: 24.5,
          },
          createdAt: '2026-10-09T00:00:00Z',
        },
      ];

      render(
        <GrowthInsightsPanel
          insights={mockInsights}
          userRole="EDITOR"
          onDismiss={onDismiss}
        />,
      );

      expect(screen.getByText('Post on Wednesday afternoons')).toBeInTheDocument();
      expect(screen.getByText('92% Confidence')).toBeInTheDocument();
      expect(
        screen.getByText('Schedule your next promotion for Wednesday at 2:30 PM.'),
      ).toBeInTheDocument();
      expect(screen.getByText('Wednesday afternoon')).toBeInTheDocument();
      expect(screen.getByText(/24\.5%/)).toBeInTheDocument();

      const dismissBtn = screen.getByTitle('Dismiss this recommendation');
      fireEvent.click(dismissBtn);
      await waitFor(() => {
        expect(onDismiss).toHaveBeenCalledWith('insight-1');
      });
    });

    it('triggers manual analysis when authorized and displays success feedback', async () => {
      const onGenerate = jest.fn().mockResolvedValue({
        success: true,
        count: 2,
        message: 'Analysis complete. Generated 2 insights.',
      });

      render(
        <GrowthInsightsPanel
          insights={[]}
          userRole="EDITOR"
          onDismiss={jest.fn()}
          onGenerate={onGenerate}
        />,
      );

      const generateBtn = screen.getByRole('button', { name: /Run Growth Analysis Now/i });
      fireEvent.click(generateBtn);

      await waitFor(() => {
        expect(onGenerate).toHaveBeenCalledWith(false);
        expect(screen.getByText(/Generated 2 insights/i)).toBeInTheDocument();
      });
    });

    it('displays throttling warning when generation is rate-limited', async () => {
      const onGenerate = jest.fn().mockResolvedValue({
        success: false,
        throttled: true,
        message: 'Insight generation is throttled. Please try again in 4 minute(s).',
      });

      render(
        <GrowthInsightsPanel
          insights={[]}
          userRole="ADMIN"
          onDismiss={jest.fn()}
          onGenerate={onGenerate}
        />,
      );

      const generateBtn = screen.getByRole('button', { name: /Run Growth Analysis Now/i });
      fireEvent.click(generateBtn);

      await waitFor(() => {
        expect(
          screen.getByText(/Insight generation is throttled/i),
        ).toBeInTheDocument();
      });
    });

    it('hides generation controls and dismiss buttons for VIEWER role', () => {
      render(
        <GrowthInsightsPanel
          insights={[
            {
              id: 'insight-1',
              category: 'CONSISTENCY',
              title: 'Maintain regular cadence',
              summary: 'Publishing regularly helps stability.',
              suggestedAction: 'Keep up cadence.',
              confidenceScore: 0.85,
              evidence: {},
              createdAt: '2026-10-09T00:00:00Z',
            },
          ]}
          userRole="VIEWER"
          onDismiss={jest.fn()}
          onGenerate={jest.fn()}
        />,
      );

      expect(screen.queryByRole('button', { name: /Analyze & Refresh/i })).not.toBeInTheDocument();
      expect(screen.queryByTitle('Dismiss this recommendation')).not.toBeInTheDocument();
    });

    it('displays honest empty state when no insights exist', () => {
      render(
        <GrowthInsightsPanel
          insights={[]}
          userRole="VIEWER"
          onDismiss={jest.fn()}
        />,
      );

      expect(screen.getByText('No Active Growth Insights')).toBeInTheDocument();
    });
  });
});
