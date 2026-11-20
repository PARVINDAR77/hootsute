import React from 'react';
import Link from 'next/link';
import { ShieldCheck, ArrowLeft, Sparkles, Lock, Layers } from 'lucide-react';
import { BrandLogo } from '@/components/ui/BrandLogo';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { ORDERED_PLATFORMS, PlatformBadge } from '@/components/ui/PlatformBadge';
import { ROUTES } from '@/lib/constants';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-12 ambient-canvas">
      {/* Left Column: Brand + Auth Form */}
      <div className="lg:col-span-6 xl:col-span-5 min-h-screen lg:h-screen flex flex-col justify-between px-5 sm:px-8 lg:px-10 py-4 sm:py-5 overflow-y-auto">
        {/* Top bar */}
        <div className="flex items-center justify-between gap-4 shrink-0">
          <Link href={ROUTES.HOME} className="group inline-flex items-center">
            <BrandLogo />
          </Link>
          <div className="flex items-center gap-2">
            <Link
              href={ROUTES.HOME}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-[#64748B] dark:text-slate-300 hover:text-[#111827] dark:hover:text-white hover:bg-[#F7F8FC] dark:hover:bg-white/10 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Home</span>
            </Link>
            <ThemeToggle compact />
          </div>
        </div>

        {/* Center Form Card */}
        <div className="w-full max-w-md mx-auto my-auto py-3">
          <div className="relative rounded-3xl p-6 sm:p-7 bg-white dark:bg-[#0F142B]/95 border border-[#E7EAF2] dark:border-[#7138F5]/30 shadow-elevated dark:shadow-glow-card backdrop-blur-xl overflow-hidden">
            {/* Top Specular Gradient Highlight Rim */}
            <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-[#7138F5] via-[#20C8E8] to-transparent rounded-t-3xl" />
            {children}
          </div>
        </div>

        {/* Security Footer */}
        <div className="flex items-center justify-center gap-2 pt-2 pb-1 text-center text-[#64748B] dark:text-slate-400 text-xs shrink-0">
          <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
          <span>AES-256-GCM encrypted tokens &bull; Multi-tenant workspace isolation</span>
        </div>
      </div>

      {/* Right Column: Futuristic Cosmic 3D Visual Showcase */}
      <div className="hidden lg:flex lg:col-span-6 xl:col-span-7 relative overflow-hidden bg-[#070A18] items-center justify-center p-8 xl:p-12">
        {/* Swirling cosmic energy gradients */}
        <div className="pointer-events-none absolute -top-24 -right-24 w-[480px] h-[480px] rounded-full bg-gradient-to-br from-[#7138F5]/45 via-[#2878FF]/30 to-transparent blur-3xl animate-pulseGlow" />
        <div className="pointer-events-none absolute -bottom-28 -left-20 w-[440px] h-[440px] rounded-full bg-gradient-to-tr from-[#20C8E8]/35 via-[#2878FF]/25 to-transparent blur-3xl animate-pulseGlow" />
        <div
          className="pointer-events-none absolute inset-0 opacity-20"
          style={{
            backgroundImage:
              'radial-gradient(circle at 2px 2px, rgba(148,163,184,0.35) 1px, transparent 0)',
            backgroundSize: '28px 28px',
          }}
        />

        {/* High-End 3D Command Deck Showcase */}
        <div className="relative z-10 max-w-lg xl:max-w-xl w-full space-y-4 my-auto">
          {/* Main Showcase Glass Card */}
          <div className="relative rounded-3xl p-6 sm:p-7 bg-gradient-to-br from-[#12193B]/90 via-[#0E1430]/90 to-[#090D20]/95 border border-[#7138F5]/45 shadow-glow-card backdrop-blur-xl overflow-hidden">
            {/* Top Specular Gradient Line */}
            <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-[#7138F5] via-[#20C8E8] to-transparent" />

            {/* Top Telemetry Header */}
            <div className="flex items-center justify-between gap-3 mb-4">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 border border-white/10 text-[#20C8E8] text-xs font-bold">
                <Sparkles className="w-3.5 h-3.5 text-[#20C8E8]" />
                <span>OmniSocial AI Command Suite</span>
              </div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[11px] font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                <span>8 APIs Live</span>
              </div>
            </div>

            {/* 3D Visual Frame */}
            <div className="relative rounded-2xl overflow-hidden border border-white/10 bg-[#070A18]/80 shadow-2xl group my-4">
              <div className="absolute -inset-1 bg-gradient-to-r from-[#7138F5]/30 to-[#20C8E8]/30 rounded-2xl blur-xl opacity-40 group-hover:opacity-70 transition-opacity" />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/images/hero-3d-command-center.png"
                alt="OmniSocial AI Multi-Network 3D Command Center"
                className="relative z-10 w-full h-auto object-cover rounded-2xl transition-transform duration-700 group-hover:scale-[1.02]"
              />
              {/* Floating Holographic Badges */}
              <div className="absolute top-2.5 left-2.5 z-20 px-2.5 py-1 rounded-lg bg-[#0B0F19]/85 backdrop-blur-md border border-white/15 flex items-center gap-1.5 shadow-lg">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span className="text-[11px] font-semibold text-slate-200">OAuth 2.0 PKCE Live</span>
              </div>
              <div className="absolute bottom-2.5 right-2.5 z-20 px-2.5 py-1 rounded-lg bg-[#0B0F19]/85 backdrop-blur-md border border-[#7138F5]/40 flex items-center gap-1.5 shadow-lg">
                <Sparkles className="w-3.5 h-3.5 text-[#20C8E8] shrink-0" />
                <span className="text-[11px] font-semibold text-slate-200">AI Engine Calibrated</span>
              </div>
            </div>

            {/* Typography */}
            <div className="space-y-2 mt-2">
              <h2 className="text-xl font-extrabold text-white tracking-tight">
                Manage 8 Social Networks From One AI Workspace
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                Generate brand-calibrated posts, run multi-stage team approvals, bulk publish
                across accounts, and monitor real analytics in one place.
              </p>
            </div>

            {/* 8 Official Social Badges Row */}
            <div className="mt-4 pt-3.5 border-t border-white/10 flex flex-wrap items-center justify-between gap-2">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Official Networks
              </span>
              <div className="flex flex-wrap items-center gap-1.5">
                {ORDERED_PLATFORMS.map((p) => (
                  <PlatformBadge key={p} platform={p} variant="icon" size="sm" />
                ))}
              </div>
            </div>
          </div>

          {/* Integrated Architecture Cards */}
          <div className="grid grid-cols-2 gap-3.5">
            <div className="rounded-2xl p-3.5 bg-white/[0.04] border border-white/10 backdrop-blur-md hover:border-[#20C8E8]/40 transition-colors">
              <div className="flex items-center gap-2 mb-1.5">
                <div className="w-6 h-6 rounded-lg bg-[#20C8E8]/10 border border-[#20C8E8]/30 flex items-center justify-center shrink-0">
                  <Lock className="w-3.5 h-3.5 text-[#20C8E8]" />
                </div>
                <p className="text-xs font-bold text-white">Rotating Session Security</p>
              </div>
              <p className="text-[11px] text-slate-400 leading-snug">
                HttpOnly refresh tokens with automatic reuse detection &amp; TLS 1.3
              </p>
            </div>
            <div className="rounded-2xl p-3.5 bg-white/[0.04] border border-white/10 backdrop-blur-md hover:border-[#7138F5]/40 transition-colors">
              <div className="flex items-center gap-2 mb-1.5">
                <div className="w-6 h-6 rounded-lg bg-[#7138F5]/10 border border-[#7138F5]/30 flex items-center justify-center shrink-0">
                  <Layers className="w-3.5 h-3.5 text-[#7138F5]" />
                </div>
                <p className="text-xs font-bold text-white">Multi-Brand Workspaces</p>
              </div>
              <p className="text-[11px] text-slate-400 leading-snug">
                Role-based permissions for Owners, Admins, Editors &amp; Viewers
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
