'use client';

import React, { useState, useEffect } from 'react';
import { useWorkspace } from '@/lib/workspace-context';
import { apiClient } from '@/lib/api-client';
import { LinkClickAnalyticsDto, ShortenedLinkDto } from '@packages/shared';
import {
  X,
  BarChart3,
  MousePointerClick,
  Users,
  Clock,
  Smartphone,
  Monitor,
  Tablet,
  Globe,
  Loader2,
  AlertCircle,
  Copy,
  Check,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Alert } from '@/components/ui/Alert';

interface LinkAnalyticsDrawerProps {
  link: ShortenedLinkDto | null;
  isOpen: boolean;
  onClose: () => void;
}

export function LinkAnalyticsDrawer({ link, isOpen, onClose }: LinkAnalyticsDrawerProps) {
  const { currentWorkspace } = useWorkspace();
  const workspaceId = currentWorkspace?.id;

  const [analytics, setAnalytics] = useState<LinkClickAnalyticsDto | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!isOpen || !workspaceId || !link) {
      setAnalytics(null);
      return;
    }

    const fetchAnalytics = async () => {
      setIsLoading(true);
      setErrorMsg(null);
      try {
        const res = await apiClient<any>(`workspaces/${workspaceId}/links/${link.id}/analytics`);
        setAnalytics(res.data || res);
      } catch (err: any) {
        setErrorMsg(err.message || 'Failed to fetch link analytics');
      } finally {
        setIsLoading(false);
      }
    };

    fetchAnalytics();
  }, [isOpen, workspaceId, link?.id]);

  if (!isOpen || !link) return null;

  const handleCopy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
    }
  };

  const getDeviceIcon = (dev: string) => {
    switch (dev.toUpperCase()) {
      case 'MOBILE':
        return <Smartphone className="w-4 h-4 text-emerald-600" />;
      case 'TABLET':
        return <Tablet className="w-4 h-4 text-amber-600" />;
      default:
        return <Monitor className="w-4 h-4 text-indigo-600" />;
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200"
      id="link-analytics-modal"
      data-testid="link-analytics-modal"
    >
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-2xl w-full flex flex-col overflow-hidden max-h-[85vh]">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shadow-2xs">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                Click Telemetry &amp; Attribution
                <Badge variant="purple" className="text-xs">
                  Analytics
                </Badge>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                {link.title || link.shortCode} • {link.shortUrl}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
            aria-label="Close"
            id="btn-close-analytics-modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1">
          {errorMsg && (
            <Alert variant="danger" className="text-xs">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </Alert>
          )}

          {isLoading ? (
            <div className="py-12 flex flex-col items-center justify-center gap-2 text-slate-400">
              <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
              <span className="text-xs font-medium">Aggregating real-time click events...</span>
            </div>
          ) : analytics ? (
            <>
              {/* Metric Cards */}
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Total Clicks
                    </span>
                    <MousePointerClick className="w-4 h-4 text-indigo-600" />
                  </div>
                  <div className="text-2xl font-bold text-slate-900 mt-1">{analytics.totalClicks}</div>
                </div>

                <div className="p-3.5 rounded-xl bg-emerald-50/50 border border-emerald-200">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600">
                      Unique Visitors
                    </span>
                    <Users className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div className="text-2xl font-bold text-emerald-700 mt-1">
                    {analytics.uniqueClicksEstimate}
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Last Clicked
                    </span>
                    <Clock className="w-4 h-4 text-slate-400" />
                  </div>
                  <div className="text-xs font-semibold text-slate-700 mt-2 truncate">
                    {link.lastClickedAt ? new Date(link.lastClickedAt).toLocaleDateString() : 'Never'}
                  </div>
                </div>
              </div>

              {/* Device Breakdown */}
              <div className="border border-slate-200 rounded-xl p-4 space-y-3">
                <h3 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  <Monitor className="w-4 h-4 text-indigo-600" />
                  Device Breakdown
                </h3>
                {analytics.deviceBreakdown && analytics.deviceBreakdown.length > 0 ? (
                  <div className="space-y-2">
                    {analytics.deviceBreakdown.map((dev) => (
                      <div key={dev.deviceType} className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="flex items-center gap-1.5 text-slate-700 font-medium">
                            {getDeviceIcon(dev.deviceType)}
                            {dev.deviceType}
                          </span>
                          <span className="font-semibold text-slate-900">
                            {dev.count} ({dev.percentage}%)
                          </span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-indigo-600 rounded-full transition-all duration-300"
                            style={{ width: `${dev.percentage}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 italic">No device telemetry recorded yet.</p>
                )}
              </div>

              {/* Top Referrers */}
              <div className="border border-slate-200 rounded-xl p-4 space-y-3">
                <h3 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  <Globe className="w-4 h-4 text-indigo-600" />
                  Top Traffic Referrers
                </h3>
                {analytics.topReferrers && analytics.topReferrers.length > 0 ? (
                  <div className="space-y-1.5">
                    {analytics.topReferrers.map((ref) => (
                      <div
                        key={ref.referrer}
                        className="flex items-center justify-between text-xs p-2 rounded-lg bg-slate-50 border border-slate-100"
                      >
                        <span className="font-medium text-slate-700">{ref.referrer}</span>
                        <Badge variant="outline" className="text-[10px] font-semibold">
                          {ref.count} click(s)
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 italic">No referrer data available.</p>
                )}
              </div>

              {/* Destination URL */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1 text-xs">
                <span className="text-slate-400 font-medium">Target URL &amp; Campaign Attribution:</span>
                <p className="font-mono text-slate-700 break-all text-[11px]">
                  {link.destinationUrl}
                </p>
              </div>
            </>
          ) : null}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => handleCopy(link.shortUrl)}
            className="flex items-center gap-1.5 text-xs"
            id="btn-copy-short-url-analytics"
          >
            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied' : 'Copy Short Link'}</span>
          </Button>

          <Button type="button" size="sm" onClick={onClose} className="text-xs">
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}
