'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  ShieldCheck,
  Layers,
  Sparkles,
  Globe,
  Lock,
  Zap,
  ArrowRight,
  Database,
  Cpu,
  CheckCircle2,
  Users,
  Compass,
  FileCheck,
  Workflow,
  Radio,
  Eye,
  Award,
  Terminal,
  Server,
  Key,
  Flame,
  Check,
  Code2,
  BarChart3,
  Calendar,
} from 'lucide-react';
import { ROUTES } from '@/lib/constants';
import { ORDERED_PLATFORMS, PlatformBadge } from '@/components/ui/PlatformBadge';

export function AboutClientView() {
  const [hoveredValue, setHoveredValue] = useState<number | null>(null);

  const heroMetrics = [
    {
      label: 'Official Social Networks',
      value: '8 Channels',
      subtext: 'Direct Meta, X, LinkedIn, Pinterest, YouTube, TikTok, Threads',
      badge: 'Zero Scraping',
      icon: Globe,
      gradient: 'from-[#20C8E8] to-[#2878FF]',
      borderGlow: 'hover:border-[#20C8E8]/60 hover:shadow-[0_15px_35px_-10px_rgba(32,200,232,0.3)]',
      pillColor: 'bg-[#20C8E8]/10 text-[#20C8E8] border-[#20C8E8]/20',
    },
    {
      label: 'Cryptographic Security',
      value: 'AES-256-GCM',
      subtext: 'Hardware-level envelope token encryption & zero-knowledge vault',
      badge: 'Envelope Vault',
      icon: Lock,
      gradient: 'from-[#7138F5] to-[#8B5CF6]',
      borderGlow: 'hover:border-[#7138F5]/60 hover:shadow-[0_15px_35px_-10px_rgba(113,56,245,0.3)]',
      pillColor: 'bg-[#7138F5]/10 text-[#7138F5] dark:text-[#C4A5FF] border-[#7138F5]/20',
    },
    {
      label: 'Tenant Isolation Architecture',
      value: '100% RBAC',
      subtext: 'PostgreSQL row-level isolation & immutable SHA-256 audit trails',
      badge: 'SOC-2 Type II',
      icon: ShieldCheck,
      gradient: 'from-emerald-500 to-[#20C8E8]',
      borderGlow: 'hover:border-emerald-500/60 hover:shadow-[0_15px_35px_-10px_rgba(16,185,129,0.3)]',
      pillColor: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
    },
    {
      label: 'Enterprise Scale Workspaces',
      value: '12,000+',
      subtext: 'Global creators & agencies dispatching with 99.99% uptime',
      badge: '99.99% Uptime',
      icon: Users,
      gradient: 'from-[#2878FF] to-[#7138F5]',
      borderGlow: 'hover:border-[#2878FF]/60 hover:shadow-[0_15px_35px_-10px_rgba(40,120,255,0.3)]',
      pillColor: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
    },
  ];

  const engineeringPillars = [
    {
      icon: Database,
      title: 'PostgreSQL 18 Multi-Tenant Ledger',
      badge: 'Single Source of Truth',
      badgeColor: 'text-[#7138F5] bg-[#7138F5]/10 border-[#7138F5]/20',
      description:
        'Every scheduled post, comment revision, and audit log is captured in strictly tenant-scoped PostgreSQL schemas. We use immutable SHA-256 content verification snapshots to guarantee what was approved is exactly what dispatches.',
      techPoints: [
        'Foreign key workspace constraints',
        'Row-level tenant isolation',
        'SHA-256 immutable draft hashing',
        'Automated database migration safety',
      ],
    },
    {
      icon: Cpu,
      title: 'NestJS Event-Driven Dispatch Pipeline',
      badge: 'Sub-Minute Precision',
      badgeColor: 'text-[#20C8E8] bg-[#20C8E8]/10 border-[#20C8E8]/20',
      description:
        'A high-throughput asynchronous scheduler queue runs continuous heartbeat sweeps to release approved posts down to the exact scheduled minute across Instagram, X, LinkedIn, and 5 other networks simultaneously.',
      techPoints: [
        'Async background queue sweeps',
        'Staggered anti-burst intervals (1m - 60m)',
        'Exponential-backoff retry policies',
        'Per-network error payload logging',
      ],
    },
    {
      icon: Lock,
      title: 'AES-256-GCM Token Encryption Vault',
      badge: 'Zero-Knowledge Storage',
      badgeColor: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
      description:
        'Social network OAuth 2.0 access tokens and refresh tokens are encrypted at rest with AES-256-GCM using unique per-tenant encryption vectors. Plaintext tokens never enter application logs or analytics events.',
      techPoints: [
        'AES-256-GCM authenticated encryption',
        'Automated refresh token rotation',
        'Early expiration health alarms',
        'Hardware-level cryptographic safety',
      ],
    },
    {
      icon: ShieldCheck,
      title: 'Granular Multi-Tier RBAC & Approval Gates',
      badge: 'Brand Protection',
      badgeColor: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20',
      description:
        'Eliminate accidental publishing and rogue posts. Role-based access control enforces that junior editors and AI generators must submit drafts through customizable multi-stage approval rails signed off by authorized Admins.',
      techPoints: [
        '4 Roles: Owner, Admin, Editor, Viewer',
        'Multi-stage sign-off matrices',
        'Immutable decision audit trails',
        'Rejection notes with revision tracking',
      ],
    },
  ];

  const companyValues = [
    {
      number: '01',
      title: 'Velocity with Governance',
      tag: 'SPEED & CONTROLS',
      icon: Zap,
      gradient: 'from-[#7138F5] to-[#2878FF]',
      borderGlow: 'hover:border-[#7138F5]/60 hover:shadow-[0_20px_40px_-15px_rgba(113,56,245,0.3)]',
      description:
        'Speed means nothing if a rogue post damages brand reputation. We build workflows that empower marketing teams to move 10× faster without sacrificing sign-off controls.',
      highlights: [
        'Multi-stage approval gates',
        'Immutable audit decision trails',
        'Zero unauthorized live publishing',
      ],
    },
    {
      number: '02',
      title: 'Official API Integrity',
      tag: 'ZERO SCRAPING',
      icon: CheckCircle2,
      gradient: 'from-[#20C8E8] to-[#2878FF]',
      borderGlow: 'hover:border-[#20C8E8]/60 hover:shadow-[0_20px_40px_-15px_rgba(32,200,232,0.3)]',
      description:
        'We never scrape, harvest cookies, or simulate headless browsers. Every connection to Instagram, Facebook, X, LinkedIn, Pinterest, YouTube, TikTok, and Threads runs through official partner OAuth 2.0 APIs.',
      highlights: [
        'Official Meta & X REST v2 partners',
        'Zero shadow-banning or account locks',
        'Proactive OAuth token health monitoring',
      ],
    },
    {
      number: '03',
      title: 'Design Craftsmanship',
      tag: 'TACTILE 3D UX',
      icon: Sparkles,
      gradient: 'from-[#8B5CF6] to-[#20C8E8]',
      borderGlow: 'hover:border-[#8B5CF6]/60 hover:shadow-[0_20px_40px_-15px_rgba(139,92,246,0.3)]',
      description:
        'Enterprise social media software should not look like legacy software from 2012. We craft tactile, 3D, high-performance interfaces with keyboard shortcuts, dark mode, and zero clutter.',
      highlights: [
        'Sub-100ms instantaneous interactions',
        'Cosmic dark glassmorphic system',
        'Focused multi-calendar command center',
      ],
    },
    {
      number: '04',
      title: 'Radical Multi-Tenant Isolation',
      tag: 'STRICT PRIVACY',
      icon: ShieldCheck,
      gradient: 'from-emerald-500 to-[#20C8E8]',
      borderGlow: 'hover:border-emerald-500/60 hover:shadow-[0_20px_40px_-15px_rgba(16,185,129,0.3)]',
      description:
        'Agencies managing 50 client brands must sleep soundly. We enforce tenant boundaries at the database, session, and API middleware levels so data leakage is impossible by design.',
      highlights: [
        'Row-level tenant database scoping',
        'Unique per-workspace encryption keys',
        'Isolated client asset libraries & brand kits',
      ],
    },
  ];

  return (
    <div className="relative overflow-hidden">
      {/* Background Ambient Cosmic Glows */}
      <div className="absolute top-0 left-1/4 w-[750px] h-[750px] bg-[#7138F5]/10 rounded-full blur-[180px] pointer-events-none" />
      <div className="absolute top-1/3 right-10 w-[600px] h-[600px] bg-[#20C8E8]/10 rounded-full blur-[160px] pointer-events-none" />
      <div className="absolute bottom-20 left-1/3 w-[600px] h-[600px] bg-[#2878FF]/10 rounded-full blur-[170px] pointer-events-none" />

      {/* Cybernetic Dot Matrix Grid */}
      <div
        className="absolute inset-0 opacity-[0.03] dark:opacity-[0.06] pointer-events-none"
        style={{
          backgroundImage:
            'radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)',
          backgroundSize: '28px 28px',
        }}
      />

      <main className="relative z-10 py-16 sm:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-24 sm:space-y-32">
          {/* ========================================================= */}
          {/* Section 1: Hero Section & High-Tech Telemetry Showcase    */}
          {/* ========================================================= */}
          <section className="text-center max-w-5xl mx-auto space-y-8">
            {/* Top Multi-Badge Pill */}
            <div className="inline-flex flex-wrap items-center justify-center gap-2.5 px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest bg-white/80 dark:bg-[#0D122B]/90 border border-slate-200 dark:border-[#1E2749] shadow-soft backdrop-blur-md">
              <span className="flex items-center gap-1.5 text-[#7138F5] dark:text-[#C4A5FF]">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Enterprise Social Architecture</span>
              </span>
              <span className="text-slate-300 dark:text-slate-700">•</span>
              <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>All 8 Social APIs Operational</span>
              </span>
              <span className="text-slate-300 dark:text-slate-700 hidden sm:inline">•</span>
              <span className="text-slate-600 dark:text-slate-300 hidden sm:inline">
                Est. 2024
              </span>
            </div>

            {/* Monumental Headline */}
            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight text-slate-900 dark:text-white leading-[1.08]">
              Pioneering Autonomous Social Operations for the{' '}
              <span className="bg-gradient-to-r from-[#7138F5] via-[#2878FF] to-[#20C8E8] bg-clip-text text-transparent">
                Multi-Network Era
              </span>
            </h1>

            {/* High-Impact Paragraph */}
            <p className="text-base sm:text-xl text-slate-600 dark:text-slate-300 max-w-3xl mx-auto leading-relaxed">
              We founded OmniSocial AI to liberate marketing teams, creators, and agencies from the
              chaos of fragmented dashboards, unreviewed manual cross-posting, and fragile scrapers.
              One command center to manage, generate, approve, and dispatch across all 8 networks.
            </p>

            {/* Upgraded Glassmorphic Telemetry Showcase (4 High-Tech Cards) */}
            <div className="pt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 text-left">
              {heroMetrics.map((metric) => {
                const Icon = metric.icon;
                return (
                  <div
                    key={metric.label}
                    className={`group relative rounded-3xl p-6 bg-white/90 dark:bg-[#0D122B]/90 border border-slate-200 dark:border-[#1E2749] shadow-soft dark:shadow-none backdrop-blur-xl transition-all duration-300 hover:-translate-y-1.5 ${metric.borderGlow} flex flex-col justify-between overflow-hidden`}
                  >
                    {/* Top Specular Rim Gradient */}
                    <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-[#7138F5] via-[#20C8E8] to-transparent opacity-60 group-hover:opacity-100 transition-opacity" />

                    <div className="space-y-4">
                      {/* Top Row: Icon + Status Badge */}
                      <div className="flex items-center justify-between">
                        <div
                          className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${metric.gradient} flex items-center justify-center text-white shadow-md group-hover:scale-105 transition-transform`}
                        >
                          <Icon className="w-6 h-6" />
                        </div>
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider border ${metric.pillColor}`}
                        >
                          {metric.badge}
                        </span>
                      </div>

                      {/* Main Metric Value & Label */}
                      <div>
                        <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                          {metric.value}
                        </div>
                        <div className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mt-1">
                          {metric.label}
                        </div>
                      </div>

                      {/* Detailed Explanatory Subtext */}
                      <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed border-t border-slate-100 dark:border-white/5 pt-3">
                        {metric.subtext}
                      </p>
                    </div>

                    {/* Bottom Micro Indicator */}
                    <div className="pt-4 mt-2 flex items-center gap-1.5 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Enterprise Verified</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Hero Quick Action CTAs */}
            <div className="pt-6 flex flex-wrap items-center justify-center gap-4">
              <Link
                href={ROUTES.SIGNUP}
                className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl btn-gradient text-sm sm:text-base font-bold shadow-glow-purple hover:scale-[1.02] transition-transform"
              >
                <span>Start Free Trial</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href={ROUTES.CONTACT}
                className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl border border-slate-200 dark:border-white/15 bg-white dark:bg-white/5 hover:border-[#7138F5]/50 text-sm sm:text-base font-bold text-slate-900 dark:text-white transition-all hover:scale-[1.02]"
              >
                <span>Schedule Architecture Demo</span>
              </Link>
            </div>
          </section>

          {/* ========================================================= */}
          {/* Mission & Vision Showcase Cards                           */}
          {/* ========================================================= */}
          <section className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
            {[
              {
                icon: Globe,
                title: 'Our Mission',
                tag: 'UNIFIED GOVERNANCE',
                gradient: 'from-[#7138F5] to-[#2878FF]',
                body: 'Eliminate fragmented spreadsheets, copy-pasting fatigue, and manual cross-posting by giving modern marketing teams one cohesive, AI-assisted workflow from creative ideation to verified bulk dispatch.',
              },
              {
                icon: Sparkles,
                title: 'Our Vision',
                tag: 'AUTONOMOUS INTELLIGENCE',
                gradient: 'from-[#20C8E8] to-[#7138F5]',
                body: 'A world where every brand speaks natively on Instagram, Facebook, X, LinkedIn, Pinterest, YouTube, TikTok, and Threads with AI precision, while humans retain absolute governance through role-based approval gates.',
              },
              {
                icon: ShieldCheck,
                title: 'Engineering Truth',
                tag: '100% COMPLIANT',
                gradient: 'from-emerald-500 to-[#20C8E8]',
                body: 'We reject headless scrapers, cookie hijacking, and unofficial reverse-engineered APIs. OmniSocial AI is built exclusively on official developer partner APIs with PostgreSQL state guarantees and hardware-grade encryption.',
              },
            ].map((card) => {
              const Icon = card.icon;
              return (
                <div
                  key={card.title}
                  className="relative rounded-3xl p-7 sm:p-8 bg-white/90 dark:bg-[#0E132B]/90 backdrop-blur-xl border border-slate-200 dark:border-[#1E2749] shadow-soft dark:shadow-none hover:border-[#7138F5]/60 hover:shadow-[0_20px_45px_-12px_rgba(113,56,245,0.25)] hover:-translate-y-1 transition-all duration-300 group overflow-hidden"
                >
                  <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-[#7138F5] to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="flex items-center justify-between mb-5">
                    <div
                      className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${card.gradient} flex items-center justify-center text-white shadow-md group-hover:scale-105 transition-transform`}
                    >
                      <Icon className="w-6 h-6" />
                    </div>
                    <span className="text-[10px] font-mono font-bold tracking-wider px-2.5 py-1 rounded-full bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-white/10">
                      {card.tag}
                    </span>
                  </div>
                  <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight group-hover:text-[#7138F5] dark:group-hover:text-[#C4A5FF] transition-colors">
                    {card.title}
                  </h2>
                  <p className="mt-3 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                    {card.body}
                  </p>
                </div>
              );
            })}
          </section>

          {/* ========================================================= */}
          {/* Deep Architectural Engineering Pillars                   */}
          {/* ========================================================= */}
          <section id="pillars" className="space-y-8">
            <div className="text-center max-w-3xl mx-auto space-y-3">
              <span className="text-xs font-bold uppercase tracking-widest text-[#7138F5] dark:text-[#C4A5FF]">
                Core Architecture
              </span>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                Engineered for Enterprise Stability &amp; Security
              </h2>
              <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400">
                How our stack guarantees zero cross-tenant data leakage and 99.99% delivery uptime.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
              {engineeringPillars.map((pillar) => {
                const Icon = pillar.icon;
                return (
                  <div
                    key={pillar.title}
                    className="rounded-3xl p-7 sm:p-8 bg-white/90 dark:bg-[#0E132B]/90 backdrop-blur-xl border border-slate-200 dark:border-[#1E2749] shadow-soft dark:shadow-none hover:border-[#7138F5]/50 transition-all space-y-5"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-center gap-3.5">
                        <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#7138F5]/20 to-[#2878FF]/20 text-[#7138F5] dark:text-[#C4A5FF] flex items-center justify-center shrink-0">
                          <Icon className="w-5 h-5" />
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                            {pillar.title}
                          </h3>
                        </div>
                      </div>
                      <span
                        className={`text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border shrink-0 ${pillar.badgeColor}`}
                      >
                        {pillar.badge}
                      </span>
                    </div>

                    <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                      {pillar.description}
                    </p>

                    <div className="pt-2 border-t border-slate-100 dark:border-white/5">
                      <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-600 dark:text-slate-300">
                        {pillar.techPoints.map((pt) => (
                          <li key={pt} className="flex items-center gap-2">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                            <span>{pt}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* ========================================================= */}
          {/* Section 2: Upgraded "Our Guiding Values" (Tactile Cards)   */}
          {/* ========================================================= */}
          <section className="space-y-10">
            <div className="text-center max-w-3xl mx-auto space-y-3">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest bg-gradient-to-r from-[#7138F5]/10 via-[#2878FF]/10 to-[#20C8E8]/10 text-[#7138F5] dark:text-[#C4A5FF] border border-[#7138F5]/25">
                <ShieldCheck className="w-3.5 h-3.5 text-[#7138F5]" />
                <span>Our Core Philosophy &amp; Principles</span>
              </div>
              <h2 className="text-3xl sm:text-5xl font-black text-slate-900 dark:text-white tracking-tight">
                How We Make Decisions
              </h2>
              <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed">
                Every architectural and product decision at OmniSocial AI is anchored in 4
                uncompromising commitments that guarantee brand governance, official API compliance,
                and interface joy.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {companyValues.map((val, idx) => {
                const Icon = val.icon;
                return (
                  <div
                    key={val.number}
                    onMouseEnter={() => setHoveredValue(idx)}
                    onMouseLeave={() => setHoveredValue(null)}
                    className={`relative rounded-3xl p-7 bg-white/95 dark:bg-[#0D122B]/95 border border-slate-200 dark:border-[#1E2749] shadow-soft dark:shadow-none backdrop-blur-xl flex flex-col justify-between transition-all duration-300 hover:-translate-y-2 overflow-hidden group ${val.borderGlow}`}
                  >
                    {/* Top Specular Rim Gradient */}
                    <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-[#7138F5] via-[#20C8E8] to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                    {/* Giant Watermark Numeral in Background */}
                    <div className="absolute top-3 right-4 text-6xl font-black font-mono select-none pointer-events-none opacity-[0.05] dark:opacity-[0.07] group-hover:opacity-[0.15] dark:group-hover:opacity-[0.20] group-hover:scale-110 transition-all duration-300">
                      {val.number}
                    </div>

                    <div className="space-y-5 relative z-10">
                      {/* Top Icon + Micro Category Tag */}
                      <div className="flex items-center justify-between">
                        <div
                          className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${val.gradient} flex items-center justify-center text-white shadow-md group-hover:scale-110 transition-transform`}
                        >
                          <Icon className="w-6 h-6" />
                        </div>
                        <span className="text-[10px] font-mono font-bold tracking-wider px-2.5 py-1 rounded-full bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-white/10">
                          {val.tag}
                        </span>
                      </div>

                      {/* Title & Core Description */}
                      <div>
                        <div className="text-xs font-mono font-bold text-[#7138F5] dark:text-[#C4A5FF]">
                          Principle {val.number}
                        </div>
                        <h3 className="text-lg font-black text-slate-900 dark:text-white mt-0.5 group-hover:text-[#7138F5] dark:group-hover:text-[#C4A5FF] transition-colors">
                          {val.title}
                        </h3>
                        <p className="mt-2.5 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                          {val.description}
                        </p>
                      </div>

                      {/* Concrete Architectural Highlights */}
                      <div className="pt-3 border-t border-slate-100 dark:border-white/5 space-y-1.5">
                        {val.highlights.map((item, hIdx) => (
                          <div
                            key={hIdx}
                            className="flex items-center gap-1.5 text-[11px] font-medium text-slate-600 dark:text-slate-400"
                          >
                            <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                            <span>{item}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Bottom Status Ribbon */}
                    <div className="pt-4 mt-4 border-t border-slate-100 dark:border-white/5 flex items-center justify-between text-[10px] font-mono text-slate-400">
                      <span>Strict Enforcement</span>
                      <span className="text-emerald-500 font-bold">ACTIVE</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* ========================================================= */}
          {/* Supported Networks Ecosystem Dock                         */}
          {/* ========================================================= */}
          <section className="p-8 sm:p-12 rounded-3xl bg-white/90 dark:bg-[#0D122B]/90 border border-slate-200 dark:border-white/10 shadow-soft backdrop-blur-md text-center space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-[#7138F5]/10 text-[#7138F5] dark:text-[#C4A5FF]">
              <Globe className="w-3.5 h-3.5" />
              <span>Native Social Ecosystem</span>
            </div>
            <h2 className="text-2xl sm:text-4xl font-black text-slate-900 dark:text-white">
              Direct Official Partnerships Across 8 Networks
            </h2>
            <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 max-w-2xl mx-auto leading-relaxed">
              Every connected channel benefits from continuous API compliance checks, real-time
              health indicators, and zero risk of shadow-banning.
            </p>
            <div className="pt-3 flex flex-wrap items-center justify-center gap-2.5">
              {ORDERED_PLATFORMS.map((platform) => (
                <PlatformBadge key={platform} platform={platform} variant="badge" size="md" />
              ))}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
