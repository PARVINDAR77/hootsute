'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ROUTES } from '@/lib/constants';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { apiClient, unwrapData } from '@/lib/api-client';
import { ArrowLeft, Mail, Send, ExternalLink } from 'lucide-react';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [devResetUrl, setDevResetUrl] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);
    setDevResetUrl(null);

    if (!email.includes('@')) {
      setError('Please enter a valid email address.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await apiClient<any>('/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = unwrapData<any>(res);
      setSuccessMessage(
        data?.message ||
          'If an account exists with that email address, a password reset link has been issued.',
      );
      if (data?.devResetUrl) {
        setDevResetUrl(data.devResetUrl);
      }
    } catch (err: any) {
      setError(err?.message || 'Unable to process password reset right now.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-[#111827] dark:text-white">
          Reset Your Password
        </h1>
        <p className="text-sm text-[#64748B] dark:text-slate-400 mt-1">
          Enter your email address and we&apos;ll issue an expiring cryptographic reset link.
        </p>
      </div>

      {error && <Alert type="error" message={error} />}
      {successMessage && (
        <Alert type="success" title="Reset Request Processed" message={successMessage} />
      )}

      {devResetUrl && (
        <div className="p-4 rounded-2xl bg-[#F1EBFF] dark:bg-[#7138F5]/20 border border-[#7138F5]/30 space-y-2">
          <p className="text-xs font-bold text-[#4C18C4] dark:text-[#C4A5FF]">
            Development Mode Reset Link (expires in 30 minutes):
          </p>
          <a
            href={devResetUrl}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#7138F5] dark:text-[#20C8E8] break-all hover:underline"
          >
            <span>Open Password Reset Page</span>
            <ExternalLink className="w-3.5 h-3.5 shrink-0" />
          </a>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Email Address"
          type="email"
          required
          autoComplete="email"
          placeholder="alex@company.com"
          leftIcon={<Mail className="w-4 h-4" />}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <Button
          type="submit"
          size="lg"
          className="w-full btn-gradient shadow-glow-purple hover:scale-[1.01] active:scale-[0.99] transition-all font-bold"
          isLoading={isSubmitting}
          rightIcon={<Send className="w-4 h-4" />}
        >
          Send Reset Link
        </Button>
      </form>

      <div className="pt-4 border-t border-[#E7EAF2] dark:border-white/10">
        <Link
          href={ROUTES.LOGIN}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-[#64748B] dark:text-slate-300 hover:text-[#7138F5] dark:hover:text-[#20C8E8]"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Sign In
        </Link>
      </div>
    </div>
  );
}
