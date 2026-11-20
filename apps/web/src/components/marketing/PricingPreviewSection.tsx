'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import {
  CheckCircle2,
  Sparkles,
  Zap,
  ShieldCheck,
  Crown,
  ArrowRight,
  Lock,
  Building2,
  Check,
} from 'lucide-react';
import { PricingPlanDto, SubscriptionPlan } from '@packages/shared';
import { ROUTES } from '@/lib/constants';

interface PricingPreviewSectionProps {
  plans: PricingPlanDto[];
}

const FALLBACK_PLANS: PricingPlanDto[] = [
  {
    plan: SubscriptionPlan.FREE,
    displayName: 'Starter Free',
    description: 'Perfect for creators and small businesses testing autonomous multi-channel social management.',
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
    ],
  },
  {
    plan: SubscriptionPlan.PRO,
    displayName: 'Growth Pro',
    description: 'Designed for scaling brands needing generous cloud storage, autonomous AI copy, and analytics.',
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
    ],
  },
  {
    plan: SubscriptionPlan.ENTERPRISE,
    displayName: 'Enterprise Scale',
    description: 'Maximum capacity, dedicated bandwidth, role-based approvals, and unlimited team collaboration.',
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
    ],
  },
];

// Interactive Single Payment Card with 3D mouse parallax
function PaymentCard({
  plan,
  index,
  billingCycle,
  isVisible,
}: {
  plan: PricingPlanDto;
  index: number;
  billingCycle: 'monthly' | 'yearly';
  isVisible: boolean;
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

  // Price calculations
  const priceDisplay =
    billingCycle === 'yearly' && plan.monthlyPriceCents > 0
      ? (plan.yearlyPriceCents / 1200).toFixed(0)
      : (plan.monthlyPriceCents / 100).toFixed(0);

  const yearlyBilledNote =
    billingCycle === 'yearly' && plan.monthlyPriceCents > 0
      ? `$${(plan.yearlyPriceCents / 100).toFixed(0)} billed annually (Save 20%)`
      : 'Billed monthly, cancel anytime';

  // Tier configuration
  const tierConfig = [
    {
      icon: Zap,
      badge: 'STARTER TIER',
      iconGradient: 'from-[#20C8E8] to-[#2878FF]',
      ctaText: 'Get Started Free',
      ctaHref: ROUTES.SIGNUP,
      isPrimary: false,
      glowAccent: 'bg-[#20C8E8]',
    },
    {
      icon: Crown,
      badge: 'MOST POPULAR',
      iconGradient: 'from-[#7138F5] via-[#8B5CF6] to-[#2878FF]',
      ctaText: 'Start 14-Day Free Trial',
      ctaHref: ROUTES.PRICING,
      isPrimary: true,
      glowAccent: 'bg-[#7138F5]',
    },
    {
      icon: Building2,
      badge: 'ENTERPRISE',
      iconGradient: 'from-[#8B5CF6] via-[#6366F1] to-[#20C8E8]',
      ctaText: 'Upgrade to Enterprise',
      ctaHref: ROUTES.PRICING,
      isPrimary: false,
      glowAccent: 'bg-[#8B5CF6]',
    },
  ][index % 3];

  const TierIcon = tierConfig.icon;

  // Stagger entrance direction
  const getEntranceTransform = () => {
    if (isVisible) return 'opacity-100 translate-x-0 translate-y-0 rotate-0 scale-100';
    if (index === 0) return 'opacity-0 -translate-x-8 translate-y-12 -rotate-2 scale-[0.93]';
    if (index === 1) return 'opacity-0 translate-y-16 scale-[0.90]';
    return 'opacity-0 translate-x-8 translate-y-12 rotate-2 scale-[0.93]';
  };

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={handleMouseLeave}
      style={{
        transitionDelay: isVisible ? `${index * 130}ms` : '0ms',
        transform: isHovered
          ? `perspective(1000px) rotateX(${tilt.y}deg) rotateY(${tilt.x}deg) translateY(${isPopular ? '-14px' : '-8px'})`
          : undefined,
      }}
      className={`relative rounded-3xl p-7 flex flex-col justify-between overflow-hidden bg-white/95 dark:bg-[#0E132A]/90 backdrop-blur-xl border transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group ${
        isPopular
          ? 'border-[#7138F5] shadow-[0_25px_60px_-15px_rgba(113,56,245,0.4)] dark:shadow-[0_25px_60px_-15px_rgba(113,56,245,0.55)] ring-2 ring-[#7138F5]/40 lg:-translate-y-3 z-10'
          : 'border-[#E2E8F0] dark:border-[#1E2749] hover:border-[#7138F5]/50 shadow-soft dark:shadow-none hover:shadow-[0_20px_45px_-12px_rgba(113,56,245,0.25)]'
      } ${getEntranceTransform()}`}
    >
      {/* Specular Top Rim Gradient */}
      <div
        className={`absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent ${
          isPopular ? 'via-[#7138F5]' : 'via-white/40 dark:via-white/20'
        } to-transparent`}
      />

      {/* Ambient background glow orb on popular/hover */}
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
              <h3 className="text-xl font-extrabold text-[#111827] dark:text-white tracking-tight">
                {plan.displayName}
              </h3>
              <p className="text-[10px] font-bold uppercase tracking-wider text-[#7138F5] dark:text-[#C4A5FF]">
                {tierConfig.badge}
              </p>
            </div>
          </div>

          {isPopular && (
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-gradient-to-r from-[#7138F5] to-[#2878FF] text-white text-[11px] font-extrabold shadow-md animate-pulse">
              <Crown className="w-3.5 h-3.5" />
              Popular
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
              ${priceDisplay}
            </span>
            <span className="text-sm font-semibold text-[#64748B] dark:text-slate-400">
              {plan.monthlyPriceCents === 0 ? 'forever' : '/month'}
            </span>
          </div>
          <p className="mt-1 text-[11px] font-medium text-slate-500 dark:text-slate-400">
            {plan.monthlyPriceCents === 0 ? 'Free tier with zero card required' : yearlyBilledNote}
          </p>
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
                      — {f.limitText}
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
          href={tierConfig.ctaHref}
          className={`w-full py-3 px-5 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 ${
            tierConfig.isPrimary
              ? 'bg-gradient-to-r from-[#7138F5] via-[#2878FF] to-[#20C8E8] text-white shadow-lg shadow-[#7138F5]/30 hover:shadow-xl hover:shadow-[#7138F5]/40 hover:-translate-y-0.5'
              : 'bg-[#F7F8FC] dark:bg-white/[0.06] border border-[#E2E8F0] dark:border-white/10 hover:border-[#7138F5]/50 text-slate-900 dark:text-white hover:bg-white dark:hover:bg-white/[0.1] hover:-translate-y-0.5'
          }`}
        >
          <span>{tierConfig.ctaText}</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}

export function PricingPreviewSection({ plans }: PricingPreviewSectionProps) {
  const sectionRef = useRef<HTMLDivElement | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');

  useEffect(() => {
    if (typeof window === 'undefined' || typeof IntersectionObserver === 'undefined') {
      setIsVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
          }
        });
      },
      {
        threshold: 0.1,
        rootMargin: '0px 0px -40px 0px',
      },
    );

    const el = sectionRef.current;
    if (el) observer.observe(el);

    return () => {
      if (el) observer.unobserve(el);
    };
  }, []);

  // Use provided plans or fall back to high-fidelity defaults so cards are never blank
  const activePlans = plans && plans.length > 0 ? plans : FALLBACK_PLANS;

  return (
    <section className="py-24 relative overflow-hidden bg-gradient-to-b from-transparent via-[#7138F5]/[0.02] dark:via-[#7138F5]/[0.04] to-transparent">
      {/* Background ambient light orbs */}
      <div className="absolute top-1/4 -left-48 w-96 h-96 bg-[#7138F5]/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-1/4 -right-48 w-96 h-96 bg-[#20C8E8]/10 rounded-full blur-[140px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative" ref={sectionRef}>
        {/* Section Header */}
        <div
          className={`text-center max-w-3xl mx-auto mb-14 sm:mb-16 transition-all duration-700 ease-out ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}
        >
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest bg-[#7138F5]/10 dark:bg-[#7138F5]/20 text-[#7138F5] dark:text-[#C4A5FF] border border-[#7138F5]/20 mb-4 shadow-sm">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Live Workspace Billing Tiers</span>
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-[#111827] dark:text-white leading-[1.15]">
            Simple, Transparent{' '}
            <span className="bg-gradient-to-r from-[#7138F5] via-[#2878FF] to-[#20C8E8] bg-clip-text text-transparent">
              Payment Plans
            </span>
          </h2>

          <p className="mt-4 text-base sm:text-lg text-[#64748B] dark:text-slate-400 max-w-2xl mx-auto leading-relaxed">
            Real plan limits fetched directly from our workspace billing engine. Start free with zero card required and upgrade anytime.
          </p>

          {/* Interactive Monthly / Yearly Billing Cycle Switcher */}
          <div className="mt-8 flex items-center justify-center">
            <div className="inline-flex items-center gap-1 p-1.5 rounded-2xl bg-white dark:bg-[#0D122B] border border-[#E2E8F0] dark:border-[#1E2749] shadow-sm">
              <button
                type="button"
                onClick={() => setBillingCycle('monthly')}
                className={`px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                  billingCycle === 'monthly'
                    ? 'bg-gradient-to-r from-[#7138F5] to-[#2878FF] text-white shadow-md'
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
                    ? 'bg-gradient-to-r from-[#7138F5] to-[#2878FF] text-white shadow-md'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <span>Yearly Billing</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                  Save 20%
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Payment Cards Grid with Cascading Scroll Animation */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-8 items-stretch">
          {activePlans.slice(0, 3).map((plan, idx) => (
            <PaymentCard
              key={plan.plan || plan.displayName}
              plan={plan}
              index={idx}
              billingCycle={billingCycle}
              isVisible={isVisible}
            />
          ))}
        </div>

        {/* Bottom Trust & Security Dock */}
        <div
          className={`mt-14 pt-8 border-t border-slate-200 dark:border-slate-800/80 flex flex-wrap items-center justify-center gap-6 sm:gap-10 text-xs text-slate-500 dark:text-slate-400 font-semibold transition-all duration-700 delay-300 ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`}
        >
          <span className="inline-flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            14-Day Full Feature Trial
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Zap className="w-4 h-4 text-[#7138F5]" />
            No Credit Card Required to Start
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Lock className="w-4 h-4 text-[#20C8E8]" />
            AES-256-GCM Hardware Encrypted
          </span>
          <span className="inline-flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            Instant 1-Click Cancel Anytime
          </span>
        </div>
      </div>
    </section>
  );
}
