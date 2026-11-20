import React from 'react';
import Link from 'next/link';
import type { Metadata } from 'next';
import {
  BookOpen,
  Share2,
  Sparkles,
  Send,
  ShieldCheck,
  ArrowRight,
  MessageSquare,
} from 'lucide-react';
import { PublicNavbar } from '@/components/marketing/PublicNavbar';
import { PublicFooter } from '@/components/marketing/PublicFooter';
import { ROUTES } from '@/lib/constants';

export const metadata: Metadata = {
  title: 'Help Center — OmniSocial AI',
  description:
    'Quickstart onboarding guides, OAuth setup steps, bulk publishing instructions, and support resources for OmniSocial AI.',
};

const HELP_TOPICS = [
  {
    icon: Share2,
    title: 'Connecting All 8 Social Platforms',
    body: 'Learn required account types (Instagram Business, Facebook Pages, LinkedIn Organizations, Pinterest Business, YouTube Channels, TikTok Creator/Business, Threads, X) and OAuth scopes.',
    href: ROUTES.PLATFORMS,
    cta: 'View Platform Guide',
  },
  {
    icon: Sparkles,
    title: 'Configuring Your Brand Kit & AI Studio',
    body: 'Set your workspace voice, audience profile, restricted terms, and hashtag strategy so AI Content Studio generates on-brand multi-channel drafts.',
    href: ROUTES.FEATURES,
    cta: 'Explore AI Studio',
  },
  {
    icon: Send,
    title: 'Bulk Approval & Staggered Publishing',
    body: 'Batch-select drafts in Drafts & Approval, sign off as an Admin/Owner, and dispatch Immediate, Scheduled, or Staggered jobs across multiple accounts.',
    href: ROUTES.BLOG,
    cta: 'Read Publishing Guide',
  },
  {
    icon: ShieldCheck,
    title: 'Workspace Security & Roles (RBAC)',
    body: 'Manage Owners, Admins, Editors, and Viewers, inspect active refresh sessions, and review audit logs.',
    href: ROUTES.SECURITY,
    cta: 'Read Security Overview',
  },
];

export default function HelpPage() {
  return (
    <div className="min-h-screen flex flex-col ambient-canvas">
      <PublicNavbar />

      <main className="flex-1 py-16 sm:py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#F1EBFF] dark:bg-[#7138F5]/20 text-[#7138F5] dark:text-[#C4A5FF] text-xs font-bold">
              <BookOpen className="w-3.5 h-3.5" /> Help &amp; Documentation
            </span>
            <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-[#111827] dark:text-white">
              OmniSocial AI <span className="text-gradient">Help Center</span>
            </h1>
            <p className="text-base text-[#64748B] dark:text-slate-400">
              Everything you need to connect channels, onboard your team, and automate publishing.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {HELP_TOPICS.map((topic) => {
              const Icon = topic.icon;
              return (
                <div
                  key={topic.title}
                  className="rounded-2xl p-6 bg-white dark:bg-[#0F142B]/90 border border-[#E7EAF2] dark:border-[#1E2749] shadow-soft dark:shadow-none flex flex-col justify-between gap-4"
                >
                  <div>
                    <div className="w-11 h-11 rounded-xl bg-[#F1EBFF] dark:bg-[#7138F5]/20 text-[#7138F5] dark:text-[#C4A5FF] flex items-center justify-center mb-4">
                      <Icon className="w-5 h-5" />
                    </div>
                    <h2 className="text-lg font-bold text-[#111827] dark:text-white">
                      {topic.title}
                    </h2>
                    <p className="mt-2 text-sm text-[#64748B] dark:text-slate-400 leading-relaxed">
                      {topic.body}
                    </p>
                  </div>
                  <Link
                    href={topic.href}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-[#7138F5] dark:text-[#20C8E8] hover:underline"
                  >
                    {topic.cta}
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              );
            })}
          </div>

          <div className="rounded-2xl p-6 sm:p-8 bg-white dark:bg-[#0F142B] border border-[#E7EAF2] dark:border-[#1E2749] flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#7138F5] to-[#2878FF] text-white flex items-center justify-center shrink-0">
                <MessageSquare className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-[#111827] dark:text-white">
                  Need hands-on onboarding assistance?
                </h2>
                <p className="text-sm text-[#64748B] dark:text-slate-400">
                  Check our FAQ or submit a ticket through our Contact form.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <Link
                href={ROUTES.FAQ}
                className="px-4 py-2.5 rounded-xl border border-[#E7EAF2] dark:border-white/15 text-xs font-bold text-[#111827] dark:text-white"
              >
                Read FAQ
              </Link>
              <Link
                href={ROUTES.CONTACT}
                className="px-4 py-2.5 rounded-xl btn-gradient text-xs font-bold"
              >
                Contact Support
              </Link>
            </div>
          </div>
        </div>
      </main>

      <PublicFooter />
    </div>
  );
}
