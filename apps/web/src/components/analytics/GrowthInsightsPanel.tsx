'use client';

import React, { useState } from 'react';
import {
  Sparkles,
  Lightbulb,
  Clock,
  TrendingUp,
  X,
  Target,
  Zap,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Layers,
  Calendar,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';

export interface GrowthInsightItem {
  id: string;
  category: 'TIMING' | 'CONTENT_FORMAT' | 'ENGAGEMENT' | 'TOPIC_AUDIENCE' | 'CONSISTENCY';
  title: string;
  summary: string;
  suggestedAction: string;
  confidenceScore: number;
  evidence: Record<string, any>;
  createdAt: string;
}

interface GrowthInsightsPanelProps {
  insights: GrowthInsightItem[];
  userRole?: string;
  onDismiss: (insightId: string) => Promise<void>;
  onGenerate?: (force?: boolean) => Promise<{
    success: boolean;
    message?: string;
    count?: number;
    throttled?: boolean;
  }>;
  isLoading?: boolean;
}

export function GrowthInsightsPanel({
  insights = [],
  userRole = 'VIEWER',
  onDismiss,
  onGenerate,
  isLoading = false,
}: GrowthInsightsPanelProps) {
  const [dismissingId, setDismissingId] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<{
    type: 'success' | 'warning' | 'error';
    message: string;
  } | null>(null);

  const canManage = userRole === 'OWNER' || userRole === 'ADMIN' || userRole === 'EDITOR';

  const handleDismiss = async (id: string) => {
    if (!canManage || dismissingId) return;
    setDismissingId(id);
    try {
      await onDismiss(id);
    } finally {
      setDismissingId(null);
    }
  };

  const handleRunAnalysis = async (force = false) => {
    if (!canManage || isGenerating || !onGenerate) return;
    setIsGenerating(true);
    setFeedback(null);
    try {
      const result = await onGenerate(force);
      if (result.throttled) {
        setFeedback({
          type: 'warning',
          message: result.message || 'Generation throttled. Please wait before running analysis again.',
        });
      } else if (result.success) {
        setFeedback({
          type: 'success',
          message: result.message || `Analysis complete. Generated ${result.count ?? 0} insights.`,
        });
      } else {
        setFeedback({
          type: 'error',
          message: result.message || 'Analysis could not be completed.',
        });
      }
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: err?.message || 'Failed to trigger growth analysis.',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const getCategoryBadgeVariant = (category: string) => {
    switch (category) {
      case 'TIMING':
        return 'purple';
      case 'CONTENT_FORMAT':
        return 'success';
      case 'ENGAGEMENT':
        return 'warning';
      case 'TOPIC_AUDIENCE':
        return 'default';
      case 'CONSISTENCY':
        return 'outline';
      default:
        return 'default';
    }
  };

  const renderEvidenceDetails = (evidence: Record<string, any>, category: string) => {
    if (!evidence || Object.keys(evidence).length === 0) return null;

    return (
      <div className="mt-2.5 pt-2 border-t border-slate-100 flex flex-wrap gap-2 text-[11px] text-slate-600">
        {evidence.period && (
          <span className="inline-flex items-center gap-1 bg-slate-100/80 px-2 py-0.5 rounded text-slate-700">
            <Calendar className="w-3 h-3 text-slate-400" />
            Window: {evidence.period}
          </span>
        )}

        {evidence.recentRate !== undefined && (
          <span className="bg-slate-100/80 px-2 py-0.5 rounded">
            Recent Rate: <strong>{(evidence.recentRate * 100).toFixed(1)}%</strong>
          </span>
        )}

        {evidence.priorRate !== undefined && (
          <span className="bg-slate-100/80 px-2 py-0.5 rounded">
            Prior Rate: <strong>{(evidence.priorRate * 100).toFixed(1)}%</strong>
          </span>
        )}

        {evidence.percentageChange !== undefined && (
          <span
            className={`px-2 py-0.5 rounded font-semibold ${
              evidence.percentageChange >= 0
                ? 'bg-emerald-50 text-emerald-700'
                : 'bg-rose-50 text-rose-700'
            }`}
          >
            Change: {evidence.percentageChange > 0 ? '+' : ''}
            {evidence.percentageChange}%
          </span>
        )}

        {evidence.topFormat && (
          <span className="bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded">
            Format: <strong>{evidence.topFormat}</strong> (
            {evidence.topRate ? `${(evidence.topRate * 100).toFixed(1)}%` : 'lead'})
          </span>
        )}

        {evidence.optimalBucket && (
          <span className="bg-purple-50 text-purple-800 px-2 py-0.5 rounded">
            Optimal: <strong>{evidence.optimalBucket}</strong>
          </span>
        )}

        {evidence.topHashtag && (
          <span className="bg-indigo-50 text-indigo-800 px-2 py-0.5 rounded">
            Topic: <strong>{evidence.topHashtag}</strong> ({evidence.taggedPostCount} posts)
          </span>
        )}

        {evidence.gapDays !== undefined && (
          <span className="bg-amber-50 text-amber-800 px-2 py-0.5 rounded">
            Publishing Gap: <strong>{evidence.gapDays} days</strong>
          </span>
        )}

        {evidence.weeklyPostCount !== undefined && (
          <span className="bg-teal-50 text-teal-800 px-2 py-0.5 rounded">
            Cadence: <strong>{evidence.weeklyPostCount} posts/wk</strong>
          </span>
        )}
      </div>
    );
  };

  return (
    <Card className="border border-slate-200/80 shadow-xs bg-white">
      <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <Lightbulb className="w-4 h-4" />
          </div>
          <div>
            <CardTitle className="text-base font-bold text-slate-900">
              Evidence-Backed Growth Insights
            </CardTitle>
            <p className="text-xs text-slate-500">
              Actionable recommendations calibrated against your actual performance history.
            </p>
          </div>
        </div>

        {canManage && onGenerate && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleRunAnalysis(false)}
            disabled={isGenerating || isLoading}
            className="text-xs gap-1.5 h-8 border-indigo-200 text-indigo-700 hover:bg-indigo-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isGenerating ? 'animate-spin' : ''}`} />
            {isGenerating ? 'Analyzing...' : 'Analyze & Refresh'}
          </Button>
        )}
      </CardHeader>

      <CardContent className="p-4">
        {feedback && (
          <div
            className={`mb-4 p-3 rounded-lg text-xs flex items-center justify-between gap-2 border ${
              feedback.type === 'success'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                : feedback.type === 'warning'
                ? 'bg-amber-50 border-amber-200 text-amber-800'
                : 'bg-rose-50 border-rose-200 text-rose-800'
            }`}
          >
            <div className="flex items-center gap-2">
              {feedback.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />}
              {feedback.type === 'warning' && <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />}
              {feedback.type === 'error' && <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />}
              <span>{feedback.message}</span>
            </div>
            <button
              onClick={() => setFeedback(null)}
              className="text-slate-400 hover:text-slate-600 text-xs font-semibold"
            >
              &times;
            </button>
          </div>
        )}

        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 2 }).map((_, idx) => (
              <div key={idx} className="h-24 bg-slate-100 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : insights.length === 0 ? (
          <div className="py-8 text-center text-slate-400">
            <Sparkles className="w-8 h-8 mx-auto text-slate-300 mb-2" />
            <p className="text-sm font-semibold text-slate-700">No Active Growth Insights</p>
            <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
              As your scheduled content publishes and daily performance snapshots accumulate,
              the AI engine will generate evidence-backed optimization recommendations here.
            </p>
            {canManage && onGenerate && (
              <div className="mt-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleRunAnalysis(false)}
                  disabled={isGenerating}
                  className="text-xs gap-1.5 border-indigo-200 text-indigo-700 hover:bg-indigo-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isGenerating ? 'animate-spin' : ''}`} />
                  {isGenerating ? 'Evaluating Snapshots...' : 'Run Growth Analysis Now'}
                </Button>
              </div>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {insights.map((insight) => (
              <div
                key={insight.id}
                className="p-4 rounded-xl border border-slate-200/80 bg-slate-50/40 hover:bg-white hover:border-slate-300 transition-all flex flex-col justify-between shadow-xs relative group"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <Badge variant={getCategoryBadgeVariant(insight.category)}>
                      {insight.category.replace('_', ' ')}
                    </Badge>

                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100">
                        {Math.round(insight.confidenceScore * 100)}% Confidence
                      </span>

                      {canManage && (
                        <button
                          onClick={() => handleDismiss(insight.id)}
                          disabled={dismissingId === insight.id}
                          className="text-slate-400 hover:text-slate-600 p-1 rounded-md hover:bg-slate-100 transition-colors"
                          title="Dismiss this recommendation"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  <h4 className="text-sm font-bold text-slate-900 mb-1">
                    {insight.title}
                  </h4>
                  <p className="text-xs text-slate-600 mb-2 leading-relaxed">
                    {insight.summary}
                  </p>

                  {/* Grounded Evidence Details */}
                  {renderEvidenceDetails(insight.evidence, insight.category)}
                </div>

                <div className="pt-2.5 mt-3 border-t border-slate-100">
                  <div className="p-2.5 bg-indigo-50/80 border border-indigo-100 rounded-lg flex items-start gap-2 text-xs text-indigo-900">
                    <Zap className="w-3.5 h-3.5 text-indigo-600 shrink-0 mt-0.5" />
                    <div>
                      <strong className="font-semibold">Recommended Action: </strong>
                      <span>{insight.suggestedAction}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

