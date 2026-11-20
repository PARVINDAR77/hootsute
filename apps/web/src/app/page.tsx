'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Sparkles,
  ArrowRight,
  Play,
  Calendar,
  Send,
  BarChart3,
  ShieldCheck,
  Users,
  Inbox,
  CheckCircle2,
  ChevronDown,
  Layers,
  Zap,
  Globe,
} from 'lucide-react';
import { ROUTES } from '@/lib/constants';
import { apiClient, unwrapData } from '@/lib/api-client';
import { PublicNavbar } from '@/components/marketing/PublicNavbar';
import { PublicFooter } from '@/components/marketing/PublicFooter';
import { HeroCommandCenter3D } from '@/components/marketing/HeroCommandCenter3D';
import { LiveMetricsSection } from '@/components/marketing/LiveMetricsSection';
import { FeatureOverviewGrid } from '@/components/marketing/FeatureOverviewGrid';
import { ProductPreviewsSection } from '@/components/marketing/ProductPreviewsSection';
import { WorkflowStepsSection } from '@/components/marketing/WorkflowStepsSection';
import { SupportedPlatformsSection } from '@/components/marketing/SupportedPlatformsSection';
import { PricingPreviewSection } from '@/components/marketing/PricingPreviewSection';
import { FaqSection } from '@/components/marketing/FaqSection';
import { FinalCtaSection } from '@/components/marketing/FinalCtaSection';
import { ORDERED_PLATFORMS, PlatformBadge } from '@/components/ui/PlatformBadge';
import { Modal } from '@/components/ui/Modal';
import { PricingPlanDto } from '@packages/shared';

interface PublicOverview {
  supportedPlatformsCount: number;
  activeWorkspacesCount: number;
  connectedAccountsCount: number;
  publishedPostsCount: number;
  aiDraftsGeneratedCount: number;
}

