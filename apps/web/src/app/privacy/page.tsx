import React from 'react';
import type { Metadata } from 'next';
import { PublicNavbar } from '@/components/marketing/PublicNavbar';
import { PublicFooter } from '@/components/marketing/PublicFooter';

export const metadata: Metadata = {
  title: 'Privacy Policy — OmniSocial AI',
  description: 'How OmniSocial AI collects, encrypts, processes, and protects workspace and social OAuth data.',
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen flex flex-col ambient-canvas">
      <PublicNavbar />
      <main className="flex-1 py-16 sm:py-20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-[#111827] dark:text-white mb-2">
            Privacy Policy
          </h1>
          <p className="text-xs font-semibold text-[#64748B] dark:text-slate-400 mb-8">
            Effective Date: November 2026
          </p>

          <div className="rounded-3xl p-6 sm:p-10 bg-white dark:bg-[#0F142B]/90 border border-[#E7EAF2] dark:border-[#1E2749] space-y-6 text-sm text-[#64748B] dark:text-slate-300 leading-relaxed">
            <section className="space-y-2">
              <h2 className="text-lg font-bold text-[#111827] dark:text-white">
                1. Information We Collect
              </h2>
              <p>
                We collect account registration details (name, email address, hashed password),
                workspace configuration data, uploaded media assets, campaign drafts, analytics
                snapshots synced from connected social accounts, and contact form submissions.
              </p>
            </section>
            <section className="space-y-2">
              <h2 className="text-lg font-bold text-[#111827] dark:text-white">
                2. OAuth Tokens &amp; Social Platform Data
              </h2>
              <p>
                When you connect Instagram, Facebook, X, LinkedIn, Pinterest, YouTube, TikTok, or
                Threads, OAuth tokens are encrypted at rest using AES-256-GCM and used strictly to
                execute actions you authorize (publishing, inbox synchronization, and analytics
                reporting). We never sell social audience data to third parties.
              </p>
            </section>
            <section className="space-y-2">
              <h2 className="text-lg font-bold text-[#111827] dark:text-white">
                3. Multi-Tenant Workspace Isolation
              </h2>
              <p>
                All customer records are scoped to their owning workspace in PostgreSQL and
                protected by server-side authentication and role-based access control.
              </p>
            </section>
            <section className="space-y-2">
              <h2 className="text-lg font-bold text-[#111827] dark:text-white">
                4. Data Retention &amp; Deletion
              </h2>
              <p>
                You can disconnect social accounts at any time to revoke active OAuth connections,
                revoke active login sessions from Account Settings, or contact our team via the
                Contact page to request full workspace data export or deletion.
              </p>
            </section>
          </div>
        </div>
      </main>
      <PublicFooter />
    </div>
  );
}
