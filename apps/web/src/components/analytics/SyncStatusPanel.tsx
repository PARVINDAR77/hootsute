'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  RefreshCw,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ShieldAlert,
  Loader2,
  Info,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { ROUTES } from '@/lib/constants';

export interface SyncStatusData {
  lastSuccessfulSyncAt: string | null;
  lastAttemptedSyncAt: string | null;
  lastJobStatus: string | null;
  hasActivePermissionErrors: boolean;
}

interface SyncStatusPanelProps {
  syncStatus: SyncStatusData | null;
  userRole?: string;
  onRefresh: (force?: boolean) => Promise<{ success: boolean; message?: string; throttled?: boolean }>;
  isLoading?: boolean;
}

export function SyncStatusPanel({
  syncStatus,
  userRole = 'VIEWER',
  onRefresh,
  isLoading = false,
}: SyncStatusPanelProps) {
  const [isSyncing, setIsSyncing] = useState(false);
  const [throttleMessage, setThrottleMessage] = useState<string | null>(null);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

  const canTriggerSync = userRole === 'OWNER' || userRole === 'ADMIN' || userRole === 'EDITOR';

  const handleSyncClick = async () => {
    if (!canTriggerSync || isSyncing) return;
    setIsSyncing(true);
    setThrottleMessage(null);
    setFeedbackMessage(null);

    try {
      const res = await onRefresh(false);
      if (res.throttled) {
        setThrottleMessage(res.message || 'Synchronization is currently throttled.');
      } else {
        setFeedbackMessage('Sync completed successfully!');
        setTimeout(() => setFeedbackMessage(null), 4000);
      }
    } catch (err: any) {
      setThrottleMessage(err?.message || 'Sync failed. Please try again later.');
    } finally {
      setIsSyncing(false);
    }
  };

  const formatTimestamp = (dateStr: string | null) => {
    if (!dateStr) return 'Never';
    const date = new Date(dateStr);
    return date.toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="space-y-3">
      {/* Permission Warning Alert */}
      {syncStatus?.hasActivePermissionErrors && (
        <div className="p-3.5 bg-amber-50 border border-amber-200/90 rounded-xl flex items-start gap-3 text-amber-900 shadow-xs">
          <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="flex-1 text-xs">
            <span className="font-bold">Missing Analytics Permissions Detected: </span>
            <span>
              Meta Graph API reported permission limitations for one or more accounts.
              Metrics like reach or impressions may be unavailable.
            </span>{' '}
            <Link
              href={ROUTES.SETTINGS_SOCIAL_ACCOUNTS}
              className="font-semibold underline text-amber-950 hover:text-indigo-600"
            >
              Reconnect accounts in Settings &rarr;
            </Link>
          </div>
        </div>
      )}

      {/* Throttled Notice */}
      {throttleMessage && (
        <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-xl flex items-center justify-between text-indigo-900 text-xs shadow-xs animate-in fade-in duration-200">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-indigo-600 shrink-0" />
            <span>{throttleMessage}</span>
          </div>
          <button
            onClick={() => setThrottleMessage(null)}
            className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 ml-3"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Success Notice */}
      {feedbackMessage && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-emerald-900 text-xs shadow-xs animate-in fade-in duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{feedbackMessage}</span>
        </div>
      )}

      {/* Main Status Bar */}
      <div className="bg-white border border-slate-200/80 rounded-xl p-3.5 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-xs">
        <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600">
          {/* Last Successful Sync */}
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>
              Last Sync:{' '}
              <strong className="text-slate-800 font-semibold">
                {formatTimestamp(syncStatus?.lastSuccessfulSyncAt || null)}
              </strong>
            </span>
          </div>

          {/* Last Job Status */}
          {syncStatus?.lastJobStatus && (
            <div className="flex items-center gap-1.5">
              <span className="text-slate-400">•</span>
              <span className="text-slate-500">Status:</span>
              <Badge
                variant={
                  syncStatus.lastJobStatus === 'COMPLETED'
                    ? 'success'
                    : syncStatus.lastJobStatus === 'FAILED'
                      ? 'danger'
                      : 'default'
                }
              >
                {syncStatus.lastJobStatus}
              </Badge>
            </div>
          )}

          {/* Throttle Policy Hint */}
          <div className="flex items-center gap-1 text-[11px] text-slate-400">
            <Info className="w-3.5 h-3.5 text-slate-400" />
            <span>15-min throttle active to preserve API limits</span>
          </div>
        </div>

        {/* Sync Now Action */}
        <div className="flex items-center gap-2 self-start md:self-auto">
          <Button
            size="sm"
            onClick={handleSyncClick}
            disabled={!canTriggerSync || isSyncing || isLoading}
            title={
              !canTriggerSync
                ? 'Only Editors, Admins, and Owners can trigger synchronization'
                : 'Request an immediate background synchronization'
            }
            className="flex items-center gap-1.5 text-xs font-semibold"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-white' : ''}`}
            />
            <span>{isSyncing ? 'Synchronizing...' : 'Sync Now'}</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
