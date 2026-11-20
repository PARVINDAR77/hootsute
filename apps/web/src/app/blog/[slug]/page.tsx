import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  ArrowLeft,
  Clock,
  Calendar,
  Share2,
  BookOpen,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import { PublicNavbar } from '@/components/marketing/PublicNavbar';
import { PublicFooter } from '@/components/marketing/PublicFooter';
import { BLOG_ARTICLES } from '@/components/marketing/public-content';
import { ROUTES } from '@/lib/constants';

export function generateStaticParams() {
  return BLOG_ARTICLES.map((article) => ({ slug: article.slug }));
}

export default function BlogArticlePage({ params }: { params: { slug: string } }) {
  const article = BLOG_ARTICLES.find((a) => a.slug === params.slug);
  if (!article) {
    notFound();
  }

  const relatedArticles = BLOG_ARTICLES.filter((a) => a.slug !== params.slug).slice(0, 2);

  return (
    <div className="min-h-screen flex flex-col ambient-canvas">
      <PublicNavbar />

      <main className="flex-1 py-14 sm:py-20 relative overflow-hidden">
        {/* Background Ambient Glow */}
        <div className="absolute top-0 left-1/3 w-[600px] h-[600px] bg-[#7138F5]/10 rounded-full blur-[150px] pointer-events-none" />

        <article className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          {/* Breadcrumb & Back Link */}
          <div className="flex items-center justify-between">
            <Link
              href={ROUTES.BLOG}
              className="inline-flex items-center gap-2 text-xs sm:text-sm font-bold text-[#7138F5] dark:text-[#C4A5FF] hover:underline group"
            >
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
              <span>Back to all engineering playbooks</span>
            </Link>

            <span className="text-[11px] font-mono text-slate-400 dark:text-slate-500 font-bold">
              OmniSocial Architectural Library
            </span>
          </div>

          {/* Article Header */}
          <div className="space-y-6">
            <div className="flex flex-wrap items-center gap-3 text-xs">
              <span className="px-3 py-1 rounded-full bg-[#7138F5]/10 dark:bg-[#7138F5]/20 text-[#7138F5] dark:text-[#C4A5FF] font-bold border border-[#7138F5]/25">
                {article.category}
              </span>
              <span className="inline-flex items-center gap-1.5 text-slate-500 dark:text-slate-400 font-medium">
                <Calendar className="w-3.5 h-3.5" /> {article.publishedDate}
              </span>
              <span className="inline-flex items-center gap-1.5 text-slate-500 dark:text-slate-400 font-medium">
                <Clock className="w-3.5 h-3.5" /> {article.readTime}
              </span>
            </div>

            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-slate-900 dark:text-white leading-[1.14]">
              {article.title}
            </h1>

            <p className="text-base sm:text-xl text-slate-600 dark:text-slate-300 leading-relaxed font-normal">
              {article.excerpt}
            </p>

            {article.slug === 'multi-platform-bulk-publishing-architecture' && (
              <div className="relative rounded-3xl overflow-hidden border border-slate-200 dark:border-white/15 shadow-2xl mt-6">
                <img
                  src="/images/blog-featured-campaign-scaling.png"
                  alt={article.title}
                  className="w-full h-auto aspect-[16/9] object-cover object-center"
                />
              </div>
            )}
          </div>

          {/* Executive Summary Callout */}
          <div className="p-6 sm:p-7 rounded-3xl bg-gradient-to-r from-[#7138F5]/10 via-[#2878FF]/10 to-[#20C8E8]/10 border border-[#7138F5]/25 backdrop-blur-xl space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#7138F5] dark:text-[#C4A5FF]">
              <Sparkles className="w-4 h-4" />
              <span>Executive Architecture Summary</span>
            </div>
            <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-200 leading-relaxed">
              This playbook outlines production-grade social operations using real NestJS endpoints,
              PostgreSQL schema isolation, and official OAuth 2.0 partner APIs. Every recommendation
              is tested against live platform rate limits and security boundaries.
            </p>
          </div>

          {/* Main Article Body */}
          <div className="rounded-3xl p-8 sm:p-12 bg-white/95 dark:bg-[#0E132A]/90 backdrop-blur-xl border border-slate-200 dark:border-[#1E2749] shadow-soft dark:shadow-none space-y-10 text-slate-800 dark:text-slate-200">
            {article.sections.map((sec, idx) => (
              <section key={sec.heading} className="space-y-4">
                <div className="flex items-center gap-3">
                  <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg text-xs font-mono font-bold bg-[#7138F5]/10 dark:bg-[#7138F5]/20 text-[#7138F5] dark:text-[#C4A5FF]">
                    0{idx + 1}
                  </span>
                  <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                    {sec.heading}
                  </h2>
                </div>
                <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed pl-10">
                  {sec.body}
                </p>
              </section>
            ))}

            {/* Author Signature & Engineering Verification */}
            <div className="pt-8 mt-10 border-t border-slate-200 dark:border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#7138F5] to-[#20C8E8] flex items-center justify-center text-white font-black text-sm">
                  OA
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                    OmniSocial Architecture Group
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Verified against official platform developer specifications
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                <ShieldCheck className="w-4 h-4" />
                <span>Production Verified</span>
              </div>
            </div>
          </div>

          {/* Related Articles Dock */}
          {relatedArticles.length > 0 && (
            <div className="space-y-6 pt-4">
              <h3 className="text-xl font-extrabold text-slate-900 dark:text-white">
                Recommended Next Reads
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {relatedArticles.map((rel) => (
                  <Link
                    key={rel.slug}
                    href={`/blog/${rel.slug}`}
                    className="p-6 rounded-2xl bg-white/80 dark:bg-[#0D122B]/80 border border-slate-200 dark:border-white/10 hover:border-[#7138F5]/50 transition-all space-y-2 group"
                  >
                    <span className="text-[10px] font-mono font-bold uppercase text-[#7138F5] dark:text-[#C4A5FF]">
                      {rel.category}
                    </span>
                    <h4 className="text-base font-bold text-slate-900 dark:text-white group-hover:text-[#7138F5] dark:group-hover:text-[#C4A5FF] transition-colors line-clamp-2">
                      {rel.title}
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
                      {rel.excerpt}
                    </p>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </article>
      </main>

      <PublicFooter />
    </div>
  );
}
