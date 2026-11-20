'use client';

import React from 'react';

export interface TabOption<T extends string = string> {
  id: T;
  label: string;
  icon?: React.ReactNode;
  badge?: string | number;
}

export interface TabsProps<T extends string = string> {
  options: TabOption<T>[];
  value: T;
  onChange: (value: T) => void;
  variant?: 'pill' | 'underline';
  className?: string;
}

export function Tabs<T extends string = string>({
  options,
  value,
  onChange,
  variant = 'pill',
  className = '',
}: TabsProps<T>) {
  if (variant === 'underline') {
    return (
      <div
        role="tablist"
        className={`flex items-center gap-1 border-b border-[#E7EAF2] dark:border-white/10 overflow-x-auto ${className}`}
      >
        {options.map((tab) => {
          const active = tab.id === value;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => onChange(tab.id)}
              className={`relative inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold whitespace-nowrap transition-colors ${
                active
                  ? 'text-[#7138F5] dark:text-white'
                  : 'text-[#64748B] dark:text-slate-400 hover:text-[#111827] dark:hover:text-slate-200'
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
              {tab.badge !== undefined && (
                <span
                  className={`px-1.5 py-0.5 text-[10px] font-bold rounded-full ${
                    active
                      ? 'bg-[#F1EBFF] dark:bg-[#7138F5]/30 text-[#7138F5] dark:text-[#C4A5FF]'
                      : 'bg-slate-100 dark:bg-white/10 text-slate-500 dark:text-slate-400'
                  }`}
                >
                  {tab.badge}
                </span>
              )}
              {active && (
                <span className="absolute bottom-0 left-2 right-2 h-0.5 rounded-full bg-gradient-to-r from-[#7138F5] via-[#2878FF] to-[#20C8E8]" />
              )}
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div
      role="tablist"
      className={`inline-flex items-center gap-1 p-1 rounded-xl bg-[#F7F8FC] dark:bg-[#0B1024] border border-[#E7EAF2] dark:border-[#1E2749] overflow-x-auto ${className}`}
    >
      {options.map((tab) => {
        const active = tab.id === value;
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(tab.id)}
            className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-semibold whitespace-nowrap transition-all ${
              active
                ? 'bg-gradient-to-r from-[#7138F5] to-[#2878FF] text-white shadow-glow-purple'
                : 'text-[#64748B] dark:text-slate-400 hover:text-[#111827] dark:hover:text-white'
            }`}
          >
            {tab.icon}
            <span>{tab.label}</span>
            {tab.badge !== undefined && (
              <span
                className={`px-1.5 py-0.5 text-[10px] font-bold rounded-full ${
                  active
                    ? 'bg-white/20 text-white'
                    : 'bg-slate-200/70 dark:bg-white/10 text-slate-600 dark:text-slate-300'
                }`}
              >
                {tab.badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
