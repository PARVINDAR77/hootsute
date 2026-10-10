'use client';

import React from 'react';
import { Search, X, MessageSquare, CornerDownRight, AtSign, Clock } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { SocialInteractionDto } from '@packages/shared';

interface InteractionListProps {
  interactions: SocialInteractionDto[];
  selectedId: string | null;
  onSelect: (interaction: SocialInteractionDto) => void;
  searchTerm: string;
  onSearchChange: (term: string) => void;
  isLoading: boolean;
}

export function InteractionList({
  interactions = [],
  selectedId,
  onSelect,
  searchTerm,
  onSearchChange,
  isLoading,
}: InteractionListProps) {
  const getPlatformBadge = (platform: string) => {
    if (platform === 'FACEBOOK') {
      return (
        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
          FB
        </span>
      );
    }
    return (
      <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-pink-50 text-pink-700 border border-pink-200">
        IG
      </span>
    );
  };

  const getWorkflowBadge = (status: string) => {
    switch (status) {
      case 'OPEN':
        return <Badge variant="warning">Open</Badge>;
      case 'ASSIGNED':
        return <Badge variant="default">Assigned</Badge>;
      case 'IN_PROGRESS':
        return <Badge variant="purple">In Progress</Badge>;
      case 'RESOLVED':
        return <Badge variant="success">Resolved</Badge>;
      case 'IGNORED':
        return <Badge variant="outline">Ignored</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'REPLY':
        return <span title="Reply"><CornerDownRight className="w-3 h-3 text-slate-400" /></span>;
      case 'MENTION':
        return <span title="Mention"><AtSign className="w-3 h-3 text-indigo-500" /></span>;
      default:
        return <span title="Comment"><MessageSquare className="w-3 h-3 text-slate-400" /></span>;
    }
  };

  const formatTimeAgo = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      const diffMs = Date.now() - d.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      const diffHours = Math.floor(diffMins / 60);
      if (diffHours < 24) return `${diffHours}h ago`;
      const diffDays = Math.floor(diffHours / 24);
      return `${diffDays}d ago`;
    } catch {
      return '';
    }
  };

  return (
    <div className="w-full lg:w-96 border-r border-slate-200/80 bg-white flex flex-col shrink-0 min-h-[500px]">
      {/* Search Header */}
      <div className="p-3 border-b border-slate-200/80 bg-slate-50/50">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search message or author..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full text-xs pl-9 pr-8 py-2 rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-800 placeholder-slate-400"
          />
          {searchTerm && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* List Container */}
      <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
        {isLoading ? (
          <div className="p-4 space-y-3">
            {Array.from({ length: 4 }).map((_, idx) => (
              <div key={idx} className="h-16 bg-slate-100 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : interactions.length === 0 ? (
          <div className="py-16 text-center text-slate-400 px-6">
            <MessageSquare className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="text-xs font-semibold text-slate-700">No Interactions Found</p>
            <p className="text-[11px] text-slate-400 mt-1">
              No comments or mentions match the current view and search filters.
            </p>
          </div>
        ) : (
          interactions.map((interaction) => {
            const isSelected = interaction.id === selectedId;
            return (
              <div
                key={interaction.id}
                onClick={() => onSelect(interaction)}
                className={`p-3.5 cursor-pointer transition-all hover:bg-slate-50 flex items-start gap-3 relative ${
                  isSelected ? 'bg-indigo-50/60 border-l-4 border-l-indigo-600' : ''
                }`}
              >
                {/* Unread indicator */}
                {!interaction.isRead && (
                  <span className="w-2 h-2 rounded-full bg-indigo-600 shrink-0 mt-1.5" title="Unread" />
                )}

                {/* Avatar Initial */}
                <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-xs font-bold text-slate-700 shrink-0 uppercase">
                  {interaction.authorName.charAt(0) || 'U'}
                </div>

                {/* Main Summary */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <span className="text-xs font-bold text-slate-900 truncate">
                      {interaction.authorName}
                    </span>
                    <span className="text-[10px] text-slate-400 shrink-0">
                      {formatTimeAgo(interaction.publishedAt)}
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed mb-2">
                    {interaction.content}
                  </p>

                  <div className="flex items-center gap-1.5 flex-wrap">
                    {getPlatformBadge(interaction.platform)}
                    {getTypeIcon(interaction.interactionType)}
                    {getWorkflowBadge(interaction.workflowStatus)}

                    {interaction.assignedTo && (
                      <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded font-medium truncate max-w-[100px]">
                        @{interaction.assignedTo.name}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
