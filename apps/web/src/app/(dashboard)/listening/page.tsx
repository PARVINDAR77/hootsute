'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useWorkspace } from '@/lib/workspace-context';
import { apiClient } from '@/lib/api-client';
import {
  ListeningQueryDto,
  ListeningMentionDto,
  ListeningAnalyticsSummaryDto,
  ListeningSentiment,
  SocialPlatform,
} from '@packages/shared';
import {
  Radio,
  Plus,
  Search,
  ExternalLink,
  Star,
  CheckCircle2,
  AlertTriangle,
  TrendingUp,
  Users,
  MessageSquare,
  Sparkles,
  Loader2,
  Trash2,
  Filter,
  Eye,
  Send,
  SlidersHorizontal,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Alert } from '@/components/ui/Alert';
import { Input } from '@/components/ui/Input';
import { CreateQueryModal } from '@/components/listening/CreateQueryModal';
import { ROUTES } from '@/lib/constants';

export default function SocialListeningPage() {
  const router = useRouter();
  const { currentWorkspace } = useWorkspace();
  const workspaceId = currentWorkspace?.id;

  const [queries, setQueries] = useState<ListeningQueryDto[]>([]);
  const [selectedQueryId, setSelectedQueryId] = useState<string>('ALL');
  const [mentions, setMentions] = useState<ListeningMentionDto[]>([]);
  const [analytics, setAnalytics] = useState<ListeningAnalyticsSummaryDto | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedSentiment, setSelectedSentiment] = useState<'ALL' | 'POSITIVE' | 'NEUTRAL' | 'NEGATIVE'>('ALL');
  const [selectedPlatform, setSelectedPlatform] = useState<string>('ALL');
  const [onlyStarred, setOnlyStarred] = useState<boolean>(false);

  // Modal
  const [isCreateOpen, setIsCreateOpen] = useState<boolean>(false);

  const fetchData = useCallback(async () => {
    if (!workspaceId) return;
    setIsLoading(true);
    setErrorMsg(null);

    try {
      // 1. Fetch Queries
      const qRes = await apiClient<any>(
        `/workspaces/${workspaceId}/listening/queries`,
      );
      const queryList: ListeningQueryDto[] = Array.isArray(qRes) ? qRes : (qRes?.data || []);
      setQueries(queryList);

      // 2. Fetch Feed Mentions
      const params = new URLSearchParams();
      if (selectedQueryId !== 'ALL') params.set('queryId', selectedQueryId);
      if (selectedSentiment !== 'ALL') params.set('sentiment', selectedSentiment);
      if (selectedPlatform !== 'ALL') params.set('platform', selectedPlatform);
      if (searchQuery.trim()) params.set('search', searchQuery.trim());
      if (onlyStarred) params.set('onlyStarred', 'true');
      params.set('limit', '50');

      const feedRes = await apiClient<any>(
        `/workspaces/${workspaceId}/listening/feed?${params.toString()}`,
      );

      const mentionList: ListeningMentionDto[] = Array.isArray(feedRes)
        ? feedRes
        : Array.isArray(feedRes?.data)
          ? feedRes.data
          : Array.isArray(feedRes?.data?.data)
            ? feedRes.data.data
            : [];
      setMentions(mentionList);

      // 3. Fetch Analytics
      const analyticsParam = selectedQueryId !== 'ALL' ? `?queryId=${selectedQueryId}` : '';
      const analyticsRes = await apiClient<any>(
        `/workspaces/${workspaceId}/listening/analytics${analyticsParam}`,
      );

      const analyticsData: ListeningAnalyticsSummaryDto | null =
        analyticsRes && typeof analyticsRes === 'object'
          ? ('data' in analyticsRes ? analyticsRes.data : analyticsRes)
          : null;
      setAnalytics(analyticsData && 'totalMentions' in analyticsData ? analyticsData : null);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to load social listening stream');
    } finally {
      setIsLoading(false);
    }
  }, [workspaceId, selectedQueryId, selectedSentiment, selectedPlatform, searchQuery, onlyStarred]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleToggleStar = async (mentionId: string) => {
    if (!workspaceId) return;
    try {
      const res = await apiClient<any>(
        `/workspaces/${workspaceId}/listening/mentions/${mentionId}/star`,
        { method: 'PATCH' },
      );
      const updated = res?.data ?? res;
      if (updated && typeof updated.isStarred === 'boolean') {
        setMentions((prev) =>
          prev.map((m) => (m.id === mentionId ? { ...m, isStarred: updated.isStarred } : m)),
        );
      }
    } catch (err: any) {
      console.error('Failed to star mention:', err);
    }
  };

  const handleDeleteQuery = async (queryId: string) => {
    if (!workspaceId || !confirm('Are you sure you want to delete this listening query and its mentions?')) return;
    try {
      await apiClient(`workspaces/${workspaceId}/listening/queries/${queryId}`, {
        method: 'DELETE',
      });
      if (selectedQueryId === queryId) {
        setSelectedQueryId('ALL');
      }
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Failed to delete query');
    }
  };

  const getPlatformBadge = (platform: SocialPlatform) => {
    switch (platform) {
      case SocialPlatform.TWITTER_X:
        return <Badge variant="outline" className="text-black font-semibold border-slate-300">Twitter / X</Badge>;
      case SocialPlatform.LINKEDIN:
        return <Badge variant="outline" className="text-blue-700 font-semibold border-blue-200 bg-blue-50/50">LinkedIn</Badge>;
      case SocialPlatform.INSTAGRAM:
        return <Badge variant="outline" className="text-pink-600 font-semibold border-pink-200 bg-pink-50/50">Instagram</Badge>;
      case SocialPlatform.FACEBOOK:
        return <Badge variant="outline" className="text-blue-600 font-semibold border-blue-200 bg-blue-50/50">Facebook</Badge>;
      default:
        return <Badge variant="outline">{platform}</Badge>;
    }
  };

  const getSentimentBadge = (sentiment: ListeningSentiment, score: number) => {
    switch (sentiment) {
      case ListeningSentiment.POSITIVE:
        return (
          <Badge variant="success" className="gap-1 font-semibold">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            Positive ({score > 0 ? `+${score}` : score})
          </Badge>
        );
      case ListeningSentiment.NEGATIVE:
        return (
          <Badge variant="danger" className="gap-1 font-semibold">
            <AlertTriangle className="w-3 h-3 text-rose-600" />
            Negative ({score})
          </Badge>
        );
      case ListeningSentiment.NEUTRAL:
      default:
        return (
          <Badge variant="outline" className="text-slate-600 border-slate-200">
            Neutral (0.0)
          </Badge>
        );
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Top Banner & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Social Listening &amp; Brand Monitoring
            </h1>
            <Badge variant="purple" className="text-xs">
              AI NLP Sentiment
            </Badge>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Real-time keyword tracking, sentiment polarity analysis, competitor watch, and reach attribution.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            onClick={() => setIsCreateOpen(true)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            New Listening Query
          </Button>
        </div>
      </div>

      {errorMsg && (
        <Alert variant="danger">
          <AlertTriangle className="w-4 h-4 mr-2" />
          {errorMsg}
        </Alert>
      )}

      {/* Analytics KPI Stat Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl border border-slate-200/80 bg-white shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase text-slate-500 tracking-wider">
              Total Mentions
            </span>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <MessageSquare className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-bold text-slate-900">
            {analytics?.totalMentions?.toLocaleString() || '0'}
          </div>
          <div className="mt-1 text-xs text-slate-400">Tracked across all active queries</div>
        </div>

        <div className="p-5 rounded-2xl border border-slate-200/80 bg-white shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase text-slate-500 tracking-wider">
              Positive Sentiment
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-bold text-emerald-600">
            {analytics?.sentimentBreakdown.find((s) => s.sentiment === ListeningSentiment.POSITIVE)?.percentage || 0}%
          </div>
          <div className="mt-1 text-xs text-slate-400">
            {analytics?.sentimentBreakdown.find((s) => s.sentiment === ListeningSentiment.POSITIVE)?.count || 0} favorable brand posts
          </div>
        </div>

        <div className="p-5 rounded-2xl border border-slate-200/80 bg-white shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase text-slate-500 tracking-wider">
              Negative / Risk Posts
            </span>
            <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-bold text-rose-600">
            {analytics?.sentimentBreakdown.find((s) => s.sentiment === ListeningSentiment.NEGATIVE)?.percentage || 0}%
          </div>
          <div className="mt-1 text-xs text-slate-400">
            {analytics?.sentimentBreakdown.find((s) => s.sentiment === ListeningSentiment.NEGATIVE)?.count || 0} posts requiring attention
          </div>
        </div>

        <div className="p-5 rounded-2xl border border-slate-200/80 bg-white shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase text-slate-500 tracking-wider">
              Estimated Total Reach
            </span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-bold text-slate-900">
            {analytics?.estimatedTotalReach.toLocaleString() || '0'}
          </div>
          <div className="mt-1 text-xs text-slate-400">Combined follower impressions</div>
        </div>
      </div>

      {/* Query Selector Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-slate-200/80">
        <button
          onClick={() => setSelectedQueryId('ALL')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all shrink-0 ${
            selectedQueryId === 'ALL'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          All Stream Mentions
        </button>

        {queries.map((q) => (
          <div key={q.id} className="flex items-center shrink-0">
            <button
              onClick={() => setSelectedQueryId(q.id)}
              className={`px-3.5 py-1.5 rounded-l-xl text-xs font-semibold transition-all border-y border-l ${
                selectedQueryId === q.id
                  ? 'bg-indigo-50 border-indigo-200 text-indigo-700 shadow-xs'
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              {q.name}
              <span className="ml-1.5 px-1.5 py-0.5 rounded-full text-[10px] bg-slate-100 text-slate-600 font-bold">
                {q.totalMentions || 0}
              </span>
            </button>
            <button
              title="Delete Query"
              onClick={() => handleDeleteQuery(q.id)}
              className={`px-2 py-1.5 rounded-r-xl border text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors ${
                selectedQueryId === q.id ? 'border-indigo-200 bg-indigo-50' : 'border-slate-200 bg-white'
              }`}
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>

      {/* Feed Filters Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="flex items-center gap-2 flex-1 max-w-md">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search content or @author..."
              className="pl-9 h-9 text-xs"
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Sentiment Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-medium text-slate-500">Sentiment:</span>
            <select
              value={selectedSentiment}
              onChange={(e) => setSelectedSentiment(e.target.value as any)}
              className="h-9 px-2.5 rounded-xl border border-slate-200 text-xs bg-white text-slate-700 font-medium focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            >
              <option value="ALL">All Sentiments</option>
              <option value="POSITIVE">Positive only</option>
              <option value="NEUTRAL">Neutral only</option>
              <option value="NEGATIVE">Negative only</option>
            </select>
          </div>

          {/* Platform Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-medium text-slate-500">Platform:</span>
            <select
              value={selectedPlatform}
              onChange={(e) => setSelectedPlatform(e.target.value)}
              className="h-9 px-2.5 rounded-xl border border-slate-200 text-xs bg-white text-slate-700 font-medium focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            >
              <option value="ALL">All Platforms</option>
              <option value="TWITTER_X">Twitter / X</option>
              <option value="LINKEDIN">LinkedIn</option>
              <option value="INSTAGRAM">Instagram</option>
              <option value="FACEBOOK">Facebook</option>
            </select>
          </div>

          {/* Starred Toggle */}
          <Button
            type="button"
            variant={onlyStarred ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setOnlyStarred(!onlyStarred)}
            className={`h-9 flex items-center gap-1.5 text-xs ${onlyStarred ? 'bg-amber-500 hover:bg-amber-600 text-white' : ''}`}
          >
            <Star className={`w-3.5 h-3.5 ${onlyStarred ? 'fill-current' : 'text-amber-500'}`} />
            Starred Only
          </Button>
        </div>
      </div>

      {/* Mentions Stream Feed */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="p-12 text-center bg-white rounded-2xl border border-slate-200/80">
            <Loader2 className="w-8 h-8 text-indigo-600 animate-spin mx-auto mb-3" />
            <p className="text-sm font-medium text-slate-600">Loading social mentions stream...</p>
          </div>
        ) : mentions.length === 0 ? (
          <div className="p-12 text-center bg-white rounded-2xl border border-slate-200/80 shadow-xs">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-3">
              <Radio className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900">No mentions found</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              {queries.length === 0
                ? 'Create your first brand listening query to start tracking mentions, competitor keywords, and sentiments.'
                : 'No mentions match your current filter parameters. Try clearing search filters or broadening your keyword targets.'}
            </p>
            {queries.length === 0 && (
              <Button
                onClick={() => setIsCreateOpen(true)}
                className="mt-4 bg-indigo-600 hover:bg-indigo-700 text-white text-xs"
              >
                <Plus className="w-3.5 h-3.5 mr-1" />
                Create Listening Query
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {mentions.map((mention) => (
              <div
                key={mention.id}
                className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-xs hover:border-indigo-200 transition-all space-y-3"
              >
                {/* Mention Author & Metadata Header */}
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <img
                      src={mention.authorAvatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${mention.authorHandle}`}
                      alt={mention.authorName || mention.authorHandle}
                      className="w-10 h-10 rounded-full border border-slate-200 object-cover bg-slate-50"
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-slate-900">
                          {mention.authorName || mention.authorHandle}
                        </span>
                        <span className="text-xs text-slate-400 font-mono">
                          {mention.authorHandle.startsWith('@') ? mention.authorHandle : `@${mention.authorHandle}`}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-500">
                        {getPlatformBadge(mention.platform)}
                        <span>•</span>
                        <span>{mention.authorFollowersCount.toLocaleString()} followers</span>
                        <span>•</span>
                        <span>{new Date(mention.publishedAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {getSentimentBadge(mention.sentiment, mention.sentimentScore)}
                    <button
                      onClick={() => handleToggleStar(mention.id)}
                      className={`p-1.5 rounded-lg border transition-colors ${
                        mention.isStarred
                          ? 'border-amber-200 bg-amber-50 text-amber-500'
                          : 'border-slate-200 bg-white text-slate-400 hover:text-amber-500'
                      }`}
                      title={mention.isStarred ? 'Starred' : 'Star mention'}
                    >
                      <Star className={`w-4 h-4 ${mention.isStarred ? 'fill-current' : ''}`} />
                    </button>
                  </div>
                </div>

                {/* Mention Content Body */}
                <div className="text-sm text-slate-800 leading-relaxed font-normal bg-slate-50/50 p-3 rounded-xl border border-slate-100">
                  {mention.content}
                </div>

                {/* Metrics & Actions Footer */}
                <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
                  <div className="flex items-center gap-4">
                    <span>
                      Est. Reach: <strong className="text-slate-700">{mention.reachEstimate.toLocaleString()}</strong>
                    </span>
                    <span>
                      Engagements: <strong className="text-slate-700">{mention.engagementCount.toLocaleString()}</strong>
                    </span>
                    {mention.queryName && (
                      <span className="text-[11px] px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 font-medium">
                        Query: {mention.queryName}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {mention.url && (
                      <a
                        href={mention.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        Original Post
                      </a>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => router.push(ROUTES.CONTENT_STUDIO)}
                      className="text-xs h-7 text-indigo-600 border-indigo-200 hover:bg-indigo-50 flex items-center gap-1"
                    >
                      <Sparkles className="w-3 h-3 text-indigo-600" />
                      Create Draft Response
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Query Modal */}
      {workspaceId && (
        <CreateQueryModal
          workspaceId={workspaceId}
          isOpen={isCreateOpen}
          onClose={() => setIsCreateOpen(false)}
          onCreated={(newQuery) => {
            setQueries([newQuery, ...queries]);
            setSelectedQueryId(newQuery.id);
            fetchData();
          }}
        />
      )}
    </div>
  );
}
