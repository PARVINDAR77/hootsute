import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import * as crypto from 'crypto';
import {
  CreateWebhookSubscriptionDto,
  UpdateWebhookSubscriptionDto,
} from '../dto/webhook.dto';
import {
  WebhookSubscriptionDto,
  WebhookDeliveryLogDto,
  WebhookTestPingResponseDto,
  WebhookSecretRotateResponseDto,
  WebhookDeliveryStatus,
} from '@packages/shared';

@Injectable()
export class WebhooksService {
  private readonly logger = new Logger(WebhooksService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Create a new webhook subscription with a secure HMAC signing secret.
   */
  async create(workspaceId: string, dto: CreateWebhookSubscriptionDto): Promise<WebhookSubscriptionDto> {
    const secretKey = this.generateSecretKey();

    const subscription = await this.prisma.webhookSubscription.create({
      data: {
        workspaceId,
        name: dto.name,
        targetUrl: dto.targetUrl,
        secretKey,
        eventTypes: dto.eventTypes,
        description: dto.description,
        isActive: dto.isActive !== undefined ? dto.isActive : true,
      },
    });

    return this.mapToSubscriptionDto(subscription);
  }

  /**
   * List all webhook subscriptions for a workspace with their latest deliveries.
   */
  async findAll(workspaceId: string): Promise<WebhookSubscriptionDto[]> {
    const subscriptions = await this.prisma.webhookSubscription.findMany({
      where: { workspaceId },
      include: {
        deliveries: {
          orderBy: { createdAt: 'desc' },
          take: 3,
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return subscriptions.map((s) => this.mapToSubscriptionDto(s));
  }

  /**
   * Find a single webhook subscription by ID.
   */
  async findOne(workspaceId: string, id: string): Promise<WebhookSubscriptionDto> {
    const subscription = await this.prisma.webhookSubscription.findFirst({
      where: { id, workspaceId },
      include: {
        deliveries: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    });

    if (!subscription) {
      throw new NotFoundException(`Webhook subscription with ID ${id} not found in this workspace`);
    }

    return this.mapToSubscriptionDto(subscription);
  }

  /**
   * Update a webhook subscription.
   */
  async update(
    workspaceId: string,
    id: string,
    dto: UpdateWebhookSubscriptionDto,
  ): Promise<WebhookSubscriptionDto> {
    await this.findOne(workspaceId, id);

    const updated = await this.prisma.webhookSubscription.update({
      where: { id },
      data: {
        name: dto.name,
        targetUrl: dto.targetUrl,
        eventTypes: dto.eventTypes,
        description: dto.description,
        isActive: dto.isActive,
      },
      include: {
        deliveries: {
          orderBy: { createdAt: 'desc' },
          take: 3,
        },
      },
    });

    return this.mapToSubscriptionDto(updated);
  }

  /**
   * Delete a webhook subscription.
   */
  async remove(workspaceId: string, id: string): Promise<{ deleted: boolean }> {
    await this.findOne(workspaceId, id);
    await this.prisma.webhookSubscription.delete({ where: { id } });
    return { deleted: true };
  }

  /**
   * Rotate signing secret for a webhook endpoint.
   */
  async rotateSecret(workspaceId: string, id: string): Promise<WebhookSecretRotateResponseDto> {
    await this.findOne(workspaceId, id);

    const newSecretKey = this.generateSecretKey();
    await this.prisma.webhookSubscription.update({
      where: { id },
      data: { secretKey: newSecretKey },
    });

    return {
      subscriptionId: id,
      newSecretKey,
      rotatedAt: new Date().toISOString(),
    };
  }

  /**
   * Send an immediate synthetic test ping to verify endpoint connectivity.
   */
  async sendTestPing(workspaceId: string, subscriptionId: string): Promise<WebhookTestPingResponseDto> {
    const sub = await this.findOne(workspaceId, subscriptionId);

    const timestamp = Math.floor(Date.now() / 1000);
    const pingPayload = {
      event: 'webhook.test_ping',
      eventId: crypto.randomUUID(),
      timestamp,
      workspaceId,
      message: 'OmniSocial AI test ping payload for signature verification.',
    };

    const signature = this.signPayload(sub.secretKey, pingPayload, timestamp);

    const startTime = Date.now();
    let statusCode: number | null = null;
    let responseBody: string | null = null;
    let errorMessage: string | null = null;
    let status: WebhookDeliveryStatus = WebhookDeliveryStatus.SUCCESS;

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000);

      const response = await fetch(sub.targetUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'OmniSocial-Webhook-Agent/1.0',
          'X-OmniSocial-Event': 'webhook.test_ping',
          'X-OmniSocial-Timestamp': timestamp.toString(),
          'X-OmniSocial-Signature': signature,
        },
        body: JSON.stringify(pingPayload),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      statusCode = response.status;
      const text = await response.text().catch(() => '');
      responseBody = text.slice(0, 1000);

      if (!response.ok) {
        status = WebhookDeliveryStatus.FAILED;
        errorMessage = `Destination returned HTTP ${response.status}`;
      }
    } catch (err: any) {
      status = WebhookDeliveryStatus.FAILED;
      errorMessage = err.name === 'AbortError' ? 'Connection timeout after 6000ms' : (err.message || 'Network dispatch error');
    }

    const durationMs = Date.now() - startTime;

    // Log the test delivery
    await this.prisma.webhookDeliveryLog.create({
      data: {
        subscriptionId,
        workspaceId,
        eventType: 'webhook.test_ping',
        payload: pingPayload as any,
        statusCode,
        durationMs,
        responseBody,
        errorMessage,
        status: status as any,
        attemptNumber: 1,
      },
    });

    return {
      delivered: status === WebhookDeliveryStatus.SUCCESS,
      statusCode,
      durationMs,
      responseBody,
      errorMessage,
      signatureHeader: signature,
      timestampHeader: timestamp.toString(),
    };
  }

  /**
   * Dispatch an event to all subscribed active webhooks in the workspace.
   */
  async dispatch(
    workspaceId: string,
    eventType: string,
    payload: Record<string, any>,
  ): Promise<{ deliveredCount: number; failedCount: number }> {
    const subscriptions = await this.prisma.webhookSubscription.findMany({
      where: {
        workspaceId,
        isActive: true,
        eventTypes: { has: eventType },
      },
    });

    let deliveredCount = 0;
    let failedCount = 0;

    for (const sub of subscriptions) {
      const timestamp = Math.floor(Date.now() / 1000);
      const envelope = {
        event: eventType,
        eventId: crypto.randomUUID(),
        timestamp,
        workspaceId,
        data: payload,
      };

      const signature = this.signPayload(sub.secretKey, envelope, timestamp);
      const startTime = Date.now();
      let statusCode: number | null = null;
      let responseBody: string | null = null;
      let errorMessage: string | null = null;
      let deliveryStatus: WebhookDeliveryStatus = WebhookDeliveryStatus.SUCCESS;

      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 6000);

        const res = await fetch(sub.targetUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'User-Agent': 'OmniSocial-Webhook-Agent/1.0',
            'X-OmniSocial-Event': eventType,
            'X-OmniSocial-Timestamp': timestamp.toString(),
            'X-OmniSocial-Signature': signature,
          },
          body: JSON.stringify(envelope),
          signal: controller.signal,
        });

        clearTimeout(timeout);
        statusCode = res.status;
        const bodyText = await res.text().catch(() => '');
        responseBody = bodyText.slice(0, 1000);

        if (!res.ok) {
          deliveryStatus = WebhookDeliveryStatus.FAILED;
          errorMessage = `Remote endpoint responded with HTTP ${res.status}`;
          failedCount++;
        } else {
          deliveredCount++;
        }
      } catch (err: any) {
        deliveryStatus = WebhookDeliveryStatus.FAILED;
        errorMessage = err.name === 'AbortError' ? 'Request timed out' : (err.message || 'Dispatch error');
        failedCount++;
      }

      const durationMs = Date.now() - startTime;

      // Record delivery log
      await this.prisma.webhookDeliveryLog.create({
        data: {
          subscriptionId: sub.id,
          workspaceId,
          eventType,
          payload: envelope as any,
          statusCode,
          durationMs,
          responseBody,
          errorMessage,
          status: deliveryStatus as any,
          attemptNumber: 1,
        },
      });

      // Update subscription stats
      await this.prisma.webhookSubscription.update({
        where: { id: sub.id },
        data: {
          lastTriggeredAt: new Date(),
          failureCount: deliveryStatus === WebhookDeliveryStatus.FAILED ? { increment: 1 } : 0,
        },
      });
    }

    return { deliveredCount, failedCount };
  }

