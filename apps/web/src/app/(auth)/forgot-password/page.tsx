'use client';

import React from 'react';
import Link from 'next/link';
import { ROUTES } from '@/lib/constants';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { ArrowLeft, MailCheck } from 'lucide-react';

export default function ForgotPasswordPage() {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-bold text-slate-900">Reset your password</h3>
        <p className="text-xs text-slate-500 mt-1">
          Password recovery and verification service status.
        </p>
      </div>

      <Alert
        type="info"
        title="Delivery Integration Pending"
        message="Automated email delivery via SMTP/Resend is scheduled for Phase 2/3. For Stage 1 security, please contact your workspace administrator or super-admin for password assistance."
      />

      <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 text-xs text-slate-600 space-y-2">
        <p className="font-semibold text-slate-800">Administrative Bootstrap Alternative:</p>
        <p>
          Administrators can reset or provision credentials using the server CLI:
        </p>
        <code className="block p-2 rounded bg-slate-900 text-slate-100 font-mono text-[11px] overflow-x-auto">
          npm run admin:create -- admin@domain.com &quot;NewPassword123!&quot;
        </code>
      </div>

      <Link href={ROUTES.LOGIN} className="block">
        <Button variant="outline" className="w-full" leftIcon={<ArrowLeft className="w-4 h-4" />}>
          Back to Sign In
        </Button>
      </Link>
    </div>
  );
}
