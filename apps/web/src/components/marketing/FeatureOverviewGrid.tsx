'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  Send,
  Calendar,
  BarChart3,
  Inbox,
  Users,
  CheckCircle2,
  Zap,
  ArrowRight,
  ShieldCheck,
  Clock,
  Bot,
  MessageSquare,
  TrendingUp,
} from 'lucide-react';

interface FeatureCardData {
  id: string;
  title: string;
  desc: string;
  icon: React.ElementType;
  iconGradient: string;
  iconColor: string;
  glowBg: string;
  borderColor: string;
  pillText: string;
  pillColor: string;
  pillBorder: string;
  pillIcon: React.ElementType;
  colIndex: number;
}

const FEATURE_LIST: FeatureCardData[] = [
  {
    id: 'ai-studio',
    title: 'AI Content Studio',
    desc: 'Generate platform-calibrated posts, viral hooks, and occasion campaigns guided by your workspace Brand Kit and audience personas.',
    icon: Sparkles,
    iconGradient: 'from-[#7138F5] via-[#8B5CF6] to-[#A78BFA]',
    iconColor: 'text-[#C4A5FF]',
    glowBg: 'bg-[#7138F5]',
    borderColor: 'group-hover:border-[#7138F5]/60',
    pillText: 'GPT-4o & Gemini Pro',
    pillColor: 'bg-[#7138F5]/15 text-[#C4A5FF]',
    pillBorder: 'border-[#7138F5]/35',
    pillIcon: Bot,
    colIndex: 0,
  },
  {
    id: 'bulk-publish',
    title: 'Bulk Multi-Account Publishing',
    desc: 'Batch-schedule, approve, and auto-dispatch media assets simultaneously across all 8 networks with platform-specific character limits and aspect ratios.',
    icon: Send,
    iconGradient: 'from-[#2878FF] via-[#20C8E8] to-[#38BDF8]',
    iconColor: 'text-[#20C8E8]',
    glowBg: 'bg-[#20C8E8]',
    borderColor: 'group-hover:border-[#20C8E8]/60',
    pillText: '8-Channel Dispatch',
    pillColor: 'bg-[#20C8E8]/15 text-[#20C8E8]',
    pillBorder: 'border-[#20C8E8]/35',
    pillIcon: Zap,
    colIndex: 1,
  },
  {
    id: 'visual-calendar',
    title: 'Visual Content Calendar',
    desc: 'Inspect Month, Week, Day, and timeline schedules. Drag-and-drop to reschedule, manage buffer slots, and prevent publishing conflicts effortlessly.',
    icon: Calendar,
    iconGradient: 'from-[#F59E0B] via-[#F97316] to-[#FB923C]',
    iconColor: 'text-[#FBBF24]',
    glowBg: 'bg-[#F59E0B]',
    borderColor: 'group-hover:border-[#F59E0B]/60',
    pillText: 'Drag & Drop Engine',
    pillColor: 'bg-[#F59E0B]/15 text-[#FBBF24]',
    pillBorder: 'border-[#F59E0B]/35',
    pillIcon: Clock,
    colIndex: 2,
  },
  {
    id: 'analytics',
    title: 'Performance Analytics & Insights',
    desc: 'Track reach, engagement rate, follower growth, and post snapshots across connected channels with AI-powered viral lift recommendations.',
    icon: BarChart3,
    iconGradient: 'from-[#10B981] via-[#059669] to-[#20C8E8]',
    iconColor: 'text-[#34D399]',
    glowBg: 'bg-[#10B981]',
    borderColor: 'group-hover:border-[#10B981]/60',
    pillText: 'Real-Time Telemetry',
    pillColor: 'bg-[#10B981]/15 text-[#34D399]',
    pillBorder: 'border-[#10B981]/35',
    pillIcon: TrendingUp,
    colIndex: 0,
  },
  {
    id: 'unified-inbox',
    title: 'Unified Social Inbox & Listening',
    desc: 'Centralize comments, replies, moderation rules, and brand keyword monitoring in one high-velocity feed with neural sentiment scoring.',
    icon: Inbox,
    iconGradient: 'from-[#EC4899] via-[#DD2A7B] to-[#F43F5E]',
    iconColor: 'text-[#F472B6]',
    glowBg: 'bg-[#EC4899]',
    borderColor: 'group-hover:border-[#EC4899]/60',
    pillText: 'Neural Sentiment AI',
    pillColor: 'bg-[#EC4899]/15 text-[#F472B6]',
    pillBorder: 'border-[#EC4899]/35',
    pillIcon: MessageSquare,
    colIndex: 1,
  },
  {
    id: 'approval-matrix',
    title: 'Team Approval Matrix & RBAC',
    desc: 'Assign Owner, Admin, Editor, and Viewer roles with multi-step draft approvals, granular permissions, and tamper-proof audit trails.',
    icon: Users,
    iconGradient: 'from-[#8B5CF6] via-[#6366F1] to-[#3B82F6]',
    iconColor: 'text-[#A78BFA]',
    glowBg: 'bg-[#8B5CF6]',
    borderColor: 'group-hover:border-[#8B5CF6]/60',
    pillText: 'Multi-Tier RBAC',
    pillColor: 'bg-[#8B5CF6]/15 text-[#A78BFA]',
    pillBorder: 'border-[#8B5CF6]/35',
    pillIcon: ShieldCheck,
    colIndex: 2,
  },
];

