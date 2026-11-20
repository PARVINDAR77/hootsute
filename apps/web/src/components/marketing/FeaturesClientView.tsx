'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Share2,
  Sparkles,
  Image as ImageIcon,
  Calendar,
  Send,
  Layers,
  Inbox,
  BarChart3,
  Lightbulb,
  Users,
  CheckSquare,
  FolderOpen,
  Palette,
  ArrowRight,
  Clock,
  Search,
  CheckCircle2,
  ShieldCheck,
  Zap,
  Filter,
  SlidersHorizontal,
  ChevronRight,
  ExternalLink,
  Lock,
  Globe,
  Radio,
  BarChart2,
  Workflow,
  Sparkle,
} from 'lucide-react';
import { ROUTES } from '@/lib/constants';
import { ORDERED_PLATFORMS, PlatformBadge } from '@/components/ui/PlatformBadge';

type FeatureCategory =
  | 'All'
  | 'AI & Content Engine'
  | 'Publishing & Automation'
  | 'Collaboration & Security'
  | 'Inbox & Intelligence';

interface FeatureItem {
  id: string;
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  category: FeatureCategory;
  badge: string;
  badgeType: 'emerald' | 'purple' | 'cyan' | 'amber';
  shortDesc: string;
  longDesc: string;
  highlights: string[];
  telemetry: {
    label: string;
    value: string;
  };
  supportedOn: string;
}

