'use client';

import React, { useEffect, useState } from 'react';
import { useWorkspace } from '@/lib/workspace-context';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';
import { Badge } from '@/components/ui/Badge';
import { apiClient } from '@/lib/api-client';
import {
  Building2,
  Globe,
  Clock,
  Shield,
  Save,
  CheckCircle2,
  AlertCircle,
  Briefcase,
  Users,
} from 'lucide-react';
import Link from 'next/link';
import { ROUTES } from '@/lib/constants';

interface WorkspaceDetail {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  logoUrl: string | null;
  websiteUrl: string | null;
  industry: string | null;
  timezone: string;
  defaultLanguage: string;
  status: string;
  currentUserRole: 'OWNER' | 'ADMIN' | 'EDITOR' | 'VIEWER' | null;
  memberCount?: number;
}

export default function WorkspaceSettingsPage() {
  const { currentWorkspace, refreshWorkspaces, isLoadingWorkspaces } = useWorkspace();

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    industry: '',
    timezone: 'UTC',
    websiteUrl: '',
    defaultLanguage: 'en',
  });

  const [workspaceDetail, setWorkspaceDetail] = useState<WorkspaceDetail | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!currentWorkspace?.id) return;

    let isMounted = true;
    setIsLoading(true);
    setSuccessMessage(null);
    setErrorMessage(null);

    apiClient<WorkspaceDetail>(`/workspaces/${currentWorkspace.id}`)
      .then((data) => {
        if (!isMounted) return;
        setWorkspaceDetail(data);
        setFormData({
          name: data.name || '',
          description: data.description || '',
          industry: data.industry || '',
          timezone: data.timezone || 'UTC',
          websiteUrl: data.websiteUrl || '',
          defaultLanguage: data.defaultLanguage || 'en',
        });
      })
      .catch((err) => {
        if (isMounted) {
          setErrorMessage(err.message || 'Failed to load workspace settings');
        }
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [currentWorkspace?.id]);

  const canEdit =
    workspaceDetail?.currentUserRole === 'OWNER' ||
    workspaceDetail?.currentUserRole === 'ADMIN' ||
    currentWorkspace?.currentUserRole === 'OWNER' ||
    currentWorkspace?.currentUserRole === 'ADMIN';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentWorkspace?.id || !canEdit) return;

    setIsSaving(true);
    setSuccessMessage(null);
    setErrorMessage(null);

    try {
      await apiClient(`/workspaces/${currentWorkspace.id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          name: formData.name,
          description: formData.description || null,
          industry: formData.industry || null,
          timezone: formData.timezone,
          websiteUrl: formData.websiteUrl || null,
          defaultLanguage: formData.defaultLanguage,
        }),
      });

      setSuccessMessage('Workspace settings updated successfully.');
      await refreshWorkspaces();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to update workspace settings');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoadingWorkspaces || isLoading) {
    return (
      <div className="max-w-4xl mx-auto py-12 text-center space-y-3 animate-fadeIn">
        <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-xs text-slate-500 font-medium">Loading workspace settings...</p>
      </div>
    );
  }

  if (!currentWorkspace) {
    return (
      <div className="max-w-md mx-auto py-12 text-center space-y-4 animate-fadeIn">
        <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl w-fit mx-auto">
          <Building2 className="w-8 h-8" />
        </div>
        <h2 className="text-lg font-bold text-slate-900">No Active Workspace</h2>
        <p className="text-xs text-slate-500">
          You are not currently viewing any workspace. Create a business workspace or ask your team for an invitation.
        </p>
        <Link href={ROUTES.WORKSPACE_ONBOARDING}>
          <Button size="sm">Create a Workspace</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Workspace Settings
            </h1>
            <Badge variant={workspaceDetail?.status === 'ACTIVE' ? 'success' : 'outline'}>
              {workspaceDetail?.status || 'ACTIVE'}
            </Badge>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Manage your company profile, business industry, operational timezone, and locale.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link href={ROUTES.SETTINGS_MEMBERS}>
            <Button variant="outline" size="sm" leftIcon={<Users className="w-3.5 h-3.5" />}>
              Manage Members
            </Button>
          </Link>
        </div>
      </div>

      {successMessage && <Alert type="success" message={successMessage} />}
      {errorMessage && <Alert type="error" message={errorMessage} />}

      {!canEdit && (
        <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800 flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold block">Read-Only Access</span>
            You are currently viewing this workspace as{' '}
            <strong className="font-semibold">{workspaceDetail?.currentUserRole || 'MEMBER'}</strong>.
            Only Workspace Owners and Administrators can modify business configurations.
          </div>
        </div>
      )}

      {/* Main Settings Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <CardTitle>Business Profile</CardTitle>
                <CardDescription>
                  Public identity, workspace handle, and brand presence
                </CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Business Name"
                required
                disabled={!canEdit}
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Acme Media Group"
              />

              <div className="w-full space-y-1.5">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                  Workspace Slug
                </label>
                <div className="relative rounded-lg shadow-sm">
                  <input
                    disabled
                    value={workspaceDetail?.slug || ''}
                    className="w-full rounded-lg border border-slate-200 bg-slate-100 px-3 py-2.5 text-sm text-slate-500 cursor-not-allowed"
                  />
                </div>
                <p className="text-[11px] text-slate-400">
                  Unique identifier used for multi-tenant isolation and routing.
                </p>
              </div>
            </div>

            <div className="w-full space-y-1.5">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                Business Description
              </label>
              <textarea
                rows={3}
                disabled={!canEdit}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Brief summary of your business, focus areas, or marketing goals..."
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1 focus:border-indigo-500 focus:ring-indigo-200 disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="w-full space-y-1.5">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                  Industry Focus
                </label>
                <div className="relative rounded-lg shadow-sm">
                  <select
                    disabled={!canEdit}
                    value={formData.industry}
                    onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1 focus:border-indigo-500 focus:ring-indigo-200 disabled:bg-slate-50 disabled:text-slate-500"
                  >
                    <option value="">Select industry...</option>
                    <option value="E-commerce & Retail">E-commerce &amp; Retail</option>
                    <option value="SaaS & Technology">SaaS &amp; Technology</option>
                    <option value="Healthcare & Wellness">Healthcare &amp; Wellness</option>
                    <option value="Finance & Real Estate">Finance &amp; Real Estate</option>
                    <option value="Education & Non-profit">Education &amp; Non-profit</option>
                    <option value="Agency & Consulting">Agency &amp; Consulting</option>
                    <option value="Food & Hospitality">Food &amp; Hospitality</option>
                    <option value="Entertainment & Media">Entertainment &amp; Media</option>
                  </select>
                </div>
              </div>

              <Input
                label="Website URL"
                type="url"
                disabled={!canEdit}
                leftIcon={<Globe className="w-4 h-4" />}
                value={formData.websiteUrl}
                onChange={(e) => setFormData({ ...formData, websiteUrl: e.target.value })}
                placeholder="https://example.com"
              />
            </div>
          </CardContent>
        </Card>

        {/* Localization & Region */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <CardTitle>Regional &amp; Scheduling Preferences</CardTitle>
                <CardDescription>
                  Timezone alignment for social post scheduling and regional calendars
                </CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="w-full space-y-1.5">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                Operational Timezone
              </label>
              <select
                disabled={!canEdit}
                value={formData.timezone}
                onChange={(e) => setFormData({ ...formData, timezone: e.target.value })}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1 focus:border-indigo-500 focus:ring-indigo-200 disabled:bg-slate-50 disabled:text-slate-500"
              >
                <option value="UTC">UTC (Coordinated Universal Time)</option>
                <option value="America/New_York">Eastern Time (US &amp; Canada)</option>
                <option value="America/Chicago">Central Time (US &amp; Canada)</option>
                <option value="America/Los_Angeles">Pacific Time (US &amp; Canada)</option>
                <option value="Europe/London">London (GMT / BST)</option>
                <option value="Europe/Paris">Paris, Berlin, Rome (CET)</option>
                <option value="Asia/Dubai">Dubai (GST +4)</option>
                <option value="Asia/Kolkata">India Standard Time (IST +5:30)</option>
                <option value="Asia/Singapore">Singapore, Hong Kong (SGT +8)</option>
                <option value="Asia/Tokyo">Tokyo (JST +9)</option>
              </select>
            </div>

            <div className="w-full space-y-1.5">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                Default Language
              </label>
              <select
                disabled={!canEdit}
                value={formData.defaultLanguage}
                onChange={(e) => setFormData({ ...formData, defaultLanguage: e.target.value })}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1 focus:border-indigo-500 focus:ring-indigo-200 disabled:bg-slate-50 disabled:text-slate-500"
              >
                <option value="en">English (US / Global)</option>
                <option value="es">Spanish (Español)</option>
                <option value="fr">French (Français)</option>
                <option value="de">German (Deutsch)</option>
                <option value="hi">Hindi (हिन्दी)</option>
                <option value="ar">Arabic (العربية)</option>
              </select>
            </div>
          </CardContent>

          {canEdit && (
            <CardFooter className="flex justify-end pt-4 border-t border-slate-100">
              <Button
                type="submit"
                isLoading={isSaving}
                leftIcon={<Save className="w-4 h-4" />}
              >
                Save Workspace Settings
              </Button>
            </CardFooter>
          )}
        </Card>
      </form>
    </div>
  );
}