// Individual scroll-animated interactive feature card
function ScrollFeatureCard({
  feature,
  index,
}: {
  feature: FeatureCardData;
  index: number;
}) {
  const cardRef = useRef<HTMLDivElement | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    // If SSR or test environment without IntersectionObserver, show immediately
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

    const el = cardRef.current;
    if (el) {
      observer.observe(el);
    }

    return () => {
      if (el) observer.unobserve(el);
    };
  }, []);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5; // -0.5 to 0.5
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    setTilt({ x: x * 8, y: -y * 8 });
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    setTilt({ x: 0, y: 0 });
  };

  const Icon = feature.icon;
  const PillIcon = feature.pillIcon;

  // Compute unique entrance style based on column
  // Left column cards swing in from left with tilt
  // Center column cards float up with scale
  // Right column cards swing in from right with tilt
  const getEntranceTransform = () => {
    if (isVisible) return 'opacity-100 translate-x-0 translate-y-0 rotate-0 scale-100 blur-0';
    if (feature.colIndex === 0) {
      return 'opacity-0 -translate-x-8 translate-y-14 -rotate-2 scale-[0.92] blur-[3px]';
    } else if (feature.colIndex === 1) {
      return 'opacity-0 translate-y-16 scale-[0.89] blur-[3px]';
    } else {
      return 'opacity-0 translate-x-8 translate-y-14 rotate-2 scale-[0.92] blur-[3px]';
    }
  };

  const staggerDelay = (feature.colIndex * 130) + (Math.floor(index / 3) * 60);

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={handleMouseLeave}
      style={{
        transitionDelay: isVisible ? `${staggerDelay}ms` : '0ms',
        transform: isHovered
          ? `perspective(1000px) rotateX(${tilt.y}deg) rotateY(${tilt.x}deg) translateY(-8px)`
          : undefined,
      }}
      className={`relative rounded-3xl p-6 sm:p-7 flex flex-col justify-between overflow-hidden bg-white/95 dark:bg-[#0E132A]/90 backdrop-blur-xl border border-[#E2E8F0] dark:border-[#1E2749] ${
        feature.borderColor
      } hover:shadow-[0_22px_45px_-12px_rgba(113,56,245,0.25)] dark:hover:shadow-[0_22px_45px_-12px_rgba(113,56,245,0.4)] transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group ${getEntranceTransform()}`}
    >
      {/* Specular Top Rim Gradient */}
      <div className="absolute top-0 inset-x-0 h-[1.5px] bg-gradient-to-r from-transparent via-white/50 dark:via-white/30 to-transparent" />

      {/* Light beam shimmer sweep on reveal */}
      <div
        className={`absolute inset-0 bg-gradient-to-r from-transparent via-white/10 dark:via-white/15 to-transparent pointer-events-none transition-transform duration-1000 ease-out ${
          isVisible ? 'translate-x-full' : '-translate-x-full'
        }`}
      />

      {/* Subtle Inner Ambient Glow Orb */}
      <div
        className={`absolute -right-16 -top-16 w-44 h-44 rounded-full ${feature.glowBg} blur-3xl opacity-10 group-hover:opacity-30 transition-opacity duration-500 pointer-events-none`}
      />

      {/* Top Section: Icon & Capability Pill */}
      <div>
        <div className="flex items-center justify-between mb-5">
          {/* Glowing 3D Icon Badge */}
          <div
            className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${feature.iconGradient} p-0.5 shadow-md group-hover:scale-110 group-hover:rotate-2 transition-all duration-300`}
          >
            <div className="w-full h-full rounded-[14px] bg-white dark:bg-[#0D122B] flex items-center justify-center">
              <Icon className={`w-6 h-6 ${feature.iconColor}`} />
            </div>
          </div>

          {/* Capability Pill */}
          <span
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider border ${feature.pillColor} ${feature.pillBorder}`}
          >
            <PillIcon className="w-3 h-3" />
            {feature.pillText}
          </span>
        </div>

        {/* Title & Description */}
        <h3 className="text-xl font-bold text-[#111827] dark:text-white tracking-tight group-hover:text-[#7138F5] dark:group-hover:text-[#C4A5FF] transition-colors">
          {feature.title}
        </h3>
        <p className="mt-2.5 text-sm text-[#64748B] dark:text-slate-400 leading-relaxed min-h-[44px]">
          {feature.desc}
        </p>
      </div>

      {/* Middle Section: Bespoke Miniature UI Telemetry Mockup */}
      <div className="my-6">
        {/* Card 1: AI Content Studio Micro Mockup */}
        {feature.id === 'ai-studio' && (
          <div className="rounded-2xl p-3.5 bg-slate-50 dark:bg-[#090C1D] border border-slate-200 dark:border-slate-800/80 shadow-inner space-y-2.5">
            <div className="flex items-center justify-between text-[11px] font-mono text-slate-500 dark:text-slate-400">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>neural_draft_gen.ts</span>
              </span>
              <span className="text-[#7138F5] dark:text-[#C4A5FF] font-semibold">
                Score 98.4%
              </span>
            </div>
            <div className="bg-white dark:bg-[#121835] rounded-xl p-2.5 border border-slate-200/80 dark:border-slate-800 text-[12px] text-slate-800 dark:text-slate-200 leading-snug">
              <span className="text-[#7138F5] dark:text-[#A78BFA] font-bold">Prompt:</span>{' '}
              &ldquo;Scale 8 networks with autonomous AI intelligence...&rdquo;
            </div>
            <div className="flex flex-wrap gap-1.5 pt-0.5">
              <span className="px-2 py-0.5 rounded-md bg-[#7138F5]/10 dark:bg-[#7138F5]/20 text-[#7138F5] dark:text-[#C4A5FF] text-[10px] font-bold">
                ⚡ Viral Hook
              </span>
              <span className="px-2 py-0.5 rounded-md bg-blue-500/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 text-[10px] font-bold">
                #SaaS
              </span>
              <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold">
                🎯 High Authority
              </span>
            </div>
          </div>
        )}

        {/* Card 2: Bulk Multi-Account Publishing Micro Mockup */}
        {feature.id === 'bulk-publish' && (
          <div className="rounded-2xl p-3.5 bg-slate-50 dark:bg-[#090C1D] border border-slate-200 dark:border-slate-800/80 shadow-inner space-y-2.5">
            <div className="flex items-center justify-between text-[11px] font-semibold text-slate-600 dark:text-slate-300">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>8 Networks Armed</span>
              </span>
              <span className="text-emerald-500 dark:text-emerald-400 font-bold">0ms Delay</span>
            </div>

            {/* 8 Network Badges Row with Green Checkmarks */}
            <div className="grid grid-cols-4 gap-1.5 py-1">
              {[
                { name: 'Instagram' },
                { name: 'Facebook' },
                { name: 'Twitter X' },
                { name: 'LinkedIn' },
                { name: 'Pinterest' },
                { name: 'YouTube' },
                { name: 'TikTok' },
                { name: 'Threads' },
              ].map((net, i) => (
                <div
                  key={net.name}
                  style={{
                    transitionDelay: isVisible ? `${i * 35}ms` : '0ms',
                  }}
                  className={`flex items-center justify-between px-2 py-1 rounded-lg bg-white dark:bg-[#121835] border border-slate-200/80 dark:border-slate-800 text-[10px] font-medium text-slate-700 dark:text-slate-300 transition-all duration-300 ${
                    isVisible ? 'opacity-100 scale-100' : 'opacity-70 scale-95'
                  }`}
                >
                  <span className="truncate">{net.name.split(' ')[0]}</span>
                  <span className="text-emerald-500 font-bold text-[9px]">✓</span>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400 pt-0.5">
              <span className="px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 font-bold">
                ⚡ Staggered Queue
              </span>
              <span>AES-256-GCM Vault</span>
            </div>
          </div>
        )}

        {/* Card 3: Visual Content Calendar Micro Mockup */}
        {feature.id === 'visual-calendar' && (
          <div className="rounded-2xl p-3.5 bg-slate-50 dark:bg-[#090C1D] border border-slate-200 dark:border-slate-800/80 shadow-inner space-y-2">
            <div className="flex items-center justify-between text-[11px] font-semibold text-slate-600 dark:text-slate-300">
              <span>Multi-Timezone View</span>
              <span className="text-amber-500 font-bold">Auto-Sync</span>
            </div>

            {/* Mini Timeline Columns */}
            <div className="grid grid-cols-3 gap-1.5">
              <div className="bg-white dark:bg-[#121835] rounded-xl p-2 border border-slate-200/80 dark:border-slate-800">
                <div className="text-[10px] font-bold text-slate-400 uppercase">Mon 09:30</div>
                <div className="mt-1 px-1.5 py-0.5 rounded bg-pink-500/15 text-pink-600 dark:text-pink-400 text-[9px] font-bold truncate">
                  🟣 IG Reel
                </div>
              </div>
              <div className="bg-white dark:bg-[#121835] rounded-xl p-2 border border-slate-200/80 dark:border-slate-800">
                <div className="text-[10px] font-bold text-slate-400 uppercase">Wed 12:00</div>
                <div className="mt-1 px-1.5 py-0.5 rounded bg-red-500/15 text-red-600 dark:text-red-400 text-[9px] font-bold truncate">
                  🔴 YT Shorts
                </div>
              </div>
              <div className="bg-white dark:bg-[#121835] rounded-xl p-2 border border-slate-200/80 dark:border-slate-800">
                <div className="text-[10px] font-bold text-slate-400 uppercase">Fri 17:15</div>
                <div className="mt-1 px-1.5 py-0.5 rounded bg-blue-500/15 text-blue-600 dark:text-blue-400 text-[9px] font-bold truncate">
                  🔵 LI Story
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400 pt-1">
              <span className="font-semibold text-amber-500">⇄ Drag & Drop Ready</span>
              <span>Zero Buffer Overlap</span>
            </div>
          </div>
        )}

        {/* Card 4: Performance Analytics Micro Mockup */}
        {feature.id === 'analytics' && (
          <div className="rounded-2xl p-3.5 bg-slate-50 dark:bg-[#090C1D] border border-slate-200 dark:border-slate-800/80 shadow-inner space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400">
                  30-Day Growth
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

            {/* Glowing Telemetry SVG Sparkline Chart with Animated Draw */}
            <div className="h-12 w-full pt-1">
              <svg className="w-full h-full overflow-visible" viewBox="0 0 200 45">
                <defs>
                  <linearGradient id={`grad-card-${index}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10B981" stopOpacity="0.35" />
                    <stop offset="100%" stopColor="#10B981" stopOpacity="0" />
                  </linearGradient>
                </defs>
                <path
                  d="M 0 38 Q 30 35, 60 22 T 120 18 T 170 8 T 200 4 L 200 45 L 0 45 Z"
                  fill={`url(#grad-card-${index})`}
                />
                <path
                  d="M 0 38 Q 30 35, 60 22 T 120 18 T 170 8 T 200 4"
                  fill="none"
                  stroke="#10B981"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeDasharray="250"
                  strokeDashoffset={isVisible ? 0 : 250}
                  style={{
                    transition: 'stroke-dashoffset 1.2s cubic-bezier(0.16, 1, 0.3, 1) 0.2s',
                  }}
                />
                <circle cx="200" cy="4" r="3.5" fill="#34D399" className="animate-ping" />
                <circle cx="200" cy="4" r="3.5" fill="#10B981" />
              </svg>
            </div>

            <div className="flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400">
              <span>WebSocket Real-Time Stream</span>
              <span className="font-bold text-emerald-500">Live</span>
            </div>
          </div>
        )}

        {/* Card 5: Unified Social Inbox Micro Mockup */}
        {feature.id === 'unified-inbox' && (
          <div className="rounded-2xl p-3.5 bg-slate-50 dark:bg-[#090C1D] border border-slate-200 dark:border-slate-800/80 shadow-inner space-y-2.5">
            <div className="flex items-center justify-between text-[11px] font-semibold text-slate-600 dark:text-slate-300">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-pink-500" />
                <span>@sarah_growth</span>
              </span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold">
                🟢 99.4% Positive
              </span>
            </div>
            <div className="bg-white dark:bg-[#121835] rounded-xl p-2.5 border border-slate-200/80 dark:border-slate-800 text-[11px] text-slate-700 dark:text-slate-300">
              &ldquo;The multi-channel dispatch saved our agency 25+ hours this week! 🙌&rdquo;
            </div>
            <div className="flex items-center justify-between text-[10px]">
              <span className="px-2 py-0.5 rounded bg-rose-500/10 text-rose-600 dark:text-rose-400 font-bold">
                ⚡ AI Reply Drafted
              </span>
              <span className="text-slate-400 font-medium">Tag: Enterprise Lead</span>
            </div>
          </div>
        )}

        {/* Card 6: Team Approval Matrix Micro Mockup */}
        {feature.id === 'approval-matrix' && (
          <div className="rounded-2xl p-3.5 bg-slate-50 dark:bg-[#090C1D] border border-slate-200 dark:border-slate-800/80 shadow-inner space-y-2.5">
            <div className="flex items-center justify-between text-[11px] font-semibold text-slate-600 dark:text-slate-300">
              <span>Multi-Tier Approval Pipeline</span>
              <span className="text-[#8B5CF6] font-bold">3/3 Signed</span>
            </div>

            {/* 3-Step Stepper Progress */}
            <div className="flex items-center justify-between relative py-1">
              <div className="absolute top-1/2 left-4 right-4 h-0.5 bg-slate-200 dark:bg-slate-700 -translate-y-1/2 z-0">
                <div
                  className={`h-full bg-gradient-to-r from-emerald-500 via-indigo-500 to-[#7138F5] transition-all duration-1000 ease-out ${
                    isVisible ? 'w-full' : 'w-0'
                  }`}
                />
              </div>
              <div className="relative z-10 flex flex-col items-center">
                <div className="w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[10px] font-bold shadow-sm">
                  ✓
                </div>
                <span className="text-[9px] font-bold text-slate-500 dark:text-slate-400 mt-1">
                  Creator
                </span>
              </div>
              <div className="relative z-10 flex flex-col items-center">
                <div className="w-6 h-6 rounded-full bg-indigo-500 text-white flex items-center justify-center text-[10px] font-bold shadow-sm">
                  ✓
                </div>
                <span className="text-[9px] font-bold text-slate-500 dark:text-slate-400 mt-1">
                  Editor
                </span>
              </div>
              <div className="relative z-10 flex flex-col items-center">
                <div className="w-6 h-6 rounded-full bg-[#7138F5] text-white flex items-center justify-center text-[10px] font-bold shadow-sm">
                  ✓
                </div>
                <span className="text-[9px] font-bold text-slate-500 dark:text-slate-400 mt-1">
                  Admin
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400 pt-0.5">
              <span className="text-emerald-500 font-bold">Audit Trail: #TX-9042</span>
              <span>Role: Workspace Owner</span>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Row: Feature Capability Highlight & Subtle Link */}
      <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs font-semibold text-[#7138F5] dark:text-[#C4A5FF] group-hover:text-[#5E24E5] dark:group-hover:text-white transition-colors">
        <span className="inline-flex items-center gap-1">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
          <span>Included in all enterprise plans</span>
        </span>
        <div className="flex items-center gap-1 group-hover:translate-x-1 transition-transform">
          <span>Learn more</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </div>
      </div>
    </div>
  );
}

export function FeatureOverviewGrid() {
  const headerRef = useRef<HTMLDivElement | null>(null);
  const [headerVisible, setHeaderVisible] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined' || typeof IntersectionObserver === 'undefined') {
      setHeaderVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setHeaderVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 },
    );

    if (headerRef.current) {
      observer.observe(headerRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <section className="py-20 sm:py-24 relative overflow-hidden bg-gradient-to-b from-transparent via-[#7138F5]/[0.02] dark:via-[#7138F5]/[0.04] to-transparent">
      {/* Background ambient light orbs */}
      <div className="absolute top-1/4 -left-48 w-96 h-96 bg-[#7138F5]/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 -right-48 w-96 h-96 bg-[#20C8E8]/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        {/* Section Header with smooth entrance */}
        <div
          ref={headerRef}
          className={`text-center max-w-3xl mx-auto mb-14 sm:mb-16 transition-all duration-700 ease-out ${
            headerVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}
        >
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest bg-[#7138F5]/10 dark:bg-[#7138F5]/20 text-[#7138F5] dark:text-[#C4A5FF] border border-[#7138F5]/20 mb-4 shadow-sm">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Unified SaaS Workspace</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-[#111827] dark:text-white leading-[1.15]">
            Everything your social team needs in{' '}
            <span className="bg-gradient-to-r from-[#7138F5] via-[#2878FF] to-[#20C8E8] bg-clip-text text-transparent">
              one command center
            </span>
          </h2>
          <p className="mt-4 text-base sm:text-lg text-[#64748B] dark:text-slate-400 max-w-2xl mx-auto leading-relaxed">
            Built on a real PostgreSQL and NestJS backend with strict workspace isolation,
            role-based approvals, and multi-channel publishing.
          </p>
        </div>

        {/* Feature Grid - Each Card Has Independent Viewport Observer with Staggered 3D Motion */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {FEATURE_LIST.map((feature, idx) => (
            <ScrollFeatureCard key={feature.id} feature={feature} index={idx} />
          ))}
        </div>
      </div>
    </section>
  );
}
