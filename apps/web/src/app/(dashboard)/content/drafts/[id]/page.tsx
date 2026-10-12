'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useWorkspace } from '@/lib/workspace-context';
import { useAuth } from '@/lib/auth-context';
import { apiClient } from '@/lib/api-client';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Alert } from '@/components/ui/Alert';
import {
  ContentDraftDto,
  ContentVariantDto,
  DraftStatus,
  SocialPlatform,
  WorkspaceRole,
  BrandTone,
  ContentRevisionDto,
  MediaAssetDto,
} from '@packages/shared';
import { MediaPickerModal } from '@/components/media/MediaPickerModal';
import {
  FileText,
  Sparkles,
  ArrowLeft,
  CheckCircle2,
  Clock,
  XCircle,
  Copy,
  Trash2,
  Send,
  Check,
  X,
  History,
  Languages,
  Repeat,
  Image,
  RefreshCw,
  AlertTriangle,
  Instagram,
  Facebook,
  Linkedin,
  Twitter,
  Loader2,
  Save,
  Shield,
  HelpCircle,
  MessageSquare,
  Smartphone,
  Calendar,
  UploadCloud,
} from 'lucide-react';

const COMMON_TRANSLATION_LANGUAGES = [
  'Gujarati (ગુજરાતી)',
  'Hindi (हिन्दी)',
  'Marathi (मराठी)',
  'Bengali (বাংলা)',
  'Tamil (தமிழ்)',
  'Telugu (తెలుగు)',
  'Spanish',
  'French',
  'German',
];

