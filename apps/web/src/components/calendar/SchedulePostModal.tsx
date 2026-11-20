'use client';

import React, { useState, useEffect } from 'react';
import { useWorkspace } from '@/lib/workspace-context';
import { apiClient, ApiError } from '@/lib/api-client';
import {
  ContentDraftDto,
  SocialAccountDto,
  SocialPlatform,
  SocialAccountType,
  ScheduledPostDto,
  DraftStatus,
} from '@packages/shared';
import {
  X,
  Calendar as CalendarIcon,
  Clock,
  Sparkles,
  Share2,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Globe,
  Instagram,
  Facebook,
  Linkedin,
  Twitter,
  ArrowRight,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Alert } from '@/components/ui/Alert';

interface SchedulePostModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScheduled: (post: ScheduledPostDto) => void;
  preselectedDraftId?: string | null;
  preselectedDate?: Date | null;
}

export function SchedulePostModal({
  isOpen,
  onClose,
  onScheduled,
  preselectedDraftId,
  preselectedDate,
}: SchedulePostModalProps) {
  const { currentWorkspace } = useWorkspace();
  const workspaceId = currentWorkspace?.id;

  const [approvedDrafts, setApprovedDrafts] = useState<ContentDraftDto[]>([]);
  const [socialAccounts, setSocialAccounts] = useState<SocialAccountDto[]>([]);
  const [selectedDraftId, setSelectedDraftId] = useState<string>('');
  const [selectedDraft, setSelectedDraft] = useState<ContentDraftDto | null>(null);

  // Target accounts: accountId -> { platform: SocialPlatform, variantId?: string }
  const [selectedTargets, setSelectedTargets] = useState<
    Record<string, { platform: SocialPlatform; variantId?: string }>
  >({});

  // Scheduling Date & Time
  const [scheduleDate, setScheduleDate] = useState<string>('');
  const [scheduleTime, setScheduleTime] = useState<string>('');
  const [timezone, setTimezone] = useState<string>('UTC');

  const [isLoadingInitial, setIsLoadingInitial] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Initialize timezone from browser
  useEffect(() => {
    try {
      const userTz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      if (userTz) setTimezone(userTz);
    } catch {
      setTimezone('UTC');
    }
  }, []);

  // Set default initial date & time (1 hour from now or preselected date)
  useEffect(() => {
    if (!isOpen) return;

    const base = preselectedDate ? new Date(preselectedDate) : new Date();
    if (!preselectedDate) {
      base.setHours(base.getHours() + 1, 0, 0, 0); // 1 hour ahead
    } else {
      base.setHours(10, 0, 0, 0); // 10:00 AM on selected date
    }

    const year = base.getFullYear();
    const month = String(base.getMonth() + 1).padStart(2, '0');
    const day = String(base.getDate()).padStart(2, '0');
    const hours = String(base.getHours()).padStart(2, '0');
    const minutes = String(base.getMinutes()).padStart(2, '0');

    setScheduleDate(`${year}-${month}-${day}`);
    setScheduleTime(`${hours}:${minutes}`);
    setErrorMessage(null);
    setSuccessMessage(null);
  }, [isOpen, preselectedDate]);

  // Load Approved Drafts & Connected Accounts
  useEffect(() => {
    if (!isOpen || !workspaceId) return;

    let isMounted = true;
    setIsLoadingInitial(true);

    const loadData = async () => {
      try {
        const [draftsRes, accountsRes] = await Promise.all([
          apiClient<any>(`workspaces/${workspaceId}/content-drafts?status=APPROVED`),
          apiClient<SocialAccountDto[]>(`workspaces/${workspaceId}/social-accounts`),
        ]);

        if (!isMounted) return;

        const draftsList: ContentDraftDto[] = Array.isArray(draftsRes)
          ? draftsRes
          : draftsRes?.items || draftsRes?.data || [];
        setApprovedDrafts(draftsList);

        const accountsList: SocialAccountDto[] = Array.isArray(accountsRes)
          ? accountsRes
          : (accountsRes as any)?.data || [];
        const connectedOnly = accountsList.filter((a) => a.connectionStatus === 'CONNECTED');
        setSocialAccounts(connectedOnly);

        // Preselect draft if passed or default to first
        const targetDraftId = preselectedDraftId || (draftsList.length > 0 ? draftsList[0].id : '');
        setSelectedDraftId(targetDraftId);

        if (targetDraftId) {
          const match = draftsList.find((d) => d.id === targetDraftId);
          if (match) {
            setSelectedDraft(match);
            autoSelectTargets(match, connectedOnly);
          }
        }
      } catch (err: any) {
        if (isMounted) {
          setErrorMessage(err.message || 'Failed to load drafts or social accounts');
        }
      } finally {
        if (isMounted) {
          setIsLoadingInitial(false);
        }
      }
    };

    loadData();

    return () => {
      isMounted = false;
    };
  }, [isOpen, workspaceId, preselectedDraftId]);

  // Auto-select targets based on draft's variants & available connected accounts
  const autoSelectTargets = (draft: ContentDraftDto, accounts: SocialAccountDto[]) => {
    const targets: Record<string, { platform: SocialPlatform; variantId?: string }> = {};

    accounts.forEach((acc) => {
      let platform = SocialPlatform.FACEBOOK;
      if (
        acc.accountType === SocialAccountType.INSTAGRAM_BUSINESS ||
        acc.accountType === SocialAccountType.INSTAGRAM_CREATOR
      ) {
        platform = SocialPlatform.INSTAGRAM;
      }

      // Check if draft has variant for this platform
      const matchingVariant = draft.variants?.find((v) => v.platform === platform);
      if (matchingVariant) {
        targets[acc.id] = {
          platform,
          variantId: matchingVariant.id,
        };
      }
    });

    setSelectedTargets(targets);
  };

  const handleDraftChange = (draftId: string) => {
    setSelectedDraftId(draftId);
    const match = approvedDrafts.find((d) => d.id === draftId) || null;
    setSelectedDraft(match);
    if (match) {
      autoSelectTargets(match, socialAccounts);
    } else {
      setSelectedTargets({});
    }
  };

  const toggleTargetAccount = (acc: SocialAccountDto) => {
    setSelectedTargets((prev) => {
      const copy = { ...prev };
      if (copy[acc.id]) {
        delete copy[acc.id];
      } else {
        let platform = SocialPlatform.FACEBOOK;
        if (
          acc.accountType === SocialAccountType.INSTAGRAM_BUSINESS ||
          acc.accountType === SocialAccountType.INSTAGRAM_CREATOR
        ) {
          platform = SocialPlatform.INSTAGRAM;
        }
        const matchingVariant = selectedDraft?.variants?.find((v) => v.platform === platform);
        copy[acc.id] = {
          platform,
          variantId: matchingVariant?.id,
        };
      }
      return copy;
    });
  };

  const handleVariantChange = (accountId: string, variantId: string) => {
    setSelectedTargets((prev) => ({
      ...prev,
      [accountId]: {
        ...prev[accountId],
        variantId: variantId || undefined,
      },
    }));
  };

  // Quick preset buttons
  const applyPreset = (preset: '1h' | 'tomorrow_morning' | 'tomorrow_evening' | 'monday') => {
    const d = new Date();
    if (preset === '1h') {
      d.setHours(d.getHours() + 1);
    } else if (preset === 'tomorrow_morning') {
      d.setDate(d.getDate() + 1);
      d.setHours(9, 0, 0, 0);
    } else if (preset === 'tomorrow_evening') {
      d.setDate(d.getDate() + 1);
      d.setHours(18, 0, 0, 0);
    } else if (preset === 'monday') {
      const day = d.getDay();
      const distance = (8 - day) % 7 || 7;
      d.setDate(d.getDate() + distance);
      d.setHours(10, 0, 0, 0);
    }

    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');

    setScheduleDate(`${year}-${month}-${day}`);
    setScheduleTime(`${hours}:${minutes}`);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!selectedDraftId) {
      setErrorMessage('Please select an approved draft to schedule.');
      return;
    }

    const targetEntries = Object.entries(selectedTargets);
    if (targetEntries.length === 0) {
      setErrorMessage('Please select at least one social media account to publish to.');
      return;
    }

    if (!scheduleDate || !scheduleTime) {
      setErrorMessage('Please specify both a date and time for publication.');
      return;
    }

    // Validate 5-minute future buffer
    const scheduledDateTime = new Date(`${scheduleDate}T${scheduleTime}:00`);
    if (isNaN(scheduledDateTime.getTime())) {
      setErrorMessage('Invalid scheduled date or time.');
      return;
    }

    const minAllowed = new Date(Date.now() + 4 * 60 * 1000); // 4-5 min buffer
    if (scheduledDateTime < minAllowed) {
      setErrorMessage('Scheduled time must be at least 5 minutes in the future.');
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        draftId: selectedDraftId,
        scheduledAt: scheduledDateTime.toISOString(),
        timezone: timezone || 'UTC',
        targets: targetEntries.map(([socialAccountId, config]) => ({
          socialAccountId,
          platform: config.platform,
          variantId: config.variantId,
        })),
      };

      const result = await apiClient<any>(
        `/workspaces/${workspaceId}/scheduled-posts`,
        {
          method: 'POST',
          body: JSON.stringify(payload),
        },
      );

      const postData: ScheduledPostDto = result.data || result;
      setSuccessMessage('Post successfully scheduled!');
      setTimeout(() => {
        onScheduled(postData);
        onClose();
      }, 700);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to schedule post');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="relative bg-white rounded-2xl shadow-2xl border border-slate-200/90 w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in-50 zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-slate-50 to-indigo-50/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-sm shadow-indigo-200">
              <CalendarIcon className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Schedule Social Post</h2>
              <p className="text-xs text-slate-500">
                Automate multi-platform publication for approved content
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 flex items-center justify-center transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {errorMessage && (
            <Alert variant="danger">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            </Alert>
          )}

          {successMessage && (
            <Alert variant="success">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{successMessage}</span>
              </div>
            </Alert>
          )}

          {isLoadingInitial ? (
            <div className="py-16 flex flex-col items-center justify-center gap-3 text-slate-400">
              <Loader2 className="w-7 h-7 animate-spin text-indigo-600" />
              <span className="text-sm">Loading approved drafts and social accounts...</span>
            </div>
          ) : approvedDrafts.length === 0 ? (
            <div className="py-12 px-6 text-center border-2 border-dashed border-slate-200 rounded-xl">
              <Sparkles className="w-10 h-10 text-amber-500 mx-auto mb-3" />
              <h3 className="text-base font-semibold text-slate-900 mb-1">No Approved Drafts Found</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto mb-4">
                To schedule a post, you need at least one draft in <strong>APPROVED</strong> status
                that passed four-eyes review or workspace verification.
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  onClose();
                  window.location.href = '/content/drafts';
                }}
              >
                Go to Drafts &amp; Approvals
              </Button>
            </div>
          ) : (
            <form id="schedule-post-form" onSubmit={handleSubmit} className="space-y-6">
              {/* Draft Selection */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
                  1. Select Approved Content Draft <span className="text-rose-500">*</span>
                </label>
                <select
                  value={selectedDraftId}
                  onChange={(e) => handleDraftChange(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-sm font-medium text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition"
                >
                  {approvedDrafts.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.title} (Revision #{d.revisions?.length || 1})
                    </option>
                  ))}
                </select>

                {selectedDraft && (
                  <div className="mt-2.5 p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-xs text-slate-600 flex items-start gap-2.5">
                    <Sparkles className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-slate-800 truncate">
                        {selectedDraft.title}
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5 line-clamp-2">
                        {selectedDraft.variants?.[0]?.body || 'No variant preview text available'}
                      </div>
                      <div className="mt-2 flex items-center gap-2">
                        <span className="text-[10px] text-slate-400">Available Variants:</span>
                        {selectedDraft.variants?.map((v) => (
                          <Badge key={v.id} variant="purple" className="text-[10px] py-0 px-2">
                            {v.platform}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Social Accounts & Platforms */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">
                    2. Target Social Accounts &amp; Variants <span className="text-rose-500">*</span>
                  </label>
                  <span className="text-[11px] text-slate-400">
                    {Object.keys(selectedTargets).length} selected
                  </span>
                </div>

                {socialAccounts.length === 0 ? (
                  <div className="p-4 rounded-xl border border-amber-200 bg-amber-50/60 text-xs text-amber-800 flex items-center justify-between">
                    <div>
                      <p className="font-semibold">No active social accounts connected</p>
                      <p className="text-[11px] text-amber-700 mt-0.5">
                        Connect Facebook Pages or Instagram Professional accounts in settings.
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        onClose();
                        window.location.href = '/settings/social-accounts';
                      }}
                      className="bg-white shrink-0"
                    >
                      Connect Accounts
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {socialAccounts.map((acc) => {
                      const isSelected = !!selectedTargets[acc.id];
                      const isIg =
                        acc.accountType === SocialAccountType.INSTAGRAM_BUSINESS ||
                        acc.accountType === SocialAccountType.INSTAGRAM_CREATOR;

                      return (
                        <div
                          key={acc.id}
                          className={`p-3 rounded-xl border transition-all ${isSelected
                              ? 'bg-indigo-50/40 border-indigo-300 ring-1 ring-indigo-200'
                              : 'bg-white border-slate-200 hover:border-slate-300'
                            }`}
                        >
                          <div className="flex items-center justify-between gap-3">
                            <label className="flex items-center gap-3 cursor-pointer min-w-0 flex-1">
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => toggleTargetAccount(acc)}
                                className="w-4 h-4 rounded text-indigo-600 border-slate-300 focus:ring-indigo-500 cursor-pointer"
                              />
                              <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-600 shrink-0">
                                {isIg ? (
                                  <Instagram className="w-4 h-4 text-pink-600" />
                                ) : (
                                  <Facebook className="w-4 h-4 text-blue-600" />
                                )}
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="text-xs font-semibold text-slate-900 truncate">
                                  {acc.accountName}
                                </div>
                                <div className="text-[10px] text-slate-400 capitalize">
                                  {acc.accountType.replace(/_/g, ' ').toLowerCase()}
                                </div>
                              </div>
                            </label>

                            {/* Variant picker for this target */}
                            {isSelected && selectedDraft?.variants && selectedDraft.variants.length > 1 && (
                              <div className="flex items-center gap-1.5 shrink-0">
                                <span className="text-[10px] text-slate-400">Variant:</span>
                                <select
                                  value={selectedTargets[acc.id]?.variantId || ''}
                                  onChange={(e) => handleVariantChange(acc.id, e.target.value)}
                                  className="text-xs py-1 px-2 border border-slate-200 rounded-lg bg-white text-slate-700 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
                                >
                                  {selectedDraft.variants.map((v) => (
                                    <option key={v.id} value={v.id}>
                                      {v.platform} ({v.headline ? v.headline.slice(0, 18) + '...' : 'Default'})
                                    </option>
                                  ))}
                                </select>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Schedule Date & Time */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
                  3. Scheduled Publishing Time <span className="text-rose-500">*</span>
                </label>

                {/* Quick preset chips */}
                <div className="flex flex-wrap gap-2 mb-3">
                  <button
                    type="button"
                    onClick={() => applyPreset('1h')}
                    className="px-2.5 py-1 text-xs rounded-lg border border-slate-200 bg-slate-50 hover:bg-indigo-50 hover:border-indigo-200 hover:text-indigo-700 text-slate-600 transition"
                  >
                    +1 Hour
                  </button>
                  <button
                    type="button"
                    onClick={() => applyPreset('tomorrow_morning')}
                    className="px-2.5 py-1 text-xs rounded-lg border border-slate-200 bg-slate-50 hover:bg-indigo-50 hover:border-indigo-200 hover:text-indigo-700 text-slate-600 transition"
                  >
                    Tomorrow 9:00 AM
                  </button>
                  <button
                    type="button"
                    onClick={() => applyPreset('tomorrow_evening')}
                    className="px-2.5 py-1 text-xs rounded-lg border border-slate-200 bg-slate-50 hover:bg-indigo-50 hover:border-indigo-200 hover:text-indigo-700 text-slate-600 transition"
                  >
                    Tomorrow 6:00 PM
                  </button>
                  <button
                    type="button"
                    onClick={() => applyPreset('monday')}
                    className="px-2.5 py-1 text-xs rounded-lg border border-slate-200 bg-slate-50 hover:bg-indigo-50 hover:border-indigo-200 hover:text-indigo-700 text-slate-600 transition"
                  >
                    Next Monday 10:00 AM
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] text-slate-500 mb-1">Date</label>
                    <input
                      type="date"
                      value={scheduleDate}
                      onChange={(e) => setScheduleDate(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-sm font-medium text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-500 mb-1">Time</label>
                    <input
                      type="time"
                      value={scheduleTime}
                      onChange={(e) => setScheduleTime(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-sm font-medium text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                      required
                    />
                  </div>
                </div>

                <div className="mt-2.5 flex items-center justify-between text-[11px] text-slate-500">
                  <div className="flex items-center gap-1.5">
                    <Globe className="w-3.5 h-3.5 text-slate-400" />
                    <span>Timezone: <strong>{timezone}</strong></span>
                  </div>
                  <span className="text-slate-400">Must be $\ge$ 5 minutes in future</span>
                </div>
              </div>
            </form>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
          <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>

          <Button
            type="submit"
            form="schedule-post-form"
            size="sm"
            disabled={
              isSubmitting ||
              isLoadingInitial ||
              approvedDrafts.length === 0 ||
              Object.keys(selectedTargets).length === 0
            }
            className="flex items-center gap-2"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Scheduling...</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>Confirm &amp; Schedule</span>
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
