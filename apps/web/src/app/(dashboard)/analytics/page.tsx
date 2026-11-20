'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useWorkspace } from '@/lib/workspace-context';
import { apiClient } from '@/lib/api-client';
import Link from 'next/link';
import {
  Users,
  Eye,
  Radio,
  Heart,
  Percent,
  MousePointerClick,
  Calendar,
  Filter,
  RefreshCw,
  AlertCircle,
  BarChart3,
  Sparkles,
  ArrowRight,
} from 'lucide-react';
import { AnalyticsKPICard } from '@/components/analytics/AnalyticsKPICard';
import { AnalyticsChart, TimeseriesPoint } from '@/components/analytics/AnalyticsChart';
import { TopPlatformsDonut, PlatformShare } from '@/components/analytics/TopPlatformsDonut';
import { PostPerformanceTable, PostPerformanceItem } from '@/components/analytics/PostPerformanceTable';
import { TopPerformingWidget, TopPerformingItem } from '@/components/analytics/TopPerformingWidget';
import { SyncStatusPanel, SyncStatusData } from '@/components/analytics/SyncStatusPanel';
import { GrowthInsightsPanel, GrowthInsightItem } from '@/components/analytics/GrowthInsightsPanel';
import { Button } from '@/components/ui/Button';

type DatePreset = '7d' | '30d' | '90d' | 'custom';
type PlatformFilter =
  | 'ALL'
  | 'FACEBOOK'
  | 'INSTAGRAM'
  | 'TWITTER'
  | 'LINKEDIN'
  | 'PINTEREST'
  | 'YOUTUBE'
  | 'TIKTOK'
  | 'THREADS';

