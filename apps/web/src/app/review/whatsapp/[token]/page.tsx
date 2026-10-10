'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  Instagram,
  Facebook,
  Linkedin,
  Twitter,
  Copy,
  Check,
  ShieldCheck,
  Sparkles,
  Building2,
  Share2,
} from 'lucide-react';
import { API_BASE_URL } from '@/lib/constants';

interface ReviewData {
  workspace: {
    id: string;
    name: string;
    slug: string;
    logoUrl: string | null;
  };
  draft: {
    id: string;
    title: string;
    objective: string;
    contentType: string;
    language: string;
    status: 'DRAFT' | 'IN_REVIEW' | 'APPROVED' | 'REJECTED';
    rejectionReason: string | null;
    approvedAt: string | null;
    createdBy: { id: string; name: string };
    createdAt: string;
    variants: Array<{
      id: string;
      platform: 'INSTAGRAM' | 'FACEBOOK' | 'LINKEDIN' | 'TWITTER';
      headline?: string;
      body: string;
      callToAction?: string;
      hashtags?: string[];
      mediaBrief?: string;
      mediaAssetUrl?: string;
    }>;
  };
  reviewer: {
    id: string;
    displayName: string;
    phoneNumber: string;
    maskedPhone: string;
  };
  canApprove: boolean;
  cannotApproveReason?: string;
  tokenExpiresAt: string;
}

