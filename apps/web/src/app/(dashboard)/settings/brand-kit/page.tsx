'use client';

import React, { useEffect, useState } from 'react';
import { useWorkspace } from '@/lib/workspace-context';
import { apiClient, ApiError } from '@/lib/api-client';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Alert } from '@/components/ui/Alert';
import { Badge } from '@/components/ui/Badge';
import { WorkspaceBrandProfileDto, WorkspaceRole } from '@packages/shared';
import {
  Palette,
  Sparkles,
  Building2,
  Globe,
  Mail,
  Phone,
  MapPin,
  Check,
  AlertCircle,
  Loader2,
  Save,
  HelpCircle,
} from 'lucide-react';

const COMMON_LANGUAGES = [
  { code: 'en', name: 'English' },
  { code: 'gu', name: 'Gujarati (ગુજરાતી)' },
  { code: 'hi', name: 'Hindi (हिन्दी)' },
  { code: 'mr', name: 'Marathi (मराठी)' },
  { code: 'bn', name: 'Bengali (বাংলা)' },
  { code: 'ta', name: 'Tamil (தமிழ்)' },
  { code: 'te', name: 'Telugu (తెలుగు)' },
  { code: 'es', name: 'Spanish' },
  { code: 'fr', name: 'French' },
];

export default function BrandKitPage() {
  const { currentWorkspace } = useWorkspace();
  const userRole = currentWorkspace?.currentUserRole;
  const [profile, setProfile] = useState<Partial<WorkspaceBrandProfileDto>>({
    businessName: '',
    industry: '',
    businessDescription: '',
    targetAudience: '',
    productsAndServices: '',
    brandVoice: 'Professional, warm, authentic, culturally respectful',
    primaryColor: '#4F46E5',
    secondaryColor: '#F59E0B',
    preferredLanguage: 'en',
    supportedLanguages: ['en', 'hi', 'gu'],
    websiteUrl: '',
    logoUrl: '',
    contactDetails: {
      email: '',
      phone: '',
      address: '',
    },
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const canEdit = userRole === WorkspaceRole.OWNER || userRole === WorkspaceRole.ADMIN;

  useEffect(() => {
    if (!currentWorkspace?.id) return;
    loadBrandProfile();
  }, [currentWorkspace?.id]);

  const loadBrandProfile = async () => {
    if (!currentWorkspace) return;
    setIsLoading(true);
    setStatusMessage(null);
    try {
      const res = await apiClient<any>(
        `/workspaces/${currentWorkspace.id}/brand-profile`,
      );
      const data: WorkspaceBrandProfileDto | null = res?.data ?? res;
      if (data && typeof data === 'object') {
        setProfile({
          ...data,
          businessName: data.businessName || currentWorkspace.name,
          contactDetails: data.contactDetails || { email: '', phone: '', address: '' },
          supportedLanguages: data.supportedLanguages || ['en'],
        });
      }
    } catch (err: any) {
      // If 404, populate businessName from workspace
      setProfile((prev) => ({
        ...prev,
        businessName: currentWorkspace.name,
        industry: currentWorkspace.industry || '',
      }));
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentWorkspace || !canEdit) return;

    setIsSaving(true);
    setStatusMessage(null);

    try {
      const res = await apiClient<{ success: boolean; data: WorkspaceBrandProfileDto }>(
        `/workspaces/${currentWorkspace.id}/brand-profile`,
        {
          method: 'PUT',
          body: JSON.stringify({
            businessName: profile.businessName?.trim(),
            industry: profile.industry?.trim() || undefined,
            businessDescription: profile.businessDescription?.trim() || undefined,
            targetAudience: profile.targetAudience?.trim() || undefined,
            productsAndServices: profile.productsAndServices?.trim() || undefined,
            brandVoice: profile.brandVoice?.trim() || undefined,
            primaryColor: profile.primaryColor?.trim() || undefined,
            secondaryColor: profile.secondaryColor?.trim() || undefined,
            preferredLanguage: profile.preferredLanguage || 'en',
            supportedLanguages: profile.supportedLanguages && profile.supportedLanguages.length > 0
              ? profile.supportedLanguages
              : ['en'],
            websiteUrl: profile.websiteUrl?.trim() || undefined,
            logoUrl: profile.logoUrl?.trim() || undefined,
            contactDetails: profile.contactDetails,
          }),
        },
      );

      setProfile((res as any)?.data ?? res);
      setStatusMessage({
        type: 'success',
        message: 'Brand Kit successfully updated. AI generation will now use your exact brand voice, guidelines, and colors.',
      });
    } catch (err: any) {
      setStatusMessage({
        type: 'error',
        message: err.message || 'Failed to save brand profile. Please check that URLs include http/https protocols.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const toggleLanguage = (code: string) => {
    if (!canEdit) return;
    const current = profile.supportedLanguages || [];
    if (current.includes(code)) {
      if (current.length > 1) {
        setProfile({ ...profile, supportedLanguages: current.filter((c) => c !== code) });
      }
    } else {
      setProfile({ ...profile, supportedLanguages: [...current, code] });
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
        <p className="text-sm text-slate-500">Loading workspace Brand Kit...</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl shadow-xl border border-indigo-900/30">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
              <Palette className="w-5 h-5" />
            </span>
            <h1 className="text-xl font-bold tracking-tight">Workspace Brand Kit</h1>
          </div>
          <p className="text-xs text-slate-300 max-w-xl">
            Configure your brand identity, colors, tone, and audience. OmniSocial AI injects these parameters into every prompt to craft on-brand copy and visual directions.
          </p>
        </div>

        {/* Live Brand Palette Preview */}
        <div className="flex items-center gap-3 bg-white/10 backdrop-blur-md px-4 py-2.5 rounded-xl border border-white/15">
          <div className="flex flex-col text-right">
            <span className="text-[10px] text-slate-300 uppercase tracking-wider font-semibold">Active Palette</span>
            <span className="text-xs font-bold">{profile.businessName || 'Brand'}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div
              className="w-7 h-7 rounded-lg shadow-inner border border-white/20"
              style={{ backgroundColor: profile.primaryColor || '#4F46E5' }}
              title={`Primary: ${profile.primaryColor}`}
            />
            <div
              className="w-7 h-7 rounded-lg shadow-inner border border-white/20"
              style={{ backgroundColor: profile.secondaryColor || '#F59E0B' }}
              title={`Secondary: ${profile.secondaryColor}`}
            />
          </div>
        </div>
      </div>

      {statusMessage && (
        <Alert
          type={statusMessage.type === 'success' ? 'success' : 'error'}
          title={statusMessage.type === 'success' ? 'Settings Saved' : 'Update Failed'}
          message={statusMessage.message}
        />
      )}

      {!canEdit && (
        <Alert
          type="info"
          title="Read-Only View"
          message="You have Editor or Viewer permissions. Only workspace Owners and Admins can update the official Brand Kit."
        />
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* Core Identity */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2 text-indigo-600">
              <Building2 className="w-4 h-4" />
              <CardTitle className="text-sm font-semibold">Brand Identity &amp; Voice</CardTitle>
            </div>
            <CardDescription className="text-xs">
              Essential business details used by prompt synthesis algorithms
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Business / Brand Name"
                required
                disabled={!canEdit}
                value={profile.businessName || ''}
                onChange={(e) => setProfile({ ...profile, businessName: e.target.value })}
                placeholder="e.g. Om Artisanal Silks"
              />
              <Input
                label="Industry / Domain"
                disabled={!canEdit}
                value={profile.industry || ''}
                onChange={(e) => setProfile({ ...profile, industry: e.target.value })}
                placeholder="e.g. Handloom Textiles &amp; Fashion"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Business Description &amp; Heritage
              </label>
              <textarea
                disabled={!canEdit}
                rows={3}
                className="w-full text-xs rounded-lg border border-slate-300 p-2.5 focus:ring-2 focus:ring-indigo-500 focus:outline-none disabled:bg-slate-50 disabled:text-slate-500"
                value={profile.businessDescription || ''}
                onChange={(e) => setProfile({ ...profile, businessDescription: e.target.value })}
                placeholder="Describe what your business does, your USP, founding heritage, and quality commitment..."
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Target Audience
                </label>
                <textarea
                  disabled={!canEdit}
                  rows={2}
                  className="w-full text-xs rounded-lg border border-slate-300 p-2.5 focus:ring-2 focus:ring-indigo-500 focus:outline-none disabled:bg-slate-50"
                  value={profile.targetAudience || ''}
                  onChange={(e) => setProfile({ ...profile, targetAudience: e.target.value })}
                  placeholder="e.g. Traditional wedding shoppers, diaspora looking for authentic ethnic craft..."
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Products &amp; Key Offerings
                </label>
                <textarea
                  disabled={!canEdit}
                  rows={2}
                  className="w-full text-xs rounded-lg border border-slate-300 p-2.5 focus:ring-2 focus:ring-indigo-500 focus:outline-none disabled:bg-slate-50"
                  value={profile.productsAndServices || ''}
                  onChange={(e) => setProfile({ ...profile, productsAndServices: e.target.value })}
                  placeholder="e.g. Pure silk Patola sarees, handcrafted Bandhani dupattas, gift hampers..."
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
                <span>Brand Voice &amp; Tone Guidelines</span>
                <span className="text-[10px] text-slate-400 font-normal">(Crucial for AI copy personality)</span>
              </label>
              <Input
                disabled={!canEdit}
                value={profile.brandVoice || ''}
                onChange={(e) => setProfile({ ...profile, brandVoice: e.target.value })}
                placeholder="e.g. Graceful, culturally rooted, respectful, celebratory, authentic"
              />
            </div>
          </CardContent>
        </Card>

        {/* Brand Colors & Visual Aesthetics */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2 text-indigo-600">
              <Palette className="w-4 h-4" />
              <CardTitle className="text-sm font-semibold">Visual Palette &amp; Colors</CardTitle>
            </div>
            <CardDescription className="text-xs">
              Primary and secondary brand hex colors passed to AI creative visual briefs
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Primary Color */}
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-700">Primary Brand Color</span>
                  <div
                    className="w-6 h-6 rounded-md shadow border border-slate-300"
                    style={{ backgroundColor: profile.primaryColor || '#4F46E5' }}
                  />
                </div>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    disabled={!canEdit}
                    value={profile.primaryColor || '#4F46E5'}
                    onChange={(e) => setProfile({ ...profile, primaryColor: e.target.value.toUpperCase() })}
                    className="w-10 h-10 rounded-lg cursor-pointer border border-slate-300 p-0.5 bg-white disabled:cursor-not-allowed"
                  />
                  <Input
                    disabled={!canEdit}
                    value={profile.primaryColor || '#4F46E5'}
                    onChange={(e) => setProfile({ ...profile, primaryColor: e.target.value })}
                    placeholder="#4F46E5"
                    className="font-mono text-xs uppercase"
                  />
                </div>
              </div>

              {/* Secondary Color */}
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-700">Secondary / Accent Color</span>
                  <div
                    className="w-6 h-6 rounded-md shadow border border-slate-300"
                    style={{ backgroundColor: profile.secondaryColor || '#F59E0B' }}
                  />
                </div>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    disabled={!canEdit}
                    value={profile.secondaryColor || '#F59E0B'}
                    onChange={(e) => setProfile({ ...profile, secondaryColor: e.target.value.toUpperCase() })}
                    className="w-10 h-10 rounded-lg cursor-pointer border border-slate-300 p-0.5 bg-white disabled:cursor-not-allowed"
                  />
                  <Input
                    disabled={!canEdit}
                    value={profile.secondaryColor || '#F59E0B'}
                    onChange={(e) => setProfile({ ...profile, secondaryColor: e.target.value })}
                    placeholder="#F59E0B"
                    className="font-mono text-xs uppercase"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <Input
                label="Official Website URL"
                disabled={!canEdit}
                value={profile.websiteUrl || ''}
                onChange={(e) => setProfile({ ...profile, websiteUrl: e.target.value })}
                placeholder="https://yourbrand.com"
              />
              <Input
                label="Logo Image URL"
                disabled={!canEdit}
                value={profile.logoUrl || ''}
                onChange={(e) => setProfile({ ...profile, logoUrl: e.target.value })}
                placeholder="https://yourbrand.com/assets/logo.png"
              />
            </div>
          </CardContent>
        </Card>

        {/* Languages & Locales */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2 text-indigo-600">
              <Globe className="w-4 h-4" />
              <CardTitle className="text-sm font-semibold">Languages &amp; Multilingual Support</CardTitle>
            </div>
            <CardDescription className="text-xs">
              OmniSocial AI can generate native posts and translate variants into target regional languages
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Default Content Language
                </label>
                <select
                  disabled={!canEdit}
                  value={profile.preferredLanguage || 'en'}
                  onChange={(e) => setProfile({ ...profile, preferredLanguage: e.target.value })}
                  className="w-full text-xs rounded-lg border border-slate-300 p-2.5 bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                >
                  {COMMON_LANGUAGES.map((lang) => (
                    <option key={lang.code} value={lang.code}>
                      {lang.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-2">
                Supported Multilingual Target Languages (Click to toggle)
              </label>
              <div className="flex flex-wrap gap-2">
                {COMMON_LANGUAGES.map((lang) => {
                  const isSelected = (profile.supportedLanguages || []).includes(lang.code);
                  return (
                    <button
                      type="button"
                      key={lang.code}
                      onClick={() => toggleLanguage(lang.code)}
                      disabled={!canEdit}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                        isSelected
                          ? 'bg-indigo-600 text-white shadow-xs'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {isSelected && <Check className="w-3 h-3" />}
                      <span>{lang.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Contact Information (For Social Posts) */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2 text-indigo-600">
              <Mail className="w-4 h-4" />
              <CardTitle className="text-sm font-semibold">Public Contact Details</CardTitle>
            </div>
            <CardDescription className="text-xs">
              Used when generating Call-To-Action (CTA) footers and direct inquiry prompts
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Input
                label="Contact Email"
                disabled={!canEdit}
                value={profile.contactDetails?.email || ''}
                onChange={(e) =>
                  setProfile({
                    ...profile,
                    contactDetails: { ...profile.contactDetails, email: e.target.value },
                  })
                }
                placeholder="sales@yourbrand.com"
              />
              <Input
                label="Business Inquiry Phone"
                disabled={!canEdit}
                value={profile.contactDetails?.phone || ''}
                onChange={(e) =>
                  setProfile({
                    ...profile,
                    contactDetails: { ...profile.contactDetails, phone: e.target.value },
                  })
                }
                placeholder="+91 98765 43210"
              />
              <Input
                label="Physical Address / City"
                disabled={!canEdit}
                value={profile.contactDetails?.address || ''}
                onChange={(e) =>
                  setProfile({
                    ...profile,
                    contactDetails: { ...profile.contactDetails, address: e.target.value },
                  })
                }
                placeholder="Patan, Gujarat, India"
              />
            </div>
          </CardContent>
          {canEdit && (
            <CardFooter className="flex justify-end pt-4 border-t border-slate-100">
              <Button type="submit" disabled={isSaving} className="gap-2">
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                <span>{isSaving ? 'Saving Brand Kit...' : 'Save Brand Kit'}</span>
              </Button>
            </CardFooter>
          )}
        </Card>
      </form>
    </div>
  );
}
