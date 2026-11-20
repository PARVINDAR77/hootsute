'use client';

import React from 'react';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from '@/lib/theme-context';

export interface ThemeToggleProps {
  compact?: boolean;
  className?: string;
}

export function ThemeToggle({ compact = false, className = '' }: ThemeToggleProps) {
  const { isDark, toggleTheme } = useTheme();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
      title={isDark ? 'Switch to light theme' : 'Switch to dark cosmic theme'}
      className={`inline-flex items-center justify-center gap-2 rounded-xl border border-[#E7EAF2] dark:border-white/15 bg-white dark:bg-[#0F142B]/80 hover:bg-[#F1EBFF]/60 dark:hover:bg-[#7138F5]/20 text-[#64748B] dark:text-slate-300 hover:text-[#7138F5] dark:hover:text-white transition-all duration-200 ${
        compact ? 'w-9 h-9 p-0' : 'px-3 py-1.5 text-xs font-semibold'
      } ${className}`}
    >
      {isDark ? (
        <Sun className="w-4 h-4 text-[#20C8E8]" />
      ) : (
        <Moon className="w-4 h-4 text-[#7138F5]" />
      )}
      {!compact && <span>{isDark ? 'Light' : 'Dark'}</span>}
    </button>
  );
}
