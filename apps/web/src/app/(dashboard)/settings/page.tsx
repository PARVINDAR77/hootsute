'use client';

import React, { useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';
import { Shield, Key, User, LogOut, CheckCircle2, ShieldAlert } from 'lucide-react';

export default function SettingsPage() {
  const { user, logout, logoutAll } = useAuth();
  const [isRevokingAll, setIsRevokingAll] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleRevokeAll = async () => {
    if (!confirm('Are you sure you want to invalidate all active login sessions across all browsers and devices?')) {
      return;
    }
    setIsRevokingAll(true);
    try {
      await logoutAll();
    } catch {
      setIsRevokingAll(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fadeIn">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Account &amp; Security Settings</h1>
        <p className="text-xs text-slate-500 mt-1">
          Manage your personal credentials, workspace role, and active session controls.
        </p>
      </div>

      {successMessage && <Alert type="success" message={successMessage} />}

      {/* User Profile Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600">
              <User className="w-5 h-5" />
            </div>
            <div>
              <CardTitle>Profile Details</CardTitle>
              <CardDescription>Your registered identity and workspace role</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
              <dt className="text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                Full Name
              </dt>
              <dd className="font-semibold text-slate-800 text-sm mt-0.5">{user?.name}</dd>
            </div>

            <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
              <dt className="text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                Email Address
              </dt>
              <dd className="font-semibold text-slate-800 text-sm mt-0.5">{user?.email}</dd>
            </div>

            <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
              <dt className="text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                Authorization Role
              </dt>
              <dd className="mt-1">
                <Badge variant={user?.role === 'SUPER_ADMIN' ? 'purple' : 'default'}>
                  {user?.role}
                </Badge>
              </dd>
            </div>

            <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
              <dt className="text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                Account Status
              </dt>
              <dd className="mt-1">
                <Badge variant="success">{user?.status}</Badge>
              </dd>
            </div>
          </dl>
        </CardContent>
      </Card>

      {/* Security & Sessions Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <CardTitle>Security &amp; Session Management</CardTitle>
              <CardDescription>
                Tokens, database-tracked sessions, and credential revocation
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2 text-xs text-slate-600">
            <div className="flex items-center gap-2 text-indigo-700 font-semibold">
              <CheckCircle2 className="w-4 h-4" />
              <span>Rotated Refresh Token Protection Active</span>
            </div>
            <p>
              Your session is secured using short-lived 15-minute JWT access tokens and 7-day cryptographically hashed refresh tokens stored in PostgreSQL. Token rotation and automatic reuse-detection ensure immediate session termination upon any anomalous token replay.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <Button
              variant="outline"
              onClick={() => logout()}
              leftIcon={<LogOut className="w-4 h-4" />}
            >
              Sign Out of This Browser
            </Button>

            <Button
              variant="danger"
              onClick={handleRevokeAll}
              isLoading={isRevokingAll}
              leftIcon={<ShieldAlert className="w-4 h-4" />}
            >
              Revoke All Active Sessions
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
