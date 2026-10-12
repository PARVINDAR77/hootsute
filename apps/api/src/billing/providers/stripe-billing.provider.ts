import { Injectable, Logger, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  BillingProvider,
  CreateCustomerParams,
  CreateCustomerResult,
  CheckoutSessionParams,
  CheckoutSessionResult,
  PortalSessionParams,
  PortalSessionResult,
  WebhookEventPayload,
} from './billing-provider.interface';
import { SubscriptionPlan, BillingInterval } from '@packages/shared';
import Stripe from 'stripe';

@Injectable()
export class StripeBillingProvider implements BillingProvider {
  readonly providerName = 'stripe';
  private readonly logger = new Logger(StripeBillingProvider.name);
  private readonly stripeClient: Stripe | null = null;
  private readonly webhookSecret: string;
  private readonly priceIds: Record<string, string>;

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.get<string>('STRIPE_SECRET_KEY');
    this.webhookSecret = this.configService.get<string>('STRIPE_WEBHOOK_SECRET') || '';

    if (apiKey) {
      this.stripeClient = new Stripe(apiKey, {
        apiVersion: '2024-04-10' as any,
        typescript: true,
      });
    }

    this.priceIds = {
      [`${SubscriptionPlan.PRO}_${BillingInterval.MONTHLY}`]:
        this.configService.get<string>('STRIPE_PRICE_PRO_MONTHLY') || 'price_pro_monthly',
      [`${SubscriptionPlan.PRO}_${BillingInterval.YEARLY}`]:
        this.configService.get<string>('STRIPE_PRICE_PRO_YEARLY') || 'price_pro_yearly',
      [`${SubscriptionPlan.ENTERPRISE}_${BillingInterval.MONTHLY}`]:
        this.configService.get<string>('STRIPE_PRICE_ENTERPRISE_MONTHLY') || 'price_enterprise_monthly',
      [`${SubscriptionPlan.ENTERPRISE}_${BillingInterval.YEARLY}`]:
        this.configService.get<string>('STRIPE_PRICE_ENTERPRISE_YEARLY') || 'price_enterprise_yearly',
    };
  }

  private ensureClient(): Stripe {
    if (!this.stripeClient) {
      throw new InternalServerErrorException('Stripe API client is not configured (STRIPE_SECRET_KEY is missing)');
    }
    return this.stripeClient;
  }

  async createCustomer(params: CreateCustomerParams): Promise<CreateCustomerResult> {
    const stripe = this.ensureClient();
    const customer = await stripe.customers.create({
      email: params.email,
      name: params.name,
      metadata: {
        workspaceId: params.workspaceId,
      },
    });

    return { customerId: customer.id };
  }

  async createCheckoutSession(params: CheckoutSessionParams): Promise<CheckoutSessionResult> {
    const stripe = this.ensureClient();
    const priceKey = `${params.plan}_${params.billingInterval}`;
    const priceId = this.priceIds[priceKey];

    if (!priceId) {
      throw new InternalServerErrorException(`No Stripe price ID configured for plan [${priceKey}]`);
    }

    const session = await stripe.checkout.sessions.create({
      customer: params.customerId || undefined,
      customer_email: params.customerId ? undefined : params.userEmail,
      mode: 'subscription',
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `${params.successUrl}?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: params.cancelUrl,
      subscription_data: {
        metadata: {
          workspaceId: params.workspaceId,
          userId: params.userId,
          plan: params.plan,
          billingInterval: params.billingInterval,
        },
      },
      metadata: {
        workspaceId: params.workspaceId,
        userId: params.userId,
        plan: params.plan,
        billingInterval: params.billingInterval,
      },
    });

    if (!session.url) {
      throw new InternalServerErrorException('Failed to retrieve checkout session URL from Stripe');
    }

    return {
      sessionId: session.id,
      checkoutUrl: session.url,
    };
  }

  async createPortalSession(params: PortalSessionParams): Promise<PortalSessionResult> {
    const stripe = this.ensureClient();
    const session = await stripe.billingPortal.sessions.create({
      customer: params.customerId,
      return_url: params.returnUrl,
    });

    return { portalUrl: session.url };
  }

  async verifyAndConstructWebhookEvent(
    rawBody: Buffer | string,
    signature: string,
  ): Promise<WebhookEventPayload> {
    const stripe = this.ensureClient();
    if (!this.webhookSecret) {
      throw new InternalServerErrorException('STRIPE_WEBHOOK_SECRET is not configured');
    }

    const event = stripe.webhooks.constructEvent(rawBody, signature, this.webhookSecret);
    return {
      id: event.id,
      type: event.type,
      data: {
        object: event.data.object as Record<string, any>,
      },
    };
  }
}
