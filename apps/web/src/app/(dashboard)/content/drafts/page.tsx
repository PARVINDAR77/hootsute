'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useWorkspace } from '@/lib/workspace-context';
import { apiClient } from '@/lib/api-client';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Alert } from '@/components/ui/Alert';
import {
  ContentDraftDto,
  DraftStatus,
  SocialPlatform,
  WorkspaceRole,
} from '@packages/shared';
import {
  FileText,
  Sparkles,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  XCircle,
  Copy,
  Trash2,
  ChevronRight,
  Instagram,
  Facebook,
  Linkedin,
  Twitter,
  Pin,
  Youtube,
  Video,
  AtSign,
  Send,
  AlertTriangle,
  Loader2,
  Plus,
} from 'lucide-react';

const STATUS_TABS: { label: string; value: 'ALL' | DraftStatus; color: string }[] = [
  { label: 'All Drafts', value: 'ALL', color: 'bg-slate-100 text-slate-700' },
  { label: 'Draft', value: DraftStatus.DRAFT, color: 'bg-slate-100 text-slate-700' },
  { label: 'In Review', value: DraftStatus.IN_REVIEW, color: 'bg-amber-100 text-amber-800' },
  { label: 'Approved', value: DraftStatus.APPROVED, color: 'bg-emerald-100 text-emerald-800' },
  { label: 'Rejected', value: DraftStatus.REJECTED, color: 'bg-rose-100 text-rose-800' },
];

