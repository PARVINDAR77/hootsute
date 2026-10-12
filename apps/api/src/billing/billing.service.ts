import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { BillingProviderFactory } from './providers/billing-provider.factory';
import {
  SubscriptionPlan,
  SubscriptionStatus,
  BillingInterval,
  PricingPlanDto,
  WorkspaceSubscriptionDto,
  BillingInvoiceDto,
  CheckoutSessionResponseDto,
  CustomerPortalResponseDto,
} from '@packages/shared';
import { CreateCheckoutSessionDto } from './dto/create-checkout-session.dto';
import { CreatePortalSessionDto } from './dto/create-portal-session.dto';

export const PLAN_CONFIGS: Record<SubscriptionPlan, {
  displayName: string;
  description: string;
  monthlyPriceCents: number;
  yearlyPriceCents: number;
  storageQuotaBytes: bigint;
  maxMediaAssets: number;
  maxSocialAccounts: number;
  monthlyAiTokens: number;
  isPopular?: boolean;
}> = {
  [SubscriptionPlan.FREE]: {
    displayName: 'Starter Free',
    description: 'Perfect for small businesses and creators getting started with social media.',
    monthlyPriceCents: 0,
    yearlyPriceCents: 0,
    storageQuotaBytes: BigInt(5368709120), // 5 GB
    maxMediaAssets: 500,
    maxSocialAccounts: 2,
    monthlyAiTokens: 50,
  },
  [SubscriptionPlan.PRO]: {
    displayName: 'Growth Pro',
    description: 'Designed for scaling brands needing generous cloud storage, AI copy, and analytics.',
    monthlyPriceCents: 2900, // $29
    yearlyPriceCents: 29000, // $290 (2 months free)
    storageQuotaBytes: BigInt(53687091200), // 50 GB
    maxMediaAssets: 5000,
    maxSocialAccounts: 10,
    monthlyAiTokens: 1000,
    isPopular: true,
  },
  [SubscriptionPlan.ENTERPRISE]: {
    displayName: 'Enterprise Scale',
    description: 'Maximum capacity, dedicated storage bandwidth, and unlimited team collaboration.',
    monthlyPriceCents: 9900, // $99
    yearlyPriceCents: 99000, // $990
    storageQuotaBytes: BigInt(536870912000), // 500 GB
    maxMediaAssets: 50000,
    maxSocialAccounts: 100,
    monthlyAiTokens: 10000,
  },
};

@Injectable()
export class BillingService {
  private readonly logger = new Logger(BillingService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly billingFactory: BillingProviderFactory,
  ) {}

