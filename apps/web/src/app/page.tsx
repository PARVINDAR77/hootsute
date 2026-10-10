'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { ROUTES } from '@/lib/constants';
import { Loader2 } from 'lucide-react';

export default function HomePage() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      if (isAuthenticated) {
        router.replace(ROUTES.DASHBOARD);
      } else {
        router.replace(ROUTES.LOGIN);
      }
    }
  }, [isLoading, isAuthenticated, router]);

  // Fallback safety: redirect to login if verification takes more than 2 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!isAuthenticated) {
        router.replace(ROUTES.LOGIN);
      }
    }, 2000);
    return () => clearTimeout(timer);
  }, [isAuthenticated, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
        <p className="text-xs font-medium text-slate-500 tracking-wide">
          Verifying session status...
        </p>
      </div>
    </div>
  );
}
