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
  assignedToMe: number;
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
    { label: 'Assigned to Me', value: 'ASSIGNED_TO_ME', icon: UserCheck, count: counts.assignedToMe },
    { label: 'In Progress', value: 'IN_PROGRESS', icon: AlertCircle },
    { label: 'Resolved', value: 'RESOLVED', icon: CheckCircle2 },
    { label: 'All Interactions', value: 'ALL', icon: Inbox },
  ];

  return (
    <div className="w-full lg:w-64 bg-slate-50/60 border-r border-slate-200/80 p-4 space-y-6 shrink-0">
      {/* Workflow Views */}
      <div className="space-y-1">
        <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-2 mb-2 flex items-center gap-1.5">
          <Filter className="w-3 h-3 text-slate-400" />
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
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span>{tab.label}</span>
              </div>
              {tab.count !== undefined && tab.count > 0 && (
                <span
                  className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full ${
                    isActive ? 'bg-indigo-700 text-white' : 'bg-slate-200 text-slate-700'
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
        <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-2 mb-2 flex items-center gap-1.5">
          <Eye className="w-3 h-3 text-slate-400" />
          Read State
        </h4>
        <div className="grid grid-cols-2 gap-1 bg-slate-200/60 p-1 rounded-lg text-xs">
          <button
            onClick={() => onReadFilterChange(null)}
            className={`py-1 rounded text-center font-medium transition-all ${
              isReadFilter === null
                ? 'bg-white text-slate-800 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            All
          </button>
          <button
            onClick={() => onReadFilterChange(false)}
            className={`py-1 rounded text-center font-medium transition-all flex items-center justify-center gap-1 ${
              isReadFilter === false
                ? 'bg-white text-indigo-700 font-bold shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span>Unread</span>
            {counts.unread > 0 && (
              <span className="w-2 h-2 rounded-full bg-indigo-600 inline-block" />
            )}
          </button>
        </div>
      </div>

      {/* Platform Filter */}
      <div className="space-y-1">
        <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-2 mb-2 flex items-center gap-1.5">
          <Share2 className="w-3 h-3 text-slate-400" />
          Platform
        </h4>
        <div className="space-y-1">
          {[
            { label: 'All Channels', value: '' },
            { label: 'Facebook Pages', value: 'FACEBOOK' },
            { label: 'Instagram Professional', value: 'INSTAGRAM' },
          ].map((item) => (
            <button
              key={item.value}
              onClick={() => onPlatformChange(item.value)}
              className={`w-full text-left px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                currentPlatform === item.value
                  ? 'bg-slate-200 text-slate-900 font-bold'
                  : 'text-slate-600 hover:bg-slate-100'
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
          <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-2 mb-2">
            Social Account
          </h4>
          <select
            value={currentAccountId}
            onChange={(e) => onAccountChange(e.target.value)}
            className="w-full text-xs rounded-lg border border-slate-300 bg-white p-2 text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            <option value="">All Accounts ({accounts.length})</option>
            {accounts.map((acc) => (
              <option key={acc.id} value={acc.id}>
                {acc.accountName} ({acc.provider === 'META_FACEBOOK' ? 'FB' : 'IG'})
              </option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
}
