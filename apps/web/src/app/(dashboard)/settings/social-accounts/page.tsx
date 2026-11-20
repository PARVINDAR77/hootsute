'use client';

import React, { useEffect, useState, useCallback, useMemo, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useWorkspace } from '@/lib/workspace-context';
import {
  Button,
  Badge,
  Alert,
  Modal,
  ConfirmationDialog,
  EmptyState,
  Tabs,
  PlatformBadge,
  SupportedPlatformKey,
  normalizePlatformKey,
} from '@/components/ui';
import { PlatformCloudVisual } from '@/components/marketing/FuturisticVisuals';
import { apiClient } from '@/lib/api-client';
import { ROUTES } from '@/lib/constants';
import {
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Trash2,
  Plus,
  ShieldCheck,
  Clock,
  Layers,
  ExternalLink,
} from 'lucide-react';
import {
  SocialAccountDto,
  SocialAccountType,
  SocialConnectionStatus,
} from '@packages/shared';

interface PlatformConnectorConfig {
  key: SupportedPlatformKey;
  title: string;
  buttonLabel: string;
  oauthSlug: 'meta' | 'linkedin' | 'twitter' | 'pinterest' | 'youtube' | 'tiktok' | 'threads';
  helper: string;
}

const CONNECTORS: PlatformConnectorConfig[] = [
  {
    key: 'INSTAGRAM',
    title: 'Instagram',
    buttonLabel: 'Connect Instagram',
    oauthSlug: 'meta',
    helper: 'Business & Creator',
  },
  {
    key: 'FACEBOOK',
    title: 'Facebook',
    buttonLabel: 'Connect Facebook',
    oauthSlug: 'meta',
    helper: 'Business Pages',
  },
  {
    key: 'TWITTER_X',
    title: 'Twitter / X',
    buttonLabel: 'Connect Twitter / X',
    oauthSlug: 'twitter',
    helper: 'X Profiles (PKCE)',
  },
  {
    key: 'LINKEDIN',
    title: 'LinkedIn',
    buttonLabel: 'Connect LinkedIn',
    oauthSlug: 'linkedin',
    helper: 'Pages & Profiles',
  },
  {
    key: 'PINTEREST',
    title: 'Pinterest',
    buttonLabel: 'Connect Pinterest',
    oauthSlug: 'pinterest',
    helper: 'Business Boards',
  },
  {
    key: 'YOUTUBE',
    title: 'YouTube',
    buttonLabel: 'Connect YouTube',
    oauthSlug: 'youtube',
    helper: 'Channels & Shorts',
  },
  {
    key: 'TIKTOK',
    title: 'TikTok',
    buttonLabel: 'Connect TikTok',
    oauthSlug: 'tiktok',
    helper: 'Creator & Business',
  },
  {
    key: 'THREADS',
    title: 'Threads',
    buttonLabel: 'Connect Threads',
    oauthSlug: 'threads',
    helper: 'Meta Threads',
  },
];

function getAccountTypeBadge(type: SocialAccountType) {
  switch (type) {
    case SocialAccountType.FACEBOOK_PAGE:
      return <Badge variant="info">Facebook Page</Badge>;
    case SocialAccountType.INSTAGRAM_BUSINESS:
      return <Badge variant="purple">Instagram Business</Badge>;
    case SocialAccountType.INSTAGRAM_CREATOR:
      return <Badge variant="purple">Instagram Creator</Badge>;
    case SocialAccountType.LINKEDIN_PAGE:
      return <Badge variant="info">LinkedIn Page</Badge>;
    case SocialAccountType.LINKEDIN_PROFILE:
      return <Badge variant="info">LinkedIn Profile</Badge>;
    case SocialAccountType.TWITTER_PROFILE:
      return <Badge variant="default">Twitter / X Profile</Badge>;
    case SocialAccountType.PINTEREST_BUSINESS:
      return <Badge variant="danger">Pinterest Business</Badge>;
    case SocialAccountType.YOUTUBE_CHANNEL:
      return <Badge variant="danger">YouTube Channel</Badge>;
    case SocialAccountType.TIKTOK_BUSINESS:
    case SocialAccountType.TIKTOK_CREATOR:
      return <Badge variant="default">TikTok Account</Badge>;
    case SocialAccountType.THREADS_PROFILE:
      return <Badge variant="default">Threads Profile</Badge>;
    default:
      return <Badge variant="outline">{type}</Badge>;
  }
}

