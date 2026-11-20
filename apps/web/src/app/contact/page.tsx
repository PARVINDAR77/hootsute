'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Mail,
  Building2,
  MessageSquare,
  Send,
  CheckCircle2,
  ShieldCheck,
  Clock,
  Sparkles,
  Lock,
  Globe,
  Radio,
  HelpCircle,
  ArrowRight,
  Phone,
  Copy,
  Check,
  ExternalLink,
  Calendar,
  Zap,
  Users,
  Activity,
  FileCheck,
  Headphones,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { PublicNavbar } from '@/components/marketing/PublicNavbar';
import { PublicFooter } from '@/components/marketing/PublicFooter';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';
import { apiClient, unwrapData } from '@/lib/api-client';
import { ROUTES } from '@/lib/constants';

interface DepartmentDesk {
  id: string;
  name: string;
  tagline: string;
  email: string;
  phone: string;
  sla: string;
  icon: React.ElementType;
  gradient: string;
  badge: string;
  badgeColor: string;
  details: string[];
}

const DEPARTMENT_DESKS: DepartmentDesk[] = [
  {
    id: 'sales',
    name: 'Enterprise Sales & Custom Quotas',
    tagline: 'Tailored multi-brand contracts, custom AI generation limits, and volume billing.',
    email: 'sales@omnisocial.ai',
    phone: '+1 (888) 492-6664',
    sla: 'Guaranteed response < 1 hour',
    icon: Building2,
    gradient: 'from-[#7138F5] to-[#2878FF]',
    badge: 'Enterprise Desk',
    badgeColor: 'bg-[#7138F5]/10 text-[#7138F5] dark:text-[#C4A5FF] border-[#7138F5]/20',
    details: [
      'Custom channel quotas & dedicated storage bandwidth',
      'Consolidated multi-workspace invoicing & PO terms',
      'Private cloud / single-tenant deployment consultations',
    ],
  },
  {
    id: 'support',
    name: '24/7 Technical Support & Dispatch',
    tagline: 'Direct tier-3 systems engineers for API dispatch, OAuth sync, and queue recovery.',
    email: 'support@omnisocial.ai',
    phone: '+1 (888) 492-4357',
    sla: '24/7/365 priority response (< 15 mins)',
    icon: Headphones,
    gradient: 'from-[#20C8E8] to-[#7138F5]',
    badge: '24/7 Helpdesk',
    badgeColor: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
    details: [
      'Official Graph API token re-authentication assistance',
      'Publishing dispatcher queue diagnostics & retry tracing',
      'Multi-user RBAC and workspace access troubleshooting',
    ],
  },
  {
    id: 'security',
    name: 'Security, Compliance & Legal Desk',
    tagline: 'Formal SOC-2 Type II audit reports, custom NDAs, and Data Processing Addendums.',
    email: 'security@omnisocial.ai',
    phone: '+1 (415) 890-3420',
    sla: 'Same-day compliance turnaround',
    icon: ShieldCheck,
    gradient: 'from-[#8B5CF6] to-[#20C8E8]',
    badge: 'SOC-2 & Legal',
    badgeColor: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
    details: [
      'SOC-2 Type II, ISO 27001, and GDPR compliance validation',
      'Mutual NDA signing before technical architecture reviews',
      'Vendor risk assessment questionnaires (CAIQ, SIG, VSAQ)',
    ],
  },
  {
    id: 'partners',
    name: 'Agency Partner Program & API Alliances',
    tagline: 'White-label client portals, revenue-share tiers, and custom developer webhooks.',
    email: 'partners@omnisocial.ai',
    phone: '+1 (415) 890-3420',
    sla: 'Response within 4 business hours',
    icon: Users,
    gradient: 'from-[#2878FF] to-[#8B5CF6]',
    badge: 'Agency Partner',
    badgeColor: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
    details: [
      'Multi-client agency tenant onboarding & co-branding',
      'Custom REST API webhook feeds & analytics exports',
      'Tiered agency discounts and certified consultant perks',
    ],
  },
];

