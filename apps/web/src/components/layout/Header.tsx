'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { WorkspaceSelector } from './WorkspaceSelector';
import { UserMenu } from './UserMenu';
import { PushNotificationToggle } from '../notifications/PushNotificationToggle';
import { ThemeToggle } from '../ui/ThemeToggle';
import {
  Sparkles,
  Menu,
  Search,
  Bell,
  HelpCircle,
  ArrowRight,
  X,
} from 'lucide-react';
import { ROUTES } from '@/lib/constants';
import { useWorkspace } from '@/lib/workspace-context';
import { apiClient, unwrapList } from '@/lib/api-client';

interface HeaderProps {
  onMenuClick?: () => void;
}

const QUICK_NAV_ITEMS = [
  { label: 'Dashboard Overview', href: ROUTES.DASHBOARD, category: 'Page' },
  { label: 'AI Content Studio', href: ROUTES.CONTENT_STUDIO, category: 'Create' },
  { label: 'Drafts & Approvals', href: ROUTES.CONTENT_DRAFTS, category: 'Create' },
  { label: 'Bulk Publish Campaigns', href: ROUTES.BULK_PUBLISH, category: 'Publish' },
  { label: 'Content Calendar', href: ROUTES.CALENDAR, category: 'Publish' },
  { label: 'Social Accounts (8 Platforms)', href: ROUTES.SETTINGS_SOCIAL_ACCOUNTS, category: 'Channels' },
  { label: 'Analytics Dashboard', href: ROUTES.ANALYTICS, category: 'Insights' },
  { label: 'Growth Insights', href: ROUTES.ANALYTICS_INSIGHTS, category: 'Insights' },
  { label: 'Unified Social Inbox', href: ROUTES.INBOX, category: 'Engage' },
  { label: 'Social Listening', href: ROUTES.LISTENING, category: 'Engage' },
  { label: 'Media Library', href: ROUTES.MEDIA, category: 'Assets' },
  { label: 'Brand Kit', href: ROUTES.BRAND_KIT, category: 'Workspace' },
  { label: 'Smart Workflows & Automations', href: ROUTES.AUTOMATIONS, category: 'Automation' },
  { label: 'Billing & Subscription', href: ROUTES.SETTINGS_BILLING, category: 'Workspace' },
  { label: 'Team Members & Roles', href: ROUTES.SETTINGS_MEMBERS, category: 'Workspace' },
];

