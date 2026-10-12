'use client';

import React, { useState } from 'react';
import { useWorkspace } from '@/lib/workspace-context';
import { apiClient } from '@/lib/api-client';
import { ShortenedLinkDto, UtmParametersDto } from '@packages/shared';
import {
  X,
  Link2,
  Sparkles,
  Copy,
  Check,
  Globe,
  SlidersHorizontal,
  Loader2,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Alert } from '@/components/ui/Alert';

interface CreateLinkModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: (link: ShortenedLinkDto) => void;
}

export function CreateLinkModal({ isOpen, onClose, onCreated }: CreateLinkModalProps) {
  const { currentWorkspace } = useWorkspace();
  const workspaceId = currentWorkspace?.id;

  const [originalUrl, setOriginalUrl] = useState('');
  const [title, setTitle] = useState('');
  const [customCode, setCustomCode] = useState('');
  const [showUtmBuilder, setShowUtmBuilder] = useState(true);

  // UTM Parameters
  const [utmSource, setUtmSource] = useState('linkedin');
  const [utmMedium, setUtmMedium] = useState('social');
  const [utmCampaign, setUtmCampaign] = useState('');
  const [utmTerm, setUtmTerm] = useState('');
  const [utmContent, setUtmContent] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [createdLink, setCreatedLink] = useState<ShortenedLinkDto | null>(null);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  // Live preview of the destination URL with UTM params
  const getPreviewUrl = () => {
    if (!originalUrl.trim()) return '';
    try {
      const url = new URL(originalUrl);
      if (utmSource.trim()) url.searchParams.set('utm_source', utmSource.trim());
      if (utmMedium.trim()) url.searchParams.set('utm_medium', utmMedium.trim());
      if (utmCampaign.trim()) url.searchParams.set('utm_campaign', utmCampaign.trim());
      if (utmTerm.trim()) url.searchParams.set('utm_term', utmTerm.trim());
      if (utmContent.trim()) url.searchParams.set('utm_content', utmContent.trim());
      return url.toString();
    } catch {
      return originalUrl;
    }
  };

  const handleCopy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!workspaceId) return;

    if (!originalUrl.trim()) {
      setErrorMsg('Destination URL is required');
      return;
    }

    try {
      new URL(originalUrl);
    } catch {
      setErrorMsg('Please enter a valid HTTP or HTTPS destination URL');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    const utmParameters: UtmParametersDto = {
      ...(utmSource.trim() ? { utmSource: utmSource.trim() } : {}),
      ...(utmMedium.trim() ? { utmMedium: utmMedium.trim() } : {}),
      ...(utmCampaign.trim() ? { utmCampaign: utmCampaign.trim() } : {}),
      ...(utmTerm.trim() ? { utmTerm: utmTerm.trim() } : {}),
      ...(utmContent.trim() ? { utmContent: utmContent.trim() } : {}),
    };

    try {
      const res = await apiClient<any>(`workspaces/${workspaceId}/links`, {
        method: 'POST',
        body: JSON.stringify({
          originalUrl: originalUrl.trim(),
          title: title.trim() || undefined,
          customCode: customCode.trim() || undefined,
          utmParameters: Object.keys(utmParameters).length > 0 ? utmParameters : undefined,
        }),
      });

      const newLink: ShortenedLinkDto = res.data || res;
      setCreatedLink(newLink);
      onCreated(newLink);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to create shortened link');
    } finally {
      setIsSubmitting(false);
    }
  };

  const setPlatformPreset = (platform: string) => {
    setUtmSource(platform);
    setUtmMedium('social');
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200"
      id="create-link-modal"
      data-testid="create-link-modal"
    >
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-xl w-full flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shadow-2xs">
              <Link2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                Shorten Link &amp; Build UTM
                <Badge variant="purple" className="text-xs">
                  Branded
                </Badge>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Generate tracking links with campaign attribution parameters
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
            aria-label="Close"
            id="btn-close-link-modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          {errorMsg && (
            <Alert variant="danger" className="text-xs">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </Alert>
          )}

          {createdLink ? (
            <div className="space-y-4 py-3">
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 flex flex-col items-center text-center gap-2">
                <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
                  <Check className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-emerald-950 text-sm">Shortened Link Ready!</h3>
                <p className="text-xs text-emerald-700">
                  Click events will be tracked and attributed in real-time.
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-600">Your Short Link</label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={createdLink.shortUrl}
                    className="flex-1 text-xs font-mono p-2.5 rounded-xl border border-slate-200 bg-slate-50 text-indigo-700 font-semibold"
                    id="input-created-short-url"
                  />
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => handleCopy(createdLink.shortUrl)}
                    className="flex items-center gap-1.5 text-xs shrink-0"
                    id="btn-copy-short-url"
                  >
                    {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? 'Copied!' : 'Copy'}</span>
                  </Button>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1 text-xs">
                <span className="text-slate-400 font-medium">Destination URL with UTM:</span>
                <p className="font-mono text-slate-700 break-all text-[11px]">
                  {createdLink.destinationUrl}
                </p>
              </div>

              <div className="flex justify-end pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={onClose}
                  className="text-xs"
                  id="btn-done-shorten-link"
                >
                  Done
                </Button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Destination URL */}
              <div className="space-y-1.5">
                <label
                  htmlFor="input-destination-url"
                  className="text-xs font-semibold text-slate-700 flex items-center gap-1 cursor-pointer"
                >
                  Destination URL <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Globe className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                  <input
                    type="url"
                    required
                    placeholder="https://example.com/summer-sale"
                    value={originalUrl}
                    onChange={(e) => setOriginalUrl(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    id="input-destination-url"
                  />
                </div>
              </div>

              {/* Title & Custom Slug */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">Link Title (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. Summer Sale 2026"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    id="input-link-title"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">Custom Slug (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. summer-promo"
                    value={customCode}
                    onChange={(e) => setCustomCode(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-mono rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    id="input-custom-slug"
                  />
                </div>
              </div>

              {/* UTM Builder Toggle & Presets */}
              <div className="border border-slate-200/80 rounded-xl p-3.5 bg-slate-50/50 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                    <SlidersHorizontal className="w-3.5 h-3.5 text-indigo-600" />
                    <span>UTM Campaign Parameters</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setPlatformPreset('linkedin')}
                      className="px-2 py-0.5 text-[10px] font-semibold rounded bg-white border border-slate-200 text-sky-800 hover:bg-sky-50"
                    >
                      LinkedIn
                    </button>
                    <button
                      type="button"
                      onClick={() => setPlatformPreset('twitter_x')}
                      className="px-2 py-0.5 text-[10px] font-semibold rounded bg-white border border-slate-200 text-slate-800 hover:bg-slate-100"
                    >
                      Twitter/X
                    </button>
                    <button
                      type="button"
                      onClick={() => setPlatformPreset('facebook')}
                      className="px-2 py-0.5 text-[10px] font-semibold rounded bg-white border border-slate-200 text-blue-700 hover:bg-blue-50"
                    >
                      Facebook
                    </button>
                    <button
                      type="button"
                      onClick={() => setPlatformPreset('instagram')}
                      className="px-2 py-0.5 text-[10px] font-semibold rounded bg-white border border-slate-200 text-pink-700 hover:bg-pink-50"
                    >
                      Instagram
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                  <div>
                    <label className="text-[10px] font-semibold text-slate-500 uppercase">
                      utm_source
                    </label>
                    <input
                      type="text"
                      placeholder="linkedin"
                      value={utmSource}
                      onChange={(e) => setUtmSource(e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 bg-white"
                      id="input-utm-source"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-semibold text-slate-500 uppercase">
                      utm_medium
                    </label>
                    <input
                      type="text"
                      placeholder="social"
                      value={utmMedium}
                      onChange={(e) => setUtmMedium(e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 bg-white"
                      id="input-utm-medium"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-semibold text-slate-500 uppercase">
                      utm_campaign
                    </label>
                    <input
                      type="text"
                      placeholder="summer_promo"
                      value={utmCampaign}
                      onChange={(e) => setUtmCampaign(e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 bg-white"
                      id="input-utm-campaign"
                    />
                  </div>
                </div>
              </div>

              {/* URL Preview */}
              {originalUrl.trim() && (
                <div className="space-y-1">
                  <span className="text-[11px] font-medium text-slate-400">Live Tagged URL Preview:</span>
                  <p className="font-mono text-[11px] text-slate-600 bg-slate-100/70 p-2.5 rounded-lg break-all">
                    {getPreviewUrl()}
                  </p>
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <Button type="button" variant="outline" size="sm" onClick={onClose} className="text-xs">
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={isSubmitting || !originalUrl.trim()}
                  className="flex items-center gap-1.5 text-xs shadow-xs"
                  id="btn-submit-create-link"
                >
                  {isSubmitting ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Link2 className="w-3.5 h-3.5" />
                  )}
                  <span>Create Short Link</span>
                </Button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
