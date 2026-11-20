'use client';

import React, { useEffect, useState, useCallback, useMemo, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useWorkspace } from '@/lib/workspace-context';
import { apiClient, unwrapData, unwrapList } from '@/lib/api-client';
import {
  Button,
  Badge,
  Alert,
  EmptyState,
  PlatformBadge,
  ORDERED_PLATFORMS,
  normalizePlatformKey,
} from '@/components/ui';
import { BulkRocketVisual } from '@/components/marketing/FuturisticVisuals';
import { ROUTES } from '@/lib/constants';
import {
  ContentDraftDto,
  DraftStatus,
  SocialAccountDto,
  BulkPublishDispatchMode,
  BulkPublishResponseDto,
} from '@packages/shared';
import {
  Send,
  CheckCircle2,
  Clock,
  Share2,
  Sparkles,
  Calendar,
  RefreshCw,
  ArrowRight,
  CheckSquare,
  Square,
  Zap,
  ShieldCheck,
  FileText,
} from 'lucide-react';

function BulkPublishContent() {
  const searchParams = useSearchParams();
  const { currentWorkspace } = useWorkspace();
  const workspaceId = currentWorkspace?.id;

  const [drafts, setDrafts] = useState<ContentDraftDto[]>([]);
  const [accounts, setAccounts] = useState<SocialAccountDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const [selectedDraftIds, setSelectedDraftIds] = useState<string[]>([]);
  const [selectedAccountIds, setSelectedAccountIds] = useState<string[]>([]);
  const [platformFilter, setPlatformFilter] = useState<string>('ALL');

  const [dispatchMode, setDispatchMode] = useState<BulkPublishDispatchMode>('IMMEDIATE');
  const [scheduledAt, setScheduledAt] = useState<string>(() => {
    const dt = new Date(Date.now() + 30 * 60 * 1000);
    return dt.toISOString().slice(0, 16);
  });
  const [staggerMinutes, setStaggerMinutes] = useState<number>(15);
  const [autoAdaptMissingPlatform, setAutoAdaptMissingPlatform] = useState<boolean>(true);

  const [isLaunching, setIsLaunching] = useState(false);
  const [isApproving, setIsApproving] = useState(false);
  const [launchResult, setLaunchResult] = useState<BulkPublishResponseDto | null>(null);

  const canApprove =
    currentWorkspace?.currentUserRole === 'OWNER' ||
    currentWorkspace?.currentUserRole === 'ADMIN';

  const loadData = useCallback(async () => {
    if (!workspaceId) return;
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const [draftsRes, accountsRes] = await Promise.all([
        apiClient(`/workspaces/${workspaceId}/content-drafts`),
        apiClient(`/workspaces/${workspaceId}/social-accounts`),
      ]);
      const draftList = unwrapList<ContentDraftDto>(draftsRes);
      const accountList = unwrapList<SocialAccountDto>(accountsRes).filter(
        (a) => a.connectionStatus === 'CONNECTED',
      );
      setDrafts(draftList);
      setAccounts(accountList);

      const queryDraftIds = searchParams.get('draftIds');
      if (queryDraftIds) {
        setSelectedDraftIds(queryDraftIds.split(',').filter(Boolean));
      } else {
        const firstApproved = draftList.find((d) => d.status === DraftStatus.APPROVED);
        if (firstApproved) setSelectedDraftIds([firstApproved.id]);
      }

      setSelectedAccountIds(accountList.map((a) => a.id));
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to load drafts and connected accounts');
    } finally {
      setIsLoading(false);
    }
  }, [workspaceId, searchParams]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const approvedDrafts = useMemo(
    () => drafts.filter((d) => d.status === DraftStatus.APPROVED),
    [drafts],
  );
  const pendingDrafts = useMemo(
    () => drafts.filter((d) => d.status !== DraftStatus.APPROVED),
    [drafts],
  );

  const filteredAccounts = useMemo(() => {
    if (platformFilter === 'ALL') return accounts;
    return accounts.filter((a) => normalizePlatformKey(a.provider) === platformFilter);
  }, [accounts, platformFilter]);

  const toggleDraft = (id: string) => {
    setSelectedDraftIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const toggleAccount = (id: string) => {
    setSelectedAccountIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const handleQuickApproveAllPending = async () => {
    if (!workspaceId || !canApprove || pendingDrafts.length === 0) return;
    setIsApproving(true);
    setErrorMsg(null);
    try {
      const res = await apiClient(`/workspaces/${workspaceId}/content-drafts/bulk-approve`, {
        method: 'POST',
        body: JSON.stringify({ draftIds: pendingDrafts.map((d) => d.id) }),
      });
      const data = unwrapData<any>(res);
      setSuccessMsg(
        `Approved ${data?.approvedIds?.length || pendingDrafts.length} draft(s). Ready for bulk launch!`,
      );
      await loadData();
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to bulk approve drafts');
    } finally {
      setIsApproving(false);
    }
  };

  const handleLaunchBulkPublish = async () => {
    if (!workspaceId) return;
    if (selectedDraftIds.length === 0) {
      setErrorMsg('Please select at least one APPROVED campaign draft.');
      return;
    }
    if (selectedAccountIds.length === 0) {
      setErrorMsg('Please select at least one connected social account.');
      return;
    }

    setIsLaunching(true);
    setErrorMsg(null);
    setSuccessMsg(null);
    setLaunchResult(null);

    try {
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
      const payload = {
        draftIds: selectedDraftIds,
        socialAccountIds: selectedAccountIds,
        dispatchMode,
        scheduledAt:
          dispatchMode !== 'IMMEDIATE' ? new Date(scheduledAt).toISOString() : undefined,
        timezone,
        staggerMinutes: dispatchMode === 'STAGGERED' ? staggerMinutes : undefined,
        autoAdaptMissingPlatform,
      };

      const res = await apiClient(`/workspaces/${workspaceId}/scheduled-posts/bulk-publish`, {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      const data = unwrapData<BulkPublishResponseDto>(res);
      setLaunchResult(data);
      setSuccessMsg(
        dispatchMode === 'IMMEDIATE'
          ? `Bulk broadcast dispatched across ${data.totalTargetsQueued} channel target(s)!`
          : `Bulk schedule created for ${data.totalDraftsProcessed} campaign(s) across ${data.totalTargetsQueued} target(s)!`,
      );
    } catch (err: any) {
      setErrorMsg(err?.message || 'Bulk publish failed');
    } finally {
      setIsLaunching(false);
    }
  };

  const totalDeliveries = selectedDraftIds.length * selectedAccountIds.length;
  const step1Done = selectedDraftIds.length > 0;
  const step2Done = selectedAccountIds.length > 0;

  return (
    <div className="max-w-[1400px] mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#111827] dark:text-white">
              Bulk Publish
            </h1>
            <Badge variant="purple">8 Social Networks</Badge>
          </div>
          <p className="text-sm text-[#64748B] dark:text-slate-400 mt-1">
            Publish multiple approved campaigns across all your connected accounts at once.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={loadData}
            isLoading={isLoading}
            leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
          >
            Refresh
          </Button>
          <Link href={ROUTES.SETTINGS_SOCIAL_ACCOUNTS}>
            <Button variant="outline" size="sm" leftIcon={<Share2 className="w-3.5 h-3.5" />}>
              Accounts ({accounts.length})
            </Button>
          </Link>
          <Link href={ROUTES.CONTENT_STUDIO}>
            <Button variant="primary" size="sm" leftIcon={<Sparkles className="w-3.5 h-3.5" />}>
              AI Studio
            </Button>
          </Link>
        </div>
      </div>

      {/* 3-Step Visual Wizard Bar (Matching Reference Image) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {[
          { num: 1, label: 'Select Content', done: step1Done, sub: `${selectedDraftIds.length} approved selected` },
          { num: 2, label: 'Choose Accounts', done: step2Done, sub: `${selectedAccountIds.length} channels selected` },
          { num: 3, label: 'Review & Publish', done: !!launchResult, sub: `${totalDeliveries} total deliveries` },
        ].map((step) => (
          <div
            key={step.num}
            className={`flex items-center gap-3 p-3.5 rounded-2xl border transition-all ${
              step.done
                ? 'bg-[#F1EBFF]/70 dark:bg-[#7138F5]/20 border-[#7138F5]/40'
                : 'bg-white dark:bg-[#0F142B]/80 border-[#E7EAF2] dark:border-[#1E2749]'
            }`}
          >
            <div
              className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-extrabold shrink-0 ${
                step.done
                  ? 'bg-gradient-to-r from-[#7138F5] to-[#2878FF] text-white shadow-glow-purple'
                  : 'bg-[#F7F8FC] dark:bg-white/10 text-[#64748B] dark:text-slate-300'
              }`}
            >
              {step.done ? <CheckCircle2 className="w-4 h-4" /> : step.num}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-extrabold text-[#111827] dark:text-white truncate">
                {step.num}. {step.label}
              </p>
              <p className="text-[11px] text-[#64748B] dark:text-slate-400 truncate">{step.sub}</p>
            </div>
          </div>
        ))}
      </div>

      {errorMsg && <Alert type="error" message={errorMsg} onClose={() => setErrorMsg(null)} />}
      {successMsg && (
        <Alert type="success" message={successMsg} onClose={() => setSuccessMsg(null)} />
      )}

      {/* Main Split: Wizard Panels (8 cols) + 3D Rocket & Delivery Tracker (4 cols) */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        <div className="xl:col-span-8 space-y-6">
          {/* Step 1: Select Approved Campaigns */}
          <div className="rounded-3xl p-6 bg-white dark:bg-[#0F142B]/90 border border-[#E7EAF2] dark:border-[#1E2749] shadow-soft dark:shadow-none space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-extrabold text-[#111827] dark:text-white">
                  1. Select Approved Campaigns
                </h2>
                <p className="text-xs text-[#64748B] dark:text-slate-400">
                  Only approved drafts can be dispatched in bulk.
                </p>
              </div>
              <div className="flex items-center gap-2">
                {canApprove && pendingDrafts.length > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleQuickApproveAllPending}
                    isLoading={isApproving}
                    leftIcon={<ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />}
                  >
                    Approve {pendingDrafts.length} Pending
                  </Button>
                )}
                {approvedDrafts.length > 0 && (
                  <button
                    type="button"
                    onClick={() =>
                      setSelectedDraftIds(
                        selectedDraftIds.length === approvedDrafts.length
                          ? []
                          : approvedDrafts.map((d) => d.id),
                      )
                    }
                    className="text-xs font-bold text-[#7138F5] dark:text-[#20C8E8] hover:underline"
                  >
                    {selectedDraftIds.length === approvedDrafts.length ? 'Clear' : 'Select All'}
                  </button>
                )}
              </div>
            </div>

            {approvedDrafts.length === 0 ? (
              <EmptyState
                icon={<FileText className="w-5 h-5" />}
                title="No approved drafts ready"
                description="Generate a campaign in AI Studio or approve pending drafts above to unlock bulk publishing."
              />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-72 overflow-y-auto pr-1">
                {approvedDrafts.map((draft) => {
                  const selected = selectedDraftIds.includes(draft.id);
                  return (
                    <button
                      key={draft.id}
                      type="button"
                      onClick={() => toggleDraft(draft.id)}
                      className={`text-left p-3.5 rounded-2xl border flex items-start gap-3 transition-all ${
                        selected
                          ? 'bg-[#F1EBFF]/75 dark:bg-[#7138F5]/20 border-[#7138F5] shadow-xs'
                          : 'bg-[#F7F8FC] dark:bg-white/[0.03] border-[#E7EAF2] dark:border-white/10 hover:border-[#7138F5]/40'
                      }`}
                    >
                      {selected ? (
                        <CheckSquare className="w-4 h-4 text-[#7138F5] dark:text-[#20C8E8] shrink-0 mt-0.5" />
                      ) : (
                        <Square className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-[#111827] dark:text-white truncate">
                          {draft.title}
                        </p>
                        <div className="mt-1.5 flex items-center gap-1 flex-wrap">
                          {(draft.variants || []).slice(0, 5).map((v) => (
                            <PlatformBadge key={v.id} platform={v.platform} variant="icon" size="sm" />
                          ))}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Step 2: Select Connected Accounts */}
          <div className="rounded-3xl p-6 bg-white dark:bg-[#0F142B]/90 border border-[#E7EAF2] dark:border-[#1E2749] shadow-soft dark:shadow-none space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-extrabold text-[#111827] dark:text-white">
                  2. Select Target Accounts
                </h2>
                <p className="text-xs text-[#64748B] dark:text-slate-400">
                  Choose any combination of connected accounts across all 8 networks.
                </p>
              </div>
              {accounts.length > 0 && (
                <button
                  type="button"
                  onClick={() =>
                    setSelectedAccountIds(
                      selectedAccountIds.length === accounts.length
                        ? []
                        : accounts.map((a) => a.id),
                    )
                  }
                  className="text-xs font-bold text-[#7138F5] dark:text-[#20C8E8] hover:underline"
                >
                  {selectedAccountIds.length === accounts.length ? 'Clear' : 'Select All'}
                </button>
              )}
            </div>

            {/* Platform filter chips */}
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                type="button"
                onClick={() => setPlatformFilter('ALL')}
                className={`px-3 py-1 rounded-xl text-xs font-bold border transition-all ${
                  platformFilter === 'ALL'
                    ? 'bg-gradient-to-r from-[#7138F5] to-[#2878FF] text-white border-transparent'
                    : 'bg-[#F7F8FC] dark:bg-white/5 border-[#E7EAF2] dark:border-white/10 text-[#64748B] dark:text-slate-300'
                }`}
              >
                All Platforms ({accounts.length})
              </button>
              {ORDERED_PLATFORMS.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPlatformFilter(p)}
                  className={`p-1 rounded-xl border transition-all ${
                    platformFilter === p
                      ? 'border-[#7138F5] ring-2 ring-[#7138F5]/30'
                      : 'border-transparent opacity-80 hover:opacity-100'
                  }`}
                >
                  <PlatformBadge platform={p} variant="icon" size="sm" />
                </button>
              ))}
            </div>

            {filteredAccounts.length === 0 ? (
              <EmptyState
                icon={<Share2 className="w-5 h-5" />}
                title="No connected accounts match this filter"
                description="Connect your social media channels in Social Accounts Settings to enable multi-network publishing."
                action={
                  <Link href={ROUTES.SETTINGS_SOCIAL_ACCOUNTS}>
                    <Button size="sm">Connect Accounts</Button>
                  </Link>
                }
              />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 max-h-60 overflow-y-auto pr-1">
                {filteredAccounts.map((acc) => {
                  const selected = selectedAccountIds.includes(acc.id);
                  return (
                    <button
                      key={acc.id}
                      type="button"
                      onClick={() => toggleAccount(acc.id)}
                      className={`flex items-center gap-2.5 p-3 rounded-xl border text-left transition-all ${
                        selected
                          ? 'bg-[#F1EBFF]/75 dark:bg-[#7138F5]/20 border-[#7138F5]'
                          : 'bg-[#F7F8FC] dark:bg-white/[0.03] border-[#E7EAF2] dark:border-white/10 hover:border-[#7138F5]/40'
                      }`}
                    >
                      <PlatformBadge platform={acc.provider} variant="icon" size="sm" />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-[#111827] dark:text-white truncate">
                          {acc.accountName}
                        </p>
                        <p className="text-[10px] text-[#64748B] dark:text-slate-400 truncate">
                          {acc.accountUsername ? `@${acc.accountUsername}` : acc.accountType}
                        </p>
                      </div>
                      {selected && (
                        <CheckCircle2 className="w-4 h-4 text-[#7138F5] dark:text-[#20C8E8] shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Step 3: Schedule Option & Launch */}
          <div className="rounded-3xl p-6 bg-white dark:bg-[#0F142B]/90 border border-[#E7EAF2] dark:border-[#7138F5]/30 shadow-soft dark:shadow-glow-card space-y-5">
            <h2 className="text-base font-extrabold text-[#111827] dark:text-white">
              3. Schedule Option &amp; Dispatch
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { mode: 'IMMEDIATE' as const, label: 'Publish Now', desc: 'Dispatch immediately', icon: Zap },
                { mode: 'SCHEDULED' as const, label: 'Schedule Time', desc: 'Single exact slot', icon: Calendar },
                { mode: 'STAGGERED' as const, label: 'Staggered Rollout', desc: 'Space out drafts', icon: Clock },
              ].map((opt) => {
                const Icon = opt.icon;
                const active = dispatchMode === opt.mode;
                return (
                  <button
                    key={opt.mode}
                    type="button"
                    onClick={() => setDispatchMode(opt.mode)}
                    className={`p-3.5 rounded-2xl border text-left transition-all ${
                      active
                        ? 'bg-[#F1EBFF] dark:bg-[#7138F5]/25 border-[#7138F5]'
                        : 'bg-[#F7F8FC] dark:bg-white/[0.03] border-[#E7EAF2] dark:border-white/10'
                    }`}
                  >
                    <Icon className="w-4 h-4 text-[#7138F5] dark:text-[#20C8E8] mb-1.5" />
                    <p className="text-xs font-extrabold text-[#111827] dark:text-white">
                      {opt.label}
                    </p>
                    <p className="text-[11px] text-[#64748B] dark:text-slate-400">{opt.desc}</p>
                  </button>
                );
              })}
            </div>

            {dispatchMode !== 'IMMEDIATE' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#64748B] dark:text-slate-300 mb-1.5">
                    Start Date &amp; Time
                  </label>
                  <input
                    type="datetime-local"
                    value={scheduledAt}
                    onChange={(e) => setScheduledAt(e.target.value)}
                    className="w-full rounded-xl border border-[#E7EAF2] dark:border-[#1E2749] bg-[#F7F8FC] dark:bg-[#0B1024] px-3.5 py-2.5 text-sm text-[#111827] dark:text-white"
                  />
                </div>
                {dispatchMode === 'STAGGERED' && (
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-[#64748B] dark:text-slate-300 mb-1.5">
                      Stagger Interval (minutes)
                    </label>
                    <input
                      type="number"
                      min={5}
                      max={1440}
                      value={staggerMinutes}
                      onChange={(e) => setStaggerMinutes(Number(e.target.value) || 15)}
                      className="w-full rounded-xl border border-[#E7EAF2] dark:border-[#1E2749] bg-[#F7F8FC] dark:bg-[#0B1024] px-3.5 py-2.5 text-sm text-[#111827] dark:text-white"
                    />
                  </div>
                )}
              </div>
            )}

            <label className="flex items-center gap-2.5 text-xs text-[#64748B] dark:text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={autoAdaptMissingPlatform}
                onChange={(e) => setAutoAdaptMissingPlatform(e.target.checked)}
                className="rounded border-[#E7EAF2] text-[#7138F5] focus:ring-[#7138F5]"
              />
              <span>
                Auto-adapt primary caption if a draft is missing a dedicated variant for a selected
                platform
              </span>
            </label>

            <div className="pt-2 flex flex-wrap items-center justify-between gap-3 border-t border-[#E7EAF2] dark:border-white/10">
              <p className="text-xs font-semibold text-[#64748B] dark:text-slate-400">
                Preflight: <strong className="text-[#111827] dark:text-white">{selectedDraftIds.length}</strong> draft(s) ×{' '}
                <strong className="text-[#111827] dark:text-white">{selectedAccountIds.length}</strong> account(s) ={' '}
                <strong className="text-[#7138F5] dark:text-[#20C8E8]">{totalDeliveries}</strong> target deliveries
              </p>

              <Button
                type="button"
                variant="primary"
                size="lg"
                disabled={selectedDraftIds.length === 0 || selectedAccountIds.length === 0}
                isLoading={isLaunching}
                onClick={handleLaunchBulkPublish}
                rightIcon={<ArrowRight className="w-4 h-4" />}
              >
                Start Bulk Publishing
              </Button>
            </div>
          </div>
        </div>

        {/* Right Column: 3D Rocket Visual + Delivery Results Tracker */}
        <div className="xl:col-span-4 space-y-5">
          <BulkRocketVisual />

          <div className="rounded-2xl p-5 bg-white dark:bg-[#0F142B]/90 border border-[#E7EAF2] dark:border-[#1E2749] space-y-3">
            <h3 className="text-sm font-extrabold text-[#111827] dark:text-white flex items-center gap-2">
              <Send className="w-4 h-4 text-[#7138F5] dark:text-[#20C8E8]" />
              Launch Summary
            </h3>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-[#64748B] dark:text-slate-400">Selected Drafts</span>
                <span className="font-bold text-[#111827] dark:text-white">{selectedDraftIds.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#64748B] dark:text-slate-400">Target Accounts</span>
                <span className="font-bold text-[#111827] dark:text-white">{selectedAccountIds.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#64748B] dark:text-slate-400">Dispatch Mode</span>
                <Badge variant="purple">{dispatchMode}</Badge>
              </div>
              <div className="flex justify-between pt-2 border-t border-[#E7EAF2] dark:border-white/10">
                <span className="font-bold text-[#111827] dark:text-white">Total Queued Targets</span>
                <span className="font-extrabold text-[#7138F5] dark:text-[#20C8E8]">{totalDeliveries}</span>
              </div>
            </div>
          </div>

          {launchResult && (
            <div className="rounded-2xl p-5 bg-white dark:bg-[#0F142B]/95 border border-emerald-200 dark:border-emerald-500/35 space-y-3 animate-fadeIn">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-extrabold text-emerald-700 dark:text-emerald-300">
                  Delivery Tracker
                </h3>
                <Badge variant="success">
                  {launchResult.totalTargetsQueued} Queued
                </Badge>
              </div>
              <div className="space-y-2 max-h-56 overflow-y-auto">
                {(launchResult.results || []).map((sp) => (
                  <div
                    key={sp.draftId}
                    className="p-3 rounded-xl bg-[#F7F8FC] dark:bg-white/[0.04] border border-[#E7EAF2] dark:border-white/10 flex items-center justify-between gap-2 text-xs"
                  >
                    <span className="font-semibold text-[#111827] dark:text-white truncate">
                      {sp.draftTitle || sp.draftId.slice(0, 8)}
                    </span>
                    <Badge variant={sp.status === 'PUBLISHED' ? 'success' : 'purple'}>
                      {sp.status}
                    </Badge>
                  </div>
                ))}
              </div>
              <Link
                href={ROUTES.CALENDAR}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-[#7138F5] dark:text-[#20C8E8] hover:underline"
              >
                Inspect in Content Calendar <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function BulkPublishPage() {
  return (
    <Suspense fallback={<div className="p-10 text-center text-sm text-[#64748B]">Loading Bulk Publish...</div>}>
      <BulkPublishContent />
    </Suspense>
  );
}