export function Header({ onMenuClick }: HeaderProps) {
  const router = useRouter();
  const { currentWorkspace } = useWorkspace();

  const [query, setQuery] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const searchRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setSearchFocused(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
    };
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSearchFocused(false);
        setNotifOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    document.addEventListener('keydown', handleEsc);
    return () => {
      document.removeEventListener('mousedown', handleOutside);
      document.removeEventListener('keydown', handleEsc);
    };
  }, []);

  useEffect(() => {
    if (!currentWorkspace?.id) return;
    let cancelled = false;
    apiClient(`/workspaces/${currentWorkspace.id}/inbox/notifications`)
      .then((res: any) => {
        if (cancelled) return;
        const list = unwrapList<any>(res);
        setNotifications(list.slice(0, 6));
        setUnreadCount(list.filter((n) => !n.readAt && !n.isRead).length);
      })
      .catch(() => {
        // Silently ignore if notifications aren't populated yet
      });
    return () => {
      cancelled = true;
    };
  }, [currentWorkspace?.id]);

  const filteredNav = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return QUICK_NAV_ITEMS.slice(0, 6);
    return QUICK_NAV_ITEMS.filter(
      (item) =>
        item.label.toLowerCase().includes(q) || item.category.toLowerCase().includes(q),
    ).slice(0, 7);
  }, [query]);

  return (
    <header className="h-16 border-b border-[#E7EAF2] dark:border-[#1E2749] bg-white/85 dark:bg-[#090D20]/85 backdrop-blur-xl px-4 sm:px-6 flex items-center justify-between gap-3 sticky top-0 z-40">
      {/* Left: Mobile Menu + Workspace Switcher + Global Search */}
      <div className="flex items-center gap-3 min-w-0 flex-1">
        {onMenuClick && (
          <button
            type="button"
            onClick={onMenuClick}
            className="lg:hidden p-2 rounded-xl border border-[#E7EAF2] dark:border-white/15 text-[#64748B] dark:text-slate-300 hover:text-[#111827] dark:hover:text-white hover:bg-[#F7F8FC] dark:hover:bg-white/10 transition-colors shrink-0"
            aria-label="Open navigation"
          >
            <Menu className="w-4 h-4" />
          </button>
        )}

        <WorkspaceSelector />

        {/* Global Quick Search */}
        <div
          ref={searchRef}
          className="relative hidden md:block flex-1 max-w-sm ml-1"
        >
          <Search className="w-4 h-4 text-[#64748B] dark:text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={query}
            onFocus={() => setSearchFocused(true)}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search pages, studio, calendar, analytics..."
            aria-label="Quick search navigation"
            className="w-full pl-9 pr-8 py-2 rounded-xl text-xs sm:text-sm bg-[#F7F8FC] dark:bg-[#0F142B] border border-[#E7EAF2] dark:border-[#1E2749] text-[#111827] dark:text-white placeholder:text-[#64748B] dark:placeholder:text-slate-500 focus:outline-none focus:border-[#7138F5] focus:ring-2 focus:ring-[#7138F5]/20 transition-all"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              aria-label="Clear search"
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}

          {searchFocused && (
            <div className="absolute left-0 right-0 mt-2 bg-white dark:bg-[#0F142B] rounded-2xl border border-[#E7EAF2] dark:border-[#7138F5]/30 shadow-elevated dark:shadow-glow-card p-1.5 z-50 animate-fadeIn">
              <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-[#64748B] dark:text-slate-400">
                Quick Jump
              </div>
              {filteredNav.length === 0 ? (
                <p className="px-3 py-4 text-xs text-[#64748B] dark:text-slate-400 text-center">
                  No matching workspace views.
                </p>
              ) : (
                filteredNav.map((item) => (
                  <button
                    key={item.href}
                    type="button"
                    onClick={() => {
                      setSearchFocused(false);
                      setQuery('');
                      router.push(item.href);
                    }}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium text-[#111827] dark:text-slate-200 hover:bg-[#F1EBFF]/70 dark:hover:bg-[#7138F5]/20 transition-colors"
                  >
                    <span className="truncate">{item.label}</span>
                    <span className="flex items-center gap-1.5 text-[10px] font-semibold text-[#64748B] dark:text-slate-400">
                      {item.category}
                      <ArrowRight className="w-3 h-3 text-[#7138F5] dark:text-[#20C8E8]" />
                    </span>
                  </button>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      {/* Right: CTA + Notifications + Help + Theme Toggle + User */}
      <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
        <Link
          href={ROUTES.CONTENT_STUDIO}
          className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl btn-gradient text-xs font-semibold"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>New AI Post</span>
        </Link>

        <div className="hidden xl:block">
          <PushNotificationToggle />
        </div>

        {/* Notifications popover */}
        <div className="relative" ref={notifRef}>
          <button
            type="button"
            onClick={() => setNotifOpen((o) => !o)}
            aria-label="Workspace notifications"
            className="relative w-9 h-9 rounded-xl border border-[#E7EAF2] dark:border-white/15 bg-white dark:bg-[#0F142B]/80 hover:bg-[#F1EBFF]/60 dark:hover:bg-[#7138F5]/20 text-[#64748B] dark:text-slate-300 hover:text-[#7138F5] dark:hover:text-white flex items-center justify-center transition-colors"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 rounded-full bg-gradient-to-r from-[#7138F5] to-[#2878FF] text-white text-[10px] font-bold flex items-center justify-center">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {notifOpen && (
            <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-[#0F142B] rounded-2xl border border-[#E7EAF2] dark:border-[#7138F5]/30 shadow-elevated dark:shadow-glow-card p-2 z-50 animate-fadeIn">
              <div className="px-3 py-2 border-b border-[#E7EAF2] dark:border-white/10 flex items-center justify-between">
                <span className="text-xs font-bold text-[#111827] dark:text-white">
                  Notifications
                </span>
                <Link
                  href={ROUTES.INBOX}
                  onClick={() => setNotifOpen(false)}
                  className="text-[11px] font-semibold text-[#7138F5] dark:text-[#20C8E8] hover:underline"
                >
                  Open Inbox
                </Link>
              </div>
              <div className="max-h-64 overflow-y-auto py-1 space-y-1">
                {notifications.length === 0 ? (
                  <p className="px-3 py-6 text-center text-xs text-[#64748B] dark:text-slate-400">
                    You&apos;re all caught up. No unread notifications.
                  </p>
                ) : (
                  notifications.map((n: any) => (
                    <button
                      key={n.id}
                      type="button"
                      onClick={() => {
                        setNotifOpen(false);
                        router.push(ROUTES.INBOX);
                      }}
                      className="w-full text-left px-3 py-2 rounded-xl hover:bg-[#F7F8FC] dark:hover:bg-white/5 transition-colors"
                    >
                      <p className="text-xs font-semibold text-[#111827] dark:text-white truncate">
                        {n.title || n.type || 'Inbox update'}
                      </p>
                      {n.body && (
                        <p className="text-[11px] text-[#64748B] dark:text-slate-400 line-clamp-2 mt-0.5">
                          {n.body}
                        </p>
                      )}
                    </button>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        <Link
          href={ROUTES.HELP}
          aria-label="Help Center"
          title="Help & Documentation"
          className="hidden sm:flex w-9 h-9 rounded-xl border border-[#E7EAF2] dark:border-white/15 bg-white dark:bg-[#0F142B]/80 hover:bg-[#F1EBFF]/60 dark:hover:bg-[#7138F5]/20 text-[#64748B] dark:text-slate-300 hover:text-[#7138F5] dark:hover:text-white items-center justify-center transition-colors"
        >
          <HelpCircle className="w-4 h-4" />
        </Link>

        <ThemeToggle compact />

        <div className="h-5 w-px bg-[#E7EAF2] dark:bg-white/10 mx-0.5 hidden sm:block" />

        <UserMenu />
      </div>
    </header>
  );
}
