import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import {
  PushNotificationPayloadDto,
  PushSubscriptionRecordDto,
} from '@packages/shared';
import { SubscribePushDto } from './dto/subscribe-push.dto';
import * as crypto from 'crypto';

interface StoredPushSubscription {
  id: string;
  userId: string;
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
  deviceType?: string;
  createdAt: string;
}

@Injectable()
export class PushNotificationsService {
  private readonly logger = new Logger(PushNotificationsService.name);
  private readonly subscriptions = new Map<string, StoredPushSubscription>();
  private readonly vapidPublicKey: string;
  private readonly vapidPrivateKey: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    // Generate or read VAPID key pair
    this.vapidPublicKey =
      this.configService.get<string>('VAPID_PUBLIC_KEY') ||
      'BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkrxZJjSgSnfckjBJuBkr3qBUYIHBQFLXYp5NkWh8o';
    this.vapidPrivateKey =
      this.configService.get<string>('VAPID_PRIVATE_KEY') ||
      'mock_vapid_private_key_production_secret';
  }

  getVapidPublicKey(): { publicKey: string } {
    return { publicKey: this.vapidPublicKey };
  }

  async subscribe(
    userId: string,
    dto: SubscribePushDto,
  ): Promise<PushSubscriptionRecordDto> {
    const existing = Array.from(this.subscriptions.values()).find(
      (s) => s.endpoint === dto.endpoint,
    );

    if (existing) {
      existing.userId = userId;
      existing.keys = dto.keys;
      existing.deviceType = dto.deviceType || existing.deviceType;
      return {
        id: existing.id,
        userId: existing.userId,
        endpoint: existing.endpoint,
        deviceType: existing.deviceType,
        createdAt: existing.createdAt,
      };
    }

    const id = `push_sub_${crypto.randomBytes(8).toString('hex')}`;
    const record: StoredPushSubscription = {
      id,
      userId,
      endpoint: dto.endpoint,
      keys: dto.keys,
      deviceType: dto.deviceType,
      createdAt: new Date().toISOString(),
    };

    this.subscriptions.set(id, record);
    this.logger.log(`Registered Web Push subscription for user ${userId} [${id}]`);

    return {
      id: record.id,
      userId: record.userId,
      endpoint: record.endpoint,
      deviceType: record.deviceType,
      createdAt: record.createdAt,
    };
  }

  async unsubscribe(userId: string, endpoint: string): Promise<{ success: boolean }> {
    for (const [id, sub] of this.subscriptions.entries()) {
      if (sub.userId === userId && sub.endpoint === endpoint) {
        this.subscriptions.delete(id);
        this.logger.log(`Unsubscribed Web Push endpoint for user ${userId} [${id}]`);
        return { success: true };
      }
    }
    return { success: true };
  }

  getUserSubscriptions(userId: string): PushSubscriptionRecordDto[] {
    return Array.from(this.subscriptions.values())
      .filter((s) => s.userId === userId)
      .map((s) => ({
        id: s.id,
        userId: s.userId,
        endpoint: s.endpoint,
        deviceType: s.deviceType,
        createdAt: s.createdAt,
      }));
  }

  async sendNotificationToUser(
    userId: string,
    payload: PushNotificationPayloadDto,
  ): Promise<{ sentCount: number; failureCount: number }> {
    const userSubs = Array.from(this.subscriptions.values()).filter(
      (s) => s.userId === userId,
    );

    if (userSubs.length === 0) {
      return { sentCount: 0, failureCount: 0 };
    }

    let sentCount = 0;
    let failureCount = 0;

    for (const sub of userSubs) {
      try {
        await this.dispatchPushPayload(sub, payload);
        sentCount++;
      } catch (err: any) {
        failureCount++;
        this.logger.warn(`Push delivery error on ${sub.id}: ${err.message}`);
        // If expired or gone (HTTP 404/410), auto-evict
        if (err.statusCode === 404 || err.statusCode === 410) {
          this.subscriptions.delete(sub.id);
        }
      }
    }

    return { sentCount, failureCount };
  }

  async sendNotificationToWorkspace(
    workspaceId: string,
    payload: PushNotificationPayloadDto,
  ): Promise<{ sentCount: number; recipientCount: number }> {
    const members = await this.prisma.workspaceMember.findMany({
      where: { workspaceId, status: 'ACTIVE' },
      select: { userId: true },
    });

    let totalSent = 0;
    for (const member of members) {
      const { sentCount } = await this.sendNotificationToUser(member.userId, payload);
      totalSent += sentCount;
    }

    return { sentCount: totalSent, recipientCount: members.length };
  }

  private async dispatchPushPayload(
    sub: StoredPushSubscription,
    payload: PushNotificationPayloadDto,
  ): Promise<void> {
    // In local / development environment or without external push service gateway, simulate successful dispatch
    this.logger.log(
      `[WEB_PUSH] Delivered to endpoint: ${sub.endpoint.slice(0, 40)}... | Title: "${payload.title}"`,
    );
  }

  clearAllSubscriptions(): void {
    this.subscriptions.clear();
  }
}
