'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useWorkspace } from '@/lib/workspace-context';
import { apiClient } from '@/lib/api-client';
import { ROUTES } from '@/lib/constants';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';
import {
  CreditCard,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Download,
  Sparkles,
  HardDrive,
  Share2,
  Bot,
  Zap,
  ShieldCheck,
  Calendar,
  ArrowRight,
  Receipt,
} from 'lucide-react';
import {
  SubscriptionPlan,
  SubscriptionStatus,
  BillingInterval,
  PricingPlanDto,
  WorkspaceSubscriptionDto,
  BillingInvoiceDto,
} from '@packages/shared';

export default function BillingPage() {
  const { currentWorkspace } = useWorkspace();
  const [plans, setPlans] = useState<PricingPlanDto[]>([]);
  const [subscription, setSubscription] = useState<WorkspaceSubscriptionDto | null>(null);
  const [invoices, setInvoices] = useState<BillingInvoiceDto[]>([]);
  const [billingInterval, setBillingInterval] = useState<BillingInterval>(BillingInterval.MONTHLY);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessingCheckout, setIsProcessingCheckout] = useState<string | null>(null);
  const [isProcessingPortal, setIsProcessingPortal] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const canManageBilling =
    currentWorkspace?.currentUserRole === 'OWNER' || currentWorkspace?.currentUserRole === 'ADMIN';

  const loadBillingData = useCallback(async () => {
    if (!currentWorkspace?.id) return;
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const [plansRes, subRes, invoicesRes] = await Promise.all([
        apiClient<{ success: boolean; data: PricingPlanDto[] }>('/billing/plans'),
        apiClient<{ success: boolean; data: WorkspaceSubscriptionDto }>(
          `/workspaces/${currentWorkspace.id}/billing/subscription`,
        ),
        apiClient<{ success: boolean; data: BillingInvoiceDto[] }>(
          `/workspaces/${currentWorkspace.id}/billing/invoices`,
        ),
      ]);

      if (plansRes.data) setPlans(plansRes.data);
      if (subRes.data) setSubscription(subRes.data);
      if (invoicesRes.data) setInvoices(invoicesRes.data);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to load subscription and billing details');
    } finally {
      setIsLoading(false);
    }
  }, [currentWorkspace?.id]);

  useEffect(() => {
    loadBillingData();
  }, [loadBillingData]);

  // Handle URL query flags (e.g. ?success=true or ?canceled=true from Stripe redirect)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('success') === 'true') {
      setSuccessMessage('Payment successful! Your subscription tier and cloud quotas have been upgraded.');
      // Clean URL
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (urlParams.get('canceled') === 'true') {
      setErrorMessage('Subscription checkout was canceled. No charges were made.');
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  const handleUpgrade = async (plan: SubscriptionPlan) => {
    if (!currentWorkspace?.id) return;
    setIsProcessingCheckout(plan);
    setErrorMessage(null);

    try {
      const res = await apiClient<{ success: boolean; data: { checkoutUrl: string } }>(
        `/workspaces/${currentWorkspace.id}/billing/checkout-session`,
        {
          method: 'POST',
          body: JSON.stringify({
            plan,
            billingInterval,
            successUrl: `${window.location.origin}${ROUTES.SETTINGS_BILLING}?success=true`,
            cancelUrl: `${window.location.origin}${ROUTES.SETTINGS_BILLING}?canceled=true`,
          }),
        },
      );

      if (res.data?.checkoutUrl) {
        window.location.href = res.data.checkoutUrl;
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to initiate checkout session');
      setIsProcessingCheckout(null);
    }
  };

  const handleOpenCustomerPortal = async () => {
    if (!currentWorkspace?.id) return;
    setIsProcessingPortal(true);
    setErrorMessage(null);

    try {
      const res = await apiClient<{ success: boolean; data: { portalUrl: string } }>(
        `/workspaces/${currentWorkspace.id}/billing/customer-portal`,
        {
          method: 'POST',
          body: JSON.stringify({
            returnUrl: `${window.location.origin}${ROUTES.SETTINGS_BILLING}`,
          }),
        },
      );

      if (res.data?.portalUrl) {
        window.location.href = res.data.portalUrl;
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to open customer billing portal');
      setIsProcessingPortal(false);
    }
  };

  const formatBytes = (bytes: number) => {
    if (!bytes) return '0 GB';
    const gb = bytes / (1024 * 1024 * 1024);
    return `${gb >= 1 ? gb.toFixed(0) : gb.toFixed(1)} GB`;
  };

  const currentPlan = subscription?.plan || SubscriptionPlan.FREE;

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-fadeIn pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Billing &amp; Subscription</h1>
            <Badge
              variant={
                currentPlan === SubscriptionPlan.ENTERPRISE
                  ? 'purple'
                  : currentPlan === SubscriptionPlan.PRO
                  ? 'purple'
                  : 'default'
              }
            >
              {currentPlan} TIER
            </Badge>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Manage your OmniSocial AI subscription tier, storage quota limits, payment methods, and invoices.
          </p>
        </div>

        {subscription?.hasPaymentMethod && canManageBilling && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleOpenCustomerPortal}
            isLoading={isProcessingPortal}
            leftIcon={<CreditCard className="w-4 h-4" />}
            rightIcon={<ExternalLink className="w-3.5 h-3.5" />}
          >
            Manage Billing &amp; Invoices
          </Button>
        )}
      </div>

      {successMessage && <Alert type="success" message={successMessage} />}
      {errorMessage && <Alert type="error" message={errorMessage} />}

      {!canManageBilling && (
        <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800 flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold block">Billing Access Restricted</span>
            Only Workspace Owners and Administrators can purchase subscriptions or change payment settings.
          </div>
        </div>
      )}

      {/* Active Subscription Overview Card */}
      <Card className="relative overflow-hidden border-indigo-100 bg-gradient-to-br from-white via-indigo-50/20 to-slate-50 shadow-sm">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-indigo-600 text-white shadow-md shadow-indigo-200">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <CardTitle className="text-lg">Active Plan: {currentPlan}</CardTitle>
                <CardDescription className="text-xs">
                  Status:{' '}
                  <span className="font-medium text-emerald-600">
                    {subscription?.status || SubscriptionStatus.ACTIVE}
                  </span>
                  {subscription?.currentPeriodEnd && (
                    <span className="ml-2 text-slate-400">
                      • Renews on {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
                    </span>
                  )}
                </CardDescription>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500 font-medium">
                Billing Cycle: {subscription?.billingInterval || BillingInterval.MONTHLY}
              </span>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
            {/* Storage Quota */}
            <div className="p-4 rounded-xl bg-white border border-slate-200/80 shadow-xs space-y-2">
              <div className="flex items-center justify-between text-slate-500 font-medium">
                <span className="flex items-center gap-1.5">
                  <HardDrive className="w-3.5 h-3.5 text-indigo-500" />
                  Cloud Storage
                </span>
                <span className="font-semibold text-slate-800">
                  {currentPlan === SubscriptionPlan.ENTERPRISE
                    ? '500 GB'
                    : currentPlan === SubscriptionPlan.PRO
                    ? '50 GB'
                    : '5 GB'}
                </span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-indigo-600 h-1.5 rounded-full"
                  style={{ width: currentPlan === SubscriptionPlan.FREE ? '25%' : '10%' }}
                />
              </div>
              <p className="text-[10px] text-slate-400">Dedicated high-speed asset CDN</p>
            </div>

            {/* Max Media Assets */}
            <div className="p-4 rounded-xl bg-white border border-slate-200/80 shadow-xs space-y-2">
              <div className="flex items-center justify-between text-slate-500 font-medium">
                <span className="flex items-center gap-1.5">
                  <HardDrive className="w-3.5 h-3.5 text-blue-500" />
                  Max Assets
                </span>
                <span className="font-semibold text-slate-800">
                  {currentPlan === SubscriptionPlan.ENTERPRISE
                    ? '50,000'
                    : currentPlan === SubscriptionPlan.PRO
                    ? '5,000'
                    : '500'}
                </span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                <div className="bg-blue-600 h-1.5 rounded-full" style={{ width: '15%' }} />
              </div>
              <p className="text-[10px] text-slate-400">Image &amp; video files stored</p>
            </div>

            {/* Social Accounts */}
            <div className="p-4 rounded-xl bg-white border border-slate-200/80 shadow-xs space-y-2">
              <div className="flex items-center justify-between text-slate-500 font-medium">
                <span className="flex items-center gap-1.5">
                  <Share2 className="w-3.5 h-3.5 text-emerald-500" />
                  Social Accounts
                </span>
                <span className="font-semibold text-slate-800">
                  {currentPlan === SubscriptionPlan.ENTERPRISE
                    ? '100'
                    : currentPlan === SubscriptionPlan.PRO
                    ? '10'
                    : '2'}
                </span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                <div className="bg-emerald-600 h-1.5 rounded-full" style={{ width: '20%' }} />
              </div>
              <p className="text-[10px] text-slate-400">Facebook, Instagram, LinkedIn</p>
            </div>

            {/* AI Tokens */}
            <div className="p-4 rounded-xl bg-white border border-slate-200/80 shadow-xs space-y-2">
              <div className="flex items-center justify-between text-slate-500 font-medium">
                <span className="flex items-center gap-1.5">
                  <Bot className="w-3.5 h-3.5 text-purple-500" />
                  AI Copy Generatons
                </span>
                <span className="font-semibold text-slate-800">
                  {currentPlan === SubscriptionPlan.ENTERPRISE
                    ? '10,000 / mo'
                    : currentPlan === SubscriptionPlan.PRO
                    ? '1,000 / mo'
                    : '50 / mo'}
                </span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                <div className="bg-purple-600 h-1.5 rounded-full" style={{ width: '12%' }} />
              </div>
              <p className="text-[10px] text-slate-400">Multi-tone marketing copywriter</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Subscription Tier Comparison Matrix */}
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">Available Subscription Plans</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Choose the ideal tier for your business scale. Upgrade or switch billing cycles anytime.
            </p>
          </div>

          {/* Monthly / Yearly Toggle */}
          <div className="flex items-center gap-2 self-start sm:self-auto bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              type="button"
              onClick={() => setBillingInterval(BillingInterval.MONTHLY)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                billingInterval === BillingInterval.MONTHLY
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Monthly Billing
            </button>
            <button
              type="button"
              onClick={() => setBillingInterval(BillingInterval.YEARLY)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                billingInterval === BillingInterval.YEARLY
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>Annual Billing</span>
              <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded-md font-bold">
                Save 17%
              </span>
            </button>
          </div>
        </div>

        {/* Pricing Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map((planItem) => {
            const isCurrent = currentPlan === planItem.plan;
            const price =
              billingInterval === BillingInterval.YEARLY
                ? planItem.yearlyPriceCents / 100
                : planItem.monthlyPriceCents / 100;
            const periodLabel = billingInterval === BillingInterval.YEARLY ? '/ year' : '/ month';

            return (
              <div
                key={planItem.plan}
                className={`relative rounded-2xl flex flex-col justify-between transition-all duration-200 ${
                  planItem.isPopular
                    ? 'border-2 border-indigo-600 bg-white shadow-lg shadow-indigo-100/50 p-6'
                    : 'border border-slate-200 bg-white hover:border-slate-300 p-6 shadow-xs'
                }`}
              >
                {planItem.isPopular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white text-[11px] font-bold px-3 py-0.5 rounded-full shadow-sm tracking-wide uppercase">
                    Most Popular Choice
                  </div>
                )}

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-bold text-slate-900 text-base">{planItem.displayName}</h3>
                    {isCurrent && (
                      <span className="text-[11px] font-bold px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-md">
                        Current Plan
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 mb-4 min-h-[36px]">{planItem.description}</p>

                  <div className="flex items-baseline gap-1 mb-6">
                    <span className="text-3xl font-extrabold text-slate-900 tracking-tight">
                      ${price}
                    </span>
                    <span className="text-xs text-slate-500 font-medium">{periodLabel}</span>
                  </div>

                  <div className="space-y-3 pb-6 border-b border-slate-100 text-xs">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-2">
                      Included Capabilities
                    </span>
                    {planItem.features.map((feat, idx) => (
                      <div key={idx} className="flex items-center gap-2.5">
                        {feat.included ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                        ) : (
                          <div className="w-4 h-4 rounded-full border border-slate-200 flex items-center justify-center shrink-0">
                            <span className="w-1.5 h-px bg-slate-300" />
                          </div>
                        )}
                        <span
                          className={`flex-1 ${
                            feat.included ? 'text-slate-700 font-medium' : 'text-slate-400 line-through'
                          }`}
                        >
                          {feat.name}
                        </span>
                        {feat.limitText && (
                          <span className="text-[10px] font-semibold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded">
                            {feat.limitText}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-6">
                  {isCurrent ? (
                    <Button
                      variant="outline"
                      className="w-full justify-center bg-slate-50 text-slate-500 cursor-default"
                      disabled
                    >
                      Active Plan
                    </Button>
                  ) : planItem.plan === SubscriptionPlan.FREE ? (
                    <Button
                      variant="outline"
                      className="w-full justify-center"
                      onClick={handleOpenCustomerPortal}
                      disabled={!canManageBilling || !subscription?.hasPaymentMethod}
                    >
                      Downgrade in Portal
                    </Button>
                  ) : (
                    <Button
                      variant={planItem.isPopular ? 'primary' : 'outline'}
                      className="w-full justify-center"
                      onClick={() => handleUpgrade(planItem.plan)}
                      isLoading={isProcessingCheckout === planItem.plan}
                      disabled={!canManageBilling}
                      rightIcon={<ArrowRight className="w-4 h-4" />}
                    >
                      Upgrade to {planItem.displayName.split(' ')[1] || planItem.displayName}
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Invoices History Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <CardTitle>Billing Invoices &amp; Receipts</CardTitle>
              <CardDescription>
                Download past invoices and VAT receipts for accounting and taxes
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {invoices.length === 0 ? (
            <div className="text-center py-8 text-xs text-slate-500">
              No billing invoices recorded yet. Invoices appear here automatically upon subscription renewals.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50 text-slate-400 uppercase font-semibold text-[10px] tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Invoice ID</th>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Amount</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Receipt</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {invoices.map((inv) => (
                    <tr key={inv.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 font-mono font-medium text-slate-900">
                        {inv.stripeInvoiceId}
                      </td>
                      <td className="py-3 px-4">
                        {new Date(inv.createdAt).toLocaleDateString(undefined, {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-900">
                        ${(inv.amountPaid / 100).toFixed(2)} {inv.currency.toUpperCase()}
                      </td>
                      <td className="py-3 px-4">
                        <Badge variant={inv.status === 'paid' ? 'success' : 'default'}>
                          {inv.status.toUpperCase()}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-right">
                        {inv.invoicePdfUrl ? (
                          <a
                            href={inv.invoicePdfUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-indigo-600 hover:text-indigo-800 font-semibold"
                          >
                            <Download className="w-3.5 h-3.5" />
                            PDF
                          </a>
                        ) : inv.hostedInvoiceUrl ? (
                          <a
                            href={inv.hostedInvoiceUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-indigo-600 hover:text-indigo-800 font-semibold"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                            View
                          </a>
                        ) : (
                          <span className="text-slate-400">Processing</span>
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
  );
}
