'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useWorkspace } from '@/lib/workspace-context';
import { apiClient } from '@/lib/api-client';
import { WhiteLabelConfigDto, UpsertWhiteLabelConfigDto } from '@packages/shared';
import {
  Globe,
  Palette,
  Sparkles,
  Save,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  ShieldCheck,
  Eye,
  Sliders,
  Layers,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Alert } from '@/components/ui/Alert';

export default function WhiteLabelPage() {
  const { currentWorkspace } = useWorkspace();
  const workspaceId = currentWorkspace?.id;

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Form State
  const [brandName, setBrandName] = useState<string>('');
  const [customDomain, setCustomDomain] = useState<string>('');
  const [logoUrl, setLogoUrl] = useState<string>('');
  const [faviconUrl, setFaviconUrl] = useState<string>('');
  const [primaryColor, setPrimaryColor] = useState<string>('#6366f1');
  const [secondaryColor, setSecondaryColor] = useState<string>('#4f46e5');
  const [accentColor, setAccentColor] = useState<string>('#06b6d4');
  const [supportEmail, setSupportEmail] = useState<string>('');
  const [portalTitle, setPortalTitle] = useState<string>('');
  const [customCss, setCustomCss] = useState<string>('');
  const [hidePoweredBy, setHidePoweredBy] = useState<boolean>(false);
  const [isEnabled, setIsEnabled] = useState<boolean>(true);

  const fetchConfig = useCallback(async () => {
    if (!workspaceId) return;
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const res = await apiClient<any>(`workspaces/${workspaceId}/white-label`);
      const config: WhiteLabelConfigDto | null = res.data ?? res;
      if (config) {
        setBrandName(config.brandName || '');
        setCustomDomain(config.customDomain || '');
        setLogoUrl(config.logoUrl || '');
        setFaviconUrl(config.faviconUrl || '');
        setPrimaryColor(config.primaryColor || '#6366f1');
        setSecondaryColor(config.secondaryColor || '#4f46e5');
        setAccentColor(config.accentColor || '#06b6d4');
        setSupportEmail(config.supportEmail || '');
        setPortalTitle(config.portalTitle || '');
        setCustomCss(config.customCss || '');
        setHidePoweredBy(config.hidePoweredBy ?? false);
        setIsEnabled(config.isEnabled ?? true);
      } else {
        setBrandName(currentWorkspace?.name || 'My Agency');
        setPortalTitle(`${currentWorkspace?.name || 'Agency'} Client Portal`);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to load white-label configuration');
    } finally {
      setIsLoading(false);
    }
  }, [workspaceId, currentWorkspace?.name]);

  useEffect(() => {
    fetchConfig();
  }, [fetchConfig]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!workspaceId) return;

    if (!brandName.trim()) {
      setErrorMsg('Brand name is required');
      return;
    }

    setIsSaving(true);
    setErrorMsg(null);
    setSaveSuccess(false);

    const payload: UpsertWhiteLabelConfigDto = {
      brandName: brandName.trim(),
      customDomain: customDomain.trim() || undefined,
      logoUrl: logoUrl.trim() || undefined,
      faviconUrl: faviconUrl.trim() || undefined,
      primaryColor,
      secondaryColor,
      accentColor,
      supportEmail: supportEmail.trim() || undefined,
      portalTitle: portalTitle.trim() || `${brandName.trim()} Client Portal`,
      customCss: customCss.trim() || undefined,
      hidePoweredBy,
      isEnabled,
    };

    try {
      await apiClient(`workspaces/${workspaceId}/white-label`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 4000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to save white-label branding');
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = async () => {
    if (!workspaceId) return;
    if (!confirm('Are you sure you want to reset all white-label settings to system defaults?')) return;

    setIsSaving(true);
    setErrorMsg(null);
    try {
      await apiClient(`workspaces/${workspaceId}/white-label`, {
        method: 'DELETE',
      });
      setBrandName(currentWorkspace?.name || '');
      setCustomDomain('');
      setLogoUrl('');
      setFaviconUrl('');
      setPrimaryColor('#6366f1');
      setSecondaryColor('#4f46e5');
      setAccentColor('#06b6d4');
      setSupportEmail('');
      setPortalTitle(`${currentWorkspace?.name || 'Agency'} Client Portal`);
      setCustomCss('');
      setHidePoweredBy(false);
      setIsEnabled(true);
      setSaveSuccess(true);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to reset white-label branding');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-8 max-w-7xl mx-auto flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-slate-500 font-medium">Loading white-label agency portal...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-6">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">White-Label Agency Portal</h1>
            <Badge variant={isEnabled ? 'success' : 'default'}>
              {isEnabled ? 'White-Label Active' : 'Default Platform Branding'}
            </Badge>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Deliver bespoke reporting portals, custom CNAME domains, and tailored palettes for enterprise clients.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleReset} disabled={isSaving}>
            <RotateCcw className="w-4 h-4 mr-1.5" />
            Reset Defaults
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handleSave}
            disabled={isSaving}
          >
            <Save className="w-4 h-4 mr-1.5" />
            {isSaving ? 'Saving Changes...' : 'Save Branding'}
          </Button>
        </div>
      </div>

      {saveSuccess && (
        <Alert variant="success" title="Branding Updated Successfully">
          Your agency white-label tokens and live client portal styles are now synchronized.
        </Alert>
      )}

      {errorMsg && (
        <Alert variant="error" title="Configuration Error">
          {errorMsg}
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Form: Customization settings (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          <form onSubmit={handleSave} className="space-y-6">
            {/* Identity & Domain Card */}
            <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs space-y-5">
              <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                <Globe className="w-5 h-5 text-indigo-600" />
                <h2 className="text-sm font-bold uppercase tracking-wider text-slate-700">
                  Agency Identity &amp; Domain
                </h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Agency / Brand Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={brandName}
                    onChange={(e) => setBrandName(e.target.value)}
                    required
                    placeholder="e.g. Apex Media Agency"
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Custom Subdomain / CNAME
                  </label>
                  <input
                    type="text"
                    value={customDomain}
                    onChange={(e) => setCustomDomain(e.target.value)}
                    placeholder="portal.youragency.com"
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    Point your DNS CNAME record to <code className="text-indigo-600 bg-indigo-50 px-1 rounded font-mono">cname.omnisocial.io</code>
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Agency Logo URL
                  </label>
                  <input
                    type="url"
                    value={logoUrl}
                    onChange={(e) => setLogoUrl(e.target.value)}
                    placeholder="https://youragency.com/logo.png"
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Favicon URL (.ico or .png)
                  </label>
                  <input
                    type="url"
                    value={faviconUrl}
                    onChange={(e) => setFaviconUrl(e.target.value)}
                    placeholder="https://youragency.com/favicon.ico"
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Client Support Email
                </label>
                <input
                  type="email"
                  value={supportEmail}
                  onChange={(e) => setSupportEmail(e.target.value)}
                  placeholder="vip-support@youragency.com"
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            {/* Color Palette Card */}
            <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs space-y-5">
              <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                <Palette className="w-5 h-5 text-indigo-600" />
                <h2 className="text-sm font-bold uppercase tracking-wider text-slate-700">
                  Custom Brand Color Palette
                </h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Primary Theme
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={primaryColor}
                      onChange={(e) => setPrimaryColor(e.target.value)}
                      className="w-10 h-10 rounded-lg cursor-pointer border border-slate-200 p-0.5"
                    />
                    <input
                      type="text"
                      value={primaryColor}
                      onChange={(e) => setPrimaryColor(e.target.value)}
                      className="flex-1 px-2.5 py-1.5 text-xs font-mono border border-slate-200 rounded-lg"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Secondary Gradient
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={secondaryColor}
                      onChange={(e) => setSecondaryColor(e.target.value)}
                      className="w-10 h-10 rounded-lg cursor-pointer border border-slate-200 p-0.5"
                    />
                    <input
                      type="text"
                      value={secondaryColor}
                      onChange={(e) => setSecondaryColor(e.target.value)}
                      className="flex-1 px-2.5 py-1.5 text-xs font-mono border border-slate-200 rounded-lg"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Accent Highlight
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={accentColor}
                      onChange={(e) => setAccentColor(e.target.value)}
                      className="w-10 h-10 rounded-lg cursor-pointer border border-slate-200 p-0.5"
                    />
                    <input
                      type="text"
                      value={accentColor}
                      onChange={(e) => setAccentColor(e.target.value)}
                      className="flex-1 px-2.5 py-1.5 text-xs font-mono border border-slate-200 rounded-lg"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Portal Controls Card */}
            <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs space-y-5">
              <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                <Sliders className="w-5 h-5 text-indigo-600" />
                <h2 className="text-sm font-bold uppercase tracking-wider text-slate-700">
                  Portal Header &amp; CSS Injection
                </h2>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Browser Title &amp; Portal Headline
                </label>
                <input
                  type="text"
                  value={portalTitle}
                  onChange={(e) => setPortalTitle(e.target.value)}
                  placeholder="Apex Intelligence Client Suite"
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Custom CSS Overrides
                </label>
                <textarea
                  rows={3}
                  value={customCss}
                  onChange={(e) => setCustomCss(e.target.value)}
                  placeholder=":root { --portal-radius: 14px; }"
                  className="w-full px-3 py-2 text-xs font-mono border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="pt-2 space-y-3">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={hidePoweredBy}
                    onChange={(e) => setHidePoweredBy(e.target.checked)}
                    className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300"
                  />
                  <div>
                    <span className="text-xs font-semibold text-slate-800">
                      Hide &ldquo;Powered by OmniSocial AI&rdquo; Badge
                    </span>
                    <p className="text-[11px] text-slate-500">
                      Completely remove platform watermarks from report exports and client-facing views.
                    </p>
                  </div>
                </label>

                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isEnabled}
                    onChange={(e) => setIsEnabled(e.target.checked)}
                    className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300"
                  />
                  <div>
                    <span className="text-xs font-semibold text-slate-800">
                      Enable Client Portal Access
                    </span>
                    <p className="text-[11px] text-slate-500">
                      Allow stakeholders to authenticate into your agency white-label subdomain.
                    </p>
                  </div>
                </label>
              </div>
            </div>
          </form>
        </div>

        {/* Right Column: Live Interactive Portal Preview (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400">
            <Eye className="w-4 h-4 text-indigo-600" />
            <span>Live Client Portal Preview</span>
          </div>

          <div className="border border-slate-200/80 rounded-2xl bg-slate-100/60 p-4 shadow-sm">
            {/* Mock Browser Window */}
            <div className="bg-white rounded-xl overflow-hidden border border-slate-200 shadow-md">
              {/* Window Header */}
              <div className="bg-slate-100 px-4 py-2 border-b border-slate-200 flex items-center gap-2">
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                </div>
                <div className="flex-1 text-center">
                  <span className="text-[10px] text-slate-500 font-mono bg-white px-3 py-0.5 rounded-md border border-slate-200/60 inline-block">
                    https://{customDomain || 'clients.agency.com'}
                  </span>
                </div>
              </div>

              {/* Portal Header Component */}
              <div
                style={{
                  background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`,
                }}
                className="p-5 text-white transition-colors duration-200"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {logoUrl ? (
                      <img
                        src={logoUrl}
                        alt="Logo Preview"
                        className="h-8 max-w-[100px] object-contain bg-white/20 p-1 rounded-md"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = 'none';
                        }}
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center font-bold text-white text-sm">
                        {brandName ? brandName.charAt(0).toUpperCase() : 'A'}
                      </div>
                    )}
                    <div>
                      <h3 className="font-bold text-sm tracking-tight leading-snug">
                        {brandName || 'Apex Agency'}
                      </h3>
                      <p className="text-[10px] text-white/80">
                        {portalTitle || 'Executive Intelligence Suite'}
                      </p>
                    </div>
                  </div>
                  <span
                    style={{ backgroundColor: accentColor }}
                    className="text-[10px] font-bold text-white px-2 py-0.5 rounded-full shadow-xs"
                  >
                    Client VIP
                  </span>
                </div>
              </div>

              {/* Portal Body Preview */}
              <div className="p-4 bg-slate-50/70 space-y-3">
                <div className="text-[11px] font-semibold text-slate-700">
                  Real-Time Executive Highlights
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="p-2.5 bg-white border border-slate-200/80 rounded-lg shadow-2xs">
                    <span className="text-[9px] uppercase font-bold text-slate-400 block">
                      Impressions
                    </span>
                    <span
                      style={{ color: primaryColor }}
                      className="text-sm font-bold block mt-0.5"
                    >
                      342,120
                    </span>
                  </div>
                  <div className="p-2.5 bg-white border border-slate-200/80 rounded-lg shadow-2xs">
                    <span className="text-[9px] uppercase font-bold text-slate-400 block">
                      ROI Attributed Clicks
                    </span>
                    <span
                      style={{ color: accentColor }}
                      className="text-sm font-bold block mt-0.5"
                    >
                      8,450
                    </span>
                  </div>
                </div>

                <div className="p-2.5 bg-white border border-slate-200/80 rounded-lg shadow-2xs space-y-1.5">
                  <div className="flex justify-between items-center text-[10px]">
                    <span className="font-semibold text-slate-700">Sentiment Polarity</span>
                    <span className="text-emerald-600 font-bold">92% Positive</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                    <div
                      style={{ backgroundColor: accentColor }}
                      className="h-1.5 rounded-full w-[92%]"
                    />
                  </div>
                </div>

                <div className="pt-2 flex justify-between items-center text-[9px] text-slate-400 border-t border-slate-200/60">
                  <span>{supportEmail ? `Support: ${supportEmail}` : 'Dedicated Account Team'}</span>
                  <span>
                    {hidePoweredBy ? '' : 'Powered by OmniSocial AI'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-indigo-50/60 border border-indigo-100 rounded-xl p-4 text-xs text-indigo-950 space-y-2">
            <div className="flex items-center gap-1.5 font-bold text-indigo-900">
              <ShieldCheck className="w-4 h-4 text-indigo-600" />
              <span>Agency White-Label Guarantee</span>
            </div>
            <p className="text-[11px] leading-relaxed text-indigo-800/90">
              All executive PDF and HTML reports generated from your workspace automatically inherit this brand styling, custom colors, and logo header.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
