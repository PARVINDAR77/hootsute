'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Lock,
  Database,
  Globe,
  Radio,
  CheckCircle2,
  Mail,
  Phone,
  Check,
  Activity,
  Layers,
  Zap,
  ExternalLink,
} from 'lucide-react';
import { ROUTES } from '@/lib/constants';
import { BrandLogo } from '@/components/ui/BrandLogo';
import { ORDERED_PLATFORMS, PlatformBadge, PLATFORM_METADATA } from '@/components/ui/PlatformBadge';

export function PublicFooter() {
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleNewsletterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newsletterEmail.includes('@')) {
      setSubscribed(true);
      setNewsletterEmail('');
      setTimeout(() => setSubscribed(false), 4000);
    }
  };

  return (
    <footer className="relative border-t border-slate-200/80 dark:border-[#1E2749] bg-white dark:bg-[#070A18] overflow-hidden">
      {/* Specular Top Rim Multi-Stop Gradient */}
      <div className="absolute top-0 inset-x-0 h-[1.5px] bg-gradient-to-r from-transparent via-[#7138F5] via-[#20C8E8] to-transparent opacity-75" />

      {/* Ambient Cosmic Background Glows */}
      <div className="absolute top-0 left-1/4 w-[600px] h-[300px] bg-[#7138F5]/5 rounded-full blur-[150px] pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-[500px] h-[300px] bg-[#20C8E8]/5 rounded-full blur-[140px] pointer-events-none" />

      {/* Subtle Dot Matrix Grid */}
      <div
        className="absolute inset-0 opacity-[0.02] dark:opacity-[0.04] pointer-events-none"
        style={{
          backgroundImage:
            'radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)',
          backgroundSize: '28px 28px',
        }}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* ========================================================= */}
        {/* Upper Footer Ribbon: Live Status & Fast Newsletter       */}
        {/* ========================================================= */}
        <div className="py-8 border-b border-slate-200/80 dark:border-white/10 flex flex-col lg:flex-row items-center justify-between gap-6">
          {/* Live Operational Status Beacon */}
          <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3 text-xs">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-600 dark:text-emerald-400 font-bold">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>All 8 Social APIs Operational</span>
            </div>
            <span className="text-slate-300 dark:text-slate-700 hidden sm:inline">•</span>
            <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400 font-semibold">
              <Activity className="w-3.5 h-3.5 text-[#20C8E8]" />
              <span>99.99% Guaranteed Dispatch SLA</span>
            </div>
            <span className="text-slate-300 dark:text-slate-700 hidden md:inline">•</span>
            <div className="hidden md:flex items-center gap-1.5 text-slate-600 dark:text-slate-400 font-semibold">
              <Lock className="w-3.5 h-3.5 text-[#7138F5] dark:text-[#C4A5FF]" />
              <span>AES-256-GCM Envelope Encryption</span>
            </div>
          </div>

          {/* Quick Newsletter Subscribe */}
          <div className="w-full lg:w-auto">
            {subscribed ? (
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-bold">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <span>Subscribed to Social Operations Dispatch!</span>
              </div>
            ) : (
              <form
                onSubmit={handleNewsletterSubmit}
                className="flex items-center gap-2 max-w-md mx-auto lg:mx-0 p-1 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 shadow-sm focus-within:border-[#7138F5] focus-within:ring-2 focus-within:ring-[#7138F5]/25 transition-all"
              >
                <div className="flex items-center gap-2 pl-3 pr-1 py-1 flex-1">
                  <Mail className="w-4 h-4 text-slate-400 shrink-0" />
                  <input
                    type="email"
                    required
                    value={newsletterEmail}
                    onChange={(e) => setNewsletterEmail(e.target.value)}
                    placeholder="Enter work email for strategy updates..."
                    className="w-full bg-transparent text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none"
                  />
                </div>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl font-bold text-xs btn-gradient text-white shadow-sm shrink-0 hover:scale-[1.02] transition-transform"
                >
                  Subscribe
                </button>
              </form>
            )}
          </div>
        </div>

        {/* ========================================================= */}
        {/* Main 5-Column Navigation Grid                             */}
        {/* ========================================================= */}
        <div className="py-14 sm:py-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-10 lg:gap-8">
          {/* Column 1: Brand, Mission & 8 Connected Networks (4 cols) */}
          <div className="lg:col-span-4 space-y-5">
            <Link href={ROUTES.HOME} className="inline-flex group">
              <BrandLogo subtitle="AI Social Media Command" size="md" />
            </Link>

            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed max-w-sm">
              The production-grade multi-tenant command center for modern marketing teams,
              creators, and agencies. Plan, generate brand-calibrated copy, collaborate on
              multi-stage approvals, and dispatch bulk campaigns across 8 official social APIs.
            </p>

            {/* Direct Channel Desks */}
            <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-400 pt-1">
              <div className="flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 text-[#7138F5] dark:text-[#C4A5FF] shrink-0" />
                <a
                  href="mailto:support@omnisocial.ai"
                  className="hover:text-slate-900 dark:hover:text-white transition-colors font-medium"
                >
                  support@omnisocial.ai
                </a>
              </div>
              <div className="flex items-center gap-2 font-mono">
                <Phone className="w-3.5 h-3.5 text-[#20C8E8] shrink-0" />
                <a
                  href="tel:+18884926664"
                  className="hover:text-slate-900 dark:hover:text-white transition-colors"
                >
                  +1 (888) 492-OMNI (Toll-Free)
                </a>
              </div>
            </div>

            {/* 8 Connected Networks Dock with Badges */}
            <div className="pt-2 space-y-2">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 block">
                Official Developer Partner Networks:
              </span>
              <div className="flex flex-wrap items-center gap-2">
                {ORDERED_PLATFORMS.map((platform) => {
                  const meta = PLATFORM_METADATA[platform];
                  return (
                    <Link
                      key={platform}
                      href={ROUTES.PLATFORMS}
                      title={`${meta.label} - Official Partner API`}
                      className="transition-transform hover:scale-110"
                    >
                      <PlatformBadge platform={platform} variant="icon" size="sm" />
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Column 2: Platform Modules (2 cols) */}
          <div className="lg:col-span-2 space-y-4">
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-[#7138F5]" />
              <span>Platform</span>
            </h4>
            <ul className="space-y-2.5 text-xs sm:text-sm text-slate-600 dark:text-slate-400 font-medium">
              <li>
                <Link
                  href={ROUTES.FEATURES}
                  className="hover:text-[#7138F5] dark:hover:text-[#20C8E8] transition-colors"
                >
                  Features Catalog
                </Link>
              </li>
              <li>
                <Link
                  href={ROUTES.PLATFORMS}
                  className="hover:text-[#7138F5] dark:hover:text-[#20C8E8] transition-colors"
                >
                  Supported Platforms
                </Link>
              </li>
              <li>
                <Link
                  href={ROUTES.PRICING}
                  className="hover:text-[#7138F5] dark:hover:text-[#20C8E8] transition-colors"
                >
                  Pricing &amp; Quotas
                </Link>
              </li>
              <li>
                <Link
                  href={ROUTES.CALENDAR}
                  className="hover:text-[#7138F5] dark:hover:text-[#20C8E8] transition-colors"
                >
                  Visual Calendar
                </Link>
              </li>
              <li>
                <Link
                  href={ROUTES.CONTENT_STUDIO}
                  className="hover:text-[#7138F5] dark:hover:text-[#20C8E8] transition-colors"
                >
                  AI Content Studio
                </Link>
              </li>
              <li>
                <Link
                  href={ROUTES.BULK_PUBLISH}
                  className="hover:text-[#7138F5] dark:hover:text-[#20C8E8] transition-colors"
                >
                  Bulk Dispatch Engine
                </Link>
              </li>
              <li>
                <Link
                  href={ROUTES.INBOX}
                  className="hover:text-[#7138F5] dark:hover:text-[#20C8E8] transition-colors"
                >
                  Unified Social Inbox
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Solutions & Governance (2 cols) */}
          <div className="lg:col-span-2 space-y-4">
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-[#20C8E8]" />
              <span>Solutions</span>
            </h4>
            <ul className="space-y-2.5 text-xs sm:text-sm text-slate-600 dark:text-slate-400 font-medium">
              <li>
                <Link
                  href={ROUTES.FEATURES}
                  className="hover:text-[#7138F5] dark:hover:text-[#20C8E8] transition-colors"
                >
                  Marketing Agencies
                </Link>
              </li>
              <li>
                <Link
                  href={ROUTES.PRICING}
                  className="hover:text-[#7138F5] dark:hover:text-[#20C8E8] transition-colors"
                >
                  Multi-Brand Enterprises
                </Link>
              </li>
              <li>
                <Link
                  href={ROUTES.PRICING}
                  className="hover:text-[#7138F5] dark:hover:text-[#20C8E8] transition-colors"
                >
                  High-Growth Creators
                </Link>
              </li>
              <li>
                <Link
                  href={ROUTES.SECURITY}
                  className="hover:text-[#7138F5] dark:hover:text-[#20C8E8] transition-colors"
                >
                  Security Architecture
                </Link>
              </li>
              <li>
                <Link
                  href={ROUTES.BRAND_KIT}
                  className="hover:text-[#7138F5] dark:hover:text-[#20C8E8] transition-colors"
                >
                  Brand Kit Voice Lock
                </Link>
              </li>
              <li>
                <Link
                  href={ROUTES.COMPETITORS}
                  className="hover:text-[#7138F5] dark:hover:text-[#20C8E8] transition-colors"
                >
                  Competitor Intelligence
                </Link>
              </li>
              <li>
                <Link
                  href={ROUTES.ANALYTICS}
                  className="hover:text-[#7138F5] dark:hover:text-[#20C8E8] transition-colors"
                >
                  Performance Analytics
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 4: Resources & Playbooks (2 cols) */}
          <div className="lg:col-span-2 space-y-4">
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-[#8B5CF6]" />
              <span>Resources</span>
            </h4>
            <ul className="space-y-2.5 text-xs sm:text-sm text-slate-600 dark:text-slate-400 font-medium">
              <li>
                <Link
                  href={ROUTES.BLOG}
                  className="hover:text-[#7138F5] dark:hover:text-[#20C8E8] transition-colors"
                >
                  Blog &amp; Playbooks
                </Link>
              </li>
              <li>
                <Link
                  href={ROUTES.FAQ}
                  className="hover:text-[#7138F5] dark:hover:text-[#20C8E8] transition-colors"
                >
                  Frequently Asked
                </Link>
              </li>
              <li>
                <Link
                  href={ROUTES.HELP}
                  className="hover:text-[#7138F5] dark:hover:text-[#20C8E8] transition-colors"
                >
                  Help Center
                </Link>
              </li>
              <li>
                <Link
                  href={ROUTES.ABOUT}
                  className="hover:text-[#7138F5] dark:hover:text-[#20C8E8] transition-colors"
                >
                  About OmniSocial AI
                </Link>
              </li>
              <li>
                <Link
                  href={ROUTES.PLATFORMS}
                  className="hover:text-[#7138F5] dark:hover:text-[#20C8E8] transition-colors"
                >
                  API Limitations
                </Link>
              </li>
              <li>
                <Link
                  href={ROUTES.CONTACT}
                  className="hover:text-[#7138F5] dark:hover:text-[#20C8E8] transition-colors"
                >
                  Contact Desk &amp; Demo
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 5: Trust, Security & Legal (2 cols) */}
          <div className="lg:col-span-2 space-y-4">
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
              <span>Trust &amp; Legal</span>
            </h4>
            <ul className="space-y-2.5 text-xs sm:text-sm text-slate-600 dark:text-slate-400 font-medium">
              <li>
                <Link
                  href={ROUTES.SECURITY}
                  className="hover:text-[#7138F5] dark:hover:text-[#20C8E8] transition-colors"
                >
                  Security &amp; Isolation
                </Link>
              </li>
              <li>
                <Link
                  href={ROUTES.PRIVACY}
                  className="hover:text-[#7138F5] dark:hover:text-[#20C8E8] transition-colors"
                >
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link
                  href={ROUTES.TERMS}
                  className="hover:text-[#7138F5] dark:hover:text-[#20C8E8] transition-colors"
                >
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link
                  href={ROUTES.CONTACT}
                  className="hover:text-[#7138F5] dark:hover:text-[#20C8E8] transition-colors"
                >
                  Contact Sales Desk
                </Link>
              </li>
              <li>
                <Link
                  href={ROUTES.LOGIN}
                  className="hover:text-[#7138F5] dark:hover:text-[#20C8E8] transition-colors"
                >
                  Member Sign In
                </Link>
              </li>
              <li>
                <Link
                  href={ROUTES.SIGNUP}
                  className="hover:text-[#7138F5] dark:hover:text-[#20C8E8] transition-colors font-bold text-[#7138F5] dark:text-[#C4A5FF]"
                >
                  Create Free Workspace
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* ========================================================= */}
        {/* Bottom Bar: Copyright, Stack & Trust Badges               */}
        {/* ========================================================= */}
        <div className="py-7 border-t border-slate-200/80 dark:border-white/10 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-500 dark:text-slate-400">
          <div className="flex flex-col sm:flex-row items-center gap-2 text-center sm:text-left">
            <span>&copy; {new Date().getFullYear()} OmniSocial AI Inc. All rights reserved.</span>
            <span className="hidden sm:inline text-slate-300 dark:text-slate-700">•</span>
            <span>
              PostgreSQL-backed multi-tenant workspace isolation &middot; 8 Official Social Networks
            </span>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 font-mono text-[11px]">
            <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold">
              <Check className="w-3 h-3" />
              SOC-2 Type II
            </span>
            <span className="text-slate-300 dark:text-slate-700">•</span>
            <span className="inline-flex items-center gap-1 text-slate-600 dark:text-slate-300">
              <Lock className="w-3 h-3 text-[#7138F5]" />
              AES-256-GCM
            </span>
            <span className="text-slate-300 dark:text-slate-700">•</span>
            <span className="inline-flex items-center gap-1 text-slate-600 dark:text-slate-300">
              <Database className="w-3 h-3 text-[#20C8E8]" />
              PostgreSQL 18
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
