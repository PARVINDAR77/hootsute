'use client';

import React, { useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useTheme } from '@/lib/theme-context';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';
import { Shield, Key, User, LogOut, CheckCircle2, ShieldAlert, Palette, Sun, Moon } from 'lucide-react';

export default function SettingsPage() {
  const { user, logout, logoutAll } = useAuth();
  const { theme, setTheme, isDark } = useTheme();
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
    <div className="max-w-4xl mx-auto space-y-8 animate-fadeIn pb-12">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Account &amp; Security Settings</h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Manage your personal credentials, workspace role, appearance preference, and active session controls.
        </p>
      </div>

      {successMessage && <Alert type="success" message={successMessage} />}

      {/* Appearance & Dual Theme Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-brand-purple/10 text-brand-purple dark:text-brand-cyan">
              <Palette className="w-5 h-5" />
            </div>
            <div>
              <CardTitle>Interface Appearance</CardTitle>
              <CardDescription>Select your preferred SaaS display theme (synced to your user profile)</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => setTheme('light')}
              className={`p-4 rounded-2xl border text-left flex items-start gap-3 transition-all ${
                theme === 'light'
                  ? 'border-brand-purple bg-brand-purple/5 ring-2 ring-brand-purple/20'
                  : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900/60'
              }`}
            >
              <div className="p-2 rounded-xl bg-amber-50 text-amber-600 mt-0.5">
                <Sun className="w-5 h-5" />
              </div>
              <div>
                <span className="font-bold text-sm text-slate-900 dark:text-white block">Light Theme (Default)</span>
                <span className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 block">
                  Crisp #F7F8FC canvas with glassmorphism surfaces and vivid accents.
                </span>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setTheme('dark')}
              className={`p-4 rounded-2xl border text-left flex items-start gap-3 transition-all ${
                theme === 'dark'
                  ? 'border-brand-cyan bg-brand-cyan/5 ring-2 ring-brand-cyan/20'
                  : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900/60'
              }`}
            >
              <div className="p-2 rounded-xl bg-brand-purple/15 text-brand-purple dark:text-brand-cyan mt-0.5">
                <Moon className="w-5 h-5" />
              </div>
              <div>
                <span className="font-bold text-sm text-slate-900 dark:text-white block">Cosmic Dark Theme</span>
                <span className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 block">
                  Futuristic deep space #070A18 palette with glowing cyan and violet aura.
                </span>
              </div>
            </button>
          </div>
        </CardContent>
      </Card>

      {/* User Profile Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-brand-blue/10 text-brand-blue">
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
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
              <dt className="text-slate-400 dark:text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
                Full Name
              </dt>
              <dd className="font-semibold text-slate-800 dark:text-slate-100 text-sm mt-0.5">{user?.name}</dd>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
              <dt className="text-slate-400 dark:text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
                Email Address
              </dt>
              <dd className="font-semibold text-slate-800 dark:text-slate-100 text-sm mt-0.5">{user?.email}</dd>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
              <dt className="text-slate-400 dark:text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
                Authorization Role
              </dt>
              <dd className="mt-1">
                <Badge variant={user?.role === 'SUPER_ADMIN' ? 'purple' : 'default'}>
                  {user?.role}
                </Badge>
              </dd>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
              <dt className="text-slate-400 dark:text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
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
            <div className="p-2.5 rounded-xl bg-brand-purple/10 text-brand-purple dark:text-brand-cyan">
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
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800 space-y-2 text-xs text-slate-600 dark:text-slate-300">
            <div className="flex items-center gap-2 text-brand-purple dark:text-brand-cyan font-semibold">
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
