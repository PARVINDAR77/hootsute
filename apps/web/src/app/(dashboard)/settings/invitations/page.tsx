'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useWorkspace } from '@/lib/workspace-context';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Alert } from '@/components/ui/Alert';
import { apiClient } from '@/lib/api-client';
import {
  Mail,
  UserPlus,
  Copy,
  Check,
  Trash2,
  Clock,
  ShieldCheck,
  AlertCircle,
  Users,
  ExternalLink,
} from 'lucide-react';
import Link from 'next/link';
import { ROUTES } from '@/lib/constants';

interface Invitation {
  id: string;
  workspaceId: string;
  email: string;
  role: 'ADMIN' | 'EDITOR' | 'VIEWER';
  expiresAt: string;
  createdAt: string;
  invitedBy?: {
    id: string;
    name: string;
    email: string;
  };
}

export default function WorkspaceInvitationsPage() {
  const { currentWorkspace, isLoadingWorkspaces } = useWorkspace();

  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Invite Form fields
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'ADMIN' | 'EDITOR' | 'VIEWER'>('EDITOR');

  // Generated invitation in dev mode
  const [latestInviteUrl, setLatestInviteUrl] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState(false);

  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const canInvite =
    currentWorkspace?.currentUserRole === 'OWNER' ||
    currentWorkspace?.currentUserRole === 'ADMIN';

  const fetchInvitations = useCallback(async () => {
    if (!currentWorkspace?.id || !canInvite) return;
    setIsLoading(true);
    try {
      const data = await apiClient<Invitation[]>(`/workspaces/${currentWorkspace.id}/invitations`);
      setInvitations(data || []);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to load invitations');
    } finally {
      setIsLoading(false);
    }
  }, [currentWorkspace?.id, canInvite]);

  useEffect(() => {
    fetchInvitations();
  }, [fetchInvitations]);

  const handleSendInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentWorkspace?.id || !canInvite) return;

    setIsSubmitting(true);
    setSuccessMessage(null);
    setErrorMessage(null);
    setLatestInviteUrl(null);
    setIsCopied(false);

    try {
      const result = await apiClient<any>(`/workspaces/${currentWorkspace.id}/invitations`, {
        method: 'POST',
        body: JSON.stringify({ email: email.trim(), role }),
      });

      setSuccessMessage(`Invitation successfully generated for ${email}`);
      setEmail('');

      if (result?.invitationUrl) {
        setLatestInviteUrl(result.invitationUrl);
      }

      await fetchInvitations();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to create invitation');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRevoke = async (invitationId: string, emailToRevoke: string) => {
    if (!currentWorkspace?.id) return;
    if (!confirm(`Are you sure you want to revoke the invitation for ${emailToRevoke}?`)) return;

    setSuccessMessage(null);
    setErrorMessage(null);

    try {
      await apiClient(
        `/workspaces/${currentWorkspace.id}/invitations/${invitationId}/revoke`,
        { method: 'POST' },
      );
      setSuccessMessage(`Invitation for ${emailToRevoke} has been revoked`);
      await fetchInvitations();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to revoke invitation');
    }
  };

  const copyToClipboard = (url: string) => {
    navigator.clipboard.writeText(url);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2500);
  };

  if (isLoadingWorkspaces) {
    return (
      <div className="max-w-4xl mx-auto py-12 text-center space-y-3">
        <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-xs text-slate-500">Loading invitations...</p>
      </div>
    );
  }

  if (!currentWorkspace) {
    return (
      <div className="max-w-md mx-auto py-12 text-center space-y-4">
        <Mail className="w-10 h-10 text-slate-400 mx-auto" />
        <h2 className="text-lg font-bold text-slate-900">No Active Workspace</h2>
        <p className="text-xs text-slate-500">Select a workspace to manage membership invitations.</p>
        <Link href={ROUTES.WORKSPACE_ONBOARDING}>
          <Button size="sm">Create Workspace</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Team Invitations</h1>
            <Badge variant="outline">{invitations.length} Pending</Badge>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Invite colleagues and contributors to {currentWorkspace.name} with designated roles.
          </p>
        </div>

        <Link href={ROUTES.SETTINGS_MEMBERS}>
          <Button variant="outline" size="sm" leftIcon={<Users className="w-3.5 h-3.5" />}>
            View Active Members
          </Button>
        </Link>
      </div>

      {successMessage && <Alert type="success" message={successMessage} />}
      {errorMessage && <Alert type="error" message={errorMessage} />}

      {!canInvite ? (
        <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800 flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold block">Unauthorized Action</span>
            You need <strong>OWNER</strong> or <strong>ADMIN</strong> permissions in this workspace to
            issue or revoke member invitations.
          </div>
        </div>
      ) : (
        <>
          {/* Invite Form Card */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <CardTitle>Invite New Member</CardTitle>
                  <CardDescription>
                    Invitations expire in 7 days and are strictly single-use cryptographically hashed tokens.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>

            <CardContent>
              <form onSubmit={handleSendInvite} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="md:col-span-2">
                    <Input
                      label="Recipient Email Address"
                      type="email"
                      required
                      placeholder="teammate@company.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      leftIcon={<Mail className="w-4 h-4" />}
                    />
                  </div>

                  <div className="w-full space-y-1.5">
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                      Workspace Role
                    </label>
                    <select
                      value={role}
                      onChange={(e) => setRole(e.target.value as any)}
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="VIEWER">VIEWER (Read-only access)</option>
                      <option value="EDITOR">EDITOR (Create &amp; edit content)</option>
                      <option value="ADMIN">ADMIN (Manage settings &amp; team)</option>
                    </select>
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <Button
                    type="submit"
                    isLoading={isSubmitting}
                    leftIcon={<UserPlus className="w-4 h-4" />}
                  >
                    Generate &amp; Send Invitation
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Development Mode Quick Link Banner */}
          {latestInviteUrl && (
            <div className="p-4 rounded-xl bg-indigo-50 border border-indigo-200 text-xs text-indigo-950 space-y-2 animate-fadeIn">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 font-bold text-indigo-700">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Invitation Link Ready (Development Mode)</span>
                </div>
                <button
                  onClick={() => copyToClipboard(latestInviteUrl)}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-white text-indigo-700 font-semibold border border-indigo-300 hover:bg-indigo-100 transition-colors shadow-2xs"
                >
                  {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{isCopied ? 'Copied!' : 'Copy Link'}</span>
                </button>
              </div>
              <p className="text-[11px] text-indigo-800">
                In honest development mode without a production SMTP provider configured, share this
                direct link to test token verification and the acceptance flow:
              </p>
              <div className="p-2 bg-white rounded-lg border border-indigo-200 font-mono text-[11px] text-slate-700 break-all select-all">
                {latestInviteUrl}
              </div>
            </div>
          )}

          {/* Pending Invitations Table */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Pending Invitations</CardTitle>
                  <CardDescription>
                    Currently outstanding invitations awaiting user acceptance
                  </CardDescription>
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50/75 border-y border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                      <th className="py-3 px-4">Invited Email</th>
                      <th className="py-3 px-4">Assigned Role</th>
                      <th className="py-3 px-4">Invited By</th>
                      <th className="py-3 px-4">Expires</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {isLoading ? (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-slate-400">
                          Loading pending invitations...
                        </td>
                      </tr>
                    ) : invitations.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-slate-400">
                          No pending invitations for this workspace.
                        </td>
                      </tr>
                    ) : (
                      invitations.map((inv) => (
                        <tr key={inv.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="py-3.5 px-4 font-semibold text-slate-900">
                            <div className="flex items-center gap-2">
                              <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              <span>{inv.email}</span>
                            </div>
                          </td>

                          <td className="py-3.5 px-4">
                            <Badge variant={inv.role === 'ADMIN' ? 'default' : 'outline'}>
                              {inv.role}
                            </Badge>
                          </td>

                          <td className="py-3.5 px-4 text-slate-600">
                            {inv.invitedBy?.name || 'Administrator'}
                          </td>

                          <td className="py-3.5 px-4 text-slate-500">
                            <div className="flex items-center gap-1">
                              <Clock className="w-3 h-3 text-slate-400" />
                              <span>{new Date(inv.expiresAt).toLocaleDateString()}</span>
                            </div>
                          </td>

                          <td className="py-3.5 px-4 text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRevoke(inv.id, inv.email)}
                              className="text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                              leftIcon={<Trash2 className="w-3.5 h-3.5" />}
                            >
                              Revoke
                            </Button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