export default function ContentDraftsPage() {
  const router = useRouter();
  const { currentWorkspace } = useWorkspace();
  const userRole = currentWorkspace?.currentUserRole;

  const [drafts, setDrafts] = useState<ContentDraftDto[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<'ALL' | DraftStatus>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);
  const [selectedDraftIds, setSelectedDraftIds] = useState<string[]>([]);
  const [isBulkApproving, setIsBulkApproving] = useState(false);
  const [alertMsg, setAlertMsg] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const canBulkApprove = userRole === WorkspaceRole.OWNER || userRole === WorkspaceRole.ADMIN;

  const toggleSelectDraft = (draftId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedDraftIds((prev) =>
      prev.includes(draftId) ? prev.filter((id) => id !== draftId) : [...prev, draftId],
    );
  };

  const handleBulkApprove = async () => {
    if (!currentWorkspace || selectedDraftIds.length === 0 || !canBulkApprove) return;
    setIsBulkApproving(true);
    setAlertMsg(null);
    try {
      const res = await apiClient<any>(`/workspaces/${currentWorkspace.id}/content-drafts/bulk-approve`, {
        method: 'POST',
        body: JSON.stringify({ draftIds: selectedDraftIds }),
      });
      const payload = res?.data ?? res;
      setAlertMsg({
        type: 'success',
        message: `Approved ${payload?.approvedIds?.length || selectedDraftIds.length} campaign draft(s). Ready for bulk publishing!`,
      });
      setSelectedDraftIds([]);
      await loadDrafts();
    } catch (err: any) {
      setAlertMsg({ type: 'error', message: err.message || 'Bulk approval failed' });
    } finally {
      setIsBulkApproving(false);
    }
  };

  const handleBulkPublishSelected = () => {
    const approvedSelected = drafts
      .filter((d) => selectedDraftIds.includes(d.id) && d.status === DraftStatus.APPROVED)
      .map((d) => d.id);
    const targetIds = approvedSelected.length > 0 ? approvedSelected : selectedDraftIds;
    router.push(`/bulk-publish?draftIds=${encodeURIComponent(targetIds.join(','))}`);
  };

  useEffect(() => {
    if (!currentWorkspace?.id) return;
    loadDrafts();
  }, [currentWorkspace?.id, selectedStatus]);

  const loadDrafts = async () => {
    if (!currentWorkspace) return;
    setIsLoading(true);
    try {
      const statusParam = selectedStatus !== 'ALL' ? `?status=${selectedStatus}` : '';
      const res = await apiClient<any>(
        `/workspaces/${currentWorkspace.id}/content-drafts${statusParam}`,
      );
      const list = Array.isArray(res) ? res : (res?.data || []);
      setDrafts(list);
    } catch (err: any) {
      console.error('Failed to load drafts', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDuplicate = async (draftId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!currentWorkspace) return;
    setActionInProgress(draftId);
    try {
      const res = await apiClient<{ success: boolean; data: ContentDraftDto }>(
        `/workspaces/${currentWorkspace.id}/content-drafts/${draftId}/duplicate`,
        { method: 'POST' },
      );
      setAlertMsg({ type: 'success', message: 'Draft duplicated successfully into a new DRAFT copy.' });
      loadDrafts();
    } catch (err: any) {
      setAlertMsg({ type: 'error', message: err.message || 'Failed to duplicate draft' });
    } finally {
      setActionInProgress(null);
    }
  };

  const handleDelete = async (draftId: string, title: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!currentWorkspace) return;
    if (!confirm(`Are you sure you want to delete the draft "${title}"?`)) return;

    setActionInProgress(draftId);
    try {
      await apiClient(`/workspaces/${currentWorkspace.id}/content-drafts/${draftId}`, {
        method: 'DELETE',
      });
      setAlertMsg({ type: 'success', message: 'Draft deleted successfully.' });
      setDrafts((prev) => prev.filter((d) => d.id !== draftId));
    } catch (err: any) {
      setAlertMsg({ type: 'error', message: err.message || 'Failed to delete draft' });
    } finally {
      setActionInProgress(null);
    }
  };

  const filteredDrafts = drafts.filter((d) => {
    if (!searchQuery.trim()) return true;
    return d.title.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const getStatusBadge = (status: DraftStatus) => {
    switch (status) {
      case DraftStatus.APPROVED:
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
            <CheckCircle2 className="w-3 h-3" />
            Approved
          </span>
        );
      case DraftStatus.IN_REVIEW:
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
            <Clock className="w-3 h-3" />
            In Review
          </span>
        );
      case DraftStatus.REJECTED:
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-full">
            <XCircle className="w-3 h-3" />
            Rejected
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-700 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-full">
            Draft
          </span>
        );
    }
  };

  const renderPlatformIcon = (platform: SocialPlatform) => {
    switch (platform) {
      case SocialPlatform.INSTAGRAM:
        return (
          <span key={platform} title="Instagram">
            <Instagram className="w-3.5 h-3.5 text-pink-600" />
          </span>
        );
      case SocialPlatform.FACEBOOK:
        return (
          <span key={platform} title="Facebook">
            <Facebook className="w-3.5 h-3.5 text-blue-600" />
          </span>
        );
      case SocialPlatform.LINKEDIN:
        return (
          <span key={platform} title="LinkedIn">
            <Linkedin className="w-3.5 h-3.5 text-sky-700" />
          </span>
        );
      case SocialPlatform.TWITTER_X:
        return (
          <span key={platform} title="Twitter / X">
            <Twitter className="w-3.5 h-3.5 text-slate-800" />
          </span>
        );
      case SocialPlatform.PINTEREST:
        return (
          <span key={platform} title="Pinterest">
            <Pin className="w-3.5 h-3.5 text-red-600" />
          </span>
        );
      case SocialPlatform.YOUTUBE:
        return (
          <span key={platform} title="YouTube">
            <Youtube className="w-3.5 h-3.5 text-rose-600" />
          </span>
        );
      case SocialPlatform.TIKTOK:
        return (
          <span key={platform} title="TikTok">
            <Video className="w-3.5 h-3.5 text-slate-900" />
          </span>
        );
      case SocialPlatform.THREADS:
        return (
          <span key={platform} title="Threads">
            <AtSign className="w-3.5 h-3.5 text-neutral-900" />
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 bg-white dark:bg-[#0F142B]/90 rounded-2xl border border-[#E7EAF2] dark:border-[#7138F5]/25 shadow-soft dark:shadow-none">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <span className="p-2.5 rounded-xl bg-[#F1EBFF] dark:bg-[#7138F5]/20 text-[#7138F5] dark:text-[#C4A5FF]">
              <FileText className="w-5 h-5" />
            </span>
            <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-[#111827] dark:text-white">
              Content Drafts &amp; Approval Hub
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-[#64748B] dark:text-slate-400">
            Review, edit, translate, and approve multi-platform social media posts before publishing.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            onClick={() => router.push('/bulk-publish')}
            className="gap-2"
          >
            <Send className="w-4 h-4" />
            <span>Bulk Publish</span>
          </Button>
          <Button
            onClick={() => router.push('/content/studio')}
            className="gap-2 bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm"
          >
            <Sparkles className="w-4 h-4" />
            <span>New AI Campaign</span>
          </Button>
        </div>
      </div>

      {/* Bulk Action Bar */}
      {selectedDraftIds.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 rounded-xl bg-indigo-50 border border-indigo-200">
          <span className="text-xs font-semibold text-indigo-900">
            {selectedDraftIds.length} campaign draft(s) selected
          </span>
          <div className="flex items-center gap-2">
            {canBulkApprove && (
              <Button
                size="sm"
                onClick={handleBulkApprove}
                isLoading={isBulkApproving}
                leftIcon={<CheckCircle2 className="w-3.5 h-3.5" />}
              >
                Bulk Approve
              </Button>
            )}
            <Button
              size="sm"
              variant="outline"
              onClick={handleBulkPublishSelected}
              leftIcon={<Send className="w-3.5 h-3.5" />}
            >
              Bulk Publish Selected
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setSelectedDraftIds([])}
            >
              Clear
            </Button>
          </div>
        </div>
      )}

      {alertMsg && (
        <Alert
          type={alertMsg.type}
          title={alertMsg.type === 'success' ? 'Action Completed' : 'Error'}
          message={alertMsg.message}
        />
      )}

      {/* Filter Tabs & Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Status Filter Tabs */}
        <div className="flex flex-wrap gap-1.5 p-1 bg-slate-100 rounded-xl">
          {STATUS_TABS.map((tab) => {
            const isActive = selectedStatus === tab.value;
            return (
              <button
                key={tab.value}
                onClick={() => setSelectedStatus(tab.value)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
          <Input
            placeholder="Search campaigns..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 text-xs"
          />
        </div>
      </div>

      {/* Drafts List */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center min-h-[300px] gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
          <p className="text-xs text-slate-500">Loading workspace drafts...</p>
        </div>
      ) : filteredDrafts.length === 0 ? (
        <Card className="text-center py-12 px-4 border-dashed">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 mx-auto flex items-center justify-center mb-3">
            <Sparkles className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-900 mb-1">No drafts found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mb-4">
            {searchQuery
              ? `No campaigns match "${searchQuery}". Try a different filter.`
              : 'Start by generating your first multi-platform social media campaign with OmniSocial AI.'}
          </p>
          <Button
            onClick={() => router.push('/content/studio')}
            size="sm"
            className="gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>Create Campaign in AI Studio</span>
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-3.5">
          {filteredDrafts.map((draft) => {
            const isWorking = actionInProgress === draft.id;
            return (
              <div
                key={draft.id}
                onClick={() => router.push(`/content/drafts/${draft.id}`)}
                className="group p-5 bg-white rounded-xl border border-slate-200/80 hover:border-indigo-300 hover:shadow-sm transition-all cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="space-y-1.5 flex-1 min-w-0">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <input
                      type="checkbox"
                      checked={selectedDraftIds.includes(draft.id)}
                      onClick={(e) => toggleSelectDraft(draft.id, e)}
                      onChange={() => {}}
                      className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                      aria-label={`Select ${draft.title}`}
                    />
                    <span className="font-bold text-sm text-slate-900 group-hover:text-indigo-600 transition-colors">
                      {draft.title}
                    </span>
                    {getStatusBadge(draft.status)}
                    <span className="text-[10px] uppercase font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                      {draft.objective.replace('_', ' ')}
                    </span>
                  </div>

                  {draft.status === DraftStatus.REJECTED && draft.rejectionReason && (
                    <div className="flex items-center gap-1.5 text-xs text-rose-700 bg-rose-50 border border-rose-200 px-2.5 py-1 rounded-md">
                      <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                      <span className="font-medium">Feedback: {draft.rejectionReason}</span>
                    </div>
                  )}

                  <div className="flex items-center gap-4 text-[11px] text-slate-400">
                    <div className="flex items-center gap-1.5">
                      <span>Platforms:</span>
                      <div className="flex items-center gap-1 bg-slate-50 px-2 py-0.5 rounded border border-slate-200">
                        {draft.variants && draft.variants.length > 0 ? (
                          draft.variants.map((v) => renderPlatformIcon(v.platform))
                        ) : (
                          <span className="text-slate-400">None</span>
                        )}
                      </div>
                    </div>
                    <span>Created by {draft.createdBy?.name || 'Team member'}</span>
                    <span>•</span>
                    <span>{new Date(draft.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>

                {/* Right Action Icons */}
                <div className="flex items-center gap-2 shrink-0">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={isWorking}
                    onClick={(e) => handleDuplicate(draft.id, e)}
                    className="text-xs gap-1.5 h-8"
                    title="Duplicate into a new DRAFT"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Duplicate</span>
                  </Button>

                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={isWorking}
                    onClick={(e) => handleDelete(draft.id, draft.title, e)}
                    className="text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 h-8 px-2"
                    title="Delete Draft"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>

                  <div className="p-1 rounded-lg text-slate-400 group-hover:text-indigo-600 group-hover:translate-x-0.5 transition-all">
                    <ChevronRight className="w-5 h-5" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
