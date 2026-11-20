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
  Calendar,
  BarChart3,
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
  Webhook,
  X,
  Send,
  PanelLeftClose,
  PanelLeftOpen,
  Lightbulb,
} from 'lucide-react';
import { ROUTES } from '@/lib/constants';
import { useWorkspace } from '@/lib/workspace-context';
import { BrandLogo } from '@/components/ui/BrandLogo';

interface SidebarProps {
  mobileOpen?: boolean;
  onMobileClose?: () => void;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  exact?: boolean;
  adminOnly?: boolean;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

export function Sidebar({
  mobileOpen = false,
  onMobileClose,
  collapsed = false,
  onToggleCollapse,
}: SidebarProps) {
  const pathname = usePathname();
  const { currentWorkspace } = useWorkspace();
  const role = currentWorkspace?.currentUserRole;
  const isWorkspaceAdmin = !role || role === 'OWNER' || role === 'ADMIN';

  const sections: NavSection[] = [
    {
      title: 'Core',
      items: [
        { name: 'Dashboard', href: ROUTES.DASHBOARD, icon: LayoutDashboard, exact: true },
        { name: 'AI Studio', href: ROUTES.CONTENT_STUDIO, icon: Sparkles },
        { name: 'Content Calendar', href: ROUTES.CALENDAR, icon: Calendar },
        { name: 'Bulk Publish', href: ROUTES.BULK_PUBLISH, icon: Send },
        { name: 'Drafts & Approval', href: ROUTES.CONTENT_DRAFTS, icon: FileText },
        { name: 'Media Library', href: ROUTES.MEDIA, icon: ImageIcon },
      ],
    },
    {
      title: 'Growth & Insights',
      items: [
        { name: 'Analytics', href: ROUTES.ANALYTICS, icon: BarChart3, exact: true },
        { name: 'Growth Insights', href: ROUTES.ANALYTICS_INSIGHTS, icon: Lightbulb },
        { name: 'Social Inbox', href: ROUTES.INBOX, icon: Inbox },
        { name: 'Social Listening', href: ROUTES.LISTENING, icon: Radio },
        { name: 'Competitors', href: ROUTES.COMPETITORS, icon: Swords },
        { name: 'Executive Reports', href: ROUTES.REPORTS, icon: PieChart },
      ],
    },
    {
      title: 'Automation & Brand',
      items: [
        { name: 'Smart Workflows', href: ROUTES.AUTOMATIONS, icon: Zap },
        { name: 'Link Shortener', href: ROUTES.LINKS, icon: Link2 },
        { name: 'Brand Kit', href: ROUTES.BRAND_KIT, icon: Palette },
        { name: 'Inbox Moderation', href: ROUTES.SETTINGS_INBOX_MODERATION, icon: ShieldAlert },
        { name: 'Webhooks', href: ROUTES.SETTINGS_WEBHOOKS, icon: Webhook },
      ],
    },
    {
      title: 'Workspace',
      items: [
        { name: 'Social Accounts', href: ROUTES.SETTINGS_SOCIAL_ACCOUNTS, icon: Share2 },
        { name: 'Team Members', href: ROUTES.SETTINGS_MEMBERS, icon: Users },
        { name: 'Invitations', href: ROUTES.SETTINGS_INVITATIONS, icon: Mail },
        { name: 'Billing & Plan', href: ROUTES.SETTINGS_BILLING, icon: CreditCard, adminOnly: true },
        { name: 'White-Label Portal', href: ROUTES.SETTINGS_WHITE_LABEL, icon: Globe, adminOnly: true },
        { name: 'Workspace Settings', href: ROUTES.SETTINGS_WORKSPACE, icon: Building2 },
        { name: 'Account & Security', href: ROUTES.SETTINGS, icon: Shield, exact: true },
      ],
    },
  ];

  const isRouteActive = (href: string, exact?: boolean) => {
    if (exact) return pathname === href;
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  const renderSidebar = (isMobile = false) => {
    const isCompact = !isMobile && collapsed;

    return (
      <aside
        className={`${
          isCompact ? 'w-[78px]' : 'w-[260px]'
        } h-screen sticky top-0 border-r border-[#E7EAF2] dark:border-[#1E2749] bg-white/95 dark:bg-[#090D20]/95 backdrop-blur-xl flex flex-col shrink-0 select-none transition-[width] duration-200`}
      >
        {/* Brand header */}
        <div
          className={`h-16 ${
            isCompact ? 'px-3 justify-center' : 'px-4 justify-between'
          } flex items-center border-b border-[#E7EAF2]/80 dark:border-white/10 shrink-0`}
        >
          <Link
            href={ROUTES.DASHBOARD}
            onClick={onMobileClose}
            className="flex items-center group min-w-0"
            title="OmniSocial AI Dashboard"
          >
            <BrandLogo
              collapsed={isCompact}
              subtitle={isCompact ? undefined : 'AI Social Command'}
            />
          </Link>

          {isMobile && onMobileClose ? (
            <button
              type="button"
              onClick={onMobileClose}
              className="p-1.5 rounded-xl text-[#64748B] hover:text-[#111827] dark:text-slate-400 dark:hover:text-white hover:bg-[#F7F8FC] dark:hover:bg-white/10 transition-colors"
              aria-label="Close navigation"
            >
              <X className="w-4 h-4" />
            </button>
          ) : (
            !isCompact &&
            onToggleCollapse && (
              <button
                type="button"
                onClick={onToggleCollapse}
                title="Collapse sidebar"
                aria-label="Collapse sidebar"
                className="p-1.5 rounded-lg text-[#64748B] dark:text-slate-400 hover:text-[#7138F5] dark:hover:text-white hover:bg-[#F1EBFF]/70 dark:hover:bg-white/10 transition-colors"
              >
                <PanelLeftClose className="w-4 h-4" />
              </button>
            )
          )}
        </div>

        {/* Expand button when collapsed */}
        {isCompact && onToggleCollapse && (
          <div className="px-3 pt-3 flex justify-center">
            <button
              type="button"
              onClick={onToggleCollapse}
              title="Expand sidebar"
              aria-label="Expand sidebar"
              className="w-10 h-9 rounded-xl flex items-center justify-center text-[#64748B] dark:text-slate-400 hover:text-[#7138F5] dark:hover:text-white hover:bg-[#F1EBFF]/70 dark:hover:bg-white/10 transition-colors"
            >
              <PanelLeftOpen className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Scrollable navigation */}
        <nav className="flex-1 px-2.5 py-4 space-y-5 overflow-y-auto">
          {sections.map((section) => {
            const visibleItems = section.items.filter(
              (item) => !item.adminOnly || isWorkspaceAdmin,
            );
            if (visibleItems.length === 0) return null;

            return (
              <div key={section.title} className="space-y-1">
                {!isCompact ? (
                  <div className="px-3 pb-1 text-[10px] font-bold uppercase tracking-widest text-[#64748B]/80 dark:text-slate-500">
                    {section.title}
                  </div>
                ) : (
                  <div className="mx-3 my-2 border-t border-[#E7EAF2] dark:border-white/10" />
                )}

                {visibleItems.map((item) => {
                  const active = isRouteActive(item.href, item.exact);
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={onMobileClose}
                      title={isCompact ? item.name : undefined}
                      className={`group relative flex items-center ${
                        isCompact ? 'justify-center px-2 py-2.5' : 'gap-3 px-3 py-2.5'
                      } rounded-xl text-[13px] transition-all duration-150 ${
                        active
                          ? 'bg-gradient-to-r from-[#7138F5] to-[#2878FF] text-white font-semibold shadow-glow-purple'
                          : 'text-[#64748B] dark:text-slate-300 font-medium hover:text-[#111827] dark:hover:text-white hover:bg-[#F1EBFF]/60 dark:hover:bg-white/[0.07]'
                      }`}
                    >
                      <Icon
                        className={`w-4 h-4 shrink-0 transition-colors ${
                          active
                            ? 'text-white'
                            : 'text-[#64748B] dark:text-slate-400 group-hover:text-[#7138F5] dark:group-hover:text-[#20C8E8]'
                        }`}
                      />
                      {!isCompact && <span className="truncate">{item.name}</span>}
                    </Link>
                  );
                })}
              </div>
            );
          })}
        </nav>

        {/* Workspace Status Footer */}
        <div className="p-3 border-t border-[#E7EAF2]/80 dark:border-white/10 shrink-0 bg-[#F7F8FC]/70 dark:bg-white/[0.02]">
          <div
            className={`p-2 rounded-xl bg-white dark:bg-[#0F142B] border border-[#E7EAF2] dark:border-[#1E2749] flex items-center ${
              isCompact ? 'justify-center' : 'gap-2.5'
            }`}
            title={
              currentWorkspace
                ? `${currentWorkspace.name} (${currentWorkspace.currentUserRole || 'Member'})`
                : 'No Workspace'
            }
          >
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#7138F5] via-[#2878FF] to-[#20C8E8] text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-xs">
              {currentWorkspace ? currentWorkspace.name.charAt(0).toUpperCase() : 'O'}
            </div>
            {!isCompact && (
              <div className="flex flex-col min-w-0 flex-1">
                <span className="text-xs font-bold text-[#111827] dark:text-white truncate">
                  {currentWorkspace ? currentWorkspace.name : 'No Workspace'}
                </span>
                <span className="text-[10px] text-[#64748B] dark:text-slate-400 font-semibold flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
                  {currentWorkspace?.currentUserRole || 'Member'}
                </span>
              </div>
            )}
          </div>
        </div>
      </aside>
    );
  };

  return (
    <>
      {/* Desktop sidebar */}
      <div className="hidden lg:block">{renderSidebar(false)}</div>

      {/* Mobile slide-over drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-[#070A18]/60 backdrop-blur-sm"
            onClick={onMobileClose}
          />
          <div className="relative z-10">{renderSidebar(true)}</div>
        </div>
      )}
    </>
  );
}
