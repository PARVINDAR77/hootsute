import React from 'react';

export interface ChartCardProps {
  title: string;
  subtitle?: string;
  headerRight?: React.ReactNode;
  isLoading?: boolean;
  isEmpty?: boolean;
  emptyMessage?: string;
  children: React.ReactNode;
  className?: string;
}

export function ChartCard({
  title,
  subtitle,
  headerRight,
  isLoading = false,
  isEmpty = false,
  emptyMessage = 'No telemetry recorded for this period yet.',
  children,
  className = '',
}: ChartCardProps) {
  return (
    <div
      className={`rounded-2xl bg-white dark:bg-[#0F142B]/90 border border-[#E7EAF2] dark:border-[#7138F5]/25 shadow-soft dark:shadow-none overflow-hidden ${className}`}
    >
      <div className="px-5 sm:px-6 py-4 sm:py-5 border-b border-[#E7EAF2]/80 dark:border-white/10 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-bold text-[#111827] dark:text-white tracking-tight">
            {title}
          </h3>
          {subtitle && (
            <p className="text-xs text-[#64748B] dark:text-slate-400 mt-0.5">{subtitle}</p>
          )}
        </div>
        {headerRight && <div className="flex items-center gap-2">{headerRight}</div>}
      </div>

      <div className="p-5 sm:p-6">
        {isLoading ? (
          <div className="h-64 rounded-xl skeleton-shimmer" />
        ) : isEmpty ? (
          <div className="h-56 flex items-center justify-center rounded-xl border border-dashed border-[#E7EAF2] dark:border-white/10 bg-[#F7F8FC]/60 dark:bg-white/[0.02] px-6 text-center">
            <p className="text-sm text-[#64748B] dark:text-slate-400">{emptyMessage}</p>
          </div>
        ) : (
          children
        )}
      </div>
    </div>
  );
}
