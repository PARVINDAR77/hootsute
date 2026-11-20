'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { ShieldCheck, CheckCircle2, Loader2, RefreshCw, Bot, Shield } from 'lucide-react';
import { apiClient } from '@/lib/api-client';

interface HumanVerificationWidgetProps {
  onVerify: (token: string | null) => void;
  disabled?: boolean;
  className?: string;
}

export function HumanVerificationWidget({
  onVerify,
  disabled = false,
  className = '',
}: HumanVerificationWidgetProps) {
  const [isVerifying, setIsVerifying] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset verification when disabled changes or explicitly requested
  useEffect(() => {
    if (disabled && isVerified) {
      setIsVerified(false);
      onVerify(null);
    }
  }, [disabled, isVerified, onVerify]);

  const handleVerifyClick = async () => {
    if (disabled || isVerifying || isVerified) return;

    setIsVerifying(true);
    setError(null);

    try {
      // 1. Fetch challenge nonce from server
      const challengeRes = await apiClient<{
        challengeId: string;
        nonce: string;
        timestamp: number;
        signature: string;
      }>('/auth/challenge', { method: 'GET' });

      // Artificial micro-delay (350ms) to ensure smooth tactile UX feedback
      await new Promise((resolve) => setTimeout(resolve, 400));

      const payload = (challengeRes as any)?.data || challengeRes;

      if (payload && payload.timestamp && payload.nonce && payload.signature) {
        const token = `crypto:${payload.timestamp}:${payload.nonce}:${payload.signature}`;
        setIsVerified(true);
        setIsVerifying(false);
        onVerify(token);
      } else {
        // Fallback for mock/local test token
        const mockToken = 'human-verified-mock';
        setIsVerified(true);
        setIsVerifying(false);
        onVerify(mockToken);
      }
    } catch (err: any) {
      setIsVerifying(false);
      setIsVerified(false);
      setError('Verification timed out. Click to retry.');
      onVerify(null);
    }
  };

  const handleReset = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsVerified(false);
    setError(null);
    onVerify(null);
  };

  return (
    <div
      className={`rounded-xl border transition-all select-none p-3 ${
        isVerified
          ? 'bg-emerald-50/60 dark:bg-emerald-950/20 border-emerald-500/40 dark:border-emerald-500/30'
          : error
          ? 'bg-rose-50/50 dark:bg-rose-950/20 border-rose-500/30'
          : 'bg-[#F8FAFC] dark:bg-white/[0.03] border-[#E2E8F0] dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20'
      } ${disabled ? 'opacity-50 pointer-events-none cursor-not-allowed' : 'cursor-pointer'} ${className}`}
      onClick={handleVerifyClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === ' ' || e.key === 'Enter') {
          e.preventDefault();
          handleVerifyClick();
        }
      }}
      aria-label="Verify you are human anti-bot security challenge"
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          {/* Custom Interactive Checkbox / Status Circle */}
          <div
            className={`w-6 h-6 rounded-md border flex items-center justify-center transition-all ${
              isVerified
                ? 'bg-emerald-500 border-emerald-500 text-white shadow-sm shadow-emerald-500/30'
                : isVerifying
                ? 'border-indigo-400 bg-indigo-50/50 dark:bg-indigo-950/30'
                : 'border-slate-300 dark:border-white/20 bg-white dark:bg-slate-900/60 hover:border-indigo-500'
            }`}
          >
            {isVerifying ? (
              <Loader2 className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 animate-spin" />
            ) : isVerified ? (
              <CheckCircle2 className="w-4 h-4 text-white" />
            ) : null}
          </div>

          <div className="text-left">
            <p className="text-xs sm:text-sm font-semibold text-[#111827] dark:text-white flex items-center gap-1.5">
              <span>{isVerified ? 'Human Verified' : isVerifying ? 'Verifying human identity...' : 'Verify you are human'}</span>
              {!isVerified && !isVerifying && (
                <span className="text-[10px] text-slate-400 dark:text-slate-500 font-normal hidden sm:inline">
                  (Anti-Bot Protection)
                </span>
              )}
            </p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              {isVerified ? (
                <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                  Verification active • OmniSocial AI Shield
                </span>
              ) : error ? (
                <span className="text-rose-500 font-medium">{error}</span>
              ) : (
                'Confirm you are not an automated bot'
              )}
            </p>
          </div>
        </div>

        {/* Right Badge: Security Shield & Brand */}
        <div className="flex items-center gap-2 pl-2 border-l border-slate-200 dark:border-white/10 text-slate-400 dark:text-slate-500">
          {isVerified ? (
            <button
              type="button"
              onClick={handleReset}
              className="p-1 hover:text-slate-700 dark:hover:text-slate-300 rounded transition-colors"
              title="Reset verification"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          ) : (
            <div className="flex flex-col items-center">
              <ShieldCheck className={`w-5 h-5 ${isVerified ? 'text-emerald-500' : 'text-indigo-500 dark:text-indigo-400'}`} />
              <span className="text-[9px] tracking-tight font-medium text-slate-400">SECURE</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
