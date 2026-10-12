import { SubscriptionPlan, BillingInterval } from '@packages/shared';

export interface CreateCustomerParams {
  workspaceId: string;
  email: string;
  name: string;
}

export interface CreateCustomerResult {
  customerId: string;
}

export interface CheckoutSessionParams {
  workspaceId: string;
  userId: string;
  userEmail: string;
  customerId?: string | null;
  plan: SubscriptionPlan;
  billingInterval: BillingInterval;
  successUrl: string;
  cancelUrl: string;
}

export interface CheckoutSessionResult {
  sessionId: string;
  checkoutUrl: string;
}

export interface PortalSessionParams {
  customerId: string;
  returnUrl: string;
}

export interface PortalSessionResult {
  portalUrl: string;
}

export interface WebhookEventPayload {
  id: string;
  type: string;
  data: {
    object: Record<string, any>;
  };
}

export interface BillingProvider {
  readonly providerName: string;

  createCustomer(params: CreateCustomerParams): Promise<CreateCustomerResult>;

  createCheckoutSession(params: CheckoutSessionParams): Promise<CheckoutSessionResult>;

  createPortalSession(params: PortalSessionParams): Promise<PortalSessionResult>;

  verifyAndConstructWebhookEvent(
    rawBody: Buffer | string,
    signature: string,
  ): Promise<WebhookEventPayload>;
}
