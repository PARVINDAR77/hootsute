'use client';

import React, { useState } from 'react';
import { RefreshCw, X, CheckCircle2, AlertTriangle, ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export interface AccountSyncStatus {
  socialAccountId: string;
  accountName: string;
  accountUsername?: string | null;
  provider: string;
  accountType: string;
  connectionStatus: string;
  lastSyncedAt?: string | null;
  syncStatus: string;
  errorMessage?: string | null;
  permissionHealth: {
    canRead: boolean;
    canReply: boolean;
    missingScopes: string[];
    warningMessage?: string | null;
  };
}

interface SyncStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  syncStatuses: AccountSyncStatus[];
  onTriggerSync: (force?: boolean) => Promise<{ success: boolean; message?: string; throttled?: boolean }>;
  userRole?: string;
}

export function SyncStatusModal({
  isOpen,
  onClose,
  syncStatuses = [],
  onTriggerSync,
  userRole = 'VIEWER',
}: SyncStatusModalProps) {
  const [isSyncing, setIsSyncing] = useState(false);
  const [feedback, setFeedback] = useState<{ message: string; throttled?: boolean } | null>(null);

  if (!isOpen) return null;

  const canManage = userRole === 'OWNER' || userRole === 'ADMIN' || userRole === 'EDITOR';
  const canForce = userRole === 'OWNER' || userRole === 'ADMIN';

  const handleSync = async (force = false) => {
    if (!canManage || isSyncing) return;
    setIsSyncing(true);
    setFeedback(null);
    try {
      const res = await onTriggerSync(force);
      setFeedback({
        message: res.message || 'Synchronization initiated.',
        throttled: res.throttled,
      });
    } catch (err: any) {
      setFeedback({ message: err?.message || 'Failed to trigger synchronization.' });
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-2xs p-4">
      <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-2">
            <RefreshCw className="w-4 h-4 text-indigo-600" />
            <h3 className="text-sm font-bold text-slate-900">Inbox Synchronization &amp; Health</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4 max-h-[70vh] overflow-y-auto">
          {feedback && (
            <div
              className={`p-3 rounded-lg text-xs border ${
                feedback.throttled
                  ? 'bg-amber-50 border-amber-200 text-amber-800'
                  : 'bg-emerald-50 border-emerald-200 text-emerald-800'
              }`}
            >
              {feedback.message}
            </div>
          )}

          <div className="space-y-3">
            {syncStatuses.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-4">
                No connected social accounts found in this workspace.
              </p>
            ) : (
              syncStatuses.map((acc) => (
                <div
                  key={acc.socialAccountId}
                  className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/40 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-slate-800">{acc.accountName}</span>
                      <span className="text-[10px] text-slate-400 ml-1.5 font-mono">
                        ({acc.provider === 'META_FACEBOOK' ? 'Facebook Page' : 'Instagram'})
                      </span>
                    </div>

                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        acc.connectionStatus === 'CONNECTED'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-rose-50 text-rose-700 border border-rose-200'
                      }`}
                    >
                      {acc.connectionStatus}
                    </span>
                  </div>

                  <div className="text-[11px] text-slate-500 flex items-center justify-between">
                    <span>Last Synced:</span>
                    <span className="font-semibold text-slate-700">
                      {acc.lastSyncedAt
                        ? new Date(acc.lastSyncedAt).toLocaleString()
                        : 'Never synced'}
                    </span>
                  </div>

                  {acc.permissionHealth.warningMessage && (
                    <div className="p-2 rounded bg-amber-50 border border-amber-200/80 text-[11px] text-amber-800 flex items-start gap-1.5">
                      <ShieldAlert className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                      <span>{acc.permissionHealth.warningMessage}</span>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between">
          <span className="text-[10px] text-slate-400">
            Real-time webhooks ingest comments automatically. Manual sync runs on-demand.
          </span>

          {canManage && (
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleSync(false)}
                disabled={isSyncing}
                className="text-xs h-8 gap-1.5"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                {isSyncing ? 'Syncing...' : 'Sync Now'}
              </Button>

              {canForce && (
                <Button
                  size="sm"
                  onClick={() => handleSync(true)}
                  disabled={isSyncing}
                  className="text-xs h-8 bg-indigo-600 text-white hover:bg-indigo-700"
                >
                  Force Refresh
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
