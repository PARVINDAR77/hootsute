'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAuth } from '@/lib/auth-context';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';
import { ROUTES } from '@/lib/constants';
import { Mail, Lock, ArrowRight, ShieldAlert, CheckCircle2, Clock } from 'lucide-react';
import { HumanVerificationWidget } from '@/components/auth/HumanVerificationWidget';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const { login } = useAuth();
  const [serverError, setServerError] = useState<string | null>(null);
  const [attemptWarning, setAttemptWarning] = useState<string | null>(null);
  const [rememberMe, setRememberMe] = useState(true);
  const [botToken, setBotToken] = useState<string | null>(null);

  // Progressive Lockout State
  const [isLocked, setIsLocked] = useState(false);
  const [remainingSeconds, setRemainingSeconds] = useState(0);
  const [totalCooldownSeconds, setTotalCooldownSeconds] = useState(180);
  const [cooldownFinishedNotice, setCooldownFinishedNotice] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  // Countdown timer interval for lockout cooldown
  useEffect(() => {
    if (!isLocked || remainingSeconds <= 0) return;

    const interval = setInterval(() => {
      setRemainingSeconds((prev) => {
        if (prev <= 1) {
          setIsLocked(false);
          setCooldownFinishedNotice(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isLocked, remainingSeconds]);

  const formatTime = (totalSecs: number) => {
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const onSubmit = async (data: LoginFormData) => {
    if (isLocked) return;

    if (!botToken) {
      setServerError('Please verify that you are human before signing in.');
      return;
    }

    setServerError(null);
    setAttemptWarning(null);
    setCooldownFinishedNotice(false);

    try {
      await login(data.email, data.password, botToken);
    } catch (err: any) {
      const statusCode = err.statusCode || err.status;
      const details = err.details || {};

      if (statusCode === 429 || details.isLocked) {
        const remaining = details.remainingSeconds || (details.consecutiveFailures >= 5 ? 300 : 180);
        setIsLocked(true);
        setRemainingSeconds(remaining);
        setTotalCooldownSeconds(remaining);
        setServerError(null);
        setAttemptWarning(null);
        setBotToken(null);
      } else {
        if (details.remainingAttempts !== undefined) {
          setAttemptWarning(
            `Incorrect credentials. Attempt ${details.failedAttempts} of 4. (${details.remainingAttempts} attempt${details.remainingAttempts > 1 ? 's' : ''} remaining before temporary 3-minute lockout).`,
          );
        }
        setServerError(err.message || 'Failed to sign in. Please verify your credentials.');
        if (err.message?.toLowerCase().includes('human') || err.message?.toLowerCase().includes('verification')) {
          setBotToken(null);
        }
      }
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-[#111827] dark:text-white">
          Welcome Back
        </h1>
        <p className="text-sm text-[#64748B] dark:text-slate-400 mt-1">
          Sign in to continue your AI social media journey.
        </p>
      </div>

      {/* Lockout Cooldown Banner */}
      {isLocked && (
        <div className="rounded-xl border border-rose-500/30 bg-rose-50/80 dark:bg-rose-950/30 p-4 space-y-3 animate-in fade-in duration-300">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-rose-700 dark:text-rose-400 font-bold text-sm">
              <Lock className="w-4 h-4 animate-pulse text-rose-600 dark:text-rose-400" />
              <span>Temporary Account Lockout Active</span>
            </div>
            <div className="flex items-center gap-1.5 font-mono text-sm font-bold bg-rose-500/15 text-rose-700 dark:text-rose-300 px-2.5 py-1 rounded-lg border border-rose-500/30 shadow-sm">
              <Clock className="w-3.5 h-3.5" />
              <span>{formatTime(remainingSeconds)}</span>
            </div>
          </div>

          <p className="text-xs text-rose-700/90 dark:text-rose-300/80 leading-relaxed">
            Too many consecutive failed login attempts detected. To safeguard your account, access has been paused. Form inputs are locked until the cooldown timer expires.
          </p>

          {/* Progress Cooldown Bar */}
          <div className="w-full bg-rose-200/60 dark:bg-rose-900/40 rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-rose-600 dark:bg-rose-500 h-full transition-all duration-1000 ease-linear"
              style={{
                width: `${Math.max(0, Math.min(100, (remainingSeconds / (totalCooldownSeconds || 180)) * 100))}%`,
              }}
            />
          </div>
        </div>
      )}

      {/* Cooldown Finished Notice */}
      {cooldownFinishedNotice && !isLocked && (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-50/70 dark:bg-emerald-950/20 p-3.5 flex items-center gap-2.5 text-xs text-emerald-700 dark:text-emerald-300">
          <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
          <span>Security cooldown complete! You may now re-verify and attempt to sign in.</span>
        </div>
      )}

      {/* Attempt Warning Notification */}
      {attemptWarning && !isLocked && (
        <div className="rounded-xl border border-amber-500/30 bg-amber-50/80 dark:bg-amber-950/30 p-3.5 flex items-start gap-2.5 text-xs text-amber-800 dark:text-amber-200">
          <ShieldAlert className="w-4 h-4 shrink-0 text-amber-500 mt-0.5" />
          <div className="space-y-0.5">
            <p className="font-bold">Brute-Force Warning</p>
            <p className="text-amber-700/90 dark:text-amber-300/90">{attemptWarning}</p>
          </div>
        </div>
      )}

      {serverError && !isLocked && <Alert type="error" message={serverError} />}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input
          label="Email Address"
          type="email"
          autoComplete="email"
          placeholder="alex@company.com"
          leftIcon={<Mail className="w-4 h-4" />}
          error={errors.email?.message}
          disabled={isLocked}
          {...register('email')}
        />

        <Input
          label="Password"
          type="password"
          autoComplete="current-password"
          placeholder="Enter your password"
          leftIcon={<Lock className="w-4 h-4" />}
          error={errors.password?.message}
          disabled={isLocked}
          {...register('password')}
        />

        <div className="flex items-center justify-between text-xs pt-0.5">
          <label className="inline-flex items-center gap-2 text-[#64748B] dark:text-slate-300 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              disabled={isLocked}
              className="rounded border-[#E7EAF2] dark:border-white/20 text-[#7138F5] focus:ring-[#7138F5] disabled:opacity-50"
            />
            <span>Remember me</span>
          </label>

          <Link
            href={ROUTES.FORGOT_PASSWORD}
            className="font-semibold text-[#7138F5] dark:text-[#20C8E8] hover:underline"
          >
            Forgot password?
          </Link>
        </div>

        {/* Anti-Bot Human Verification Widget */}
        <div className="pt-1">
          <HumanVerificationWidget
            onVerify={setBotToken}
            disabled={isLocked || isSubmitting}
          />
        </div>

        <Button
          type="submit"
          size="lg"
          className="w-full mt-2 btn-gradient shadow-glow-purple hover:scale-[1.01] active:scale-[0.99] transition-all font-bold disabled:opacity-50 disabled:cursor-not-allowed"
          isLoading={isSubmitting}
          disabled={isLocked || !botToken}
          rightIcon={<ArrowRight className="w-4 h-4" />}
        >
          {isLocked ? `Locked (${formatTime(remainingSeconds)})` : 'Sign In'}
        </Button>
      </form>

      <div className="pt-4 border-t border-[#E7EAF2] dark:border-white/10 text-center text-xs text-[#64748B] dark:text-slate-400">
        Don&apos;t have an account?{' '}
        <Link
          href={ROUTES.SIGNUP}
          className="font-bold text-[#7138F5] dark:text-[#20C8E8] hover:underline"
        >
          Create your account
        </Link>
      </div>
    </div>
  );
}
