import { Test, TestingModule } from '@nestjs/testing';
import { BillingService, PLAN_CONFIGS } from './billing.service';
import { PrismaService } from '../prisma/prisma.service';
import { BillingProviderFactory } from './providers/billing-provider.factory';
import { MockBillingProvider } from './providers/mock-billing.provider';
import { SubscriptionPlan, SubscriptionStatus, BillingInterval } from '@packages/shared';
import { BadRequestException, NotFoundException } from '@nestjs/common';

describe('BillingService', () => {
  let service: BillingService;
  let prisma: any;
  let mockBillingProvider: MockBillingProvider;

  beforeEach(async () => {
    mockBillingProvider = new MockBillingProvider();

    prisma = {
      workspace: {
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      user: {
        findUnique: jest.fn(),
      },
      workspaceSubscription: {
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        upsert: jest.fn(),
      },
      billingInvoice: {
        findMany: jest.fn(),
        upsert: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BillingService,
        {
          provide: PrismaService,
          useValue: prisma,
        },
        {
          provide: BillingProviderFactory,
          useValue: {
            getProvider: () => mockBillingProvider,
          },
        },
      ],
    }).compile();

    service = module.get<BillingService>(BillingService);
  });

  describe('getPlans', () => {
    it('should return all available plans with their configurations', () => {
      const plans = service.getPlans();
      expect(plans).toHaveLength(3);
      expect(plans.map((p) => p.plan)).toEqual([
        SubscriptionPlan.FREE,
        SubscriptionPlan.PRO,
        SubscriptionPlan.ENTERPRISE,
      ]);
      const proPlan = plans.find((p) => p.plan === SubscriptionPlan.PRO);
      expect(proPlan?.monthlyPriceCents).toBe(2900);
      expect(proPlan?.isPopular).toBe(true);
    });
  });

  describe('getSubscription', () => {
    it('should throw NotFoundException if workspace does not exist', async () => {
      prisma.workspace.findUnique.mockResolvedValue(null);
      await expect(service.getSubscription('ws-nonexistent')).rejects.toThrow(NotFoundException);
    });

    it('should return existing subscription if found', async () => {
      const mockSub = {
        id: 'sub-1',
        workspaceId: 'ws-1',
        plan: SubscriptionPlan.PRO,
        status: SubscriptionStatus.ACTIVE,
        billingInterval: BillingInterval.MONTHLY,
        currentPeriodStart: new Date('2026-10-01T00:00:00Z'),
        currentPeriodEnd: new Date('2026-11-01T00:00:00Z'),
        cancelAtPeriodEnd: false,
        canceledAt: null,
        trialEndsAt: null,
        stripeCustomerId: 'cus_123',
      };

      prisma.workspace.findUnique.mockResolvedValue({
        id: 'ws-1',
        name: 'Omni Workspace',
        subscription: mockSub,
      });

      const result = await service.getSubscription('ws-1');
      expect(result.id).toBe('sub-1');
      expect(result.plan).toBe(SubscriptionPlan.PRO);
      expect(result.hasPaymentMethod).toBe(true);
    });

    it('should create and return default FREE subscription if none exists', async () => {
      prisma.workspace.findUnique.mockResolvedValue({
        id: 'ws-new',
        name: 'New Workspace',
        subscription: null,
      });

      const newSub = {
        id: 'sub-new',
        workspaceId: 'ws-new',
        plan: SubscriptionPlan.FREE,
        status: SubscriptionStatus.ACTIVE,
        billingInterval: BillingInterval.MONTHLY,
        currentPeriodStart: null,
        currentPeriodEnd: null,
        cancelAtPeriodEnd: false,
        canceledAt: null,
        trialEndsAt: null,
        stripeCustomerId: null,
      };

      prisma.workspaceSubscription.create.mockResolvedValue(newSub);

      const result = await service.getSubscription('ws-new');
      expect(prisma.workspaceSubscription.create).toHaveBeenCalledWith({
        data: {
          workspaceId: 'ws-new',
          plan: SubscriptionPlan.FREE,
          status: SubscriptionStatus.ACTIVE,
          billingInterval: BillingInterval.MONTHLY,
        },
      });
      expect(result.plan).toBe(SubscriptionPlan.FREE);
      expect(result.hasPaymentMethod).toBe(false);
    });
  });

  describe('createCheckoutSession', () => {
    it('should reject checkout creation for FREE tier', async () => {
      prisma.workspace.findUnique.mockResolvedValue({ id: 'ws-1', name: 'WS' });
      prisma.user.findUnique.mockResolvedValue({ id: 'user-1', email: 'owner@example.com' });

      await expect(
        service.createCheckoutSession('ws-1', 'user-1', {
          plan: SubscriptionPlan.FREE,
          billingInterval: BillingInterval.MONTHLY,
          successUrl: 'http://localhost:3000/success',
          cancelUrl: 'http://localhost:3000/cancel',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should create customer if not present and return checkout session', async () => {
      prisma.workspace.findUnique.mockResolvedValue({
        id: 'ws-1',
        name: 'My Workspace',
        subscription: null,
      });
      prisma.user.findUnique.mockResolvedValue({
        id: 'user-1',
        name: 'Jane Doe',
        email: 'jane@example.com',
      });
      prisma.workspaceSubscription.upsert.mockResolvedValue({});

      const session = await service.createCheckoutSession('ws-1', 'user-1', {
        plan: SubscriptionPlan.PRO,
        billingInterval: BillingInterval.YEARLY,
        successUrl: 'http://localhost:3000/success',
        cancelUrl: 'http://localhost:3000/cancel',
      });

      expect(session).toBeDefined();
      expect(session.sessionId).toContain('cs_mock_');
      expect(session.checkoutUrl).toContain('session_id=cs_mock_');
      expect(prisma.workspaceSubscription.upsert).toHaveBeenCalled();
    });
  });

  describe('createPortalSession', () => {
    it('should throw BadRequestException if workspace has no Stripe customer ID', async () => {
      prisma.workspaceSubscription.findUnique.mockResolvedValue({
        workspaceId: 'ws-1',
        stripeCustomerId: null,
      });

      await expect(
        service.createPortalSession('ws-1', { returnUrl: 'http://localhost:3000/settings' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should return portal session when customer exists', async () => {
      prisma.workspaceSubscription.findUnique.mockResolvedValue({
        workspaceId: 'ws-1',
        stripeCustomerId: 'cus_existing',
      });

      const portal = await service.createPortalSession('ws-1', {
        returnUrl: 'http://localhost:3000/settings',
      });

      expect(portal.portalUrl).toContain('portal_session=active');
    });
  });

  describe('applyPlanLimits', () => {
    it('should update workspace tier, storage quota, and max media assets', async () => {
      await service.applyPlanLimits('ws-1', SubscriptionPlan.PRO);

      expect(prisma.workspace.update).toHaveBeenCalledWith({
        where: { id: 'ws-1' },
        data: {
          planTier: SubscriptionPlan.PRO,
          storageQuotaBytes: PLAN_CONFIGS[SubscriptionPlan.PRO].storageQuotaBytes,
          maxMediaAssets: PLAN_CONFIGS[SubscriptionPlan.PRO].maxMediaAssets,
        },
      });
    });
  });

  describe('handleWebhook', () => {
    it('should process checkout.session.completed event and update subscription and quotas', async () => {
      const webhookPayload = JSON.stringify({
        id: 'evt_1',
        type: 'checkout.session.completed',
        data: {
          object: {
            customer: 'cus_sub_1',
            subscription: 'sub_stripe_1',
            metadata: {
              workspaceId: 'ws-1',
              plan: SubscriptionPlan.PRO,
              billingInterval: BillingInterval.YEARLY,
            },
          },
        },
      });

      prisma.workspaceSubscription.upsert.mockResolvedValue({});
      prisma.workspace.update.mockResolvedValue({});

      const result = await service.handleWebhook('mock_sig', webhookPayload);

      expect(result.received).toBe(true);
      expect(result.event).toBe('checkout.session.completed');
      expect(prisma.workspaceSubscription.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { workspaceId: 'ws-1' },
          update: expect.objectContaining({
            plan: SubscriptionPlan.PRO,
            status: SubscriptionStatus.ACTIVE,
            billingInterval: BillingInterval.YEARLY,
          }),
        }),
      );
      expect(prisma.workspace.update).toHaveBeenCalled();
    });

    it('should process customer.subscription.deleted event and revert workspace to FREE', async () => {
      const webhookPayload = JSON.stringify({
        id: 'evt_2',
        type: 'customer.subscription.deleted',
        data: {
          object: {
            id: 'sub_canceled_1',
          },
        },
      });

      prisma.workspaceSubscription.findFirst.mockResolvedValue({
        id: 'sub-row-1',
        workspaceId: 'ws-downgrade',
      });
      prisma.workspaceSubscription.update.mockResolvedValue({});
      prisma.workspace.update.mockResolvedValue({});

      const result = await service.handleWebhook('mock_sig', webhookPayload);

      expect(result.received).toBe(true);
      expect(prisma.workspaceSubscription.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'sub-row-1' },
          data: expect.objectContaining({
            plan: SubscriptionPlan.FREE,
            status: SubscriptionStatus.CANCELED,
          }),
        }),
      );
      expect(prisma.workspace.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'ws-downgrade' },
          data: expect.objectContaining({
            planTier: SubscriptionPlan.FREE,
          }),
        }),
      );
    });

    it('should process invoice.payment_succeeded and record billing invoice', async () => {
      const webhookPayload = JSON.stringify({
        id: 'evt_3',
        type: 'invoice.payment_succeeded',
        data: {
          object: {
            id: 'in_123',
            customer: 'cus_customer_1',
            amount_due: 2900,
            amount_paid: 2900,
            currency: 'usd',
            status: 'paid',
            invoice_pdf: 'https://pay.stripe.com/invoice/in_123/pdf',
            hosted_invoice_url: 'https://invoice.stripe.com/i/in_123',
            period_start: 1760000000,
            period_end: 1762592000,
          },
        },
      });

      prisma.workspaceSubscription.findFirst.mockResolvedValue({
        id: 'sub-1',
        workspaceId: 'ws-inv-1',
      });
      prisma.billingInvoice.upsert.mockResolvedValue({});

      const result = await service.handleWebhook('mock_sig', webhookPayload);
      expect(result.received).toBe(true);
      expect(prisma.billingInvoice.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { stripeInvoiceId: 'in_123' },
          create: expect.objectContaining({
            workspaceId: 'ws-inv-1',
            stripeInvoiceId: 'in_123',
            amountPaid: 2900,
          }),
        }),
      );
    });
  });

  describe('getInvoices', () => {
    it('should return list of workspace invoices ordered chronologically', async () => {
      prisma.billingInvoice.findMany.mockResolvedValue([
        {
          id: 'inv-1',
          workspaceId: 'ws-1',
          stripeInvoiceId: 'in_999',
          amountDue: 2900,
          amountPaid: 2900,
          currency: 'usd',
          status: 'paid',
          invoicePdfUrl: 'https://pdf.url',
          hostedInvoiceUrl: 'https://invoice.url',
          periodStart: new Date('2026-10-01T00:00:00Z'),
          periodEnd: new Date('2026-11-01T00:00:00Z'),
          createdAt: new Date('2026-10-01T00:00:00Z'),
        },
      ]);

      const invoices = await service.getInvoices('ws-1');
      expect(invoices).toHaveLength(1);
      expect(invoices[0].stripeInvoiceId).toBe('in_999');
      expect(invoices[0].amountPaid).toBe(2900);
    });
  });
});
