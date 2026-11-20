'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  CheckCircle2,
  Info,
  ArrowRight,
  ShieldCheck,
  Search,
  Filter,
  Layers,
  Sparkles,
  Lock,
  Globe,
  Radio,
  FileCheck,
  ExternalLink,
  SlidersHorizontal,
  Table as TableIcon,
  LayoutGrid,
  Zap,
} from 'lucide-react';
import { PLATFORM_SPECS, PlatformCapabilitySpec } from '@/components/marketing/public-content';
import { PlatformBadge, SupportedPlatformKey } from '@/components/ui/PlatformBadge';
import { ROUTES } from '@/lib/constants';

type PlatformFilterCategory =
  | 'All'
  | 'Meta Ecosystem'
  | 'Video & Short-Form'
  | 'Professional & B2B'
  | 'Visual & Discovery';

interface PlatformExtendedMeta {
  color: string;
  category: PlatformFilterCategory;
  rateLimit: string;
  apiDocsUrl: string;
  maxChars?: number;
  maxVideoMins?: number;
}

const PLATFORM_EXTRA_INFO: Record<SupportedPlatformKey, PlatformExtendedMeta> = {
  INSTAGRAM: {
    color: 'from-[#E1306C] via-[#FD1D1D] to-[#F56040]',
    category: 'Meta Ecosystem',
    rateLimit: '25 published posts / 24h rolling',
    apiDocsUrl: 'https://developers.facebook.com/docs/instagram-api',
    maxChars: 2200,
    maxVideoMins: 15,
  },
  FACEBOOK: {
    color: 'from-[#1877F2] to-[#0D65D9]',
    category: 'Meta Ecosystem',
    rateLimit: 'Standard Meta Graph API tiers',
    apiDocsUrl: 'https://developers.facebook.com/docs/pages-api',
    maxChars: 63206,
    maxVideoMins: 240,
  },
  TWITTER_X: {
    color: 'from-[#14171A] to-[#000000]',
    category: 'Professional & B2B',
    rateLimit: 'Enforced by X Developer Tier',
    apiDocsUrl: 'https://developer.x.com/en/docs',
    maxChars: 280,
    maxVideoMins: 140,
  },
  LINKEDIN: {
    color: 'from-[#0A66C2] to-[#004182]',
    category: 'Professional & B2B',
    rateLimit: '100 posts / 24h per organization',
    apiDocsUrl: 'https://learn.microsoft.com/en-us/linkedin/consumer/integrations/self-serve/share-on-linkedin',
    maxChars: 3000,
    maxVideoMins: 10,
  },
  PINTEREST: {
    color: 'from-[#E60023] to-[#AD081B]',
    category: 'Visual & Discovery',
    rateLimit: '1,000 API calls / 1h rolling',
    apiDocsUrl: 'https://developers.pinterest.com/docs/api/v5/',
    maxChars: 500,
  },
  YOUTUBE: {
    color: 'from-[#FF0000] to-[#C40000]',
    category: 'Video & Short-Form',
    rateLimit: '10,000 daily Google Cloud quota units',
    apiDocsUrl: 'https://developers.google.com/youtube/v3',
    maxChars: 5000,
    maxVideoMins: 720,
  },
  TIKTOK: {
    color: 'from-[#000000] via-[#25F4EE] to-[#FE2C55]',
    category: 'Video & Short-Form',
    rateLimit: 'TikTok Content Posting API quotas',
    apiDocsUrl: 'https://developers.tiktok.com/doc/content-posting-api-overview',
    maxChars: 4000,
    maxVideoMins: 10,
  },
  THREADS: {
    color: 'from-[#000000] to-[#1F1F1F]',
    category: 'Meta Ecosystem',
    rateLimit: '250 posts / 24h per profile',
    apiDocsUrl: 'https://developers.facebook.com/docs/threads',
    maxChars: 500,
    maxVideoMins: 5,
  },
};

