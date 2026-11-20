'use client';

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import {
  Sparkles,
  TrendingUp,
  ShieldCheck,
  CheckCircle2,
  Zap,
  BarChart2,
  Radio,
} from 'lucide-react';
import { PlatformBadge } from '@/components/ui/PlatformBadge';

export function HeroCommandCenter3D() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [targetTilt, setTargetTilt] = useState({ x: 0, y: 0 });
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  // Check user reduced-motion preference
  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return;
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);
    const listener = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mediaQuery.addEventListener('change', listener);
    return () => mediaQuery.removeEventListener('change', listener);
  }, []);

  // Smooth spring damping interpolation for mouse parallax
  useEffect(() => {
    if (prefersReducedMotion) return;
    let animationFrame: number;
    const updateTilt = () => {
      setTilt((prev) => ({
        x: prev.x + (targetTilt.x - prev.x) * 0.08,
        y: prev.y + (targetTilt.y - prev.y) * 0.08,
      }));
      animationFrame = requestAnimationFrame(updateTilt);
    };
    animationFrame = requestAnimationFrame(updateTilt);
    return () => cancelAnimationFrame(animationFrame);
  }, [targetTilt, prefersReducedMotion]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (prefersReducedMotion || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width - 0.5) * 16; // -8 to +8 deg
    const y = ((e.clientY - rect.top) / rect.height - 0.5) * -16; // -8 to +8 deg
    setTargetTilt({ x, y });
  };

  const handleMouseLeave = () => {
    setTargetTilt({ x: 0, y: 0 });
  };

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="relative w-full max-w-2xl mx-auto py-2 sm:py-4 select-none"
      style={{ perspective: prefersReducedMotion ? 'none' : '1200px' }}
    >
      {/* 1. Dramatic Volumetric Glow Cones Behind the 3D Render */}
      <div className="pointer-events-none absolute -top-12 -left-12 w-80 h-80 rounded-full bg-gradient-to-tr from-[#7138F5]/40 via-[#2878FF]/25 to-transparent blur-3xl animate-pulseGlow" />
      <div
        className="pointer-events-none absolute -bottom-10 -right-10 w-96 h-96 rounded-full bg-gradient-to-bl from-[#20C8E8]/35 via-[#7138F5]/25 to-transparent blur-3xl animate-pulseGlow"
        style={{ animationDelay: '1.5s' }}
      />
      <div className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-80 rounded-full bg-[#7138F5]/15 blur-[90px]" />

      {/* 2. Interactive 3D Parallax Container */}
      <div
        className="relative transition-transform duration-100 ease-out will-change-transform"
        style={{
          transform: prefersReducedMotion
            ? 'none'
            : `rotateX(${tilt.y}deg) rotateY(${tilt.x}deg)`,
          transformStyle: 'preserve-3d',
        }}
      >
        {/* ======================================================== */}
        {/* 3D HERO ILLUSTRATION FRAMEWORK                           */}
        {/* ======================================================== */}
        <div
          className="relative rounded-[28px] sm:rounded-[32px] overflow-hidden bg-gradient-to-b from-[#090D24] via-[#070A18] to-[#04060E] border-2 border-[#7138F5]/40 shadow-[0_25px_70px_-15px_rgba(113,56,245,0.45),0_0_40px_rgba(32,200,232,0.15)] group"
          style={{ transformStyle: 'preserve-3d' }}
        >
          {/* Subtle Cybernetic Grid Pattern Overlay */}
          <div
            className="pointer-events-none absolute inset-0 opacity-20 z-10"
            style={{
              backgroundImage:
                'linear-gradient(rgba(113,56,245,0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(32,200,232,0.3) 1px, transparent 1px)',
              backgroundSize: '32px 32px',
            }}
          />

          {/* Core 3D Master Illustration */}
          <div className="relative aspect-[16/10] w-full overflow-hidden">
            <Image
              src="/images/hero-3d-command-center.png"
              alt="OmniSocial AI 3D Command Center — Futuristic isometric laptop, floating smartphone, and 3D social cubes"
              fill
              priority
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 640px"
              className="object-cover object-center transform transition-transform duration-700 group-hover:scale-[1.03]"
            />
            {/* Ambient vignette gradient */}
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#070A18] via-transparent to-transparent opacity-80" />
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-[#070A18]/50 via-transparent to-transparent" />
          </div>

          {/* ======================================================== */}
          {/* FLOATING HOLOGRAPHIC TELEMETRY BADGES (3D ELEVATION)     */}
          {/* ======================================================== */}
          {/* 1. Floating Top-Left Badge: TikTok Viral Spike */}
          <div
            className="absolute top-4 left-4 z-20 hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-black/65 backdrop-blur-xl border border-[#20C8E8]/40 shadow-[0_8px_20px_rgba(32,200,232,0.25)] animate-floatSlow"
            style={{
              transform: prefersReducedMotion ? 'none' : 'translateZ(45px)',
            }}
          >
            <div className="w-2 h-2 rounded-full bg-[#20C8E8] animate-ping" />
            <div className="text-[11px] leading-tight">
              <span className="font-extrabold text-white block">TikTok Spike</span>
              <span className="font-bold text-emerald-400">+312.4% Viral</span>
            </div>
          </div>

          {/* 2. Floating Top-Right Badge: LinkedIn Authority */}
          <div
            className="absolute top-4 right-4 z-20 hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-black/65 backdrop-blur-xl border border-[#0A66C2]/50 shadow-[0_8px_20px_rgba(10,102,194,0.3)]"
            style={{
              animation: 'floatSlow 7s ease-in-out infinite',
              animationDelay: '1.2s',
              transform: prefersReducedMotion ? 'none' : 'translateZ(45px)',
            }}
          >
            <div className="p-1 rounded-md bg-[#0A66C2] text-white">
              <TrendingUp className="w-3 h-3" />
            </div>
            <div className="text-[11px] leading-tight">
              <span className="font-extrabold text-white block">LinkedIn CTR</span>
              <span className="font-bold text-[#20C8E8]">14.8% Authority</span>
            </div>
          </div>

          {/* 3. Floating Bottom-Center Live Dispatch Pill */}
          <div
            className="absolute bottom-12 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-black/75 backdrop-blur-xl border border-[#7138F5]/50 shadow-[0_8px_20px_rgba(113,56,245,0.4)] pointer-events-none"
            style={{
              transform: prefersReducedMotion ? 'none' : 'translateZ(55px)',
            }}
          >
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
            </span>
            <span className="text-[10px] font-black tracking-wide text-white">
              8-Network Autonomous Dispatch
            </span>
            <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-white/10 text-[#20C8E8] font-bold">
              Active
            </span>
          </div>

          {/* ======================================================== */}
          {/* BOTTOM DOCK: Hardware Security Vault & 8 Platforms       */}
          {/* ======================================================== */}
          <div className="relative z-20 px-4 py-2.5 bg-black/85 backdrop-blur-2xl border-t border-white/15 flex items-center justify-between gap-2.5">
            <div className="flex items-center gap-2 min-w-0">
              <div className="p-1 rounded-md bg-emerald-500/20 text-emerald-400 shrink-0">
                <ShieldCheck className="w-3.5 h-3.5" />
              </div>
              <div className="min-w-0 leading-tight">
                <span className="text-[11px] font-bold text-white block truncate">
                  Official OAuth 2.0 Vault
                </span>
                <span className="text-[9px] text-slate-300 block truncate">
                  AES-256-GCM Hardware Encryption
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1 shrink-0">
              {(
                [
                  'META_FACEBOOK',
                  'META_INSTAGRAM',
                  'TWITTER',
                  'LINKEDIN',
                  'PINTEREST',
                  'YOUTUBE',
                  'TIKTOK',
                  'THREADS',
                ] as const
              ).map((p) => (
                <div
                  key={p}
                  className="p-1 rounded-md bg-white/10 hover:bg-white/20 hover:scale-110 transition-all border border-white/10"
                  title={p}
                >
                  <PlatformBadge platform={p as any} variant="icon" size="sm" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
