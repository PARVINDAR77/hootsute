import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import BillingPage from '../app/(dashboard)/settings/billing/page';
import {
  SubscriptionPlan,
  SubscriptionStatus,
  BillingInterval,
  PricingPlanDto,
  WorkspaceSubscriptionDto,
  BillingInvoiceDto,
} from '@packages/shared';

// Mock workspace context
let mockCurrentRole = 'OWNER';
jest.mock('@/lib/workspace-context', () => ({
  useWorkspace: () => ({
    currentWorkspace: {
      id: 'ws-billing-test',
      name: 'Omni Workspace',
      currentUserRole: mockCurrentRole,
    },
  }),
}));

// Mock api client
const mockApiClient = jest.fn();
jest.mock('@/lib/api-client', () => ({
  apiClient: (...args: any[]) => mockApiClient(...args),
}));

describe('Billing & Subscription Settings Page', () => {
  const mockPlans: PricingPlanDto[] = [
    {
      plan: SubscriptionPlan.FREE,
      displayName: 'Starter Free',
      description: 'Perfect for small businesses and creators getting started.',
      monthlyPriceCents: 0,
      yearlyPriceCents: 0,
      storageQuotaBytes: 5368709120,
      maxMediaAssets: 500,
      maxSocialAccounts: 2,
      monthlyAiTokens: 50,
      features: [
        { name: 'Cloud Media Storage', included: true, limitText: '5 GB' },
        { name: 'Max Media Assets', included: true, limitText: '500 Assets' },
        { name: 'Dedicated Account Manager', included: false },
      ],
    },
    {
      plan: SubscriptionPlan.PRO,
      displayName: 'Growth Pro',
      description: 'Designed for scaling brands needing generous cloud storage.',
      monthlyPriceCents: 2900,
      yearlyPriceCents: 29000,
      storageQuotaBytes: 53687091200,
      maxMediaAssets: 5000,
      maxSocialAccounts: 10,
      monthlyAiTokens: 1000,
      isPopular: true,
      features: [
        { name: 'Cloud Media Storage', included: true, limitText: '50 GB' },
        { name: 'Max Media Assets', included: true, limitText: '5,000 Assets' },
        { name: 'Priority Publishing Dispatcher', included: true },
      ],
    },
    {
      plan: SubscriptionPlan.ENTERPRISE,
      displayName: 'Enterprise Scale',
      description: 'Maximum capacity and dedicated storage bandwidth.',
      monthlyPriceCents: 9900,
      yearlyPriceCents: 99000,
      storageQuotaBytes: 536870912000,
      maxMediaAssets: 50000,
      maxSocialAccounts: 100,
      monthlyAiTokens: 10000,
      features: [
        { name: 'Cloud Media Storage', included: true, limitText: '500 GB' },
        { name: 'Max Media Assets', included: true, limitText: '50,000 Assets' },
        { name: 'Dedicated Support', included: true },
      ],
    },
  ];

  const mockSubscription: WorkspaceSubscriptionDto = {
    id: 'sub-1',
    workspaceId: 'ws-billing-test',
    plan: SubscriptionPlan.FREE,
    status: SubscriptionStatus.ACTIVE,
    billingInterval: BillingInterval.MONTHLY,
    currentPeriodStart: '2026-10-01T00:00:00Z',
    currentPeriodEnd: '2026-11-01T00:00:00Z',
    cancelAtPeriodEnd: false,
    canceledAt: null,
    trialEndsAt: null,
    stripeCustomerId: null,
    hasPaymentMethod: false,
  };

  const mockInvoices: BillingInvoiceDto[] = [
    {
      id: 'inv-1',
      workspaceId: 'ws-billing-test',
      stripeInvoiceId: 'in_1MockInvoice',
      amountDue: 2900,
      amountPaid: 2900,
      currency: 'usd',
      status: 'paid',
      invoicePdfUrl: 'https://pay.stripe.com/mock.pdf',
      hostedInvoiceUrl: 'https://invoice.stripe.com/mock',
      periodStart: '2026-10-01T00:00:00Z',
      periodEnd: '2026-11-01T00:00:00Z',
      createdAt: '2026-10-01T00:00:00Z',
    },
  ];

  beforeEach(() => {
    mockCurrentRole = 'OWNER';
    jest.clearAllMocks();
  });

  const setupDefaultMocks = () => {
    mockApiClient.mockImplementation((url: string) => {
      if (url === '/billing/plans') {
        return Promise.resolve({ success: true, data: mockPlans });
      }
      if (url.includes('/billing/subscription')) {
        return Promise.resolve({ success: true, data: mockSubscription });
      }
      if (url.includes('/billing/invoices')) {
        return Promise.resolve({ success: true, data: mockInvoices });
      }
      return Promise.resolve({ success: true });
    });
  };

  it('renders billing header, active plan overview, and resource quotas', async () => {
    setupDefaultMocks();

    render(<BillingPage />);

    expect(screen.getByText(/Billing & Subscription/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText(/Active Plan: FREE/i)).toBeInTheDocument();
      expect(screen.getAllByText(/5 GB/i).length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText(/Starter Free/i)).toBeInTheDocument();
      expect(screen.getByText(/Growth Pro/i)).toBeInTheDocument();
      expect(screen.getByText(/Enterprise Scale/i)).toBeInTheDocument();
    });
  });

  it('allows toggling between monthly and annual billing and updates prices', async () => {
    setupDefaultMocks();

    render(<BillingPage />);

    await waitFor(() => {
      expect(screen.getByText('$29')).toBeInTheDocument();
    });

    const annualBtn = screen.getByText(/Annual Billing/i);
    fireEvent.click(annualBtn);

    await waitFor(() => {
      expect(screen.getByText('$290')).toBeInTheDocument();
      expect(screen.getByText('$990')).toBeInTheDocument();
    });
  });

  it('initiates checkout session when clicking upgrade button', async () => {
    setupDefaultMocks();

    // Mock window.location assignment
    const originalLocation = window.location;
    delete (window as any).location;
    window.location = { ...originalLocation, href: '' } as any;

    mockApiClient.mockImplementation((url: string) => {
      if (url === '/billing/plans') return Promise.resolve({ success: true, data: mockPlans });
      if (url.includes('/billing/subscription')) return Promise.resolve({ success: true, data: mockSubscription });
      if (url.includes('/billing/invoices')) return Promise.resolve({ success: true, data: mockInvoices });
      if (url.includes('/checkout-session')) {
        return Promise.resolve({
          success: true,
          data: { checkoutUrl: 'https://checkout.stripe.com/pay/cs_mock_123' },
        });
      }
      return Promise.resolve({ success: true });
    });

    render(<BillingPage />);

    await waitFor(() => {
      expect(screen.getByText(/Upgrade to Pro/i)).toBeInTheDocument();
    });

    const upgradeBtn = screen.getByText(/Upgrade to Pro/i);
    fireEvent.click(upgradeBtn);

    await waitFor(() => {
      expect(mockApiClient).toHaveBeenCalledWith(
        '/workspaces/ws-billing-test/billing/checkout-session',
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('"plan":"PRO"'),
        }),
      );
    });

    // Cleanup window.location
    window.location = originalLocation;
  });

  it('renders past invoices with PDF download link', async () => {
    setupDefaultMocks();

    render(<BillingPage />);

    await waitFor(() => {
      expect(screen.getByText('in_1MockInvoice')).toBeInTheDocument();
      expect(screen.getByText('$29.00 USD')).toBeInTheDocument();
      expect(screen.getByText('PAID')).toBeInTheDocument();
      expect(screen.getByText('PDF')).toBeInTheDocument();
    });
  });

  it('displays read-only warning and disables upgrade buttons when user is VIEWER', async () => {
    mockCurrentRole = 'VIEWER';
    setupDefaultMocks();

    render(<BillingPage />);

    await waitFor(() => {
      expect(screen.getByText(/Billing Access Restricted/i)).toBeInTheDocument();
      expect(screen.getByText(/Upgrade to Pro/i)).toBeInTheDocument();
    });

    const upgradeBtn = screen.getByText(/Upgrade to Pro/i).closest('button');
    expect(upgradeBtn).toBeDisabled();
  });
});