const CONTACT_FAQS = [
  {
    question: 'How fast will an enterprise solutions engineer reach out to us?',
    answer:
      'All enterprise and security inquiries receive an automated acknowledgment within 5 minutes and a direct response from a dedicated systems engineer within 1 to 2 business hours. For emergency production issues, existing Enterprise clients have 24/7 hotlines with a sub-15-minute SLA.',
  },
  {
    question: 'Can your team execute a mutual NDA before our technical demo?',
    answer:
      'Yes. Our legal team can countersign your company’s standard non-disclosure agreement (NDA) or provide our pre-approved mutual NDA within 24 hours. Contact security@omnisocial.ai or select "Custom OAuth & Security Audit" in the form above.',
  },
  {
    question: 'Do you offer dedicated Slack or Microsoft Teams channels?',
    answer:
      'Yes. Growth Pro annual and Enterprise Scale clients receive a shared Slack Connect or Microsoft Teams channel directly linking your social media directors to our solutions architects and platform reliability engineers.',
  },
  {
    question: 'Can we connect more than 100 social media accounts across multiple brands?',
    answer:
      'Absolutely. Our multi-tenant architecture was engineered specifically for agencies and multi-brand conglomerates. We support unlimited workspaces, custom brand kit isolation, and pooled or per-workspace account allocation.',
  },
  {
    question: 'What security standards protect our OAuth credentials and media assets?',
    answer:
      'All OAuth 2.0 refresh tokens are encrypted at rest using AES-256-GCM envelope encryption. Database connections are strictly SSL-enforced, and all publishing actions are recorded in immutable audit logs. We comply fully with GDPR, CCPA, and SOC-2 Type II standards.',
  },
  {
    question: 'What payment and procurement methods are supported for Enterprise?',
    answer:
      'In addition to credit card billing via Stripe, Enterprise clients can pay via ACH, wire transfer, and NET-30 invoicing with formal Purchase Orders (PO) and vendor setup packets.',
  },
];

