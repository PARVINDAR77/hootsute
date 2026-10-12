'use client';

import React, { useEffect, useState, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useWorkspace } from '@/lib/workspace-context';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Alert } from '@/components/ui/Alert';
import { apiClient } from '@/lib/api-client';
import {
  Share2,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Trash2,
  ExternalLink,
  PlusCircle,
  ShieldCheck,
  Building2,
  Clock,
  Key,
  Info,
  Layers,
  X,
} from 'lucide-react';
import Link from 'next/link';
import { ROUTES } from '@/lib/constants';
import {
  SocialAccountDto,
  SocialAccountType,
  SocialConnectionStatus,
  SocialProvider,
} from '@packages/shared';

function SocialAccountsContent() {
  const searchParams = useSearchParams();
  const oauthError = searchParams.get('error');

  const { currentWorkspace, isLoadingWorkspaces } = useWorkspace();

  const [accounts, setAccounts] = useState<SocialAccountDto[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitiating, setIsInitiating] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(oauthError);

  // Disconnect modal state
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
      setAccounts(data || []);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to load social accounts');
    } finally {
      setIsLoading(false);
    }
  }, [currentWorkspace?.id]);

  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);

  const handleConnectMeta = async () => {
    if (!currentWorkspace?.id || !canManage) return;

    setIsInitiating(true);
    setErrorMessage(null);

    try {
      const result = await apiClient<{ authorizationUrl: string; state: string }>(
        `/workspaces/${currentWorkspace.id}/social-accounts/meta/connect`,
        { method: 'POST', body: JSON.stringify({}) },
      );

      if (result?.authorizationUrl) {
        window.location.href = result.authorizationUrl;
      }
    } catch (err: any) {
      setErrorMessage(
        err.message ||
          'Failed to initiate Meta OAuth. Ensure META_APP_ID and META_APP_SECRET are configured in the server environment.',
      );
      setIsInitiating(false);
    }
  };

  const handleConnectLinkedIn = async () => {
    if (!currentWorkspace?.id || !canManage) return;

    setIsInitiating(true);
    setErrorMessage(null);

    try {
      const result = await apiClient<{ authorizationUrl: string; state: string }>(
        `/workspaces/${currentWorkspace.id}/social-accounts/linkedin/connect`,
        { method: 'POST', body: JSON.stringify({}) },
      );

      if (result?.authorizationUrl) {
        window.location.href = result.authorizationUrl;
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to initiate LinkedIn OAuth.');
      setIsInitiating(false);
    }
  };

  const handleConnectTwitter = async () => {
    if (!currentWorkspace?.id || !canManage) return;

    setIsInitiating(true);
    setErrorMessage(null);

    try {
      const result = await apiClient<{ authorizationUrl: string; state: string }>(
        `/workspaces/${currentWorkspace.id}/social-accounts/twitter/connect`,
        { method: 'POST', body: JSON.stringify({}) },
      );

      if (result?.authorizationUrl) {
        window.location.href = result.authorizationUrl;
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to initiate Twitter / X OAuth.');
      setIsInitiating(false);
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

      setSuccessMessage(`Successfully disconnected ${accountToDisconnect.accountName}`);
      setAccountToDisconnect(null);
      await fetchAccounts();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to disconnect account');
    } finally {
      setIsDisconnecting(false);
    }
  };

  const getAccountTypeBadge = (type: SocialAccountType) => {
    switch (type) {
      case SocialAccountType.FACEBOOK_PAGE:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-blue-50 text-blue-700 border border-blue-200">
            Facebook Page
          </span>
        );
      case SocialAccountType.INSTAGRAM_BUSINESS:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-pink-50 text-pink-700 border border-pink-200">
            Instagram Business
          </span>
        );
      case SocialAccountType.INSTAGRAM_CREATOR:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-purple-50 text-purple-700 border border-purple-200">
            Instagram Creator
          </span>
        );
      case SocialAccountType.LINKEDIN_PAGE:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-sky-50 text-sky-800 border border-sky-300">
            LinkedIn Page
          </span>
        );
      case SocialAccountType.LINKEDIN_PROFILE:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-blue-50 text-blue-800 border border-blue-200">
            LinkedIn Profile
          </span>
        );
      case SocialAccountType.TWITTER_PROFILE:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-800 border border-slate-300">
            Twitter / X Profile
          </span>
        );
      default:
        return <Badge variant="outline">{type}</Badge>;
    }
  };

  const getStatusBadge = (status: SocialConnectionStatus) => {
    switch (status) {
      case SocialConnectionStatus.CONNECTED:
        return <Badge variant="success">Active</Badge>;
      case SocialConnectionStatus.EXPIRED:
        return <Badge variant="outline">Expired</Badge>;
      case SocialConnectionStatus.REVOKED:
        return <Badge variant="danger">Revoked</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (isLoadingWorkspaces) {
    return (
      <div className="max-w-5xl mx-auto py-12 text-center space-y-3">
        <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-xs text-slate-500">Loading social account configurations...</p>
      </div>
    );
  }

  if (!currentWorkspace) {
    return (
      <div className="max-w-md mx-auto py-12 text-center space-y-4">
        <Share2 className="w-10 h-10 text-slate-400 mx-auto" />
        <h2 className="text-lg font-bold text-slate-900">No Workspace Selected</h2>
        <p className="text-xs text-slate-500">Select or create a workspace to connect social channels.</p>
        <Link href={ROUTES.WORKSPACE_ONBOARDING}>
          <Button size="sm">Create Workspace</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Social Accounts</h1>
            <Badge variant="outline">{accounts.length} Connected</Badge>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Connect your Facebook Pages and Instagram Professional accounts to enable multi-channel management.
          </p>
        </div>

        {canManage && (
          <Button
            onClick={handleConnectMeta}
            isLoading={isInitiating}
            leftIcon={<PlusCircle className="w-4 h-4" />}
          >
            Connect Channel
          </Button>
        )}
      </div>

      {successMessage && <Alert type="success" message={successMessage} />}
      {errorMessage && <Alert type="error" message={errorMessage} />}

      {/* Meta Provider Channel Cards */}
      <div>
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
          Supported Social Networks
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Facebook Page Channel Card */}
          <Card className="border-slate-200 hover:border-indigo-200 transition-colors">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-lg shadow-sm">
                    f
                  </div>
                  <div>
                    <CardTitle className="text-base">Facebook Pages</CardTitle>
                    <CardDescription>
                      Publish posts, reels, stories, and monitor page engagement
                    </CardDescription>
                  </div>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 uppercase">
                  Meta v21.0
                </span>
              </div>
            </CardHeader>
            <CardContent className="space-y-3 text-xs text-slate-600">
              <p>
                Connect Facebook business and brand pages that you administer. Requires Page Management permissions.
              </p>
              <div className="flex flex-wrap gap-1.5 pt-1">
                <span className="px-2 py-0.5 bg-slate-100 rounded text-[10px] text-slate-600 font-mono">
                  pages_show_list
                </span>
                <span className="px-2 py-0.5 bg-slate-100 rounded text-[10px] text-slate-600 font-mono">
                  pages_read_engagement
                </span>
                <span className="px-2 py-0.5 bg-slate-100 rounded text-[10px] text-slate-600 font-mono">
                  pages_manage_posts
                </span>
              </div>
            </CardContent>
            <CardFooter className="pt-2 border-t border-slate-100 flex justify-between items-center">
              <span className="text-[11px] text-slate-400">Official OAuth 2.0 Flow</span>
              {canManage ? (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleConnectMeta}
                  isLoading={isInitiating}
                >
                  Connect Facebook
                </Button>
              ) : (
                <span className="text-[11px] text-slate-400 font-medium">Admin required</span>
              )}
            </CardFooter>
          </Card>

          {/* Instagram Professional Channel Card */}
          <Card className="border-slate-200 hover:border-indigo-200 transition-colors">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 text-white flex items-center justify-center font-bold text-sm shadow-sm">
                    IG
                  </div>
                  <div>
                    <CardTitle className="text-base">Instagram Professional</CardTitle>
                    <CardDescription>
                      Publish feed posts, carousels, and stories to Business or Creator profiles
                    </CardDescription>
                  </div>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-pink-50 text-pink-700 border border-pink-200 uppercase">
                  Business / Creator
                </span>
              </div>
            </CardHeader>
            <CardContent className="space-y-3 text-xs text-slate-600">
              <p>
                Connect Instagram Business or Creator accounts linked to your Facebook Pages. Personal accounts are not supported by the Meta Graph API.
              </p>
              <div className="flex flex-wrap gap-1.5 pt-1">
                <span className="px-2 py-0.5 bg-slate-100 rounded text-[10px] text-slate-600 font-mono">
                  instagram_basic
                </span>
                <span className="px-2 py-0.5 bg-slate-100 rounded text-[10px] text-slate-600 font-mono">
                  instagram_content_publish
                </span>
              </div>
            </CardContent>
            <CardFooter className="pt-2 border-t border-slate-100 flex justify-between items-center">
              <span className="text-[11px] text-slate-400">Linked Facebook Page Required</span>
              {canManage ? (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleConnectMeta}
                  isLoading={isInitiating}
                >
                  Connect Instagram
                </Button>
              ) : (
                <span className="text-[11px] text-slate-400 font-medium">Admin required</span>
              )}
            </CardFooter>
          </Card>

          {/* LinkedIn Channel Card */}
          <Card className="border-slate-200 hover:border-indigo-200 transition-colors">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#0A66C2] text-white flex items-center justify-center font-bold text-sm shadow-sm">
                    in
                  </div>
                  <div>
                    <CardTitle className="text-base">LinkedIn</CardTitle>
                    <CardDescription>
                      Publish updates to personal profiles &amp; organization company pages
                    </CardDescription>
                  </div>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-sky-50 text-sky-800 border border-sky-300 uppercase">
                  Profile &amp; Page
                </span>
              </div>
            </CardHeader>
            <CardContent className="space-y-3 text-xs text-slate-600">
              <p>
                Connect LinkedIn member profiles or Company Pages you manage for professional B2B outreach.
              </p>
              <div className="flex flex-wrap gap-1.5 pt-1">
                <span className="px-2 py-0.5 bg-slate-100 rounded text-[10px] text-slate-600 font-mono">
                  w_member_social
                </span>
                <span className="px-2 py-0.5 bg-slate-100 rounded text-[10px] text-slate-600 font-mono">
                  w_organization_social
                </span>
              </div>
            </CardContent>
            <CardFooter className="pt-2 border-t border-slate-100 flex justify-between items-center">
              <span className="text-[11px] text-slate-400">OpenID / UGC</span>
              {canManage ? (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleConnectLinkedIn}
                  isLoading={isInitiating}
                >
                  Connect LinkedIn
                </Button>
              ) : (
                <span className="text-[11px] text-slate-400 font-medium">Admin required</span>
              )}
            </CardFooter>
          </Card>

          {/* Twitter / X Channel Card */}
          <Card className="border-slate-200 hover:border-indigo-200 transition-colors">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold text-sm shadow-sm">
                    𝕏
                  </div>
                  <div>
                    <CardTitle className="text-base">Twitter / X</CardTitle>
                    <CardDescription>
                      Real-time tweet publishing with 280-character validation
                    </CardDescription>
                  </div>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-800 border border-slate-300 uppercase">
                  v2 API
                </span>
              </div>
            </CardHeader>
            <CardContent className="space-y-3 text-xs text-slate-600">
              <p>
                Connect your brand Twitter / X handle. Direct automated tweet scheduling and publishing.
              </p>
              <div className="flex flex-wrap gap-1.5 pt-1">
                <span className="px-2 py-0.5 bg-slate-100 rounded text-[10px] text-slate-600 font-mono">
                  tweet.read
                </span>
                <span className="px-2 py-0.5 bg-slate-100 rounded text-[10px] text-slate-600 font-mono">
                  tweet.write
                </span>
              </div>
            </CardContent>
            <CardFooter className="pt-2 border-t border-slate-100 flex justify-between items-center">
              <span className="text-[11px] text-slate-400">OAuth 2.0 PKCE</span>
              {canManage ? (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleConnectTwitter}
                  isLoading={isInitiating}
                >
                  Connect Twitter / X
                </Button>
              ) : (
                <span className="text-[11px] text-slate-400 font-medium">Admin required</span>
              )}
            </CardFooter>
          </Card>
        </div>
      </div>

      {/* Connected Accounts Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600">
                <Share2 className="w-5 h-5" />
              </div>
              <div>
                <CardTitle>Connected Social Accounts</CardTitle>
                <CardDescription>
                  Verified accounts currently connected to {currentWorkspace.name}
                </CardDescription>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={fetchAccounts}
              isLoading={isLoading}
              leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
            >
              Refresh
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50/75 border-y border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-4">Account</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Granted Permissions</th>
                  <th className="py-3 px-4">Last Verified</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400">
                      Loading connected accounts...
                    </td>
                  </tr>
                ) : accounts.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center space-y-3">
                      <Share2 className="w-8 h-8 text-slate-300 mx-auto" />
                      <p className="text-slate-500 font-medium text-xs">
                        No social accounts connected to this workspace yet.
                      </p>
                      {canManage && (
                        <Button size="sm" onClick={handleConnectMeta} isLoading={isInitiating}>
                          Connect Facebook or Instagram
                        </Button>
                      )}
                    </td>
                  </tr>
                ) : (
                  accounts.map((acc) => (
                    <tr key={acc.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          {acc.profileImageUrl ? (
                            <img
                              src={acc.profileImageUrl}
                              alt={acc.accountName}
                              className="w-8 h-8 rounded-full object-cover border border-slate-200"
                            />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs shrink-0">
                              {acc.accountName.charAt(0).toUpperCase()}
                            </div>
                          )}
                          <div>
                            <div className="font-semibold text-slate-900">{acc.accountName}</div>
                            {acc.accountUsername && (
                              <div className="text-[11px] text-slate-400">@{acc.accountUsername}</div>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">{getAccountTypeBadge(acc.accountType)}</td>

                      <td className="py-3.5 px-4">{getStatusBadge(acc.connectionStatus)}</td>

                      <td className="py-3.5 px-4">
                        <div className="flex flex-wrap gap-1 max-w-xs">
                          {acc.grantedScopes && acc.grantedScopes.length > 0 ? (
                            acc.grantedScopes.map((scope) => (
                              <span
                                key={scope}
                                className="px-1.5 py-0.5 bg-slate-100 rounded text-[9px] text-slate-600 font-mono"
                              >
                                {scope}
                              </span>
                            ))
                          ) : (
                            <span className="text-slate-400 text-[11px]">Standard permissions</span>
                          )}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-slate-500">
                        {new Date(acc.lastValidatedAt).toLocaleDateString()}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        {canManage ? (
                          <div className="flex items-center justify-end gap-1.5">
                            {acc.connectionStatus !== SocialConnectionStatus.CONNECTED && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={handleConnectMeta}
                                className="text-indigo-600"
                              >
                                Reconnect
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setAccountToDisconnect(acc)}
                              className="text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                              leftIcon={<Trash2 className="w-3.5 h-3.5" />}
                            >
                              Disconnect
                            </Button>
                          </div>
                        ) : (
                          <span className="text-slate-400 text-[11px]">Read-only</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>

        <CardFooter className="py-3 px-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between text-[11px] text-slate-500">
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            Credentials encrypted at rest with AES-256-GCM. Tokens are never exposed to browser client.
          </span>
          <span>{accounts.length} active connection(s)</span>
        </CardFooter>
      </Card>

      {/* Disconnect Confirmation Modal */}
      {accountToDisconnect && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 space-y-4 border border-slate-100">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-slate-900 font-bold text-base">Disconnect Social Account</h3>
              <button
                onClick={() => setAccountToDisconnect(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 space-y-1">
              <span className="font-semibold block flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                Confirm Disconnection
              </span>
              <p>
                Are you sure you want to disconnect <strong>{accountToDisconnect.accountName}</strong> from this workspace? Stored encrypted access tokens will be deleted immediately.
              </p>
            </div>

            <div className="flex justify-end gap-2.5 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setAccountToDisconnect(null)}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                size="sm"
                isLoading={isDisconnecting}
                onClick={handleDisconnect}
              >
                Disconnect Account
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function SocialAccountsPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-5xl mx-auto py-12 text-center space-y-3">
          <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-slate-500">Loading social accounts...</p>
        </div>
      }
    >
      <SocialAccountsContent />
    </Suspense>
  );
}
