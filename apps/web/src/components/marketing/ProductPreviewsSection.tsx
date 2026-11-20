'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import {
  Sparkles,
  Zap,
  Globe,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  Calendar,
  BarChart3,
  Lock,
  Layers,
  Clock,
  Play,
  Copy,
  Radio,
  Eye,
  Send,
  FileCheck2,
} from 'lucide-react';
import { ROUTES } from '@/lib/constants';
import { PlatformBadge, ORDERED_PLATFORMS } from '@/components/ui/PlatformBadge';

/* -------------------------------------------------------------------------- */
/* Hook to track scroll intersection for individual section rows             */
/* -------------------------------------------------------------------------- */
function useRowIntersection() {
  const ref = useRef<HTMLDivElement | null>(null);
  const [isVisible, setIsVisible] = useState(false);

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
      { threshold: 0.12, rootMargin: '0px 0px -50px 0px' },
    );

    const el = ref.current;
    if (el) observer.observe(el);

    return () => {
      if (el) observer.unobserve(el);
    };
  }, []);

  return { ref, isVisible };
}

/* -------------------------------------------------------------------------- */
/* Visual 1: AI Content Studio Interactive Command Console                    */
/* -------------------------------------------------------------------------- */
function AIStudioVisualMockup({ isVisible }: { isVisible: boolean }) {
  const [activePlatform, setActivePlatform] = useState<'INSTAGRAM' | 'LINKEDIN' | 'TWITTER_X' | 'TIKTOK'>('INSTAGRAM');

  const previews = {
    INSTAGRAM: {
      tag: 'Reel & Carousel Copy',
      text: '🚀 The future of social operations is autonomous. Manage all 8 networks from one high-speed workspace without manual context switching.\n\n👉 Tap link in bio to start your free 14-day trial.',
      hashtags: '#SaaS #SocialMediaAI #Automation #GrowthHacking #CreatorEconomy',
      score: '98.6%',
    },
    LINKEDIN: {
      tag: 'Thought Leadership Post',
      text: 'Managing social presence across multiple brands often breaks down into spreadsheet chaos.\n\nWe engineered OmniSocial AI to solve this: true multi-tenant workspace isolation, role-based approvals, and automated bulk dispatch.\n\nHow does your team handle social governance?',
      hashtags: '#B2BMarketing #EnterpriseSaaS #SocialOperations #Leadership',
      score: '99.1%',
    },
    TWITTER_X: {
      tag: 'Viral Thread Opener',
      text: '8 networks. 1 unified dashboard. Zero token leakage.\n\nOmniSocial AI transforms how high-velocity marketing teams publish, listen, and scale.\n\nHere is how autonomous scheduling works 🧵👇',
      hashtags: '#TechTwitter #BuildInPublic #AI',
      score: '97.8%',
    },
    TIKTOK: {
      tag: 'Short-Form Hook Script',
      text: '[HOOK 0:00-0:03]: "Stop posting to 8 social networks manually every morning..."\n\n[CORE 0:03-0:20]: Show automated bulk dispatch queue & instant AI draft generation.\n\n[CTA 0:20-0:30]: Try OmniSocial AI today!',
      hashtags: '#MarketingHacks #CreatorTips #Automation',
      score: '98.9%',
    },
  };

  const current = previews[activePlatform];

  return (
    <div
      className={`relative rounded-3xl p-6 sm:p-7 bg-[#0B0F24]/95 dark:bg-[#0B0F24]/95 backdrop-blur-2xl border border-[#7138F5]/35 shadow-[0_20px_50px_-12px_rgba(113,56,245,0.35)] transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] overflow-hidden group ${
        isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-12'
      }`}
    >
      {/* Specular Top Rim */}
      <div className="absolute top-0 inset-x-0 h-[1.5px] bg-gradient-to-r from-transparent via-white/30 to-transparent" />
      <div className="absolute -top-20 -right-20 w-52 h-52 bg-[#7138F5]/25 rounded-full blur-3xl pointer-events-none" />

      {/* Window Header Chrome */}
      <div className="flex items-center justify-between pb-4 border-b border-white/10 text-xs">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-rose-500/80 inline-block" />
            <span className="w-3 h-3 rounded-full bg-amber-500/80 inline-block" />
            <span className="w-3 h-3 rounded-full bg-emerald-500/80 inline-block" />
          </div>
          <span className="font-mono text-slate-400 text-[11px] ml-2">omnisocial / studio / campaign_q4.ai</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 text-[11px] font-bold border border-emerald-500/30">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Gemini 1.5 &amp; GPT-4o
          </span>
        </div>
      </div>

      {/* Simulated Prompt Command Input */}
      <div className="mt-4 p-3 rounded-xl bg-white/[0.04] border border-white/10">
        <div className="flex items-center justify-between text-[11px] font-semibold text-slate-400 mb-1">
          <span className="flex items-center gap-1.5 text-[#20C8E8]">
            <Sparkles className="w-3 h-3" />
            Input Prompt &amp; Brand Kit Voice
          </span>
          <span className="text-slate-400 font-mono">Tokens: 1,840</span>
        </div>
        <p className="text-xs sm:text-sm text-slate-200 font-medium">
          &ldquo;Announce our Q4 product release with focus on 8-channel bulk publishing and 99.4% sentiment intelligence.&rdquo;
        </p>
      </div>

      {/* Platform Switcher Tabs */}
      <div className="mt-4 flex flex-wrap gap-1.5">
        {(['INSTAGRAM', 'LINKEDIN', 'TWITTER_X', 'TIKTOK'] as const).map((key) => {
          const isActive = activePlatform === key;
          const labels = {
            INSTAGRAM: 'Instagram',
            LINKEDIN: 'LinkedIn',
            TWITTER_X: 'Twitter / X',
            TIKTOK: 'TikTok',
          };
          return (
            <button
              key={key}
              onClick={() => setActivePlatform(key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                isActive
                  ? 'bg-gradient-to-r from-[#7138F5] to-[#2878FF] text-white shadow-md'
                  : 'bg-white/[0.04] text-slate-400 hover:text-white hover:bg-white/[0.08]'
              }`}
            >
              <span>{labels[key]}</span>
              {isActive && <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />}
            </button>
          );
        })}
      </div>

      {/* Generated Output Preview Box */}
      <div className="mt-3.5 p-4 rounded-2xl bg-white/[0.03] border border-white/10 relative">
        <div className="flex items-center justify-between text-xs mb-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#C4A5FF]">{current.tag}</span>
          <span className="px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-400 text-[11px] font-bold border border-emerald-500/25">
            ⚡ Viral Lift: {current.score}
          </span>
        </div>
        <p className="text-xs sm:text-sm text-slate-200 leading-relaxed whitespace-pre-line font-normal">
          {current.text}
        </p>
        <p className="mt-2.5 text-[11px] font-mono text-[#20C8E8]">{current.hashtags}</p>
      </div>

      {/* Bottom Telemetry Action Bar */}
      <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-xs text-slate-400">
        <span className="flex items-center gap-1.5 text-emerald-400 font-semibold">
          <CheckCircle2 className="w-3.5 h-3.5" />
          Brand Kit Calibrated • Ready for Team Review
        </span>
        <span className="text-[11px] font-mono text-slate-400">Latency: 280ms</span>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Visual 2: OAuth 2.0 Cloud Security & Multi-Channel Health Matrix           */
/* -------------------------------------------------------------------------- */
function SocialAccountHubVisualMockup({ isVisible }: { isVisible: boolean }) {
  const accounts = [
    { name: 'Instagram', handle: '@omnisocial.ai', stat: '4.2M Reach', badge: 'META_INSTAGRAM' },
    { name: 'Facebook', handle: 'OmniSocial Global', stat: 'Verified Page', badge: 'META_FACEBOOK' },
    { name: 'Twitter (X)', handle: '@OmniSocialAI', stat: 'Official Org', badge: 'TWITTER_X' },
    { name: 'LinkedIn', handle: 'OmniSocial Inc', stat: 'Enterprise Page', badge: 'LINKEDIN' },
    { name: 'Pinterest', handle: 'OmniSocial Studio', stat: '1.8M Monthly Pins', badge: 'PINTEREST' },
    { name: 'YouTube', handle: 'OmniSocial Tech', stat: '4K Shorts Engine', badge: 'YOUTUBE' },
    { name: 'TikTok', handle: '@omnisocial_app', stat: 'Creator Pro', badge: 'TIKTOK' },
    { name: 'Threads', handle: '@omnisocial.ai', stat: 'Live Feed Sync', badge: 'THREADS' },
  ];

  return (
    <div
      className={`relative rounded-3xl p-6 sm:p-7 bg-[#0B0F24]/95 dark:bg-[#0B0F24]/95 backdrop-blur-2xl border border-[#20C8E8]/35 shadow-[0_20px_50px_-12px_rgba(32,200,232,0.3)] transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] overflow-hidden group ${
        isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-12'
      }`}
    >
      {/* Specular Top Rim */}
      <div className="absolute top-0 inset-x-0 h-[1.5px] bg-gradient-to-r from-transparent via-white/30 to-transparent" />
      <div className="absolute -top-20 -left-20 w-52 h-52 bg-[#20C8E8]/20 rounded-full blur-3xl pointer-events-none" />

      {/* Vault Status Header */}
      <div className="flex items-center justify-between pb-4 border-b border-white/10 text-xs">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#2878FF] to-[#20C8E8] flex items-center justify-center text-white shadow-md">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div>
            <div className="font-bold text-white text-xs">AES-256-GCM Vault</div>
            <div className="text-[10px] text-slate-400">Zero Token Leakage Protocol</div>
          </div>
        </div>
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#20C8E8]/15 text-[#20C8E8] text-[11px] font-bold border border-[#20C8E8]/30">
          <span className="w-1.5 h-1.5 rounded-full bg-[#20C8E8] animate-pulse" />
          8/8 Active Connections
        </div>
      </div>

      {/* 8-Channel Interactive Matrix Grid */}
      <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        {accounts.map((acc, idx) => (
          <div
            key={acc.name}
            style={{ transitionDelay: `${idx * 40}ms` }}
            className="p-3 rounded-2xl bg-white/[0.04] border border-white/10 hover:border-[#20C8E8]/50 hover:bg-white/[0.07] transition-all group/item flex flex-col justify-between"
          >
            <div className="flex items-center justify-between">
              <PlatformBadge platform={ORDERED_PLATFORMS[idx]} variant="icon" size="sm" />
              <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-sm" />
            </div>
            <div className="mt-2.5">
              <div className="text-xs font-bold text-white truncate">{acc.name}</div>
              <div className="text-[10px] text-slate-400 truncate">{acc.handle}</div>
            </div>
            <div className="mt-2 pt-1.5 border-t border-white/5 flex items-center justify-between text-[9px] font-semibold text-emerald-400">
              <span>Healthy</span>
              <span className="text-slate-400">OAuth 2.0</span>
            </div>
          </div>
        ))}
      </div>

      {/* Bottom Cryptographic Telemetry Bar */}
      <div className="mt-5 pt-3.5 border-t border-white/10 flex items-center justify-between text-xs text-slate-400">
        <span className="flex items-center gap-1.5 text-xs text-slate-300 font-medium">
          <Lock className="w-3.5 h-3.5 text-[#20C8E8]" />
          Token Auto-Refresh Active • Zero Manual Maintenance
        </span>
        <span className="text-[11px] font-mono text-emerald-400 font-bold">100% Uptime</span>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Visual 3: Bulk Publishing & Calendar Dispatch Queue Controller             */
/* -------------------------------------------------------------------------- */
function BulkPublishingVisualMockup({ isVisible }: { isVisible: boolean }) {
  const queue = [
    {
      time: '09:30 AM',
      platform: 'INSTAGRAM',
      title: 'Q4 Product Launch Reel',
      status: 'PUBLISHED',
      statusColor: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
      statusText: 'Published ✓',
      stat: '+348% Reach',
    },
    {
      time: '12:00 PM',
      platform: 'TIKTOK',
      title: 'Behind the Scenes: AI Engine',
      status: 'SCHEDULED',
      statusColor: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30',
      statusText: 'Scheduled (Queue #2)',
      stat: 'Auto-Dispatch',
    },
    {
      time: '03:45 PM',
      platform: 'LINKEDIN',
      title: 'Enterprise Social Governance Guide',
      status: 'APPROVED',
      statusColor: 'bg-purple-500/15 text-[#C4A5FF] border-purple-500/30',
      statusText: 'Approved by Editor',
      stat: 'Staggered 15m',
    },
    {
      time: '06:15 PM',
      platform: 'YOUTUBE',
      title: 'OmniSocial 2.0 Demo & Workflow Walkthrough',
      status: 'QUEUED',
      statusColor: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
      statusText: 'Buffer Queued',
      stat: '4K Shorts',
    },
  ];

  return (
    <div
      className={`relative rounded-3xl p-6 sm:p-7 bg-[#0B0F24]/95 dark:bg-[#0B0F24]/95 backdrop-blur-2xl border border-[#2878FF]/35 shadow-[0_20px_50px_-12px_rgba(40,120,255,0.35)] transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] overflow-hidden group ${
        isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-12'
      }`}
    >
      {/* Specular Top Rim */}
      <div className="absolute top-0 inset-x-0 h-[1.5px] bg-gradient-to-r from-transparent via-white/30 to-transparent" />
      <div className="absolute -bottom-20 -right-20 w-52 h-52 bg-[#2878FF]/20 rounded-full blur-3xl pointer-events-none" />

      {/* Header Bar */}
      <div className="flex items-center justify-between pb-4 border-b border-white/10 text-xs">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#7138F5] via-[#2878FF] to-[#20C8E8] flex items-center justify-center text-white shadow-md">
            <Zap className="w-4 h-4" />
          </div>
          <div>
            <div className="font-bold text-white text-xs">Dispatch Pipeline #8042</div>
            <div className="text-[10px] text-slate-400">Staggered Multi-Channel Orbit</div>
          </div>
        </div>
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-400 text-[11px] font-bold border border-emerald-500/30">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          100% Delivery Rate
        </div>
      </div>

      {/* Scheduled Queue Items List */}
      <div className="mt-4 space-y-2.5">
        {queue.map((item, idx) => (
          <div
            key={item.title}
            className="p-3 rounded-2xl bg-white/[0.04] border border-white/10 hover:bg-white/[0.08] hover:border-white/20 transition-all flex items-center justify-between gap-3"
          >
            <div className="flex items-center gap-3">
              <span className="font-mono text-xs font-extrabold text-[#20C8E8] w-16">{item.time}</span>
              <div className="w-0.5 h-6 bg-white/10" />
              <div>
                <p className="text-xs sm:text-sm font-bold text-white truncate max-w-[200px] sm:max-w-[240px]">
                  {item.title}
                </p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold">{item.platform}</span>
                  <span className="text-slate-600 dark:text-slate-500 text-[10px]">•</span>
                  <span className="text-[10px] text-emerald-400 font-semibold">{item.stat}</span>
                </div>
              </div>
            </div>

            <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${item.statusColor}`}>
              {item.statusText}
            </span>
          </div>
        ))}
      </div>

      {/* Real-time Dispatch Progress Bar */}
      <div className="mt-4 pt-3.5 border-t border-white/10">
        <div className="flex items-center justify-between text-xs text-slate-300 font-semibold mb-1.5">
          <span>Staggered Dispatch Progress</span>
          <span className="text-[#20C8E8]">4 of 4 Queued Nodes Synchronized</span>
        </div>
        <div className="h-2 rounded-full bg-white/10 overflow-hidden">
          <div className="h-full bg-gradient-to-r from-[#7138F5] via-[#2878FF] to-[#20C8E8] w-full rounded-full animate-pulse" />
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Master Export: ProductPreviewsSection                                       */
/* -------------------------------------------------------------------------- */
export function ProductPreviewsSection() {
  const row1 = useRowIntersection();
  const row2 = useRowIntersection();
  const row3 = useRowIntersection();

  return (
    <section className="py-24 bg-white/80 dark:bg-[#080B1B]/80 border-y border-[#E7EAF2] dark:border-[#1E2749] relative overflow-hidden">
      {/* Background ambient light orbs */}
      <div className="absolute top-10 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-gradient-to-b from-[#7138F5]/10 via-[#20C8E8]/5 to-transparent blur-[140px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-28 sm:space-y-32 relative">
        {/* ================================================================= */}
        {/* ROW 1: AI CONTENT STUDIO                                          */}
        {/* ================================================================= */}
        <div ref={row1.ref} className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
          <div
            className={`lg:col-span-6 space-y-5 transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] ${
              row1.isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-12'
            }`}
          >
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider bg-[#7138F5]/10 dark:bg-[#7138F5]/20 text-[#7138F5] dark:text-[#C4A5FF] border border-[#7138F5]/25">
              <Sparkles className="w-3.5 h-3.5" />
              <span>AI Content Studio • Multi-Model Neural Engine</span>
            </div>

            <h3 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#111827] dark:text-white tracking-tight leading-[1.15]">
              Generate tailored multi-platform variants{' '}
              <span className="bg-gradient-to-r from-[#7138F5] via-[#2878FF] to-[#20C8E8] bg-clip-text text-transparent">
                in seconds
              </span>
            </h3>

            <p className="text-base sm:text-lg text-[#64748B] dark:text-slate-400 leading-relaxed">
              Select your campaign objective, brand tone, occasion context, and target channels. OmniSocial AI drafts customized, high-converting copy calibrated specifically for Instagram, LinkedIn, X, Facebook, Pinterest, YouTube, TikTok, and Threads.
            </p>

            <ul className="space-y-3 pt-2 text-sm sm:text-base text-slate-800 dark:text-slate-200">
              <li className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-emerald-500/15 flex items-center justify-center text-emerald-500 mt-0.5 shrink-0">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <span>
                  <strong className="text-slate-900 dark:text-white">Brand Kit Voice &amp; Tone Calibration:</strong> Preserves consistent tone, vocabulary, hashtags, and positioning across every network.
                </span>
              </li>
              <li className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-emerald-500/15 flex items-center justify-center text-emerald-500 mt-0.5 shrink-0">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <span>
                  <strong className="text-slate-900 dark:text-white">Structured Visual Briefs &amp; Occasion Catalog:</strong> Pre-loaded global festivals, holidays, and marketing event prompts.
                </span>
              </li>
              <li className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-emerald-500/15 flex items-center justify-center text-emerald-500 mt-0.5 shrink-0">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <span>
                  <strong className="text-slate-900 dark:text-white">Direct Drafts &amp; Approval Pipeline:</strong> Instant transition into team review workflows with complete audit history.
                </span>
              </li>
            </ul>

            <div className="pt-2">
              <Link
                href={ROUTES.CONTENT_STUDIO}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm bg-gradient-to-r from-[#7138F5] to-[#2878FF] text-white hover:shadow-lg hover:shadow-[#7138F5]/30 hover:-translate-y-0.5 transition-all"
              >
                Launch AI Content Studio
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          <div className="lg:col-span-6">
            <AIStudioVisualMockup isVisible={row1.isVisible} />
          </div>
        </div>

        {/* ================================================================= */}
        {/* ROW 2: SOCIAL ACCOUNT HUB & OAUTH VAULT                           */}
        {/* ================================================================= */}
        <div ref={row2.ref} className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
          <div className="lg:col-span-6 order-2 lg:order-1">
            <SocialAccountHubVisualMockup isVisible={row2.isVisible} />
          </div>

          <div
            className={`lg:col-span-6 order-1 lg:order-2 space-y-5 transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] ${
              row2.isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-12'
            }`}
          >
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider bg-[#20C8E8]/10 dark:bg-[#20C8E8]/20 text-[#20C8E8] border border-[#20C8E8]/30">
              <Globe className="w-3.5 h-3.5" />
              <span>Social Account Hub • Official OAuth 2.0 Vault</span>
            </div>

            <h3 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#111827] dark:text-white tracking-tight leading-[1.15]">
              Connect and monitor every brand channel{' '}
              <span className="bg-gradient-to-r from-[#20C8E8] via-[#2878FF] to-[#7138F5] bg-clip-text text-transparent">
                securely
              </span>
            </h3>

            <p className="text-base sm:text-lg text-[#64748B] dark:text-slate-400 leading-relaxed">
              Link multiple accounts across all 8 supported networks via official OAuth 2.0 flows. Every user token is hardware-encrypted with AES-256-GCM at rest, with continuous token health probes, automatic refresh, and zero data leakage across workspaces.
            </p>

            <ul className="space-y-3 pt-2 text-sm sm:text-base text-slate-800 dark:text-slate-200">
              <li className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-emerald-500/15 flex items-center justify-center text-emerald-500 mt-0.5 shrink-0">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <span>
                  <strong className="text-slate-900 dark:text-white">8 Official Partner Integrations:</strong> Direct API connections to Meta (IG, FB, Threads), X, LinkedIn, Pinterest, YouTube &amp; TikTok.
                </span>
              </li>
              <li className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-emerald-500/15 flex items-center justify-center text-emerald-500 mt-0.5 shrink-0">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <span>
                  <strong className="text-slate-900 dark:text-white">Hardware-Backed Token Encryption:</strong> Bank-grade AES-256-GCM cipher with isolated cryptographic keys per tenant.
                </span>
              </li>
              <li className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-emerald-500/15 flex items-center justify-center text-emerald-500 mt-0.5 shrink-0">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <span>
                  <strong className="text-slate-900 dark:text-white">Continuous Health Probes:</strong> Real-time connection status monitoring with proactive one-click token refresh alerts.
                </span>
              </li>
            </ul>

            <div className="pt-2">
              <Link
                href={ROUTES.PLATFORMS}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm bg-white dark:bg-[#12183A] text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 hover:border-[#20C8E8] dark:hover:border-[#20C8E8] hover:-translate-y-0.5 transition-all shadow-sm"
              >
                Explore all 8 platform specifications
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>

        {/* ================================================================= */}
        {/* ROW 3: BULK PUBLISHING & VISUAL CONTENT CALENDAR                  */}
        {/* ================================================================= */}
        <div ref={row3.ref} className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
          <div
            className={`lg:col-span-6 space-y-5 transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] ${
              row3.isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-12'
            }`}
          >
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider bg-[#2878FF]/10 dark:bg-[#2878FF]/20 text-[#2878FF] dark:text-[#38BDF8] border border-[#2878FF]/30">
              <Zap className="w-3.5 h-3.5" />
              <span>Bulk Publishing &amp; Visual Content Calendar</span>
            </div>

            <h3 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#111827] dark:text-white tracking-tight leading-[1.15]">
              Approve once, launch everywhere{' '}
              <span className="bg-gradient-to-r from-[#2878FF] via-[#7138F5] to-[#20C8E8] bg-clip-text text-transparent">
                on your schedule
              </span>
            </h3>

            <p className="text-base sm:text-lg text-[#64748B] dark:text-slate-400 leading-relaxed">
              Select multiple approved drafts, choose target accounts across any combination of networks, and dispatch immediately, at a fixed timestamp, or staggered at custom minute intervals. Eliminate buffer overlaps and maximize viral engagement across every timezone.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2">
              <div className="p-4 rounded-2xl bg-white dark:bg-[#0E132A] border border-slate-200 dark:border-slate-800 shadow-sm">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-900 dark:text-white">
                  <Calendar className="w-4 h-4 text-[#7138F5]" />
                  Content Calendar
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-normal">
                  Month, Week, Day &amp; Queue views with drag-and-drop rescheduling and buffer rules.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-white dark:bg-[#0E132A] border border-slate-200 dark:border-slate-800 shadow-sm">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-900 dark:text-white">
                  <BarChart3 className="w-4 h-4 text-[#20C8E8]" />
                  Analytics &amp; Reports
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-normal">
                  Timeseries trends, platform mix breakdowns, and exportable executive reports.
                </p>
              </div>
            </div>

            <div className="pt-2">
              <Link
                href={ROUTES.BULK_PUBLISH}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm bg-gradient-to-r from-[#2878FF] to-[#20C8E8] text-white hover:shadow-lg hover:shadow-[#2878FF]/30 hover:-translate-y-0.5 transition-all"
              >
                Explore Bulk Dispatch Queue
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          <div className="lg:col-span-6">
            <BulkPublishingVisualMockup isVisible={row3.isVisible} />
          </div>
        </div>
      </div>
    </section>
  );
}
