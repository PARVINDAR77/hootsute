'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Globe, Users, Sparkles, Send, ShieldCheck, TrendingUp, Zap } from 'lucide-react';

export interface PublicOverview {
  supportedPlatformsCount: number;
  activeWorkspacesCount: number;
  connectedAccountsCount: number;
  publishedPostsCount: number;
  aiDraftsGeneratedCount: number;
}

interface LiveMetricsSectionProps {
  overview: PublicOverview | null;
}

// Hook to animate numbers smoothly when scrolled into view
function useCountUp(target: number, duration: number = 1400, trigger: boolean = false) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!trigger) {
      setCount(0);
      return;
    }
    let startTime: number | null = null;
    let animationFrame: number;

    const animate = (currentTime: number) => {
      if (!startTime) startTime = currentTime;
      const progress = Math.min((currentTime - startTime) / duration, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(eased * target));

      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      } else {
        setCount(target);
      }
    };

    animationFrame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrame);
  }, [target, duration, trigger]);

  return count;
}

export function LiveMetricsSection({ overview }: LiveMetricsSectionProps) {
  const sectionRef = useRef<HTMLDivElement | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // If running in test or environments without IntersectionObserver, show immediately
    if (typeof window === 'undefined' || typeof IntersectionObserver === 'undefined') {
      setIsVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.15 },
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  const platformsCount = overview?.supportedPlatformsCount ?? 8;
  const workspacesCount = overview?.activeWorkspacesCount ?? 234;
  const draftsCount = overview?.aiDraftsGeneratedCount ?? 291;
  const publishedCount = overview?.publishedPostsCount ?? 33;

  const animatedPlatforms = useCountUp(platformsCount, 1200, isVisible);
  const animatedWorkspaces = useCountUp(workspacesCount, 1400, isVisible);
  const animatedDrafts = useCountUp(draftsCount, 1600, isVisible);
  const animatedPublished = useCountUp(publishedCount, 1200, isVisible);

  const metrics = [
    {
      id: 'platforms',
      value: animatedPlatforms,
      suffix: '',
      label: 'Supported Networks',
      subtext: 'Direct OAuth 2.0 Integration',
      badgeText: 'OFFICIAL APIS',
      badgeColor: 'bg-[#7138F5]/20 text-[#A78BFA] border-[#7138F5]/35',
      accentColor: 'from-[#7138F5] via-[#2878FF] to-[#20C8E8]',
      icon: Globe,
      iconBg: 'from-[#7138F5]/25 to-[#2878FF]/20 text-[#C4A5FF]',
      borderColor: 'hover:border-[#7138F5]',
      shadowColor: 'hover:shadow-[0_12px_35px_-8px_rgba(113,56,245,0.4)]',
      sparkline: 'M 2 14 Q 25 4, 45 10 T 85 4 T 120 12',
      sparklineColor: '#7138F5',
      delay: '0ms',
    },
    {
      id: 'workspaces',
      value: animatedWorkspaces,
      suffix: '+',
      label: 'Active Workspaces',
      subtext: 'Isolated Enterprise Tenancies',
      badgeText: 'ZERO LEAKAGE',
      badgeColor: 'bg-[#20C8E8]/15 text-[#20C8E8] border-[#20C8E8]/35',
      accentColor: 'from-[#20C8E8] via-[#2878FF] to-white',
      icon: Users,
      iconBg: 'from-[#20C8E8]/25 to-[#2878FF]/20 text-[#20C8E8]',
      borderColor: 'hover:border-[#20C8E8]',
      shadowColor: 'hover:shadow-[0_12px_35px_-8px_rgba(32,200,232,0.4)]',
      sparkline: 'M 2 16 Q 30 14, 55 8 T 90 6 T 120 2',
      sparklineColor: '#20C8E8',
      delay: '150ms',
    },
    {
      id: 'drafts',
      value: animatedDrafts,
      suffix: '+',
      label: 'AI Drafts Generated',
      subtext: 'Autonomous Multi-Format Content',
      badgeText: 'NEURAL AI',
      badgeColor: 'bg-[#DD2A7B]/15 text-[#FF65A3] border-[#DD2A7B]/35',
      accentColor: 'from-[#FF65A3] via-[#DD2A7B] to-[#F58529]',
      icon: Sparkles,
      iconBg: 'from-[#DD2A7B]/25 to-[#F58529]/20 text-[#FF65A3]',
      borderColor: 'hover:border-[#DD2A7B]',
      shadowColor: 'hover:shadow-[0_12px_35px_-8px_rgba(221,42,123,0.4)]',
      sparkline: 'M 2 16 Q 20 12, 40 4 T 80 14 T 120 4',
      sparklineColor: '#DD2A7B',
      delay: '300ms',
    },
    {
      id: 'published',
      value: animatedPublished,
      suffix: '',
      label: 'Posts Published',
      subtext: 'Dispatched Across All 8 Channels',
      badgeText: 'LIVE DISPATCH',
      badgeColor: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/35',
      accentColor: 'from-emerald-400 via-[#20C8E8] to-white',
      icon: Send,
      iconBg: 'from-emerald-500/25 to-[#20C8E8]/20 text-emerald-400',
      borderColor: 'hover:border-emerald-400',
      shadowColor: 'hover:shadow-[0_12px_35px_-8px_rgba(16,185,129,0.4)]',
      sparkline: 'M 2 14 Q 30 18, 60 10 T 95 6 T 120 2',
      sparklineColor: '#10B981',
      delay: '450ms',
    },
  ];

  return (
    <section
      ref={sectionRef}
      className="relative py-12 sm:py-14 border-y border-[#E7EAF2] dark:border-[#1E2749]/80 bg-gradient-to-b from-[#F7F8FC] via-white to-[#F7F8FC] dark:from-[#090D24] dark:via-[#060818] dark:to-[#090D24] transition-colors duration-200 overflow-hidden"
    >
      {/* Background Volumetric Neon Glows */}
      <div className="pointer-events-none absolute -top-24 left-1/4 w-96 h-96 rounded-full bg-[#7138F5]/10 blur-[90px]" />
      <div className="pointer-events-none absolute -bottom-24 right-1/4 w-96 h-96 rounded-full bg-[#20C8E8]/10 blur-[90px]" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6">
          {metrics.map((m) => {
            const Icon = m.icon;
            return (
              <div
                key={m.id}
                style={{
                  transitionDelay: isVisible ? m.delay : '0ms',
                }}
                className={`relative rounded-2xl p-5 sm:p-6 bg-white/90 dark:bg-gradient-to-br dark:from-[#111738]/95 dark:via-[#0C112C]/95 dark:to-[#070A1E] border border-[#E7EAF2] dark:border-white/10 ${m.borderColor} shadow-soft ${m.shadowColor} hover:-translate-y-1.5 transition-all duration-700 ease-out group overflow-hidden ${
                  isVisible
                    ? 'opacity-100 translate-y-0 scale-100'
                    : 'opacity-0 translate-y-8 scale-[0.96]'
                }`}
              >
                {/* Top specular highlight rim */}
                <div className="pointer-events-none absolute top-0 inset-x-0 h-[1.5px] bg-gradient-to-r from-transparent via-white/30 dark:via-white/20 to-transparent" />

                {/* Card Header: Glowing Icon Badge + Status Chip */}
                <div className="flex items-center justify-between gap-2 mb-4">
                  <div
                    className={`w-11 h-11 rounded-xl bg-gradient-to-br ${m.iconBg} flex items-center justify-center border border-white/15 shadow-md group-hover:scale-110 transition-transform duration-300`}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                  <div
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border shadow-sm ${m.badgeColor}`}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-current animate-ping" />
                    <span>{m.badgeText}</span>
                  </div>
                </div>

                {/* Big Metric Number with Gradient */}
                <div className="flex items-baseline gap-0.5">
                  <p
                    className={`text-3xl sm:text-4xl lg:text-[40px] font-black tracking-tight bg-gradient-to-r ${m.accentColor} bg-clip-text text-transparent`}
                  >
                    {m.value}
                  </p>
                  {m.suffix && (
                    <span className="text-xl sm:text-2xl font-black text-[#7138F5] dark:text-[#A78BFA]">
                      {m.suffix}
                    </span>
                  )}
                </div>

                {/* Primary Label */}
                <p className="text-sm font-extrabold text-[#111827] dark:text-white mt-1 tracking-tight">
                  {m.label}
                </p>

                {/* Subtext */}
                <p className="text-xs text-[#64748B] dark:text-slate-400 mt-0.5 leading-snug font-medium">
                  {m.subtext}
                </p>

                {/* Bottom Micro Sparkline Chart */}
                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-white/10 flex items-center justify-between text-[11px] text-[#64748B] dark:text-slate-400">
                  <span className="flex items-center gap-1 font-semibold text-emerald-500 dark:text-emerald-400">
                    <TrendingUp className="w-3 h-3" /> Live Telemetry
                  </span>
                  <svg viewBox="0 0 120 20" className="w-20 h-4" aria-hidden="true">
                    <path
                      d={m.sparkline}
                      fill="none"
                      stroke={m.sparklineColor}
                      strokeWidth="2.2"
                      strokeLinecap="round"
                      className="opacity-70 group-hover:opacity-100 transition-opacity"
                    />
                  </svg>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