export default function HomePage() {
  const [overview, setOverview] = useState<PublicOverview | null>(null);
  const [plans, setPlans] = useState<PricingPlanDto[]>([]);
  const [demoModalOpen, setDemoModalOpen] = useState(false);

  useEffect(() => {
    apiClient<PublicOverview>('/public/overview')
      .then((res) => setOverview(unwrapData<PublicOverview>(res)))
      .catch(() => {
        setOverview(null);
      });

    apiClient<PricingPlanDto[]>('/billing/plans')
      .then((res) => {
        const data = unwrapData<PricingPlanDto[]>(res);
        if (Array.isArray(data)) setPlans(data);
      })
      .catch(() => {
        setPlans([]);
      });
  }, []);

  return (
    <div className="min-h-screen flex flex-col ambient-canvas">
      <PublicNavbar />

      <main className="flex-1">
        {/* 1. HERO SECTION */}
        <section className="relative pt-6 pb-12 sm:pt-8 sm:pb-16 lg:pt-10 lg:pb-20">
          {/* Ambient Volumetric Backdrops */}
          <div className="pointer-events-none absolute -top-40 left-1/4 w-[600px] h-[600px] rounded-full bg-gradient-to-br from-[#7138F5]/15 via-[#2878FF]/10 to-transparent blur-3xl" />
          <div className="pointer-events-none absolute top-1/3 -right-20 w-[500px] h-[500px] rounded-full bg-gradient-to-bl from-[#20C8E8]/15 via-[#7138F5]/10 to-transparent blur-3xl" />

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-8 items-center">
              {/* Left Copy */}
              <div className="lg:col-span-6 space-y-4 sm:space-y-5">
                {/* Modern Pill Badge */}
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/90 dark:bg-[#0F142B]/90 border border-[#7138F5]/30 shadow-[0_2px_12px_rgba(113,56,245,0.12)] text-xs font-bold text-[#111827] dark:text-white">
                  <span className="flex h-2 w-2 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#7138F5] opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-[#7138F5]"></span>
                  </span>
                  <span className="text-[#7138F5] dark:text-[#A78BFA] font-extrabold">Next-Gen SaaS</span>
                  <span className="text-slate-300 dark:text-slate-600">|</span>
                  <span className="text-[#64748B] dark:text-slate-300 font-semibold flex items-center gap-1.5">
                    AI-Powered Command Center
                    <Sparkles className="w-3.5 h-3.5 text-[#7138F5] dark:text-[#20C8E8]" />
                  </span>
                </div>

                {/* Master Headline */}
                <h1 className="text-4xl sm:text-5xl lg:text-[58px] font-black tracking-tight text-[#111827] dark:text-white leading-[1.05]">
                  Manage. Create.{' '}
                  <span className="text-gradient drop-shadow-[0_0_35px_rgba(113,56,245,0.4)]">
                    Grow.
                  </span>
                </h1>

                {/* Subtitle / Tagline */}
                <p className="text-base sm:text-lg lg:text-xl font-bold text-[#111827]/90 dark:text-slate-100 tracking-tight leading-snug">
                  Scale Your Brand Across 8 Social Networks with Autonomous AI Intelligence.
                </p>

                {/* Value Proposition */}
                <p className="text-sm sm:text-base text-[#64748B] dark:text-slate-400 max-w-xl leading-relaxed font-normal">
                  Generate high-converting copy with AI, collaborate on team approvals, and dispatch
                  bulk campaigns across Instagram, Facebook, X, LinkedIn, Pinterest, YouTube, TikTok,
                  and Threads from one unified workspace.
                </p>

                {/* Primary CTAs */}
                <div className="flex flex-wrap items-center gap-3.5 pt-1">
                  <Link
                    href={ROUTES.SIGNUP}
                    className="inline-flex items-center gap-2.5 px-6 py-3.5 rounded-xl btn-gradient text-sm sm:text-base font-bold shadow-glow-purple hover:scale-[1.02] transition-transform"
                  >
                    <span>Start Free Trial</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                  <button
                    type="button"
                    onClick={() => setDemoModalOpen(true)}
                    className="inline-flex items-center gap-2.5 px-5 py-3.5 rounded-xl border border-[#E7EAF2] dark:border-white/15 bg-white dark:bg-[#0F142B]/80 hover:border-[#7138F5]/40 text-sm sm:text-base font-bold text-[#111827] dark:text-white shadow-soft transition-all hover:scale-[1.02]"
                  >
                    <div className="w-6 h-6 rounded-full bg-[#F1EBFF] dark:bg-[#7138F5]/30 flex items-center justify-center">
                      <Play className="w-3 h-3 text-[#7138F5] dark:text-[#20C8E8] ml-0.5 fill-current" />
                    </div>
                    <span>Watch Demo</span>
                  </button>
                </div>

                {/* Reoriented Unified Trust & Platform Dock */}
                <div className="pt-2">
                  <div className="p-3 sm:p-3.5 rounded-2xl bg-white/90 dark:bg-[#0F142B]/90 border border-[#E7EAF2] dark:border-white/10 shadow-soft backdrop-blur-md space-y-2.5 max-w-xl">
                    {/* Top strip: Rating & social proof */}
                    <div className="flex items-center justify-between gap-3 flex-wrap">
                      <div className="flex items-center gap-2">
                        <span className="text-amber-400 text-sm font-black tracking-wider">
                          ★★★★★
                        </span>
                        <span className="text-xs font-bold text-[#111827] dark:text-white">
                          4.9/5 Rating
                        </span>
                        <span className="text-xs text-[#64748B] dark:text-slate-400">
                          from 12,000+ creators &amp; brands
                        </span>
                      </div>
                      <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                        Enterprise Grade
                      </span>
                    </div>

                    {/* Bottom strip: Integrated 8 platform icons dock */}
                    <div className="pt-2 border-t border-[#E7EAF2] dark:border-white/10 flex items-center justify-between gap-2 flex-wrap">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-[#64748B] dark:text-slate-400">
                        8 Supported Platforms
                      </span>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {ORDERED_PLATFORMS.map((platform) => (
                          <PlatformBadge key={platform} platform={platform} variant="icon" size="sm" />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Interactive 3D Visual */}
              <div className="lg:col-span-6">
                <HeroCommandCenter3D />
              </div>
            </div>
          </div>
        </section>

        {/* 2. LIVE BACKEND PLATFORM STATISTICS (SCROLL-TRIGGERED CASCADE) */}
        <LiveMetricsSection overview={overview} />

        {/* 3. FEATURE OVERVIEW GRID (SCROLL-TRIGGERED CASCADE & RICH TELEMETRY) */}
        <FeatureOverviewGrid />

        {/* 4. PRODUCT PREVIEWS (AI STUDIO, ACCOUNTS, CALENDAR, BULK, ANALYTICS) */}
        <ProductPreviewsSection />

        {/* 5. HOW IT WORKS (AUTONOMOUS WORKFLOW STEPS WITH CASADE & TELEMETRY) */}
        <WorkflowStepsSection />

        {/* 6. SUPPORTED PLATFORMS GRID (OFFICIAL APIS & TELEMETRY CASADE) */}
        <SupportedPlatformsSection />

        {/* 7. PRICING PREVIEW (INTERACTIVE BILLING & CASADE ANIMATION) */}
        <PricingPreviewSection plans={plans} />

        {/* 8. FAQ PREVIEW (DIRECT HOVER EXPANSION & CASADE ANIMATION) */}
        <FaqSection />

        {/* 9. FINAL CTA (3D SPOTLIGHT, PARALLAX HOVER & FAST-TRACK ONBOARDING) */}
        <FinalCtaSection />
      </main>

      <PublicFooter />

      {/* Interactive Product Walkthrough Modal */}
      <Modal
        open={demoModalOpen}
        onClose={() => setDemoModalOpen(false)}
        title="OmniSocial AI — Platform Walkthrough"
        description="Explore the real live modules available inside your workspace."
        size="lg"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[
            {
              icon: Sparkles,
              title: '1. AI Content Studio',
              text: 'Generate platform-specific copy for up to 8 networks calibrated to your Brand Kit and cultural occasions.',
            },
            {
              icon: Layers,
              title: '2. Multi-Step Team Approval',
              text: 'Review drafts with version history, comments, and batch approval before scheduling.',
            },
            {
              icon: Send,
              title: '3. Bulk Multi-Account Publish',
              text: 'Select approved drafts and publish now, at a scheduled time, or staggered across intervals.',
            },
            {
              icon: BarChart3,
              title: '4. Analytics, Inbox & Listening',
              text: 'Track growth metrics, reply in the unified inbox, and export executive reports.',
            },
          ].map((step) => {
            const Icon = step.icon;
            return (
              <div
                key={step.title}
                className="p-4 rounded-2xl bg-[#F7F8FC] dark:bg-white/5 border border-[#E7EAF2] dark:border-white/10"
              >
                <Icon className="w-5 h-5 text-[#7138F5] dark:text-[#20C8E8] mb-2" />
                <h4 className="text-sm font-bold text-[#111827] dark:text-white">{step.title}</h4>
                <p className="text-xs text-[#64748B] dark:text-slate-400 mt-1 leading-relaxed">
                  {step.text}
                </p>
              </div>
            );
          })}
        </div>
        <div className="mt-6 flex items-center justify-end gap-3">
          <Link
            href={ROUTES.FEATURES}
            onClick={() => setDemoModalOpen(false)}
            className="px-4 py-2 rounded-xl border border-[#E7EAF2] dark:border-white/15 text-xs font-bold text-[#111827] dark:text-white"
          >
            Explore Features
          </Link>
          <Link
            href={ROUTES.SIGNUP}
            onClick={() => setDemoModalOpen(false)}
            className="px-4 py-2 rounded-xl btn-gradient text-xs font-bold"
          >
            Create Free Workspace
          </Link>
        </div>
      </Modal>
    </div>
  );
}
