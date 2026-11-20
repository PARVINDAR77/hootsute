'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useWorkspace } from '@/lib/workspace-context';
import { apiClient } from '@/lib/api-client';
import {
  Inbox,
  RefreshCw,
  AlertCircle,
  MessageSquare,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { SocialInteractionDto } from '@packages/shared';
import { InboxSidebarFilters, InboxCounts } from '@/components/inbox/InboxSidebarFilters';
import { InteractionList } from '@/components/inbox/InteractionList';
import { InteractionDetailPanel } from '@/components/inbox/InteractionDetailPanel';
import { SyncStatusModal, AccountSyncStatus } from '@/components/inbox/SyncStatusModal';

export default function SocialInboxPage() {
  const { currentWorkspace } = useWorkspace();
  const workspaceId = currentWorkspace?.id;
  const userRole = currentWorkspace?.currentUserRole || 'VIEWER';

  // Filters State
  const [currentStatus, setCurrentStatus] = useState<string>('OPEN');
  const [currentPlatform, setCurrentPlatform] = useState<string>('');
  const [currentAccountId, setCurrentAccountId] = useState<string>('');
  const [assignedToMe, setAssignedToMe] = useState<boolean>(false);
  const [isReadFilter, setIsReadFilter] = useState<boolean | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Data State
  const [interactions, setInteractions] = useState<SocialInteractionDto[]>([]);
  const [selectedInteraction, setSelectedInteraction] = useState<SocialInteractionDto | null>(null);
  const [members, setMembers] = useState<any[]>([]);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [syncStatuses, setSyncStatuses] = useState<AccountSyncStatus[]>([]);
  const [counts, setCounts] = useState<InboxCounts>({ unread: 0, open: 0, assignedToMe: 0 });

  // UI State
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isSyncModalOpen, setIsSyncModalOpen] = useState<boolean>(false);

  // Fetch interactions list
  const fetchInteractions = useCallback(async () => {
    if (!workspaceId) return;
    setIsLoading(true);
    setError(null);

    const params = new URLSearchParams();
    if (currentStatus) params.set('workflowStatus', currentStatus);
    if (currentPlatform) params.set('platform', currentPlatform);
    if (currentAccountId) params.set('socialAccountId', currentAccountId);
    if (assignedToMe) params.set('assignedToMe', 'true');
    if (isReadFilter !== null) params.set('isRead', String(isReadFilter));
    if (searchTerm) params.set('search', searchTerm);

    try {
      const res = await apiClient(`/workspaces/${workspaceId}/inbox/interactions?${params.toString()}`);
      const list: any[] = Array.isArray(res) ? res : (Array.isArray(res?.data) ? res.data : []);
      setInteractions(list);

      if (res?.counts) {
        setCounts(res.counts);
      } else {
        setCounts({
          all: list.length,
          open: list.filter((i: any) => i.workflowStatus === 'OPEN').length,
          assigned: list.filter((i: any) => i.workflowStatus === 'ASSIGNED').length,
          inProgress: list.filter((i: any) => i.workflowStatus === 'IN_PROGRESS').length,
          resolved: list.filter((i: any) => i.workflowStatus === 'RESOLVED').length,
          unread: list.filter((i: any) => i.isRead === false).length,
        });
      }

      setSelectedInteraction((prev) => {
        if (!prev) return null;
        const fresh = list.find((i: any) => i.id === prev.id);
        return fresh || prev;
      });
    } catch (err: any) {
      setError(err?.message || 'Failed to load social interactions');
    } finally {
      setIsLoading(false);
    }
  }, [
    workspaceId,
    currentStatus,
    currentPlatform,
    currentAccountId,
    assignedToMe,
    isReadFilter,
    searchTerm,
  ]);

  // Fetch members & accounts for selectors
  const fetchMetadata = useCallback(async () => {
    if (!workspaceId) return;
    try {
      const [membersRes, accountsRes, syncRes] = await Promise.allSettled([
        apiClient(`/workspaces/${workspaceId}/members`),
        apiClient(`/workspaces/${workspaceId}/social-accounts`),
        apiClient(`/workspaces/${workspaceId}/inbox/sync-status`),
      ]);

      if (membersRes.status === 'fulfilled') {
        const mList = Array.isArray(membersRes.value) ? membersRes.value : (membersRes.value?.data || []);
        setMembers(mList.map((m: any) => (m.user ? { ...m.user, role: m.role } : m)));
      }
      if (accountsRes.status === 'fulfilled') {
        const aList = Array.isArray(accountsRes.value) ? accountsRes.value : (accountsRes.value?.data || []);
        setAccounts(aList);
      }
      if (syncRes.status === 'fulfilled') {
        const sList = Array.isArray(syncRes.value) ? syncRes.value : (syncRes.value?.data || []);
        setSyncStatuses(sList);
      }
    } catch (err: any) {
      console.warn('Metadata fetch failed:', err);
    }
  }, [workspaceId]);

  useEffect(() => {
    fetchInteractions();
  }, [fetchInteractions]);

  useEffect(() => {
    fetchMetadata();
  }, [fetchMetadata]);

  // Handle Workflow Status Transition
  const handleStatusChange = async (newStatus: string) => {
    if (!workspaceId || !selectedInteraction) return;
    const res = await apiClient(
      `/workspaces/${workspaceId}/inbox/interactions/${selectedInteraction.id}/status`,
      {
        method: 'PATCH',
        body: JSON.stringify({ status: newStatus }),
      },
    );

    const updated = res?.data ?? res;
    if (updated) {
      setSelectedInteraction((prev) => (prev ? { ...prev, workflowStatus: newStatus as any } : null));
      setInteractions((prev) =>
        prev.map((i) => (i.id === selectedInteraction.id ? { ...i, workflowStatus: newStatus as any } : i)),
      );
    }
  };

  // Handle Team Member Assignment
  const handleAssignmentChange = async (userId: string | null) => {
    if (!workspaceId || !selectedInteraction) return;
    const res = await apiClient(
      `/workspaces/${workspaceId}/inbox/interactions/${selectedInteraction.id}/assignment`,
      {
        method: 'PATCH',
        body: JSON.stringify({ assignedToUserId: userId }),
      },
    );

    const updated = res?.data ?? res;
    if (updated) {
      setSelectedInteraction((prev) =>
        prev
          ? {
              ...prev,
              assignedToUserId: userId,
              assignedTo: updated.assignedTo,
              workflowStatus: updated.workflowStatus ?? prev.workflowStatus,
            }
          : null,
      );
      setInteractions((prev) =>
        prev.map((i) =>
          i.id === selectedInteraction.id
            ? {
                ...i,
                assignedToUserId: userId,
                assignedTo: updated.assignedTo,
                workflowStatus: updated.workflowStatus ?? i.workflowStatus,
              }
            : i,
        ),
      );
    }
  };

  // Handle Read/Unread Toggle
  const handleToggleRead = async (isRead: boolean) => {
    if (!workspaceId || !selectedInteraction) return;
    const res = await apiClient(
      `/workspaces/${workspaceId}/inbox/interactions/${selectedInteraction.id}/read`,
      {
        method: 'PATCH',
        body: JSON.stringify({ isRead }),
      },
    );

    if (res !== undefined) {
      setSelectedInteraction((prev) => (prev ? { ...prev, isRead } : null));
      setInteractions((prev) =>
        prev.map((i) => (i.id === selectedInteraction.id ? { ...i, isRead } : i)),
      );
      setCounts((prev) => ({
        ...prev,
        unread: isRead ? Math.max(0, prev.unread - 1) : prev.unread + 1,
      }));
    }
  };

  // Handle Sending Public Reply
  const handleSendReply = async (content: string, idempotencyKey: string) => {
    if (!workspaceId || !selectedInteraction) return { success: false };
    const res = await apiClient(
      `/workspaces/${workspaceId}/inbox/interactions/${selectedInteraction.id}/replies`,
      {
        method: 'POST',
        body: JSON.stringify({ content, idempotencyKey }),
      },
    );

    if (res && res.success !== false) {
      // Re-fetch interaction details
      const freshRes = await apiClient(
        `/workspaces/${workspaceId}/inbox/interactions/${selectedInteraction.id}`,
      );
      const fresh = freshRes?.data ?? freshRes;
      if (fresh) {
        setSelectedInteraction(fresh);
      }
      return { success: true, message: res?.message || 'Reply sent' };
    }

    return { success: false, message: res?.message || 'Failed to publish reply' };
  };

  // Handle Adding Internal Note
  const handleAddNote = async (content: string) => {
    if (!workspaceId || !selectedInteraction) return;
    const res = await apiClient(
      `/workspaces/${workspaceId}/inbox/interactions/${selectedInteraction.id}/notes`,
      {
        method: 'POST',
        body: JSON.stringify({ content }),
      },
    );

    if (res && res.success !== false) {
      const freshRes = await apiClient(
        `/workspaces/${workspaceId}/inbox/interactions/${selectedInteraction.id}`,
      );
      const fresh = freshRes?.data ?? freshRes;
      if (fresh) {
        setSelectedInteraction(fresh);
      }
    }
  };

  // Handle Triggering Manual Sync
  const handleTriggerSync = async (force = false) => {
    if (!workspaceId) return { success: false };
    const res = await apiClient(`/workspaces/${workspaceId}/inbox/sync`, {
      method: 'POST',
      body: JSON.stringify({ force }),
    });

    if (res && res.success !== false) {
      await fetchInteractions();
      await fetchMetadata();
    }

    return {
      success: !!res?.success,
      message: res?.message,
      throttled: res?.data?.throttled,
    };
  };

  if (!workspaceId) {
    return (
      <div className="p-8 text-center text-slate-500">
        <Inbox className="w-12 h-12 text-slate-300 mx-auto mb-3" />
        <h3 className="text-base font-semibold text-slate-800">No Workspace Selected</h3>
        <p className="text-xs text-slate-400 mt-1">
          Select an active workspace to monitor and manage customer conversations.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5 max-w-7xl mx-auto pb-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200/80 dark:border-slate-800 transition-colors">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              Unified Social Inbox
            </h1>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60">
              Community Hub
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Manage customer comments, direct replies, and brand mentions across all 8 social media channels.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsSyncModalOpen(true)}
            className="text-xs h-8 gap-1.5 border-slate-200 dark:border-slate-800"
          >
            <RefreshCw className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
            <span>Sync &amp; Health</span>
          </Button>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 rounded-xl text-xs text-rose-800 dark:text-rose-300 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Main 3-Pane Responsive Layout */}
      <div className="flex flex-col lg:flex-row border border-slate-200/80 dark:border-slate-800 rounded-2xl overflow-hidden bg-white dark:bg-slate-900 shadow-sm min-h-[650px] transition-colors">
        {/* Pane 1: Filters */}
        <InboxSidebarFilters
          currentStatus={currentStatus}
          onStatusChange={setCurrentStatus}
          currentPlatform={currentPlatform}
          onPlatformChange={setCurrentPlatform}
          currentAccountId={currentAccountId}
          onAccountChange={setCurrentAccountId}
          assignedToMe={assignedToMe}
          onAssignedToMeToggle={setAssignedToMe}
          isReadFilter={isReadFilter}
          onReadFilterChange={setIsReadFilter}
          accounts={accounts}
          counts={counts}
        />

        {/* Pane 2: Interaction List */}
        <InteractionList
          interactions={interactions}
          selectedId={selectedInteraction?.id || null}
          onSelect={(item) => setSelectedInteraction(item)}
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          isLoading={isLoading}
        />

        {/* Pane 3: Detail View & Reply Composer */}
        <InteractionDetailPanel
          interaction={selectedInteraction}
          members={members}
          userRole={userRole}
          onStatusChange={handleStatusChange}
          onAssignmentChange={handleAssignmentChange}
          onToggleRead={handleToggleRead}
          onSendReply={handleSendReply}
          onAddNote={handleAddNote}
        />
      </div>

      {/* Sync Status & Health Modal */}
      <SyncStatusModal
        isOpen={isSyncModalOpen}
        onClose={() => setIsSyncModalOpen(false)}
        syncStatuses={syncStatuses}
        onTriggerSync={handleTriggerSync}
        userRole={userRole}
      />
    </div>
  );
}
