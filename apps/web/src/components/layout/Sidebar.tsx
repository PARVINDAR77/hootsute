'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Building2,
  Users,
  Mail,
  Share2,
  Sparkles,
  FileText,
  Palette,
  MessageSquare,
  Calendar,
  BarChart3,
  Settings,
  Shield,
  Inbox,
  Image as ImageIcon,
  CreditCard,
  Zap,
  Link2,
  Radio,
  Globe,
  PieChart,
  ShieldAlert,
  Swords,
} from 'lucide-react';
import { ROUTES } from '@/lib/constants';
import { useWorkspace } from '@/lib/workspace-context';

export function Sidebar() {
  const pathname = usePathname();
  const { currentWorkspace } = useWorkspace();

  const workspaceNav = [
    { name: 'Dashboard', href: ROUTES.DASHBOARD, icon: LayoutDashboard },
    { name: 'Social Accounts', href: ROUTES.SETTINGS_SOCIAL_ACCOUNTS, icon: Share2 },
    { name: 'WhatsApp Approval', href: ROUTES.SETTINGS_WHATSAPP, icon: MessageSquare },
    { name: 'Workspace Settings', href: ROUTES.SETTINGS_WORKSPACE, icon: Building2 },
    { name: 'White-Label Portal', href: ROUTES.SETTINGS_WHITE_LABEL, icon: Globe },
    { name: 'Billing & Plan', href: ROUTES.SETTINGS_BILLING, icon: CreditCard },
    { name: 'Team Members', href: ROUTES.SETTINGS_MEMBERS, icon: Users },
    { name: 'Invitations', href: ROUTES.SETTINGS_INVITATIONS, icon: Mail },
  ];

  const aiContentNav = [
    { name: 'AI Studio', href: ROUTES.CONTENT_STUDIO, icon: Sparkles },
    { name: 'Drafts & Review', href: ROUTES.CONTENT_DRAFTS, icon: FileText },
    { name: 'Media Library', href: ROUTES.MEDIA, icon: ImageIcon },
    { name: 'Publishing Calendar', href: ROUTES.CALENDAR, icon: Calendar },
    { name: 'Link Shortener & UTM', href: ROUTES.LINKS, icon: Link2 },
    { name: 'Brand Kit', href: ROUTES.BRAND_KIT, icon: Palette },
  ];

  const futureNav = [
    { name: 'Growth Analytics', icon: BarChart3, stage: 'Stage 7' },
  ];

  return (
    <aside className="w-64 border-r border-slate-200/80 bg-white flex flex-col shrink-0 min-h-screen">
      {/* Brand logo */}
      <div className="h-16 px-6 flex items-center gap-3 border-b border-slate-100">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-500 flex items-center justify-center text-white shadow-md shadow-indigo-100">
          <Sparkles className="w-5 h-5" />
        </div>
        <div className="flex flex-col">
          <span className="font-bold text-slate-900 text-sm tracking-tight">OmniSocial AI</span>
          <span className="text-[10px] text-slate-400 font-medium">Multi-Tenant Platform</span>
        </div>
      </div>

      {/* Nav items */}
      <nav className="flex-1 p-4 space-y-6 overflow-y-auto">
        {/* Workspace Management */}
        <div className="space-y-1">
          <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Workspace
          </div>
          {workspaceNav.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-indigo-50 text-indigo-700 font-semibold shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <Icon
                  className={`w-4 h-4 ${isActive ? 'text-indigo-600' : 'text-slate-400'}`}
                />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </div>

        {/* AI Content Studio & Campaigns */}
        <div className="space-y-1">
          <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-indigo-500 flex items-center justify-between">
            <span>AI Content Studio</span>
            <span className="text-[9px] bg-indigo-100 text-indigo-700 px-1.5 py-0.2 rounded font-semibold">Active</span>
          </div>
          {aiContentNav.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-indigo-50 text-indigo-700 font-semibold shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <Icon
                  className={`w-4 h-4 ${isActive ? 'text-indigo-600' : 'text-slate-400'}`}
                />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </div>

        {/* Analytics & Growth */}
        <div className="space-y-1">
          <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Analytics &amp; Growth
          </div>
          <Link
            href={ROUTES.ANALYTICS}
            className={`flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
              pathname === ROUTES.ANALYTICS || pathname.startsWith(`${ROUTES.ANALYTICS}/`)
                ? 'bg-indigo-50 text-indigo-700 font-semibold shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <BarChart3
              className={`w-4 h-4 ${
                pathname === ROUTES.ANALYTICS || pathname.startsWith(`${ROUTES.ANALYTICS}/`)
                  ? 'text-indigo-600'
                  : 'text-slate-400'
              }`}
            />
            <span>Growth Analytics</span>
          </Link>
          <Link
            href={ROUTES.REPORTS}
            className={`flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
              pathname === ROUTES.REPORTS || pathname.startsWith(`${ROUTES.REPORTS}/`)
                ? 'bg-indigo-50 text-indigo-700 font-semibold shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <PieChart
              className={`w-4 h-4 ${
                pathname === ROUTES.REPORTS || pathname.startsWith(`${ROUTES.REPORTS}/`)
                  ? 'text-indigo-600'
                  : 'text-slate-400'
              }`}
            />
            <span>Executive Reports</span>
          </Link>
          <Link
            href={ROUTES.COMPETITORS}
            className={`flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
              pathname === ROUTES.COMPETITORS || pathname.startsWith(`${ROUTES.COMPETITORS}/`)
                ? 'bg-indigo-50 text-indigo-700 font-semibold shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <Swords
              className={`w-4 h-4 ${
                pathname === ROUTES.COMPETITORS || pathname.startsWith(`${ROUTES.COMPETITORS}/`)
                  ? 'text-indigo-600'
                  : 'text-slate-400'
              }`}
            />
            <span>Competitor Intel</span>
          </Link>
        </div>

        {/* Community, Listening & Inbox */}
        <div className="space-y-1">
          <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
            <span>Community &amp; Inbox</span>
            <span className="text-[9px] bg-emerald-100 text-emerald-700 px-1.5 py-0.2 rounded font-semibold">Active</span>
          </div>
          <Link
            href={ROUTES.INBOX}
            className={`flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
              pathname === ROUTES.INBOX || pathname.startsWith(`${ROUTES.INBOX}/`)
                ? 'bg-indigo-50 text-indigo-700 font-semibold shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <Inbox
              className={`w-4 h-4 ${
                pathname === ROUTES.INBOX || pathname.startsWith(`${ROUTES.INBOX}/`)
                  ? 'text-indigo-600'
                  : 'text-slate-400'
              }`}
            />
            <span>Social Inbox</span>
          </Link>
          <Link
            href={ROUTES.LISTENING}
            className={`flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
              pathname === ROUTES.LISTENING || pathname.startsWith(`${ROUTES.LISTENING}/`)
                ? 'bg-indigo-50 text-indigo-700 font-semibold shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <Radio
              className={`w-4 h-4 ${
                pathname === ROUTES.LISTENING || pathname.startsWith(`${ROUTES.LISTENING}/`)
                  ? 'text-indigo-600'
                  : 'text-slate-400'
              }`}
            />
            <span>Social Listening</span>
          </Link>
          <Link
            href={ROUTES.SETTINGS_INBOX_MODERATION}
            className={`flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
              pathname === ROUTES.SETTINGS_INBOX_MODERATION ||
              pathname.startsWith(`${ROUTES.SETTINGS_INBOX_MODERATION}/`)
                ? 'bg-indigo-50 text-indigo-700 font-semibold shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <ShieldAlert
              className={`w-4 h-4 ${
                pathname === ROUTES.SETTINGS_INBOX_MODERATION ||
                pathname.startsWith(`${ROUTES.SETTINGS_INBOX_MODERATION}/`)
                  ? 'text-indigo-600'
                  : 'text-slate-400'
              }`}
            />
            <span>Inbox Moderation</span>
          </Link>
        </div>

        {/* Automations & Intelligence */}
        <div className="space-y-1">
          <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
            <span>Automations</span>
            <span className="text-[9px] bg-purple-100 text-purple-700 px-1.5 py-0.2 rounded font-semibold">Active</span>
          </div>
          <Link
            href={ROUTES.AUTOMATIONS}
            className={`flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
              pathname === ROUTES.AUTOMATIONS || pathname.startsWith(`${ROUTES.AUTOMATIONS}/`)
                ? 'bg-indigo-50 text-indigo-700 font-semibold shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <Zap
              className={`w-4 h-4 ${
                pathname === ROUTES.AUTOMATIONS || pathname.startsWith(`${ROUTES.AUTOMATIONS}/`)
                  ? 'text-indigo-600'
                  : 'text-slate-400'
              }`}
            />
            <span>Smart Workflows</span>
          </Link>
        </div>

        {/* Account / Personal */}
        <div className="space-y-1">
          <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Personal Security
          </div>
          <Link
            href={ROUTES.SETTINGS}
            className={`flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
              pathname === ROUTES.SETTINGS
                ? 'bg-indigo-50 text-indigo-700 font-semibold shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <Shield
              className={`w-4 h-4 ${
                pathname === ROUTES.SETTINGS ? 'text-indigo-600' : 'text-slate-400'
              }`}
            />
            <span>Account &amp; Sessions</span>
          </Link>
        </div>
      </nav>

      {/* System Status footer */}
      <div className="p-4 border-t border-slate-100">
        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/60 flex items-center gap-2.5">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <div className="flex flex-col min-w-0">
            <span className="text-xs font-semibold text-slate-700 truncate">
              {currentWorkspace ? currentWorkspace.name : 'No Workspace'}
            </span>
            <span className="text-[10px] text-slate-400 truncate">
              Role: {currentWorkspace?.currentUserRole || 'None'}
            </span>
          </div>
        </div>
      </div>
    </aside>
  );
}
