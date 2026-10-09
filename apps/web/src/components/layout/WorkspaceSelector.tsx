'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useWorkspace } from '@/lib/workspace-context';
import { Building2, ChevronDown, Check, Plus, Shield } from 'lucide-react';
import Link from 'next/link';
import { Badge } from '../ui/Badge';

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
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (isLoadingWorkspaces) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs text-slate-400 animate-pulse">
        <Building2 className="w-3.5 h-3.5 text-slate-300" />
        <span>Loading workspaces...</span>
      </div>
    );
  }

  if (!workspaces || workspaces.length === 0) {
    return (
      <Link
        href="/onboarding/workspace"
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-dashed border-indigo-300 bg-indigo-50/50 hover:bg-indigo-50 text-indigo-700 text-xs font-medium transition-colors"
      >
        <Plus className="w-3.5 h-3.5" />
        <span>Create Workspace</span>
      </Link>
    );
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 transition-colors text-left shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
      >
        <div className="w-6 h-6 rounded bg-gradient-to-tr from-indigo-600 to-indigo-500 text-white flex items-center justify-center shrink-0 shadow-xs">
          <Building2 className="w-3.5 h-3.5" />
        </div>
        <div className="flex flex-col max-w-[140px] sm:max-w-[180px]">
          <span className="text-xs font-semibold text-slate-800 leading-tight truncate">
            {currentWorkspace?.name || 'Select Workspace'}
          </span>
          <span className="text-[10px] text-slate-400 font-medium truncate">
            {currentWorkspace?.slug || 'No workspace selected'}
          </span>
        </div>
        {currentWorkspace?.currentUserRole && (
          <span className="text-[9px] uppercase tracking-wider font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200/80">
            {currentWorkspace.currentUserRole}
          </span>
        )}
        <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0 ml-0.5" />
      </button>

      {isOpen && (
        <div className="absolute left-0 mt-2 w-72 bg-white rounded-xl shadow-xl border border-slate-200/80 p-1.5 z-50 animate-fadeIn">
          <div className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100">
            Your Workspaces ({workspaces.length})
          </div>

          <div className="py-1 max-h-60 overflow-y-auto space-y-0.5">
            {workspaces.map((ws) => {
              const isSelected = ws.id === currentWorkspace?.id;
              return (
                <button
                  key={ws.id}
                  onClick={() => {
                    switchWorkspace(ws.id);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-left text-xs transition-colors ${
                    isSelected
                      ? 'bg-indigo-50/80 text-indigo-900 font-medium'
                      : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div
                      className={`w-5 h-5 rounded flex items-center justify-center shrink-0 ${
                        isSelected ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      <Building2 className="w-3 h-3" />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate font-semibold">{ws.name}</p>
                      <p className="text-[10px] text-slate-400 truncate">{ws.slug}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0 ml-2">
                    <span className="text-[9px] uppercase font-bold text-slate-400">
                      {ws.currentUserRole}
                    </span>
                    {isSelected && <Check className="w-4 h-4 text-indigo-600" />}
                  </div>
                </button>
              );
            })}
          </div>

          <div className="pt-1 border-t border-slate-100">
            <Link
              href="/onboarding/workspace"
              onClick={() => setIsOpen(false)}
              className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-indigo-600 hover:bg-indigo-50/80 rounded-lg transition-colors"
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