export default function AnalyticsDashboardPage() {
  const { currentWorkspace } = useWorkspace();
  const workspaceId = currentWorkspace?.id;
  const userRole = currentWorkspace?.currentUserRole || 'VIEWER';

  // Filters State
  const [datePreset, setDatePreset] = useState<DatePreset>('30d');
  const [platform, setPlatform] = useState<PlatformFilter>('ALL');
  const [customStartDate, setCustomStartDate] = useState<string>('');
  const [customEndDate, setCustomEndDate] = useState<string>('');

  // Sorting & Table Pagination State
  const [postType, setPostType] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<string>('publishedAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState<number>(1);
  const [topMetric, setTopMetric] = useState<string>('engagementRate');

  // Data State
  const [overviewData, setOverviewData] = useState<any>(null);
  const [timeseriesData, setTimeseriesData] = useState<TimeseriesPoint[]>([]);
  const [postsData, setPostsData] = useState<{ items: PostPerformanceItem[]; total: number; totalPages: number }>({
    items: [],
    total: 0,
    totalPages: 1,
  });
  const [topPerformingData, setTopPerformingData] = useState<TopPerformingItem[]>([]);
  const [insightsData, setInsightsData] = useState<GrowthInsightItem[]>([]);
  const [syncStatusData, setSyncStatusData] = useState<SyncStatusData | null>(null);

  // Loading & Error States
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isPostsLoading, setIsPostsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Compute date range based on preset
  const getDateRange = useCallback(() => {
    const end = new Date();
    let days = 30;
    if (datePreset === '7d') days = 7;
    if (datePreset === '90d') days = 90;

    if (datePreset === 'custom' && customStartDate && customEndDate) {
      return {
        startDate: new Date(customStartDate).toISOString(),
        endDate: new Date(customEndDate).toISOString(),
      };
    }

    const start = new Date(end.getTime() - days * 24 * 60 * 60 * 1000);
    return {
      startDate: start.toISOString(),
      endDate: end.toISOString(),
    };
  }, [datePreset, customStartDate, customEndDate]);

  // Main Dashboard Data Fetcher
  const fetchDashboardData = useCallback(async () => {
    if (!workspaceId) return;
    setIsLoading(true);
    setError(null);

    const { startDate, endDate } = getDateRange();
    const platformParam = platform !== 'ALL' ? `&platform=${platform}` : '';

    try {
      const [overviewRes, timeseriesRes, topRes, insightsRes, syncRes] = await Promise.all([
        apiClient(`/workspaces/${workspaceId}/analytics/overview?startDate=${startDate}&endDate=${endDate}${platformParam}`),
        apiClient(`/workspaces/${workspaceId}/analytics/timeseries?startDate=${startDate}&endDate=${endDate}${platformParam}`),
        apiClient(`/workspaces/${workspaceId}/analytics/top-performing?metric=${topMetric}&limit=5${platformParam}`),
        apiClient(`/workspaces/${workspaceId}/analytics/insights`),
        apiClient(`/workspaces/${workspaceId}/analytics/sync-status`),
      ]);

      const overview = overviewRes?.data ?? overviewRes;
      const timeseries = timeseriesRes?.data ?? timeseriesRes;
      const top = topRes?.data ?? topRes;
      const insights = Array.isArray(insightsRes) ? insightsRes : (insightsRes?.data ?? []);
      const sync = syncRes?.data ?? syncRes;

      if (overview && typeof overview === 'object') setOverviewData(overview);
      if (timeseries?.dataPoints) setTimeseriesData(timeseries.dataPoints);
      if (top?.items) setTopPerformingData(top.items);
      setInsightsData(insights);
      if (sync && typeof sync === 'object') setSyncStatusData(sync);
    } catch (err: any) {
      setError(err?.message || 'Failed to load analytics dashboard data');
    } finally {
      setIsLoading(false);
    }
  }, [workspaceId, getDateRange, platform, topMetric]);

  // Paginated Posts Fetcher
  const fetchPostsData = useCallback(async () => {
    if (!workspaceId) return;
    setIsPostsLoading(true);

    const { startDate, endDate } = getDateRange();
    const platformParam = platform !== 'ALL' ? `&platform=${platform}` : '';
    const postTypeParam = postType !== 'ALL' ? `&postType=${postType}` : '';

    try {
      const res = await apiClient(
        `/workspaces/${workspaceId}/analytics/posts?startDate=${startDate}&endDate=${endDate}&page=${page}&limit=10&sortBy=${sortBy}&sortOrder=${sortOrder}${platformParam}${postTypeParam}`
      );
      const items = Array.isArray(res) ? res : (res?.data ?? res?.items ?? []);
      setPostsData({
        items,
        total: res?.pagination?.total ?? items.length,
        totalPages: res?.pagination?.totalPages || 1,
      });
    } catch (err: any) {
      console.error('Failed to load post performance records:', err);
    } finally {
      setIsPostsLoading(false);
    }
  }, [workspaceId, getDateRange, platform, postType, page, sortBy, sortOrder]);

  // Trigger Manual Refresh
  const handleManualRefresh = async (force = false) => {
    if (!workspaceId) return { success: false };
    const res = await apiClient(`/workspaces/${workspaceId}/analytics/sync-now`, {
      method: 'POST',
      body: JSON.stringify({ force }),
    });

    const payload = res?.data ?? res;
    const ok = res?.success !== false;
    if (ok) {
      // Re-fetch all data
      await fetchDashboardData();
      await fetchPostsData();
    }
    return {
      success: ok,
      message: res?.message || payload?.message,
      throttled: payload?.throttled,
    };
  };

  // Dismiss Growth Insight
  const handleDismissInsight = async (insightId: string) => {
    if (!workspaceId) return;
    await apiClient(`/workspaces/${workspaceId}/analytics/insights/${insightId}/dismiss`, {
      method: 'POST',
    });
    setInsightsData((prev) => prev.filter((i) => i.id !== insightId));
  };

  // Generate / Refresh Growth Insights
  const handleGenerateInsights = async (force = false) => {
    if (!workspaceId) return { success: false };
    const res = await apiClient(`/workspaces/${workspaceId}/analytics/insights/generate`, {
      method: 'POST',
      body: JSON.stringify({ force }),
    });

    const payload = res?.data ?? res;
    const ok = res?.success !== false;
    if (ok) {
      const updatedInsights = await apiClient(`/workspaces/${workspaceId}/analytics/insights`);
      const list = Array.isArray(updatedInsights) ? updatedInsights : (updatedInsights?.data ?? []);
      setInsightsData(list);
    }

    return {
      success: ok,
      message: res?.message || payload?.message,
      count: payload?.generatedCount,
      throttled: payload?.throttled,
    };
  };

  // Table Sort handler
  const handleSortChange = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
    setPage(1);
  };

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  useEffect(() => {
    fetchPostsData();
  }, [fetchPostsData]);

  if (!workspaceId) {
    return (
      <div className="p-8 text-center text-slate-500">
        <BarChart3 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
        <h3 className="text-base font-semibold text-slate-800">No Workspace Selected</h3>
        <p className="text-xs text-slate-400 mt-1">
          Select or create an active workspace to view performance analytics.
        </p>
      </div>
    );
  }

  const metrics = overviewData?.metrics || {};
  const platformBreakdown = overviewData?.platformBreakdown || {};

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Page Header & Global Filters */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-200/80 dark:border-slate-800 transition-colors">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              Analytics &amp; Performance
            </h1>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-brand-purple/10 text-brand-purple dark:text-brand-cyan border border-brand-purple/20">
              {currentWorkspace.name}
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Real cross-platform telemetry, audience reach, and audience growth across all 8 social networks.
          </p>
        </div>

        {/* Global Control Bar: Date Presets & Platform Filters */}
        <div className="flex flex-wrap items-center gap-2.5">
          <Link href="/analytics/insights">
            <Button
              variant="outline"
              size="sm"
              className="text-xs h-8 gap-1.5 border-brand-purple/30 text-brand-purple dark:text-brand-cyan hover:bg-brand-purple/5"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>AI Growth Insights</span>
              <ArrowRight className="w-3 h-3 ml-0.5" />
            </Button>
          </Link>

          {/* Platform Selector */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
            {(
              [
                { label: 'All', value: 'ALL' },
                { label: 'Instagram', value: 'INSTAGRAM' },
                { label: 'Facebook', value: 'FACEBOOK' },
                { label: 'LinkedIn', value: 'LINKEDIN' },
                { label: 'X', value: 'TWITTER' },
                { label: 'YouTube', value: 'YOUTUBE' },
              ] as { label: string; value: PlatformFilter }[]
            ).map((p) => (
              <button
                key={p.value}
                onClick={() => {
                  setPlatform(p.value);
                  setPage(1);
                }}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                  platform === p.value
                    ? 'bg-white dark:bg-slate-900 text-brand-purple dark:text-brand-cyan shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Date Presets */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
            {(['7d', '30d', '90d', 'custom'] as DatePreset[]).map((preset) => (
              <button
                key={preset}
                onClick={() => {
                  setDatePreset(preset);
                  setPage(1);
                }}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                  datePreset === preset
                    ? 'bg-white dark:bg-slate-900 text-brand-purple dark:text-brand-cyan shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {preset === '7d'
                  ? '7 Days'
                  : preset === '30d'
                    ? '30 Days'
                    : preset === '90d'
                      ? '90 Days'
                      : 'Custom'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Custom Date Range Selector (if custom preset chosen) */}
      {datePreset === 'custom' && (
        <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl flex flex-wrap items-center gap-3 text-xs">
          <span className="font-semibold text-slate-700">Custom Date Range:</span>
          <div className="flex items-center gap-2">
            <label className="text-slate-500">From:</label>
            <input
              type="date"
              value={customStartDate}
              onChange={(e) => setCustomStartDate(e.target.value)}
              className="bg-white border border-slate-200 rounded px-2 py-1 text-slate-800"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-slate-500">To:</label>
            <input
              type="date"
              value={customEndDate}
              onChange={(e) => setCustomEndDate(e.target.value)}
              className="bg-white border border-slate-200 rounded px-2 py-1 text-slate-800"
            />
          </div>
          <Button
            size="sm"
            onClick={() => {
              fetchDashboardData();
              fetchPostsData();
            }}
            disabled={!customStartDate || !customEndDate}
          >
            Apply Range
          </Button>
        </div>
      )}

      {/* Synchronization Freshness & Attention Panel */}
      <SyncStatusPanel
        syncStatus={syncStatusData}
        userRole={userRole}
        onRefresh={handleManualRefresh}
        isLoading={isLoading}
      />

      {/* Global Error Alert */}
      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-center justify-between text-rose-800 text-xs">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
          <Button size="sm" variant="outline" onClick={fetchDashboardData}>
            Retry
          </Button>
        </div>
      )}

      {/* Section 1: KPI Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3.5">
        {/* 1. Total Followers (Point-in-time) */}
        <AnalyticsKPICard
          title="Total Followers"
          metricKey="totalFollowers"
          value={metrics.totalFollowers?.value}
          previousValue={metrics.totalFollowers?.previousValue}
          percentageChange={metrics.totalFollowers?.percentageChange}
          changeDirection={metrics.totalFollowers?.changeDirection}
          status={metrics.totalFollowers?.status}
          icon={Users}
          tooltip="Total audience size based on latest synchronized account snapshot. Point-in-time, not summed over dates."
          platformBreakdown={platformBreakdown.followers}
          isLoading={isLoading}
        />

        {/* 2. Impressions */}
        <AnalyticsKPICard
          title="Impressions"
          metricKey="impressions"
          value={metrics.impressions?.value}
          previousValue={metrics.impressions?.previousValue}
          percentageChange={metrics.impressions?.percentageChange}
          changeDirection={metrics.impressions?.changeDirection}
          status={metrics.impressions?.status}
          icon={Eye}
          tooltip="Total number of times your content was displayed across connected platforms."
          platformBreakdown={platformBreakdown.impressions}
          isLoading={isLoading}
        />

        {/* 3. Total Reach */}
        <AnalyticsKPICard
          title="Total Reach"
          metricKey="reach"
          value={metrics.reach?.value}
          previousValue={metrics.reach?.previousValue}
          percentageChange={metrics.reach?.percentageChange}
          changeDirection={metrics.reach?.changeDirection}
          status={metrics.reach?.status}
          icon={Radio}
          tooltip="Sum of unique accounts that viewed your content. Labeled as platform sum, not cross-platform deduplicated."
          platformBreakdown={platformBreakdown.reach}
          isLoading={isLoading}
        />

        {/* 4. Engagements */}
        <AnalyticsKPICard
          title="Engagements"
          metricKey="engagements"
          value={metrics.engagements?.value}
          previousValue={metrics.engagements?.previousValue}
          percentageChange={metrics.engagements?.percentageChange}
          changeDirection={metrics.engagements?.changeDirection}
          status={metrics.engagements?.status}
          icon={Heart}
          tooltip="Total likes, comments, shares, and saves accumulated during the selected date range."
          platformBreakdown={platformBreakdown.engagements}
          isLoading={isLoading}
        />

        {/* 5. Engagement Rate */}
        <AnalyticsKPICard
          title="Eng. Rate"
          metricKey="engagementRate"
          value={metrics.engagementRate?.value}
          previousValue={metrics.engagementRate?.previousValue}
          percentageChange={metrics.engagementRate?.percentageChange}
          changeDirection={metrics.engagementRate?.changeDirection}
          status={metrics.engagementRate?.status}
          isPercentage={true}
          icon={Percent}
          tooltip="Ratio of total engagements relative to reach (or impressions when reach is unavailable)."
          isLoading={isLoading}
        />

        {/* 6. Profile Views / Clicks */}
        <AnalyticsKPICard
          title="Profile Views"
          metricKey="profileViews"
          value={metrics.profileViews?.value}
          previousValue={metrics.profileViews?.previousValue}
          percentageChange={metrics.profileViews?.percentageChange}
          changeDirection={metrics.profileViews?.changeDirection}
          status={metrics.profileViews?.status}
          icon={MousePointerClick}
          tooltip="Number of times your business profiles were viewed on supported platforms."
          isLoading={isLoading}
        />
      </div>

      {/* Section 2: Historical Curves & Top Platforms Donut */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <AnalyticsChart dataPoints={timeseriesData} isLoading={isLoading} />
        </div>
        <div className="lg:col-span-1">
          <TopPlatformsDonut isLoading={isLoading} />
        </div>
      </div>

      {/* Section 3: Dual Column: Top Performing Content & Growth Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TopPerformingWidget
          items={topPerformingData}
          selectedMetric={topMetric}
          onMetricChange={(m) => setTopMetric(m)}
          isLoading={isLoading}
        />

        <GrowthInsightsPanel
          insights={insightsData}
          userRole={userRole}
          onDismiss={handleDismissInsight}
          onGenerate={handleGenerateInsights}
          isLoading={isLoading}
        />
      </div>

      {/* Section 4: Detailed Post Performance Table */}
      <PostPerformanceTable
        posts={postsData.items}
        total={postsData.total}
        page={page}
        limit={10}
        totalPages={postsData.totalPages}
        sortBy={sortBy}
        sortOrder={sortOrder}
        onSortChange={handleSortChange}
        onPageChange={(p) => setPage(p)}
        selectedPostType={postType}
        onPostTypeChange={(t) => {
          setPostType(t);
          setPage(1);
        }}
        isLoading={isPostsLoading}
      />
    </div>
  );
}
