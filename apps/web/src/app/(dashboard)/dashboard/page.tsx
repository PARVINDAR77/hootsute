'use client';

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { useWorkspace } from '@/lib/workspace-context';
import { apiClient, unwrapData, unwrapList } from '@/lib/api-client';
import { ROUTES } from '@/lib/constants';
import {
  StatCard,
  ChartCard,
  AccountCard,
  Badge,
  Button,
  EmptyState,
  CardGridSkeleton,
  ORDERED_PLATFORMS,
  PlatformBadge,
  normalizePlatformKey,
  SupportedPlatformKey,
} from '@/components/ui';
import {
  PerformanceAreaChart,
  PerformancePoint,
} from '@/components/analytics/PerformanceAreaChart';
import {
  Sparkles,
  Send,
  Calendar,
  BarChart3,
  Users,
  Eye,
  Heart,
  Clock,
  RefreshCw,
  ArrowRight,
  Plus,
  FileText,
  Inbox,
  Link2,
  Building2,
} from 'lucide-react';

interface DashboardData {
  socialAccounts: any[];
  drafts: any[];
  scheduledPosts: any[];
  interactions: any[];
  linksCount: number;
  totalLinkClicks: number;
  analyticsOverview: any | null;
  timeseries: PerformancePoint[];
}

const INITIAL_DATA: DashboardData = {
  socialAccounts: [],
  drafts: [],
  scheduledPosts: [],
  interactions: [],
  linksCount: 0,
  totalLinkClicks: 0,
  analyticsOverview: null,
  timeseries: [],
};

function formatCompact(n: number): string {
  if (!Number.isFinite(n)) return '0';
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(Math.round(n));
}

