'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useWorkspace } from '@/lib/workspace-context';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Alert } from '@/components/ui/Alert';
import { apiClient } from '@/lib/api-client';
import {
  MessageSquare,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Trash2,
  PlusCircle,
  ShieldCheck,
  Building2,
  Key,
  Info,
  Smartphone,
  Copy,
  Check,
  Send,
} from 'lucide-react';
import { API_BASE_URL } from '@/lib/constants';

interface WhatsAppSettings {
  id?: string;
  workspaceId: string;
  wabaId: string;
  phoneNumberId: string;
  businessPhoneNumber?: string;
  hasConfiguredToken: boolean;
  isActive: boolean;
}

interface RecipientConsent {
  id: string;
  workspaceId: string;
  phoneNumber: string;
  displayName: string;
  status: 'OPTED_IN' | 'OPTED_OUT' | 'PENDING_VERIFICATION';
  optedInAt: string;
  optedOutAt?: string;
}

export default function WhatsAppSettingsPage() {
  const { currentWorkspace, isLoadingWorkspaces } = useWorkspace();

  const [settings, setSettings] = useState<WhatsAppSettings | null>(null);
  const [recipients, setRecipients] = useState<RecipientConsent[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Form inputs for credentials
  const [wabaId, setWabaId] = useState('');
  const [phoneNumberId, setPhoneNumberId] = useState('');
  const [systemUserAccessToken, setSystemUserAccessToken] = useState('');
  const [businessPhoneNumber, setBusinessPhoneNumber] = useState('');

  // Add Recipient Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [newRecipientName, setNewRecipientName] = useState('');
  const [newRecipientPhone, setNewRecipientPhone] = useState('');
  const [consentAcknowledged, setConsentAcknowledged] = useState(false);
  const [isAddingRecipient, setIsAddingRecipient] = useState(false);

  const [copiedWebhook, setCopiedWebhook] = useState(false);

  const canManage =
    currentWorkspace?.currentUserRole === 'OWNER' ||
    currentWorkspace?.currentUserRole === 'ADMIN';

  const fetchData = useCallback(async () => {
    if (!currentWorkspace?.id) return;
    setIsLoading(true);
    setErrorMessage(null);
    try {
      // 1. Fetch settings
      const settingsRes = await apiClient<{ success: boolean; data: WhatsAppSettings | null }>(
        `/workspaces/${currentWorkspace.id}/whatsapp/settings`,
      );
      if (settingsRes?.data) {
        setSettings(settingsRes.data);
        setWabaId(settingsRes.data.wabaId || '');
        setPhoneNumberId(settingsRes.data.phoneNumberId || '');
        setBusinessPhoneNumber(settingsRes.data.businessPhoneNumber || '');
      } else {
        setSettings(null);
      }

      // 2. Fetch recipients
      const recipientsRes = await apiClient<{ success: boolean; data: RecipientConsent[] }>(
        `/workspaces/${currentWorkspace.id}/whatsapp/recipients`,
      );
      setRecipients(recipientsRes?.data || []);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to load WhatsApp configuration');
    } finally {
      setIsLoading(false);
    }
  }, [currentWorkspace?.id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentWorkspace?.id || !canManage) return;

    if (!wabaId.trim() || !phoneNumberId.trim() || (!systemUserAccessToken.trim() && !settings?.hasConfiguredToken)) {
      setErrorMessage('WABA ID, Phone Number ID, and System User Access Token are required');
      return;
    }

    setIsSaving(true);
    setSuccessMessage(null);
    setErrorMessage(null);

    try {
      const res = await apiClient<{ success: boolean; message: string; data: WhatsAppSettings }>(
        `/workspaces/${currentWorkspace.id}/whatsapp/settings`,
        {
          method: 'PUT',
          body: JSON.stringify({
            wabaId: wabaId.trim(),
            phoneNumberId: phoneNumberId.trim(),
            systemUserAccessToken: systemUserAccessToken.trim() || 'PRESERVE_EXISTING',
            businessPhoneNumber: businessPhoneNumber.trim() || undefined,
          }),
        },
      );

      setSettings(res.data);
      setSystemUserAccessToken(''); // Clear sensitive token from state
      setSuccessMessage('WhatsApp Business credentials securely vaulted (AES-256-GCM) and updated.');
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to update WhatsApp credentials');
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddRecipient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentWorkspace?.id || !canManage) return;

    if (!consentAcknowledged) {
      setErrorMessage('Explicit consent confirmation is mandatory before registering a reviewer');
      return;
    }

    setIsAddingRecipient(true);
    try {
      await apiClient(`/workspaces/${currentWorkspace.id}/whatsapp/recipients`, {
        method: 'POST',
        body: JSON.stringify({
          displayName: newRecipientName.trim(),
          phoneNumber: newRecipientPhone.trim(),
          consentAcknowledged: true,
        }),
      });

      setShowAddModal(false);
      setNewRecipientName('');
      setNewRecipientPhone('');
      setConsentAcknowledged(false);
      setSuccessMessage('Reviewer successfully registered with active WhatsApp notification consent.');
      fetchData();
    } catch (err: any) {
      alert(`Error registering recipient: ${err.message}`);
    } finally {
      setIsAddingRecipient(false);
    }
  };

  const handleRevokeRecipient = async (recipientId: string, name: string) => {
    if (!currentWorkspace?.id || !canManage) return;
    if (!confirm(`Are you sure you want to revoke consent for ${name}? Notifications to this number will be permanently suppressed.`)) {
      return;
    }

    try {
      await apiClient(`/workspaces/${currentWorkspace.id}/whatsapp/recipients/${recipientId}`, {
        method: 'DELETE',
      });
      setSuccessMessage(`Consent revoked for ${name}.`);
      fetchData();
    } catch (err: any) {
      alert(`Revocation error: ${err.message}`);
    }
  };

  const copyWebhookUrl = () => {
    const url = `${API_BASE_URL}/whatsapp/webhook`;
    navigator.clipboard.writeText(url);
    setCopiedWebhook(true);
    setTimeout(() => setCopiedWebhook(false), 2000);
  };

  if (isLoadingWorkspaces) {
    return <div className="p-8 text-center text-slate-500">Loading workspace context...</div>;
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2 text-indigo-600 font-semibold text-xs uppercase tracking-wider mb-1">
            <Smartphone className="w-4 h-4" /> WhatsApp Business Cloud API
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">WhatsApp Review & Approvals</h1>
          <p className="text-sm text-slate-500 mt-1">
            Configure Meta WhatsApp Business credentials, webhook signatures, and reviewer consent for one-click post approvals.
          </p>
        </div>

        <Button variant="outline" size="sm" onClick={fetchData} disabled={isLoading}>
          <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Status Messages */}
      {successMessage && (
        <Alert type="success" message={successMessage} />
      )}

      {errorMessage && (
        <Alert type="error" message={errorMessage} />
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: WhatsApp Settings Form */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Key className="w-4 h-4 text-indigo-600" /> WhatsApp Cloud Credentials
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Credentials are encrypted with authenticated AES-256-GCM.
                  </CardDescription>
                </div>
                {settings?.hasConfiguredToken && (
                  <Badge variant="success" className="flex items-center gap-1 text-[11px]">
                    <ShieldCheck className="w-3.5 h-3.5" /> Token Encrypted
                  </Badge>
                )}
              </div>
            </CardHeader>

            <form onSubmit={handleSaveSettings}>
              <CardContent className="space-y-4 text-sm">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    WhatsApp Business Account ID (WABA ID) *
                  </label>
                  <input
                    type="text"
                    value={wabaId}
                    onChange={(e) => setWabaId(e.target.value)}
                    placeholder="e.g. 108923485729103"
                    disabled={!canManage || isSaving}
                    required
                    className="w-full text-xs p-2.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Phone Number ID *
                  </label>
                  <input
                    type="text"
                    value={phoneNumberId}
                    onChange={(e) => setPhoneNumberId(e.target.value)}
                    placeholder="e.g. 1009823481239"
                    disabled={!canManage || isSaving}
                    required
                    className="w-full text-xs p-2.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    System User Permanent Access Token {settings?.hasConfiguredToken ? '(Configured)' : '*'}
                  </label>
                  <input
                    type="password"
                    value={systemUserAccessToken}
                    onChange={(e) => setSystemUserAccessToken(e.target.value)}
                    placeholder={
                      settings?.hasConfiguredToken
                        ? '•••••••••••••••• (Leave blank to keep vaulted token)'
                        : 'EAAB... Meta System User Token'
                    }
                    disabled={!canManage || isSaving}
                    className="w-full text-xs p-2.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-mono"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    Token requires <code className="bg-slate-100 px-1 py-0.5 rounded">whatsapp_business_messaging</code> and <code className="bg-slate-100 px-1 py-0.5 rounded">whatsapp_business_management</code> scopes.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Business Display Phone Number (Optional)
                  </label>
                  <input
                    type="text"
                    value={businessPhoneNumber}
                    onChange={(e) => setBusinessPhoneNumber(e.target.value)}
                    placeholder="e.g. +91 98765 43210"
                    disabled={!canManage || isSaving}
                    className="w-full text-xs p-2.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>
              </CardContent>

              {canManage && (
                <CardFooter className="flex justify-end border-t border-slate-100 pt-4">
                  <Button type="submit" disabled={isSaving}>
                    {isSaving ? 'Encrypting & Saving...' : 'Save WhatsApp Configuration'}
                  </Button>
                </CardFooter>
              )}
            </form>
          </Card>

          {/* Registered Reviewers / Consent Registry */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div>
                <CardTitle className="text-base flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" /> Notification Reviewers
                </CardTitle>
                <CardDescription className="text-xs">
                  Reviewers registered with explicit consent to receive WhatsApp post previews.
                </CardDescription>
              </div>

              {canManage && (
                <Button size="sm" onClick={() => setShowAddModal(true)}>
                  <PlusCircle className="w-3.5 h-3.5 mr-1.5" />
                  Add Reviewer
                </Button>
              )}
            </CardHeader>

            <CardContent>
              {recipients.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-xs border border-dashed border-slate-200 rounded-xl">
                  No reviewers registered yet. Add team leads or stakeholders to dispatch WhatsApp approval previews.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-100 text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                        <th className="pb-2.5">Reviewer</th>
                        <th className="pb-2.5">Phone Number</th>
                        <th className="pb-2.5">Consent Status</th>
                        <th className="pb-2.5 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {recipients.map((rec) => (
                        <tr key={rec.id} className="hover:bg-slate-50/50">
                          <td className="py-3 font-semibold text-slate-900">{rec.displayName}</td>
                          <td className="py-3 font-mono text-slate-600">{rec.phoneNumber}</td>
                          <td className="py-3">
                            {rec.status === 'OPTED_IN' ? (
                              <Badge variant="success" className="text-[10px]">Opted In</Badge>
                            ) : (
                              <Badge variant="warning" className="text-[10px]">Opted Out</Badge>
                            )}
                          </td>
                          <td className="py-3 text-right">
                            {canManage && rec.status === 'OPTED_IN' && (
                              <button
                                onClick={() => handleRevokeRecipient(rec.id, rec.displayName)}
                                className="text-rose-500 hover:text-rose-700 text-xs inline-flex items-center gap-1 font-medium transition"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                <span>Revoke</span>
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Webhook Guidance & Status */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-1.5">
                <Info className="w-4 h-4 text-indigo-500" /> Meta Webhook Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-xs text-slate-600">
              <p>Configure this webhook endpoint in your Meta App Dashboard under WhatsApp &gt; Configuration:</p>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Callback URL</label>
                <div className="flex items-center gap-1">
                  <input
                    type="text"
                    readOnly
                    value={`${API_BASE_URL}/whatsapp/webhook`}
                    className="w-full text-[11px] bg-slate-50 p-2 rounded border border-slate-200 font-mono"
                  />
                  <button
                    onClick={copyWebhookUrl}
                    className="p-2 rounded border border-slate-200 hover:bg-slate-100 text-slate-600 shrink-0"
                  >
                    {copiedWebhook ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Webhook Subscriptions</label>
                <ul className="list-disc pl-4 space-y-1 text-slate-500 text-[11px]">
                  <li><code>messages</code> (captures inbound APPROVE/REJECT and STOP opt-out)</li>
                  <li><code>message_template_status_update</code></li>
                </ul>
              </div>

              <div className="bg-emerald-50 text-emerald-800 p-2.5 rounded-lg border border-emerald-100 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 shrink-0 text-emerald-600" />
                <span>HMAC-SHA256 signature verification enabled</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-1.5">
                <MessageSquare className="w-4 h-4 text-emerald-500" /> Reviewer Experience
              </CardTitle>
            </CardHeader>
            <CardContent className="text-xs text-slate-600 space-y-2">
              <p>
                When a draft is ready for review, click <strong>Send WhatsApp Preview</strong> on the draft page.
              </p>
              <p>
                Reviewers receive an official WhatsApp template message with a secure 24-hour review link. They can approve or request changes with one tap.
              </p>
              <p className="text-[11px] text-slate-400">
                Four-eyes separation of duties is automatically enforced: content creators cannot approve their own drafts unless they are the workspace owner.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Add Reviewer Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 border border-slate-200 shadow-xl">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-base">Register Reviewer</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600 text-sm">
                ✕
              </button>
            </div>

            <form onSubmit={handleAddRecipient} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Reviewer Name & Role *</label>
                <input
                  type="text"
                  value={newRecipientName}
                  onChange={(e) => setNewRecipientName(e.target.value)}
                  placeholder="e.g. Pooja Patel (VP Marketing)"
                  required
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Mobile Number (E.164 with Country Code) *
                </label>
                <input
                  type="text"
                  value={newRecipientPhone}
                  onChange={(e) => setNewRecipientPhone(e.target.value)}
                  placeholder="+91 98765 43210"
                  required
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-mono"
                />
              </div>

              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 flex items-start gap-2.5">
                <input
                  type="checkbox"
                  id="consentCheckbox"
                  checked={consentAcknowledged}
                  onChange={(e) => setConsentAcknowledged(e.target.checked)}
                  required
                  className="mt-0.5 rounded text-indigo-600 focus:ring-indigo-500"
                />
                <label htmlFor="consentCheckbox" className="text-slate-600 text-[11px] leading-relaxed cursor-pointer">
                  I confirm that this recipient has given explicit administrative consent to receive WhatsApp draft notifications for this workspace, in compliance with Meta Business Messaging Policy.
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isAddingRecipient || !consentAcknowledged}
                  className="px-4 py-2 font-semibold bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition disabled:opacity-50"
                >
                  {isAddingRecipient ? 'Registering...' : 'Register Reviewer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
