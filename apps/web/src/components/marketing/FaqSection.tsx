'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import {
  HelpCircle,
  ChevronDown,
  ArrowRight,
  Sparkles,
  MessageSquare,
  ShieldCheck,
  CheckCircle2,
  Mail,
  Zap,
} from 'lucide-react';
import { ROUTES } from '@/lib/constants';
import { FAQ_ENTRIES, FaqEntry } from '@/components/marketing/public-content';

type CategoryFilter = 'All' | 'General' | 'Platforms' | 'Billing & Plans' | 'Security';

export function FaqSection() {
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [selectedCategory, setSelectedCategory] = useState<CategoryFilter>('All');
  const sectionRef = useRef<HTMLDivElement | null>(null);
  const [isVisible, setIsVisible] = useState(false);

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
      {
        threshold: 0.1,
        rootMargin: '0px 0px -40px 0px',
      },
    );

    const el = sectionRef.current;
    if (el) observer.observe(el);

    return () => {
      if (el) observer.unobserve(el);
    };
  }, []);

  const categories: CategoryFilter[] = ['All', 'General', 'Platforms', 'Billing & Plans', 'Security'];

  const filteredFaqs =
    selectedCategory === 'All'
      ? FAQ_ENTRIES.slice(0, 7)
      : FAQ_ENTRIES.filter((f) => f.category === selectedCategory);

  return (
    <section className="py-24 bg-white/75 dark:bg-[#080B1B]/75 border-t border-[#E7EAF2] dark:border-[#1E2749] relative overflow-hidden">
      {/* Background ambient light orbs */}
      <div className="absolute top-1/4 -left-48 w-96 h-96 bg-[#7138F5]/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-1/4 -right-48 w-96 h-96 bg-[#20C8E8]/10 rounded-full blur-[140px] pointer-events-none" />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative" ref={sectionRef}>
        {/* Section Header */}
        <div
          className={`text-center max-w-2xl mx-auto mb-12 sm:mb-14 transition-all duration-700 ease-out ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}
        >
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest bg-[#7138F5]/10 dark:bg-[#7138F5]/20 text-[#7138F5] dark:text-[#C4A5FF] border border-[#7138F5]/20 mb-4 shadow-sm">
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Frequently Asked Questions</span>
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-[#111827] dark:text-white leading-[1.15]">
            Got Questions?{' '}
            <span className="bg-gradient-to-r from-[#7138F5] via-[#2878FF] to-[#20C8E8] bg-clip-text text-transparent">
              We Have Answers
            </span>
          </h2>

          <p className="mt-4 text-base sm:text-lg text-[#64748B] dark:text-slate-400 leading-relaxed">
            Everything you need to know about autonomous AI drafting, multi-platform bulk publishing, official OAuth 2.0 security, and plan quotas.
          </p>

          {/* Category Filter Pills */}
          <div className="mt-7 flex flex-wrap items-center justify-center gap-1.5">
            {categories.map((cat) => {
              const isSelected = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => {
                    setSelectedCategory(cat);
                    setOpenFaq(0);
                  }}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all ${
                    isSelected
                      ? 'bg-gradient-to-r from-[#7138F5] to-[#2878FF] text-white shadow-md shadow-[#7138F5]/25'
                      : 'bg-white dark:bg-[#0E132A] text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:border-[#7138F5]/50'
                  }`}
                >
                  {cat === 'All' ? 'All Questions' : cat}
                </button>
              );
            })}
          </div>
        </div>

        {/* FAQ Accordion List - Expands Automatically on Hover and on Click */}
        <div className="space-y-3.5">
          {filteredFaqs.map((item, idx) => {
            const isOpen = openFaq === idx;

            return (
              <div
                key={item.question}
                onMouseEnter={() => setOpenFaq(idx)} // Expands on HOVER directly as requested
                style={{
                  transitionDelay: isVisible ? `${idx * 60}ms` : '0ms',
                }}
                className={`relative rounded-2xl overflow-hidden backdrop-blur-xl border transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] group ${
                  isOpen
                    ? 'bg-white dark:bg-[#0E132A] border-[#7138F5] dark:border-[#7138F5]/80 shadow-[0_15px_35px_-10px_rgba(113,56,245,0.22)] ring-1 ring-[#7138F5]/30'
                    : 'bg-white/80 dark:bg-[#0D1127]/80 border-[#E2E8F0] dark:border-[#1E2749] hover:border-[#7138F5]/50 hover:bg-white dark:hover:bg-[#0E132A]'
                } ${
                  isVisible
                    ? 'opacity-100 translate-y-0 scale-100'
                    : 'opacity-0 translate-y-8 scale-[0.96]'
                }`}
              >
                {/* Specular Top Rim Gradient on Active */}
                {isOpen && (
                  <div className="absolute top-0 inset-x-0 h-[1.5px] bg-gradient-to-r from-transparent via-[#7138F5] to-transparent" />
                )}

                <button
                  type="button"
                  onClick={() => setOpenFaq(isOpen ? null : idx)}
                  className="w-full px-6 py-5 text-left flex items-center justify-between gap-4 cursor-pointer"
                >
                  <div className="flex items-center gap-3.5">
                    {/* Number Chip */}
                    <span
                      className={`inline-flex items-center justify-center w-7 h-7 rounded-lg text-xs font-mono font-bold transition-colors ${
                        isOpen
                          ? 'bg-gradient-to-br from-[#7138F5] to-[#2878FF] text-white shadow-sm'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 group-hover:text-[#7138F5]'
                      }`}
                    >
                      {String(idx + 1).padStart(2, '0')}
                    </span>

                    <div>
                      <span
                        className={`text-base sm:text-lg font-bold tracking-tight transition-colors ${
                          isOpen
                            ? 'text-[#7138F5] dark:text-[#C4A5FF]'
                            : 'text-[#111827] dark:text-white group-hover:text-[#7138F5] dark:group-hover:text-[#C4A5FF]'
                        }`}
                      >
                        {item.question}
                      </span>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                          {item.category}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center transition-all shrink-0 ${
                      isOpen
                        ? 'bg-[#7138F5]/10 text-[#7138F5] dark:text-[#C4A5FF] rotate-180'
                        : 'bg-slate-100 dark:bg-slate-800/80 text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-200'
                    }`}
                  >
                    <ChevronDown className="w-4 h-4" />
                  </div>
                </button>

                {/* Animated Accordion Body */}
                <div
                  className={`overflow-hidden transition-all duration-300 ease-out ${
                    isOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                  }`}
                >
                  <div className="px-6 pb-6 pt-1 text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed border-t border-slate-100 dark:border-slate-800/70">
                    <p>{item.answer}</p>
                    <div className="mt-3.5 pt-3 border-t border-slate-100 dark:border-slate-800/50 flex items-center justify-between text-xs text-slate-400">
                      <span className="flex items-center gap-1.5 text-emerald-500 font-semibold">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Verified official documentation
                      </span>
                      <span className="text-[11px] font-mono">OmniSocial Knowledge Base</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom Help & Contact Desk Banner */}
        <div
          className={`mt-14 p-6 sm:p-7 rounded-3xl bg-gradient-to-br from-white/95 via-[#F1EBFF]/30 to-white/95 dark:from-[#0E132A]/90 dark:via-[#161D3D]/50 dark:to-[#0E132A]/90 border border-[#E2E8F0] dark:border-[#1E2749] shadow-soft dark:shadow-none flex flex-col sm:flex-row items-center justify-between gap-5 transition-all duration-700 delay-200 ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
          }`}
        >
          <div className="flex items-center gap-4 text-center sm:text-left">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#7138F5] to-[#20C8E8] flex items-center justify-center text-white shadow-md shrink-0">
              <MessageSquare className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-base font-bold text-slate-900 dark:text-white">
                Still have questions about your team&apos;s setup?
              </h4>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-0.5">
                Our social operations engineers are available for live architectural reviews.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <Link
              href={ROUTES.CONTACT}
              className="px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm bg-gradient-to-r from-[#7138F5] to-[#2878FF] text-white hover:shadow-md hover:shadow-[#7138F5]/30 hover:-translate-y-0.5 transition-all"
            >
              Contact Support
            </Link>
            <Link
              href={ROUTES.FAQ}
              className="px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white hover:border-[#7138F5] transition-all flex items-center gap-1.5"
            >
              <span>All 15+ FAQs</span>
              <ArrowRight className="w-3.5 h-3.5 text-[#7138F5]" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
