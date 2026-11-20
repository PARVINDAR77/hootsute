'use client';

import React, { Suspense, useState } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { ROUTES } from '@/lib/constants';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { apiClient, unwrapData } from '@/lib/api-client';
import { ArrowLeft, KeyRound, Lock, CheckCircle2 } from 'lucide-react';

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialToken = searchParams.get('token') || '';

  const [token, setToken] = useState(initialToken);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!token.trim()) {
      setError('A valid reset token is required.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await apiClient<any>('/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({ token: token.trim(), newPassword }),
      });
      unwrapData(res);
      setDone(true);
      setTimeout(() => router.push(ROUTES.LOGIN), 2500);
    } catch (err: any) {
      setError(err?.message || 'Invalid or expired reset token.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-[#111827] dark:text-white">
          Set New Password
        </h1>
        <p className="text-sm text-[#64748B] dark:text-slate-400 mt-1">
          Verify your expiring reset token and choose a strong new password.
        </p>
      </div>

      {error && <Alert type="error" message={error} />}

      {done ? (
        <div className="space-y-4">
          <Alert
            type="success"
            title="Password Updated"
            message="Your password has been reset and all older sessions were revoked. Redirecting to Sign In..."
          />
          <Link href={ROUTES.LOGIN} className="block">
            <Button className="w-full" leftIcon={<CheckCircle2 className="w-4 h-4" />}>
              Continue to Sign In
            </Button>
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {!initialToken && (
            <Input
              label="Reset Token"
              placeholder="Paste your reset token"
              leftIcon={<KeyRound className="w-4 h-4" />}
              value={token}
              onChange={(e) => setToken(e.target.value)}
              required
            />
          )}

          <Input
            label="New Password"
            type="password"
            placeholder="Min. 8 chars with uppercase, lowercase & number"
            leftIcon={<Lock className="w-4 h-4" />}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
          />

          <Input
            label="Confirm New Password"
            type="password"
            placeholder="Re-enter your new password"
            leftIcon={<Lock className="w-4 h-4" />}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />

          <Button type="submit" size="lg" className="w-full btn-gradient shadow-glow-purple hover:scale-[1.01] active:scale-[0.99] transition-all font-bold" isLoading={isSubmitting}>
            Update Password
          </Button>
        </form>
      )}

      <div className="pt-4 border-t border-[#E7EAF2] dark:border-white/10">
        <Link
          href={ROUTES.LOGIN}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-[#64748B] dark:text-slate-300 hover:text-[#7138F5] dark:hover:text-[#20C8E8]"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Return to Sign In
        </Link>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="py-12 text-center text-sm text-slate-400">Loading...</div>}>
      <ResetPasswordForm />
    </Suspense>
  );
}
