'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useWorkspace } from '@/lib/workspace-context';
import { Building2, ChevronDown, Check, Plus } from 'lucide-react';
import Link from 'next/link';

export function WorkspaceSelector() {
  const { workspaces, currentWorkspace, switchWorkspace, isLoadingWorkspaces } = useWorkspace();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
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

  if (isLoadingWorkspaces) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-[#E7EAF2] dark:border-white/15 bg-white dark:bg-[#0F142B]/80 text-xs text-slate-400 animate-pulse">
        <Building2 className="w-3.5 h-3.5 text-slate-300 dark:text-slate-600" />
        <span>Loading workspaces...</span>
      </div>
    );
  }

  if (!workspaces || workspaces.length === 0) {
    return (
      <Link
        href="/onboarding/workspace"
        className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-dashed border-[#7138F5]/40 bg-[#F1EBFF]/70 dark:bg-[#7138F5]/15 hover:bg-[#F1EBFF] dark:hover:bg-[#7138F5]/25 text-[#7138F5] dark:text-[#C4A5FF] text-xs font-semibold transition-colors"
      >
        <Plus className="w-3.5 h-3.5" />
        <span>Create Workspace</span>
      </Link>
    );
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl border border-[#E7EAF2] dark:border-white/15 bg-white dark:bg-[#0F142B]/85 hover:border-[#7138F5]/40 dark:hover:border-[#7138F5]/50 transition-all text-left shadow-xs focus:outline-none focus:ring-2 focus:ring-[#7138F5]/25"
      >
        <div className="w-6 h-6 rounded-lg bg-gradient-to-tr from-[#7138F5] to-[#2878FF] text-white flex items-center justify-center shrink-0 shadow-xs">
          <Building2 className="w-3.5 h-3.5" />
        </div>
        <div className="flex flex-col max-w-[130px] sm:max-w-[170px]">
          <span className="text-xs font-bold text-[#111827] dark:text-white leading-tight truncate">
            {currentWorkspace?.name || 'Select Workspace'}
          </span>
          <span className="text-[10px] text-[#64748B] dark:text-slate-400 font-medium truncate">
            {currentWorkspace?.slug || 'No workspace selected'}
          </span>
        </div>
        {currentWorkspace?.currentUserRole && (
          <span className="hidden sm:inline-block text-[9px] uppercase tracking-wider font-bold px-1.5 py-0.5 rounded-md bg-[#F1EBFF] dark:bg-[#7138F5]/20 text-[#7138F5] dark:text-[#C4A5FF] border border-[#7138F5]/20">
            {currentWorkspace.currentUserRole}
          </span>
        )}
        <ChevronDown className="w-3.5 h-3.5 text-[#64748B] dark:text-slate-400 shrink-0 ml-0.5" />
      </button>

      {isOpen && (
        <div className="absolute left-0 mt-2 w-72 bg-white dark:bg-[#0F142B] rounded-2xl shadow-elevated dark:shadow-glow-card border border-[#E7EAF2] dark:border-[#7138F5]/30 p-1.5 z-50 animate-fadeIn">
          <div className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-[#64748B] dark:text-slate-400 border-b border-[#E7EAF2] dark:border-white/10">
            Your Workspaces ({workspaces.length})
          </div>

          <div className="py-1 max-h-60 overflow-y-auto space-y-0.5">
            {workspaces.map((ws) => {
              const isSelected = ws.id === currentWorkspace?.id;
              return (
                <button
                  type="button"
                  key={ws.id}
                  onClick={() => {
                    switchWorkspace(ws.id);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-left text-xs transition-colors ${
                    isSelected
                      ? 'bg-[#F1EBFF] dark:bg-[#7138F5]/20 text-[#7138F5] dark:text-white font-semibold'
                      : 'text-[#111827] dark:text-slate-200 hover:bg-[#F7F8FC] dark:hover:bg-white/5'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div
                      className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 ${
                        isSelected
                          ? 'bg-gradient-to-br from-[#7138F5] to-[#2878FF] text-white'
                          : 'bg-slate-100 dark:bg-white/10 text-slate-500 dark:text-slate-400'
                      }`}
                    >
                      <Building2 className="w-3 h-3" />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate font-semibold">{ws.name}</p>
                      <p className="text-[10px] text-[#64748B] dark:text-slate-400 truncate">
                        {ws.slug}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0 ml-2">
                    <span className="text-[9px] uppercase font-bold text-[#64748B] dark:text-slate-400">
                      {ws.currentUserRole}
                    </span>
                    {isSelected && (
                      <Check className="w-4 h-4 text-[#7138F5] dark:text-[#20C8E8]" />
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          <div className="pt-1 border-t border-[#E7EAF2] dark:border-white/10">
            <Link
              href="/onboarding/workspace"
              onClick={() => setIsOpen(false)}
              className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-[#7138F5] dark:text-[#C4A5FF] hover:bg-[#F1EBFF]/70 dark:hover:bg-[#7138F5]/15 rounded-xl transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Create New Workspace</span>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
