'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  Globe,
  Users,
  Send,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  Zap,
  TrendingUp,
  Layers,
  FileCheck2,
  Calendar,
  Lock,
  Clock,
} from 'lucide-react';
import { PlatformBadge, ORDERED_PLATFORMS } from '@/components/ui/PlatformBadge';

interface WorkflowStep {
  step: string;
  badge: string;
  title: string;
  desc: string;
  highlight: string;
  accentGradient: string;
  accentGlow: string;
  borderColor: string;
  textColor: string;
  pillColor: string;
}

const WORKFLOW_STEPS: WorkflowStep[] = [
  {
    step: '01',
    badge: 'STEP 01 • OAUTH 2.0',
    title: 'Connect Your Channels',
    desc: 'Authenticate Instagram, Facebook, X, LinkedIn, Pinterest, YouTube, TikTok, and Threads via official OAuth 2.0 flows with zero manual token handling.',
    highlight: '8 Official APIs • Zero Scraping',
    accentGradient: 'from-[#20C8E8] via-[#2878FF] to-[#7138F5]',
    accentGlow: 'bg-[#20C8E8]',
    borderColor: 'group-hover:border-[#20C8E8]/60',
    textColor: 'text-[#20C8E8]',
    pillColor: 'bg-[#20C8E8]/15 text-[#20C8E8] border-[#20C8E8]/35',
  },
  {
    step: '02',
    badge: 'STEP 02 • NEURAL AI',
    title: 'Create with AI Studio',
    desc: 'Generate tailored multi-network post variants aligned with your Brand Kit voice, viral hooks, hashtags, and festival marketing campaigns.',
    highlight: 'Gemini 1.5 Pro & GPT-4o',
    accentGradient: 'from-[#7138F5] via-[#8B5CF6] to-[#A78BFA]',
    accentGlow: 'bg-[#7138F5]',
    borderColor: 'group-hover:border-[#7138F5]/60',
    textColor: 'text-[#C4A5FF]',
    pillColor: 'bg-[#7138F5]/15 text-[#C4A5FF] border-[#7138F5]/35',
  },
  {
    step: '03',
    badge: 'STEP 03 • TEAM RBAC',
    title: 'Review & Bulk Approve',
    desc: 'Collaborate with multi-tier roles (Owner, Admin, Editor, Viewer), inline revision comments, and cryptographic approval matrix sign-offs.',
    highlight: 'Tamper-Proof Audit Trail',
    accentGradient: 'from-[#F59E0B] via-[#F97316] to-[#FB923C]',
    accentGlow: 'bg-[#F59E0B]',
    borderColor: 'group-hover:border-[#F59E0B]/60',
    textColor: 'text-[#FBBF24]',
    pillColor: 'bg-[#F59E0B]/15 text-[#FBBF24] border-[#F59E0B]/35',
  },
  {
    step: '04',
    badge: 'STEP 04 • LIVE LAUNCH',
    title: 'Publish & Analyze',
    desc: 'Launch immediately, schedule globally, or stagger across your calendar timeline, then monitor sub-second reach, CTR, and follower velocity.',
    highlight: 'Real-Time WebSocket Feed',
    accentGradient: 'from-[#10B981] via-[#059669] to-[#20C8E8]',
    accentGlow: 'bg-[#10B981]',
    borderColor: 'group-hover:border-[#10B981]/60',
    textColor: 'text-[#34D399]',
    pillColor: 'bg-[#10B981]/15 text-[#34D399] border-[#10B981]/35',
  },
];