  /**
   * Returns list of available subscription pricing plans and tier feature matrices
   */
  getPlans(): PricingPlanDto[] {
    return [
      {
        plan: SubscriptionPlan.FREE,
        displayName: PLAN_CONFIGS[SubscriptionPlan.FREE].displayName,
        description: PLAN_CONFIGS[SubscriptionPlan.FREE].description,
        monthlyPriceCents: PLAN_CONFIGS[SubscriptionPlan.FREE].monthlyPriceCents,
        yearlyPriceCents: PLAN_CONFIGS[SubscriptionPlan.FREE].yearlyPriceCents,
        storageQuotaBytes: Number(PLAN_CONFIGS[SubscriptionPlan.FREE].storageQuotaBytes),
        maxMediaAssets: PLAN_CONFIGS[SubscriptionPlan.FREE].maxMediaAssets,
        maxSocialAccounts: PLAN_CONFIGS[SubscriptionPlan.FREE].maxSocialAccounts,
        monthlyAiTokens: PLAN_CONFIGS[SubscriptionPlan.FREE].monthlyAiTokens,
        features: [
          { name: 'Cloud Media Storage', included: true, limitText: '5 GB' },
          { name: 'Max Media Assets', included: true, limitText: '500 Assets' },
          { name: 'Connected Social Accounts', included: true, limitText: '2 Accounts' },
          { name: 'AI Marketing Copy Generations', included: true, limitText: '50 / month' },
          { name: 'Visual Media Picker & Simulator', included: true },
          { name: 'Dedicated Account Manager', included: false },
        ],
      },
      {
        plan: SubscriptionPlan.PRO,
        displayName: PLAN_CONFIGS[SubscriptionPlan.PRO].displayName,
        description: PLAN_CONFIGS[SubscriptionPlan.PRO].description,
        monthlyPriceCents: PLAN_CONFIGS[SubscriptionPlan.PRO].monthlyPriceCents,
        yearlyPriceCents: PLAN_CONFIGS[SubscriptionPlan.PRO].yearlyPriceCents,
        storageQuotaBytes: Number(PLAN_CONFIGS[SubscriptionPlan.PRO].storageQuotaBytes),
        maxMediaAssets: PLAN_CONFIGS[SubscriptionPlan.PRO].maxMediaAssets,
        maxSocialAccounts: PLAN_CONFIGS[SubscriptionPlan.PRO].maxSocialAccounts,
        monthlyAiTokens: PLAN_CONFIGS[SubscriptionPlan.PRO].monthlyAiTokens,
        isPopular: true,
        features: [
          { name: 'Cloud Media Storage', included: true, limitText: '50 GB' },
          { name: 'Max Media Assets', included: true, limitText: '5,000 Assets' },
          { name: 'Connected Social Accounts', included: true, limitText: '10 Accounts' },
          { name: 'AI Marketing Copy Generations', included: true, limitText: '1,000 / month' },
          { name: 'Priority Publishing Dispatcher', included: true },
          { name: 'WhatsApp Approval Workflows', included: true },
          { name: 'Dedicated Account Manager', included: false },
        ],
      },
      {
        plan: SubscriptionPlan.ENTERPRISE,
        displayName: PLAN_CONFIGS[SubscriptionPlan.ENTERPRISE].displayName,
        description: PLAN_CONFIGS[SubscriptionPlan.ENTERPRISE].description,
        monthlyPriceCents: PLAN_CONFIGS[SubscriptionPlan.ENTERPRISE].monthlyPriceCents,
        yearlyPriceCents: PLAN_CONFIGS[SubscriptionPlan.ENTERPRISE].yearlyPriceCents,
        storageQuotaBytes: Number(PLAN_CONFIGS[SubscriptionPlan.ENTERPRISE].storageQuotaBytes),
        maxMediaAssets: PLAN_CONFIGS[SubscriptionPlan.ENTERPRISE].maxMediaAssets,
        maxSocialAccounts: PLAN_CONFIGS[SubscriptionPlan.ENTERPRISE].maxSocialAccounts,
        monthlyAiTokens: PLAN_CONFIGS[SubscriptionPlan.ENTERPRISE].monthlyAiTokens,
        features: [
          { name: 'Cloud Media Storage', included: true, limitText: '500 GB' },
          { name: 'Max Media Assets', included: true, limitText: '50,000 Assets' },
          { name: 'Connected Social Accounts', included: true, limitText: '100 Accounts' },
          { name: 'AI Marketing Copy Generations', included: true, limitText: '10,000 / month' },
          { name: 'Full Brand Voice & Multi-Language', included: true },
          { name: 'Priority SLA & Dedicated Support', included: true },
        ],
      },
    ];
  }

  /**
   * Retrieves active workspace subscription, creating a default FREE record if none exists
   */
  async getSubscription(workspaceId: string): Promise<WorkspaceSubscriptionDto> {
    const workspace = await this.prisma.workspace.findUnique({
      where: { id: workspaceId },
      include: {
        subscription: true,
      },
    });

    if (!workspace) {
      throw new NotFoundException(`Workspace [${workspaceId}] not found`);
    }

    let sub = workspace.subscription;
    if (!sub) {
      sub = await this.prisma.workspaceSubscription.create({
        data: {
          workspaceId,
          plan: SubscriptionPlan.FREE,
          status: SubscriptionStatus.ACTIVE,
          billingInterval: BillingInterval.MONTHLY,
        },
      });
    }

    return {
      id: sub.id,
      workspaceId: sub.workspaceId,
      plan: sub.plan as SubscriptionPlan,
      status: sub.status as SubscriptionStatus,
      billingInterval: sub.billingInterval as BillingInterval,
      currentPeriodStart: sub.currentPeriodStart ? sub.currentPeriodStart.toISOString() : null,
      currentPeriodEnd: sub.currentPeriodEnd ? sub.currentPeriodEnd.toISOString() : null,
      cancelAtPeriodEnd: sub.cancelAtPeriodEnd,
      canceledAt: sub.canceledAt ? sub.canceledAt.toISOString() : null,
      trialEndsAt: sub.trialEndsAt ? sub.trialEndsAt.toISOString() : null,
      stripeCustomerId: sub.stripeCustomerId,
      hasPaymentMethod: !!sub.stripeCustomerId,
    };
  }

