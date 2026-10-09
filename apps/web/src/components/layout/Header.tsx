'use client';

import React from 'react';
import { WorkspaceSelector } from './WorkspaceSelector';
import { UserMenu } from './UserMenu';
import { ShieldCheck, ExternalLink } from 'lucide-react';
import Link from 'next/link';

export function Header() {
  return (
    <header className="h-16 border-b border-slate-200/80 bg-white/80 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-40">
      <div className="flex items-center gap-4">
        <WorkspaceSelector />
      </div>

      <div className="flex items-center gap-3">
        <a
          href="http://localhost:4000/api/docs"
          target="_blank"
          rel="noopener noreferrer"
          className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-600 hover:text-indigo-600 hover:border-indigo-200 transition-colors shadow-sm"
        >
          <ShieldCheck className="w-3.5 h-3.5 text-indigo-500" />
          <span>Swagger API Docs</span>
          <ExternalLink className="w-3 h-3 text-slate-400" />
        </a>

        <div className="h-5 w-px bg-slate-200 mx-1" />

        <UserMenu />
      </div>
    </header>
  );
}
