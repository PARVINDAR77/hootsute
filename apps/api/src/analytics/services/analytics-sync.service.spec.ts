import { Test, TestingModule } from '@nestjs/testing';
import { AnalyticsSyncService } from './analytics-sync.service';
import { PrismaService } from '../../prisma/prisma.service';
import { TokenVaultService } from '../../social-accounts/token-vault/token-vault.service';
import { AnalyticsRepository } from '../repositories/analytics.repository';
import { AnalyticsAdapterFactory } from '../providers/analytics-adapter.factory';
import { MockSocialAnalyticsAdapter } from '../providers/mock-social-analytics.adapter';
import {
  SocialPlatform,
  SocialProvider,
  SocialAccountType,
  SocialConnectionStatus,
  SyncJobStatus,
  SyncJobType,
} from '@prisma/client';
import { NotFoundException } from '@nestjs/common';

describe('AnalyticsSyncService', () => {
  let service: AnalyticsSyncService;
  let prisma: any;
  let tokenVault: any;
  let repository: any;
  let mockAdapter: MockSocialAnalyticsAdapter;

  const mockAccount = {
    id: 'acc-sync-1',
    workspaceId: 'ws-1',
    provider: SocialProvider.META_FACEBOOK,
    providerAccountId: 'page-123',
    accountName: 'Sync Brand Page',
    accountType: SocialAccountType.FACEBOOK_PAGE,
    connectionStatus: SocialConnectionStatus.CONNECTED,
    encryptedAccessToken: 'encrypted-token',
    grantedScopes: ['pages_show_list', 'pages_read_engagement', 'read_insights'],
    connectedByUserId: 'user-1',
    lastValidatedAt: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
    accountUsername: null,
    profileImageUrl: null,
    tokenExpiresAt: null,
    metadata: null,
  };

  const mockRepo = {
    createSyncJob: jest.fn(),
    renewLease: jest.fn(),
    completeSyncJob: jest.fn(),
    recordSyncError: jest.fn(),
    upsertAccountSnapshot: jest.fn(),
    upsertPostSnapshot: jest.fn(),
    getSyncFreshness: jest.fn(),
  };

  const mockPrisma = {
    socialAccount: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
    },
    scheduledPostTarget: {
      findFirst: jest.fn(),
    },
    analyticsSyncJob: {
      findFirst: jest.fn(),
    },
  };

  const mockTokenVault = {
    decrypt: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    mockAdapter = new MockSocialAnalyticsAdapter();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AnalyticsSyncService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: TokenVaultService, useValue: mockTokenVault },
        { provide: AnalyticsRepository, useValue: mockRepo },
        {
          provide: AnalyticsAdapterFactory,
          useValue: {
            getAdapter: () => mockAdapter,
          },
        },
      ],
    }).compile();

    service = module.get<AnalyticsSyncService>(AnalyticsSyncService);
    prisma = module.get(PrismaService);
    tokenVault = module.get(TokenVaultService);
    repository = module.get(AnalyticsRepository);
  });

  describe('syncAccount', () => {
    it('throws NotFoundException when account does not belong to workspace', async () => {
      mockPrisma.socialAccount.findUnique.mockResolvedValue(null);

      await expect(
        service.syncAccount('ws-1', 'invalid-acc'),
      ).rejects.toThrow(NotFoundException);
    });

    it('safely skips disconnected accounts without crashing', async () => {
      mockPrisma.socialAccount.findUnique.mockResolvedValue({
        ...mockAccount,
        connectionStatus: SocialConnectionStatus.DISCONNECTED,
      });

      mockRepo.createSyncJob.mockResolvedValue({
        id: 'job-1',
        claimToken: 'token-abc',
      });

      const res = await service.syncAccount('ws-1', mockAccount.id);

      expect(res.success).toBe(false);
      expect(mockRepo.recordSyncError).toHaveBeenCalledWith(
        expect.objectContaining({
          errorCode: 'ACCOUNT_NOT_CONNECTED',
          isPermissionError: true,
        }),
      );
      expect(mockRepo.completeSyncJob).toHaveBeenCalledWith(
        expect.objectContaining({
          status: SyncJobStatus.FAILED,
        }),
      );
    });

    it('handles token decryption failure safely', async () => {
      mockPrisma.socialAccount.findUnique.mockResolvedValue(mockAccount);
      mockRepo.createSyncJob.mockResolvedValue({
        id: 'job-1',
        claimToken: 'token-abc',
      });
      mockTokenVault.decrypt.mockImplementation(() => {
        throw new Error('Unsupported state or unable to authenticate data');
      });

      const res = await service.syncAccount('ws-1', mockAccount.id);

      expect(res.success).toBe(false);
      expect(mockRepo.recordSyncError).toHaveBeenCalledWith(
        expect.objectContaining({
          errorCode: 'TOKEN_DECRYPTION_FAILED',
        }),
      );
      expect(mockRepo.completeSyncJob).toHaveBeenCalledWith(
        expect.objectContaining({
          status: SyncJobStatus.FAILED,
        }),
      );
    });

    it('executes successful account and incremental post synchronization', async () => {
      mockPrisma.socialAccount.findUnique.mockResolvedValue(mockAccount);
      mockRepo.createSyncJob.mockResolvedValue({
        id: 'job-1',
        claimToken: 'token-abc',
      });
      mockTokenVault.decrypt.mockReturnValue('decrypted_token');

      // Matching target for post-1
      mockPrisma.scheduledPostTarget.findFirst.mockImplementation((args: any) => {
        if (args.where.externalPostId === 'mock-post-1') {
          return Promise.resolve({ id: 'target-match-1' });
        }
        return Promise.resolve(null);
      });

      const res = await service.syncAccount('ws-1', mockAccount.id);

      expect(res.success).toBe(true);
      expect(mockRepo.upsertAccountSnapshot).toHaveBeenCalled();
      expect(mockRepo.upsertPostSnapshot).toHaveBeenCalledTimes(2);

      // Verify matching target was linked
      expect(mockRepo.upsertPostSnapshot).toHaveBeenCalledWith(
        expect.objectContaining({
          externalPostId: 'mock-post-1',
          scheduledPostTargetId: 'target-match-1',
        }),
      );

      // Verify second post was ingested even without matching OmniSocial target
      expect(mockRepo.upsertPostSnapshot).toHaveBeenCalledWith(
        expect.objectContaining({
          externalPostId: 'mock-post-2',
          scheduledPostTargetId: null,
        }),
      );

      expect(mockRepo.completeSyncJob).toHaveBeenCalledWith(
        expect.objectContaining({
          status: SyncJobStatus.COMPLETED,
        }),
      );
    });
  });

  describe('triggerManualSync throttling', () => {
    it('throttles sync requests made less than 15 minutes apart', async () => {
      mockRepo.getSyncFreshness.mockResolvedValue({
        lastAttemptedSyncAt: new Date(Date.now() - 5 * 60 * 1000), // 5 mins ago
        lastSuccessfulSyncAt: new Date(Date.now() - 5 * 60 * 1000),
      });

      const res = await service.triggerManualSync('ws-1', 'user-1', mockAccount.id);

      expect(res.throttled).toBe(true);
      expect(res.message).toContain('throttled');
    });

    it('permits manual sync when last sync was more than 15 minutes ago', async () => {
      mockRepo.getSyncFreshness.mockResolvedValue({
        lastAttemptedSyncAt: new Date(Date.now() - 20 * 60 * 1000), // 20 mins ago
        lastSuccessfulSyncAt: new Date(Date.now() - 20 * 60 * 1000),
      });
      mockPrisma.socialAccount.findUnique.mockResolvedValue(mockAccount);
      mockRepo.createSyncJob.mockResolvedValue({ id: 'job-1', claimToken: 'token-abc' });
      mockTokenVault.decrypt.mockReturnValue('decrypted_token');

      const res = await service.triggerManualSync('ws-1', 'user-1', mockAccount.id);

      expect(res.throttled).toBe(false);
    });
  });
});