  /**
   * Get delivery logs for workspace.
   */
  async getDeliveries(
    workspaceId: string,
    subscriptionId?: string,
    status?: WebhookDeliveryStatus,
    limit = 50,
  ): Promise<WebhookDeliveryLogDto[]> {
    const where: any = { workspaceId };
    if (subscriptionId) {
      where.subscriptionId = subscriptionId;
    }
    if (status) {
      where.status = status as any;
    }

    const logs = await this.prisma.webhookDeliveryLog.findMany({
      where,
      include: {
        subscription: {
          select: { name: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    return logs.map((l) => ({
      id: l.id,
      subscriptionId: l.subscriptionId,
      workspaceId: l.workspaceId,
      eventType: l.eventType,
      payload: l.payload as any,
      statusCode: l.statusCode,
      durationMs: l.durationMs,
      responseBody: l.responseBody,
      errorMessage: l.errorMessage,
      status: l.status as WebhookDeliveryStatus,
      attemptNumber: l.attemptNumber,
      nextRetryAt: l.nextRetryAt?.toISOString() || null,
      createdAt: l.createdAt.toISOString(),
      subscriptionName: l.subscription?.name,
    }));
  }

  /**
   * Manually retry a delivery log attempt.
   */
  async retryDelivery(workspaceId: string, deliveryId: string): Promise<WebhookDeliveryLogDto> {
    const log = await this.prisma.webhookDeliveryLog.findFirst({
      where: { id: deliveryId, workspaceId },
      include: { subscription: true },
    });

    if (!log) {
      throw new NotFoundException(`Delivery log with ID ${deliveryId} not found in this workspace`);
    }

    const timestamp = Math.floor(Date.now() / 1000);
    const signature = this.signPayload(log.subscription.secretKey, log.payload, timestamp);
    const startTime = Date.now();
    let statusCode: number | null = null;
    let responseBody: string | null = null;
    let errorMessage: string | null = null;
    let status: WebhookDeliveryStatus = WebhookDeliveryStatus.SUCCESS;

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 6000);

      const res = await fetch(log.subscription.targetUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'OmniSocial-Webhook-Agent/1.0',
          'X-OmniSocial-Event': log.eventType,
          'X-OmniSocial-Timestamp': timestamp.toString(),
          'X-OmniSocial-Signature': signature,
          'X-OmniSocial-Retry': (log.attemptNumber + 1).toString(),
        },
        body: JSON.stringify(log.payload),
        signal: controller.signal,
      });

      clearTimeout(timeout);
      statusCode = res.status;
      const bodyText = await res.text().catch(() => '');
      responseBody = bodyText.slice(0, 1000);

      if (!res.ok) {
        status = WebhookDeliveryStatus.FAILED;
        errorMessage = `Remote endpoint responded with HTTP ${res.status}`;
      }
    } catch (err: any) {
      status = WebhookDeliveryStatus.FAILED;
      errorMessage = err.name === 'AbortError' ? 'Request timed out' : (err.message || 'Dispatch error');
    }

    const durationMs = Date.now() - startTime;

    const updated = await this.prisma.webhookDeliveryLog.update({
      where: { id: deliveryId },
      data: {
        statusCode,
        durationMs,
        responseBody,
        errorMessage,
        status: status as any,
        attemptNumber: log.attemptNumber + 1,
      },
      include: {
        subscription: {
          select: { name: true },
        },
      },
    });

    return {
      id: updated.id,
      subscriptionId: updated.subscriptionId,
      workspaceId: updated.workspaceId,
      eventType: updated.eventType,
      payload: updated.payload as any,
      statusCode: updated.statusCode,
      durationMs: updated.durationMs,
      responseBody: updated.responseBody,
      errorMessage: updated.errorMessage,
      status: updated.status as WebhookDeliveryStatus,
      attemptNumber: updated.attemptNumber,
      nextRetryAt: updated.nextRetryAt?.toISOString() || null,
      createdAt: updated.createdAt.toISOString(),
      subscriptionName: updated.subscription?.name,
    };
  }

  /**
   * Helper: Sign payload using HMAC-SHA256.
   */
  signPayload(secretKey: string, payload: any, timestamp: number): string {
    const signaturePayload = `${timestamp}.${typeof payload === 'string' ? payload : JSON.stringify(payload)}`;
    return `sha256=${crypto.createHmac('sha256', secretKey).update(signaturePayload).digest('hex')}`;
  }

  /**
   * Helper: Generate a cryptographically secure random secret key.
   */
  private generateSecretKey(): string {
    return `whsec_${crypto.randomBytes(24).toString('hex')}`;
  }

  private mapToSubscriptionDto(sub: any): WebhookSubscriptionDto {
    return {
      id: sub.id,
      workspaceId: sub.workspaceId,
      name: sub.name,
      targetUrl: sub.targetUrl,
      secretKey: sub.secretKey,
      eventTypes: sub.eventTypes,
      isActive: sub.isActive,
      description: sub.description,
      failureCount: sub.failureCount,
      lastTriggeredAt: sub.lastTriggeredAt?.toISOString() || null,
      createdAt: sub.createdAt.toISOString(),
      updatedAt: sub.updatedAt.toISOString(),
      latestDeliveries: sub.deliveries?.map((d: any) => ({
        id: d.id,
        subscriptionId: d.subscriptionId,
        workspaceId: d.workspaceId,
        eventType: d.eventType,
        payload: d.payload,
        statusCode: d.statusCode,
        durationMs: d.durationMs,
        responseBody: d.responseBody,
        errorMessage: d.errorMessage,
        status: d.status as WebhookDeliveryStatus,
        attemptNumber: d.attemptNumber,
        nextRetryAt: d.nextRetryAt?.toISOString() || null,
        createdAt: d.createdAt.toISOString(),
      })),
    };
  }
}