export default function WhatsAppReviewPage() {
  const params = useParams();
  const token = params?.token as string;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<ReviewData | null>(null);

  const [activePlatformIndex, setActivePlatformIndex] = useState(0);
  const [copied, setCopied] = useState(false);

  // Modals & Actions
  const [submitting, setSubmitting] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [actionSuccessMessage, setActionSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;

    async function fetchReviewDetails() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`${API_BASE_URL}/review/whatsapp/${token}`);
        const json = await res.json();

        if (!res.ok || !json.success) {
          throw new Error(json.message || 'Review link is invalid, expired, or tampered.');
        }

        setData(json.data);
      } catch (err: any) {
        setError(err.message || 'Failed to load content draft preview.');
      } finally {
        setLoading(false);
      }
    }

    fetchReviewDetails();
  }, [token]);

  const handleCopyContent = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleApprove = async () => {
    if (!token || submitting) return;
    setSubmitting(true);
    try {
      const res = await fetch(`${API_BASE_URL}/review/whatsapp/${token}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.message || 'Failed to approve draft');
      }

      setActionSuccessMessage('Draft approved successfully! It has been placed in the publishing queue.');
      if (data) {
        setData({
          ...data,
          draft: { ...data.draft, status: 'APPROVED', approvedAt: new Date().toISOString() },
        });
      }
    } catch (err: any) {
      alert(`Approval error: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleReject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || submitting) return;

    if (!rejectReason.trim() || rejectReason.trim().length < 3) {
      alert('Please provide a reason with at least 3 characters explaining what needs to be changed.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`${API_BASE_URL}/review/whatsapp/${token}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: rejectReason.trim() }),
      });
      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.message || 'Failed to submit changes');
      }

      setActionSuccessMessage('Changes requested! The creator has been notified with your feedback.');
      setShowRejectModal(false);
      if (data) {
        setData({
          ...data,
          draft: { ...data.draft, status: 'REJECTED', rejectionReason: rejectReason.trim() },
        });
      }
    } catch (err: any) {
      alert(`Rejection error: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case 'INSTAGRAM':
        return <Instagram className="w-4 h-4 text-pink-500" />;
      case 'FACEBOOK':
        return <Facebook className="w-4 h-4 text-blue-600" />;
      case 'LINKEDIN':
        return <Linkedin className="w-4 h-4 text-sky-600" />;
      case 'TWITTER':
        return <Twitter className="w-4 h-4 text-slate-800" />;
      default:
        return <Share2 className="w-4 h-4 text-slate-500" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-slate-600 font-medium">Verifying review token & loading preview...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl p-8 border border-slate-200 shadow-sm text-center space-y-4">
          <div className="w-14 h-14 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mx-auto">
            <XCircle className="w-8 h-8" />
          </div>
          <h1 className="text-xl font-bold text-slate-900">Review Link Expired or Invalid</h1>
          <p className="text-sm text-slate-600">
            {error || 'This WhatsApp review link has expired (24h limit) or has an invalid signature.'}
          </p>
          <div className="pt-2 text-xs text-slate-400">
            Please ask the workspace team to dispatch a new WhatsApp preview notification.
          </div>
        </div>
      </div>
    );
  }

  const { draft, workspace, reviewer, canApprove, cannotApproveReason } = data;
  const currentVariant = draft.variants[activePlatformIndex] || draft.variants[0];

  return (
    <div className="min-h-screen bg-slate-100/60 pb-16">
      {/* Top Navigation Bar */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-500 flex items-center justify-center text-white shadow-md shadow-indigo-100">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="font-bold text-slate-900 text-sm">{workspace.name}</div>
              <div className="text-[11px] text-slate-400 font-medium">OmniSocial Review Hub</div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="text-right hidden sm:block">
              <div className="text-xs font-medium text-slate-800">{reviewer.displayName}</div>
              <div className="text-[10px] text-slate-400">{reviewer.maskedPhone}</div>
            </div>
            <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-semibold text-xs border border-slate-200">
              {reviewer.displayName[0]}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 pt-6 space-y-6">
        {/* Success Alert Banner */}
        {actionSuccessMessage && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-center gap-3 text-emerald-800 text-sm">
            <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-600" />
            <span>{actionSuccessMessage}</span>
          </div>
        )}

        {/* Four-Eyes Restriction Banner */}
        {!canApprove && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3 text-amber-800 text-sm">
            <AlertTriangle className="w-5 h-5 shrink-0 text-amber-600 mt-0.5" />
            <div>
              <strong className="font-semibold">Four-Eyes Separation of Duties:</strong>{' '}
              {cannotApproveReason || 'You cannot approve your own draft. Another authorized reviewer must approve it.'}
            </div>
          </div>
        )}

        {/* Status Header Card */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <div className="text-xs font-semibold uppercase tracking-wider text-indigo-600 mb-1">
                Post Approval Request
              </div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{draft.title}</h1>
              <div className="text-xs text-slate-500 mt-1 flex flex-wrap items-center gap-2">
                <span>Created by {draft.createdBy.name}</span>
                <span>•</span>
                <span>Language: {draft.language.toUpperCase()}</span>
                <span>•</span>
                <span>Campaign: {draft.objective}</span>
              </div>
            </div>

            {/* Status Pill */}
            <div>
              {draft.status === 'APPROVED' ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <CheckCircle2 className="w-4 h-4" /> Approved
                </span>
              ) : draft.status === 'REJECTED' ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                  <XCircle className="w-4 h-4" /> Changes Requested
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200 animate-pulse">
                  <Clock className="w-4 h-4" /> Awaiting Review
                </span>
              )}
            </div>
          </div>

          {draft.status === 'REJECTED' && draft.rejectionReason && (
            <div className="bg-rose-50/70 border border-rose-100 rounded-xl p-3.5 text-xs text-rose-800">
              <span className="font-semibold">Reviewer Feedback:</span> {draft.rejectionReason}
            </div>
          )}

          {/* Platform Variant Switcher */}
          {draft.variants.length > 1 && (
            <div className="flex gap-2 border-b border-slate-100 pb-3">
              {draft.variants.map((v, i) => (
                <button
                  key={v.id}
                  onClick={() => setActivePlatformIndex(i)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-2 transition-all ${
                    activePlatformIndex === i
                      ? 'bg-slate-900 text-white shadow-sm'
                      : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {getPlatformIcon(v.platform)}
                  <span>{v.platform}</span>
                </button>
              ))}
            </div>
          )}

          {/* Social Post Preview Card */}
          {currentVariant && (
            <div className="rounded-xl border border-slate-200/90 bg-white p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {getPlatformIcon(currentVariant.platform)}
                  <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    {currentVariant.platform} Preview
                  </span>
                </div>
                <button
                  onClick={() => handleCopyContent(currentVariant.body)}
                  className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-800 transition"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied!' : 'Copy Text'}</span>
                </button>
              </div>

              {currentVariant.headline && (
                <div className="font-semibold text-slate-900 text-base border-b border-slate-100 pb-2">
                  {currentVariant.headline}
                </div>
              )}

              <div className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">
                {currentVariant.body}
              </div>

              {currentVariant.callToAction && (
                <div className="text-xs font-medium text-indigo-600 bg-indigo-50/50 p-2.5 rounded-lg">
                  👉 Call to Action: {currentVariant.callToAction}
                </div>
              )}

              {currentVariant.hashtags && currentVariant.hashtags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-2">
                  {currentVariant.hashtags.map((h, idx) => (
                    <span
                      key={idx}
                      className="text-xs font-medium text-indigo-600 bg-indigo-50/80 px-2 py-0.5 rounded-md"
                    >
                      {h.startsWith('#') ? h : `#${h}`}
                    </span>
                  ))}
                </div>
              )}

              {currentVariant.mediaBrief && (
                <div className="bg-slate-50 rounded-lg p-3 text-xs text-slate-600 space-y-1 border border-slate-100">
                  <div className="font-semibold text-slate-800 flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" /> Visual & Imagery Brief:
                  </div>
                  <p className="whitespace-pre-wrap">{currentVariant.mediaBrief}</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Action Panel for Reviewer */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-xs text-slate-500">
            <span className="font-semibold text-slate-700">One-click WhatsApp Review:</span> Your response
            will instantly synchronize with the team dashboard and record an audit log.
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              onClick={() => setShowRejectModal(true)}
              disabled={submitting || draft.status === 'APPROVED'}
              className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50 text-xs font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
            >
              <XCircle className="w-4 h-4" />
              <span>Request Changes</span>
            </button>

            <button
              onClick={handleApprove}
              disabled={submitting || !canApprove || draft.status === 'APPROVED'}
              className="flex-1 sm:flex-none px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-md shadow-emerald-200 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{submitting ? 'Processing...' : 'Approve Draft'}</span>
            </button>
          </div>
        </div>
      </main>

      {/* Reject / Change Request Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 border border-slate-200 shadow-xl">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-base">Request Content Changes</h3>
              <button
                onClick={() => setShowRejectModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-600">
              Please specify the revisions needed. The post creator will be notified on the dashboard to update the
              draft.
            </p>

            <form onSubmit={handleReject} className="space-y-4">
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="e.g. Please increase the discount to 20% and add the festive sale dates..."
                rows={4}
                required
                className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
              />

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowRejectModal(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 text-xs font-semibold bg-rose-600 hover:bg-rose-500 text-white rounded-lg transition"
                >
                  {submitting ? 'Submitting...' : 'Submit Rejection'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