export default function ContactPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [company, setCompany] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [selectedDept, setSelectedDept] = useState('sales');
  const [selectedScale, setSelectedScale] = useState('6-15 Accounts');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submittedId, setSubmittedId] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  const quickSubjects = [
    'Enterprise Plan & Custom Quotas',
    'Custom OAuth & Security Audit',
    'Multi-Workspace Agency Setup',
    '24/7 Technical Support',
    'Agency Partner Program',
    'General Platform Inquiry',
  ];

  const scaleOptions = [
    '1 - 5 Accounts (Starter)',
    '6 - 15 Accounts (Growth)',
    '16 - 50 Accounts (Agency)',
    '50+ Accounts (Enterprise Scale)',
  ];

  const copyToClipboard = (text: string, key: string) => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 2200);
    }
  };

  const handleSelectDepartment = (deptId: string) => {
    setSelectedDept(deptId);
    const desk = DEPARTMENT_DESKS.find((d) => d.id === deptId);
    if (desk) {
      setSubject(`Inquiry for ${desk.name}`);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (name.trim().length < 2) {
      setError('Please enter your full name (at least 2 characters).');
      return;
    }
    if (!email.includes('@')) {
      setError('Please enter a valid work email address.');
      return;
    }
    if (subject.trim().length < 3) {
      setError('Please enter a subject (at least 3 characters).');
      return;
    }
    if (message.trim().length < 10) {
      setError('Please provide a message of at least 10 characters.');
      return;
    }

    setIsSubmitting(true);
    try {
      // Enrich message with operational metadata
      const enrichedMessage = `[Department: ${selectedDept.toUpperCase()} | Footprint: ${selectedScale}]\n\n${message.trim()}`;

      const res = await apiClient<any>('/public/contact', {
        method: 'POST',
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          company: company.trim() || undefined,
          subject: subject.trim(),
          message: enrichedMessage,
        }),
      });

      const data = unwrapData<any>(res);
      setSubmittedId(data?.inquiry?.id || 'inq-' + Math.floor(100000 + Math.random() * 900000));
      setName('');
      setEmail('');
      setCompany('');
      setSubject('');
      setMessage('');
    } catch (err: any) {
      setError(err?.message || 'Unable to submit your inquiry right now. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col ambient-canvas">
      <PublicNavbar />

      <main className="flex-1 py-14 sm:py-20 relative overflow-hidden">
        {/* Background Ambient Cosmic Glows */}
        <div className="absolute top-10 left-1/4 w-[650px] h-[650px] bg-[#7138F5]/10 rounded-full blur-[180px] pointer-events-none" />
        <div className="absolute top-1/2 right-10 w-[550px] h-[550px] bg-[#20C8E8]/10 rounded-full blur-[160px] pointer-events-none" />
        <div className="absolute bottom-20 left-10 w-96 h-96 bg-[#2878FF]/10 rounded-full blur-[140px] pointer-events-none" />

        {/* Cybernetic Dot Matrix Backdrop */}
        <div
          className="absolute inset-0 opacity-[0.03] dark:opacity-[0.06] pointer-events-none"
          style={{
            backgroundImage:
              'radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)',
            backgroundSize: '32px 32px',
          }}
        />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16 sm:space-y-24 relative">
          {/* ========================================================= */}
          {/* Section 1: Hero Header & System Telemetry                 */}
          {/* ========================================================= */}
          <div className="text-center max-w-4xl mx-auto space-y-6">
            {/* Top Status & SLA Badge */}
            <div className="inline-flex flex-wrap items-center justify-center gap-2 px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest bg-white/80 dark:bg-[#0D122B]/90 border border-slate-200 dark:border-[#1E2749] shadow-soft backdrop-blur-md">
              <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>All 8 Social APIs Operational</span>
              </span>
              <span className="text-slate-300 dark:text-slate-700">•</span>
              <span className="text-slate-600 dark:text-slate-300">
                99.99% Guaranteed SLA Uptime
              </span>
              <span className="text-slate-300 dark:text-slate-700 hidden sm:inline">•</span>
              <span className="text-[#7138F5] dark:text-[#C4A5FF] hidden sm:inline">
                Global Response Desk
              </span>
            </div>

            <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-slate-900 dark:text-white leading-[1.12]">
              Let&apos;s Scale Your{' '}
              <span className="bg-gradient-to-r from-[#7138F5] via-[#2878FF] to-[#20C8E8] bg-clip-text text-transparent">
                Social Operations
              </span>
            </h1>

            <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto leading-relaxed">
              Connect directly with our specialized solutions engineers. Whether you need custom
              channel quotas, SOC-2 compliance audits, or multi-brand agency setups, our team
              responds within 2 hours.
            </p>

            {/* Telemetry Stat Ribbons */}
            <div className="pt-2 grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 max-w-3xl mx-auto">
              <div className="p-3.5 rounded-2xl bg-white/70 dark:bg-[#0D122B]/70 border border-slate-200/80 dark:border-white/10 backdrop-blur-sm text-center">
                <div className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white">
                  &lt; 15 Min
                </div>
                <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 mt-0.5">
                  Priority Enterprise SLA
                </div>
              </div>
              <div className="p-3.5 rounded-2xl bg-white/70 dark:bg-[#0D122B]/70 border border-slate-200/80 dark:border-white/10 backdrop-blur-sm text-center">
                <div className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white">
                  24/7/365
                </div>
                <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 mt-0.5">
                  Follow-the-Sun Support
                </div>
              </div>
              <div className="p-3.5 rounded-2xl bg-white/70 dark:bg-[#0D122B]/70 border border-slate-200/80 dark:border-white/10 backdrop-blur-sm text-center">
                <div className="text-lg sm:text-xl font-extrabold text-emerald-600 dark:text-emerald-400">
                  SOC-2 Type II
                </div>
                <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 mt-0.5">
                  Certified &amp; Encrypted
                </div>
              </div>
              <div className="p-3.5 rounded-2xl bg-white/70 dark:bg-[#0D122B]/70 border border-slate-200/80 dark:border-white/10 backdrop-blur-sm text-center">
                <div className="text-lg sm:text-xl font-extrabold text-[#7138F5] dark:text-[#C4A5FF]">
                  8 Networks
                </div>
                <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 mt-0.5">
                  Direct Official APIs
                </div>
              </div>
            </div>
          </div>

          {/* ========================================================= */}
          {/* Section 2: Specialized Department Desks (4 Cards)        */}
          {/* ========================================================= */}
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-[#7138F5] dark:text-[#C4A5FF]">
                  Specialized Communication Channels
                </span>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white mt-1">
                  Connect Directly with the Right Engineering Desk
                </h2>
              </div>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-md">
                Every department is staffed by dedicated engineers with direct access to production
                dispatch infrastructure.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
              {DEPARTMENT_DESKS.map((desk) => {
                const Icon = desk.icon;
                const isSelected = selectedDept === desk.id;
                return (
                  <div
                    key={desk.id}
                    onClick={() => handleSelectDepartment(desk.id)}
                    className={`group relative rounded-3xl p-6 transition-all duration-300 cursor-pointer flex flex-col justify-between border backdrop-blur-xl ${isSelected
                      ? 'bg-gradient-to-b from-white/95 to-slate-50/90 dark:from-[#131A3D]/95 dark:to-[#0D122B]/95 border-[#7138F5] shadow-glow-purple -translate-y-1'
                      : 'bg-white/80 dark:bg-[#0D122B]/80 border-slate-200/80 dark:border-white/10 hover:border-[#7138F5]/50 hover:shadow-soft dark:hover:shadow-none hover:-translate-y-0.5'
                      }`}
                  >
                    {/* Specular Rim */}
                    <div
                      className={`absolute top-0 inset-x-0 h-1 rounded-t-3xl transition-opacity ${isSelected
                        ? 'bg-gradient-to-r from-[#7138F5] via-[#20C8E8] to-[#7138F5] opacity-100'
                        : 'bg-gradient-to-r from-transparent via-[#7138F5]/40 to-transparent opacity-0 group-hover:opacity-100'
                        }`}
                    />

                    <div className="space-y-4">
                      {/* Top Header */}
                      <div className="flex items-start justify-between gap-2">
                        <div
                          className={`w-11 h-11 rounded-2xl bg-gradient-to-br ${desk.gradient} flex items-center justify-center text-white shadow-md shrink-0`}
                        >
                          <Icon className="w-5 h-5" />
                        </div>
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider border ${desk.badgeColor}`}
                        >
                          {desk.badge}
                        </span>
                      </div>

                      {/* Title & Tagline */}
                      <div>
                        <h3 className="text-base font-extrabold text-slate-900 dark:text-white group-hover:text-[#7138F5] dark:group-hover:text-[#C4A5FF] transition-colors">
                          {desk.name}
                        </h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                          {desk.tagline}
                        </p>
                      </div>

                      {/* Department Capabilities */}
                      <ul className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-white/10">
                        {desk.details.map((detail, idx) => (
                          <li
                            key={idx}
                            className="text-[11px] text-slate-600 dark:text-slate-300 flex items-start gap-1.5"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                            <span>{detail}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Contact Actions */}
                    <div className="pt-5 mt-5 border-t border-slate-100 dark:border-white/10 space-y-2">
                      {/* Email Row */}
                      <div className="flex items-center justify-between gap-1 text-xs">
                        <a
                          href={`mailto:${desk.email}`}
                          onClick={(e) => e.stopPropagation()}
                          className="font-bold text-slate-900 dark:text-white hover:text-[#7138F5] dark:hover:text-[#C4A5FF] transition-colors truncate"
                        >
                          {desk.email}
                        </a>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            copyToClipboard(desk.email, `email-${desk.id}`);
                          }}
                          className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-white/10 text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
                          title="Copy Email"
                        >
                          {copiedKey === `email-${desk.id}` ? (
                            <Check className="w-3.5 h-3.5 text-emerald-500" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>

                      {/* Phone Row */}
                      <div className="flex items-center justify-between gap-1 text-xs text-slate-500 dark:text-slate-400">
                        <a
                          href={`tel:${desk.phone.replace(/[^0-9+]/g, '')}`}
                          onClick={(e) => e.stopPropagation()}
                          className="font-mono hover:text-slate-900 dark:hover:text-white transition-colors flex items-center gap-1.5"
                        >
                          <Phone className="w-3 h-3 text-slate-400" />
                          <span>{desk.phone}</span>
                        </a>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            copyToClipboard(desk.phone, `phone-${desk.id}`);
                          }}
                          className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-white/10 text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
                          title="Copy Phone"
                        >
                          {copiedKey === `phone-${desk.id}` ? (
                            <Check className="w-3.5 h-3.5 text-emerald-500" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>

                      {/* SLA Indicator */}
                      <div className="pt-1 flex items-center gap-1 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                        <Clock className="w-3 h-3 shrink-0" />
                        <span className="truncate">{desk.sla}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ========================================================= */}
          {/* Section 3: Interactive Form + Global Offices Grid        */}
          {/* ========================================================= */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-start">
            {/* Left Column (5 Cols): Global Offices & Meeting Walkthrough */}
            <div className="lg:col-span-5 space-y-6">
              {/* Meeting Scheduler Card */}
              <div className="relative rounded-3xl p-7 bg-gradient-to-br from-[#7138F5]/10 via-[#2878FF]/10 to-[#20C8E8]/10 border border-[#7138F5]/30 shadow-soft backdrop-blur-xl space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#7138F5] to-[#20C8E8] flex items-center justify-center text-white shadow-md">
                    <Calendar className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#7138F5] dark:text-[#C4A5FF]">
                      Live Architecture Session
                    </span>
                    <h3 className="text-lg font-black text-slate-900 dark:text-white">
                      Book a 20-Minute Walkthrough
                    </h3>
                  </div>
                </div>

                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  Screen-share directly with a Principal Solutions Engineer. We will review your
                  existing social footprints, audit API rate limitations, and architect custom
                  multi-account publishing workflows.
                </p>

                <div className="pt-1">
                  <a
                    href="mailto:sales@omnisocial.ai?subject=Request%20Architecture%20Demo%20Walkthrough"
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs btn-gradient shadow-glow-purple hover:scale-[1.02] transition-transform"
                  >
                    <Calendar className="w-4 h-4" />
                    <span>Request Demo Invitation</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>

              {/* Enterprise Support & SLA Guarantee Card */}
              <div className="rounded-3xl p-7 bg-white/90 dark:bg-[#0D122B]/90 backdrop-blur-xl border border-slate-200 dark:border-[#1E2749] shadow-soft space-y-6">
                <div>
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">
                      Enterprise SLA Guarantees
                    </h3>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                      99.99% Backed
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Priority commitments backing all Growth Pro and Enterprise Scale workspaces.
                  </p>
                </div>

                <div className="space-y-3.5">
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200/80 dark:border-white/10 flex items-start gap-3.5">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#7138F5] to-[#2878FF] flex items-center justify-center text-white shadow-sm shrink-0">
                      <Clock className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                        &lt; 15-Minute Priority Response
                      </h4>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                        Direct tier-3 on-call systems engineers for publishing queue escalations.
                      </p>
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200/80 dark:border-white/10 flex items-start gap-3.5">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#20C8E8] to-[#7138F5] flex items-center justify-center text-white shadow-sm shrink-0">
                      <Radio className="w-4 h-4 animate-pulse" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                        24/7/365 Queue Monitoring
                      </h4>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                        Automated health sweep sweeps across all 8 official partner social APIs.
                      </p>
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200/80 dark:border-white/10 flex items-start gap-3.5">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#8B5CF6] to-[#20C8E8] flex items-center justify-center text-white shadow-sm shrink-0">
                      <MessageSquare className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                        Dedicated Slack &amp; Teams Connect
                      </h4>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                        Private shared channels linking your marketing directors to our solutions architects.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Security Guarantee Footnote */}
                <div className="pt-3 border-t border-slate-100 dark:border-white/10 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                  <div className="flex items-center gap-1.5">
                    <Lock className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>PostgreSQL SSL Rate-Limited Vault</span>
                  </div>
                  <span className="font-mono text-[10px] text-slate-400">TLS 1.3 Strict</span>
                </div>
              </div>
            </div>

            {/* Right Column (7 Cols): Comprehensive High-Caliber Form */}
            <div className="lg:col-span-7">
              <div className="relative rounded-3xl p-7 sm:p-10 bg-white/95 dark:bg-[#0D122B]/95 backdrop-blur-2xl border border-slate-200 dark:border-[#7138F5]/30 shadow-elevated dark:shadow-glow-card overflow-hidden space-y-6">
                {/* Specular Top Rim Gradient */}
                <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-[#7138F5] via-[#20C8E8] to-transparent" />

                {/* Form Heading & Department Indicator */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                      Send a Direct Message
                    </h2>
                    <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                      Targeted response dispatched directly to your designated work inbox.
                    </p>
                  </div>

                  <div className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#7138F5]/10 text-[#7138F5] dark:text-[#C4A5FF] border border-[#7138F5]/20 shrink-0">
                    <Activity className="w-3.5 h-3.5 animate-pulse" />
                    <span>
                      Routing to:{' '}
                      {DEPARTMENT_DESKS.find((d) => d.id === selectedDept)?.name.split(' ')[0] ||
                        'Sales'}
                    </span>
                  </div>
                </div>

                {/* Submission Success Alert */}
                {submittedId && (
                  <div className="rounded-2xl p-5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-900 dark:text-emerald-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 font-bold text-sm">
                        <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                        <span>Inquiry Successfully Dispatched</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setSubmittedId(null)}
                        className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline"
                      >
                        Dismiss
                      </button>
                    </div>
                    <p className="text-xs text-emerald-700 dark:text-emerald-300">
                      Thank you! Your ticket has been recorded in our PostgreSQL queue with
                      Reference ID: <strong className="font-mono">{submittedId}</strong>. A systems
                      engineer will follow up shortly.
                    </p>
                  </div>
                )}

                {/* Error Notice */}
                {error && (
                  <Alert
                    type="error"
                    title="Submission Issue"
                    message={error}
                    onClose={() => setError(null)}
                  />
                )}

                {/* Step 1: Quick Topic Selection */}
                <div className="space-y-2">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center justify-between">
                    <span>1. Inquiry Category</span>
                    <span className="text-[10px] text-slate-400 normal-case">
                      Click to auto-populate topic
                    </span>
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {quickSubjects.map((qs) => (
                      <button
                        key={qs}
                        type="button"
                        onClick={() => setSubject(qs)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${subject === qs
                          ? 'bg-gradient-to-r from-[#7138F5] to-[#2878FF] text-white shadow-sm'
                          : 'bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-white/10'
                          }`}
                      >
                        {qs}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Step 2: Target Department & Scale */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      Target Engineering Desk
                    </label>
                    <select
                      value={selectedDept}
                      onChange={(e) => handleSelectDepartment(e.target.value)}
                      className="w-full rounded-2xl border border-slate-200 dark:border-[#1E2749] bg-white dark:bg-[#0B1024] px-3.5 py-2.5 text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:border-[#7138F5] focus:ring-2 focus:ring-[#7138F5]/30 transition-all font-medium"
                    >
                      {DEPARTMENT_DESKS.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      Channel Footprint / Scale
                    </label>
                    <select
                      value={selectedScale}
                      onChange={(e) => setSelectedScale(e.target.value)}
                      className="w-full rounded-2xl border border-slate-200 dark:border-[#1E2749] bg-white dark:bg-[#0B1024] px-3.5 py-2.5 text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:border-[#7138F5] focus:ring-2 focus:ring-[#7138F5]/30 transition-all font-medium"
                    >
                      {scaleOptions.map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Step 3: Interactive Input Fields */}
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Input
                      label="Full Name *"
                      placeholder="Alex Rivera"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                    />
                    <Input
                      label="Work Email *"
                      type="email"
                      placeholder="alex@company.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Input
                      label="Company / Agency"
                      placeholder="Acme Brands Inc."
                      leftIcon={<Building2 className="w-4 h-4" />}
                      value={company}
                      onChange={(e) => setCompany(e.target.value)}
                    />
                    <Input
                      label="Subject *"
                      placeholder="Enterprise plan / onboarding"
                      leftIcon={<MessageSquare className="w-4 h-4" />}
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label
                        htmlFor="contact-message"
                        className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300"
                      >
                        Message *
                      </label>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {message.length} characters (min 10)
                      </span>
                    </div>
                    <textarea
                      id="contact-message"
                      rows={5}
                      required
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Tell us about your team size, channels, and goals..."
                      className="w-full rounded-2xl border border-slate-200 dark:border-[#1E2749] bg-white dark:bg-[#0B1024] px-4 py-3 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-[#7138F5] focus:ring-2 focus:ring-[#7138F5]/30 transition-all leading-relaxed"
                    />
                  </div>

                  <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <Button
                      type="submit"
                      variant="primary"
                      size="lg"
                      isLoading={isSubmitting}
                      rightIcon={<Send className="w-4 h-4" />}
                      className="w-full sm:w-auto px-8 py-3.5 btn-gradient text-sm sm:text-base font-bold shadow-glow-purple hover:scale-[1.02] transition-transform"
                    >
                      Send Message
                    </Button>

                    <div className="text-center sm:text-right">
                      <p className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Average response time &lt; 2 hours</span>
                      </p>
                      <p className="text-[10px] text-slate-400">
                        Direct webhook to on-duty systems engineers
                      </p>
                    </div>
                  </div>
                </form>

                {/* Footer Telemetry */}
                <div className="pt-5 border-t border-slate-100 dark:border-white/10 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400">
                  <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-semibold text-[11px]">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    Direct connection to NestJS API
                  </span>
                  <span className="font-mono text-[10px] text-slate-400">
                    POST /api/v1/public/contact • AES-256
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* ========================================================= */}
          {/* Section 4: Contact & Procurement FAQs                     */}
          {/* ========================================================= */}
          <div className="mt-20 max-w-4xl mx-auto space-y-6">
            <div className="text-center space-y-2">
              <span className="text-xs font-bold uppercase tracking-widest text-[#7138F5] dark:text-[#C4A5FF]">
                Common Inquiry Questions
              </span>
              <h2 className="text-2xl sm:text-4xl font-black text-slate-900 dark:text-white">
                Frequently Asked Contact Questions
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-xl mx-auto">
                Quick answers regarding enterprise SLAs, mutual non-disclosure agreements, and
                agency procurement workflows.
              </p>
            </div>

            <div className="space-y-3.5 pt-4">
              {CONTACT_FAQS.map((faq, idx) => {
                const isOpen = openFaqIndex === idx;
                return (
                  <div
                    key={faq.question}
                    onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                    className={`rounded-2xl transition-all duration-200 border cursor-pointer backdrop-blur-md overflow-hidden ${isOpen
                      ? 'bg-white/95 dark:bg-[#0D122B]/95 border-[#7138F5]/50 shadow-soft'
                      : 'bg-white/70 dark:bg-[#0D122B]/70 border-slate-200/80 dark:border-white/10 hover:border-[#7138F5]/30'
                      }`}
                  >
                    <div className="p-5 sm:p-6 flex items-center justify-between gap-4">
                      <h3 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2.5">
                        <HelpCircle className="w-4 h-4 text-[#7138F5] shrink-0" />
                        <span>{faq.question}</span>
                      </h3>
                      <button
                        type="button"
                        className="text-slate-400 hover:text-slate-600 dark:hover:text-white p-1"
                        aria-label="Toggle answer"
                      >
                        {isOpen ? (
                          <ChevronUp className="w-4 h-4 text-[#7138F5]" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        )}
                      </button>
                    </div>

                    {isOpen && (
                      <div className="px-5 sm:px-6 pb-6 pt-1 text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed border-t border-slate-100 dark:border-white/5">
                        {faq.answer}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </main>

      <PublicFooter />
    </div>
  );
}
