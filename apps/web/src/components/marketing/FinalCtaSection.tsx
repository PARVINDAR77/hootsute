'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Zap,
  Radio,
  CheckCircle2,
  Calendar,
  Layers,
  MessageSquare,
  Lock,
  Star,
  Users,
  Compass,
} from 'lucide-react';
import { ROUTES } from '@/lib/constants';

export interface FinalCtaSectionProps {
  badgeText?: string;
  title?: React.ReactNode;
  subtitle?: string;
  primaryCtaText?: string;
  secondaryCtaText?: string;
  secondaryCtaHref?: string;
}

export function FinalCtaSection({
  badgeText = 'Production-Grade Multi-Tenant Social Architecture',
  title = (
    <>
      Ready to unify all 8 social channels with{' '}
      <span className="bg-gradient-to-r from-[#7138F5] via-[#2878FF] to-[#20C8E8] bg-clip-text text-transparent">
        Autonomous AI?
      </span>
    </>
  ),
  subtitle = 'Create your workspace in seconds. Connect your accounts, generate platform-calibrated copy with AI, collaborate on team approvals, and dispatch bulk multi-channel campaigns with zero manual friction.',
  primaryCtaText = 'Start Free Trial',
  secondaryCtaText = 'Contact Sales & Schedule Demo',
  secondaryCtaHref = ROUTES.CONTACT,
}: FinalCtaSectionProps = {}) {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mousePos, setMousePos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = useState(false);
  const [tilt, setTilt] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [activePill, setActivePill] = useState<number | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const cardRef = useRef<HTMLDivElement | null>(null);

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
      { threshold: 0.1, rootMargin: '0px 0px -40px 0px' },
    );

    const el = containerRef.current;
    if (el) observer.observe(el);

    return () => {
      if (el) observer.unobserve(el);
    };
  }, []);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setMousePos({ x, y });

    // Subtle 3D tilt calculation (capped at ±4 degrees for elegant polish)
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const tiltX = -((y - centerY) / centerY) * 3;
    const tiltY = ((x - centerX) / centerX) * 3;

    setTilt({ x: tiltX, y: tiltY });
  };

  const handleMouseEnter = () => {
    setIsHovering(true);
  };

  const handleMouseLeave = () => {
    setIsHovering(false);
    setTilt({ x: 0, y: 0 });
  };

  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    const targetUrl = email.trim()
      ? `${ROUTES.SIGNUP}?email=${encodeURIComponent(email.trim())}`
      : ROUTES.SIGNUP;
    router.push(targetUrl);
  };

  return (
    <section className="py-20 sm:py-28 relative overflow-hidden bg-white/70 dark:bg-[#070A18]/80 border-t border-[#E7EAF2] dark:border-[#1E2749]">
      {/* Background Ambient Cosmic Glows */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] bg-gradient-to-tr from-[#7138F5]/15 via-[#2878FF]/15 to-[#20C8E8]/15 rounded-full blur-[160px] pointer-events-none" />
      <div className="absolute top-10 left-10 w-80 h-80 bg-[#7138F5]/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-80 h-80 bg-[#20C8E8]/10 rounded-full blur-[120px] pointer-events-none" />

      {/* Cybernetic Dot Matrix Grid */}
      <div
        className="absolute inset-0 opacity-[0.03] dark:opacity-[0.07] pointer-events-none"
        style={{
          backgroundImage:
            'radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)',
          backgroundSize: '28px 28px',
        }}
      />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative" ref={containerRef}>
        {/* Main CTA Hero Container with 3D Parallax & Cursor Spotlight */}
        <div
          ref={cardRef}
          onMouseMove={handleMouseMove}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          style={{
            transform: isHovering
              ? `perspective(1000px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg) scale3d(1.01, 1.01, 1.01)`
              : 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)',
            transition: isHovering
              ? 'transform 0.15s ease-out'
              : 'transform 0.6s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.6s ease',
          }}
          className={`relative rounded-3xl p-8 sm:p-14 lg:p-16 overflow-hidden border backdrop-blur-2xl transition-all duration-700 ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
          } ${
            isHovering
              ? 'border-[#7138F5] dark:border-[#7138F5]/80 shadow-[0_30px_70px_-15px_rgba(113,56,245,0.45)] ring-1 ring-[#7138F5]/40'
              : 'border-[#E2E8F0] dark:border-[#222C54] shadow-2xl bg-white/90 dark:bg-gradient-to-br dark:from-[#0D122B]/95 dark:via-[#131A3D]/90 dark:to-[#0A0E23]/95'
          }`}
        >
          {/* Mouse-Driven Specular Spotlight */}
          {isHovering && (
            <div
              className="pointer-events-none absolute inset-0 z-0 opacity-100 transition-opacity duration-300"
              style={{
                background: `radial-gradient(550px circle at ${mousePos.x}px ${mousePos.y}px, rgba(113, 56, 245, 0.22), rgba(32, 200, 232, 0.08) 50%, transparent 80%)`,
              }}
            />
          )}

          {/* Specular Top Rim Gradient */}
          <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-[#7138F5] via-[#20C8E8] to-transparent opacity-80" />

          {/* Animated Background Mesh Wave (Subtle SVG in background) */}
          <div className="absolute inset-0 opacity-[0.04] dark:opacity-[0.08] pointer-events-none mix-blend-overlay">
            <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <pattern id="cta-mesh" width="40" height="40" patternUnits="userSpaceOnUse">
                  <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="1" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#cta-mesh)" />
            </svg>
          </div>

          {/* Interactive Floating Telemetry Holographic Cards */}
          <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-4 mb-8 sm:mb-10">
            {/* Hologram 1: Multi-Channel Synchronizer */}
            <div
              onMouseEnter={() => setActivePill(1)}
              onMouseLeave={() => setActivePill(null)}
              className={`p-3.5 sm:p-4 rounded-2xl border backdrop-blur-xl transition-all duration-300 cursor-pointer ${
                activePill === 1
                  ? 'bg-gradient-to-r from-[#7138F5]/20 to-[#2878FF]/20 border-[#7138F5] shadow-lg shadow-[#7138F5]/20 scale-[1.02] -translate-y-0.5'
                  : 'bg-white/70 dark:bg-[#111736]/70 border-slate-200/80 dark:border-white/10 hover:border-[#7138F5]/50'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#7138F5] to-[#2878FF] flex items-center justify-center text-white shadow-sm shrink-0">
                    <Radio className="w-4 h-4 animate-pulse" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                        8 Official Channels Live
                      </span>
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                        OAuth 2.0
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      Instagram, Facebook, X, LinkedIn, Pinterest, YouTube, TikTok, Threads
                    </p>
                  </div>
                </div>
                <div className="hidden sm:flex items-center gap-1 text-[11px] font-bold text-[#7138F5] dark:text-[#C4A5FF]">
                  <span>Instant Connect</span>
                  <ArrowRight className="w-3 h-3" />
                </div>
              </div>
            </div>

            {/* Hologram 2: Gemini Neural AI Engine */}
            <div
              onMouseEnter={() => setActivePill(2)}
              onMouseLeave={() => setActivePill(null)}
              className={`p-3.5 sm:p-4 rounded-2xl border backdrop-blur-xl transition-all duration-300 cursor-pointer ${
                activePill === 2
                  ? 'bg-gradient-to-r from-[#20C8E8]/20 to-[#7138F5]/20 border-[#20C8E8] shadow-lg shadow-[#20C8E8]/20 scale-[1.02] -translate-y-0.5'
                  : 'bg-white/70 dark:bg-[#111736]/70 border-slate-200/80 dark:border-white/10 hover:border-[#20C8E8]/50'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#20C8E8] to-[#7138F5] flex items-center justify-center text-white shadow-sm shrink-0">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                        Gemini AI Content Engine
                      </span>
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-[#7138F5]/10 text-[#7138F5] dark:text-[#C4A5FF] border border-[#7138F5]/20">
                        Brand Voice
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      Tailored multi-format variants, hashtags, and festival occasion drafts
                    </p>
                  </div>
                </div>
                <div className="hidden sm:flex items-center gap-1 text-[11px] font-bold text-[#20C8E8]">
                  <span>Auto-Calibrated</span>
                  <ArrowRight className="w-3 h-3" />
                </div>
              </div>
            </div>
          </div>

          {/* Central Hero Headline & Value Pitch */}
          <div className="relative z-10 text-center max-w-3xl mx-auto space-y-6">
            {/* Top Security & Architecture Pill */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider bg-white dark:bg-white/10 text-slate-700 dark:text-[#20C8E8] border border-slate-200 dark:border-white/15 shadow-sm">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
              <span>{badgeText}</span>
            </div>

            {/* Radiant Title */}
            <h2 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-slate-900 dark:text-white leading-[1.12]">
              {title}
            </h2>

            {/* Description Subtitle */}
            <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto leading-relaxed">
              {subtitle}
            </p>

            {/* Interactive Fast-Track Email Input Bar */}
            <form
              onSubmit={handleEmailSubmit}
              className="mt-8 max-w-xl mx-auto p-2 rounded-2xl bg-white dark:bg-[#090D22] border border-slate-300 dark:border-[#2B3566] shadow-xl flex flex-col sm:flex-row items-center gap-2 transition-all focus-within:border-[#7138F5] focus-within:ring-2 focus-within:ring-[#7138F5]/30"
            >
              <div className="relative flex-1 w-full pl-3.5 pr-2 py-1 flex items-center gap-2.5">
                <Compass className="w-5 h-5 text-slate-400 shrink-0" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your work email address..."
                  className="w-full bg-transparent text-sm sm:text-base text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none"
                />
              </div>
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full sm:w-auto px-6 py-3 rounded-xl font-bold text-sm sm:text-base bg-gradient-to-r from-[#7138F5] via-[#2878FF] to-[#20C8E8] text-white shadow-md shadow-[#7138F5]/30 hover:shadow-lg hover:shadow-[#7138F5]/50 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 shrink-0 group"
              >
                <span>Claim Free Workspace</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </form>

            {/* Direct Dual Action CTAs */}
            <div className="pt-2 flex flex-wrap items-center justify-center gap-3.5">
              <Link
                href={ROUTES.SIGNUP}
                className="px-7 py-3.5 rounded-xl font-bold text-sm sm:text-base bg-gradient-to-r from-[#7138F5] to-[#2878FF] text-white shadow-lg shadow-[#7138F5]/30 hover:shadow-xl hover:shadow-[#7138F5]/50 hover:scale-[1.02] transition-all flex items-center gap-2 group"
              >
                <span>{primaryCtaText}</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                href={secondaryCtaHref}
                className="px-6 py-3.5 rounded-xl font-bold text-sm sm:text-base bg-white dark:bg-white/10 border border-slate-200 dark:border-white/15 text-slate-900 dark:text-white hover:bg-slate-50 dark:hover:bg-white/15 hover:border-[#7138F5]/50 transition-all flex items-center gap-2"
              >
                <Calendar className="w-4 h-4 text-[#7138F5] dark:text-[#20C8E8]" />
                <span>{secondaryCtaText}</span>
              </Link>
            </div>

            {/* Trust, Guarantee & Rating Ribbon */}
            <div className="pt-6 border-t border-slate-200/80 dark:border-white/10 flex flex-wrap items-center justify-center gap-y-3 gap-x-6 text-xs text-slate-500 dark:text-slate-400">
              <div className="flex items-center gap-1.5 text-amber-500 font-bold">
                <span className="tracking-widest">★★★★★</span>
                <span className="text-slate-700 dark:text-slate-300 font-extrabold">4.9/5</span>
                <span>(12,000+ teams)</span>
              </div>

              <span className="hidden sm:inline text-slate-300 dark:text-slate-700">•</span>

              <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-medium">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>14-Day Free Pro Trial</span>
              </div>

              <span className="hidden sm:inline text-slate-300 dark:text-slate-700">•</span>

              <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400 font-medium">
                <Zap className="w-3.5 h-3.5 text-amber-500" />
                <span>No Credit Card Required</span>
              </div>

              <span className="hidden sm:inline text-slate-300 dark:text-slate-700">•</span>

              <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400 font-medium">
                <Lock className="w-3.5 h-3.5 text-[#7138F5] dark:text-[#C4A5FF]" />
                <span>SOC-2 &amp; AES-256 Encrypted</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
