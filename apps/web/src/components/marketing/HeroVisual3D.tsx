'use client';

import React, { useState, useEffect } from 'react';
import { PlatformBadge } from '@/components/ui/PlatformBadge';
import { Sparkles, CheckCircle2, Send, BarChart3, Calendar, Layers, ShieldCheck } from 'lucide-react';
import { InteractiveParticleField } from './InteractiveParticleField';

export function HeroVisual3D() {
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return;

    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    const listener = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mediaQuery.addEventListener('change', listener);
    return () => mediaQuery.removeEventListener('change', listener);
  }, []);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (prefersReducedMotion) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width - 0.5) * 16;
    const y = ((e.clientY - rect.top) / rect.height - 0.5) * -16;
    setTilt({ x, y });
  };

  const handleMouseLeave = () => {
    setTilt({ x: 0, y: 0 });
  };

  return (
    <div
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="relative w-full max-w-xl mx-auto py-6 select-none"
      style={{ perspective: prefersReducedMotion ? 'none' : '1200px' }}
    >
      {/* Ambient dynamic glowing aura */}
      <div className="pointer-events-none absolute inset-4 rounded-full bg-gradient-to-tr from-[#7138F5]/35 via-[#2878FF]/25 to-[#20C8E8]/35 blur-3xl animate-pulseGlow" />

      {/* Interactive 3D tilted command platform */}
      <div
        className="relative transition-transform duration-300 ease-out will-change-transform"
        style={{
          transform: prefersReducedMotion
            ? 'none'
            : `rotateX(${tilt.y}deg) rotateY(${tilt.x}deg)`,
          transformStyle: 'preserve-3d',
        }}
      >
        {/* Glowing base pedestal */}
        <div className="relative rounded-3xl p-6 sm:p-8 bg-gradient-to-br from-[#0F142B] via-[#131B3E] to-[#0A0F24] border border-[#7138F5]/40 shadow-glow-card overflow-hidden">
          {/* Hardware-accelerated dynamic particle field */}
          <InteractiveParticleField />

          {/* Subtle grid backdrop */}
          <div
            className="pointer-events-none absolute inset-0 opacity-20"
            style={{
              backgroundImage:
                'linear-gradient(rgba(113,56,245,0.35) 1px, transparent 1px), linear-gradient(90deg, rgba(32,200,232,0.25) 1px, transparent 1px)',
              backgroundSize: '28px 28px',
            }}
          />

          {/* Orbital light rings */}
          <div className="pointer-events-none absolute -top-24 -right-24 w-64 h-64 rounded-full border border-[#20C8E8]/30 animate-spinSlow" />
          <div className="pointer-events-none absolute -bottom-24 -left-24 w-72 h-72 rounded-full border border-[#7138F5]/30" />

          {/* Floating device + platform cards composition */}
          <div
            className="relative z-10 grid grid-cols-12 gap-3.5 items-center"
            style={{ transformStyle: 'preserve-3d' }}
          >
            {/* Left floating tiles */}
            <div
              className="col-span-4 space-y-3"
              style={{ transform: prefersReducedMotion ? 'none' : 'translateZ(30px)' }}
            >
              <div className="rounded-2xl p-3 bg-white/10 backdrop-blur-md border border-white/15 shadow-lg animate-floatSlow hover:border-brand-purple/60 transition-all">
                <div className="flex items-center gap-2 mb-2">
                  <PlatformBadge platform="INSTAGRAM" variant="icon" size="sm" />
                  <span className="text-[11px] font-bold text-white">Instagram</span>
                </div>
                <div className="h-1.5 rounded-full bg-white/15 overflow-hidden">
                  <div className="h-full w-4/5 rounded-full bg-gradient-to-r from-[#F58529] to-[#DD2A7B]" />
                </div>
                <p className="text-[10px] text-slate-300 mt-1.5">Reel &amp; Carousel sync</p>
              </div>

              <div className="rounded-2xl p-3 bg-white/10 backdrop-blur-md border border-white/15 shadow-lg hover:border-emerald-400/50 transition-all">
                <div className="flex items-center gap-2 mb-2">
                  <PlatformBadge platform="LINKEDIN" variant="icon" size="sm" />
                  <span className="text-[11px] font-bold text-white">LinkedIn</span>
                </div>
                <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-300">
                  <CheckCircle2 className="w-3 h-3" />
                  Approved Dispatch
                </span>
              </div>
            </div>

            {/* Central Futuristic AI Command Phone */}
            <div
              className="col-span-4"
              style={{ transform: prefersReducedMotion ? 'none' : 'translateZ(50px)' }}
            >
              <div className="rounded-[28px] p-3.5 bg-gradient-to-b from-[#1B2452] to-[#0D1330] border-2 border-[#7138F5]/70 shadow-glow-purple space-y-3">
                <div className="flex items-center justify-between">
                  <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-[#7138F5] to-[#20C8E8] flex items-center justify-center text-white shadow-sm">
                    <Sparkles className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-[9px] font-bold uppercase tracking-wider text-[#20C8E8] flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#20C8E8] animate-ping" />
                    AI Engine
                  </span>
                </div>

                <div className="rounded-xl p-2.5 bg-gradient-to-br from-[#7138F5]/30 to-[#2878FF]/20 border border-white/15 text-center">
                  <p className="text-[10px] font-bold text-white">8-Channel Orbit</p>
                  <p className="text-[9px] text-slate-300 mt-0.5">Automated Multi-Post</p>
                </div>

                {/* Mini holographic curve */}
                <svg viewBox="0 0 120 42" className="w-full h-10" aria-hidden="true">
                  <defs>
                    <linearGradient id="heroCurve" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#7138F5" />
                      <stop offset="50%" stopColor="#2878FF" />
                      <stop offset="100%" stopColor="#20C8E8" />
                    </linearGradient>
                  </defs>
                  <path
                    d="M 4 34 Q 24 28, 38 18 T 74 22 T 116 6"
                    fill="none"
                    stroke="url(#heroCurve)"
                    strokeWidth="3"
                    strokeLinecap="round"
                  />
                  <circle cx="116" cy="6" r="3.5" fill="#20C8E8" />
                </svg>

                <div className="flex items-center justify-between text-[9px] text-slate-300 pt-1 border-t border-white/10">
                  <span className="flex items-center gap-1">
                    <Send className="w-2.5 h-2.5 text-[#20C8E8]" /> Bulk
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="w-2.5 h-2.5 text-[#7138F5]" /> Auto
                  </span>
                </div>
              </div>
            </div>

            {/* Right floating tiles */}
            <div
              className="col-span-4 space-y-3"
              style={{ transform: prefersReducedMotion ? 'none' : 'translateZ(30px)' }}
            >
              <div className="rounded-2xl p-3 bg-white/10 backdrop-blur-md border border-white/15 shadow-lg hover:border-red-500/50 transition-all">
                <div className="flex items-center gap-2 mb-2">
                  <PlatformBadge platform="YOUTUBE" variant="icon" size="sm" />
                  <span className="text-[11px] font-bold text-white">YouTube</span>
                </div>
                <div className="flex items-center gap-1 text-[10px] text-[#20C8E8] font-semibold">
                  <BarChart3 className="w-3 h-3" />
                  Shorts Telemetry
                </div>
              </div>

              <div className="rounded-2xl p-3 bg-white/10 backdrop-blur-md border border-white/15 shadow-lg animate-floatSlow hover:border-cyan-400/50 transition-all">
                <div className="flex items-center gap-2 mb-2">
                  <PlatformBadge platform="TIKTOK" variant="icon" size="sm" />
                  <span className="text-[11px] font-bold text-white">TikTok</span>
                </div>
                <p className="text-[10px] text-slate-300">Creator Auto-Publish</p>
              </div>
            </div>
          </div>

          {/* Bottom 8-platform orbital dock */}
          <div
            className="relative z-10 mt-6 pt-4 border-t border-white/10 flex items-center justify-between gap-2 flex-wrap"
            style={{ transform: prefersReducedMotion ? 'none' : 'translateZ(20px)' }}
          >
            <span className="text-[11px] font-semibold text-slate-300 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              Official AES-256-GCM OAuth 2.0
            </span>
            <div className="flex items-center gap-1.5">
              {(['FACEBOOK', 'TWITTER_X', 'PINTEREST', 'THREADS'] as const).map((p) => (
                <PlatformBadge key={p} platform={p} variant="icon" size="sm" />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
