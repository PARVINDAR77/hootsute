'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useWorkspace } from '@/lib/workspace-context';
import { apiClient } from '@/lib/api-client';
import {
  Sparkles,
  TrendingUp,
  Clock,
  Zap,
  Target,
  ArrowRight,
  CheckCircle2,
  XCircle,
  RefreshCw,
  AlertCircle,
  HelpCircle,
  ChevronRight,
  BarChart3,
  Layers,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { GrowthInsightItem } from '@/components/analytics/GrowthInsightsPanel';

type InsightCategoryFilter =
  | 'ALL'
  | 'TIMING'
  | 'CONTENT_FORMAT'
  | 'ENGAGEMENT'
  | 'TOPIC_AUDIENCE'
  | 'CONSISTENCY';

export default function AnalyticsInsightsPage() {
  const { currentWorkspace } = useWorkspace();
  const workspaceId = currentWorkspace?.id;
  const userRole = currentWorkspace?.currentUserRole || 'VIEWER';

  const [insights, setInsights] = useState<GrowthInsightItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<InsightCategoryFilter>('ALL');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [dismissingId, setDismissingId] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const canManage = userRole === 'OWNER' || userRole === 'ADMIN' || userRole === 'EDITOR';

  // Fetch insights
  const fetchInsights = useCallback(async () => {
    if (!workspaceId) return;
    setIsLoading(true);
    try {
      const res = await apiClient(`/workspaces/${workspaceId}/analytics/insights`);
      const list = Array.isArray(res) ? res : res?.data ?? [];
      setInsights(list);
    } catch (err: any) {
      console.error('Failed to load growth insights:', err);
    } finally {
      setIsLoading(false);
    }
  }, [workspaceId]);

  useEffect(() => {
    fetchInsights();
  }, [fetchInsights]);

  // Generate / refresh insights
  const handleGenerate = async (force = false) => {
    if (!workspaceId || !canManage || isGenerating) return;
    setIsGenerating(true);
    setActionMessage(null);
    try {
      const res = await apiClient(`/workspaces/${workspaceId}/analytics/insights/generate`, {
        method: 'POST',
        body: JSON.stringify({ force, useAiEnrichment: true }),
      });
      const count = res?.data?.generatedCount ?? res?.count ?? 0;
      setActionMessage({
        type: 'success',
        text: res?.message || `Successfully evaluated growth models (${count} insights refreshed).`,
      });
      await fetchInsights();
    } catch (err: any) {
      setActionMessage({
        type: 'error',
        text: err?.message || 'Failed to re-evaluate insights engine.',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  // Dismiss insight
  const handleDismiss = async (insightId: string) => {
    if (!workspaceId || !canManage) return;
    setDismissingId(insightId);
    try {
      await apiClient(`/workspaces/${workspaceId}/analytics/insights/${insightId}/dismiss`, {
        method: 'POST',
      });
      setInsights((prev) => prev.filter((i) => i.id !== insightId));
      setActionMessage({
        type: 'success',
        text: 'Recommendation dismissed.',
      });
    } catch (err: any) {
      setActionMessage({
        type: 'error',
        text: err?.message || 'Failed to dismiss recommendation.',
      });
    } finally {
      setDismissingId(null);
    }
  };

  const filteredInsights = insights.filter((item) => {
    if (selectedCategory === 'ALL') return true;
    return item.category === selectedCategory;
  });

  const getCategoryMeta = (cat: string) => {
    switch (cat) {
      case 'TIMING':
        return { label: 'Optimal Timing', icon: Clock, color: 'text-brand-purple dark:text-brand-cyan' };
      case 'ENGAGEMENT':
        return { label: 'Viral Momentum', icon: Zap, color: 'text-amber-500' };
      case 'CONTENT_FORMAT':
        return { label: 'Format Shift', icon: Layers, color: 'text-brand-blue' };
      case 'TOPIC_AUDIENCE':
        return { label: 'Audience Signal', icon: Target, color: 'text-emerald-500' };
      case 'CONSISTENCY':
        return { label: 'Publishing Rhythm', icon: TrendingUp, color: 'text-brand-purple' };
      default:
        return { label: 'Growth Signal', icon: TrendingUp, color: 'text-brand-purple' };
    }
  };

  if (!workspaceId) {
    return (
      <div className="p-8 text-center text-slate-500 dark:text-slate-400">
        <Sparkles className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
        <h3 className="text-base font-semibold text-slate-800 dark:text-white">No Workspace Selected</h3>
        <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
          Select an active workspace to view AI-generated growth strategies.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200/80 dark:border-slate-800 transition-colors">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-brand-purple dark:text-brand-cyan" />
              AI Growth Insights
            </h1>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-brand-purple/10 text-brand-purple dark:text-brand-cyan border border-brand-purple/20">
              Autonomous Intelligence
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Machine-analyzed cross-platform recommendations derived from actual engagement signals, posting times, and audience retention.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link href="/analytics">
            <Button variant="outline" size="sm" className="text-xs h-9 gap-1.5 border-slate-200 dark:border-slate-800">
              <BarChart3 className="w-3.5 h-3.5" />
              <span>Back to Telemetry</span>
            </Button>
          </Link>

          {canManage && (
            <Button
              size="sm"
              onClick={() => handleGenerate(true)}
              disabled={isGenerating}
              className="text-xs h-9 gap-1.5 bg-gradient-to-r from-brand-purple to-brand-blue text-white shadow-md shadow-brand-purple/20 hover:opacity-95"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isGenerating ? 'animate-spin' : ''}`} />
              <span>{isGenerating ? 'Scanning Data...' : 'Re-Evaluate Signals'}</span>
            </Button>
          )}
        </div>
      </div>

      {actionMessage && (
        <div
          className={`p-3.5 rounded-xl border text-xs flex items-center justify-between transition-all ${
            actionMessage.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800/60 text-emerald-800 dark:text-emerald-300'
              : 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800/60 text-rose-800 dark:text-rose-300'
          }`}
        >
          <div className="flex items-center gap-2">
            {actionMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
            )}
            <span>{actionMessage.text}</span>
          </div>
          <button
            onClick={() => setActionMessage(null)}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs font-semibold"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Categories Bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {(
          [
            { label: 'All Signals', value: 'ALL' },
            { label: 'Optimal Timing', value: 'TIMING' },
            { label: 'Engagement Momentum', value: 'ENGAGEMENT' },
            { label: 'Content Formats', value: 'CONTENT_FORMAT' },
            { label: 'Audience Signal', value: 'TOPIC_AUDIENCE' },
            { label: 'Publishing Rhythm', value: 'CONSISTENCY' },
          ] as { label: string; value: InsightCategoryFilter }[]
        ).map((tab) => (
          <button
            key={tab.value}
            onClick={() => setSelectedCategory(tab.value)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all shrink-0 ${
              selectedCategory === tab.value
                ? 'bg-brand-purple text-white shadow-xs'
                : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Insights Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {Array.from({ length: 3 }).map((_, idx) => (
            <Card key={idx} className="p-6 border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 animate-pulse">
              <div className="h-5 w-28 bg-slate-200 dark:bg-slate-800 rounded mb-4" />
              <div className="h-4 w-full bg-slate-100 dark:bg-slate-800/60 rounded mb-2" />
              <div className="h-4 w-4/5 bg-slate-100 dark:bg-slate-800/60 rounded mb-6" />
              <div className="h-8 w-24 bg-slate-200 dark:bg-slate-800 rounded" />
            </Card>
          ))}
        </div>
      ) : filteredInsights.length === 0 ? (
        <Card className="p-12 text-center border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
          <div className="w-14 h-14 rounded-2xl bg-brand-purple/10 border border-brand-purple/20 flex items-center justify-center text-brand-purple dark:text-brand-cyan mx-auto mb-4">
            <Sparkles className="w-7 h-7" />
          </div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white">No Active Growth Recommendations</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 max-w-md mx-auto">
            Your publishing rhythm and channel metrics are performing nominally. Click &quot;Re-Evaluate Signals&quot; above to run fresh analytics heuristics.
          </p>
          {canManage && (
            <Button
              size="sm"
              onClick={() => handleGenerate(true)}
              className="mt-5 text-xs bg-brand-purple text-white"
            >
              Scan Telemetry Now
            </Button>
          )}
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredInsights.map((item) => {
            const meta = getCategoryMeta(item.category);
            const Icon = meta.icon;

            return (
              <Card
                key={item.id}
                className="border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs hover:border-brand-purple/40 dark:hover:border-brand-cyan/40 transition-all flex flex-col justify-between"
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-300">
                      <Icon className={`w-4 h-4 ${meta.color}`} />
                      {meta.label}
                    </span>
                    <Badge variant={item.confidenceScore >= 0.8 ? 'purple' : 'default'}>
                      {Math.round(item.confidenceScore * 100)}% Confidence
                    </Badge>
                  </div>
                  <CardTitle className="text-base font-bold text-slate-900 dark:text-white mt-2 leading-snug">
                    {item.title}
                  </CardTitle>
                </CardHeader>

                <CardContent className="space-y-3 flex-1">
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    {item.summary}
                  </p>

                  {item.suggestedAction && (
                    <div className="p-3 rounded-xl bg-brand-purple/5 dark:bg-brand-purple/10 border border-brand-purple/20 text-xs text-slate-800 dark:text-slate-200">
                      <span className="font-bold text-brand-purple dark:text-brand-cyan block text-[11px] mb-1">
                        Recommended Action:
                      </span>
                      {item.suggestedAction}
                    </div>
                  )}

                  {item.evidence && (
                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400 space-y-1">
                      <span className="font-semibold text-slate-700 dark:text-slate-300 block uppercase tracking-wider text-[10px]">
                        Observed Evidence:
                      </span>
                      <p>{typeof item.evidence === 'string' ? item.evidence : JSON.stringify(item.evidence)}</p>
                    </div>
                  )}
                </CardContent>

                <CardFooter className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    {item.category === 'TIMING' ? (
                      <Link href="/calendar">
                        <Button size="sm" variant="outline" className="text-xs h-8 gap-1 text-brand-purple dark:text-brand-cyan">
                          <span>Open Calendar</span>
                          <ChevronRight className="w-3 h-3" />
                        </Button>
                      </Link>
                    ) : (
                      <Link href="/content/studio">
                        <Button size="sm" variant="outline" className="text-xs h-8 gap-1 text-brand-purple dark:text-brand-cyan">
                          <span>Open Studio</span>
                          <ChevronRight className="w-3 h-3" />
                        </Button>
                      </Link>
                    )}
                  </div>

                  {canManage && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDismiss(item.id)}
                      disabled={dismissingId === item.id}
                      className="text-xs h-8 text-slate-400 hover:text-rose-600"
                    >
                      <span>Dismiss</span>
                    </Button>
                  )}
                </CardFooter>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