export default function DashboardPage() {
  const { user } = useAuth();
  const router = useRouter();
  const { currentWorkspace, workspaces, isLoadingWorkspaces } = useWorkspace();

  const [days, setDays] = useState<7 | 30 | 90>(30);
  const [data, setData] = useState<DashboardData>(INITIAL_DATA);
  const [isLoading, setIsLoading] = useState(false);

  const loadDashboard = useCallback(async () => {
    if (!currentWorkspace?.id) return;
    setIsLoading(true);
    const wsId = currentWorkspace.id;

    const end = new Date();
    const start = new Date(end.getTime() - days * 24 * 60 * 60 * 1000);
    const rangeQs = `startDate=${start.toISOString()}&endDate=${end.toISOString()}`;

    try {
      const [
        accountsRes,
        draftsRes,
        postsRes,
        inboxRes,
        linksRes,
        overviewRes,
        timeseriesRes,
      ] = await Promise.allSettled([
        apiClient(`/workspaces/${wsId}/social-accounts`),
        apiClient(`/workspaces/${wsId}/content-drafts`),
        apiClient(`/workspaces/${wsId}/scheduled-posts`),
        apiClient(`/workspaces/${wsId}/inbox/interactions`),
        apiClient(`/workspaces/${wsId}/links`),
        apiClient(`/workspaces/${wsId}/analytics/overview?${rangeQs}`),
        apiClient(`/workspaces/${wsId}/analytics/timeseries?${rangeQs}`),
      ]);

      const socialAccounts =
        accountsRes.status === 'fulfilled' ? unwrapList(accountsRes.value) : [];
      const drafts = draftsRes.status === 'fulfilled' ? unwrapList(draftsRes.value) : [];
      const scheduledPosts =
        postsRes.status === 'fulfilled' ? unwrapList(postsRes.value) : [];
      const interactions =
        inboxRes.status === 'fulfilled' ? unwrapList(inboxRes.value) : [];
      const links = linksRes.status === 'fulfilled' ? unwrapList(linksRes.value) : [];
      const analyticsOverview =
        overviewRes.status === 'fulfilled' ? unwrapData<any>(overviewRes.value, null) : null;
      const rawTimeseries =
        timeseriesRes.status === 'fulfilled'
          ? unwrapData<any>(timeseriesRes.value, null)
          : null;

      const timeseriesPoints: PerformancePoint[] = Array.isArray(rawTimeseries?.dataPoints)
        ? rawTimeseries.dataPoints
        : Array.isArray(rawTimeseries)
          ? rawTimeseries
          : [];

      const totalLinkClicks = links.reduce(
        (sum: number, l: any) => sum + (Number(l.totalClicks) || 0),
        0,
      );

      setData({
        socialAccounts,
        drafts,
        scheduledPosts,
        interactions,
        linksCount: links.length,
        totalLinkClicks,
        analyticsOverview,
        timeseries: timeseriesPoints,
      });
    } finally {
      setIsLoading(false);
    }
  }, [currentWorkspace?.id, days]);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  // Group connected social accounts by all 8 supported platforms
  const platformAccountCounts = useMemo(() => {
    const counts: Record<SupportedPlatformKey, { count: number; status: 'CONNECTED' | 'EXPIRED' | 'NONE' }> = {
      INSTAGRAM: { count: 0, status: 'NONE' },
      FACEBOOK: { count: 0, status: 'NONE' },
      TWITTER_X: { count: 0, status: 'NONE' },
      LINKEDIN: { count: 0, status: 'NONE' },
      PINTEREST: { count: 0, status: 'NONE' },
      YOUTUBE: { count: 0, status: 'NONE' },
      TIKTOK: { count: 0, status: 'NONE' },
      THREADS: { count: 0, status: 'NONE' },
    };

    for (const acc of data.socialAccounts) {
      const key = normalizePlatformKey(acc.provider || acc.platform || '');
      if (acc.connectionStatus === 'CONNECTED') {
        counts[key].count += 1;
        counts[key].status = 'CONNECTED';
      } else if (acc.connectionStatus === 'EXPIRED' && counts[key].status === 'NONE') {
        counts[key].status = 'EXPIRED';
      }
    }
    return counts;
  }, [data.socialAccounts]);

  const totalReach = Number(
    data.analyticsOverview?.totalReach ?? data.analyticsOverview?.totalImpressions ?? 0,
  );
  const engagementRate = Number(data.analyticsOverview?.engagementRate ?? 0);
  const totalFollowers = Number(
    data.analyticsOverview?.totalFollowers ?? data.analyticsOverview?.followers ?? 0,
  );
  const scheduledCount = data.scheduledPosts.filter(
    (p) => p.status === 'SCHEDULED' || p.status === 'DISPATCHING',
  ).length;
  const publishedCount = data.scheduledPosts.filter((p) => p.status === 'PUBLISHED').length;
  const pendingDraftsCount = data.drafts.filter(
    (d) => d.status === 'DRAFT' || d.status === 'IN_REVIEW',
  ).length;
  const approvedDraftsCount = data.drafts.filter((d) => d.status === 'APPROVED').length;
  const openInboxCount = data.interactions.filter(
    (i) => i.workflowStatus === 'OPEN' || i.workflowStatus === 'IN_PROGRESS',
  ).length;
  const totalConnected = data.socialAccounts.filter(
    (a) => a.connectionStatus === 'CONNECTED',
  ).length;

  const recentPosts = useMemo(() => {
    return [...data.scheduledPosts]
      .sort(
        (a, b) =>
          new Date(b.scheduledFor || b.createdAt || 0).getTime() -
          new Date(a.scheduledFor || a.createdAt || 0).getTime(),
      )
      .slice(0, 5);
  }, [data.scheduledPosts]);

  if (!isLoadingWorkspaces && workspaces.length === 0) {
    return (
      <div className="max-w-2xl mx-auto py-12">
        <EmptyState
          icon={<Building2 className="w-6 h-6" />}
          title="Welcome to OmniSocial AI"
          description="Create your first business workspace to connect social accounts, generate AI content, and schedule campaigns."
          action={
            <Link href={ROUTES.WORKSPACE_ONBOARDING}>
              <Button rightIcon={<ArrowRight className="w-4 h-4" />}>
                Create Workspace
              </Button>
            </Link>
          }
        />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-[1440px] mx-auto">
      {/* Top Welcome Hero Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#111827] dark:text-white">
              Welcome back, {user?.name?.split(' ')[0] || 'Creator'}!
            </h1>
            {currentWorkspace?.currentUserRole && (
              <Badge variant="purple">{currentWorkspace.currentUserRole}</Badge>
            )}
          </div>
          <p className="text-sm text-[#64748B] dark:text-slate-400 mt-1">
            Here&apos;s your live social media performance overview for{' '}
            <strong className="text-[#111827] dark:text-slate-200">
              {currentWorkspace?.name || 'your workspace'}
            </strong>
            .
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={loadDashboard}
            isLoading={isLoading}
            leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
          >
            Refresh
          </Button>
          <Link href={ROUTES.BULK_PUBLISH}>
            <Button variant="outline" size="sm" leftIcon={<Send className="w-3.5 h-3.5" />}>
              Bulk Publish
            </Button>
          </Link>
          <Link href={ROUTES.CONTENT_STUDIO}>
            <Button variant="primary" size="sm" leftIcon={<Sparkles className="w-3.5 h-3.5" />}>
              Generate AI Post
            </Button>
          </Link>
        </div>
      </div>

      {/* 4 Real KPI Cards */}
      {isLoading && !data.analyticsOverview && data.scheduledPosts.length === 0 ? (
        <CardGridSkeleton count={4} />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <StatCard
            label="Total Reach"
            value={formatCompact(totalReach)}
            helper={`Last ${days} days`}
            icon={<Eye className="w-5 h-5" />}
            accent="purple"
          />
          <StatCard
            label="Engagement Rate"
            value={`${engagementRate.toFixed(1)}%`}
            helper={
              data.analyticsOverview?.totalEngagement
                ? `${formatCompact(Number(data.analyticsOverview.totalEngagement))} interactions`
                : 'From synced snapshots'
            }
            icon={<Heart className="w-5 h-5" />}
            accent="blue"
          />
          <StatCard
            label="Total Followers"
            value={formatCompact(totalFollowers)}
            helper={`${totalConnected} connected channel${totalConnected === 1 ? '' : 's'}`}
            icon={<Users className="w-5 h-5" />}
            accent="cyan"
          />
          <StatCard
            label="Scheduled Posts"
            value={scheduledCount}
            helper={`${publishedCount} published · ${approvedDraftsCount} approved`}
            icon={<Calendar className="w-5 h-5" />}
            accent="emerald"
          />
        </div>
      )}

      {/* Main Split: Performance Overview Chart (8 cols) + Connected Accounts (4 cols) */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        <ChartCard
          className="xl:col-span-8"
          title="Performance Overview"
          subtitle="Live workspace reach and engagement trend from synced analytics snapshots"
          isLoading={isLoading && data.timeseries.length === 0}
          isEmpty={!isLoading && data.timeseries.length === 0}
          emptyMessage="No analytics timeseries snapshots recorded yet for this window. Connect a social account and run Analytics Sync to populate real charts."
          headerRight={
            <div className="flex items-center gap-2">
              <div className="hidden sm:flex items-center gap-3 mr-2 text-[11px] font-semibold text-[#64748B] dark:text-slate-400">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#7138F5]" /> Reach
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#20C8E8]" /> Engagement
                </span>
              </div>
              <div className="inline-flex rounded-xl border border-[#E7EAF2] dark:border-white/15 bg-[#F7F8FC] dark:bg-[#0B1024] p-0.5">
                {([7, 30, 90] as const).map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setDays(d)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                      days === d
                        ? 'bg-gradient-to-r from-[#7138F5] to-[#2878FF] text-white shadow-xs'
                        : 'text-[#64748B] dark:text-slate-400 hover:text-[#111827] dark:hover:text-white'
                    }`}
                  >
                    {d}d
                  </button>
                ))}
              </div>
            </div>
          }
        >
          <PerformanceAreaChart data={data.timeseries} />
        </ChartCard>

        {/* Connected Accounts 8-Platform Summary */}
        <div className="xl:col-span-4 rounded-2xl bg-white dark:bg-[#0F142B]/90 border border-[#E7EAF2] dark:border-[#7138F5]/25 shadow-soft dark:shadow-none flex flex-col overflow-hidden">
          <div className="px-5 py-4 border-b border-[#E7EAF2]/80 dark:border-white/10 flex items-center justify-between gap-2">
            <div>
              <h3 className="text-base font-bold text-[#111827] dark:text-white">
                Connected Accounts
              </h3>
              <p className="text-xs text-[#64748B] dark:text-slate-400">
                {totalConnected} active across 8 networks
              </p>
            </div>
            <Link
              href={ROUTES.SETTINGS_SOCIAL_ACCOUNTS}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-[#F1EBFF] dark:bg-[#7138F5]/20 text-[#7138F5] dark:text-[#C4A5FF] text-xs font-bold hover:brightness-95 transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              Manage
            </Link>
          </div>

          <div className="p-4 space-y-2 flex-1 overflow-y-auto">
            {ORDERED_PLATFORMS.map((platform) => {
              const info = platformAccountCounts[platform];
              return (
                <AccountCard
                  key={platform}
                  platform={platform}
                  accountCount={info.count}
                  status={info.status}
                  compact
                  onAction={() => router.push(ROUTES.SETTINGS_SOCIAL_ACCOUNTS)}
                />
              );
            })}
          </div>
        </div>
      </div>

      {/* Bottom Split: Upcoming/Recent Posts (7 cols) + Operations & Quick Actions (5 cols) */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        {/* Recent / Scheduled Publishing Activity */}
        <div className="xl:col-span-7 rounded-2xl bg-white dark:bg-[#0F142B]/90 border border-[#E7EAF2] dark:border-[#1E2749] shadow-soft dark:shadow-none overflow-hidden">
          <div className="px-5 sm:px-6 py-4 border-b border-[#E7EAF2]/80 dark:border-white/10 flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-[#111827] dark:text-white">
                Publishing Queue &amp; Recent Posts
              </h3>
              <p className="text-xs text-[#64748B] dark:text-slate-400">
                Live records from scheduled_posts in your workspace
              </p>
            </div>
            <Link
              href={ROUTES.CALENDAR}
              className="inline-flex items-center gap-1 text-xs font-bold text-[#7138F5] dark:text-[#20C8E8] hover:underline"
            >
              View Calendar <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="p-5">
            {recentPosts.length === 0 ? (
              <EmptyState
                icon={<Clock className="w-5 h-5" />}
                title="No scheduled or published posts yet"
                description="Draft a campaign in AI Studio, approve it, and schedule or bulk publish across your connected social accounts."
                action={
                  <Link href={ROUTES.CONTENT_STUDIO}>
                    <Button size="sm" leftIcon={<Sparkles className="w-3.5 h-3.5" />}>
                      Open AI Studio
                    </Button>
                  </Link>
                }
              />
            ) : (
              <div className="space-y-3">
                {recentPosts.map((post) => {
                  const targets = Array.isArray(post.targets) ? post.targets : [];
                  const statusVariant =
                    post.status === 'PUBLISHED'
                      ? 'success'
                      : post.status === 'FAILED'
                        ? 'danger'
                        : post.status === 'SCHEDULED'
                          ? 'purple'
                          : 'default';
                  return (
                    <Link
                      key={post.id}
                      href={ROUTES.CALENDAR}
                      className="flex items-center justify-between gap-4 p-3.5 rounded-xl bg-[#F7F8FC] dark:bg-white/[0.03] border border-[#E7EAF2] dark:border-white/10 hover:border-[#7138F5]/40 transition-all"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-bold text-[#111827] dark:text-white truncate">
                          {post.title || post.caption?.slice(0, 70) || 'Scheduled Campaign Post'}
                        </p>
                        <div className="mt-1.5 flex items-center gap-2 flex-wrap">
                          {targets.slice(0, 4).map((t: any, idx: number) => (
                            <PlatformBadge
                              key={t.id || idx}
                              platform={t.platform || t.socialAccount?.provider || 'INSTAGRAM'}
                              size="sm"
                            />
                          ))}
                          {post.scheduledFor && (
                            <span className="text-[11px] text-[#64748B] dark:text-slate-400">
                              {new Date(post.scheduledFor).toLocaleString()}
                            </span>
                          )}
                        </div>
                      </div>
                      <Badge variant={statusVariant}>{post.status}</Badge>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Workspace Operations & Quick Launchers */}
        <div className="xl:col-span-5 space-y-4">
          <div className="rounded-2xl p-5 bg-white dark:bg-[#0F142B]/90 border border-[#E7EAF2] dark:border-[#1E2749] shadow-soft dark:shadow-none">
            <h3 className="text-base font-bold text-[#111827] dark:text-white mb-4">
              Workflow Pulse
            </h3>
            <div className="grid grid-cols-3 gap-3">
              <Link
                href={ROUTES.CONTENT_DRAFTS}
                className="p-3.5 rounded-xl bg-[#F7F8FC] dark:bg-white/[0.03] border border-[#E7EAF2] dark:border-white/10 hover:border-[#7138F5]/40 transition-all"
              >
                <FileText className="w-4 h-4 text-[#7138F5] dark:text-[#C4A5FF] mb-2" />
                <p className="text-xl font-extrabold text-[#111827] dark:text-white">
                  {pendingDraftsCount}
                </p>
                <p className="text-[11px] font-semibold text-[#64748B] dark:text-slate-400">
                  Drafts / Review
                </p>
              </Link>
              <Link
                href={ROUTES.INBOX}
                className="p-3.5 rounded-xl bg-[#F7F8FC] dark:bg-white/[0.03] border border-[#E7EAF2] dark:border-white/10 hover:border-[#2878FF]/40 transition-all"
              >
                <Inbox className="w-4 h-4 text-[#2878FF] dark:text-[#7EB2FF] mb-2" />
                <p className="text-xl font-extrabold text-[#111827] dark:text-white">
                  {openInboxCount}
                </p>
                <p className="text-[11px] font-semibold text-[#64748B] dark:text-slate-400">
                  Open Inbox
                </p>
              </Link>
              <Link
                href={ROUTES.LINKS}
                className="p-3.5 rounded-xl bg-[#F7F8FC] dark:bg-white/[0.03] border border-[#E7EAF2] dark:border-white/10 hover:border-[#20C8E8]/40 transition-all"
              >
                <Link2 className="w-4 h-4 text-[#0891B2] dark:text-[#20C8E8] mb-2" />
                <p className="text-xl font-extrabold text-[#111827] dark:text-white">
                  {formatCompact(data.totalLinkClicks)}
                </p>
                <p className="text-[11px] font-semibold text-[#64748B] dark:text-slate-400">
                  Link Clicks ({data.linksCount})
                </p>
              </Link>
            </div>
          </div>

          <div className="rounded-2xl p-5 bg-white dark:bg-[#0F142B]/90 border border-[#E7EAF2] dark:border-[#1E2749] shadow-soft dark:shadow-none">
            <h3 className="text-base font-bold text-[#111827] dark:text-white mb-3">
              Quick Actions
            </h3>
            <div className="grid grid-cols-2 gap-2.5">
              {[
                { label: 'AI Studio', href: ROUTES.CONTENT_STUDIO, icon: Sparkles },
                { label: 'Bulk Publish', href: ROUTES.BULK_PUBLISH, icon: Send },
                { label: 'Analytics', href: ROUTES.ANALYTICS, icon: BarChart3 },
                { label: 'Calendar', href: ROUTES.CALENDAR, icon: Calendar },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="flex items-center gap-2.5 px-3.5 py-3 rounded-xl bg-[#F7F8FC] dark:bg-white/[0.04] border border-[#E7EAF2] dark:border-white/10 hover:border-[#7138F5]/45 hover:bg-[#F1EBFF]/60 dark:hover:bg-[#7138F5]/20 text-xs font-bold text-[#111827] dark:text-white transition-all"
                  >
                    <Icon className="w-4 h-4 text-[#7138F5] dark:text-[#20C8E8] shrink-0" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
