'use client';

import React from 'react';
import {
  Inbox,
  Clock,
  CheckCircle2,
  UserCheck,
  AlertCircle,
  Eye,
  Filter,
  Share2,
} from 'lucide-react';
import { Badge } from '@/components/ui/Badge';

export interface InboxCounts {
  unread: number;
  open: number;
  assignedToMe?: number;
  assigned?: number;
  inProgress?: number;
  resolved?: number;
  all?: number;
}

interface InboxSidebarFiltersProps {
  currentStatus: string;
  onStatusChange: (status: string) => void;
  currentPlatform: string;
  onPlatformChange: (platform: string) => void;
  currentAccountId: string;
  onAccountChange: (accountId: string) => void;
  assignedToMe: boolean;
  onAssignedToMeToggle: (val: boolean) => void;
  isReadFilter: boolean | null;
  onReadFilterChange: (val: boolean | null) => void;
  accounts: Array<{ id: string; accountName: string; provider: string }>;
  counts: InboxCounts;
}

export function InboxSidebarFilters({
  currentStatus,
  onStatusChange,
  currentPlatform,
  onPlatformChange,
  currentAccountId,
  onAccountChange,
  assignedToMe,
  onAssignedToMeToggle,
  isReadFilter,
  onReadFilterChange,
  accounts = [],
  counts = { unread: 0, open: 0, assignedToMe: 0 },
}: InboxSidebarFiltersProps) {
  const statusFilters = [
    { label: 'All Open', value: 'OPEN', icon: Clock, count: counts.open },
    { label: 'Assigned to Me', value: 'ASSIGNED_TO_ME', icon: UserCheck, count: counts.assignedToMe ?? counts.assigned },
    { label: 'In Progress', value: 'IN_PROGRESS', icon: AlertCircle, count: counts.inProgress },
    { label: 'Resolved', value: 'RESOLVED', icon: CheckCircle2, count: counts.resolved },
    { label: 'All Interactions', value: 'ALL', icon: Inbox, count: counts.all },
  ];

  const platforms = [
    { label: 'All 8 Channels', value: '' },
    { label: 'Instagram', value: 'INSTAGRAM' },
    { label: 'Facebook', value: 'FACEBOOK' },
    { label: 'X (Twitter)', value: 'TWITTER' },
    { label: 'LinkedIn', value: 'LINKEDIN' },
    { label: 'Pinterest', value: 'PINTEREST' },
    { label: 'YouTube', value: 'YOUTUBE' },
    { label: 'TikTok', value: 'TIKTOK' },
    { label: 'Threads', value: 'THREADS' },
  ];

  return (
    <div className="w-full lg:w-64 bg-slate-50/70 dark:bg-slate-900/70 border-r border-slate-200/80 dark:border-slate-800 p-4 space-y-6 shrink-0 transition-colors">
      {/* Workflow Views */}
      <div className="space-y-1">
        <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 px-2 mb-2 flex items-center gap-1.5">
          <Filter className="w-3 h-3 text-slate-400 dark:text-slate-500" />
          Views &amp; Workflow
        </h4>

        {statusFilters.map((tab) => {
          const Icon = tab.icon;
          const isActive =
            tab.value === 'ASSIGNED_TO_ME'
              ? assignedToMe
              : !assignedToMe && (currentStatus === tab.value || (tab.value === 'ALL' && currentStatus === ''));

          return (
            <button
              key={tab.value}
              onClick={() => {
                if (tab.value === 'ASSIGNED_TO_ME') {
                  onAssignedToMeToggle(true);
                  onStatusChange('');
                } else {
                  onAssignedToMeToggle(false);
                  onStatusChange(tab.value === 'ALL' ? '' : tab.value);
                }
              }}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                isActive
                  ? 'bg-gradient-to-r from-brand-purple to-brand-blue text-white shadow-md shadow-brand-purple/20'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-slate-400 dark:text-slate-500'}`} />
                <span>{tab.label}</span>
              </div>
              {tab.count !== undefined && tab.count > 0 && (
                <span
                  className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                    isActive ? 'bg-white/20 text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Read Status Filter */}
      <div className="space-y-1">
        <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 px-2 mb-2 flex items-center gap-1.5">
          <Eye className="w-3 h-3 text-slate-400 dark:text-slate-500" />
          Read State
        </h4>
        <div className="grid grid-cols-2 gap-1 bg-slate-200/60 dark:bg-slate-800 p-1 rounded-xl text-xs">
          <button
            onClick={() => onReadFilterChange(null)}
            className={`py-1.5 rounded-lg text-center font-semibold transition-all ${
              isReadFilter === null
                ? 'bg-white dark:bg-slate-900 text-slate-800 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            All
          </button>
          <button
            onClick={() => onReadFilterChange(false)}
            className={`py-1.5 rounded-lg text-center font-semibold transition-all flex items-center justify-center gap-1.5 ${
              isReadFilter === false
                ? 'bg-white dark:bg-slate-900 text-brand-purple dark:text-brand-cyan font-bold shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <span>Unread</span>
            {counts.unread > 0 && (
              <span className="w-2 h-2 rounded-full bg-brand-purple dark:bg-brand-cyan inline-block animate-pulse" />
            )}
          </button>
        </div>
      </div>

      {/* Platform Filter */}
      <div className="space-y-1">
        <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 px-2 mb-2 flex items-center gap-1.5">
          <Share2 className="w-3 h-3 text-slate-400 dark:text-slate-500" />
          Platform Channels
        </h4>
        <div className="space-y-1 max-h-48 overflow-y-auto pr-1">
          {platforms.map((item) => (
            <button
              key={item.value}
              onClick={() => onPlatformChange(item.value)}
              className={`w-full text-left px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                currentPlatform === item.value
                  ? 'bg-slate-200 dark:bg-slate-800 text-slate-900 dark:text-white font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Account Filter */}
      {accounts.length > 0 && (
        <div className="space-y-1">
          <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 px-2 mb-2">
            Social Account
          </h4>
          <select
            value={currentAccountId}
            onChange={(e) => onAccountChange(e.target.value)}
            className="w-full text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-2 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-purple/20"
          >
            <option value="">All Accounts ({accounts.length})</option>
            {accounts.map((acc) => (
              <option key={acc.id} value={acc.id}>
                {acc.accountName} ({acc.provider})
              </option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
}
