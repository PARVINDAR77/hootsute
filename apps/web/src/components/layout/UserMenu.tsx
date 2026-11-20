'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useTheme } from '@/lib/theme-context';
import { LogOut, Settings, ChevronDown, Moon, Sun, CreditCard, Users } from 'lucide-react';
import { ROUTES } from '@/lib/constants';
import { Badge } from '../ui/Badge';
import { useRouter } from 'next/navigation';

export function UserMenu() {
  const { user, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEsc);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEsc);
    };
  }, []);

  if (!user) return null;

  const initials = user.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2.5 p-1 pr-2 rounded-xl hover:bg-[#F1EBFF]/70 dark:hover:bg-white/10 transition-colors"
      >
        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#7138F5] via-[#2878FF] to-[#20C8E8] text-white font-bold text-xs flex items-center justify-center shadow-glow-purple">
          {initials}
        </div>
        <div className="hidden md:flex flex-col text-left">
          <span className="text-xs font-bold text-[#111827] dark:text-white leading-tight">
            {user.name}
          </span>
          <span className="text-[10px] text-[#64748B] dark:text-slate-400">
            {user.email}
          </span>
        </div>
        <ChevronDown className="w-3.5 h-3.5 text-[#64748B] dark:text-slate-400" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-[#0F142B] rounded-2xl shadow-elevated dark:shadow-glow-card border border-[#E7EAF2] dark:border-[#7138F5]/30 p-1.5 z-50 animate-fadeIn">
          <div className="px-3 py-2.5 border-b border-[#E7EAF2] dark:border-white/10">
            <p className="text-xs font-bold text-[#111827] dark:text-white">{user.name}</p>
            <p className="text-xs text-[#64748B] dark:text-slate-400 truncate">{user.email}</p>
            <div className="mt-2">
              <Badge variant={user.role === 'SUPER_ADMIN' ? 'purple' : 'default'}>
                {user.role}
              </Badge>
            </div>
          </div>

          <div className="py-1 space-y-0.5">
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                router.push(ROUTES.SETTINGS);
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-[#111827] dark:text-slate-200 hover:bg-[#F1EBFF]/60 dark:hover:bg-white/10 rounded-xl transition-colors"
            >
              <Settings className="w-4 h-4 text-[#64748B] dark:text-slate-400" />
              Account &amp; Sessions
            </button>
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                router.push(ROUTES.SETTINGS_MEMBERS);
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-[#111827] dark:text-slate-200 hover:bg-[#F1EBFF]/60 dark:hover:bg-white/10 rounded-xl transition-colors"
            >
              <Users className="w-4 h-4 text-[#64748B] dark:text-slate-400" />
              Team &amp; Permissions
            </button>
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                router.push(ROUTES.SETTINGS_BILLING);
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-[#111827] dark:text-slate-200 hover:bg-[#F1EBFF]/60 dark:hover:bg-white/10 rounded-xl transition-colors"
            >
              <CreditCard className="w-4 h-4 text-[#64748B] dark:text-slate-400" />
              Billing &amp; Plan
            </button>
            <button
              type="button"
              onClick={() => {
                toggleTheme();
              }}
              className="w-full flex items-center justify-between px-3 py-2 text-xs font-medium text-[#111827] dark:text-slate-200 hover:bg-[#F1EBFF]/60 dark:hover:bg-white/10 rounded-xl transition-colors"
            >
              <span className="flex items-center gap-2.5">
                {isDark ? (
                  <Sun className="w-4 h-4 text-[#20C8E8]" />
                ) : (
                  <Moon className="w-4 h-4 text-[#7138F5]" />
                )}
                {isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              </span>
            </button>
          </div>

          <div className="pt-1 border-t border-[#E7EAF2] dark:border-white/10">
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                logout();
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-xl transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Sign out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