  /**
   * Initiates a Stripe or Mock checkout session for subscription upgrades
   */
  async createCheckoutSession(
    workspaceId: string,
    userId: string,
    dto: CreateCheckoutSessionDto,
  ): Promise<CheckoutSessionResponseDto> {
    const workspace = await this.prisma.workspace.findUnique({
      where: { id: workspaceId },
      include: {
        subscription: true,
      },
    });

    if (!workspace) {
      throw new NotFoundException(`Workspace [${workspaceId}] not found`);
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException(`User [${userId}] not found`);
    }

    if (dto.plan === SubscriptionPlan.FREE) {
      throw new BadRequestException('Cannot initiate checkout for Free tier. Downgrades are handled via Customer Portal.');
    }

    const provider = this.billingFactory.getProvider();
    let customerId = workspace.subscription?.stripeCustomerId;

    if (!customerId) {
      const custResult = await provider.createCustomer({
        workspaceId,
        email: user.email,
        name: user.name || workspace.name,
      });
      customerId = custResult.customerId;

      await this.prisma.workspaceSubscription.upsert({
        where: { workspaceId },
        update: { stripeCustomerId: customerId },
        create: {
          workspaceId,
          stripeCustomerId: customerId,
          plan: SubscriptionPlan.FREE,
          status: SubscriptionStatus.ACTIVE,
        },
      });
    }

    const session = await provider.createCheckoutSession({
      workspaceId,
      userId,
      userEmail: user.email,
      customerId,
      plan: dto.plan,
      billingInterval: dto.billingInterval,
      successUrl: dto.successUrl,
      cancelUrl: dto.cancelUrl,
    });

    return session;
  }

  /**
   * Creates a self-service customer portal session for card & invoice management
   */
  async createPortalSession(
    workspaceId: string,
    dto: CreatePortalSessionDto,
  ): Promise<CustomerPortalResponseDto> {
    const sub = await this.prisma.workspaceSubscription.findUnique({
      where: { workspaceId },
    });

    if (!sub || !sub.stripeCustomerId) {
      throw new BadRequestException('No active billing profile found for this workspace. Subscribe to a paid plan first.');
    }

    const provider = this.billingFactory.getProvider();
    const portal = await provider.createPortalSession({
      customerId: sub.stripeCustomerId,
      returnUrl: dto.returnUrl,
    });

    return portal;
  }

  /**
   * Synchronizes workspace storage and asset limits based on subscription tier
   */
  async applyPlanLimits(workspaceId: string, plan: SubscriptionPlan): Promise<void> {
    const config = PLAN_CONFIGS[plan] || PLAN_CONFIGS[SubscriptionPlan.FREE];

    await this.prisma.workspace.update({
      where: { id: workspaceId },
      data: {
        planTier: plan,
        storageQuotaBytes: config.storageQuotaBytes,
        maxMediaAssets: config.maxMediaAssets,
      },
    });

    this.logger.log(`Applied [${plan}] tier limits to workspace [${workspaceId}]: Quota=${config.storageQuotaBytes} bytes, MaxAssets=${config.maxMediaAssets}`);
  }

