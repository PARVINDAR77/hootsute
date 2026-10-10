'use client';

import React, { useState } from 'react';
import { useWorkspace } from '@/lib/workspace-context';
import { apiClient } from '@/lib/api-client';
import {
  ScheduledPostDto,
  ScheduledPostTargetDto,
  ScheduledPostStatus,
  PublishTargetStatus,
  SocialPlatform,
  SocialAccountType,
} from '@packages/shared';
import {
  X,
  Calendar,
  Clock,
  Globe,
  Share2,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  RotateCw,
  Search,
  Instagram,
  Facebook,
  Loader2,
  Sparkles,
  ExternalLink,
  Trash2,
  Edit2,
  Eye,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Alert } from '@/components/ui/Alert';
import {
  formatFullDateTime,
  formatTime,
  STATUS_UI_CONFIG,
  TARGET_STATUS_UI_CONFIG,
} from '@/lib/calendar-utils';

interface PostInspectorModalProps {
  post: ScheduledPostDto | null;
  isOpen: boolean;
  onClose: () => void;
  onPostUpdated: () => void;
}

export function PostInspectorModal({
  post,
  isOpen,
  onClose,
  onPostUpdated,
}: PostInspectorModalProps) {
  const { currentWorkspace } = useWorkspace();
  const workspaceId = currentWorkspace?.id;

  const [activeTab, setActiveTab] = useState<'details' | 'reschedule' | 'cancel'>('details');
  const [rescheduleDate, setRescheduleDate] = useState<string>('');
  const [rescheduleTime, setRescheduleTime] = useState<string>('');
  const [cancelReason, setCancelReason] = useState<string>('');

  const [isProcessingAction, setIsProcessingAction] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  if (!isOpen || !post) return null;

  const statusConfig = STATUS_UI_CONFIG[post.status] || {
    label: post.status,
    bg: 'bg-slate-100',
    text: 'text-slate-700',
    border: 'border-slate-200',
    dot: 'bg-slate-400',
  };

  const isEditable =
    post.status === ScheduledPostStatus.SCHEDULED ||
    post.status === ScheduledPostStatus.FAILED ||
    post.status === ScheduledPostStatus.NEEDS_REAPPROVAL;

  const handleReschedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rescheduleDate || !rescheduleTime) {
      setActionError('Please select both date and time to reschedule.');
      return;
    }

    const newDateTime = new Date(`${rescheduleDate}T${rescheduleTime}:00`);
    if (isNaN(newDateTime.getTime())) {
      setActionError('Invalid date or time provided.');
      return;
    }

    const minAllowed = new Date(Date.now() + 4 * 60 * 1000);
    if (newDateTime < minAllowed) {
      setActionError('Rescheduled time must be at least 5 minutes in the future.');
      return;
    }

    setIsProcessingAction('reschedule');
    setActionError(null);
    setActionSuccess(null);

    try {
      await apiClient(
        `publishing/workspaces/${workspaceId}/scheduled-posts/${post.id}/reschedule`,
        {
          method: 'PATCH',
          body: JSON.stringify({
            scheduledAt: newDateTime.toISOString(),
            timezone: post.timezone || 'UTC',
          }),
        },
      );

      setActionSuccess('Post successfully rescheduled!');
      setTimeout(() => {
        onPostUpdated();
        setActiveTab('details');
      }, 700);
    } catch (err: any) {
      setActionError(err.message || 'Failed to reschedule post');
    } finally {
      setIsProcessingAction(null);
    }
  };

  const handleCancelPost = async () => {
    setIsProcessingAction('cancel');
    setActionError(null);
    setActionSuccess(null);

    try {
      await apiClient(
        `publishing/workspaces/${workspaceId}/scheduled-posts/${post.id}/cancel`,
        {
          method: 'POST',
          body: JSON.stringify({
            reason: cancelReason || 'Cancelled by workspace editor',
          }),
        },
      );

      setActionSuccess('Scheduled post cancelled.');
      setTimeout(() => {
        onPostUpdated();
        onClose();
      }, 700);
    } catch (err: any) {
      setActionError(err.message || 'Failed to cancel post');
    } finally {
      setIsProcessingAction(null);
    }
  };

  const handleRetryTarget = async (targetId: string) => {
    setIsProcessingAction(`retry-${targetId}`);
    setActionError(null);
    setActionSuccess(null);

    try {
      await apiClient(
        `publishing/workspaces/${workspaceId}/scheduled-posts/${post.id}/targets/${targetId}/retry`,
        {
          method: 'POST',
        },
      );

      setActionSuccess('Target retry dispatched.');
      setTimeout(() => {
        onPostUpdated();
      }, 800);
    } catch (err: any) {
      setActionError(err.message || 'Failed to retry target');
    } finally {
      setIsProcessingAction(null);
    }
  };

  const handleReconcileTarget = async (targetId: string) => {
    setIsProcessingAction(`reconcile-${targetId}`);
    setActionError(null);
    setActionSuccess(null);

    try {
      const res = await apiClient<any>(
        `publishing/workspaces/${workspaceId}/scheduled-posts/${post.id}/targets/${targetId}/retry`,
        {
          method: 'POST',
        },
      );

      setActionSuccess(res?.message || 'Platform reconciliation completed.');
      setTimeout(() => {
        onPostUpdated();
      }, 800);
    } catch (err: any) {
      setActionError(err.message || 'Failed to reconcile target');
    } finally {
      setIsProcessingAction(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="relative bg-white rounded-2xl shadow-2xl border border-slate-200/90 w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in-50 zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-3">
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${statusConfig.bg} ${statusConfig.text} ${statusConfig.border}`}
            >
              <span className={`w-2 h-2 rounded-full ${statusConfig.dot}`} />
              {statusConfig.label}
            </span>
            <div className="text-xs text-slate-500 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span>{formatFullDateTime(post.scheduledAt, post.timezone)}</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 flex items-center justify-center transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action feedback banners */}
        {actionError && (
          <div className="px-6 pt-4">
            <Alert variant="danger">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{actionError}</span>
              </div>
            </Alert>
          </div>
        )}

        {actionSuccess && (
          <div className="px-6 pt-4">
            <Alert variant="success">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{actionSuccess}</span>
              </div>
            </Alert>
          </div>
        )}

        {/* Tab switcher */}
        <div className="px-6 border-b border-slate-100 flex items-center gap-4 text-xs font-semibold text-slate-500">
          <button
            onClick={() => setActiveTab('details')}
            className={`py-3 border-b-2 transition ${
              activeTab === 'details'
                ? 'border-indigo-600 text-indigo-700'
                : 'border-transparent hover:text-slate-900'
            }`}
          >
            Post Details &amp; Targets
          </button>

          {isEditable && (
            <button
              onClick={() => {
                const current = new Date(post.scheduledAt);
                const year = current.getFullYear();
                const month = String(current.getMonth() + 1).padStart(2, '0');
                const day = String(current.getDate()).padStart(2, '0');
                const hours = String(current.getHours()).padStart(2, '0');
                const minutes = String(current.getMinutes()).padStart(2, '0');
                setRescheduleDate(`${year}-${month}-${day}`);
                setRescheduleTime(`${hours}:${minutes}`);
                setActiveTab('reschedule');
              }}
              className={`py-3 border-b-2 transition ${
                activeTab === 'reschedule'
                  ? 'border-indigo-600 text-indigo-700'
                  : 'border-transparent hover:text-slate-900'
              }`}
            >
              Reschedule Time
            </button>
          )}

          {post.status === ScheduledPostStatus.SCHEDULED && (
            <button
              onClick={() => setActiveTab('cancel')}
              className={`py-3 border-b-2 transition ${
                activeTab === 'cancel'
                  ? 'border-rose-600 text-rose-700'
                  : 'border-transparent hover:text-rose-600'
              }`}
            >
              Cancel Post
            </button>
          )}
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {activeTab === 'details' && (
            <>
              {/* Draft info */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Content Draft
                  </div>
                  <Badge variant="outline" className="text-[10px]">
                    Approved Revision #{post.approvedRevisionNumber}
                  </Badge>
                </div>
                <h3 className="text-base font-semibold text-slate-900">
                  {post.draft?.title || post.contentSnapshot?.title || 'Untitled Draft'}
                </h3>
                <p className="text-xs text-slate-600 mt-2 line-clamp-3 bg-white p-3 rounded-lg border border-slate-200/60 font-sans">
                  {post.contentSnapshot?.variants?.[0]?.body || 'No snapshot text'}
                </p>
                {post.contentSnapshot?.variants?.[0]?.hashtags?.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {post.contentSnapshot.variants[0].hashtags.map((tag, idx) => (
                      <span key={idx} className="text-[11px] text-indigo-600 font-medium">
                        #{tag.replace(/^#/, '')}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Target Platforms & Results */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-3 flex items-center justify-between">
                  <span>Publishing Targets ({post.targets?.length || 0})</span>
                  <span className="text-[10px] text-slate-400 font-normal">
                    Idempotency protected
                  </span>
                </h4>

                <div className="space-y-3">
                  {post.targets?.map((target) => {
                    const targetConfig = TARGET_STATUS_UI_CONFIG[target.status] || {
                      label: target.status,
                      bg: 'bg-slate-100',
                      text: 'text-slate-700',
                      border: 'border-slate-200',
                    };

                    const isIg = target.platform === SocialPlatform.INSTAGRAM;

                    return (
                      <div
                        key={target.id}
                        className="p-4 rounded-xl border border-slate-200/80 bg-white shadow-xs space-y-3"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center text-slate-600 shrink-0">
                              {isIg ? (
                                <Instagram className="w-5 h-5 text-pink-600" />
                              ) : (
                                <Facebook className="w-5 h-5 text-blue-600" />
                              )}
                            </div>
                            <div>
                              <div className="text-xs font-semibold text-slate-900">
                                {target.socialAccount?.accountName || target.platform}
                              </div>
                              <div className="text-[10px] text-slate-400 capitalize">
                                {target.platform.toLowerCase()} • Attempts: {target.attemptCount || 0} /{' '}
                                {target.maxAttempts}
                              </div>
                            </div>
                          </div>

                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${targetConfig.bg} ${targetConfig.text} ${targetConfig.border}`}
                          >
                            {targetConfig.label}
                          </span>
                        </div>

                        {/* Published Info */}
                        {target.status === PublishTargetStatus.PUBLISHED && (
                          <div className="p-2.5 rounded-lg bg-emerald-50/50 border border-emerald-100 text-xs text-emerald-800 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                              <span>Published ID: {target.externalPostId || target.id}</span>
                            </div>
                            {target.publishedAt && (
                              <span className="text-[10px] text-emerald-600">
                                {formatTime(target.publishedAt, post.timezone)}
                              </span>
                            )}
                          </div>
                        )}

                        {/* Ambiguous Timeout / Needs Reconciliation Banner */}
                        {target.status === PublishTargetStatus.AMBIGUOUS_TIMEOUT && (
                          <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-900 space-y-2">
                            <div className="flex items-start gap-2">
                              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                              <div>
                                <p className="font-semibold">Ambiguous Network Outcome</p>
                                <p className="text-[11px] text-amber-800 mt-0.5">
                                  {target.errorMessage ||
                                    'Request timed out. Reconcile to verify if the post exists on the platform before retrying.'}
                                </p>
                              </div>
                            </div>
                            <div className="flex justify-end gap-2 pt-1">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleReconcileTarget(target.id)}
                                disabled={isProcessingAction !== null}
                                className="bg-white border-amber-300 text-amber-900 hover:bg-amber-100 text-xs py-1 h-auto"
                              >
                                {isProcessingAction === `reconcile-${target.id}` ? (
                                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                ) : (
                                  <Search className="w-3.5 h-3.5 mr-1" />
                                )}
                                Verify &amp; Reconcile
                              </Button>
                            </div>
                          </div>
                        )}

                        {/* Failed error banner & Retry */}
                        {target.status === PublishTargetStatus.FAILED && (
                          <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-900 flex items-center justify-between gap-3">
                            <div className="flex items-start gap-2">
                              <XCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                              <div>
                                <p className="font-semibold">Publishing Failed</p>
                                <p className="text-[11px] text-rose-700 mt-0.5">
                                  {target.errorMessage || 'Unknown error occurred during publishing'}
                                </p>
                              </div>
                            </div>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleRetryTarget(target.id)}
                              disabled={isProcessingAction !== null}
                              className="bg-white border-rose-300 text-rose-900 hover:bg-rose-100 text-xs py-1 h-auto shrink-0"
                            >
                              {isProcessingAction === `retry-${target.id}` ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <RotateCw className="w-3.5 h-3.5 mr-1" />
                              )}
                              Retry Target
                            </Button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          )}

          {activeTab === 'reschedule' && (
            <form onSubmit={handleReschedule} className="space-y-4">
              <div className="p-3 rounded-xl bg-indigo-50/60 border border-indigo-100 text-xs text-indigo-900 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-indigo-600 shrink-0" />
                <span>Select a new future timestamp to reschedule this publication.</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">New Date</label>
                  <input
                    type="date"
                    value={rescheduleDate}
                    onChange={(e) => setRescheduleDate(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-sm font-medium text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">New Time</label>
                  <input
                    type="time"
                    value={rescheduleTime}
                    onChange={(e) => setRescheduleTime(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-sm font-medium text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                    required
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setActiveTab('details')}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={isProcessingAction === 'reschedule'}
                  className="flex items-center gap-1.5"
                >
                  {isProcessingAction === 'reschedule' ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Clock className="w-4 h-4" />
                  )}
                  Save New Schedule
                </Button>
              </div>
            </form>
          )}

          {activeTab === 'cancel' && (
            <div className="space-y-4">
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-900 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>
                  Cancelling will prevent this post and all its targets from being dispatched.
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Cancellation Reason (Optional)
                </label>
                <textarea
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder="e.g., Campaign date changed, promotional offer expired"
                  rows={3}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-rose-500/20 focus:border-rose-600"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setActiveTab('details')}
                >
                  Go Back
                </Button>
                <Button
                  type="button"
                  variant="danger"
                  size="sm"
                  onClick={handleCancelPost}
                  disabled={isProcessingAction === 'cancel'}
                  className="flex items-center gap-1.5"
                >
                  {isProcessingAction === 'cancel' ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Trash2 className="w-4 h-4" />
                  )}
                  Confirm Cancellation
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
          <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
            <Globe className="w-3.5 h-3.5" />
            <span>Timezone: {post.timezone || 'UTC'}</span>
          </div>
          <Button variant="outline" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}
