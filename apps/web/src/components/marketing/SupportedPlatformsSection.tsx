'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import {
  Globe,
  ArrowRight,
  CheckCircle2,
  ExternalLink,
  ShieldCheck,
  Zap,
  Sparkles,
} from 'lucide-react';
import { ROUTES } from '@/lib/constants';
import { PlatformBadge, SupportedPlatformKey } from '@/components/ui/PlatformBadge';
import { PLATFORM_SPECS, PlatformCapabilitySpec } from '@/components/marketing/public-content';

interface PlatformCardEnhanced {
  spec: PlatformCapabilitySpec;
  accentGlow: string;
  borderColor: string;
  apiBadge: string;
  formatTags: string[];
  specsPill: string;
}

const ENHANCED_PLATFORMS: Record<SupportedPlatformKey, Omit<PlatformCardEnhanced, 'spec'>> = {
  INSTAGRAM: {
    accentGlow: 'bg-[#DD2A7B]',
    borderColor: 'group-hover:border-[#DD2A7B]/60',
    apiBadge: 'Meta Graph API v20.0',
    formatTags: ['Reels', 'Carousels', 'Stories'],
    specsPill: '4:5 to 1.91:1 • Up to 8 MB',
  },
  FACEBOOK: {
    accentGlow: 'bg-[#1877F2]',
    borderColor: 'group-hover:border-[#1877F2]/60',
    apiBadge: 'Meta Graph OAuth',
    formatTags: ['Pages', 'UTM Links', 'Video'],
    specsPill: 'Multi-Image • Inbox Moderation',
  },
  TWITTER_X: {
    accentGlow: 'bg-slate-400',
    borderColor: 'group-hover:border-slate-400/60',
    apiBadge: 'Official X API v2',
    formatTags: ['280 Chars', 'Threads', 'Media'],
    specsPill: 'PKCE v2 • Tracked Links',
  },
  LINKEDIN: {
    accentGlow: 'bg-[#0A66C2]',
    borderColor: 'group-hover:border-[#0A66C2]/60',
    apiBadge: 'LinkedIn REST v2',
    formatTags: ['Articles', 'Company Page', 'B2B'],
    specsPill: 'Up to 3,000 Chars • Executive',
  },
  PINTEREST: {
    accentGlow: 'bg-[#E60023]',
    borderColor: 'group-hover:border-[#E60023]/60',
    apiBadge: 'Pinterest API v5',
    formatTags: ['Vertical Pins', 'Boards', 'SEO'],
    specsPill: '2:3 Aspect • Rich Pins',
  },
  YOUTUBE: {
    accentGlow: 'bg-[#FF0000]',
    borderColor: 'group-hover:border-[#FF0000]/60',
    apiBadge: 'YouTube Data API v3',
    formatTags: ['Shorts', '4K 60fps', 'Metadata'],
    specsPill: 'MP4/MOV • Scheduled Privacy',
  },
  TIKTOK: {
    accentGlow: 'bg-[#00F2FE]',
    borderColor: 'group-hover:border-[#00F2FE]/60',
    apiBadge: 'TikTok Content API',
    formatTags: ['9:16 Video', 'Viral Sounds', 'Duet'],
    specsPill: 'Direct Publish & Drafts',
  },
  THREADS: {
    accentGlow: 'bg-zinc-400',
    borderColor: 'group-hover:border-zinc-400/60',
    apiBadge: 'Meta Threads API',
    formatTags: ['500 Chars', 'Media Containers', 'Sync'],
    specsPill: 'Two-Step Publish Pipeline',
  },
};

