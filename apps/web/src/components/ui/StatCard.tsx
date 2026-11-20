import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

export interface StatCardProps {
  label: string;
  value: string | number;
  trend?: string;
  trendDirection?: 'up' | 'down' | 'neutral';
  helper?: string;
  icon?: React.ReactNode;
  accent?: 'purple' | 'blue' | 'cyan' | 'emerald';
  className?: string;
}

const ACCENT_MAP = {
  purple:
    'bg-[#F1EBFF] text-[#7138F5] dark:bg-[#7138F5]/20 dark:text-[#C4A5FF] border-[#7138F5]/20',
  blue:
    'bg-sky-50 text-[#2878FF] dark:bg-[#2878FF]/20 dark:text-[#7EB2FF] border-[#2878FF]/20',
  cyan:
    'bg-cyan-50 text-[#0891B2] dark:bg-[#20C8E8]/20 dark:text-[#20C8E8] border-[#20C8E8]/20',
  emerald:
    'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-300 border-emerald-500/20',
};

export function StatCard({
  label,
  value,
  trend,
  trendDirection = 'neutral',
  helper,
  icon,
  accent = 'purple',
  className = '',
}: StatCardProps) {
  return (
    <div
      className={`group relative rounded-2xl p-5 bg-white dark:bg-[#0F142B]/90 border border-[#E7EAF2] dark:border-[#7138F5]/25 shadow-soft dark:shadow-none hover:border-[#7138F5]/40 dark:hover:border-[#20C8E8]/45 transition-all duration-200 overflow-hidden ${className}`}
    >
      <div className="pointer-events-none absolute -top-10 -right-10 w-24 h-24 rounded-full bg-gradient-to-br from-[#7138F5]/10 to-[#20C8E8]/10 blur-2xl opacity-0 group-hover:opacity-100 transition-opacity" />

      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold text-[#64748B] dark:text-slate-400 tracking-wide">
            {label}
          </p>
          <p className="mt-2 text-2xl sm:text-3xl font-extrabold tracking-tight text-[#111827] dark:text-white">
            {value}
          </p>
        </div>
        {icon && (
          <div
            className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 ${ACCENT_MAP[accent]}`}
          >
            {icon}
          </div>
        )}
      </div>

      {(trend || helper) && (
        <div className="mt-3 flex items-center gap-2 text-xs">
          {trend && (
            <span
              className={`inline-flex items-center gap-1 font-semibold ${
                trendDirection === 'up'
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : trendDirection === 'down'
                    ? 'text-rose-600 dark:text-rose-400'
                    : 'text-[#64748B] dark:text-slate-400'
              }`}
            >
              {trendDirection === 'up' && <TrendingUp className="w-3.5 h-3.5" />}
              {trendDirection === 'down' && <TrendingDown className="w-3.5 h-3.5" />}
              {trendDirection === 'neutral' && <Minus className="w-3.5 h-3.5" />}
              {trend}
            </span>
          )}
          {helper && (
            <span className="text-[#64748B] dark:text-slate-400 truncate">{helper}</span>
          )}
        </div>
      )}
    </div>
  );
}