function getStatusBadge(status: SocialConnectionStatus) {
  switch (status) {
    case SocialConnectionStatus.CONNECTED:
      return <Badge variant="success">Active</Badge>;
    case SocialConnectionStatus.EXPIRED:
      return <Badge variant="warning">Expired</Badge>;
    case SocialConnectionStatus.REVOKED:
      return <Badge variant="danger">Revoked</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}

function SocialAccountsContent() {
  const searchParams = useSearchParams();
  const oauthError = searchParams.get('error');
  const { currentWorkspace, isLoadingWorkspaces } = useWorkspace();

  const [accounts, setAccounts] = useState<SocialAccountDto[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [initiatingKey, setInitiatingKey] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(oauthError);
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'CONNECTED' | 'ATTENTION'>('ALL');
  const [addModalOpen, setAddModalOpen] = useState(false);

  const [accountToDisconnect, setAccountToDisconnect] = useState<SocialAccountDto | null>(null);
  const [isDisconnecting, setIsDisconnecting] = useState(false);

  const canManage =
    currentWorkspace?.currentUserRole === 'OWNER' ||
    currentWorkspace?.currentUserRole === 'ADMIN';

  const fetchAccounts = useCallback(async () => {
    if (!currentWorkspace?.id) return;
    setIsLoading(true);
    try {
      const data = await apiClient<SocialAccountDto[]>(
        `/workspaces/${currentWorkspace.id}/social-accounts`,
      );
      setAccounts(Array.isArray(data) ? data : (data as any)?.data || []);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to load social accounts');
    } finally {
      setIsLoading(false);
    }
  }, [currentWorkspace?.id]);

  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);

  const handleConnect = async (connector: PlatformConnectorConfig) => {
    if (!currentWorkspace?.id || !canManage) return;
    setInitiatingKey(connector.key);
    setErrorMessage(null);
    setAddModalOpen(false);

    try {
      const result = await apiClient<{ authorizationUrl: string; state: string }>(
        `/workspaces/${currentWorkspace.id}/social-accounts/${connector.oauthSlug}/connect`,
        { method: 'POST', body: JSON.stringify({}) },
      );
      if (result?.authorizationUrl) {
        window.location.href = result.authorizationUrl;
      }
    } catch (err: any) {
      setErrorMessage(
        err.message ||
          `Failed to initiate ${connector.title} OAuth. Check provider credentials in server environment.`,
      );
      setInitiatingKey(null);
    }
  };

  const handleDisconnect = async () => {
    if (!currentWorkspace?.id || !accountToDisconnect) return;
    setIsDisconnecting(true);
    setErrorMessage(null);

    try {
      await apiClient(
        `/workspaces/${currentWorkspace.id}/social-accounts/${accountToDisconnect.id}`,
        { method: 'DELETE' },
      );
      setSuccessMessage(`Disconnected ${accountToDisconnect.accountName}`);
      setAccountToDisconnect(null);
      await fetchAccounts();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to disconnect account');
    } finally {
      setIsDisconnecting(false);
    }
  };

  const countsByPlatform = useMemo(() => {
    const map: Record<SupportedPlatformKey, { connected: number; expired: number }> = {
      INSTAGRAM: { connected: 0, expired: 0 },
      FACEBOOK: { connected: 0, expired: 0 },
      TWITTER_X: { connected: 0, expired: 0 },
      LINKEDIN: { connected: 0, expired: 0 },
      PINTEREST: { connected: 0, expired: 0 },
      YOUTUBE: { connected: 0, expired: 0 },
      TIKTOK: { connected: 0, expired: 0 },
      THREADS: { connected: 0, expired: 0 },
    };
    for (const acc of accounts) {
      const key = normalizePlatformKey(acc.provider);
      if (acc.connectionStatus === SocialConnectionStatus.CONNECTED) {
        map[key].connected += 1;
      } else {
        map[key].expired += 1;
      }
    }
    return map;
  }, [accounts]);

  const filteredAccounts = useMemo(() => {
    if (statusFilter === 'CONNECTED') {
      return accounts.filter((a) => a.connectionStatus === SocialConnectionStatus.CONNECTED);
    }
    if (statusFilter === 'ATTENTION') {
      return accounts.filter((a) => a.connectionStatus !== SocialConnectionStatus.CONNECTED);
    }
    return accounts;
  }, [accounts, statusFilter]);

  const activeCount = accounts.filter(
    (a) => a.connectionStatus === SocialConnectionStatus.CONNECTED,
  ).length;
  const attentionCount = accounts.length - activeCount;

  if (isLoadingWorkspaces) {
    return <div className="p-8 text-center text-sm text-[#64748B]">Loading workspace...</div>;
  }

  return (
    <div className="space-y-6 max-w-[1440px] mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#111827] dark:text-white">
            Social Accounts
          </h1>
          <p className="text-sm text-[#64748B] dark:text-slate-400 mt-1">
            Connect and manage all your social media accounts across 8 official OAuth networks.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchAccounts}
            isLoading={isLoading}
            leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
          >
            Refresh
          </Button>
          {canManage && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => setAddModalOpen(true)}
              leftIcon={<Plus className="w-4 h-4" />}
            >
              Add Account
            </Button>
          )}
        </div>
      </div>

      {successMessage && (
        <Alert
          type="success"
          message={successMessage}
          onClose={() => setSuccessMessage(null)}
        />
      )}
      {errorMessage && (
        <Alert
          type="error"
          message={errorMessage}
          onClose={() => setErrorMessage(null)}
        />
      )}

      {!canManage && (
        <Alert
          type="info"
          title="Read-Only Access"
          message="Only Workspace Owners and Admins can connect or disconnect social media channels."
        />
      )}

      {/* Hero Split: 2x4 Glowing 8-Platform Grid + 3D Platform Cloud */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        <div className="xl:col-span-8 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          {CONNECTORS.map((connector) => {
            const stats = countsByPlatform[connector.key];
            const isConnected = stats.connected > 0;
            const isBusy = initiatingKey === connector.key;
            return (
              <div
                key={connector.key}
                className={`group rounded-2xl p-5 bg-white dark:bg-[#0F142B]/90 border transition-all duration-200 flex flex-col items-center text-center justify-between gap-3 ${
                  isConnected
                    ? 'border-[#7138F5]/35 shadow-soft dark:shadow-glow-card'
                    : 'border-[#E7EAF2] dark:border-[#1E2749] hover:border-[#7138F5]/40'
                }`}
              >
                <div className="flex flex-col items-center">
                  <PlatformBadge
                    platform={connector.key}
                    variant="icon"
                    size="lg"
                    className="mb-3 group-hover:scale-105 transition-transform"
                  />
                  <h2 className="text-sm font-extrabold text-[#111827] dark:text-white">
                    {connector.title}
                  </h2>
                  <p className="text-[11px] text-[#64748B] dark:text-slate-400 mt-0.5">
                    {stats.connected === 1 ? '1 account' : `${stats.connected} accounts`}
                  </p>
                  <div className="mt-2">
                    {isConnected ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Connected
                      </span>
                    ) : stats.expired > 0 ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-600 dark:text-amber-400">
                        <AlertTriangle className="w-3.5 h-3.5" /> Reconnect
                      </span>
                    ) : (
                      <span className="text-[11px] font-medium text-[#64748B] dark:text-slate-500">
                        {connector.helper}
                      </span>
                    )}
                  </div>
                </div>

                <Button
                  type="button"
                  variant={isConnected ? 'outline' : 'primary'}
                  size="sm"
                  className="w-full text-[11px]"
                  disabled={!canManage || initiatingKey !== null}
                  isLoading={isBusy}
                  onClick={() => handleConnect(connector)}
                >
                  {connector.buttonLabel}
                </Button>
              </div>
            );
          })}
        </div>

        {/* Right 3D Cloud & Security Telemetry */}
        <div className="xl:col-span-4 space-y-4">
          <PlatformCloudVisual />

          <div className="rounded-2xl p-5 bg-white dark:bg-[#0F142B]/90 border border-[#E7EAF2] dark:border-[#1E2749] space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-[#111827] dark:text-white">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              <span>Workspace Token Health</span>
            </div>
            <div className="grid grid-cols-2 gap-3 text-center">
              <div className="p-3 rounded-xl bg-[#F7F8FC] dark:bg-white/[0.04] border border-[#E7EAF2] dark:border-white/10">
                <p className="text-xl font-extrabold text-[#111827] dark:text-white">
                  {activeCount}
                </p>
                <p className="text-[11px] text-[#64748B] dark:text-slate-400">Active Channels</p>
              </div>
              <div className="p-3 rounded-xl bg-[#F7F8FC] dark:bg-white/[0.04] border border-[#E7EAF2] dark:border-white/10">
                <p className="text-xl font-extrabold text-amber-600 dark:text-amber-400">
                  {attentionCount}
                </p>
                <p className="text-[11px] text-[#64748B] dark:text-slate-400">Needs Attention</p>
              </div>
            </div>
            <Link
              href={ROUTES.PLATFORMS}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-[#7138F5] dark:text-[#20C8E8] hover:underline"
            >
              <span>Review official API requirements</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>

      {/* Connected Accounts Directory */}
      <div className="rounded-2xl bg-white dark:bg-[#0F142B]/90 border border-[#E7EAF2] dark:border-[#1E2749] shadow-soft dark:shadow-none overflow-hidden">
        <div className="px-5 sm:px-6 py-4 border-b border-[#E7EAF2] dark:border-white/10 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-[#111827] dark:text-white">
              Connected Accounts Directory
            </h2>
            <p className="text-xs text-[#64748B] dark:text-slate-400">
              All OAuth accounts scoped strictly to {currentWorkspace?.name || 'this workspace'}
            </p>
          </div>
          <Tabs<'ALL' | 'CONNECTED' | 'ATTENTION'>
            value={statusFilter}
            onChange={setStatusFilter}
            options={[
              { id: 'ALL', label: 'All', badge: accounts.length },
              { id: 'CONNECTED', label: 'Active', badge: activeCount },
              { id: 'ATTENTION', label: 'Attention', badge: attentionCount },
            ]}
          />
        </div>

        <div className="p-5">
          {filteredAccounts.length === 0 ? (
            <EmptyState
              icon={<Layers className="w-5 h-5" />}
              title="No connected accounts in this view"
              description="Click any of the 8 social network cards above to launch its official OAuth 2.0 connection flow."
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#E7EAF2] dark:border-white/10 text-left text-[11px] font-bold uppercase tracking-wider text-[#64748B] dark:text-slate-400">
                    <th className="py-3 pr-4">Account</th>
                    <th className="py-3 px-4">Type</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Last Validated</th>
                    <th className="py-3 pl-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E7EAF2]/80 dark:divide-white/5">
                  {filteredAccounts.map((acc) => (
                    <tr
                      key={acc.id}
                      className="hover:bg-[#F7F8FC]/70 dark:hover:bg-white/[0.02] transition-colors"
                    >
                      <td className="py-3.5 pr-4">
                        <div className="flex items-center gap-3">
                          <PlatformBadge platform={acc.provider} variant="icon" size="md" />
                          <div className="min-w-0">
                            <p className="font-bold text-[#111827] dark:text-white truncate">
                              {acc.accountName}
                            </p>
                            {acc.accountUsername && (
                              <p className="text-xs text-[#64748B] dark:text-slate-400 truncate">
                                @{acc.accountUsername.replace(/^@/, '')}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">{getAccountTypeBadge(acc.accountType)}</td>
                      <td className="py-3.5 px-4">{getStatusBadge(acc.connectionStatus)}</td>
                      <td className="py-3.5 px-4 text-xs text-[#64748B] dark:text-slate-400">
                        <span className="inline-flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          {acc.lastValidatedAt
                            ? new Date(acc.lastValidatedAt).toLocaleDateString()
                            : 'Recently synced'}
                        </span>
                      </td>
                      <td className="py-3.5 pl-4 text-right">
                        {canManage && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => setAccountToDisconnect(acc)}
                            className="text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10"
                            leftIcon={<Trash2 className="w-3.5 h-3.5" />}
                          >
                            Disconnect
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Add Account Quick Modal */}
      <Modal
        open={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        title="Connect a Social Network"
        description="Select one of the 8 supported platforms to begin official OAuth authorization."
        size="lg"
      >
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {CONNECTORS.map((connector) => (
            <button
              key={connector.key}
              type="button"
              onClick={() => handleConnect(connector)}
              className="p-4 rounded-2xl border border-[#E7EAF2] dark:border-white/15 bg-[#F7F8FC] dark:bg-white/[0.03] hover:border-[#7138F5] hover:bg-[#F1EBFF]/60 dark:hover:bg-[#7138F5]/20 flex flex-col items-center gap-2 transition-all"
            >
              <PlatformBadge platform={connector.key} variant="icon" size="md" />
              <span className="text-xs font-bold text-[#111827] dark:text-white">
                {connector.title}
              </span>
            </button>
          ))}
        </div>
      </Modal>

      {/* Disconnect Confirmation Dialog */}
      <ConfirmationDialog
        open={!!accountToDisconnect}
        onClose={() => setAccountToDisconnect(null)}
        onConfirm={handleDisconnect}
        isLoading={isDisconnecting}
        title={`Disconnect ${accountToDisconnect?.accountName || 'Account'}?`}
        description="Scheduled posts targeting this channel will no longer be able to publish until you reconnect via OAuth."
        confirmLabel="Disconnect Account"
      />
    </div>
  );
}

export default function SocialAccountsPage() {
  return (
    <Suspense
      fallback={
        <div className="p-10 text-center text-sm text-[#64748B]">
          Loading social accounts...
        </div>
      }
    >
      <SocialAccountsContent />
    </Suspense>
  );
}
