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
  MessageSquare,
  Calendar,
  BarChart3,
  Settings,
  Shield,
} from 'lucide-react';
import { ROUTES } from '@/lib/constants';
import { useWorkspace } from '@/lib/workspace-context';

export function Sidebar() {
  const pathname = usePathname();
  const { currentWorkspace } = useWorkspace();

  const workspaceNav = [
    { name: 'Dashboard', href: ROUTES.DASHBOARD, icon: LayoutDashboard },
    { name: 'Social Accounts', href: ROUTES.SETTINGS_SOCIAL_ACCOUNTS, icon: Share2 },
    { name: 'Workspace Settings', href: ROUTES.SETTINGS_WORKSPACE, icon: Building2 },
    { name: 'Team Members', href: ROUTES.SETTINGS_MEMBERS, icon: Users },
    { name: 'Invitations', href: ROUTES.SETTINGS_INVITATIONS, icon: Mail },
  ];

  const futureNav = [
    { name: 'AI Marketing', icon: Sparkles, stage: 'Stage 4' },
    { name: 'WhatsApp Approval', icon: MessageSquare, stage: 'Stage 5' },
    { name: 'Scheduler & Posts', icon: Calendar, stage: 'Stage 6' },
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

        {/* Future Modules */}
        <div className="space-y-1">
          <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Social &amp; Campaigns
          </div>
          {futureNav.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.name}
                className="flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium text-slate-400 cursor-not-allowed group opacity-70"
                title={`${item.name} will be introduced in ${item.stage}`}
              >
                <div className="flex items-center gap-3">
                  <Icon className="w-4 h-4 text-slate-400" />
                  <span>{item.name}</span>
                </div>
                <span className="text-[9px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 border border-slate-200">
                  {item.stage}
                </span>
              </div>
            );
          })}
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