const ALL_FEATURES: FeatureItem[] = [
  {
    id: 'social-account-hub',
    icon: Share2,
    title: 'Social Account Management',
    category: 'Publishing & Automation',
    badge: 'Official OAuth 2.0',
    badgeType: 'emerald',
    shortDesc: 'Connect and manage all 8 networks via official enterprise OAuth with AES-256 encryption.',
    longDesc:
      'Seamlessly authenticate Instagram, Facebook, X (Twitter), LinkedIn, Pinterest, YouTube, TikTok, and Threads. Refresh tokens are AES-256-GCM encrypted at rest, and automated health sweeps notify you before credentials expire.',
    highlights: [
      'Official Meta, Google, X, LinkedIn & TikTok APIs',
      'Zero headless browser scrapers — 100% compliant',
      'AES-256-GCM encrypted token vault at rest',
      'Live connection health & auto-reconnect signals',
    ],
    telemetry: { label: 'Token Vault', value: 'AES-256-GCM' },
    supportedOn: 'All 8 Networks',
  },
  {
    id: 'ai-content-studio',
    icon: Sparkles,
    title: 'AI Content Studio',
    category: 'AI & Content Engine',
    badge: 'Gemini 1.5 Pro AI',
    badgeType: 'purple',
    shortDesc: 'Autonomous platform-calibrated social copy tailored to your Brand Kit and cultural moments.',
    longDesc:
      'Generate platform-specific post copy, hashtags, CTAs, and hooks calibrated to each social network character limit and tone. Includes occasion-aware generation from a verified catalog of 50+ global holidays and cultural events.',
    highlights: [
      'Multi-platform copy generator (280c X to 3,000c LinkedIn)',
      'Integrated cultural festival & seasonal occasion catalog',
      'Voice, tone, and audience persona calibration',
      'One-click multi-variant draft creation',
    ],
    telemetry: { label: 'AI Latency', value: '< 1.2s avg' },
    supportedOn: 'Instagram, X, LinkedIn, FB, Threads, Pinterest',
  },
  {
    id: 'ai-creative-briefs',
    icon: ImageIcon,
    title: 'AI Image Creative Briefs',
    category: 'AI & Content Engine',
    badge: 'Creative Engine',
    badgeType: 'cyan',
    shortDesc: 'Structured visual prompts, lighting guides, and art direction for graphic designers and AI generators.',
    longDesc:
      'Generate structured visual creative prompts, camera angles, color palettes, and composition notes tailored to your brand identity. Perfect for handing off to internal design teams or external image synthesis pipelines.',
    highlights: [
      'Detailed visual art direction & composition specs',
      'Optimal aspect ratio guidance (1:1, 4:5, 9:16, 16:9)',
      'Negative prompts & brand safe guardrails',
      'Direct handoff to Media Library workflows',
    ],
    telemetry: { label: 'Aspect Ratios', value: '4:5, 9:16, 1:1, 16:9' },
    supportedOn: 'Visual Networks (IG, Pinterest, YT, TikTok)',
  },
  {
    id: 'content-scheduling',
    icon: Clock,
    title: 'Precision Content Scheduling',
    category: 'Publishing & Automation',
    badge: 'Sub-Minute Precision',
    badgeType: 'emerald',
    shortDesc: 'Timezone-aware scheduling with immutable content snapshots and background queue workers.',
    longDesc:
      'Schedule approved drafts down to the minute in your brand timezone. Each scheduled post captures an immutable SHA-256 content snapshot to ensure the exact reviewed text and media are dispatched without post-approval tampering.',
    highlights: [
      'Workspace-specific timezone configuration',
      'Immutable SHA-256 content verification snapshots',
      'Automated background sweeper dispatch queue',
      'Instant failure detection & automatic retry policies',
    ],
    telemetry: { label: 'Queue Sweeper', value: '60s heartbeat' },
    supportedOn: 'All 8 Networks',
  },
  {
    id: 'bulk-publishing',
    icon: Send,
    title: 'Bulk Multi-Account Publishing',
    category: 'Publishing & Automation',
    badge: 'High-Velocity Dispatch',
    badgeType: 'emerald',
    shortDesc: 'Dispatch campaigns across multiple brand handles simultaneously or with staggered intervals.',
    longDesc:
      'Batch-approve campaigns and dispatch across dozens of accounts at once. Choose between Immediate burst publishing, synchronized Scheduled publishing, or anti-burst Staggered intervals (e.g. 5m delays) to avoid rate limits.',
    highlights: [
      'Immediate, Scheduled, and Staggered dispatch modes',
      'Simultaneous multi-network batch execution',
      'Automated UTM tracking link parameter injection',
      'Full per-target execution audit logs and retry buttons',
    ],
    telemetry: { label: 'Stagger Intervals', value: '1m - 60m' },
    supportedOn: 'All 8 Networks',
  },
  {
    id: 'workspace-isolation',
    icon: Layers,
    title: 'Multi-Tenant Workspace Isolation',
    category: 'Collaboration & Security',
    badge: 'Zero Data Leakage',
    badgeType: 'purple',
    shortDesc: 'Strict database tenant isolation for managing multiple brands, clients, and agencies.',
    longDesc:
      'Organize brands into strictly isolated workspaces. Every workspace holds its own social accounts, media files, team member roles, approval matrices, and billing plan limits with zero cross-tenant data leakage.',
    highlights: [
      'Tenant-scoped PostgreSQL queries & foreign keys',
      'Independent social accounts and token vaults per brand',
      'Switch between multiple workspaces in one click',
      'Custom branding and timezone settings per workspace',
    ],
    telemetry: { label: 'Isolation', value: 'Tenant-Scoped' },
    supportedOn: 'System-Wide',
  },
  {
    id: 'content-calendar',
    icon: Calendar,
    title: 'Interactive Visual Content Calendar',
    category: 'Publishing & Automation',
    badge: 'Real-Time Sync',
    badgeType: 'cyan',
    shortDesc: 'Drag-and-drop planning across Month, Week, Day, and Timeline schedule views.',
    longDesc:
      'Full editorial visibility over your social queue. Filter by network, status, campaign, or author. Drag posts across days to reschedule on the fly, identify coverage gaps, and inspect delivery attempts with full payload logs.',
    highlights: [
      'Month, Week, Day, and Timeline list calendar modes',
      'Drag-and-drop schedule adjustment with instant lock',
      'Filter by connected platform, campaign tag, or status',
      'Failed post inspection drawer with one-click re-try',
    ],
    telemetry: { label: 'Calendar Views', value: 'Month / Week / Day' },
    supportedOn: 'All 8 Networks',
  },
  {
    id: 'social-inbox',
    icon: Inbox,
    title: 'Unified Social Inbox & Moderation',
    category: 'Inbox & Intelligence',
    badge: 'Multi-Network Feed',
    badgeType: 'emerald',
    shortDesc: 'Centralized comment and direct message inbox with automated moderation and saved replies.',
    longDesc:
      'Stop hopping between social apps. Ingest comments and incoming interactions into a unified omnichannel stream. Assign conversations to team members, leave internal notes, filter spam via automated rules, and reply instantly with saved macros.',
    highlights: [
      'Consolidated comments and messages from all channels',
      'Team assignment, internal notes, and resolution tags',
      'Automated spam and profanity moderation filters',
      'Saved reply templates and quick-response shortcuts',
    ],
    telemetry: { label: 'Sync Latency', value: 'Live Webhooks' },
    supportedOn: 'Instagram, Facebook, X, LinkedIn, YouTube',
  },
  {
    id: 'analytics-reports',
    icon: BarChart3,
    title: 'Performance Analytics & Reports',
    category: 'Inbox & Intelligence',
    badge: 'Executive Telemetry',
    badgeType: 'cyan',
    shortDesc: 'Track reach, impressions, engagement rates, follower growth, and export white-labeled reports.',
    longDesc:
      'Gain deep visibility into what drives audience engagement. Compare channel performance side-by-side, view top-performing posts by viral lift score, and generate presentation-ready PDF reports with workspace custom branding.',
    highlights: [
      'Cross-platform aggregated reach & impression charts',
      'Post-level engagement rate, clicks, shares, and saves',
      'Follower trajectory & growth momentum analytics',
      'White-label executive report exporter for clients',
    ],
    telemetry: { label: 'Metrics Depth', value: 'Real-Time API' },
    supportedOn: 'All 8 Networks',
  },
  {
    id: 'growth-insights',
    icon: Lightbulb,
    title: 'AI Growth Insights & Viral Lift',
    category: 'Inbox & Intelligence',
    badge: 'Actionable Signals',
    badgeType: 'purple',
    shortDesc: 'Automated posting-time recommendations and content-type performance signals.',
    longDesc:
      'OmniSocial algorithms analyze your historical engagement patterns to recommend optimal posting hours for each specific audience. Identifies high-performing hooks and warns against hashtags experiencing algorithmic saturation.',
    highlights: [
      'Audience heatmaps for optimal publishing windows',
      'Content format recommendations (Carousel vs Video vs Text)',
      'Algorithmic fatigue & hashtag saturation alerts',
      'One-click application of timing recommendations',
    ],
    telemetry: { label: 'Recommendation', value: 'Workspace-Tuned' },
    supportedOn: 'Instagram, LinkedIn, X, TikTok, YouTube',
  },
  {
    id: 'team-collaboration',
    icon: Users,
    title: 'Team Collaboration & Granular RBAC',
    category: 'Collaboration & Security',
    badge: 'Role-Based Access',
    badgeType: 'purple',
    shortDesc: 'Invite teammates with Owner, Admin, Editor, and Viewer roles with full audit logs.',
    longDesc:
      'Empower social media managers, copywriters, and clients to collaborate safely. Enforce principle of least privilege with strictly segregated roles. Keep copy discussions on the post with inline commentary and complete revision history.',
    highlights: [
      '4 Pre-configured RBAC roles: Owner, Admin, Editor, Viewer',
      'Draft commentary with threaded teammate replies',
      'Immutable activity audit logs of all actions',
      'Secure email invitations with auto-expiry tokens',
    ],
    telemetry: { label: 'RBAC Roles', value: 'Owner/Admin/Editor/Viewer' },
    supportedOn: 'System-Wide',
  },
  {
    id: 'approval-workflows',
    icon: CheckSquare,
    title: 'Multi-Stage Approval Matrix',
    category: 'Collaboration & Security',
    badge: 'Zero-Risk Publishing',
    badgeType: 'emerald',
    shortDesc: 'Enforce multi-level sign-offs before any draft can be scheduled or dispatched.',
    longDesc:
      'Eliminate rogue posts and brand reputation errors. Configure mandatory approval chains where drafts authored by junior editors or AI generators must be explicitly reviewed, commented on, and approved by assigned workspace Admins before release.',
    highlights: [
      'Multi-tier review gates (Draft → In Review → Approved → Scheduled)',
      'Rejection notes with revision change requests',
      'Batch-approval drawer for rapid campaign reviews',
      'Strict bypass prevention: unsanctioned posts cannot publish',
    ],
    telemetry: { label: 'Review Gates', value: 'Up to 3 Tiers' },
    supportedOn: 'All 8 Networks',
  },
  {
    id: 'media-library',
    icon: FolderOpen,
    title: 'Media Library & Cloud Storage',
    category: 'Collaboration & Security',
    badge: 'Fast Asset Picker',
    badgeType: 'cyan',
    shortDesc: 'Centralized brand asset repository with quota tracking, metadata tagging, and inline pickers.',
    longDesc:
      'Store brand imagery, video assets, and b-roll in a shared repository accessible directly inside the Content Studio. Features instant format validation, aspect-ratio preview, tagging, and automatic workspace quota enforcement.',
    highlights: [
      'Drag-and-drop multi-file upload with progress bars',
      'Aspect ratio detection & auto-validation for each network',
      'Tagging, search, and asset categorization',
      'Enforced quota tracking based on your workspace plan',
    ],
    telemetry: { label: 'Storage Caps', value: '5 GB to 500 GB' },
    supportedOn: 'JPEG, PNG, MP4, MOV, GIF',
  },
  {
    id: 'brand-kit',
    icon: Palette,
    title: 'Brand Kit & Voice Identity',
    category: 'AI & Content Engine',
    badge: 'Deterministic Guardrails',
    badgeType: 'purple',
    shortDesc: 'Calibrate tone, audience personas, restricted terms, and color identity across every AI post.',
    longDesc:
      'Teach the AI engine how your brand talks. Configure your mission statement, primary tone (Authoritative, Playful, Witty, Professional), target demographic personas, signature hashtags, and negative keyword lists that AI must never mention.',
    highlights: [
      'Tone of voice sliders and personality attributes',
      'Target audience persona profiles & demographics',
      'Restricted word & banned topic safety guardrails',
      'Default hashtag collections with auto-injection rules',
    ],
    telemetry: { label: 'Voice Tuning', value: 'Brand-Calibrated' },
    supportedOn: 'AI Content Studio & Briefs',
  },
];

