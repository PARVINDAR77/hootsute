'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useWorkspace } from '@/lib/workspace-context';
import { apiClient } from '@/lib/api-client';
import { ShortenedLinkDto } from '@packages/shared';
import {
  Link2,
  Plus,
  Search,
  ExternalLink,
  Copy,
  Check,
  BarChart3,
  Trash2,
  MousePointerClick,
  Layers,
  Sparkles,
  Loader2,
  AlertCircle,
  Tag,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Alert } from '@/components/ui/Alert';
import { CreateLinkModal } from '@/components/links/CreateLinkModal';
import { LinkAnalyticsDrawer } from '@/components/links/LinkAnalyticsDrawer';

export default function LinksPage() {
  const { currentWorkspace } = useWorkspace();
  const workspaceId = currentWorkspace?.id;

  const [links, setLinks] = useState<ShortenedLinkDto[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modals
  const [isCreateOpen, setIsCreateOpen] = useState<boolean>(false);
  const [selectedLinkForAnalytics, setSelectedLinkForAnalytics] = useState<ShortenedLinkDto | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const fetchLinks = useCallback(async () => {
    if (!workspaceId) return;
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const queryParam = searchQuery.trim() ? `?search=${encodeURIComponent(searchQuery.trim())}` : '';
      const res = await apiClient<any>(`workspaces/${workspaceId}/links${queryParam}`);
      setLinks(res.data || res || []);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to load shortened links');
    } finally {
      setIsLoading(false);
    }
  }, [workspaceId, searchQuery]);

  useEffect(() => {
    fetchLinks();
  }, [fetchLinks]);

  const handleCopy = async (id: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      // fallback
    }
  };

  const handleDelete = async (linkId: string) => {
    if (!workspaceId) return;
    if (!confirm('Are you sure you want to deactivate and delete this short link?')) return;

    try {
      await apiClient(`workspaces/${workspaceId}/links/${linkId}`, {
        method: 'DELETE',
      });
      setLinks((prev) => prev.filter((l) => l.id !== linkId));
    } catch (err: any) {
      alert(err.message || 'Failed to delete link');
    }
  };

  const totalClicksAllLinks = links.reduce((sum, l) => sum + (l.totalClicks || 0), 0);
  const totalCampaigns = new Set(links.map((l) => l.utmCampaign).filter(Boolean)).size;

  return (
    <div className="space-y-6" id="links-page" data-testid="links-page">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2.5">
            <Link2 className="w-6 h-6 text-indigo-600" />
            Link Shortener &amp; UTM Tracking
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Create branded short URLs, inject campaign tracking tags, and measure click attribution
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            onClick={() => setIsCreateOpen(true)}
            size="sm"
            className="flex items-center gap-2 shadow-xs"
            id="btn-create-new-link"
          >
            <Plus className="w-4 h-4" />
            <span>Shorten New Link</span>
          </Button>
        </div>
      </div>

      {/* KPI Stats Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-3.5 rounded-xl bg-white border border-slate-200/80 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Shortened Links
            </span>
            <div className="text-xl font-bold text-slate-900 mt-0.5">{links.length}</div>
          </div>
          <div className="w-9 h-9 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <Link2 className="w-5 h-5" />
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-white border border-slate-200/80 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Total Clicks Attributed
            </span>
            <div className="text-xl font-bold text-emerald-600 mt-0.5">{totalClicksAllLinks}</div>
          </div>
          <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <MousePointerClick className="w-5 h-5" />
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-white border border-slate-200/80 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Active Campaigns
            </span>
            <div className="text-xl font-bold text-indigo-600 mt-0.5">{totalCampaigns}</div>
          </div>
          <div className="w-9 h-9 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
            <Tag className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search links by title, slug, or destination URL..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            id="input-search-links"
          />
        </div>
      </div>

      {/* Error Alert */}
      {errorMsg && (
        <Alert variant="danger" className="text-xs">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </Alert>
      )}

      {/* Links List */}
      {isLoading ? (
        <div className="py-16 flex flex-col items-center justify-center gap-2 text-slate-400">
          <Loader2 className="w-7 h-7 animate-spin text-indigo-600" />
          <span className="text-xs font-medium">Loading tracking links...</span>
        </div>
      ) : links.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-slate-200 rounded-2xl bg-slate-50/50 space-y-3">
          <div className="w-12 h-12 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto">
            <Link2 className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-slate-900">No Shortened Links Yet</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Create your first shortened branded URL with automated UTM attribution to track click performance across channels.
            </p>
          </div>
          <Button
            size="sm"
            onClick={() => setIsCreateOpen(true)}
            className="text-xs shadow-xs"
            id="btn-empty-shorten-link"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            Shorten Your First Link
          </Button>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200/80 shadow-2xs divide-y divide-slate-100 overflow-hidden">
          {links.map((link) => (
            <div
              key={link.id}
              className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/60 transition-colors"
              data-testid={`link-row-${link.id}`}
            >
              <div className="space-y-1.5 flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-bold text-sm text-slate-900 truncate">
                    {link.title || link.shortCode}
                  </span>
                  <div className="flex items-center gap-1">
                    {link.utmSource && (
                      <Badge variant="outline" className="text-[10px] font-semibold text-sky-700 bg-sky-50 border-sky-200">
                        {link.utmSource}
                      </Badge>
                    )}
                    {link.utmCampaign && (
                      <Badge variant="purple" className="text-[10px] font-semibold">
                        {link.utmCampaign}
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Short link row */}
                <div className="flex items-center gap-2 text-xs">
                  <span className="font-mono font-semibold text-indigo-600 bg-indigo-50/80 px-2 py-0.5 rounded border border-indigo-100">
                    {link.shortUrl}
                  </span>
                  <button
                    onClick={() => handleCopy(link.id, link.shortUrl)}
                    className="text-slate-400 hover:text-slate-600 transition-colors p-1"
                    title="Copy short link"
                  >
                    {copiedId === link.id ? (
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>

                {/* Destination URL */}
                <p className="text-[11px] font-mono text-slate-400 truncate max-w-xl">
                  {link.destinationUrl}
                </p>
              </div>

              {/* Actions & Metrics */}
              <div className="flex items-center gap-3 shrink-0">
                <div className="text-right">
                  <div className="text-base font-bold text-slate-900 flex items-center justify-end gap-1">
                    <MousePointerClick className="w-3.5 h-3.5 text-emerald-600" />
                    <span>{link.totalClicks}</span>
                  </div>
                  <span className="text-[10px] text-slate-400 uppercase font-semibold">Clicks</span>
                </div>

                <div className="flex items-center gap-1.5">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedLinkForAnalytics(link)}
                    className="flex items-center gap-1.5 text-xs text-slate-700"
                    id={`btn-analytics-${link.id}`}
                  >
                    <BarChart3 className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Analytics</span>
                  </Button>

                  <button
                    onClick={() => handleDelete(link.id)}
                    className="text-slate-400 hover:text-rose-600 p-1.5 rounded-lg hover:bg-rose-50 transition-colors"
                    title="Delete link"
                    id={`btn-delete-${link.id}`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modals */}
      <CreateLinkModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onCreated={() => {
          fetchLinks();
        }}
      />

      <LinkAnalyticsDrawer
        link={selectedLinkForAnalytics}
        isOpen={selectedLinkForAnalytics !== null}
        onClose={() => setSelectedLinkForAnalytics(null)}
      />
    </div>
  );
}
