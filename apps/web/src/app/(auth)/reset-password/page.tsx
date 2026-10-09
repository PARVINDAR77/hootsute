'use client';

import React from 'react';
import Link from 'next/link';
import { ROUTES } from '@/lib/constants';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { ArrowLeft } from 'lucide-react';

export default function ResetPasswordPage() {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-bold text-slate-900">Set new password</h3>
        <p className="text-xs text-slate-500 mt-1">
          Cryptographic token verification.
        </p>
      </div>

      <Alert
        type="warning"
        title="Token Verification Required"
        message="Password resets require a cryptographically signed expiring token delivered via verified email. Direct token resets without verification are disabled."
      />

      <Link href={ROUTES.LOGIN} className="block">
        <Button variant="outline" className="w-full" leftIcon={<ArrowLeft className="w-4 h-4" />}>
          Return to Sign In
        </Button>
      </Link>
    </div>
  );
}