export function PlatformsClientView() {
  const [selectedCategory, setSelectedCategory] = useState<PlatformFilterCategory>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'cards' | 'matrix'>('cards');

  const categories: PlatformFilterCategory[] = [
    'All',
    'Meta Ecosystem',
    'Video & Short-Form',
    'Professional & B2B',
    'Visual & Discovery',
  ];

  const filteredSpecs = useMemo(() => {
    return PLATFORM_SPECS.filter((spec) => {
      const extra = PLATFORM_EXTRA_INFO[spec.key];
      const matchesCategory =
        selectedCategory === 'All' ||
        extra.category === selectedCategory ||
        (selectedCategory === 'Video & Short-Form' &&
          (spec.key === 'YOUTUBE' || spec.key === 'TIKTOK' || spec.key === 'INSTAGRAM')) ||
        (selectedCategory === 'Visual & Discovery' &&
          (spec.key === 'PINTEREST' || spec.key === 'INSTAGRAM'));

      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        spec.name.toLowerCase().includes(q) ||
        spec.accountTypes.toLowerCase().includes(q) ||
        spec.publishingCapabilities.some((c) => c.toLowerCase().includes(q)) ||
        spec.mediaRequirements.toLowerCase().includes(q) ||
        spec.analyticsAvailable.toLowerCase().includes(q) ||
        spec.apiLimitations.toLowerCase().includes(q);

      return matchesCategory && matchesSearch;
    });
  }, [selectedCategory, searchQuery]);

  return (
    <div className="relative overflow-hidden">
      {/* Background Ambient Glows */}
      <div className="absolute top-10 left-1/4 w-[600px] h-[600px] bg-[#7138F5]/10 rounded-full blur-[150px] pointer-events-none" />
      <div className="absolute top-1/2 right-10 w-[500px] h-[500px] bg-[#20C8E8]/10 rounded-full blur-[140px] pointer-events-none" />

      {/* Cybernetic Dot Matrix */}
      <div
        className="absolute inset-0 opacity-[0.025] dark:opacity-[0.05] pointer-events-none"
        style={{
          backgroundImage:
            'radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)',
          backgroundSize: '24px 24px',
        }}
      />

      <main className="relative z-10 py-16 sm:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Hero Header */}
          <div className="text-center max-w-4xl mx-auto mb-16 sm:mb-20 space-y-6">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest bg-gradient-to-r from-[#7138F5]/10 via-[#2878FF]/10 to-[#20C8E8]/10 text-[#7138F5] dark:text-[#C4A5FF] border border-[#7138F5]/25 shadow-sm">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
              <span>Official OAuth 2.0 Partner Integrations</span>
            </div>

            <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-slate-900 dark:text-white leading-[1.12]">
              Transparent Capabilities for{' '}
              <span className="bg-gradient-to-r from-[#7138F5] via-[#2878FF] to-[#20C8E8] bg-clip-text text-transparent">
                Every Major Social Network
              </span>
            </h1>

            <p className="text-base sm:text-xl text-slate-600 dark:text-slate-300 max-w-3xl mx-auto leading-relaxed">
              OmniSocial AI integrates strictly with official platform APIs. We never use fragile
              scrapers or unauthorized headless automations. Review supported account types,
              publishing capabilities, media rules, and honest API limitations below.
            </p>

            {/* Live Security & Telemetry Strip */}
            <div className="pt-4 flex flex-wrap items-center justify-center gap-4 sm:gap-8">
              <div className="flex items-center gap-2 text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>8 / 8 APIs Verified Operational</span>
              </div>
              <div className="flex items-center gap-2 text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300">
                <Lock className="w-4 h-4 text-[#7138F5]" />
                <span>AES-256-GCM Token Encryption</span>
              </div>
              <div className="flex items-center gap-2 text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300">
                <FileCheck className="w-4 h-4 text-[#20C8E8]" />
                <span>100% Terms of Service Compliant</span>
              </div>
            </div>
          </div>

          {/* Interactive Controls Bar: Category Pills + Search + View Mode Switcher */}
          <div className="mb-12 space-y-5">
            <div className="flex flex-col lg:flex-row items-center justify-between gap-4 p-3 rounded-2xl bg-white/90 dark:bg-[#0D122B]/90 border border-slate-200 dark:border-white/10 shadow-soft backdrop-blur-md">
              {/* Category Pills */}
              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-1.5 w-full lg:w-auto">
                {categories.map((cat) => {
                  const isSelected = selectedCategory === cat;
                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setSelectedCategory(cat)}
                      className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                        isSelected
                          ? 'bg-gradient-to-r from-[#7138F5] to-[#2878FF] text-white shadow-md shadow-[#7138F5]/30'
                          : 'bg-slate-100/80 dark:bg-white/5 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/80 dark:hover:bg-white/10'
                      }`}
                    >
                      {cat}
                    </button>
                  );
                })}
              </div>

              {/* Search & View Mode Switcher */}
              <div className="flex items-center gap-3 w-full lg:w-auto">
                <div className="relative flex-1 lg:w-64">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search networks..."
                    className="w-full pl-10 pr-4 py-2 rounded-xl text-xs sm:text-sm bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-[#7138F5] focus:ring-1 focus:ring-[#7138F5] transition-all"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                    >
                      Clear
                    </button>
                  )}
                </div>

                {/* View Mode Toggle: Cards vs Comparison Matrix */}
                <div className="flex items-center p-1 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 shrink-0">
                  <button
                    type="button"
                    onClick={() => setViewMode('cards')}
                    title="Grid Card View"
                    className={`p-1.5 rounded-lg transition-all ${
                      viewMode === 'cards'
                        ? 'bg-white dark:bg-[#7138F5] text-slate-900 dark:text-white shadow-sm'
                        : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                    }`}
                  >
                    <LayoutGrid className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode('matrix')}
                    title="Comparison Matrix View"
                    className={`p-1.5 rounded-lg transition-all ${
                      viewMode === 'matrix'
                        ? 'bg-white dark:bg-[#7138F5] text-slate-900 dark:text-white shadow-sm'
                        : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                    }`}
                  >
                    <TableIcon className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Results Counter if filtering */}
            {(selectedCategory !== 'All' || searchQuery) && (
              <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 px-2">
                <span>
                  Showing <strong>{filteredSpecs.length}</strong> of {PLATFORM_SPECS.length} social
                  platforms
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedCategory('All');
                    setSearchQuery('');
                  }}
                  className="text-[#7138F5] dark:text-[#C4A5FF] hover:underline font-semibold"
                >
                  Reset filters
                </button>
              </div>
            )}
          </div>

          {/* VIEW MODE 1: High-Fidelity Cards Grid */}
          {viewMode === 'cards' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {filteredSpecs.map((spec) => {
                const extra = PLATFORM_EXTRA_INFO[spec.key];
                const isHovered = hoveredCard === spec.key;

                return (
                  <article
                    key={spec.key}
                    onMouseEnter={() => setHoveredCard(spec.key)}
                    onMouseLeave={() => setHoveredCard(null)}
                    className={`relative rounded-3xl p-6 sm:p-8 backdrop-blur-xl border transition-all duration-300 ease-out flex flex-col justify-between overflow-hidden group ${
                      isHovered
                        ? 'border-[#7138F5] dark:border-[#7138F5] shadow-[0_25px_50px_-15px_rgba(113,56,245,0.35)] -translate-y-1.5 bg-white dark:bg-[#0E132B]'
                        : 'border-slate-200 dark:border-[#1E2749] shadow-soft dark:shadow-none bg-white/80 dark:bg-[#0B0F24]/80'
                    }`}
                  >
                    {/* Specular Top Rim Gradient on Hover */}
                    {isHovered && (
                      <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-[#7138F5] via-[#20C8E8] to-transparent" />
                    )}

                    <div className="space-y-6">
                      {/* Top Row: Badge, Name, Status, and Rate Limit */}
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-center gap-4">
                          <div className="p-2.5 rounded-2xl bg-slate-100/80 dark:bg-white/5 border border-slate-200/80 dark:border-white/10 group-hover:scale-105 transition-transform shrink-0">
                            <PlatformBadge platform={spec.key} variant="icon" size="lg" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                                {spec.name}
                              </h2>
                              <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1 animate-pulse" />
                                Official API
                              </span>
                            </div>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium leading-relaxed">
                              {spec.accountTypes}
                            </p>
                          </div>
                        </div>

                        <div className="hidden sm:flex flex-col items-end">
                          <span className="text-[10px] font-mono uppercase text-slate-400 font-bold">
                            Rate Limit Window
                          </span>
                          <span className="text-[11px] font-mono font-bold text-slate-700 dark:text-slate-300">
                            {extra.rateLimit}
                          </span>
                        </div>
                      </div>

                      {/* Capabilities Checklist */}
                      <div>
                        <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-900 dark:text-slate-200 mb-3 flex items-center gap-2">
                          <Zap className="w-3.5 h-3.5 text-[#7138F5] dark:text-[#20C8E8]" />
                          <span>Publishing &amp; Dispatch Capabilities</span>
                        </h3>
                        <ul className="grid grid-cols-1 gap-2">
                          {spec.publishingCapabilities.map((cap) => (
                            <li
                              key={cap}
                              className="flex items-start gap-2.5 text-xs sm:text-sm text-slate-600 dark:text-slate-300"
                            >
                              <CheckCircle2 className="w-4 h-4 text-emerald-500 dark:text-emerald-400 shrink-0 mt-0.5" />
                              <span className="leading-relaxed">{cap}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Media & Connection Requirements Dual Grid */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                        <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200/80 dark:border-white/10 space-y-1">
                          <span className="font-bold text-slate-900 dark:text-white uppercase tracking-wider text-[10px]">
                            Media Requirements
                          </span>
                          <p className="text-slate-600 dark:text-slate-400 leading-relaxed text-xs">
                            {spec.mediaRequirements}
                          </p>
                        </div>
                        <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200/80 dark:border-white/10 space-y-1">
                          <span className="font-bold text-slate-900 dark:text-white uppercase tracking-wider text-[10px]">
                            Connection OAuth Scopes
                          </span>
                          <p className="text-slate-600 dark:text-slate-400 leading-relaxed text-xs">
                            {spec.connectionRequirements}
                          </p>
                        </div>
                      </div>

                      {/* Analytics Telemetry Scope */}
                      <div className="p-3 rounded-2xl bg-[#7138F5]/5 dark:bg-[#7138F5]/10 border border-[#7138F5]/15 flex items-start gap-2.5 text-xs">
                        <Radio className="w-4 h-4 text-[#7138F5] dark:text-[#C4A5FF] shrink-0 mt-0.5" />
                        <div>
                          <strong className="text-slate-900 dark:text-white">
                            Analytics Available:
                          </strong>{' '}
                          <span className="text-slate-600 dark:text-slate-300 leading-relaxed">
                            {spec.analyticsAvailable}
                          </span>
                        </div>
                      </div>

                      {/* Official API Limitation Banner (Honest Transparency) */}
                      <div className="p-3.5 rounded-2xl bg-amber-50/80 dark:bg-amber-500/10 border border-amber-200/80 dark:border-amber-500/25 flex items-start gap-2.5 text-xs text-amber-900 dark:text-amber-200">
                        <Info className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                        <div>
                          <span className="font-bold">Official API Limitation: </span>
                          <span className="leading-relaxed">{spec.apiLimitations}</span>
                        </div>
                      </div>
                    </div>

                    {/* Bottom Strip: Official Documentation Link + Connect CTA */}
                    <div className="mt-6 pt-4 border-t border-slate-100 dark:border-white/10 flex items-center justify-between gap-4">
                      <a
                        href={extra.apiDocsUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
                      >
                        <span>Official API Docs</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>

                      <Link
                        href={ROUTES.SIGNUP}
                        className="inline-flex items-center gap-1.5 text-xs font-bold text-[#7138F5] dark:text-[#C4A5FF] group-hover:translate-x-1 transition-all"
                      >
                        <span>Connect in Workspace</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </article>
                );
              })}
            </div>
          )}

          {/* VIEW MODE 2: Side-by-Side Comparison Matrix */}
          {viewMode === 'matrix' && (
            <div className="rounded-3xl border border-slate-200 dark:border-white/10 bg-white/90 dark:bg-[#0D122B]/90 overflow-hidden shadow-soft backdrop-blur-md">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs sm:text-sm">
                  <thead className="bg-slate-50 dark:bg-white/5 border-b border-slate-200 dark:border-white/10 text-slate-900 dark:text-white font-bold uppercase tracking-wider text-[10px] sm:text-xs">
                    <tr>
                      <th className="p-4 sm:p-5">Platform</th>
                      <th className="p-4 sm:p-5">Account Scope</th>
                      <th className="p-4 sm:p-5">Char Cap</th>
                      <th className="p-4 sm:p-5">Media Supported</th>
                      <th className="p-4 sm:p-5">OAuth Protocol</th>
                      <th className="p-4 sm:p-5">Analytics Scope</th>
                      <th className="p-4 sm:p-5 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                    {filteredSpecs.map((spec) => {
                      const extra = PLATFORM_EXTRA_INFO[spec.key];
                      return (
                        <tr
                          key={spec.key}
                          className="hover:bg-slate-50/80 dark:hover:bg-white/[0.02] transition-colors"
                        >
                          <td className="p-4 sm:p-5 font-bold text-slate-900 dark:text-white flex items-center gap-3">
                            <PlatformBadge platform={spec.key} variant="icon" size="sm" />
                            <span>{spec.name}</span>
                          </td>
                          <td className="p-4 sm:p-5 text-slate-600 dark:text-slate-300 max-w-[200px] truncate">
                            {spec.accountTypes}
                          </td>
                          <td className="p-4 sm:p-5 font-mono text-slate-700 dark:text-slate-300">
                            {extra.maxChars ? `${extra.maxChars.toLocaleString()} chars` : 'Variable'}
                          </td>
                          <td className="p-4 sm:p-5 text-slate-600 dark:text-slate-300 max-w-[200px] truncate">
                            {spec.mediaRequirements}
                          </td>
                          <td className="p-4 sm:p-5 font-mono text-[11px] text-emerald-600 dark:text-emerald-400">
                            OAuth 2.0 PKCE
                          </td>
                          <td className="p-4 sm:p-5 text-slate-600 dark:text-slate-300 max-w-[200px] truncate">
                            {spec.analyticsAvailable}
                          </td>
                          <td className="p-4 sm:p-5 text-right">
                            <Link
                              href={ROUTES.SIGNUP}
                              className="inline-flex items-center gap-1 text-xs font-bold text-[#7138F5] dark:text-[#C4A5FF] hover:underline"
                            >
                              <span>Connect</span>
                              <ArrowRight className="w-3 h-3" />
                            </Link>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* If No Results Found */}
          {filteredSpecs.length === 0 && (
            <div className="text-center py-16 p-8 rounded-3xl bg-white dark:bg-[#0D122B] border border-slate-200 dark:border-white/10">
              <Search className="w-10 h-10 text-slate-400 mx-auto mb-3" />
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                No matching social networks found
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                Try searching for &quot;Instagram&quot;, &quot;OAuth&quot;, &quot;Reels&quot;, or &quot;Video&quot;.
              </p>
              <button
                type="button"
                onClick={() => {
                  setSelectedCategory('All');
                  setSearchQuery('');
                }}
                className="mt-4 px-4 py-2 rounded-xl text-xs font-bold btn-gradient"
              >
                Clear Search
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
