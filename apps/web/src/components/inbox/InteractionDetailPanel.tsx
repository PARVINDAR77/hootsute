'use client';

import React, { useState } from 'react';
import {
  ExternalLink,
  User,
  Clock,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  UserPlus,
  MessageSquare,
  Lock,
  CornerDownRight,
  ShieldAlert,
} from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { SocialInteractionDto } from '@packages/shared';
import { ReplyComposer } from './ReplyComposer';
import { InternalNotesPanel } from './InternalNotesPanel';

interface WorkspaceMemberOption {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface InteractionDetailPanelProps {
  interaction: SocialInteractionDto | null;
  members: WorkspaceMemberOption[];
  userRole?: string;
  onStatusChange: (status: string) => Promise<void>;
  onAssignmentChange: (userId: string | null) => Promise<void>;
  onToggleRead: (isRead: boolean) => Promise<void>;
  onSendReply: (content: string, idempotencyKey: string) => Promise<{ success: boolean; message?: string }>;
  onAddNote: (content: string) => Promise<void>;
  isLoading?: boolean;
}

export function InteractionDetailPanel({
  interaction,
  members = [],
  userRole = 'VIEWER',
  onStatusChange,
  onAssignmentChange,
  onToggleRead,
  onSendReply,
  onAddNote,
  isLoading = false,
}: InteractionDetailPanelProps) {
  const [activeTab, setActiveTab] = useState<'reply' | 'notes'>('reply');
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [isUpdatingAssignment, setIsUpdatingAssignment] = useState(false);

  const canManage = userRole === 'OWNER' || userRole === 'ADMIN' || userRole === 'EDITOR';

  if (!interaction) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 bg-slate-50/40 dark:bg-slate-900/40 text-center min-h-[500px] transition-colors">
        <div className="w-14 h-14 rounded-2xl bg-brand-purple/10 border border-brand-purple/20 flex items-center justify-center text-brand-purple dark:text-brand-cyan mb-3 shadow-sm">
          <MessageSquare className="w-7 h-7" />
        </div>
        <h3 className="text-sm font-bold text-slate-800 dark:text-white">No Interaction Selected</h3>
        <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 max-w-sm">
          Select an incoming comment, reply, or mention from the list to view conversation context, assign to teammates, and reply.
        </p>
      </div>
    );
  }

  const handleStatusSelect = async (newStatus: string) => {
    if (!canManage || isUpdatingStatus) return;
    setIsUpdatingStatus(true);
    try {
      await onStatusChange(newStatus);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleAssigneeSelect = async (userId: string) => {
    if (!canManage || isUpdatingAssignment) return;
    setIsUpdatingAssignment(true);
    try {
      await onAssignmentChange(userId === 'unassigned' ? null : userId);
    } finally {
      setIsUpdatingAssignment(false);
    }
  };

  return (
    <div className="flex-1 bg-white dark:bg-slate-900 flex flex-col justify-between overflow-y-auto transition-colors">
      {/* Top Action Header */}
      <div className="p-4 border-b border-slate-200/80 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-900/60 flex flex-wrap items-center justify-between gap-3">
        {/* Author & Platform Info */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-brand-purple/15 text-brand-purple dark:text-brand-cyan flex items-center justify-center font-bold text-sm uppercase shrink-0">
            {interaction.authorName.charAt(0) || 'U'}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">{interaction.authorName}</h3>
              {interaction.authorUsername && (
                <span className="text-xs text-slate-400 dark:text-slate-500">@{interaction.authorUsername}</span>
              )}
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                {interaction.platform}
              </span>
            </div>
            <div className="flex items-center gap-2 text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
              <span>{new Date(interaction.publishedAt).toLocaleString()}</span>
              {interaction.externalPostUrl && (
                <a
                  href={interaction.externalPostUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-brand-purple dark:text-brand-cyan hover:underline flex items-center gap-0.5 font-medium"
                >
                  <span>View Post</span>
                  <ExternalLink className="w-2.5 h-2.5" />
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Read / Unread toggle */}
          <button
            onClick={() => onToggleRead(!interaction.isRead)}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
            title={interaction.isRead ? 'Mark as unread' : 'Mark as read'}
          >
            {interaction.isRead ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4 text-brand-purple dark:text-brand-cyan" />}
          </button>

          {/* Workflow Status Dropdown */}
          <select
            value={interaction.workflowStatus}
            onChange={(e) => handleStatusSelect(e.target.value)}
            disabled={!canManage || isUpdatingStatus}
            className="text-xs font-semibold rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-purple/20 shadow-xs"
          >
            <option value="OPEN">Open</option>
            <option value="ASSIGNED">Assigned</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="RESOLVED">Resolved</option>
            <option value="IGNORED">Ignored</option>
          </select>

          {/* Assignment Dropdown */}
          <select
            value={interaction.assignedToUserId || 'unassigned'}
            onChange={(e) => handleAssigneeSelect(e.target.value)}
            disabled={!canManage || isUpdatingAssignment}
            className="text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-purple/20 shadow-xs"
          >
            <option value="unassigned">Unassigned</option>
            {members.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name} ({m.role})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Conversation Thread View */}
      <div className="flex-1 p-6 space-y-6 overflow-y-auto">
        {/* Original Comment Bubble */}
        <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 border-b border-slate-200/60 dark:border-slate-700/60 pb-2">
            <span className="font-semibold text-slate-800 dark:text-slate-200">
              {interaction.interactionType === 'MENTION' ? 'Public Mention' : 'Public Comment'}
            </span>
            <span>{new Date(interaction.publishedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
          </div>
          <p className="text-sm text-slate-800 dark:text-slate-100 leading-relaxed whitespace-pre-wrap">
            {interaction.content}
          </p>
        </div>

        {/* Existing Thread Replies from Database */}
        {interaction.replyAttempts && interaction.replyAttempts.length > 0 && (
          <div className="space-y-3 pl-4 border-l-2 border-brand-purple/30 dark:border-brand-cyan/30">
            <h5 className="text-xs font-bold text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
              <CornerDownRight className="w-3.5 h-3.5 text-brand-purple dark:text-brand-cyan" />
              Published Replies &amp; Outgoing Attempts
            </h5>

            {interaction.replyAttempts.map((attempt) => (
              <div
                key={attempt.id}
                className="p-3.5 rounded-xl border border-brand-purple/20 dark:border-brand-purple/30 bg-brand-purple/5 dark:bg-brand-purple/10 space-y-1.5 text-xs text-slate-800 dark:text-slate-200"
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-900 dark:text-white flex items-center gap-1">
                    <User className="w-3 h-3 text-brand-purple dark:text-brand-cyan" />
                    {attempt.authorUser?.name || 'OmniSocial Bot'}
                  </span>
                  <div className="flex items-center gap-1.5">
                    {attempt.status === 'SENT' && <Badge variant="success">Sent</Badge>}
                    {attempt.status === 'FAILED' && <Badge variant="danger">Failed</Badge>}
                    {attempt.status === 'AMBIGUOUS_TIMEOUT' && <Badge variant="warning">Timeout</Badge>}
                    <span className="text-[10px] text-slate-400 dark:text-slate-500">
                      {new Date(attempt.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
                <p className="leading-relaxed whitespace-pre-wrap">{attempt.content}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Tabs & Interaction Composer */}
      <div className="border-t border-slate-200 dark:border-slate-800">
        <div className="flex border-b border-slate-200 dark:border-slate-800 px-4 bg-slate-50/50 dark:bg-slate-900/50">
          <button
            onClick={() => setActiveTab('reply')}
            className={`px-4 py-2.5 text-xs font-bold transition-all border-b-2 flex items-center gap-1.5 ${
              activeTab === 'reply'
                ? 'border-brand-purple text-brand-purple dark:border-brand-cyan dark:text-brand-cyan'
                : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            Public Reply
          </button>
          <button
            onClick={() => setActiveTab('notes')}
            className={`px-4 py-2.5 text-xs font-bold transition-all border-b-2 flex items-center gap-1.5 ${
              activeTab === 'notes'
                ? 'border-brand-purple text-brand-purple dark:border-brand-cyan dark:text-brand-cyan'
                : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Lock className="w-3.5 h-3.5" />
            Internal Notes ({interaction.notes?.length || 0})
          </button>
        </div>

        {activeTab === 'reply' ? (
          <ReplyComposer
            interaction={interaction}
            userRole={userRole}
            onSendReply={onSendReply}
          />
        ) : (
          <InternalNotesPanel
            notes={interaction.notes || []}
            userRole={userRole}
            onAddNote={onAddNote}
          />
        )}
      </div>
    </div>
  );
}
