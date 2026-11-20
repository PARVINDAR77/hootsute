'use client';

import React, { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { ROUTES } from '@/lib/constants';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { apiClient } from '@/lib/api-client';
import { CheckCircle2, Loader2, ArrowRight } from 'lucide-react';

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>(
    token ? 'loading' : 'error',
  );
  const [message, setMessage] = useState<string>(
    token ? 'Verifying your email address...' : 'Missing verification token in URL.',
  );

  useEffect(() => {
    if (!token) return;
    apiClient('/auth/verify-email', {
      method: 'POST',
      body: JSON.stringify({ token }),
    })
      .then(() => {
        setStatus('success');
        setMessage('Your email address has been verified successfully.');
      })
      .catch((err: any) => {
        setStatus('error');
        setMessage(err?.message || 'Verification token is invalid or expired.');
      });
  }, [token]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-[#111827] dark:text-white">
          Email Verification
        </h1>
        <p className="text-sm text-[#64748B] dark:text-slate-400 mt-1">
          Confirming ownership of your workspace email address.
        </p>
      </div>

      {status === 'loading' && (
        <div className="flex items-center gap-3 p-4 rounded-2xl bg-[#F7F8FC] dark:bg-white/5 border border-[#E7EAF2] dark:border-white/10">
          <Loader2 className="w-5 h-5 animate-spin text-[#7138F5] dark:text-[#20C8E8]" />
          <span className="text-sm font-medium text-[#111827] dark:text-slate-200">{message}</span>
        </div>
      )}

      {status === 'success' && (
        <Alert type="success" title="Email Verified" message={message} />
      )}

      {status === 'error' && (
        <Alert type="error" title="Verification Failed" message={message} />
      )}

      <Link href={status === 'success' ? ROUTES.DASHBOARD : ROUTES.LOGIN} className="block">
        <Button
          size="lg"
          className="w-full"
          rightIcon={
            status === 'success' ? (
              <CheckCircle2 className="w-4 h-4" />
            ) : (
              <ArrowRight className="w-4 h-4" />
            )
          }
        >
          {status === 'success' ? 'Open Workspace Dashboard' : 'Go to Sign In'}
        </Button>
      </Link>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<div className="py-12 text-center text-sm text-slate-400">Loading...</div>}>
      <VerifyEmailContent />
    </Suspense>
  );
}
