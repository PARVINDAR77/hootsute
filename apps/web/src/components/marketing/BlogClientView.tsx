'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  BookOpen,
  Clock,
  ArrowRight,
  Search,
  Calendar,
  Sparkles,
  Tag,
  Mail,
  CheckCircle2,
  Share2,
  TrendingUp,
  Bookmark,
  ShieldCheck,
  Check,
  Layers,
} from 'lucide-react';
import { BLOG_ARTICLES, BlogArticle } from '@/components/marketing/public-content';

export function BlogClientView() {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [newsletterEmail, setNewsletterEmail] = useState<string>('');
  const [newsletterSubscribed, setNewsletterSubscribed] = useState(false);

  const categories = useMemo(() => {
    const set = new Set<string>();
    BLOG_ARTICLES.forEach((a) => set.add(a.category));
    return ['All', ...Array.from(set)];
  }, []);

  const filteredArticles = useMemo(() => {
    return BLOG_ARTICLES.filter((article) => {
      const matchesCategory =
        selectedCategory === 'All' || article.category === selectedCategory;
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        article.title.toLowerCase().includes(q) ||
        article.excerpt.toLowerCase().includes(q) ||
        article.sections.some(
          (s) => s.heading.toLowerCase().includes(q) || s.body.toLowerCase().includes(q),
        );

      return matchesCategory && matchesSearch;
    });
  }, [selectedCategory, searchQuery]);

  const featuredArticle = filteredArticles[0] || BLOG_ARTICLES[0];
  const regularArticles =
    selectedCategory === 'All' && !searchQuery
      ? filteredArticles.slice(1)
      : filteredArticles;

  const handleNewsletterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newsletterEmail.includes('@')) {
      setNewsletterSubscribed(true);
      setNewsletterEmail('');
    }
  };

  return (
    <div className="relative overflow-hidden">
      {/* Background Ambient Glows */}
      <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-[#7138F5]/10 rounded-full blur-[160px] pointer-events-none" />
      <div className="absolute top-1/2 right-10 w-[500px] h-[500px] bg-[#20C8E8]/10 rounded-full blur-[150px] pointer-events-none" />

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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16 sm:space-y-20">
          {/* Hero Section */}
          <div className="text-center max-w-4xl mx-auto space-y-5">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest bg-gradient-to-r from-[#7138F5]/10 via-[#2878FF]/10 to-[#20C8E8]/10 text-[#7138F5] dark:text-[#C4A5FF] border border-[#7138F5]/25 shadow-sm">
              <BookOpen className="w-3.5 h-3.5 text-[#7138F5]" />
              <span>Engineering &amp; Strategy Playbooks</span>
            </div>

            <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-slate-900 dark:text-white leading-[1.12]">
              Architectural Insights for{' '}
              <span className="bg-gradient-to-r from-[#7138F5] via-[#2878FF] to-[#20C8E8] bg-clip-text text-transparent">
                Modern Social Operations
              </span>
            </h1>

            <p className="text-base sm:text-xl text-slate-600 dark:text-slate-300 max-w-2xl mx-auto leading-relaxed">
              Technical playbooks, multi-platform publishing blueprints, Brand Kit prompt
              engineering, and agency governance strategies from the OmniSocial engineering team.
            </p>
          </div>

          {/* Featured Hero Article Banner (Shown when no active search/category filter) */}
          {selectedCategory === 'All' && !searchQuery && featuredArticle && (
            <Link
              href={`/blog/${featuredArticle.slug}`}
              className="group block relative rounded-3xl p-7 sm:p-10 lg:p-12 bg-white/95 dark:bg-[#0D122B]/95 backdrop-blur-2xl border border-slate-200 dark:border-[#1E2749] shadow-soft dark:shadow-none hover:border-[#7138F5] hover:shadow-[0_25px_65px_-15px_rgba(113,56,245,0.4)] hover:-translate-y-1 transition-all duration-300 overflow-hidden"
            >
              {/* Specular Top Rim Gradient on Hover */}
              <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-[#7138F5] via-[#20C8E8] to-transparent opacity-70 group-hover:opacity-100 transition-opacity" />

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
                {/* Left Column (7 cols): Metadata, Title, Excerpt, Highlights, Bottom Bar */}
                <div className="lg:col-span-7 space-y-5">
                  <div className="flex flex-wrap items-center gap-2.5 text-xs">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-[#7138F5]/15 to-[#2878FF]/15 text-[#7138F5] dark:text-[#C4A5FF] font-bold border border-[#7138F5]/30 shadow-sm">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Featured Blueprint</span>
                    </span>
                    <span className="px-2.5 py-1 rounded-full bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-slate-300 font-semibold border border-slate-200 dark:border-white/10">
                      {featuredArticle.category}
                    </span>
                    <span className="flex items-center gap-1 text-slate-500 dark:text-slate-400 font-medium">
                      <Clock className="w-3.5 h-3.5 text-[#20C8E8]" />
                      {featuredArticle.readTime}
                    </span>
                  </div>

                  <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 dark:text-white tracking-tight group-hover:text-[#7138F5] dark:group-hover:text-[#C4A5FF] transition-colors leading-[1.2]">
                    {featuredArticle.title}
                  </h2>

                  <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed font-normal">
                    {featuredArticle.excerpt}
                  </p>

                  {/* Architecture Capability Tags */}
                  <div className="pt-1 flex flex-wrap items-center gap-2 text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                    <span className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                      Brand Kit Voice Lock
                    </span>
                    <span className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                      Multi-Stage Approval Gates
                    </span>
                    <span className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                      Staggered Anti-Burst Dispatch
                    </span>
                  </div>

                  <div className="pt-4 flex flex-wrap items-center justify-between gap-4 border-t border-slate-100 dark:border-white/10 text-xs sm:text-sm font-bold">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#7138F5] to-[#2878FF] flex items-center justify-center text-white text-[11px] font-bold shadow-sm">
                        AR
                      </div>
                      <div>
                        <div className="text-slate-900 dark:text-white font-bold text-xs">
                          Alex Rivera
                        </div>
                        <div className="flex items-center gap-1.5 text-slate-400 text-[11px] font-normal">
                          <Calendar className="w-3 h-3 text-[#7138F5] dark:text-[#20C8E8]" />
                          <span>{featuredArticle.publishedDate}</span>
                        </div>
                      </div>
                    </div>

                    <span className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold bg-[#7138F5]/10 dark:bg-[#7138F5]/20 text-[#7138F5] dark:text-[#C4A5FF] border border-[#7138F5]/30 group-hover:bg-[#7138F5] group-hover:text-white group-hover:shadow-glow-purple transition-all duration-300">
                      <span>Read Full Blueprint</span>
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </span>
                  </div>
                </div>

                {/* Right Column (5 cols): 3D SaaS Featured Visual Frame */}
                <div className="lg:col-span-5 relative w-full">
                  <div className="relative rounded-2xl overflow-hidden border border-slate-200/90 dark:border-white/15 shadow-xl bg-slate-950 group-hover:border-[#7138F5]/60 transition-all duration-300">
                    {/* Ambient Glow behind image */}
                    <div className="absolute -inset-2 bg-gradient-to-r from-[#7138F5]/30 via-[#2878FF]/20 to-[#20C8E8]/30 rounded-3xl blur-2xl opacity-60 group-hover:opacity-100 transition-opacity" />

                    <div className="relative aspect-[16/10] sm:aspect-[16/11] lg:aspect-[4/3] w-full overflow-hidden rounded-2xl bg-[#070A18]">
                      <img
                        src="/images/blog-featured-campaign-scaling.png"
                        alt={featuredArticle.title}
                        className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700 ease-out"
                      />

                      {/* Top Right Floating Badge */}
                      <div className="absolute top-3.5 right-3.5 flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-[#070A18]/85 text-white border border-white/15 backdrop-blur-md shadow-lg">
                        <Sparkles className="w-3 h-3 text-[#20C8E8]" />
                        <span>8 Networks Unified</span>
                      </div>

                      {/* Bottom Left Telemetry Beacon */}
                      <div className="absolute bottom-3.5 left-3.5 flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-[11px] font-semibold bg-[#070A18]/90 text-white border border-white/15 backdrop-blur-md shadow-lg">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                        <span className="font-mono text-[10px] text-slate-300">
                          Auto-Calibrated AI Dispatch
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          )}

          {/* Interactive Filter Bar & Real-Time Search */}
          <div className="space-y-5">
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

              {/* Search Bar */}
              <div className="relative w-full lg:w-72">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search articles..."
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

            {/* Filter Results Info */}
            {(selectedCategory !== 'All' || searchQuery) && (
              <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 px-2">
                <span>
                  Found <strong>{filteredArticles.length}</strong> matching articles
                </span>
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
              </div>
            )}
          </div>

          {/* Articles Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {regularArticles.map((post) => (
              <Link
                key={post.slug}
                href={`/blog/${post.slug}`}
                className="group relative rounded-3xl p-6 sm:p-7 bg-white/90 dark:bg-[#0E132B]/90 backdrop-blur-xl border border-slate-200 dark:border-[#1E2749] shadow-soft dark:shadow-none hover:border-[#7138F5]/60 hover:shadow-[0_20px_45px_-12px_rgba(113,56,245,0.25)] hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between overflow-hidden"
              >
                {/* Specular Top Rim Gradient on Hover */}
                <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-[#7138F5] to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                <div className="space-y-4">
                  <div className="flex items-center justify-between text-xs">
                    <span className="px-2.5 py-1 rounded-full bg-[#7138F5]/10 dark:bg-[#7138F5]/20 text-[#7138F5] dark:text-[#C4A5FF] font-bold border border-[#7138F5]/20 text-[11px]">
                      {post.category}
                    </span>
                    <span className="flex items-center gap-1 text-slate-500 dark:text-slate-400 font-medium">
                      <Clock className="w-3.5 h-3.5" />
                      {post.readTime}
                    </span>
                  </div>

                  <h2 className="text-xl font-extrabold text-slate-900 dark:text-white group-hover:text-[#7138F5] dark:group-hover:text-[#C4A5FF] transition-colors leading-snug">
                    {post.title}
                  </h2>

                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-normal">
                    {post.excerpt}
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-100 dark:border-white/10 flex items-center justify-between text-xs font-bold">
                  <span className="text-slate-400 dark:text-slate-500">{post.publishedDate}</span>
                  <span className="inline-flex items-center gap-1.5 text-[#7138F5] dark:text-[#C4A5FF] group-hover:translate-x-1 transition-transform">
                    <span>Read Guide</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </Link>
            ))}
          </div>

          {/* Empty State */}
          {filteredArticles.length === 0 && (
            <div className="text-center py-16 p-8 rounded-3xl bg-white dark:bg-[#0D122B] border border-slate-200 dark:border-white/10">
              <BookOpen className="w-10 h-10 text-slate-400 mx-auto mb-3" />
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                No matching articles found
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                Try searching for &quot;Brand Kit&quot;, &quot;OAuth&quot;, &quot;Approval&quot;, or &quot;Publishing&quot;.
              </p>
              <button
                type="button"
                onClick={() => {
                  setSelectedCategory('All');
                  setSearchQuery('');
                }}
                className="mt-4 px-4 py-2 rounded-xl text-xs font-bold btn-gradient"
              >
                Clear Filters
              </button>
            </div>
          )}

          {/* Social Operations Dispatch Newsletter Box */}
          <div className="p-8 sm:p-12 rounded-3xl bg-gradient-to-br from-white/95 via-[#F1EBFF]/30 to-white/95 dark:from-[#0E132A]/95 dark:via-[#161D3D]/60 dark:to-[#0E132A]/95 border border-slate-200 dark:border-[#1E2749] shadow-soft dark:shadow-none flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="space-y-2 text-center md:text-left max-w-lg">
              <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#7138F5] dark:text-[#C4A5FF]">
                Bi-Weekly Engineering Dispatch
              </span>
              <h3 className="text-2xl font-extrabold text-slate-900 dark:text-white">
                Stay Ahead of Social Media API Updates
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300">
                Join 12,000+ creators and social operations engineers receiving our quarterly
                breakdowns of Meta, Google, X, and TikTok API policy changes.
              </p>
            </div>

            <div className="w-full md:w-auto">
              {newsletterSubscribed ? (
                <div className="flex items-center gap-2 p-3.5 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-xs sm:text-sm font-bold">
                  <CheckCircle2 className="w-5 h-5 shrink-0" />
                  <span>You&apos;re subscribed to the Social Operations Dispatch!</span>
                </div>
              ) : (
                <form
                  onSubmit={handleNewsletterSubmit}
                  className="p-1.5 rounded-2xl bg-white dark:bg-[#090D22] border border-slate-300 dark:border-[#2B3566] shadow-md flex items-center gap-2"
                >
                  <div className="relative pl-3 pr-2 py-1 flex items-center gap-2">
                    <Mail className="w-4 h-4 text-slate-400 shrink-0" />
                    <input
                      type="email"
                      required
                      value={newsletterEmail}
                      onChange={(e) => setNewsletterEmail(e.target.value)}
                      placeholder="work@company.com"
                      className="bg-transparent text-xs sm:text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none w-48 sm:w-60"
                    />
                  </div>
                  <button
                    type="submit"
                    className="px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm btn-gradient text-white shrink-0 hover:scale-[1.02] transition-transform"
                  >
                    Subscribe
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
