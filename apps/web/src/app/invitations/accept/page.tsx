'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { useWorkspace } from '@/lib/workspace-context';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Alert } from '@/components/ui/Alert';
import { apiClient } from '@/lib/api-client';
import {
  Building2,
  CheckCircle2,
  AlertCircle,
  LogIn,
  UserPlus,
  ArrowRight,
  ShieldCheck,
  Crown,
  Clock,
} from 'lucide-react';
import Link from 'next/link';
import { ROUTES } from '@/lib/constants';

interface InvitationInfo {
  id: string;
  email: string;
  role: 'ADMIN' | 'EDITOR' | 'VIEWER';
  expiresAt: string;
  workspace: {
    id: string;
    name: string;
    slug: string;
    logoUrl?: string | null;
    description?: string | null;
  };
  invitedBy?: {
    name: string;
    email: string;
  };
}

function InvitationAcceptContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const router = useRouter();

  const { user, isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const { refreshWorkspaces, switchWorkspace } = useWorkspace();

  const [invitationInfo, setInvitationInfo] = useState<InvitationInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAccepting, setIsAccepting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      setErrorMessage('Missing invitation token in the link.');
      setIsLoading(false);
      return;
    }

    let isMounted = true;
    setIsLoading(true);

    apiClient<InvitationInfo>(`/invitations/info?token=${encodeURIComponent(token)}`)
      .then((data) => {
        if (!isMounted) return;
        setInvitationInfo(data);
      })
      .catch((err) => {
        if (!isMounted) return;
        setErrorMessage(err.message || 'This invitation is invalid, expired, or already used.');
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [token]);

  const handleAccept = async () => {
    if (!token) return;

    setIsAccepting(true);
    setErrorMessage(null);

    try {
      const result = await apiClient<any>('/invitations/accept', {
        method: 'POST',
        body: JSON.stringify({ token }),
      });

      setSuccessMessage(result.message || 'Successfully joined the workspace!');
      await refreshWorkspaces();

      const joinedWorkspaceId = result.workspace?.id || invitationInfo?.workspace.id;
      if (joinedWorkspaceId) {
        switchWorkspace(joinedWorkspaceId);
      }

      setTimeout(() => {
        router.push(ROUTES.DASHBOARD);
      }, 1200);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to accept invitation.');
      setIsAccepting(false);
    }
  };

  if (isLoading || isAuthLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-slate-500 font-medium">Verifying invitation token...</p>
        </div>
      </div>
    );
  }

  const currentRedirectUrl = `/invitations/accept?token=${encodeURIComponent(token || '')}`;

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50/40 via-white to-slate-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-6 animate-fadeIn">
        {/* Logo / Header */}
        <div className="text-center space-y-1">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-indigo-600 text-white shadow-md shadow-indigo-200 mb-2">
            <Building2 className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Workspace Invitation</h1>
          <p className="text-xs text-slate-500">
            You have been invited to collaborate on OmniSocial AI
          </p>
        </div>

        {errorMessage && (
          <Card className="border-rose-200 bg-rose-50/50">
            <CardContent className="p-6 text-center space-y-3">
              <AlertCircle className="w-10 h-10 text-rose-500 mx-auto" />
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-rose-900">Invitation Unavailable</h3>
                <p className="text-xs text-rose-700">{errorMessage}</p>
              </div>
              <div className="pt-2">
                <Link href={ROUTES.LOGIN}>
                  <Button variant="outline" size="sm">
                    Return to Login
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        )}

        {successMessage && (
          <Card className="border-emerald-200 bg-emerald-50/50">
            <CardContent className="p-6 text-center space-y-3">
              <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-emerald-900">Welcome to the Team!</h3>
                <p className="text-xs text-emerald-700">{successMessage}</p>
              </div>
              <p className="text-[11px] text-emerald-600">Redirecting to your dashboard...</p>
            </CardContent>
          </Card>
        )}

        {invitationInfo && !errorMessage && !successMessage && (
          <Card className="border-slate-200 shadow-sm">
            <CardHeader className="text-center pb-4 border-b border-slate-100">
              <div className="w-14 h-14 rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xl mx-auto shadow-2xs">
                {invitationInfo.workspace.name.charAt(0).toUpperCase()}
              </div>
              <CardTitle className="mt-3 text-lg">{invitationInfo.workspace.name}</CardTitle>
              <CardDescription>
                {invitationInfo.workspace.description || 'OmniSocial AI Collaborative Workspace'}
              </CardDescription>
              <div className="pt-2 flex items-center justify-center gap-2">
                <Badge variant="purple">{invitationInfo.role} ROLE</Badge>
                <Badge variant="outline">@{invitationInfo.workspace.slug}</Badge>
              </div>
            </CardHeader>

            <CardContent className="space-y-4 pt-5">
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 text-xs text-slate-600 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 font-medium">Invited By:</span>
                  <span className="font-semibold text-slate-800">
                    {invitationInfo.invitedBy?.name || 'Workspace Administrator'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 font-medium">Recipient Email:</span>
                  <span className="font-mono text-slate-800">{invitationInfo.email}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 font-medium">Expires On:</span>
                  <span className="text-slate-600 flex items-center gap-1">
                    <Clock className="w-3 h-3 text-slate-400" />
                    {new Date(invitationInfo.expiresAt).toLocaleDateString()}
                  </span>
                </div>
              </div>

              {isAuthenticated ? (
                <div className="space-y-3 pt-2">
                  <div className="text-xs text-center text-slate-500">
                    Logged in as <strong className="text-slate-800">{user?.email}</strong>
                  </div>
                  <Button
                    className="w-full"
                    size="lg"
                    isLoading={isAccepting}
                    onClick={handleAccept}
                    rightIcon={<ArrowRight className="w-4 h-4" />}
                  >
                    Accept Invitation &amp; Join
                  </Button>
                </div>
              ) : (
                <div className="space-y-3 pt-2">
                  <p className="text-xs text-center text-slate-500">
                    Please sign in with your account or create a new account to join this workspace.
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    <Link
                      href={`${ROUTES.LOGIN}?redirect=${encodeURIComponent(currentRedirectUrl)}`}
                      className="w-full"
                    >
                      <Button
                        variant="primary"
                        className="w-full text-xs"
                        leftIcon={<LogIn className="w-3.5 h-3.5" />}
                      >
                        Sign In
                      </Button>
                    </Link>
                    <Link
                      href={`${ROUTES.REGISTER}?redirect=${encodeURIComponent(currentRedirectUrl)}`}
                      className="w-full"
                    >
                      <Button
                        variant="outline"
                        className="w-full text-xs"
                        leftIcon={<UserPlus className="w-3.5 h-3.5" />}
                      >
                        Register
                      </Button>
                    </Link>
                  </div>
                </div>
              )}
            </CardContent>

            <CardFooter className="justify-center border-t border-slate-100 py-3 text-[11px] text-slate-400">
              <ShieldCheck className="w-3.5 h-3.5 mr-1 text-slate-400" />
              Cryptographically verified &amp; tenant isolated
            </CardFooter>
          </Card>
        )}
      </div>
    </div>
  );
}

export default function InvitationAcceptPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
          <div className="text-center space-y-3">
            <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs text-slate-500">Loading invitation...</p>
          </div>
        </div>
      }
    >
      <InvitationAcceptContent />
    </Suspense>
  );
}
