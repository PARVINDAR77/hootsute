import React from 'react';
import type { Metadata } from 'next';
import { PublicNavbar } from '@/components/marketing/PublicNavbar';
import { PublicFooter } from '@/components/marketing/PublicFooter';

export const metadata: Metadata = {
  title: 'Terms of Service — OmniSocial AI',
  description: 'Terms governing use of the OmniSocial AI platform, subscriptions, and connected social APIs.',
};

export default function TermsPage() {
  return (
    <div className="min-h-screen flex flex-col ambient-canvas">
      <PublicNavbar />
      <main className="flex-1 py-16 sm:py-20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-[#111827] dark:text-white mb-2">
            Terms of Service
          </h1>
          <p className="text-xs font-semibold text-[#64748B] dark:text-slate-400 mb-8">
            Effective Date: November 2026
          </p>

          <div className="rounded-3xl p-6 sm:p-10 bg-white dark:bg-[#0F142B]/90 border border-[#E7EAF2] dark:border-[#1E2749] space-y-6 text-sm text-[#64748B] dark:text-slate-300 leading-relaxed">
            <section className="space-y-2">
              <h2 className="text-lg font-bold text-[#111827] dark:text-white">
                1. Authorized Use &amp; Platform Compliance
              </h2>
              <p>
                You agree to use OmniSocial AI solely to manage social accounts you own or are
                authorized to administer, and to comply with the official terms and developer
                policies of Instagram, Facebook, X (Twitter), LinkedIn, Pinterest, YouTube, TikTok,
                and Threads.
              </p>
            </section>
            <section className="space-y-2">
              <h2 className="text-lg font-bold text-[#111827] dark:text-white">
                2. Subscriptions, Quotas &amp; Billing
              </h2>
              <p>
                Workspace quotas (connected social accounts, media storage, asset count, and AI
                copy generations) correspond to your active subscription tier as displayed in
                Billing &amp; Plan. Paid subscriptions renew automatically unless cancelled through
                the billing portal.
              </p>
            </section>
            <section className="space-y-2">
              <h2 className="text-lg font-bold text-[#111827] dark:text-white">
                3. Content Ownership &amp; Review Responsibility
              </h2>
              <p>
                You retain ownership of all brand content, media uploads, and published posts.
                You are responsible for reviewing AI-generated drafts prior to approval and
                publishing.
              </p>
            </section>
            <section className="space-y-2">
              <h2 className="text-lg font-bold text-[#111827] dark:text-white">
                4. Third-Party Social API Availability
              </h2>
              <p>
                Publishing delivery and analytics sync depend on third-party social network APIs
                and rate limits. OmniSocial AI logs delivery responses and provides retry controls
                for transient provider failures.
              </p>
            </section>
          </div>
        </div>
      </main>
      <PublicFooter />
    </div>
  );
}
