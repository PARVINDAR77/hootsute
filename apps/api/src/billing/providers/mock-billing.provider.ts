import { Injectable, Logger } from '@nestjs/common';
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
import { randomUUID } from 'crypto';

@Injectable()
export class MockBillingProvider implements BillingProvider {
  readonly providerName = 'mock_billing';
  private readonly logger = new Logger(MockBillingProvider.name);

  async createCustomer(params: CreateCustomerParams): Promise<CreateCustomerResult> {
    const customerId = `cus_mock_${params.workspaceId.slice(0, 8)}_${Date.now()}`;
    this.logger.debug(`Created mock customer [${customerId}] for workspace [${params.workspaceId}]`);
    return { customerId };
  }

  async createCheckoutSession(params: CheckoutSessionParams): Promise<CheckoutSessionResult> {
    const sessionId = `cs_mock_${randomUUID()}`;
    const checkoutUrl = `${params.successUrl}?session_id=${sessionId}&plan=${params.plan}&interval=${params.billingInterval}`;
    this.logger.debug(`Created mock checkout session [${sessionId}] for plan [${params.plan}]`);
    return {
      sessionId,
      checkoutUrl,
    };
  }

  async createPortalSession(params: PortalSessionParams): Promise<PortalSessionResult> {
    const portalUrl = `${params.returnUrl}?portal_session=active&customer_id=${params.customerId}`;
    this.logger.debug(`Created mock customer portal session for [${params.customerId}]`);
    return { portalUrl };
  }

  async verifyAndConstructWebhookEvent(
    rawBody: Buffer | string,
    signature: string,
  ): Promise<WebhookEventPayload> {
    if (signature === 'invalid_signature') {
      throw new Error('Invalid mock webhook signature');
    }

    const payload = typeof rawBody === 'string' ? JSON.parse(rawBody) : JSON.parse(rawBody.toString('utf-8'));
    return {
      id: payload.id || `evt_mock_${randomUUID()}`,
      type: payload.type || 'checkout.session.completed',
      data: payload.data || { object: payload },
    };
  }
}
