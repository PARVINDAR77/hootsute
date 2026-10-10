'use client';

import React from 'react';
import { Award, ExternalLink, Sparkles, TrendingUp } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { formatMetricNumber } from './AnalyticsKPICard';

export interface TopPerformingItem {
  id: string;
  externalPostId: string;
  platform: 'FACEBOOK' | 'INSTAGRAM';
  postType: string;
  publishedAt: string | null;
  metricName: string;
  metricValue: number;
  isScheduledViaOmniSocial: boolean;
  externalPostUrl: string | null;
  previewText: string | null;
  socialAccount?: {
    id: string;
    accountName: string;
    accountUsername: string | null;
    provider: string;
    profileImageUrl: string | null;
  };
}

interface TopPerformingWidgetProps {
  items: TopPerformingItem[];
  selectedMetric: string;
  onMetricChange: (metric: string) => void;
  isLoading?: boolean;
}

export function TopPerformingWidget({
  items = [],
  selectedMetric,
  onMetricChange,
  isLoading = false,
}: TopPerformingWidgetProps) {
  const metricOptions = [
    { key: 'engagementRate', label: 'Eng. Rate' },
    { key: 'reach', label: 'Reach' },
    { key: 'impressions', label: 'Impressions' },
    { key: 'likesCount', label: 'Likes' },
  ];

  const getMetricDisplay = (val: number, metric: string) => {
    if (metric === 'engagementRate') {
      return `${(val * 100).toFixed(1)}%`;
    }
    return formatMetricNumber(val);
  };

  return (
    <Card className="border border-slate-200/80 shadow-xs bg-white">
      <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 gap-2 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
            <Award className="w-4 h-4" />
          </div>
          <div>
            <CardTitle className="text-base font-bold text-slate-900">
              Top-Performing Content
            </CardTitle>
            <p className="text-xs text-slate-500">
              Ranked strictly by verified snapshot performance in the period.
            </p>
          </div>
        </div>

        {/* Metric Selector Pills */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
          {metricOptions.map((opt) => (
            <button
              key={opt.key}
              onClick={() => onMetricChange(opt.key)}
              className={`px-2.5 py-1 rounded text-xs font-semibold transition-all ${
                selectedMetric === opt.key
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </CardHeader>

      <CardContent className="p-4">
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, idx) => (
              <div
                key={idx}
                className="h-16 bg-slate-100 rounded-lg animate-pulse"
              />
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="py-8 text-center text-slate-400">
            <p className="text-xs font-medium">
              No content meets the threshold for ranking by {selectedMetric}.
            </p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {items.map((item, idx) => {
              const rank = idx + 1;
              const dateStr = item.publishedAt
                ? new Date(item.publishedAt).toLocaleDateString(undefined, {
                    month: 'short',
                    day: 'numeric',
                  })
                : null;

              return (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-3 rounded-lg border border-slate-100 hover:border-slate-200 bg-slate-50/50 hover:bg-white transition-all group"
                >
                  <div className="flex items-center gap-3 min-w-0 pr-3">
                    {/* Rank Indicator */}
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                        rank === 1
                          ? 'bg-amber-100 text-amber-700 border border-amber-300'
                          : rank === 2
                            ? 'bg-slate-200 text-slate-700 border border-slate-300'
                            : rank === 3
                              ? 'bg-orange-100 text-orange-700 border border-orange-300'
                              : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      {rank}
                    </div>

                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-slate-800 truncate">
                        {item.previewText || `Post #${item.externalPostId.slice(-8)}`}
                      </p>
                      <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-0.5">
                        <span
                          className={`font-semibold ${
                            item.platform === 'FACEBOOK' ? 'text-blue-600' : 'text-pink-600'
                          }`}
                        >
                          {item.platform === 'FACEBOOK' ? 'Facebook' : 'Instagram'}
                        </span>
                        {dateStr && <span>• {dateStr}</span>}
                        {item.isScheduledViaOmniSocial && (
                          <span className="text-emerald-600 flex items-center gap-0.5 font-medium">
                            <Sparkles className="w-2.5 h-2.5" /> OmniSocial
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Metric Value & Link */}
                  <div className="flex items-center gap-3 shrink-0">
                    <div className="text-right">
                      <div className="text-xs font-bold text-slate-900 font-mono">
                        {getMetricDisplay(item.metricValue, selectedMetric)}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {selectedMetric === 'engagementRate' ? 'Rate' : 'Total'}
                      </div>
                    </div>

                    {item.externalPostUrl && (
                      <a
                        href={item.externalPostUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-slate-400 hover:text-indigo-600 p-1"
                        title="View post on platform"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
