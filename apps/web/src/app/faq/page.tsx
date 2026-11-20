'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ChevronDown, HelpCircle, ArrowRight } from 'lucide-react';
import { PublicNavbar } from '@/components/marketing/PublicNavbar';
import { PublicFooter } from '@/components/marketing/PublicFooter';
import { FAQ_ENTRIES } from '@/components/marketing/public-content';
import { Tabs } from '@/components/ui/Tabs';
import { ROUTES } from '@/lib/constants';

type CategoryFilter = 'All' | 'General' | 'Platforms' | 'Billing & Plans' | 'Security';

export default function FaqPage() {
  const [category, setCategory] = useState<CategoryFilter>('All');
  const [openQuestion, setOpenQuestion] = useState<string | null>(FAQ_ENTRIES[0].question);

  const visible =
    category === 'All'
      ? FAQ_ENTRIES
      : FAQ_ENTRIES.filter((entry) => entry.category === category);

  return (
    <div className="min-h-screen flex flex-col ambient-canvas">
      <PublicNavbar />

      <main className="flex-1 py-16 sm:py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-4 mb-10">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#F1EBFF] dark:bg-[#7138F5]/20 text-[#7138F5] dark:text-[#C4A5FF] text-xs font-bold">
              <HelpCircle className="w-3.5 h-3.5" /> Answers &amp; Architecture Details
            </span>
            <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-[#111827] dark:text-white">
              Frequently Asked <span className="text-gradient">Questions</span>
            </h1>
            <p className="text-base text-[#64748B] dark:text-slate-400">
              Honest, accurate answers about supported networks, billing limits, AI generation,
              and multi-tenant security.
            </p>
          </div>

          <div className="flex justify-center mb-8">
            <Tabs<CategoryFilter>
              value={category}
              onChange={setCategory}
              options={[
                { id: 'All', label: 'All' },
                { id: 'General', label: 'General' },
                { id: 'Platforms', label: 'Platforms' },
                { id: 'Billing & Plans', label: 'Billing & Plans' },
                { id: 'Security', label: 'Security' },
              ]}
            />
          </div>

          <div className="space-y-3">
            {visible.map((item) => {
              const isOpen = openQuestion === item.question;
              return (
                <div
                  key={item.question}
                  className="rounded-2xl bg-white dark:bg-[#0F142B] border border-[#E7EAF2] dark:border-[#1E2749] overflow-hidden"
                >
                  <button
                    type="button"
                    onClick={() => setOpenQuestion(isOpen ? null : item.question)}
                    className="w-full px-6 py-4 text-left flex items-center justify-between gap-4"
                  >
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#7138F5] dark:text-[#20C8E8]">
                        {item.category}
                      </span>
                      <p className="text-sm sm:text-base font-bold text-[#111827] dark:text-white mt-0.5">
                        {item.question}
                      </p>
                    </div>
                    <ChevronDown
                      className={`w-4 h-4 text-[#64748B] shrink-0 transition-transform ${
                        isOpen ? 'rotate-180 text-[#7138F5] dark:text-[#20C8E8]' : ''
                      }`}
                    />
                  </button>
                  {isOpen && (
                    <div className="px-6 pb-5 text-sm text-[#64748B] dark:text-slate-300 leading-relaxed">
                      {item.answer}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="mt-12 rounded-2xl p-6 bg-white dark:bg-[#0F142B] border border-[#E7EAF2] dark:border-[#1E2749] flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-bold text-[#111827] dark:text-white">
                Still have a specific question?
              </h2>
              <p className="text-xs sm:text-sm text-[#64748B] dark:text-slate-400">
                Reach out to our team directly through the Contact page.
              </p>
            </div>
            <Link
              href={ROUTES.CONTACT}
              className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl btn-gradient text-xs sm:text-sm font-bold shrink-0"
            >
              <span>Contact Support</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </main>

      <PublicFooter />
    </div>
  );
}
