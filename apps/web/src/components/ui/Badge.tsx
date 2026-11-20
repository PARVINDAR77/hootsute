import React from 'react';

export interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'purple' | 'info' | 'outline';
  className?: string;
}

export function Badge({ children, variant = 'default', className = '' }: BadgeProps) {
  const variants = {
    default:
      'bg-slate-100 text-slate-700 border-slate-200 dark:bg-white/10 dark:text-slate-200 dark:border-white/10',
    success:
      'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-300 dark:border-emerald-500/30',
    warning:
      'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/15 dark:text-amber-300 dark:border-amber-500/30',
    danger:
      'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-500/15 dark:text-rose-300 dark:border-rose-500/30',
    purple:
      'bg-[#F1EBFF] text-[#7138F5] border-[#7138F5]/20 dark:bg-[#7138F5]/20 dark:text-[#C4A5FF] dark:border-[#7138F5]/35',
    info:
      'bg-sky-50 text-[#2878FF] border-sky-200 dark:bg-[#20C8E8]/15 dark:text-[#20C8E8] dark:border-[#20C8E8]/30',
    outline:
      'border border-[#E7EAF2] dark:border-white/20 text-[#64748B] dark:text-slate-300 bg-transparent',
  };

  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${variants[variant]} ${className}`}
    >
      {children}
    </span>
  );
}
