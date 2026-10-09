'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useWorkspace } from '@/lib/workspace-context';
import { useAuth } from '@/lib/auth-context';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Alert } from '@/components/ui/Alert';
import { apiClient } from '@/lib/api-client';
import {
  Users,
  UserPlus,
  Shield,
  Crown,
  Trash2,
  ArrowRightLeft,
  CheckCircle2,
  AlertTriangle,
  Mail,
  UserCheck,
  X,
} from 'lucide-react';
import Link from 'next/link';
import { ROUTES } from '@/lib/constants';

interface MemberUser {
  id: string;
  name: string;
  email: string;
  status: string;
}

interface WorkspaceMember {
  id: string;
  workspaceId: string;
  userId: string;
  role: 'OWNER' | 'ADMIN' | 'EDITOR' | 'VIEWER';
  status: 'ACTIVE' | 'SUSPENDED' | 'INVITED';
  joinedAt: string;
  createdAt: string;
  user: MemberUser;
}

export default function WorkspaceMembersPage() {
  const { currentWorkspace, refreshWorkspaces, isLoadingWorkspaces } = useWorkspace();
  const { user: currentUser } = useAuth();

  const [members, setMembers] = useState<WorkspaceMember[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Transfer ownership modal state
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [targetMemberId, setTargetMemberId] = useState<string>('');
  const [isTransferring, setIsTransferring] = useState(false);

  // Active user's membership role in this workspace
  const currentMemberRecord = members.find((m) => m.userId === currentUser?.id);
  const currentUserRole = currentMemberRecord?.role || currentWorkspace?.currentUserRole;

  const isOwner = currentUserRole === 'OWNER';
  const isAdmin = currentUserRole === 'ADMIN' || isOwner;

  const fetchMembers = useCallback(async () => {
    if (!currentWorkspace?.id) return;
    setIsLoading(true);
    try {
      const data = await apiClient<WorkspaceMember[]>(`/workspaces/${currentWorkspace.id}/members`);
      setMembers(data || []);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to load workspace members');
    } finally {
      setIsLoading(false);
    }
  }, [currentWorkspace?.id]);

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  const handleRoleChange = async (memberId: string, newRole: 'ADMIN' | 'EDITOR' | 'VIEWER') => {
    if (!currentWorkspace?.id) return;
    setSuccessMessage(null);
    setErrorMessage(null);

    try {
      await apiClient(`/workspaces/${currentWorkspace.id}/members/${memberId}`, {
        method: 'PATCH',
        body: JSON.stringify({ role: newRole }),
      });
      setSuccessMessage('Member role updated successfully');
      await fetchMembers();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to update member role');
    }
  };

  const handleRemoveMember = async (memberId: string, memberName: string, isSelf: boolean) => {
    if (!currentWorkspace?.id) return;

    const confirmText = isSelf
      ? 'Are you sure you want to leave this workspace?'
      : `Are you sure you want to remove ${memberName} from this workspace?`;

    if (!confirm(confirmText)) return;

    setSuccessMessage(null);
    setErrorMessage(null);

    try {
      await apiClient(`/workspaces/${currentWorkspace.id}/members/${memberId}`, {
        method: 'DELETE',
      });

      if (isSelf) {
        await refreshWorkspaces();
        window.location.href = ROUTES.DASHBOARD;
      } else {
        setSuccessMessage(`${memberName} was removed from the workspace`);
        await fetchMembers();
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to remove member');
    }
  };

  const handleTransferOwnership = async () => {
    if (!currentWorkspace?.id || !targetMemberId) return;

    const target = members.find((m) => m.id === targetMemberId);
    if (!target) return;

    if (
      !confirm(
        `Are you sure you want to transfer ownership of "${currentWorkspace.name}" to ${target.user.name}? You will step down to an ADMIN role.`,
      )
    ) {
      return;
    }

    setIsTransferring(true);
    setSuccessMessage(null);
    setErrorMessage(null);

    try {
      await apiClient(`/workspaces/${currentWorkspace.id}/transfer-ownership`, {
        method: 'POST',
        body: JSON.stringify({ targetMemberId }),
      });

      setSuccessMessage(`Ownership successfully transferred to ${target.user.name}`);
      setIsTransferModalOpen(false);
      await fetchMembers();
      await refreshWorkspaces();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to transfer ownership');
    } finally {
      setIsTransferring(false);
    }
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'OWNER':
        return 'purple';
      case 'ADMIN':
        return 'default';
      case 'EDITOR':
        return 'outline';
      default:
        return 'outline';
    }
  };

  if (isLoadingWorkspaces) {
    return (
      <div className="max-w-5xl mx-auto py-12 text-center space-y-3">
        <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-xs text-slate-500">Loading team members...</p>
      </div>
    );
  }

  if (!currentWorkspace) {
    return (
      <div className="max-w-md mx-auto py-12 text-center space-y-4">
        <Users className="w-10 h-10 text-slate-400 mx-auto" />
        <h2 className="text-lg font-bold text-slate-900">No Workspace Selected</h2>
        <p className="text-xs text-slate-500">Select or create a workspace to view team members.</p>
        <Link href={ROUTES.WORKSPACE_ONBOARDING}>
          <Button size="sm">Create Workspace</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Team Members</h1>
            <Badge variant="outline">{members.length} Total</Badge>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Manage who has access to {currentWorkspace.name} and configure their roles.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {isOwner && members.length > 1 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsTransferModalOpen(true)}
              leftIcon={<ArrowRightLeft className="w-3.5 h-3.5" />}
            >
              Transfer Ownership
            </Button>
          )}

          {isAdmin && (
            <Link href={ROUTES.SETTINGS_INVITATIONS}>
              <Button size="sm" leftIcon={<UserPlus className="w-3.5 h-3.5" />}>
                Invite Member
              </Button>
            </Link>
          )}
        </div>
      </div>

      {successMessage && <Alert type="success" message={successMessage} />}
      {errorMessage && <Alert type="error" message={errorMessage} />}

      {/* Members Table Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <CardTitle>Workspace Roster</CardTitle>
                <CardDescription>
                  Roles define platform capabilities and resource authorizations
                </CardDescription>
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50/75 border-y border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-4">Member</th>
                  <th className="py-3 px-4">Role</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Joined</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {isLoading ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-400">
                      Loading team members...
                    </td>
                  </tr>
                ) : members.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-400">
                      No members found in this workspace.
                    </td>
                  </tr>
                ) : (
                  members.map((member) => {
                    const isSelf = member.userId === currentUser?.id;
                    const isTargetOwner = member.role === 'OWNER';
                    const isTargetAdmin = member.role === 'ADMIN';

                    // Permission logic:
                    // Only OWNER or ADMIN can change roles.
                    // Cannot change OWNER role.
                    // ADMIN cannot change another ADMIN role.
                    const canEditThisMemberRole =
                      isAdmin &&
                      !isTargetOwner &&
                      !(currentUserRole === 'ADMIN' && isTargetAdmin) &&
                      !isSelf;

                    // Cannot remove OWNER (final-owner protection)
                    // ADMIN cannot remove another ADMIN
                    const canRemoveThisMember =
                      !isTargetOwner &&
                      (isSelf || (isOwner || (isAdmin && !isTargetAdmin)));

                    return (
                      <tr key={member.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs shrink-0">
                              {member.user.name?.charAt(0).toUpperCase() || 'U'}
                            </div>
                            <div>
                              <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                                {member.user.name}
                                {isSelf && (
                                  <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-medium">
                                    You
                                  </span>
                                )}
                              </div>
                              <div className="text-slate-500 text-[11px]">{member.user.email}</div>
                            </div>
                          </div>
                        </td>

                        <td className="py-3.5 px-4">
                          {canEditThisMemberRole ? (
                            <select
                              value={member.role}
                              onChange={(e) =>
                                handleRoleChange(
                                  member.id,
                                  e.target.value as 'ADMIN' | 'EDITOR' | 'VIEWER',
                                )
                              }
                              className="text-xs font-semibold rounded-md border border-slate-300 bg-white py-1 px-2 text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                            >
                              <option value="ADMIN">ADMIN</option>
                              <option value="EDITOR">EDITOR</option>
                              <option value="VIEWER">VIEWER</option>
                            </select>
                          ) : (
                            <div className="flex items-center gap-1.5">
                              {isTargetOwner && <Crown className="w-3.5 h-3.5 text-amber-500" />}
                              <Badge variant={getRoleBadgeVariant(member.role)}>
                                {member.role}
                              </Badge>
                            </div>
                          )}
                        </td>

                        <td className="py-3.5 px-4">
                          <Badge variant={member.status === 'ACTIVE' ? 'success' : 'outline'}>
                            {member.status}
                          </Badge>
                        </td>

                        <td className="py-3.5 px-4 text-slate-500">
                          {new Date(member.joinedAt || member.createdAt).toLocaleDateString()}
                        </td>

                        <td className="py-3.5 px-4 text-right">
                          {canRemoveThisMember ? (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                handleRemoveMember(member.id, member.user.name, isSelf)
                              }
                              className={isSelf ? 'text-slate-600' : 'text-rose-600 hover:text-rose-700 hover:bg-rose-50'}
                              leftIcon={
                                isSelf ? undefined : <Trash2 className="w-3.5 h-3.5" />
                              }
                            >
                              {isSelf ? 'Leave Workspace' : 'Remove'}
                            </Button>
                          ) : (
                            <span className="text-slate-400 text-[11px]">Protected</span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Transfer Ownership Modal */}
      {isTransferModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 space-y-4 border border-slate-100">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2 text-amber-600 font-bold">
                <Crown className="w-5 h-5" />
                <h3 className="text-slate-900 text-base">Transfer Workspace Ownership</h3>
              </div>
              <button
                onClick={() => setIsTransferModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 space-y-1">
              <span className="font-semibold block flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                Ownership Transfer Warning
              </span>
              <p>
                Transferring ownership gives full control of this workspace to another member. You
                will be demoted to an <strong>ADMIN</strong> and cannot undo this action without the
                new owner's consent.
              </p>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                Select New Owner
              </label>
              <select
                value={targetMemberId}
                onChange={(e) => setTargetMemberId(e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">Choose a team member...</option>
                {members
                  .filter((m) => m.userId !== currentUser?.id && m.status === 'ACTIVE')
                  .map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.user.name} ({m.user.email}) — current: {m.role}
                    </option>
                  ))}
              </select>
            </div>

            <div className="flex justify-end gap-2.5 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsTransferModalOpen(false)}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                size="sm"
                disabled={!targetMemberId || isTransferring}
                isLoading={isTransferring}
                onClick={handleTransferOwnership}
              >
                Confirm Ownership Transfer
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
