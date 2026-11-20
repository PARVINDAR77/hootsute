'use client';

import React from 'react';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  HelpCircle,
  AlertCircle,
  LucideIcon,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';

export interface KPICardProps {
  title: string;
  metricKey: string;
  value: number | null | undefined;
  previousValue?: number | null | undefined;
  percentageChange?: number | null | undefined;
  changeDirection?: 'up' | 'down' | 'neutral' | null;
  status?: 'AVAILABLE' | 'NO_BASELINE' | 'UNAVAILABLE';
  isPercentage?: boolean;
  icon: LucideIcon;
  tooltip: string;
  platformBreakdown?: {
    facebook?: number | null;
    instagram?: number | null;
  };
  isLoading?: boolean;
}

export function formatMetricNumber(
  val: number | null | undefined,
  isPercentage = false,
): string {
  if (val === null || val === undefined) return 'N/A';
  if (isPercentage) {
    return `${(val * 100).toFixed(1)}%`;
  }
  if (val >= 1_000_000) {
    return `${(val / 1_000_000).toFixed(1)}M`;
  }
  if (val >= 1_000) {
    return `${(val / 1_000).toFixed(1)}K`;
  }
  return val.toLocaleString();
}

export function AnalyticsKPICard({
  title,
  value,
  previousValue,
  percentageChange,
  changeDirection,
  status = 'AVAILABLE',
  isPercentage = false,
  icon: Icon,
  tooltip,
  platformBreakdown,
  isLoading = false,
}: KPICardProps) {
  if (isLoading) {
    return (
      <Card className="p-5 border border-slate-200/80 dark:border-slate-800 animate-pulse bg-white dark:bg-slate-900">
        <div className="flex items-center justify-between">
          <div className="h-4 w-24 bg-slate-200 dark:bg-slate-800 rounded" />
          <div className="h-8 w-8 bg-slate-200 dark:bg-slate-800 rounded-lg" />
        </div>
        <div className="mt-4 h-7 w-28 bg-slate-200 dark:bg-slate-800 rounded" />
        <div className="mt-2 h-4 w-36 bg-slate-100 dark:bg-slate-800 rounded" />
      </Card>
    );
  }

  const isAvailable = status !== 'UNAVAILABLE' && value !== null && value !== undefined;

  return (
    <Card className="p-5 border border-slate-200/80 dark:border-slate-800 hover:border-brand-purple/40 dark:hover:border-brand-cyan/40 transition-all shadow-xs bg-white dark:bg-slate-900 flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              {title}
            </span>
            <div className="group relative cursor-pointer" title={tooltip}>
              <HelpCircle className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-colors" />
            </div>
          </div>
          <div className="w-8 h-8 rounded-xl bg-brand-purple/10 dark:bg-brand-purple/20 text-brand-purple dark:text-brand-cyan flex items-center justify-center shrink-0">
            <Icon className="w-4 h-4" />
          </div>
        </div>

        {/* Primary Metric Value */}
        <div className="mt-3 flex items-baseline gap-2">
          {isAvailable ? (
            <span className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              {formatMetricNumber(value, isPercentage)}
            </span>
          ) : (
            <div className="flex items-center gap-1 text-slate-400 dark:text-slate-500 text-sm font-medium">
              <AlertCircle className="w-4 h-4 text-amber-500" />
              <span>Not available</span>
            </div>
          )}
        </div>

        {/* Previous Period Delta / Status */}
        <div className="mt-2 flex items-center gap-2 text-xs">
          {status === 'AVAILABLE' && percentageChange !== null && percentageChange !== undefined ? (
            <div
              className={`inline-flex items-center gap-1 font-semibold px-1.5 py-0.5 rounded text-[11px] ${
                changeDirection === 'up'
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400'
                  : changeDirection === 'down'
                    ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
              }`}
            >
              {changeDirection === 'up' && <TrendingUp className="w-3 h-3" />}
              {changeDirection === 'down' && <TrendingDown className="w-3 h-3" />}
              {changeDirection === 'neutral' && <Minus className="w-3 h-3" />}
              <span>
                {percentageChange > 0 ? `+${percentageChange}%` : `${percentageChange}%`}
              </span>
            </div>
          ) : status === 'NO_BASELINE' ? (
            <span className="text-slate-400 dark:text-slate-500 text-[11px] italic">
              No prior baseline data
            </span>
          ) : (
            <span className="text-amber-600 dark:text-amber-400 text-[11px] flex items-center gap-1">
              Connect permissions to unlock
            </span>
          )}

          {previousValue !== null && previousValue !== undefined && status === 'AVAILABLE' && (
            <span className="text-slate-400 dark:text-slate-500 text-[11px]">
              vs {formatMetricNumber(previousValue, isPercentage)} prior
            </span>
          )}
        </div>
      </div>

      {/* Platform Breakdown (if provided) */}
      {platformBreakdown && (platformBreakdown.facebook != null || platformBreakdown.instagram != null) && (
        <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-blue-600 inline-block" />
            <span>FB: {formatMetricNumber(platformBreakdown.facebook, isPercentage)}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-pink-500 inline-block" />
            <span>IG: {formatMetricNumber(platformBreakdown.instagram, isPercentage)}</span>
          </div>
        </div>
      )}
    </Card>
  );
}
