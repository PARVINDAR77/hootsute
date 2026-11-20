import React from 'react';
import { PlatformBadge, PLATFORM_METADATA, normalizePlatformKey } from './PlatformBadge';
import { CheckCircle2, AlertCircle, Plus } from 'lucide-react';

export interface AccountCardProps {
  platform: string;
  accountCount?: number;
  status?: 'CONNECTED' | 'EXPIRED' | 'DISCONNECTED' | 'NONE';
  subtitle?: string;
  onAction?: () => void;
  actionLabel?: string;
  compact?: boolean;
  className?: string;
}

export function AccountCard({
  platform,
  accountCount = 0,
  status = accountCount > 0 ? 'CONNECTED' : 'NONE',
  subtitle,
  onAction,
  actionLabel,
  compact = false,
  className = '',
}: AccountCardProps) {
  const key = normalizePlatformKey(platform);
  const meta = PLATFORM_METADATA[key];
  const isConnected = status === 'CONNECTED' && accountCount > 0;
  const isExpired = status === 'EXPIRED';

  if (compact) {
    return (
      <div
        onClick={onAction}
        className={`flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-xl bg-[#F7F8FC] dark:bg-white/[0.03] border border-[#E7EAF2] dark:border-white/10 hover:border-[#7138F5]/40 transition-all ${
          onAction ? 'cursor-pointer' : ''
        } ${className}`}
      >
        <div className="flex items-center gap-3 min-w-0">
          <PlatformBadge platform={key} variant="icon" size="sm" />
          <div className="min-w-0">
            <p className="text-xs font-semibold text-[#111827] dark:text-white truncate">
              {meta.label}
            </p>
            {subtitle && (
              <p className="text-[11px] text-[#64748B] dark:text-slate-400 truncate">
                {subtitle}
              </p>
            )}
          </div>
        </div>
        <span className="text-xs font-semibold text-[#64748B] dark:text-slate-300 shrink-0">
          {accountCount === 1 ? '1 account' : `${accountCount} accounts`}
        </span>
      </div>
    );
  }

  return (
    <div
      className={`group relative rounded-2xl p-5 bg-white dark:bg-[#0F142B]/90 border transition-all duration-200 flex flex-col items-center text-center ${
        isConnected
          ? 'border-[#E7EAF2] dark:border-[#7138F5]/30 hover:border-[#7138F5]/50 shadow-soft dark:shadow-glow-card'
          : 'border-[#E7EAF2] dark:border-white/10 hover:border-[#7138F5]/35'
      } ${className}`}
    >
      <PlatformBadge platform={key} variant="icon" size="lg" className="mb-3.5 group-hover:scale-105 transition-transform" />

      <h4 className="text-sm font-bold text-[#111827] dark:text-white">{meta.label}</h4>
      <p className="text-xs text-[#64748B] dark:text-slate-400 mt-0.5">
        {subtitle || (accountCount === 1 ? '1 account' : `${accountCount} accounts`)}
      </p>

      <div className="mt-3">
        {isConnected ? (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Connected
          </span>
        ) : isExpired ? (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-600 dark:text-amber-400">
            <AlertCircle className="w-3.5 h-3.5" />
            Reconnect Required
          </span>
        ) : (
          <span className="text-[11px] font-medium text-[#64748B] dark:text-slate-500">
            Not connected
          </span>
        )}
      </div>

      {onAction && (
        <button
          type="button"
          onClick={onAction}
          className="mt-4 w-full inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border border-[#E7EAF2] dark:border-white/15 bg-[#F7F8FC] dark:bg-white/5 hover:bg-[#F1EBFF] dark:hover:bg-[#7138F5]/20 hover:text-[#7138F5] dark:hover:text-white hover:border-[#7138F5]/30 text-[#111827] dark:text-slate-200 transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>{actionLabel || (isConnected ? 'Add Account' : 'Connect')}</span>
        </button>
      )}
    </div>
  );
}