function PlatformInteractiveCard({
  spec,
  index,
  isVisible,
}: {
  spec: PlatformCapabilitySpec;
  index: number;
  isVisible: boolean;
}) {
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);
  const cardRef = useRef<HTMLDivElement | null>(null);

  const enhanced = ENHANCED_PLATFORMS[spec.key];

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
        transitionDelay: isVisible ? `${index * 60}ms` : '0ms',
        transform: isHovered
          ? `perspective(1000px) rotateX(${tilt.y}deg) rotateY(${tilt.x}deg) translateY(-8px)`
          : undefined,
      }}
      className={`relative rounded-3xl p-5 sm:p-6 flex flex-col justify-between overflow-hidden bg-white/95 dark:bg-[#0E132A]/90 backdrop-blur-xl border border-[#E2E8F0] dark:border-[#1E2749] ${
        enhanced.borderColor
      } hover:shadow-[0_20px_45px_-12px_rgba(113,56,245,0.2)] dark:hover:shadow-[0_20px_45px_-12px_rgba(113,56,245,0.35)] transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group ${
        isVisible ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-10 scale-[0.94]'
      }`}
    >
      {/* Specular Top Rim Gradient */}
      <div className="absolute top-0 inset-x-0 h-[1.5px] bg-gradient-to-r from-transparent via-white/50 dark:via-white/20 to-transparent" />

      {/* Ambient background glow on hover */}
      <div
        className={`absolute -right-14 -top-14 w-36 h-36 rounded-full ${enhanced.accentGlow} blur-3xl opacity-10 group-hover:opacity-25 transition-opacity duration-500 pointer-events-none`}
      />

      {/* Top Header: Platform Icon + Name + Verified Badge */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="group-hover:scale-110 transition-transform duration-300">
              <PlatformBadge platform={spec.key} variant="icon" size="md" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#111827] dark:text-white flex items-center gap-1.5">
                <span>{spec.name}</span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              </h3>
              <p className="text-[11px] text-[#64748B] dark:text-slate-400">Official Partner API</p>
            </div>
          </div>

          <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 text-[10px] font-bold border border-emerald-500/25">
            Live
          </span>
        </div>

        <p className="text-xs text-[#64748B] dark:text-slate-400 leading-relaxed min-h-[34px]">
          {spec.accountTypes}
        </p>
      </div>

      {/* Middle Section: Dedicated Miniature Visual Telemetry Box */}
      <div className="my-4 p-3 rounded-2xl bg-slate-50 dark:bg-[#090C1D] border border-slate-200 dark:border-slate-800/80 shadow-inner space-y-2">
        <div className="flex items-center justify-between text-[10px] font-semibold text-slate-600 dark:text-slate-300">
          <span className="text-[#7138F5] dark:text-[#C4A5FF] font-bold">{enhanced.apiBadge}</span>
          <span className="text-emerald-500 font-bold">OAuth 2.0</span>
        </div>

        {/* Feature Format Pills */}
        <div className="flex flex-wrap gap-1">
          {enhanced.formatTags.map((tag) => (
            <span
              key={tag}
              className="px-2 py-0.5 rounded-md bg-white dark:bg-[#121835] border border-slate-200/80 dark:border-slate-800 text-[10px] font-medium text-slate-700 dark:text-slate-300"
            >
              {tag}
            </span>
          ))}
        </div>

        <div className="text-[10px] font-mono text-slate-500 dark:text-slate-400 truncate pt-0.5">
          {enhanced.specsPill}
        </div>
      </div>

      {/* Bottom Row: Capabilities Highlight & Direct Specs Link */}
      <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs font-semibold text-[#7138F5] dark:text-[#20C8E8]">
        <span className="inline-flex items-center gap-1 text-[11px]">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
          <span>Automated Bulk Sync</span>
        </span>
        <Link
          href={ROUTES.PLATFORMS}
          className="flex items-center gap-1 group-hover:translate-x-1 transition-transform"
        >
          <span className="text-[11px]">Specs</span>
          <ArrowRight className="w-3 h-3" />
        </Link>
      </div>
    </div>
  );
}

export function SupportedPlatformsSection() {
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

  return (
    <section className="py-20 sm:py-24 bg-white/75 dark:bg-[#0B1024]/60 border-y border-[#E7EAF2] dark:border-[#1E2749] relative overflow-hidden">
      {/* Background ambient light orbs */}
      <div className="absolute top-1/4 -left-48 w-96 h-96 bg-[#7138F5]/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-1/4 -right-48 w-96 h-96 bg-[#20C8E8]/10 rounded-full blur-[140px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative" ref={sectionRef}>
        {/* Header Bar */}
        <div
          className={`flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-12 sm:mb-14 transition-all duration-700 ease-out ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}
        >
          <div>
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest bg-[#7138F5]/10 dark:bg-[#7138F5]/20 text-[#7138F5] dark:text-[#20C8E8] border border-[#7138F5]/20 mb-3 shadow-sm">
              <Globe className="w-3.5 h-3.5" />
              <span>Direct Official API Network</span>
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-[#111827] dark:text-white leading-[1.15]">
              Direct Official Integration with{' '}
              <span className="bg-gradient-to-r from-[#7138F5] via-[#2878FF] to-[#20C8E8] bg-clip-text text-transparent">
                8 Global Networks
              </span>
            </h2>
            <p className="mt-3 text-base sm:text-lg text-[#64748B] dark:text-slate-400 max-w-2xl leading-relaxed">
              Publish, schedule, and analyze with official partner OAuth 2.0 flows. Zero scraping, zero token leakage, 100% compliance with platform terms.
            </p>
          </div>

          <Link
            href={ROUTES.PLATFORMS}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm bg-white dark:bg-[#12183A] text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 hover:border-[#7138F5] dark:hover:border-[#20C8E8] hover:-translate-y-0.5 transition-all shadow-sm shrink-0"
          >
            <span>View full API capabilities</span>
            <ArrowRight className="w-4 h-4 text-[#7138F5] dark:text-[#20C8E8]" />
          </Link>
        </div>

        {/* 8 Platform Cards Cascading Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {PLATFORM_SPECS.map((spec, idx) => (
            <PlatformInteractiveCard key={spec.key} spec={spec} index={idx} isVisible={isVisible} />
          ))}
        </div>
      </div>
    </section>
  );
}
