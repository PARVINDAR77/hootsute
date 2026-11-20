import React from 'react';
import { Cpu, Mail, Rocket, Brain, Crown, Sparkles } from 'lucide-react';
import { ORDERED_PLATFORMS, PlatformBadge } from '@/components/ui/PlatformBadge';

export function AICubeVisual() {
  return (
    <div className="relative w-full max-w-sm mx-auto aspect-square flex items-center justify-center">
      <div className="absolute inset-6 rounded-full bg-gradient-to-tr from-[#7138F5]/35 via-[#2878FF]/30 to-[#20C8E8]/30 blur-3xl animate-pulseGlow" />
      <div className="relative w-56 h-56 rounded-[36px] bg-gradient-to-br from-[#1B2452] via-[#12183A] to-[#0A0F24] border-2 border-[#7138F5]/60 shadow-glow-purple flex flex-col items-center justify-center animate-floatSlow">
        <div className="absolute inset-3 rounded-[26px] border border-[#20C8E8]/30" />
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#7138F5] via-[#2878FF] to-[#20C8E8] flex items-center justify-center text-white shadow-glow-blue mb-3">
          <Cpu className="w-8 h-8" />
        </div>
        <span className="text-3xl font-black tracking-tight text-white">AI</span>
        <span className="text-[11px] font-semibold uppercase tracking-widest text-[#20C8E8] mt-1">
          Multi-Tenant Core
        </span>
      </div>
    </div>
  );
}

export function ContactEnvelopeVisual() {
  return (
    <div className="relative w-full max-w-sm mx-auto aspect-square flex items-center justify-center">
      <div className="absolute inset-6 rounded-full bg-gradient-to-tr from-[#7138F5]/35 via-[#2878FF]/30 to-[#20C8E8]/35 blur-3xl animate-pulseGlow" />
      <div className="relative w-60 h-44 rounded-3xl bg-gradient-to-br from-[#1B2452] via-[#12183A] to-[#0A0F24] border-2 border-[#20C8E8]/55 shadow-glow-blue flex flex-col items-center justify-center animate-floatSlow">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#7138F5] via-[#2878FF] to-[#20C8E8] flex items-center justify-center text-white shadow-glow-cyan">
          <Mail className="w-8 h-8" />
        </div>
        <p className="mt-3 text-xs font-bold tracking-wide text-white">
          Direct Engineering &amp; Sales Desk
        </p>
        <p className="text-[11px] text-[#20C8E8] mt-0.5">Persisted to PostgreSQL</p>
      </div>
    </div>
  );
}

export function PlatformCloudVisual() {
  return (
    <div className="relative w-full max-w-md mx-auto py-6">
      <div className="pointer-events-none absolute inset-4 rounded-full bg-gradient-to-r from-[#7138F5]/25 via-[#2878FF]/25 to-[#20C8E8]/25 blur-3xl" />
      <div className="relative rounded-3xl p-6 bg-gradient-to-br from-[#0F142B] to-[#131B3E] border border-[#7138F5]/40 shadow-glow-card">
        <div className="grid grid-cols-4 gap-3.5">
          {ORDERED_PLATFORMS.map((platform) => (
            <div
              key={platform}
              className="flex flex-col items-center justify-center p-3 rounded-2xl bg-white/[0.06] border border-white/10 hover:border-[#20C8E8]/50 hover:-translate-y-1 transition-all"
            >
              <PlatformBadge platform={platform} variant="icon" size="md" />
            </div>
          ))}
        </div>
        <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-xs text-slate-300">
          <span className="flex items-center gap-1.5 font-semibold">
            <Sparkles className="w-3.5 h-3.5 text-[#20C8E8]" />8 Native OAuth Channels
          </span>
          <span className="text-[11px] text-[#20C8E8] font-bold">AES-256-GCM Tokens</span>
        </div>
      </div>
    </div>
  );
}

export function AIBrainVisual() {
  return (
    <div className="relative rounded-3xl p-6 bg-gradient-to-br from-[#0F142B] via-[#171E45] to-[#0A0F24] border border-[#7138F5]/40 shadow-glow-card flex flex-col items-center justify-center text-center overflow-hidden">
      <div className="pointer-events-none absolute -top-10 -right-10 w-36 h-36 rounded-full bg-[#20C8E8]/25 blur-2xl" />
      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#7138F5] via-[#2878FF] to-[#20C8E8] flex items-center justify-center text-white shadow-glow-purple mb-3 animate-floatSlow">
        <Brain className="w-8 h-8" />
      </div>
      <p className="text-sm font-bold text-white">Gemini AI Content Engine</p>
      <p className="text-xs text-slate-300 mt-1 max-w-[220px]">
        Generates tailored multi-platform variants calibrated to your Brand Kit voice.
      </p>
    </div>
  );
}

export function BulkRocketVisual() {
  return (
    <div className="relative rounded-3xl p-6 bg-gradient-to-br from-[#0F142B] via-[#171E45] to-[#0A0F24] border border-[#2878FF]/40 shadow-glow-blue flex flex-col items-center justify-center text-center overflow-hidden">
      <div className="pointer-events-none absolute -bottom-10 -left-10 w-36 h-36 rounded-full bg-[#7138F5]/30 blur-2xl" />
      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#7138F5] via-[#2878FF] to-[#20C8E8] flex items-center justify-center text-white shadow-glow-cyan mb-3 animate-floatSlow">
        <Rocket className="w-8 h-8" />
      </div>
      <p className="text-sm font-bold text-white">Multi-Account Bulk Launch</p>
      <p className="text-xs text-slate-300 mt-1 max-w-[220px]">
        Publish immediately, schedule globally, or stagger delivery across approved drafts.
      </p>
    </div>
  );
}

export function PricingCrownBadge() {
  return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-[#7138F5] to-[#2878FF] text-white text-xs font-bold shadow-glow-purple">
      <Crown className="w-3.5 h-3.5" />
      Most Popular
    </span>
  );
}