  /**
   * Handles incoming webhooks from Stripe (or Mock webhook triggers)
   */
  async handleWebhook(
    signature: string,
    rawBody: Buffer | string,
  ): Promise<{ received: boolean; event: string }> {
    const provider = this.billingFactory.getProvider();
    const event = await provider.verifyAndConstructWebhookEvent(rawBody, signature);

    this.logger.log(`Processing billing webhook event: [${event.type}] (id: ${event.id})`);

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        const workspaceId = session.metadata?.workspaceId;
        const plan = (session.metadata?.plan as SubscriptionPlan) || SubscriptionPlan.PRO;
        const interval = (session.metadata?.billingInterval as BillingInterval) || BillingInterval.MONTHLY;
        const customerId = session.customer as string;
        const subscriptionId = session.subscription as string;

        if (workspaceId) {
          await this.prisma.workspaceSubscription.upsert({
            where: { workspaceId },
            update: {
              plan,
              status: SubscriptionStatus.ACTIVE,
              billingInterval: interval,
              stripeCustomerId: customerId,
              stripeSubscriptionId: subscriptionId,
              cancelAtPeriodEnd: false,
              currentPeriodStart: new Date(),
              currentPeriodEnd: new Date(Date.now() + (interval === BillingInterval.YEARLY ? 365 : 30) * 86400000),
            },
            create: {
              workspaceId,
              plan,
              status: SubscriptionStatus.ACTIVE,
              billingInterval: interval,
              stripeCustomerId: customerId,
              stripeSubscriptionId: subscriptionId,
              currentPeriodStart: new Date(),
              currentPeriodEnd: new Date(Date.now() + (interval === BillingInterval.YEARLY ? 365 : 30) * 86400000),
            },
          });

          await this.applyPlanLimits(workspaceId, plan);
        }
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object;
        const subId = subscription.id;
        const statusMap: Record<string, SubscriptionStatus> = {
          active: SubscriptionStatus.ACTIVE,
          trialing: SubscriptionStatus.TRIALING,
          past_due: SubscriptionStatus.PAST_DUE,
          canceled: SubscriptionStatus.CANCELED,
          unpaid: SubscriptionStatus.UNPAID,
          incomplete: SubscriptionStatus.INCOMPLETE,
        };

        const mappedStatus = statusMap[subscription.status] || SubscriptionStatus.ACTIVE;
        const existingSub = await this.prisma.workspaceSubscription.findFirst({
          where: { stripeSubscriptionId: subId },
        });

        if (existingSub) {
          await this.prisma.workspaceSubscription.update({
            where: { id: existingSub.id },
            data: {
              status: mappedStatus,
              cancelAtPeriodEnd: subscription.cancel_at_period_end || false,
              canceledAt: subscription.canceled_at ? new Date(subscription.canceled_at * 1000) : null,
              currentPeriodStart: subscription.current_period_start ? new Date(subscription.current_period_start * 1000) : null,
              currentPeriodEnd: subscription.current_period_end ? new Date(subscription.current_period_end * 1000) : null,
            },
          });
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object;
        const subId = subscription.id;

        const existingSub = await this.prisma.workspaceSubscription.findFirst({
          where: { stripeSubscriptionId: subId },
        });

        if (existingSub) {
          await this.prisma.workspaceSubscription.update({
            where: { id: existingSub.id },
            data: {
              plan: SubscriptionPlan.FREE,
              status: SubscriptionStatus.CANCELED,
              canceledAt: new Date(),
            },
          });

          // Revert workspace limits back to Free tier
          await this.applyPlanLimits(existingSub.workspaceId, SubscriptionPlan.FREE);
        }
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object;
        const customerId = invoice.customer as string;

        const sub = await this.prisma.workspaceSubscription.findFirst({
          where: { stripeCustomerId: customerId },
        });

        if (sub && invoice.id) {
          await this.prisma.billingInvoice.upsert({
            where: { stripeInvoiceId: invoice.id },
            update: {
              amountPaid: invoice.amount_paid || 0,
              status: invoice.status || 'paid',
              invoicePdfUrl: invoice.invoice_pdf || null,
              hostedInvoiceUrl: invoice.hosted_invoice_url || null,
            },
            create: {
              workspaceId: sub.workspaceId,
              stripeInvoiceId: invoice.id,
              amountDue: invoice.amount_due || 0,
              amountPaid: invoice.amount_paid || 0,
              currency: invoice.currency || 'usd',
              status: invoice.status || 'paid',
              invoicePdfUrl: invoice.invoice_pdf || null,
              hostedInvoiceUrl: invoice.hosted_invoice_url || null,
              periodStart: invoice.period_start ? new Date(invoice.period_start * 1000) : new Date(),
              periodEnd: invoice.period_end ? new Date(invoice.period_end * 1000) : new Date(),
            },
          });
        }
        break;
      }

      default:
        this.logger.debug(`Unhandled billing webhook event type: ${event.type}`);
    }

    return { received: true, event: event.type };
  }

  /**
   * Retrieves past invoices for a workspace
   */
  async getInvoices(workspaceId: string): Promise<BillingInvoiceDto[]> {
    const invoices = await this.prisma.billingInvoice.findMany({
      where: { workspaceId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    return invoices.map((inv) => ({
      id: inv.id,
      workspaceId: inv.workspaceId,
      stripeInvoiceId: inv.stripeInvoiceId,
      amountDue: inv.amountDue,
      amountPaid: inv.amountPaid,
      currency: inv.currency,
      status: inv.status,
      invoicePdfUrl: inv.invoicePdfUrl,
      hostedInvoiceUrl: inv.hostedInvoiceUrl,
      periodStart: inv.periodStart.toISOString(),
      periodEnd: inv.periodEnd.toISOString(),
      createdAt: inv.createdAt.toISOString(),
    }));
  }
}