export default function DraftDetailPage() {
  const params = useParams();
  const router = useRouter();
  const draftId = params.id as string;

  const { currentWorkspace } = useWorkspace();
  const userRole = currentWorkspace?.currentUserRole;
  const { user } = useAuth();

  const [draft, setDraft] = useState<ContentDraftDto | null>(null);
  const [activeVariantIndex, setActiveVariantIndex] = useState(0);
  const [activeVariant, setActiveVariant] = useState<ContentVariantDto | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);
  const [alertMsg, setAlertMsg] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);

  // Revision History drawer
  const [showRevisions, setShowRevisions] = useState(false);

  // Modals state
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');

  const [showRegenerateModal, setShowRegenerateModal] = useState(false);
  const [regenField, setRegenField] = useState<'all' | 'headline' | 'body' | 'callToAction' | 'hashtags'>('headline');
  const [regenInstructions, setRegenInstructions] = useState('');

  const [showTranslateModal, setShowTranslateModal] = useState(false);
  const [targetLanguage, setTargetLanguage] = useState('Gujarati (ગુજરાતી)');

  const [showAdaptModal, setShowAdaptModal] = useState(false);
  const [targetPlatform, setTargetPlatform] = useState<SocialPlatform>(SocialPlatform.LINKEDIN);

  const [showBriefModal, setShowBriefModal] = useState(false);
  const [visualPreferences, setVisualPreferences] = useState('');
  const [generatedBrief, setGeneratedBrief] = useState<string | null>(null);

  // Media Asset Picker state
  const [showMediaPicker, setShowMediaPicker] = useState(false);

  // WhatsApp Preview state
  const [showWhatsAppModal, setShowWhatsAppModal] = useState(false);
  const [whatsAppRecipients, setWhatsAppRecipients] = useState<Array<{ id: string; displayName: string; phoneNumber: string; status: string }>>([]);
  const [selectedRecipientIds, setSelectedRecipientIds] = useState<string[]>([]);
  const [whatsAppHistory, setWhatsAppHistory] = useState<any[]>([]);
  const [isLoadingWhatsApp, setIsLoadingWhatsApp] = useState(false);
  const [isDispatchingWhatsApp, setIsDispatchingWhatsApp] = useState(false);

  const openWhatsAppModal = async () => {
    if (!currentWorkspace || !draft) return;
    setShowWhatsAppModal(true);
    setIsLoadingWhatsApp(true);
    try {
      const [recipientsRes, historyRes] = await Promise.all([
        apiClient<{ success: boolean; data: any[] }>(`/workspaces/${currentWorkspace.id}/whatsapp/recipients`),
        apiClient<{ success: boolean; data: any[] }>(`/workspaces/${currentWorkspace.id}/content-drafts/${draft.id}/whatsapp-history`),
      ]);

      const activeRecipients = (recipientsRes?.data || []).filter((r: any) => r.status === 'OPTED_IN');
      setWhatsAppRecipients(recipientsRes?.data || []);
      setSelectedRecipientIds(activeRecipients.map((r: any) => r.id));
      setWhatsAppHistory(historyRes?.data || []);
    } catch (err: any) {
      console.error('Failed to load WhatsApp data:', err);
    } finally {
      setIsLoadingWhatsApp(false);
    }
  };

  const handleDispatchWhatsAppPreview = async () => {
    if (!currentWorkspace || !draft || selectedRecipientIds.length === 0) return;
    setIsDispatchingWhatsApp(true);
    try {
      const res = await apiClient<{ success: boolean; message: string }>(
        `/workspaces/${currentWorkspace.id}/content-drafts/${draft.id}/whatsapp-preview`,
        {
          method: 'POST',
          body: JSON.stringify({
            recipientConsentIds: selectedRecipientIds,
            platform: activeVariant?.platform || SocialPlatform.INSTAGRAM,
          }),
        },
      );

      setAlertMsg({ type: 'success', message: res.message || 'WhatsApp preview dispatched successfully!' });
      setShowWhatsAppModal(false);
    } catch (err: any) {
      setAlertMsg({ type: 'error', message: err.message || 'Failed to dispatch WhatsApp preview' });
    } finally {
      setIsDispatchingWhatsApp(false);
    }
  };

  const handleSelectMedia = (asset: MediaAssetDto) => {
    if (!activeVariant || !draft || !draft.variants) return;
    const updatedVariants = draft.variants.map((v) =>
      v.id === activeVariant.id
        ? {
            ...v,
            mediaAssetId: asset.id,
            mediaAssetUrl: asset.accessUrl || v.mediaAssetUrl,
            mediaAsset: asset,
          }
        : v,
    );
    setDraft({ ...draft, variants: updatedVariants });
    setActiveVariant({
      ...activeVariant,
      mediaAssetId: asset.id,
      mediaAssetUrl: asset.accessUrl || activeVariant.mediaAssetUrl,
      mediaAsset: asset,
    } as any);
  };

  const handleRemoveMedia = () => {
    if (!activeVariant || !draft || !draft.variants) return;
    const updatedVariants = draft.variants.map((v) =>
      v.id === activeVariant.id
        ? {
            ...v,
            mediaAssetId: null,
            mediaAssetUrl: null,
            mediaAsset: null,
          }
        : v,
    );
    setDraft({ ...draft, variants: updatedVariants });
    setActiveVariant({
      ...activeVariant,
      mediaAssetId: null,
      mediaAssetUrl: null,
      mediaAsset: null,
    } as any);
  };

  useEffect(() => {
    if (!currentWorkspace?.id || !draftId) return;
    loadDraft();
  }, [currentWorkspace?.id, draftId]);

  const loadDraft = async () => {
    if (!currentWorkspace) return;
    setIsLoading(true);
    try {
      const res = await apiClient<{ success: boolean; data: ContentDraftDto }>(
        `/workspaces/${currentWorkspace.id}/content-drafts/${draftId}`,
      );
      if (res.data) {
        setDraft(res.data);
        if (res.data.variants && res.data.variants.length > 0) {
          setActiveVariant(res.data.variants[activeVariantIndex] || res.data.variants[0]);
        }
      }
    } catch (err: any) {
      setAlertMsg({ type: 'error', message: err.message || 'Failed to load draft' });
    } finally {
      setIsLoading(false);
    }
  };

  const isApproved = draft?.status === DraftStatus.APPROVED;
  const isEditable = draft?.status === DraftStatus.DRAFT || draft?.status === DraftStatus.REJECTED;

  // Four-eyes self-approval check
  const isAuthor = draft?.createdByUserId === user?.id || draft?.approvalRequestedByUserId === user?.id;
  const canApproveOrReject = userRole === WorkspaceRole.OWNER || userRole === WorkspaceRole.ADMIN;
  const isSelfApprovalBlocked = !userRole || (userRole !== WorkspaceRole.OWNER && isAuthor);

  const handleUpdateVariantField = (field: keyof ContentVariantDto, value: any) => {
    if (!activeVariant || !isEditable) return;
    setActiveVariant({ ...activeVariant, [field]: value });
  };

  const handleSaveDraftChanges = async () => {
    if (!currentWorkspace || !draft || !activeVariant || !isEditable) return;
    setIsSaving(true);
    setAlertMsg(null);

    try {
      const res = await apiClient<{ success: boolean; data: ContentDraftDto }>(
        `/workspaces/${currentWorkspace.id}/content-drafts/${draft.id}`,
        {
          method: 'PATCH',
          body: JSON.stringify({
            title: draft.title,
            variants: [
              {
                id: activeVariant.id,
                platform: activeVariant.platform,
                headline: activeVariant.headline,
                body: activeVariant.body,
                callToAction: activeVariant.callToAction,
                hashtags: activeVariant.hashtags,
                linkUrl: activeVariant.linkUrl,
                mediaBrief: activeVariant.mediaBrief,
              },
            ],
          }),
        },
      );

      setDraft(res.data);
      if (res.data.variants) {
        const updated = res.data.variants.find((v) => v.id === activeVariant.id);
        if (updated) setActiveVariant(updated);
      }
      setAlertMsg({
        type: 'success',
        message: draft.status === DraftStatus.REJECTED
          ? 'Draft reopened as DRAFT upon editing and new revision logged.'
          : 'Changes saved successfully and revision recorded.',
      });
    } catch (err: any) {
      setAlertMsg({ type: 'error', message: err.message || 'Failed to save changes' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSubmitForReview = async () => {
    if (!currentWorkspace || !draft) return;
    setActionInProgress('submit');
    try {
      const res = await apiClient<{ success: boolean; data: ContentDraftDto }>(
        `/workspaces/${currentWorkspace.id}/content-drafts/${draft.id}/submit-review`,
        { method: 'POST' },
      );
      setDraft(res.data);
      setAlertMsg({ type: 'success', message: 'Campaign submitted for review (IN_REVIEW status).' });
    } catch (err: any) {
      setAlertMsg({ type: 'error', message: err.message || 'Failed to submit review' });
    } finally {
      setActionInProgress(null);
    }
  };

  const handleApprove = async () => {
    if (!currentWorkspace || !draft || !canApproveOrReject || isSelfApprovalBlocked) return;
    setActionInProgress('approve');
    try {
      const res = await apiClient<{ success: boolean; data: ContentDraftDto }>(
        `/workspaces/${currentWorkspace.id}/content-drafts/${draft.id}/approve`,
        { method: 'POST' },
      );
      setDraft(res.data);
      setAlertMsg({ type: 'success', message: 'Campaign approved successfully! Post is ready for scheduling.' });
    } catch (err: any) {
      setAlertMsg({ type: 'error', message: err.message || 'Approval failed' });
    } finally {
      setActionInProgress(null);
    }
  };

  const handleReject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentWorkspace || !draft || !rejectionReason.trim()) return;
    setActionInProgress('reject');
    try {
      const res = await apiClient<{ success: boolean; data: ContentDraftDto }>(
        `/workspaces/${currentWorkspace.id}/content-drafts/${draft.id}/reject`,
        {
          method: 'POST',
          body: JSON.stringify({ rejectionReason: rejectionReason.trim() }),
        },
      );
      setDraft(res.data);
      setShowRejectModal(false);
      setRejectionReason('');
      setAlertMsg({ type: 'info', message: 'Draft rejected with feedback. Editors can revise and resubmit.' });
    } catch (err: any) {
      setAlertMsg({ type: 'error', message: err.message || 'Failed to reject draft' });
    } finally {
      setActionInProgress(null);
    }
  };

  const handleDuplicate = async () => {
    if (!currentWorkspace || !draft) return;
    setActionInProgress('duplicate');
    try {
      const res = await apiClient<{ success: boolean; data: ContentDraftDto }>(
        `/workspaces/${currentWorkspace.id}/content-drafts/${draft.id}/duplicate`,
        { method: 'POST' },
      );
      router.push(`/content/drafts/${res.data.id}`);
    } catch (err: any) {
      setAlertMsg({ type: 'error', message: err.message || 'Failed to duplicate' });
      setActionInProgress(null);
    }
  };

  const handleRegenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentWorkspace || !draft || !activeVariant) return;
    setActionInProgress('regenerating');
    try {
      const res = await apiClient<{ success: boolean; data: ContentVariantDto }>(
        `/workspaces/${currentWorkspace.id}/content-drafts/${draft.id}/variants/${activeVariant.id}/regenerate`,
        {
          method: 'POST',
          body: JSON.stringify({
            field: regenField,
            instructions: regenInstructions.trim() || undefined,
          }),
        },
      );
      setActiveVariant(res.data);
      setShowRegenerateModal(false);
      setRegenInstructions('');
      loadDraft();
      setAlertMsg({ type: 'success', message: `Successfully regenerated ${regenField} with targeted field preservation.` });
    } catch (err: any) {
      setAlertMsg({ type: 'error', message: err.message || 'Regeneration failed' });
    } finally {
      setActionInProgress(null);
    }
  };

  const handleTranslate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentWorkspace || !draft || !activeVariant) return;
    setActionInProgress('translating');
    try {
      const res = await apiClient<{ success: boolean; data: ContentVariantDto }>(
        `/workspaces/${currentWorkspace.id}/content-drafts/${draft.id}/variants/${activeVariant.id}/translate`,
        {
          method: 'POST',
          body: JSON.stringify({ targetLanguage }),
        },
      );
      setActiveVariant(res.data);
      setShowTranslateModal(false);
      loadDraft();
      setAlertMsg({ type: 'success', message: `Variant translated to ${targetLanguage} and revision recorded.` });
    } catch (err: any) {
      setAlertMsg({ type: 'error', message: err.message || 'Translation failed' });
    } finally {
      setActionInProgress(null);
    }
  };

  const handleAdapt = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentWorkspace || !draft || !activeVariant) return;
    setActionInProgress('adapting');
    try {
      const res = await apiClient<{ success: boolean; data: ContentVariantDto }>(
        `/workspaces/${currentWorkspace.id}/content-drafts/${draft.id}/variants/${activeVariant.id}/adapt`,
        {
          method: 'POST',
          body: JSON.stringify({ targetPlatform }),
        },
      );
      setShowAdaptModal(false);
      loadDraft();
      setAlertMsg({ type: 'success', message: `Adapted variant for ${targetPlatform} created!` });
    } catch (err: any) {
      setAlertMsg({ type: 'error', message: err.message || 'Cross-platform adaptation failed' });
    } finally {
      setActionInProgress(null);
    }
  };

  const handleGenerateBrief = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentWorkspace || !draft || !activeVariant) return;
    setActionInProgress('brief');
    try {
      const res = await apiClient<{ success: boolean; data: { mediaBrief: string } }>(
        `/workspaces/${currentWorkspace.id}/content-drafts/${draft.id}/variants/${activeVariant.id}/creative-brief`,
        {
          method: 'POST',
          body: JSON.stringify({ visualPreferences: visualPreferences.trim() || undefined }),
        },
      );
      setGeneratedBrief(res.data.mediaBrief);
      setActiveVariant({ ...activeVariant, mediaBrief: res.data.mediaBrief });
      loadDraft();
    } catch (err: any) {
      setAlertMsg({ type: 'error', message: err.message || 'Brief generation failed' });
    } finally {
      setActionInProgress(null);
    }
  };

  if (isLoading || !draft) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
        <p className="text-xs text-slate-500">Loading campaign draft &amp; variants...</p>
      </div>
    );
  }

  const renderPlatformBadge = (platform: SocialPlatform) => {
    switch (platform) {
      case SocialPlatform.INSTAGRAM:
        return (
          <span className="flex items-center gap-1.5 text-xs font-bold text-pink-700 bg-pink-50 border border-pink-200 px-2.5 py-1 rounded-lg">
            <Instagram className="w-4 h-4" /> Instagram
          </span>
        );
      case SocialPlatform.FACEBOOK:
        return (
          <span className="flex items-center gap-1.5 text-xs font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2.5 py-1 rounded-lg">
            <Facebook className="w-4 h-4" /> Facebook
          </span>
        );
      case SocialPlatform.LINKEDIN:
        return (
          <span className="flex items-center gap-1.5 text-xs font-bold text-sky-800 bg-sky-50 border border-sky-200 px-2.5 py-1 rounded-lg">
            <Linkedin className="w-4 h-4" /> LinkedIn
          </span>
        );
      case SocialPlatform.TWITTER_X:
        return (
          <span className="flex items-center gap-1.5 text-xs font-bold text-slate-900 bg-slate-100 border border-slate-300 px-2.5 py-1 rounded-lg">
            <Twitter className="w-4 h-4" /> Twitter / X
          </span>
        );
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Top Breadcrumb & Workflow Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 bg-white rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <button
              onClick={() => router.push('/content/drafts')}
              className="text-slate-400 hover:text-slate-700 transition-colors p-1"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            {isEditable ? (
              <input
                type="text"
                value={draft.title}
                onChange={(e) => setDraft({ ...draft, title: e.target.value })}
                className="font-bold text-lg text-slate-900 bg-transparent border-b border-transparent hover:border-slate-300 focus:border-indigo-500 focus:outline-none px-1"
              />
            ) : (
              <h1 className="font-bold text-lg text-slate-900">{draft.title}</h1>
            )}
            <Badge
              variant={
                draft.status === DraftStatus.APPROVED
                  ? 'success'
                  : draft.status === DraftStatus.IN_REVIEW
                  ? 'warning'
                  : draft.status === DraftStatus.REJECTED
                  ? 'danger'
                  : 'default'
              }
              className="text-xs"
            >
              {draft.status}
            </Badge>
          </div>
          <div className="flex items-center gap-3 text-xs text-slate-500">
            <span>Objective: {draft.objective}</span>
            <span>•</span>
            <span>Created by {draft.createdBy?.name || 'Author'}</span>
            <span>•</span>
            <span>{draft.variants?.length || 0} Platform Variants</span>
          </div>
        </div>

        {/* Workflow Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Revisions History Drawer button */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowRevisions(!showRevisions)}
            className="gap-1.5 text-xs"
          >
            <History className="w-3.5 h-3.5" />
            <span>Revisions ({draft.revisions?.length || 1})</span>
          </Button>

          {/* Duplicate */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleDuplicate}
            disabled={!!actionInProgress}
            className="gap-1.5 text-xs"
          >
            <Copy className="w-3.5 h-3.5" />
            <span>Duplicate</span>
          </Button>

          {/* WhatsApp Preview Notification */}
          <Button
            variant="outline"
            size="sm"
            onClick={openWhatsAppModal}
            className="gap-1.5 text-xs border-emerald-300 text-emerald-700 hover:bg-emerald-50 bg-emerald-50/50"
          >
            <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
            <span>WhatsApp Preview</span>
          </Button>

          {/* Submit for Review (if DRAFT or REJECTED) */}
          {isEditable && (
            <Button
              size="sm"
              onClick={handleSubmitForReview}
              disabled={!!actionInProgress}
              className="gap-1.5 text-xs bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Submit for Review</span>
            </Button>
          )}

          {/* Approvals (if IN_REVIEW) */}
          {draft.status === DraftStatus.IN_REVIEW && canApproveOrReject && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowRejectModal(true)}
                disabled={!!actionInProgress}
                className="gap-1.5 text-xs text-rose-600 border-rose-200 hover:bg-rose-50"
              >
                <X className="w-3.5 h-3.5" />
                <span>Reject</span>
              </Button>

              <div className="relative group">
                <Button
                  size="sm"
                  onClick={handleApprove}
                  disabled={!!actionInProgress || isSelfApprovalBlocked}
                  className={`gap-1.5 text-xs ${
                    isSelfApprovalBlocked
                      ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                      : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                  }`}
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Approve Post</span>
                </Button>
                {isSelfApprovalBlocked && (
                  <div className="absolute right-0 top-full mt-1.5 w-64 p-2 bg-slate-900 text-white text-[10px] rounded-lg shadow-xl z-20 hidden group-hover:block">
                    Separation of duties required: As the author of this submission, approval must be granted by another administrator or workspace Owner.
                  </div>
                )}
              </div>
            </>
          )}

          {/* Schedule Publication (if APPROVED) */}
          {draft.status === DraftStatus.APPROVED && (
            <Button
              size="sm"
              onClick={() => router.push(`/calendar?scheduleDraftId=${draft.id}`)}
              className="gap-1.5 text-xs bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs"
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Schedule Post</span>
            </Button>
          )}

          {/* Save Button (when editable) */}
          {isEditable && (
            <Button
              size="sm"
              onClick={handleSaveDraftChanges}
              disabled={isSaving}
              className="gap-1.5 text-xs bg-slate-900 hover:bg-slate-800 text-white"
            >
              {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              <span>Save</span>
            </Button>
          )}
        </div>
      </div>

      {alertMsg && (
        <Alert
          type={alertMsg.type}
          title={alertMsg.type === 'error' ? 'Error' : 'Notice'}
          message={alertMsg.message}
        />
      )}

      {/* State Notice Banners */}
      {draft.status === DraftStatus.REJECTED && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 space-y-1">
          <div className="flex items-center gap-2 font-bold text-xs">
            <AlertTriangle className="w-4 h-4 text-rose-600" />
            <span>This draft was rejected by {draft.approvedBy?.name || 'Reviewer'}</span>
          </div>
          <p className="text-xs pl-6">
            <strong>Reason:</strong> {draft.rejectionReason}
          </p>
          <p className="text-[11px] text-rose-600 pl-6">
            Modifying any text and clicking <strong>Save</strong> will automatically reopen this post to <strong>DRAFT</strong> status and record an audited revision.
          </p>
        </div>
      )}

      {isApproved && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-semibold">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>
              Approved for publishing by {draft.approvedBy?.name || 'Administrator'}{' '}
              {draft.approvedAt ? `on ${new Date(draft.approvedAt).toLocaleDateString()}` : ''}.
            </span>
          </div>
          <span className="text-[11px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-mono font-medium">
            Immutable Production State
          </span>
        </div>
      )}

      {/* Main Multi-Platform Workspace Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Variant Tabs, Content Editor & AI Tools */}
        <div className="lg:col-span-2 space-y-6">
          {/* Platform Variant Selector Tabs */}
          <div className="flex items-center gap-2 p-1.5 bg-slate-100 rounded-xl overflow-x-auto">
            {draft.variants?.map((v, idx) => {
              const isActive = activeVariant?.id === v.id;
              return (
                <button
                  key={v.id}
                  onClick={() => {
                    setActiveVariantIndex(idx);
                    setActiveVariant(v);
                  }}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                    isActive
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                  }`}
                >
                  {renderPlatformBadge(v.platform)}
                </button>
              );
            })}
          </div>

          {activeVariant ? (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-sm font-bold">Native Platform Content</CardTitle>
                    <span className="text-[11px] text-slate-400 font-mono">
                      ({activeVariant.body.length} characters)
                    </span>
                  </div>
                  <CardDescription className="text-xs">
                    Targeted for {activeVariant.platform}
                  </CardDescription>
                </div>

                {/* AI Variant Action Buttons */}
                {!isApproved && (
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowRegenerateModal(true)}
                      className="text-xs gap-1 h-7 text-indigo-700 bg-indigo-50 border-indigo-200 hover:bg-indigo-100"
                    >
                      <RefreshCw className="w-3 h-3" />
                      <span>Regenerate Field</span>
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowTranslateModal(true)}
                      className="text-xs gap-1 h-7 text-emerald-700 bg-emerald-50 border-emerald-200 hover:bg-emerald-100"
                    >
                      <Languages className="w-3 h-3" />
                      <span>Translate</span>
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowAdaptModal(true)}
                      className="text-xs gap-1 h-7 text-sky-700 bg-sky-50 border-sky-200 hover:bg-sky-100"
                    >
                      <Repeat className="w-3 h-3" />
                      <span>Adapt</span>
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowBriefModal(true)}
                      className="text-xs gap-1 h-7 text-amber-700 bg-amber-50 border-amber-200 hover:bg-amber-100"
                    >
                      <Image className="w-3 h-3" />
                      <span>Visual Brief</span>
                    </Button>
                  </div>
                )}
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Headline (e.g. for LinkedIn or FB) */}
                <Input
                  label="Headline / Hook"
                  disabled={!isEditable}
                  value={activeVariant.headline || ''}
                  onChange={(e) => handleUpdateVariantField('headline', e.target.value)}
                  placeholder="Catchy headline or opening hook..."
                />

                {/* Body Content */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center justify-between">
                    <span>Post Copy / Body</span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {activeVariant.body.length} characters
                    </span>
                  </label>
                  <textarea
                    rows={7}
                    disabled={!isEditable}
                    value={activeVariant.body}
                    onChange={(e) => handleUpdateVariantField('body', e.target.value)}
                    className="w-full text-xs rounded-lg border border-slate-300 p-3 leading-relaxed focus:ring-2 focus:ring-indigo-500 focus:outline-none disabled:bg-slate-50 font-sans"
                    placeholder="Body text..."
                  />
                </div>

                {/* Call to Action */}
                <Input
                  label="Call to Action (CTA)"
                  disabled={!isEditable}
                  value={activeVariant.callToAction || ''}
                  onChange={(e) => handleUpdateVariantField('callToAction', e.target.value)}
                  placeholder="e.g. Shop now via the link in bio or WhatsApp us at..."
                />

                {/* Hashtags */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Platform Hashtags (comma or space separated)
                  </label>
                  <Input
                    disabled={!isEditable}
                    value={activeVariant.hashtags?.join(' ') || ''}
                    onChange={(e) =>
                      handleUpdateVariantField(
                        'hashtags',
                        e.target.value
                          .split(/[\s,]+/)
                          .map((h) => (h.startsWith('#') ? h : `#${h}`))
                          .filter((h) => h.length > 1),
                      )
                    }
                    placeholder="#FestiveWear #Navratri2026 #PatolaSilks"
                    className="font-mono text-xs"
                  />
                </div>

                {/* Media Creative Attachment */}
                <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/60 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-800">
                      <Image className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Attached Creative Asset</span>
                    </div>
                    {isEditable && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowMediaPicker(true)}
                        className="text-[11px] h-7 gap-1 bg-white hover:bg-slate-50"
                      >
                        <UploadCloud className="w-3 h-3" />
                        <span>{activeVariant.mediaAssetUrl || (activeVariant as any).mediaAsset ? 'Change Media' : 'Attach Media'}</span>
                      </Button>
                    )}
                  </div>

                  {activeVariant.mediaAssetUrl || (activeVariant as any).mediaAsset ? (
                    <div className="flex items-center justify-between p-2 bg-white rounded-lg border border-slate-200 shadow-xs">
                      <div className="flex items-center gap-2.5 truncate">
                        <div className="w-12 h-12 rounded-md bg-slate-100 overflow-hidden shrink-0 border border-slate-200 flex items-center justify-center">
                          <img
                            src={(activeVariant as any).mediaAsset?.accessUrl || activeVariant.mediaAssetUrl!}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="truncate">
                          <div className="text-xs font-medium text-slate-800 truncate">
                            {(activeVariant as any).mediaAsset?.originalFilename || 'Media asset attached'}
                          </div>
                          <div className="text-[10px] text-slate-400">
                            {(activeVariant as any).mediaAsset?.width && (activeVariant as any).mediaAsset?.height
                              ? `${(activeVariant as any).mediaAsset.width} x ${(activeVariant as any).mediaAsset.height}`
                              : 'Verified for publishing'}
                          </div>
                        </div>
                      </div>
                      {isEditable && (
                        <button
                          onClick={handleRemoveMedia}
                          className="p-1.5 text-slate-400 hover:text-rose-600 rounded-md hover:bg-rose-50 transition-colors"
                          title="Remove media"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ) : (
                    <p className="text-[11px] text-slate-400 italic">
                      No media attached. Plain text post or click "Attach Media" to select an image from your library.
                    </p>
                  )}
                </div>

                {/* Visual Creative Brief Display */}
                {activeVariant.mediaBrief && (
                  <div className="p-3.5 rounded-xl bg-slate-900 text-slate-100 text-xs space-y-1.5 font-mono border border-slate-800">
                    <div className="flex items-center justify-between text-indigo-400 font-bold">
                      <span className="flex items-center gap-1.5">
                        <Image className="w-3.5 h-3.5" />
                        AI Visual Creative Brief
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-300 whitespace-pre-wrap leading-relaxed">
                      {activeVariant.mediaBrief}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          ) : null}
        </div>

        {/* Right Col: Live Simulated Feed Preview */}
        <div className="space-y-6">
          <Card className="sticky top-6">
            <CardHeader className="bg-slate-50/70 border-b border-slate-100">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Live Feed Simulator
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              {activeVariant && (
                <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-xs space-y-3">
                  {/* Feed Header */}
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-indigo-700 flex items-center justify-center text-white text-xs font-bold shadow-xs">
                      {currentWorkspace?.name ? currentWorkspace.name.substring(0, 2).toUpperCase() : 'OS'}
                    </div>
                    <div className="flex flex-col">
                      <span className="font-bold text-xs text-slate-900 leading-tight">
                        {currentWorkspace?.name}
                      </span>
                      <span className="text-[10px] text-slate-400">Sponsored • Just now</span>
                    </div>
                  </div>

                  {/* Headline */}
                  {activeVariant.headline && (
                    <div className="font-bold text-xs text-slate-900 leading-snug">
                      {activeVariant.headline}
                    </div>
                  )}

                  {/* Body Preview */}
                  <div className="text-xs text-slate-700 whitespace-pre-wrap leading-relaxed">
                    {activeVariant.body}
                  </div>

                  {/* Attached Media Preview in Feed */}
                  {((activeVariant as any).mediaAsset?.accessUrl || activeVariant.mediaAssetUrl) && (
                    <div className="rounded-lg overflow-hidden border border-slate-200 bg-slate-100 max-h-72">
                      <img
                        src={(activeVariant as any).mediaAsset?.accessUrl || activeVariant.mediaAssetUrl!}
                        alt="Post media preview"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}

                  {/* CTA Box */}
                  {activeVariant.callToAction && (
                    <div className="p-2 bg-indigo-50 text-indigo-800 text-xs font-semibold rounded-lg text-center border border-indigo-100">
                      {activeVariant.callToAction}
                    </div>
                  )}

                  {/* Hashtags */}
                  {activeVariant.hashtags && activeVariant.hashtags.length > 0 && (
                    <div className="flex flex-wrap gap-1 text-[11px] text-indigo-600 font-mono">
                      {activeVariant.hashtags.map((h, i) => (
                        <span key={i}>{h}</span>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Revision History Sidebar / Drawer */}
      {showRevisions && (
        <div className="fixed inset-y-0 right-0 w-96 bg-white shadow-2xl z-40 border-l border-slate-200 p-6 overflow-y-auto space-y-4">
          <div className="flex items-center justify-between border-b pb-3">
            <div className="flex items-center gap-2 text-slate-900">
              <History className="w-4 h-4 text-indigo-600" />
              <h3 className="font-bold text-sm">Immutable Revision Log</h3>
            </div>
            <button
              onClick={() => setShowRevisions(false)}
              className="p-1 text-slate-400 hover:text-slate-700"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-3">
            {draft.revisions?.map((rev) => (
              <div
                key={rev.id}
                className="p-3 rounded-xl border border-slate-200 bg-slate-50/50 space-y-1 text-xs"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-indigo-600 font-mono">
                    Rev #{rev.revisionNumber}
                  </span>
                  <Badge variant="outline" className="text-[10px] font-mono">
                    {rev.action}
                  </Badge>
                </div>
                {rev.promptSummary && (
                  <p className="text-[11px] text-slate-600 italic">{rev.promptSummary}</p>
                )}
                <div className="text-[10px] text-slate-400 pt-1">
                  {new Date(rev.createdAt).toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal: Rejection Reason */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <h3 className="text-sm font-bold text-slate-900">Reject Campaign Draft</h3>
            <p className="text-xs text-slate-500">
              Provide clear feedback explaining what changes are required before this post can be approved.
            </p>
            <form onSubmit={handleReject} className="space-y-4">
              <textarea
                required
                rows={3}
                className="w-full text-xs rounded-lg border border-slate-300 p-2.5 focus:ring-2 focus:ring-rose-500 focus:outline-none"
                placeholder="e.g. Please refine the CTA to match our weekend flash sale discount code..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
              />
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowRejectModal(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  className="bg-rose-600 hover:bg-rose-700 text-white"
                >
                  Confirm Rejection
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Regenerate Targeted Field */}
      {showRegenerateModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <h3 className="text-sm font-bold text-slate-900">AI Field Regeneration</h3>
            <p className="text-xs text-slate-500">
              Regenerate a specific field while keeping all other fields strictly preserved.
            </p>
            <form onSubmit={handleRegenerate} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Target Field</label>
                <select
                  value={regenField}
                  onChange={(e: any) => setRegenField(e.target.value)}
                  className="w-full text-xs rounded-lg border border-slate-300 p-2 bg-white"
                >
                  <option value="headline">Headline only</option>
                  <option value="body">Body copy only</option>
                  <option value="callToAction">Call to Action only</option>
                  <option value="hashtags">Hashtags only</option>
                  <option value="all">Entire post</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Custom AI Guidance (optional)
                </label>
                <textarea
                  rows={2}
                  className="w-full text-xs rounded-lg border border-slate-300 p-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  placeholder="e.g. Make it punchier and emphasize limited stock..."
                  value={regenInstructions}
                  onChange={(e) => setRegenInstructions(e.target.value)}
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowRegenerateModal(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={actionInProgress === 'regenerating'}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white gap-1.5"
                >
                  {actionInProgress === 'regenerating' && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Regenerate</span>
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Translate Variant */}
      {showTranslateModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <h3 className="text-sm font-bold text-slate-900">Multilingual Translation</h3>
            <p className="text-xs text-slate-500">
              Translate this native variant to a regional language using cultural context and appropriate vernacular phrasing.
            </p>
            <form onSubmit={handleTranslate} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Target Language</label>
                <select
                  value={targetLanguage}
                  onChange={(e) => setTargetLanguage(e.target.value)}
                  className="w-full text-xs rounded-lg border border-slate-300 p-2 bg-white"
                >
                  {COMMON_TRANSLATION_LANGUAGES.map((l) => (
                    <option key={l} value={l}>
                      {l}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowTranslateModal(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={actionInProgress === 'translating'}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5"
                >
                  {actionInProgress === 'translating' && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Translate &amp; Log Revision</span>
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Cross-Platform Adapt */}
      {showAdaptModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <h3 className="text-sm font-bold text-slate-900">Cross-Platform Copy Adaptation</h3>
            <p className="text-xs text-slate-500">
              Adapt this variant into a platform-native format (e.g. converting an Instagram caption to a LinkedIn thought-leadership post).
            </p>
            <form onSubmit={handleAdapt} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Target Platform</label>
                <select
                  value={targetPlatform}
                  onChange={(e) => setTargetPlatform(e.target.value as SocialPlatform)}
                  className="w-full text-xs rounded-lg border border-slate-300 p-2 bg-white"
                >
                  <option value={SocialPlatform.LINKEDIN}>LinkedIn (Professional structure)</option>
                  <option value={SocialPlatform.TWITTER_X}>Twitter / X (Concise 280-char hook)</option>
                  <option value={SocialPlatform.INSTAGRAM}>Instagram (Visual &amp; hashtag rich)</option>
                  <option value={SocialPlatform.FACEBOOK}>Facebook (Community friendly)</option>
                </select>
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAdaptModal(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={actionInProgress === 'adapting'}
                  className="bg-sky-600 hover:bg-sky-700 text-white gap-1.5"
                >
                  {actionInProgress === 'adapting' && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Create Adapted Variant</span>
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Visual Creative Brief */}
      {showBriefModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 max-w-lg w-full shadow-2xl space-y-4">
            <h3 className="text-sm font-bold text-slate-900">AI Visual Creative Brief Generator</h3>
            <p className="text-xs text-slate-500">
              Generate a structured design and camera direction prompt tailored to this post and brand palette.
            </p>
            <form onSubmit={handleGenerateBrief} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Visual Direction &amp; Preferences (optional)
                </label>
                <textarea
                  rows={2}
                  className="w-full text-xs rounded-lg border border-slate-300 p-2 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  placeholder="e.g. Studio lighting, traditional earthen diyas, elegant model wearing Patola saree..."
                  value={visualPreferences}
                  onChange={(e) => setVisualPreferences(e.target.value)}
                />
              </div>

              {generatedBrief && (
                <div className="p-3 rounded-xl bg-slate-900 text-slate-200 text-xs font-mono max-h-40 overflow-y-auto">
                  {generatedBrief}
                </div>
              )}

              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setShowBriefModal(false);
                    setGeneratedBrief(null);
                  }}
                >
                  Close
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={actionInProgress === 'brief'}
                  className="bg-amber-600 hover:bg-amber-700 text-white gap-1.5"
                >
                  {actionInProgress === 'brief' && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Generate Direction</span>
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: WhatsApp Preview Dispatch */}
      {showWhatsAppModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 max-w-lg w-full shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <Smartphone className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Dispatch WhatsApp Post Preview</h3>
                  <p className="text-[11px] text-slate-500">Send an interactive review notification to reviewers via WhatsApp.</p>
                </div>
              </div>
              <button
                onClick={() => setShowWhatsAppModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm"
              >
                ✕
              </button>
            </div>

            {isLoadingWhatsApp ? (
              <div className="py-8 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />
                <span>Loading registered reviewers...</span>
              </div>
            ) : whatsAppRecipients.length === 0 ? (
              <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs space-y-2">
                <p className="font-semibold flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-amber-600" /> No registered WhatsApp reviewers found.
                </p>
                <p>
                  Register reviewer phone numbers under <strong>Settings &gt; WhatsApp Approval</strong> with explicit consent before dispatching previews.
                </p>
              </div>
            ) : (
              <div className="space-y-4 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1.5">
                    Select Reviewers (Only opted-in numbers can receive notifications):
                  </label>
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {whatsAppRecipients.map((rec) => {
                      const isOptedIn = rec.status === 'OPTED_IN';
                      const isChecked = selectedRecipientIds.includes(rec.id);
                      return (
                        <div
                          key={rec.id}
                          className={`flex items-center justify-between p-2.5 rounded-lg border transition ${
                            !isOptedIn
                              ? 'bg-slate-50 border-slate-200 opacity-60'
                              : isChecked
                              ? 'bg-emerald-50/60 border-emerald-300'
                              : 'bg-white border-slate-200 hover:bg-slate-50'
                          }`}
                        >
                          <label className="flex items-center gap-2.5 cursor-pointer select-none flex-1">
                            <input
                              type="checkbox"
                              disabled={!isOptedIn}
                              checked={isChecked}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedRecipientIds([...selectedRecipientIds, rec.id]);
                                } else {
                                  setSelectedRecipientIds(selectedRecipientIds.filter((id) => id !== rec.id));
                                }
                              }}
                              className="rounded text-emerald-600 focus:ring-emerald-500"
                            />
                            <div>
                              <div className="font-semibold text-slate-900">{rec.displayName}</div>
                              <div className="text-[10px] text-slate-400 font-mono">{rec.phoneNumber}</div>
                            </div>
                          </label>

                          <Badge
                            variant={isOptedIn ? 'success' : 'default'}
                            className="text-[9px] uppercase tracking-wider"
                          >
                            {isOptedIn ? 'Opted In' : 'Opted Out'}
                          </Badge>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {whatsAppHistory.length > 0 && (
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Previous Dispatches for this Draft:</label>
                    <div className="space-y-1.5 max-h-28 overflow-y-auto text-[11px] text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                      {whatsAppHistory.map((h: any) => (
                        <div key={h.id} className="flex items-center justify-between">
                          <span>{h.recipient?.displayName || h.recipient?.phoneNumber}</span>
                          <span className="font-mono text-[10px] text-slate-400 uppercase">{h.status}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowWhatsAppModal(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleDispatchWhatsAppPreview}
                    disabled={isDispatchingWhatsApp || selectedRecipientIds.length === 0}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5"
                  >
                    {isDispatchingWhatsApp ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Send className="w-3.5 h-3.5" />
                    )}
                    <span>Dispatch to {selectedRecipientIds.length} Reviewer(s)</span>
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
      {/* Media Picker Modal */}
      <MediaPickerModal
        isOpen={showMediaPicker}
        onClose={() => setShowMediaPicker(false)}
        onSelect={handleSelectMedia}
        selectedAssetId={(activeVariant as any)?.mediaAssetId}
      />
    </div>
  );
}
