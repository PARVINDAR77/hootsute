import {
  Injectable,
  Logger,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { TokenVaultService } from '../../social-accounts/token-vault/token-vault.service';
import { InboxAdapterFactory } from '../adapters/inbox-adapter.factory';
import { SocialConnectionStatus, SocialPlatform } from '@prisma/client';
import { PermissionHealth } from '../interfaces/social-inbox-adapter.interface';

export interface SyncOutcome {
  socialAccountId: string;
  accountName: string;
  platform: SocialPlatform;
  success: boolean;
  newInteractions: number;
  updatedInteractions: number;
  permissionHealth: PermissionHealth;
  error?: string;
}

export interface WorkspaceSyncResult {
  success: boolean;
  totalNew: number;
  totalUpdated: number;
  throttled?: boolean;
  message?: string;
  accounts: SyncOutcome[];
}

@Injectable()
export class InboxSyncService {
  private readonly logger = new Logger(InboxSyncService.name);
  private readonly throttleMap = new Map<string, number>(); // workspaceId -> timestamp
  private readonly THROTTLE_WINDOW_MS = 5 * 60 * 1000; // 5 minutes

  constructor(
    private readonly prisma: PrismaService,
    private readonly tokenVault: TokenVaultService,
    private readonly adapterFactory: InboxAdapterFactory,
  ) {}

  async syncWorkspaceInteractions(
    workspaceId: string,
    options?: { accountId?: string; force?: boolean },
  ): Promise<WorkspaceSyncResult> {
    const now = Date.now();
    const lastSync = this.throttleMap.get(workspaceId);

    if (!options?.force && lastSync && now - lastSync < this.THROTTLE_WINDOW_MS) {
      const waitMinutes = Math.ceil((this.THROTTLE_WINDOW_MS - (now - lastSync)) / 60000);
      return {
        success: false,
        throttled: true,
        totalNew: 0,
        totalUpdated: 0,
        message: `Manual synchronization is throttled. Please try again in ${waitMinutes} minute(s).`,
        accounts: [],
      };
    }

    // Find accounts
    const accountWhere: any = {
      workspaceId,
      connectionStatus: SocialConnectionStatus.CONNECTED,
    };
    if (options?.accountId) {
      accountWhere.id = options.accountId;
    }

    const accounts = await this.prisma.socialAccount.findMany({
      where: accountWhere,
    });

    if (accounts.length === 0) {
      return {
        success: true,
        totalNew: 0,
        totalUpdated: 0,
        message: 'No connected social accounts found in this workspace.',
        accounts: [],
      };
    }

    let totalNew = 0;
    let totalUpdated = 0;
    const accountOutcomes: SyncOutcome[] = [];

    for (const account of accounts) {
      try {
        const adapter = this.adapterFactory.getAdapter(account);
        const health = adapter.checkPermissionHealth(account);

        let decryptedToken: string;
        try {
          decryptedToken = this.tokenVault.decrypt(account.encryptedAccessToken);
        } catch (tokenErr: any) {
          this.logger.error(`Token decryption failure for account [${account.id}]: ${tokenErr.message}`);
          accountOutcomes.push({
            socialAccountId: account.id,
            accountName: account.accountName,
            platform: account.provider === 'META_FACEBOOK' ? SocialPlatform.FACEBOOK : SocialPlatform.INSTAGRAM,
            success: false,
            newInteractions: 0,
            updatedInteractions: 0,
            permissionHealth: health,
            error: 'Authentication failed: Unable to decrypt account credentials. Please reconnect account.',
          });
          continue;
        }

        // Fetch recent interactions from provider
        const fetchResult = await adapter.fetchRecentInteractions(account, decryptedToken, { limit: 50 });
        let newCount = 0;
        let updatedCount = 0;

        for (const item of fetchResult.items) {
          const existing = await this.prisma.socialInteraction.findUnique({
            where: {
              socialAccountId_externalInteractionId: {
                socialAccountId: account.id,
                externalInteractionId: item.externalInteractionId,
              },
            },
          });

          if (existing) {
            // Update mutable fields, but PRESERVE user workflow triage state (status, assignment, isRead)
            await this.prisma.socialInteraction.update({
              where: { id: existing.id },
              data: {
                content: item.content,
                authorName: item.authorName,
                authorUsername: item.authorUsername,
                authorProfileUrl: item.authorProfileUrl,
                externalPostUrl: item.externalPostUrl || existing.externalPostUrl,
                rawMetadata: item.rawMetadata ? (item.rawMetadata as any) : (existing.rawMetadata as any),
              },
            });
            updatedCount++;
          } else {
            // Insert new interaction
            await this.prisma.socialInteraction.create({
              data: {
                workspaceId,
                socialAccountId: account.id,
                platform: item.platform,
                interactionType: item.interactionType,
                externalInteractionId: item.externalInteractionId,
                parentExternalId: item.parentExternalId,
                externalPostId: item.externalPostId,
                externalPostUrl: item.externalPostUrl,
                authorProviderId: item.authorProviderId,
                authorName: item.authorName,
                authorUsername: item.authorUsername,
                authorProfileUrl: item.authorProfileUrl,
                content: item.content,
                publishedAt: item.publishedAt,
                isFromPageOrAccount: item.isFromPageOrAccount,
                workflowStatus: 'OPEN',
                isRead: false,
                rawMetadata: item.rawMetadata ? (item.rawMetadata as any) : undefined,
              },
            });
            newCount++;
          }
        }

        // Update checkpoint
        await this.prisma.inboxSyncCheckpoint.upsert({
          where: { socialAccountId: account.id },
          create: {
            workspaceId,
            socialAccountId: account.id,
            lastSyncedAt: new Date(),
            nextCursor: fetchResult.nextCursor || null,
            status: 'COMPLETED',
          },
          update: {
            lastSyncedAt: new Date(),
            nextCursor: fetchResult.nextCursor || null,
            status: 'COMPLETED',
            errorMessage: null,
          },
        });

        totalNew += newCount;
        totalUpdated += updatedCount;

        accountOutcomes.push({
          socialAccountId: account.id,
          accountName: account.accountName,
          platform: account.provider === 'META_FACEBOOK' ? SocialPlatform.FACEBOOK : SocialPlatform.INSTAGRAM,
          success: true,
          newInteractions: newCount,
          updatedInteractions: updatedCount,
          permissionHealth: health,
        });
      } catch (err: any) {
        this.logger.error(`Error syncing account [${account.id}]: ${err.message}`, err.stack);
        accountOutcomes.push({
          socialAccountId: account.id,
          accountName: account.accountName,
          platform: account.provider === 'META_FACEBOOK' ? SocialPlatform.FACEBOOK : SocialPlatform.INSTAGRAM,
          success: false,
          newInteractions: 0,
          updatedInteractions: 0,
          permissionHealth: { canRead: false, canReply: false, missingScopes: [] },
          error: err.message,
        });
      }
    }

    this.throttleMap.set(workspaceId, now);

    return {
      success: true,
      totalNew,
      totalUpdated,
      message: `Sync completed: ${totalNew} new, ${totalUpdated} updated interactions across ${accounts.length} account(s).`,
      accounts: accountOutcomes,
    };
  }

  async getSyncStatus(workspaceId: string) {
    const accounts = await this.prisma.socialAccount.findMany({
      where: { workspaceId },
      include: {
        inboxSyncCheckpoint: true,
      },
    });

    return accounts.map((acc) => {
      let health: PermissionHealth = {
        canRead: true,
        canReply: false,
        missingScopes: [],
      };
      try {
        const adapter = this.adapterFactory.getAdapter(acc);
        health = adapter.checkPermissionHealth(acc);
      } catch {
        // Non-Meta providers (e.g. LinkedIn, Twitter/X) do not yet use the Meta inbox adapter
        health = {
          canRead: true,
          canReply: false,
          missingScopes: [],
        };
      }

      return {
        socialAccountId: acc.id,
        accountName: acc.accountName,
        accountUsername: acc.accountUsername,
        provider: acc.provider,
        accountType: acc.accountType,
        connectionStatus: acc.connectionStatus,
        lastSyncedAt: acc.inboxSyncCheckpoint?.lastSyncedAt || null,
        syncStatus: acc.inboxSyncCheckpoint?.status || 'NEVER_SYNCED',
        errorMessage: acc.inboxSyncCheckpoint?.errorMessage || null,
        permissionHealth: health,
      };
    });
  }
}
