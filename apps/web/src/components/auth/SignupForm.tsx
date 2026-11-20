'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAuth } from '@/lib/auth-context';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';
import { ROUTES } from '@/lib/constants';
import { User, Mail, Lock, ArrowRight, CheckCircle2 } from 'lucide-react';
import { HumanVerificationWidget } from '@/components/auth/HumanVerificationWidget';

const signupSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  email: z.string().email('Please enter a valid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters long')
    .regex(/[A-Z]/, 'Must contain at least 1 uppercase letter')
    .regex(/[a-z]/, 'Must contain at least 1 lowercase letter')
    .regex(/[\d\W]/, 'Must contain at least 1 number or special character'),
  acceptedTerms: z.boolean().refine((val) => val === true, {
    message: 'You must agree to the Terms of Service and Privacy Policy',
  }),
});

type SignupFormData = z.infer<typeof signupSchema>;

export function SignupForm() {
  const { register: registerAuth } = useAuth();
  const [serverError, setServerError] = useState<string | null>(null);
  const [botToken, setBotToken] = useState<string | null>(null);

  const {
    register,
    watch,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      acceptedTerms: true,
    },
  });

  const passwordVal = watch('password') || '';
  const checks = [
    { label: '8+ characters', ok: passwordVal.length >= 8 },
    { label: 'Uppercase', ok: /[A-Z]/.test(passwordVal) },
    { label: 'Lowercase', ok: /[a-z]/.test(passwordVal) },
    { label: 'Number / Symbol', ok: /[\d\W]/.test(passwordVal) },
  ];

  const strengthScore = checks.filter((c) => c.ok).length;
  const strengthLabels = ['Weak', 'Fair', 'Good', 'Strong'];
  const strengthColors = [
    'bg-rose-500',
    'bg-amber-500',
    'bg-cyan-500',
    'bg-emerald-500',
  ];

  const onSubmit = async (data: SignupFormData) => {
    if (!botToken) {
      setServerError('Please verify that you are human before creating an account.');
      return;
    }

    setServerError(null);
    try {
      await registerAuth(data.name, data.email, data.password, botToken);
    } catch (err: any) {
      setServerError(err.message || 'Registration failed. Please check the details entered.');
    }
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-[#111827] dark:text-white">
          Create Your Account
        </h1>
        <p className="text-xs sm:text-sm text-[#64748B] dark:text-slate-400 mt-1">
          Launch your multi-tenant AI social media workspace in minutes.
        </p>
      </div>

      {serverError && <Alert type="error" message={serverError} />}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-3.5">
        <Input
          label="Full Name"
          type="text"
          autoComplete="name"
          placeholder="Alex Morgan"
          leftIcon={<User className="w-4 h-4" />}
          error={errors.name?.message}
          {...register('name')}
        />

        <Input
          label="Business Email"
          type="email"
          autoComplete="email"
          placeholder="alex@company.com"
          leftIcon={<Mail className="w-4 h-4" />}
          error={errors.email?.message}
          {...register('email')}
        />

        <div className="space-y-2">
          <Input
            label="Password"
            type="password"
            autoComplete="new-password"
            placeholder="Create a strong password"
            leftIcon={<Lock className="w-4 h-4" />}
            error={errors.password?.message}
            {...register('password')}
          />

          {/* Interactive Strength Meter */}
          {passwordVal.length > 0 && (
            <div className="space-y-1 pt-0.5">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-slate-400 font-medium">Strength:</span>
                <span
                  className={`font-bold ${strengthScore <= 1
                      ? 'text-rose-500 dark:text-rose-400'
                      : strengthScore === 2
                        ? 'text-amber-500 dark:text-amber-400'
                        : strengthScore === 3
                          ? 'text-cyan-500 dark:text-cyan-400'
                          : 'text-emerald-500 dark:text-emerald-400'
                    }`}
                >
                  {strengthLabels[Math.max(0, strengthScore - 1)]}
                </span>
              </div>
              <div className="grid grid-cols-4 gap-1.5 h-1 w-full">
                {[0, 1, 2, 3].map((index) => (
                  <div
                    key={index}
                    className={`h-full rounded-full transition-all duration-300 ${index < strengthScore
                        ? strengthColors[strengthScore - 1]
                        : 'bg-slate-200 dark:bg-white/10'
                      }`}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Checklist Pills */}
          <div className="grid grid-cols-2 gap-1.5 pt-0.5">
            {checks.map((c) => (
              <span
                key={c.label}
                className={`inline-flex items-center gap-1.5 text-[11px] font-medium transition-colors ${c.ok
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : 'text-[#64748B] dark:text-slate-500'
                  }`}
              >
                <CheckCircle2
                  className={`w-3.5 h-3.5 shrink-0 transition-transform ${c.ok ? 'scale-105 text-emerald-500' : 'opacity-40'
                    }`}
                />
                {c.label}
              </span>
            ))}
          </div>
        </div>

        <div className="space-y-1 pt-0.5">
          <label className="flex items-start gap-2.5 text-xs text-[#64748B] dark:text-slate-300 cursor-pointer select-none">
            <input
              type="checkbox"
              className="mt-0.5 rounded border-[#E7EAF2] dark:border-white/20 text-[#7138F5] focus:ring-[#7138F5]"
              {...register('acceptedTerms')}
            />
            <span>
              I agree to the{' '}
              <Link
                href={ROUTES.TERMS}
                className="font-semibold text-[#7138F5] dark:text-[#20C8E8] hover:underline"
              >
                Terms of Service
              </Link>{' '}
              and{' '}
              <Link
                href={ROUTES.PRIVACY}
                className="font-semibold text-[#7138F5] dark:text-[#20C8E8] hover:underline"
              >
                Privacy Policy
              </Link>
              .
            </span>
          </label>
          {errors.acceptedTerms?.message && (
            <p className="text-xs text-rose-600 dark:text-rose-400 font-medium">
              {errors.acceptedTerms.message}
            </p>
          )}
        </div>

        {/* Anti-Bot Human Verification Widget */}
        <div className="pt-0.5">
          <HumanVerificationWidget
            onVerify={setBotToken}
            disabled={isSubmitting}
          />
        </div>

        <Button
          type="submit"
          size="lg"
          className="w-full mt-2 btn-gradient shadow-glow-purple hover:scale-[1.01] active:scale-[0.99] transition-all font-bold disabled:opacity-50"
          isLoading={isSubmitting}
          disabled={!botToken}
          rightIcon={<ArrowRight className="w-4 h-4" />}
        >
          Create Account
        </Button>
      </form>

      <div className="pt-3.5 border-t border-[#E7EAF2] dark:border-white/10 text-center text-xs text-[#64748B] dark:text-slate-400">
        Already have an account?{' '}
        <Link
          href={ROUTES.LOGIN}
          className="font-bold text-[#7138F5] dark:text-[#20C8E8] hover:underline"
        >
          Sign in
        </Link>
      </div>
    </div>
  );
}
