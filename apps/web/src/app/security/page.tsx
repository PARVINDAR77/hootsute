import React from 'react';
import type { Metadata } from 'next';
import { ShieldCheck, Lock, KeyRound, FileCheck2, Server } from 'lucide-react';
import { PublicNavbar } from '@/components/marketing/PublicNavbar';
import { PublicFooter } from '@/components/marketing/PublicFooter';

export const metadata: Metadata = {
  title: 'Security & Architecture — OmniSocial AI',
  description:
    'Multi-tenant workspace isolation, AES-256-GCM OAuth token encryption, rotating JWT refresh sessions, and immutable audit logging.',
};

const SECURITY_PILLARS = [
  {
    icon: Lock,
    title: 'AES-256-GCM OAuth Token Vault',
    body: 'Social access and refresh tokens are encrypted at rest with authenticated AES-256-GCM encryption and never returned to frontend API responses.',
  },
  {
    icon: ShieldCheck,
    title: 'Strict Workspace Isolation (Anti-IDOR)',
    body: 'Every workspace-scoped NestJS controller enforces JwtAuthGuard + WorkspaceAuthGuard and verifies role permissions directly against PostgreSQL.',
  },
  {
    icon: KeyRound,
    title: 'Rotating HttpOnly Refresh Sessions',
    body: 'Short-lived access tokens pair with SHA-256 hashed refresh sessions featuring automatic reuse detection that revokes compromised session families.',
  },
  {
    icon: FileCheck2,
    title: 'Snapshot Integrity & Audit Logs',
    body: 'Scheduled posts store immutable content snapshots with SHA-256 verification, and authentication, workspace, and approval events are recorded in audit_logs.',
  },
  {
    icon: Server,
    title: 'Rate Limiting & Strict Validation',
    body: 'NestJS global ValidationPipe strips unknown fields and enforces DTO schemas, while ThrottlerGuard protects auth and public endpoints from abuse.',
  },
];

export default function SecurityPage() {
  return (
    <div className="min-h-screen flex flex-col ambient-canvas">
      <PublicNavbar />
      <main className="flex-1 py-16 sm:py-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#F1EBFF] dark:bg-[#7138F5]/20 text-[#7138F5] dark:text-[#C4A5FF] text-xs font-bold">
              <ShieldCheck className="w-3.5 h-3.5" /> Enterprise-Ready Controls
            </span>
            <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-[#111827] dark:text-white">
              Security &amp; <span className="text-gradient">Tenant Isolation</span>
            </h1>
            <p className="text-base text-[#64748B] dark:text-slate-400">
              How OmniSocial AI protects multi-brand workspaces, team credentials, and social
              publishing pipelines.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {SECURITY_PILLARS.map((pillar) => {
              const Icon = pillar.icon;
              return (
                <div
                  key={pillar.title}
                  className="rounded-2xl p-6 bg-white dark:bg-[#0F142B]/90 border border-[#E7EAF2] dark:border-[#1E2749] shadow-soft dark:shadow-none space-y-3"
                >
                  <div className="w-11 h-11 rounded-xl bg-[#F1EBFF] dark:bg-[#7138F5]/20 text-[#7138F5] dark:text-[#C4A5FF] flex items-center justify-center">
                    <Icon className="w-5 h-5" />
                  </div>
                  <h2 className="text-lg font-bold text-[#111827] dark:text-white">
                    {pillar.title}
                  </h2>
                  <p className="text-sm text-[#64748B] dark:text-slate-400 leading-relaxed">
                    {pillar.body}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </main>
      <PublicFooter />
    </div>
  );
}