// Interactive single step card with 3D mouse parallax and dedicated visual illustration box
function StepCard({
  item,
  index,
  isVisible,
}: {
  item: WorkflowStep;
  index: number;
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

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={handleMouseLeave}
      style={{
        transitionDelay: isVisible ? `${index * 130}ms` : '0ms',
        transform: isHovered
          ? `perspective(1000px) rotateX(${tilt.y}deg) rotateY(${tilt.x}deg) translateY(-8px)`
          : undefined,
      }}
      className={`relative rounded-3xl p-6 sm:p-7 flex flex-col justify-between overflow-hidden bg-white/95 dark:bg-[#0E132A]/90 backdrop-blur-xl border border-[#E2E8F0] dark:border-[#1E2749] ${
        item.borderColor
      } hover:shadow-[0_22px_45px_-12px_rgba(113,56,245,0.25)] dark:hover:shadow-[0_22px_45px_-12px_rgba(113,56,245,0.4)] transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group ${
        isVisible ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-12 scale-[0.94]'
      }`}
    >
      {/* Specular Top Rim Gradient */}
      <div className="absolute top-0 inset-x-0 h-[1.5px] bg-gradient-to-r from-transparent via-white/50 dark:via-white/25 to-transparent" />

      {/* Subtle Inner Ambient Glow Orb */}
      <div
        className={`absolute -right-16 -top-16 w-44 h-44 rounded-full ${item.accentGlow} blur-3xl opacity-10 group-hover:opacity-25 transition-opacity duration-500 pointer-events-none`}
      />

      {/* Top Section: Step Number Badge & Capability Pill */}
      <div>
        <div className="flex items-center justify-between mb-5">
          <span className="inline-flex items-center justify-center w-11 h-11 rounded-2xl bg-gradient-to-br from-[#7138F5] to-[#2878FF] text-white text-sm font-black shadow-md group-hover:scale-110 transition-transform">
            {item.step}
          </span>
          <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${item.pillColor}`}>
            {item.badge}
          </span>
        </div>

        <h3 className="text-xl font-bold text-[#111827] dark:text-white tracking-tight group-hover:text-[#7138F5] dark:group-hover:text-[#C4A5FF] transition-colors">
          {item.title}
        </h3>
        <p className="mt-2.5 text-xs sm:text-sm text-[#64748B] dark:text-slate-400 leading-relaxed min-h-[56px]">
          {item.desc}
        </p>
      </div>

      {/* Middle Section: Dedicated Miniature Visual Illustration Box */}
      <div className="my-6">
        {/* Step 01 Visual Box: 8-Channel OAuth Dock */}
        {item.step === '01' && (
          <div className="rounded-2xl p-3.5 bg-slate-50 dark:bg-[#090C1D] border border-slate-200 dark:border-slate-800/80 shadow-inner space-y-2.5">
            <div className="flex items-center justify-between text-[11px] font-semibold text-slate-600 dark:text-slate-300">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>OAuth 2.0 Vault</span>
              </span>
              <span className="text-emerald-500 font-bold text-[10px]">8/8 Live</span>
            </div>

            <div className="grid grid-cols-4 gap-1.5 py-1">
              {ORDERED_PLATFORMS.map((platform, idx) => (
                <div
                  key={platform}
                  className="flex flex-col items-center justify-center p-1.5 rounded-lg bg-white dark:bg-[#121835] border border-slate-200/80 dark:border-slate-800"
                >
                  <PlatformBadge platform={platform} variant="icon" size="sm" />
                  <span className="text-[9px] text-emerald-500 font-bold mt-1">✓</span>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400 pt-0.5">
              <span>AES-256-GCM Encrypted</span>
              <span className="text-emerald-500 font-bold">100% Valid</span>
            </div>
          </div>
        )}

        {/* Step 02 Visual Box: AI Content Studio Prompt Generator */}
        {item.step === '02' && (
          <div className="rounded-2xl p-3.5 bg-slate-50 dark:bg-[#090C1D] border border-slate-200 dark:border-slate-800/80 shadow-inner space-y-2.5">
            <div className="flex items-center justify-between text-[11px] font-mono text-slate-500 dark:text-slate-400">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#7138F5] animate-ping" />
                <span>ai_studio_engine.ts</span>
              </span>
              <span className="text-[#7138F5] dark:text-[#C4A5FF] font-semibold">
                Score 98.6%
              </span>
            </div>

            <div className="bg-white dark:bg-[#121835] rounded-xl p-2.5 border border-slate-200/80 dark:border-slate-800 text-[11px] text-slate-800 dark:text-slate-200 leading-snug">
              <span className="text-[#7138F5] dark:text-[#A78BFA] font-bold">Prompt:</span>{' '}
              &ldquo;Scale 8 networks with autonomous AI intelligence...&rdquo;
            </div>

            <div className="flex flex-wrap gap-1.5 pt-0.5">
              <span className="px-2 py-0.5 rounded-md bg-[#7138F5]/10 dark:bg-[#7138F5]/20 text-[#7138F5] dark:text-[#C4A5FF] text-[10px] font-bold">
                ⚡ Viral Hook
              </span>
              <span className="px-2 py-0.5 rounded-md bg-blue-500/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 text-[10px] font-bold">
                #Growth
              </span>
              <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold">
                Brand Kit
              </span>
            </div>
          </div>
        )}

        {/* Step 03 Visual Box: Multi-Tier Approval Stepper */}
        {item.step === '03' && (
          <div className="rounded-2xl p-3.5 bg-slate-50 dark:bg-[#090C1D] border border-slate-200 dark:border-slate-800/80 shadow-inner space-y-2.5">
            <div className="flex items-center justify-between text-[11px] font-semibold text-slate-600 dark:text-slate-300">
              <span>Approval Pipeline</span>
              <span className="text-amber-500 font-bold text-[10px]">3/3 Signed</span>
            </div>

            {/* Pipeline progress steps */}
            <div className="flex items-center justify-between relative py-1">
              <div className="absolute top-1/2 left-4 right-4 h-0.5 bg-gradient-to-r from-amber-500 via-orange-500 to-emerald-500 -translate-y-1/2 z-0" />
              <div className="relative z-10 flex flex-col items-center">
                <div className="w-6 h-6 rounded-full bg-amber-500 text-white flex items-center justify-center text-[10px] font-bold shadow-sm">
                  ✓
                </div>
                <span className="text-[9px] font-bold text-slate-500 dark:text-slate-400 mt-1">Creator</span>
              </div>
              <div className="relative z-10 flex flex-col items-center">
                <div className="w-6 h-6 rounded-full bg-orange-500 text-white flex items-center justify-center text-[10px] font-bold shadow-sm">
                  ✓
                </div>
                <span className="text-[9px] font-bold text-slate-500 dark:text-slate-400 mt-1">Editor</span>
              </div>
              <div className="relative z-10 flex flex-col items-center">
                <div className="w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[10px] font-bold shadow-sm">
                  ✓
                </div>
                <span className="text-[9px] font-bold text-slate-500 dark:text-slate-400 mt-1">Admin</span>
              </div>
            </div>

            <div className="flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400 pt-0.5">
              <span className="text-emerald-500 font-bold">Audit: #TX-9042</span>
              <span>Signed &amp; Approved</span>
            </div>
          </div>
        )}

        {/* Step 04 Visual Box: Live Dispatch & Growth Sparkline */}
        {item.step === '04' && (
          <div className="rounded-2xl p-3.5 bg-slate-50 dark:bg-[#090C1D] border border-slate-200 dark:border-slate-800/80 shadow-inner space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400">
                  Live Velocity
                </div>
                <div className="text-base font-extrabold text-emerald-500 dark:text-emerald-400">
                  +348.5%
                </div>
              </div>
              <div className="text-right">
                <div className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400">
                  Avg CTR
                </div>
                <div className="text-base font-extrabold text-[#7138F5] dark:text-[#C4A5FF]">
                  14.8%
                </div>
              </div>
            </div>

            {/* Glowing Telemetry SVG Sparkline Chart */}
            <div className="h-10 w-full pt-1">
              <svg className="w-full h-full overflow-visible" viewBox="0 0 200 40">
                <defs>
                  <linearGradient id={`workflow-grad-${index}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10B981" stopOpacity="0.35" />
                    <stop offset="100%" stopColor="#10B981" stopOpacity="0" />
                  </linearGradient>
                </defs>
                <path
                  d="M 0 34 Q 30 30, 60 18 T 120 15 T 170 6 T 200 2 L 200 40 L 0 40 Z"
                  fill={`url(#workflow-grad-${index})`}
                />
                <path
                  d="M 0 34 Q 30 30, 60 18 T 120 15 T 170 6 T 200 2"
                  fill="none"
                  stroke="#10B981"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
                <circle cx="200" cy="2" r="3.5" fill="#34D399" className="animate-ping" />
                <circle cx="200" cy="2" r="3.5" fill="#10B981" />
              </svg>
            </div>

            <div className="flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400">
              <span>8 Networks Dispatched</span>
              <span className="font-bold text-emerald-500">Live</span>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Highlight Feature Tag */}
      <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs font-semibold text-slate-600 dark:text-slate-300">
        <span className="inline-flex items-center gap-1.5 text-[11px] font-bold">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
          <span>{item.highlight}</span>
        </span>
        <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-1 group-hover:text-[#7138F5] transition-all" />
      </div>
    </div>
  );
}

