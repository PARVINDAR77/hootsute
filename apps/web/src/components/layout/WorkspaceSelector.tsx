'use client';

import React from 'react';
import { Building2, ChevronDown, Sparkles } from 'lucide-react';

export function WorkspaceSelector() {
  return (
    <div className="relative group">
      <button className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 transition-colors text-left shadow-sm">
        <div className="w-6 h-6 rounded bg-indigo-100 text-indigo-700 flex items-center justify-center">
          <Building2 className="w-3.5 h-3.5" />
        </div>
        <div className="flex flex-col">
          <span className="text-xs font-semibold text-slate-800 leading-tight">
            Primary Organization
          </span>
          <span className="text-[10px] text-slate-400 font-medium">Default Workspace</span>
        </div>
        <ChevronDown className="w-3.5 h-3.5 text-slate-400 ml-1" />
      </button>

      {/* Tooltip explaining Stage 2 workspace feature */}
      <div className="absolute left-0 top-full mt-2 w-64 bg-slate-900 text-white p-3 rounded-lg text-xs shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 pointer-events-none">
        <div className="flex items-center gap-1.5 text-indigo-400 font-semibold mb-1">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Stage 2 Roadmap</span>
        </div>
        <p className="text-slate-300 text-[11px] leading-relaxed">
          Multi-tenancy and workspace switching will be enabled in Stage 2. Currently operating in root workspace.
        </p>
      </div>
    </div>
  );
}
