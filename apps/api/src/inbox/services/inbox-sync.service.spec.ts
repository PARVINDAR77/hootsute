import { Test, TestingModule } from '@nestjs/testing';
import { InboxSyncService } from './inbox-sync.service';
import { PrismaService } from '../../prisma/prisma.service';
import { TokenVaultService } from '../../social-accounts/token-vault/token-vault.service';
import { InboxAdapterFactory } from '../adapters/inbox-adapter.factory';
import { SocialPlatform, InteractionType, SocialConnectionStatus } from '@prisma/client';

describe('InboxSyncService', () => {
  let service: InboxSyncService;
  let prisma: any;
  let tokenVault: any;
  let adapterFactory: any;

  const mockAdapter = {
    checkPermissionHealth: jest.fn().mockReturnValue({ canRead: true, canReply: true, missingScopes: [] }),
    fetchRecentInteractions: jest.fn(),
  };

  const sampleAccount: any = {
    id: 'acc-1',
    workspaceId: 'ws-1',
    accountName: 'Main Page',
    accountUsername: 'mainpage',
    provider: 'META_FACEBOOK',
    connectionStatus: SocialConnectionStatus.CONNECTED,
    encryptedAccessToken: 'enc:token',
    inboxSyncCheckpoint: null,
  };

  beforeEach(async () => {
    prisma = {
      socialAccount: {
        findMany: jest.fn().mockResolvedValue([sampleAccount]),
      },
      socialInteraction: {
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      inboxSyncCheckpoint: {
        upsert: jest.fn().mockResolvedValue({}),
      },
    };

    tokenVault = {
      decrypt: jest.fn().mockReturnValue('plain-token'),
    };

    adapterFactory = {
      getAdapter: jest.fn().mockReturnValue(mockAdapter),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InboxSyncService,
        { provide: PrismaService, useValue: prisma },
        { provide: TokenVaultService, useValue: tokenVault },
        { provide: InboxAdapterFactory, useValue: adapterFactory },
      ],
    }).compile();

    service = module.get<InboxSyncService>(InboxSyncService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('synchronizes interactions and creates new items', async () => {
    mockAdapter.fetchRecentInteractions.mockResolvedValue({
      items: [
        {
          externalInteractionId: 'comm-1',
          platform: SocialPlatform.FACEBOOK,
          interactionType: InteractionType.COMMENT,
          content: 'Hello, great post!',
          authorProviderId: 'user-1',
          authorName: 'John Doe',
          publishedAt: new Date(),
          isFromPageOrAccount: false,
        },
      ],
      nextCursor: 'cursor-1',
      hasMore: false,
    });

    prisma.socialInteraction.findUnique.mockResolvedValue(null); // New item

    const result = await service.syncWorkspaceInteractions('ws-1', { force: true });

    expect(result.success).toBe(true);
    expect(result.totalNew).toBe(1);
    expect(prisma.socialInteraction.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          workspaceId: 'ws-1',
          externalInteractionId: 'comm-1',
          workflowStatus: 'OPEN',
          isRead: false,
        }),
      }),
    );
  });

  it('updates existing interaction while PRESERVING user workflow status', async () => {
    mockAdapter.fetchRecentInteractions.mockResolvedValue({
      items: [
        {
          externalInteractionId: 'comm-1',
          platform: SocialPlatform.FACEBOOK,
          interactionType: InteractionType.COMMENT,
          content: 'Updated content edit',
          authorProviderId: 'user-1',
          authorName: 'John Doe',
          publishedAt: new Date(),
          isFromPageOrAccount: false,
        },
      ],
      nextCursor: null,
      hasMore: false,
    });

    // Existing record in RESOLVED state
    prisma.socialInteraction.findUnique.mockResolvedValue({
      id: 'int-existing-1',
      workflowStatus: 'RESOLVED',
      isRead: true,
      assignedToUserId: 'user-admin',
    });

    const result = await service.syncWorkspaceInteractions('ws-1', { force: true });

    expect(result.success).toBe(true);
    expect(result.totalUpdated).toBe(1);
    expect(prisma.socialInteraction.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'int-existing-1' },
        data: expect.objectContaining({
          content: 'Updated content edit',
        }),
      }),
    );
    // Notice: data does NOT set workflowStatus: 'OPEN' or isRead: false
    expect(prisma.socialInteraction.update).not.toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          workflowStatus: 'OPEN',
        }),
      }),
    );
  });

  it('enforces 5-minute manual sync cooldown when force is false', async () => {
    mockAdapter.fetchRecentInteractions.mockResolvedValue({ items: [], nextCursor: null });

    // First run
    await service.syncWorkspaceInteractions('ws-1');

    // Second run immediately without force
    const throttledResult = await service.syncWorkspaceInteractions('ws-1', { force: false });

    expect(throttledResult.success).toBe(false);
    expect(throttledResult.throttled).toBe(true);
    expect(throttledResult.message).toContain('throttled');
  });
});
