'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useWorkspace } from '@/lib/workspace-context';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Alert } from '@/components/ui/Alert';
import { apiClient } from '@/lib/api-client';
import {
  Share2,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
  Check,
  Building2,
  Layers,
} from 'lucide-react';
import Link from 'next/link';
import { ROUTES } from '@/lib/constants';
import {
  CandidateSocialAccount,
  SocialAccountType,
  SocialProvider,
} from '@packages/shared';

function ConnectCandidateAccountsContent() {
  const searchParams = useSearchParams();
  const sessionToken = searchParams.get('session');
  const workspaceIdFromUrl = searchParams.get('workspaceId');
  const router = useRouter();

  const { currentWorkspace } = useWorkspace();
  const targetWorkspaceId = workspaceIdFromUrl || currentWorkspace?.id;

  const [candidates, setCandidates] = useState<CandidateSocialAccount[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!sessionToken || !targetWorkspaceId) {
      setErrorMessage('Missing OAuth session token or workspace parameter.');
      setIsLoading(false);
      return;
    }

    let isMounted = true;
    setIsLoading(true);

    apiClient<{ accounts: CandidateSocialAccount[] }>(
      `/workspaces/${targetWorkspaceId}/social-accounts/meta/candidates?sessionToken=${encodeURIComponent(
        sessionToken,
      )}`,
    )
      .then((data) => {
        if (!isMounted) return;
        const list = data?.accounts || [];
        setCandidates(list);

        // Preselect all non-connected accounts by default for user convenience
        const initialSelected = new Set<string>();
        list.forEach((acc) => {
          if (!acc.isAlreadyConnected) {
            initialSelected.add(`${acc.provider}:${acc.id}`);
          }
        });
        setSelectedIds(initialSelected);
      })
      .catch((err: any) => {
        if (!isMounted) return;
        setErrorMessage(
          err.message || 'Failed to retrieve discovered social accounts. The session may have expired.',
        );
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [sessionToken, targetWorkspaceId]);

  const toggleAccount = (key: string, isAlreadyConnected?: boolean) => {
    if (isAlreadyConnected) return;

    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  const handleConnectSelected = async () => {
    if (!targetWorkspaceId || !sessionToken || selectedIds.size === 0) return;

    setIsSubmitting(true);
    setErrorMessage(null);

    const payloadAccounts = candidates
      .filter((acc) => selectedIds.has(`${acc.provider}:${acc.id}`))
      .map((acc) => ({
        providerAccountId: acc.id,
        provider: acc.provider,
        accountType: acc.accountType,
      }));

    try {
      await apiClient(`/workspaces/${targetWorkspaceId}/social-accounts/meta/select`, {
        method: 'POST',
        body: JSON.stringify({
          sessionToken,
          selectedAccounts: payloadAccounts,
        }),
      });

      setSuccessMessage('Selected social accounts connected successfully!');
      setTimeout(() => {
        router.push(ROUTES.SETTINGS_SOCIAL_ACCOUNTS);
      }, 1200);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to connect selected accounts');
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto py-16 text-center space-y-3">
        <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-xs text-slate-500 font-medium">Discovering authorized Facebook &amp; Instagram channels...</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fadeIn py-6">
      {/* Header */}
      <div className="text-center space-y-1">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-indigo-600 text-white shadow-md shadow-indigo-100 mb-2">
          <Share2 className="w-6 h-6" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Select Channels to Connect</h1>
        <p className="text-xs text-slate-500">
          We found the following accounts authorized by your Meta login. Choose which channels to connect to your workspace.
        </p>
      </div>

      {errorMessage && (
        <Card className="border-rose-200 bg-rose-50/50">
          <CardContent className="p-6 text-center space-y-3">
            <AlertCircle className="w-8 h-8 text-rose-500 mx-auto" />
            <p className="text-xs text-rose-700 font-medium">{errorMessage}</p>
            <Link href={ROUTES.SETTINGS_SOCIAL_ACCOUNTS}>
              <Button size="sm" variant="outline">
                Return to Social Accounts
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}

      {successMessage && (
        <Card className="border-emerald-200 bg-emerald-50/50">
          <CardContent className="p-6 text-center space-y-2">
            <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
            <p className="text-xs text-emerald-700 font-semibold">{successMessage}</p>
            <p className="text-[11px] text-emerald-600">Redirecting to your dashboard...</p>
          </CardContent>
        </Card>
      )}

      {!errorMessage && !successMessage && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Available Channels</CardTitle>
                <CardDescription>
                  Credentials will be encrypted with AES-256-GCM before saving
                </CardDescription>
              </div>
              <Badge variant="outline">{candidates.length} Discovered</Badge>
            </div>
          </CardHeader>

          <CardContent className="space-y-3">
            {candidates.length === 0 ? (
              <div className="py-8 text-center space-y-2">
                <p className="text-xs text-slate-500">
                  No Facebook Pages or Instagram Professional accounts were found for your Meta user.
                </p>
                <p className="text-[11px] text-slate-400">
                  Make sure you are an administrator of at least one Facebook Page or have connected an Instagram Professional account.
                </p>
              </div>
            ) : (
              candidates.map((account) => {
                const key = `${account.provider}:${account.id}`;
                const isSelected = selectedIds.has(key);
                const isFacebook = account.accountType === SocialAccountType.FACEBOOK_PAGE;

                return (
                  <div
                    key={key}
                    onClick={() => toggleAccount(key, account.isAlreadyConnected)}
                    className={`p-4 rounded-xl border transition-all flex items-center justify-between cursor-pointer select-none ${
                      account.isAlreadyConnected
                        ? 'border-slate-200 bg-slate-50 opacity-60 cursor-not-allowed'
                        : isSelected
                        ? 'border-indigo-600 bg-indigo-50/40 shadow-xs'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white shadow-xs ${
                          isFacebook ? 'bg-blue-600' : 'bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600'
                        }`}
                      >
                        {isFacebook ? 'f' : 'IG'}
                      </div>
                      <div>
                        <div className="font-semibold text-slate-900 text-sm flex items-center gap-2">
                          {account.name}
                          {account.isAlreadyConnected && (
                            <span className="text-[10px] bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded font-medium">
                              Already Connected
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-400 flex items-center gap-2">
                          <span>{isFacebook ? 'Facebook Page' : 'Instagram Professional'}</span>
                          {account.username && <span>• @{account.username}</span>}
                          {account.category && <span>• {account.category}</span>}
                        </div>
                      </div>
                    </div>

                    <div className="shrink-0 pl-3">
                      {!account.isAlreadyConnected && (
                        <div
                          className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors ${
                            isSelected
                              ? 'bg-indigo-600 border-indigo-600 text-white'
                              : 'border-slate-300 bg-white'
                          }`}
                        >
                          {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </CardContent>

          <CardFooter className="flex justify-between items-center pt-4 border-t border-slate-100">
            <Link href={ROUTES.SETTINGS_SOCIAL_ACCOUNTS}>
              <Button variant="ghost" size="sm">
                Cancel
              </Button>
            </Link>

            <Button
              size="sm"
              disabled={selectedIds.size === 0 || isSubmitting}
              isLoading={isSubmitting}
              onClick={handleConnectSelected}
              rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
            >
              Connect {selectedIds.size} Selected Channel(s)
            </Button>
          </CardFooter>
        </Card>
      )}
    </div>
  );
}

export default function ConnectCandidateAccountsPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-2xl mx-auto py-16 text-center space-y-3">
          <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-slate-500">Loading channel selection...</p>
        </div>
      }
    >
      <ConnectCandidateAccountsContent />
    </Suspense>
  );
}