export function FeaturesClientView() {
  const [selectedCategory, setSelectedCategory] = useState<FeatureCategory>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [hoveredFeature, setHoveredFeature] = useState<string | null>(null);

  const categories: FeatureCategory[] = [
    'All',
    'AI & Content Engine',
    'Publishing & Automation',
    'Collaboration & Security',
    'Inbox & Intelligence',
  ];

  const filteredFeatures = useMemo(() => {
    return ALL_FEATURES.filter((feature) => {
      const matchesCategory =
        selectedCategory === 'All' || feature.category === selectedCategory;
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        feature.title.toLowerCase().includes(q) ||
        feature.shortDesc.toLowerCase().includes(q) ||
        feature.longDesc.toLowerCase().includes(q) ||
        feature.highlights.some((h) => h.toLowerCase().includes(q));

      return matchesCategory && matchesSearch;
    });
  }, [selectedCategory, searchQuery]);

  return (
    <div className="relative overflow-hidden">
      {/* Background Ambient Glows */}
      <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-[#7138F5]/10 rounded-full blur-[150px] pointer-events-none" />
      <div className="absolute top-1/3 right-10 w-[500px] h-[500px] bg-[#20C8E8]/10 rounded-full blur-[140px] pointer-events-none" />

      {/* Cybernetic Dot Matrix Pattern */}
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
          {/* Hero Section */}
          <div className="text-center max-w-4xl mx-auto mb-16 sm:mb-20 space-y-6">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest bg-gradient-to-r from-[#7138F5]/10 via-[#2878FF]/10 to-[#20C8E8]/10 text-[#7138F5] dark:text-[#C4A5FF] border border-[#7138F5]/25 shadow-sm">
              <Zap className="w-3.5 h-3.5 text-amber-500 fill-current" />
              <span>Comprehensive Platform Architecture</span>
            </div>

            <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-slate-900 dark:text-white leading-[1.12]">
              14 Production-Grade Modules for{' '}
              <span className="bg-gradient-to-r from-[#7138F5] via-[#2878FF] to-[#20C8E8] bg-clip-text text-transparent">
                Autonomous Social Operations
              </span>
            </h1>

            <p className="text-base sm:text-xl text-slate-600 dark:text-slate-300 max-w-3xl mx-auto leading-relaxed">
              Every single capability below is powered by real PostgreSQL models, NestJS services,
              and official OAuth 2.0 APIs. No mock promises, no headless scrapers.
            </p>

            {/* Quick Metrics & Official Integration Bar */}
            <div className="pt-4 flex flex-wrap items-center justify-center gap-4 sm:gap-8">
              <div className="flex items-center gap-2 text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300">
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                <span>100% Multi-Tenant Isolated</span>
              </div>
              <div className="flex items-center gap-2 text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300">
                <Globe className="w-4 h-4 text-[#20C8E8]" />
                <span>8 Official Social Networks</span>
              </div>
              <div className="flex items-center gap-2 text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300">
                <Sparkles className="w-4 h-4 text-[#7138F5]" />
                <span>Gemini AI Content Engine</span>
              </div>
              <div className="flex items-center gap-2 text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300">
                <Lock className="w-4 h-4 text-purple-400" />
                <span>AES-256-GCM Vault</span>
              </div>
            </div>

            {/* Supported Networks Live Ribbon */}
            <div className="pt-6">
              <div className="p-3.5 sm:p-4 rounded-2xl bg-white/80 dark:bg-[#0D122B]/80 border border-slate-200/80 dark:border-white/10 shadow-soft backdrop-blur-md inline-flex flex-wrap items-center justify-center gap-2.5 sm:gap-4">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Supported Networks:
                </span>
                <div className="flex flex-wrap items-center gap-1.5">
                  {ORDERED_PLATFORMS.map((platform) => (
                    <PlatformBadge key={platform} platform={platform} variant="badge" size="sm" />
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Interactive Controls Bar: Category Pills + Search */}
          <div className="mb-12 space-y-5">
            <div className="flex flex-col lg:flex-row items-center justify-between gap-4 p-3 rounded-2xl bg-white/90 dark:bg-[#0D122B]/90 border border-slate-200 dark:border-white/10 shadow-soft backdrop-blur-md">
              {/* Category Pills */}
              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-1.5 w-full lg:w-auto">
                {categories.map((cat) => {
                  const isSelected = selectedCategory === cat;
                  const count =
                    cat === 'All'
                      ? ALL_FEATURES.length
                      : ALL_FEATURES.filter((f) => f.category === cat).length;

                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setSelectedCategory(cat)}
                      className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 ${
                        isSelected
                          ? 'bg-gradient-to-r from-[#7138F5] to-[#2878FF] text-white shadow-md shadow-[#7138F5]/30'
                          : 'bg-slate-100/80 dark:bg-white/5 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/80 dark:hover:bg-white/10'
                      }`}
                    >
                      <span>{cat}</span>
                      <span
                        className={`text-[10px] font-mono px-1.5 py-0.5 rounded-full ${
                          isSelected
                            ? 'bg-white/20 text-white'
                            : 'bg-slate-200 dark:bg-white/10 text-slate-500 dark:text-slate-400'
                        }`}
                      >
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Instant Search Bar */}
              <div className="relative w-full lg:w-72">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search capabilities..."
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
            </div>

            {/* Results Counter if filtering */}
            {(selectedCategory !== 'All' || searchQuery) && (
              <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 px-2">
                <span>
                  Showing <strong>{filteredFeatures.length}</strong> of {ALL_FEATURES.length}{' '}
                  features
                </span>
                {(selectedCategory !== 'All' || searchQuery) && (
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedCategory('All');
                      setSearchQuery('');
                    }}
                    className="text-[#7138F5] dark:text-[#C4A5FF] hover:underline font-semibold"
                  >
                    Reset all filters
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Features Grid with High-Fidelity Interactive Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6 sm:gap-8">
            {filteredFeatures.map((feature, idx) => {
              const Icon = feature.icon;
              const isHovered = hoveredFeature === feature.id;

              return (
                <article
                  key={feature.id}
                  onMouseEnter={() => setHoveredFeature(feature.id)}
                  onMouseLeave={() => setHoveredFeature(null)}
                  className={`relative rounded-3xl p-6 sm:p-8 backdrop-blur-xl border transition-all duration-300 ease-out flex flex-col justify-between group overflow-hidden ${
                    isHovered
                      ? 'border-[#7138F5] dark:border-[#7138F5] shadow-[0_20px_45px_-12px_rgba(113,56,245,0.3)] -translate-y-1 bg-white dark:bg-[#0E132B]'
                      : 'border-slate-200 dark:border-[#1E2749] shadow-soft dark:shadow-none bg-white/80 dark:bg-[#0B0F24]/80'
                  }`}
                >
                  {/* Specular Top Rim Gradient on Hover */}
                  {isHovered && (
                    <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-[#7138F5] via-[#20C8E8] to-transparent" />
                  )}

                  <div>
                    {/* Header Row: Icon + Badges */}
                    <div className="flex items-start justify-between gap-4 mb-5">
                      <div
                        className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all shrink-0 ${
                          isHovered
                            ? 'bg-gradient-to-br from-[#7138F5] to-[#2878FF] text-white shadow-md shadow-[#7138F5]/30 scale-105'
                            : 'bg-[#F1EBFF] dark:bg-[#7138F5]/20 text-[#7138F5] dark:text-[#C4A5FF]'
                        }`}
                      >
                        <Icon className="w-6 h-6" />
                      </div>

                      <div className="flex items-center gap-2 flex-wrap justify-end">
                        <span className="text-[10px] font-mono uppercase font-bold tracking-wider px-2 py-0.5 rounded-md bg-slate-100 dark:bg-white/5 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-white/10">
                          {feature.category}
                        </span>

                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border flex items-center gap-1.5 ${
                            feature.badgeType === 'emerald'
                              ? 'bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-500/30'
                              : feature.badgeType === 'purple'
                              ? 'bg-[#F1EBFF] dark:bg-[#7138F5]/15 text-[#7138F5] dark:text-[#C4A5FF] border-[#7138F5]/25'
                              : feature.badgeType === 'cyan'
                              ? 'bg-cyan-50 dark:bg-[#20C8E8]/15 text-cyan-700 dark:text-[#20C8E8] border-cyan-200 dark:border-[#20C8E8]/30'
                              : 'bg-amber-50 dark:bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-500/30'
                          }`}
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
                          <span>{feature.badge}</span>
                        </span>
                      </div>
                    </div>

                    {/* Title & Core Description */}
                    <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight group-hover:text-[#7138F5] dark:group-hover:text-[#C4A5FF] transition-colors">
                      {feature.title}
                    </h2>

                    <p className="mt-2.5 text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed font-normal">
                      {feature.longDesc}
                    </p>

                    {/* Key Capabilities Checklist */}
                    <div className="mt-5 pt-4 border-t border-slate-100 dark:border-white/5 space-y-2">
                      <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                        Technical Capabilities
                      </span>
                      <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-600 dark:text-slate-300">
                        {feature.highlights.map((item) => (
                          <li key={item} className="flex items-start gap-2">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400 shrink-0 mt-0.5" />
                            <span className="leading-tight">{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Footer Strip: Micro-Telemetry + Try Link */}
                  <div className="mt-6 pt-4 border-t border-slate-100 dark:border-white/10 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono uppercase text-slate-400 dark:text-slate-500 font-bold">
                        {feature.telemetry.label}:
                      </span>
                      <span className="text-xs font-mono font-bold text-slate-800 dark:text-slate-200 px-2 py-0.5 rounded bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10">
                        {feature.telemetry.value}
                      </span>
                    </div>

                    <Link
                      href={ROUTES.SIGNUP}
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-[#7138F5] dark:text-[#C4A5FF] group-hover:translate-x-1 transition-all"
                    >
                      <span>Try in Workspace</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>

          {/* If No Results Found */}
          {filteredFeatures.length === 0 && (
            <div className="text-center py-16 p-8 rounded-3xl bg-white dark:bg-[#0D122B] border border-slate-200 dark:border-white/10">
              <Search className="w-10 h-10 text-slate-400 mx-auto mb-3" />
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                No matching features found
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                Try searching for &quot;OAuth&quot;, &quot;Gemini&quot;, &quot;Approval&quot;, or &quot;Calendar&quot;.
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