export function WorkflowStepsSection() {
  const sectionRef = useRef<HTMLDivElement | null>(null);
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
      {
        threshold: 0.12,
        rootMargin: '0px 0px -40px 0px',
      },
    );

    const el = sectionRef.current;
    if (el) observer.observe(el);

    return () => {
      if (el) observer.unobserve(el);
    };
  }, []);

  return (
    <section className="py-24 relative overflow-hidden bg-gradient-to-b from-transparent via-[#7138F5]/[0.02] dark:via-[#7138F5]/[0.04] to-transparent">
      {/* Background ambient light orbs */}
      <div className="absolute top-1/3 -left-48 w-96 h-96 bg-[#7138F5]/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-1/3 -right-48 w-96 h-96 bg-[#20C8E8]/10 rounded-full blur-[140px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative" ref={sectionRef}>
        {/* Section Header */}
        <div
          className={`text-center max-w-3xl mx-auto mb-16 sm:mb-20 transition-all duration-700 ease-out ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}
        >
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest bg-[#7138F5]/10 dark:bg-[#7138F5]/20 text-[#7138F5] dark:text-[#C4A5FF] border border-[#7138F5]/20 mb-4 shadow-sm">
            <Zap className="w-3.5 h-3.5" />
            <span>4-Step Autonomous Social Workflow</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-[#111827] dark:text-white leading-[1.15]">
            From idea to 8-channel dispatch in{' '}
            <span className="bg-gradient-to-r from-[#7138F5] via-[#2878FF] to-[#20C8E8] bg-clip-text text-transparent">
              four seamless steps
            </span>
          </h2>
          <p className="mt-4 text-base sm:text-lg text-[#64748B] dark:text-slate-400 max-w-2xl mx-auto leading-relaxed">
            Eliminate disjointed tools. OmniSocial AI unifies account connection, prompt-guided creation, multi-tier approvals, and bulk multi-network publishing into a single automated pipeline.
          </p>
        </div>

        {/* Relative Grid with Animated Connecting Rail Behind Cards */}
        <div className="relative">
          {/* Connecting Rail Line (Desktop) */}
          <div className="hidden lg:block absolute top-[50px] left-[12%] right-[12%] h-[2px] bg-slate-200 dark:bg-slate-800 -z-0">
            <div
              className={`h-full bg-gradient-to-r from-[#20C8E8] via-[#7138F5] to-[#10B981] transition-all duration-1000 ease-out ${
                isVisible ? 'w-full' : 'w-0'
              }`}
            />
          </div>

          {/* 4 Workflow Step Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-6 relative z-10">
            {WORKFLOW_STEPS.map((step, idx) => (
              <StepCard key={step.step} item={step} index={idx} isVisible={isVisible} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
