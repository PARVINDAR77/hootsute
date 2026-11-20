'use client';

import React, { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import {
  Check,
  CheckCircle2,
  XCircle,
  ArrowRight,
  Sparkles,
  Zap,
  Crown,
  Building2,
  ShieldCheck,
  Lock,
} from 'lucide-react';
import { PricingPlanDto, SubscriptionPlan } from '@packages/shared';
import { apiClient, unwrapData } from '@/lib/api-client';
import { useAuth } from '@/lib/auth-context';
import { ROUTES } from '@/lib/constants';
import { PublicNavbar } from '@/components/marketing/PublicNavbar';
import { PublicFooter } from '@/components/marketing/PublicFooter';
import { FAQ_ENTRIES } from '@/components/marketing/public-content';
import { Alert } from '@/components/ui/Alert';
import { CardGridSkeleton } from '@/components/ui/LoadingSkeleton';

function formatBytes(bytes: number): string {
  const gb = bytes / (1024 * 1024 * 1024);
  return `${gb >= 1 ? Math.round(gb) : gb.toFixed(1)} GB`;
}

const FALLBACK_PLANS: PricingPlanDto[] = [
  {
    plan: SubscriptionPlan.FREE,
    displayName: 'Starter Free',
    description: 'Perfect for small businesses and creators getting started with social media.',
    monthlyPriceCents: 0,
    yearlyPriceCents: 0,
    storageQuotaBytes: 5368709120, // 5 GB
    maxMediaAssets: 500,
    maxSocialAccounts: 2,
    monthlyAiTokens: 50,
    features: [
      { name: 'Cloud Media Storage', included: true, limitText: '5 GB' },
      { name: 'Max Media Assets', included: true, limitText: '500 Assets' },
      { name: 'Connected Social Accounts', included: true, limitText: '2 Accounts' },
      { name: 'AI Marketing Copy Generations', included: true, limitText: '50 / month' },
      { name: 'Visual Media Picker & Simulator', included: true },
      { name: 'Dedicated Account Manager', included: false },
    ],
  },
  {
    plan: SubscriptionPlan.PRO,
    displayName: 'Growth Pro',
    description: 'Designed for scaling brands needing generous cloud storage, AI copy, and analytics.',
    monthlyPriceCents: 2900,
    yearlyPriceCents: 29000,
    storageQuotaBytes: 53687091200, // 50 GB
    maxMediaAssets: 5000,
    maxSocialAccounts: 10,
    monthlyAiTokens: 1000,
    isPopular: true,
    features: [
      { name: 'Cloud Media Storage', included: true, limitText: '50 GB' },
      { name: 'Max Media Assets', included: true, limitText: '5,000 Assets' },
      { name: 'Connected Social Accounts', included: true, limitText: '10 Accounts' },
      { name: 'AI Marketing Copy Generations', included: true, limitText: '1,000 / month' },
      { name: 'Priority Publishing Dispatcher', included: true },
      { name: 'Multi-Platform Bulk Publishing (8 Networks)', included: true },
      { name: 'Dedicated Account Manager', included: false },
    ],
  },
  {
    plan: SubscriptionPlan.ENTERPRISE,
    displayName: 'Enterprise Scale',
    description: 'Maximum capacity, dedicated storage bandwidth, and unlimited team collaboration.',
    monthlyPriceCents: 9900,
    yearlyPriceCents: 99000,
    storageQuotaBytes: 536870912000, // 500 GB
    maxMediaAssets: 50000,
    maxSocialAccounts: 100,
    monthlyAiTokens: 10000,
    features: [
      { name: 'Cloud Media Storage', included: true, limitText: '500 GB' },
      { name: 'Max Media Assets', included: true, limitText: '50,000 Assets' },
      { name: 'Connected Social Accounts', included: true, limitText: '100 Accounts' },
      { name: 'AI Marketing Copy Generations', included: true, limitText: '10,000 / month' },
      { name: 'Full Brand Voice & Multi-Language', included: true },
      { name: 'Priority SLA & Dedicated Support', included: true },
    ],
  },
];

// Interactive Single Payment Card identical to Home Page Pricing
function PaymentCard({
  plan,
  index,
  billingCycle,
  isAuthenticated,
}: {
  plan: PricingPlanDto;
  index: number;
  billingCycle: 'monthly' | 'yearly';
  isAuthenticated: boolean;
}) {
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);
  const cardRef = useRef<HTMLDivElement | null>(null);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    setTilt({ x: x * 8, y: -y * 8 });
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    setTilt({ x: 0, y: 0 });
  };

  const isPopular = Boolean(plan.isPopular);

  // Price calculation
  const displayPrice =
    billingCycle === 'monthly'
      ? plan.monthlyPriceCents / 100
      : Math.round(plan.yearlyPriceCents / 12) / 100;

  const ctaHref = isAuthenticated
    ? ROUTES.SETTINGS_BILLING
    : plan.plan === 'ENTERPRISE'
      ? ROUTES.CONTACT
      : ROUTES.SIGNUP;

  const ctaText = isAuthenticated
    ? 'Manage in Billing'
    : plan.plan === 'ENTERPRISE'
      ? 'Contact Sales'
      : plan.monthlyPriceCents === 0
        ? 'Get Started Free'
        : 'Start Free Trial';

  const tierConfig = [
    {
      icon: Zap,
      badge: 'STARTER TIER',
      iconGradient: 'from-[#20C8E8] to-[#2878FF]',
      glowAccent: 'bg-[#20C8E8]',
    },
    {
      icon: Crown,
      badge: 'MOST POPULAR',
      iconGradient: 'from-[#7138F5] via-[#8B5CF6] to-[#2878FF]',
      glowAccent: 'bg-[#7138F5]',
    },
    {
      icon: Building2,
      badge: 'ENTERPRISE',
      iconGradient: 'from-[#8B5CF6] via-[#6366F1] to-[#20C8E8]',
      glowAccent: 'bg-[#8B5CF6]',
    },
  ][index % 3];

  const TierIcon = tierConfig.icon;

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={handleMouseLeave}
      style={{
        transform: isHovered
          ? `perspective(1000px) rotateX(${tilt.y}deg) rotateY(${tilt.x}deg) translateY(${isPopular ? '-14px' : '-8px'})`
          : undefined,
      }}
      className={`relative rounded-3xl p-7 flex flex-col justify-between overflow-hidden bg-white/95 dark:bg-[#0E132A]/90 backdrop-blur-xl border transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group ${
        isPopular
          ? 'border-[#7138F5] shadow-[0_25px_60px_-15px_rgba(113,56,245,0.4)] dark:shadow-[0_25px_60px_-15px_rgba(113,56,245,0.55)] ring-2 ring-[#7138F5]/40 lg:-translate-y-3 z-10'
          : 'border-[#E2E8F0] dark:border-[#1E2749] hover:border-[#7138F5]/50 shadow-soft dark:shadow-none hover:shadow-[0_20px_45px_-12px_rgba(113,56,245,0.25)]'
      }`}
    >
      {/* Specular Top Rim Gradient */}
      <div
        className={`absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent ${
          isPopular ? 'via-[#7138F5]' : 'via-white/40 dark:via-white/20'
        } to-transparent`}
      />

      {/* Ambient background glow orb */}
      <div
        className={`absolute -right-20 -top-20 w-52 h-52 rounded-full ${tierConfig.glowAccent} blur-3xl ${
          isPopular ? 'opacity-20' : 'opacity-10'
        } group-hover:opacity-30 transition-opacity duration-500 pointer-events-none`}
      />

      <div>
        {/* Top Header Badge & Tier Icon */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div
              className={`w-10 h-10 rounded-xl bg-gradient-to-br ${tierConfig.iconGradient} flex items-center justify-center text-white shadow-md group-hover:scale-105 transition-transform`}
            >
              <TierIcon className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-[#111827] dark:text-white tracking-tight">
                {plan.displayName}
              </h2>
              <p className="text-[10px] font-bold uppercase tracking-wider text-[#7138F5] dark:text-[#C4A5FF]">
                {tierConfig.badge}
              </p>
            </div>
          </div>

          {isPopular && (
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-gradient-to-r from-[#7138F5] to-[#2878FF] text-white text-[11px] font-extrabold shadow-md animate-pulse">
              <Crown className="w-3.5 h-3.5" />
              Most Popular
            </span>
          )}
        </div>

        <p className="text-xs sm:text-sm text-[#64748B] dark:text-slate-400 leading-relaxed min-h-[42px]">
          {plan.description}
        </p>

        {/* Pricing Numbers Display */}
        <div className="mt-6 pt-5 border-t border-slate-100 dark:border-slate-800/80">
          <div className="flex items-baseline gap-1.5">
            <span className="text-5xl font-black tracking-tight text-[#111827] dark:text-white">
              ${displayPrice.toFixed(0)}
            </span>
            <span className="text-sm font-semibold text-[#64748B] dark:text-slate-400">
              {plan.monthlyPriceCents === 0 ? 'forever' : '/month'}
            </span>
          </div>
          {billingCycle === 'yearly' && plan.yearlyPriceCents > 0 ? (
            <p className="mt-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
              ${(plan.yearlyPriceCents / 100).toFixed(0)} / year total{' '}
              <span className="text-[11px] font-normal text-slate-500 dark:text-slate-400">
                (Save 20%)
              </span>
            </p>
          ) : (
            <p className="mt-1 text-[11px] font-medium text-slate-500 dark:text-slate-400">
              {plan.monthlyPriceCents === 0
                ? 'Free tier with zero card required'
                : 'Billed monthly, cancel anytime'}
            </p>
          )}
        </div>

        {/* Feature Capability Highlights Checklist */}
        <div className="mt-6 space-y-3">
          <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
            Included Capabilities
          </p>
          <ul className="space-y-2.5 text-xs sm:text-sm">
            {plan.features.map((f) => (
              <li
                key={f.name}
                className={`flex items-start gap-2.5 ${
                  f.included
                    ? 'text-slate-800 dark:text-slate-200'
                    : 'text-slate-400 dark:text-slate-600 line-through'
                }`}
              >
                <div
                  className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                    f.included
                      ? 'bg-emerald-500/15 text-emerald-500'
                      : 'bg-slate-200 dark:bg-slate-800 text-slate-400'
                  }`}
                >
                  <Check className="w-3 h-3 stroke-[3]" />
                </div>
                <span>
                  <strong className="font-semibold text-slate-900 dark:text-white">
                    {f.name}
                  </strong>
                  {f.limitText ? (
                    <span className="text-[#7138F5] dark:text-[#C4A5FF] font-bold">
                      {' '}
                      ({f.limitText})
                    </span>
                  ) : null}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* CTA Button Action */}
      <div className="mt-8 pt-4 border-t border-slate-100 dark:border-slate-800/80">
        <Link
          href={ctaHref}
          className={`w-full py-3 px-5 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 group ${
            isPopular
              ? 'bg-gradient-to-r from-[#7138F5] via-[#2878FF] to-[#20C8E8] text-white shadow-lg shadow-[#7138F5]/30 hover:shadow-xl hover:shadow-[#7138F5]/40 hover:-translate-y-0.5'
              : 'bg-[#F7F8FC] dark:bg-white/[0.06] border border-[#E2E8F0] dark:border-white/10 hover:border-[#7138F5]/50 text-slate-900 dark:text-white hover:bg-white dark:hover:bg-white/[0.1] hover:-translate-y-0.5'
          }`}
        >
          <span>{ctaText}</span>
          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>
    </div>
  );
}

export default function PricingPage() {
  const { isAuthenticated } = useAuth();
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [plans, setPlans] = useState<PricingPlanDto[]>(FALLBACK_PLANS);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    apiClient<PricingPlanDto[]>('/billing/plans')
      .then((res) => {
        if (!active) return;
        const data = unwrapData<PricingPlanDto[]>(res);
        setPlans(Array.isArray(data) && data.length > 0 ? data : FALLBACK_PLANS);
      })
      .catch((err: any) => {
        if (!active) return;
        setError(err?.message || 'Unable to load subscription plans from the billing service.');
        setPlans(FALLBACK_PLANS);
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const billingFaqs = FAQ_ENTRIES.filter((f) => f.category === 'Billing & Plans');
  const activePlans = plans.length > 0 ? plans : FALLBACK_PLANS;

  return (
    <div className="min-h-screen flex flex-col ambient-canvas">
      <PublicNavbar />

      <main className="flex-1 py-16 sm:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="text-center max-w-3xl mx-auto mb-14 sm:mb-16 space-y-5">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest bg-gradient-to-r from-[#7138F5]/10 via-[#2878FF]/10 to-[#20C8E8]/10 text-[#7138F5] dark:text-[#C4A5FF] border border-[#7138F5]/25 shadow-sm">
              <Sparkles className="w-3.5 h-3.5 text-[#7138F5]" />
              <span>Transparent Enterprise Billing Engine</span>
            </div>

            <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-slate-900 dark:text-white leading-[1.12]">
              Simple,{' '}
              <span className="bg-gradient-to-r from-[#7138F5] via-[#2878FF] to-[#20C8E8] bg-clip-text text-transparent">
                Transparent Pricing
              </span>
            </h1>

            <p className="text-base sm:text-xl text-slate-600 dark:text-slate-300 max-w-2xl mx-auto leading-relaxed">
              Real plan limits fetched directly from our workspace billing engine. Start free, scale
              seamlessly, and upgrade or cancel anytime.
            </p>

            {/* Monthly / Yearly Toggle */}
            <div className="pt-3 flex items-center justify-center">
              <div className="inline-flex items-center gap-1.5 p-1.5 rounded-2xl bg-white/90 dark:bg-[#0D122B]/90 border border-slate-200 dark:border-white/10 shadow-soft backdrop-blur-md">
                <button
                  type="button"
                  onClick={() => setBillingCycle('monthly')}
                  className={`px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                    billingCycle === 'monthly'
                      ? 'bg-gradient-to-r from-[#7138F5] to-[#2878FF] text-white shadow-md shadow-[#7138F5]/30'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  Monthly Billing
                </button>
                <button
                  type="button"
                  onClick={() => setBillingCycle('yearly')}
                  className={`px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all inline-flex items-center gap-2 ${
                    billingCycle === 'yearly'
                      ? 'bg-gradient-to-r from-[#7138F5] to-[#2878FF] text-white shadow-md shadow-[#7138F5]/30'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <span>Yearly Billing</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 border border-emerald-500/30">
                    Save 20%
                  </span>
                </button>
              </div>
            </div>
          </div>

          {error && (
            <Alert type="error" title="Billing Service Notice" message={error} className="mb-8" />
          )}

          {isLoading ? (
            <CardGridSkeleton count={3} />
          ) : (
            <>
              {/* Payment Cards Grid with 3D Mouse Parallax matching Home Page */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 items-stretch pt-4">
                {activePlans.map((plan, idx) => (
                  <PaymentCard
                    key={plan.plan || idx}
                    plan={plan}
                    index={idx}
                    billingCycle={billingCycle}
                    isAuthenticated={isAuthenticated}
                  />
                ))}
              </div>

              {/* Real Quotas Comparison Table */}
              {activePlans.length > 0 && (
                <div className="mt-20 rounded-3xl border border-slate-200 dark:border-white/10 bg-white/90 dark:bg-[#0D122B]/90 overflow-hidden shadow-soft backdrop-blur-md">
                  <div className="px-6 sm:px-8 py-5 border-b border-slate-200 dark:border-white/10 flex items-center justify-between flex-wrap gap-4">
                    <div>
                      <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">
                        Workspace Quotas &amp; Tier Limits
                      </h2>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        Enforced deterministically by the PostgreSQL billing ledger.
                      </p>
                    </div>
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                      <Lock className="w-3.5 h-3.5" />
                      Live Verified Ledger
                    </span>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-slate-50 dark:bg-white/[0.03] border-b border-slate-200 dark:border-white/10">
                          <th className="text-left px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                            Quota / Operational Limit
                          </th>
                          {activePlans.map((p) => (
                            <th
                              key={p.plan}
                              className="text-center px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white"
                            >
                              {p.displayName}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                        <tr>
                          <td className="px-6 py-4 font-semibold text-slate-900 dark:text-slate-200">
                            Connected Social Accounts
                          </td>
                          {activePlans.map((p) => (
                            <td
                              key={p.plan}
                              className="px-6 py-4 text-center font-bold text-[#7138F5] dark:text-[#20C8E8]"
                            >
                              {p.maxSocialAccounts} Accounts
                            </td>
                          ))}
                        </tr>
                        <tr>
                          <td className="px-6 py-4 font-semibold text-slate-900 dark:text-slate-200">
                            Monthly AI Copy Generations
                          </td>
                          {activePlans.map((p) => (
                            <td
                              key={p.plan}
                              className="px-6 py-4 text-center text-slate-900 dark:text-slate-200 font-mono"
                            >
                              {p.monthlyAiTokens.toLocaleString()} / mo
                            </td>
                          ))}
                        </tr>
                        <tr>
                          <td className="px-6 py-4 font-semibold text-slate-900 dark:text-slate-200">
                            Cloud Media Storage Quota
                          </td>
                          {activePlans.map((p) => (
                            <td
                              key={p.plan}
                              className="px-6 py-4 text-center text-slate-900 dark:text-slate-200 font-mono"
                            >
                              {formatBytes(p.storageQuotaBytes)}
                            </td>
                          ))}
                        </tr>
                        <tr>
                          <td className="px-6 py-4 font-semibold text-slate-900 dark:text-slate-200">
                            Max Media Library Assets
                          </td>
                          {activePlans.map((p) => (
                            <td
                              key={p.plan}
                              className="px-6 py-4 text-center text-slate-900 dark:text-slate-200 font-mono"
                            >
                              {p.maxMediaAssets.toLocaleString()} Assets
                            </td>
                          ))}
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          )}

          {/* Billing FAQs Accordion / Cards */}
          <div className="mt-20 max-w-4xl mx-auto space-y-4">
            <div className="text-center mb-8">
              <span className="text-xs font-bold uppercase tracking-widest text-[#7138F5] dark:text-[#C4A5FF]">
                Frequently Asked
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white mt-1">
                Billing &amp; Subscription Questions
              </h2>
            </div>
            <div className="space-y-3.5">
              {billingFaqs.map((faq) => (
                <div
                  key={faq.question}
                  className="rounded-2xl p-6 bg-white/90 dark:bg-[#0D122B]/90 border border-slate-200 dark:border-white/10 shadow-soft backdrop-blur-md"
                >
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    {faq.question}
                  </h3>
                  <p className="mt-2 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                    {faq.answer}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>

      <PublicFooter />
    </div>
  );
}
