import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { PushNotificationsService } from './push-notifications.service';
import { PrismaService } from '../prisma/prisma.service';

describe('PushNotificationsService', () => {
  let service: PushNotificationsService;
  let prisma: any;

  const mockPrisma = {
    workspaceMember: {
      findMany: jest.fn(),
    },
  };

  const mockConfigService = {
    get: jest.fn((key: string) => {
      if (key === 'VAPID_PUBLIC_KEY') return 'test_vapid_public_key';
      if (key === 'VAPID_PRIVATE_KEY') return 'test_vapid_private_key';
      return null;
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PushNotificationsService,
        { provide: ConfigService, useValue: mockConfigService },
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<PushNotificationsService>(PushNotificationsService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    service.clearAllSubscriptions();
  });

  it('should return the configured VAPID public key', () => {
    const { publicKey } = service.getVapidPublicKey();
    expect(publicKey).toBe('test_vapid_public_key');
  });

  it('should register a new browser push subscription and list it', async () => {
    const subDto = {
      endpoint: 'https://fcm.googleapis.com/fcm/send/sub123',
      keys: {
        p256dh: 'p256_mock_key',
        auth: 'auth_mock_secret',
      },
      deviceType: 'Chrome / Windows',
    };

    const record = await service.subscribe('user-1', subDto);
    expect(record.userId).toBe('user-1');
    expect(record.endpoint).toBe(subDto.endpoint);
    expect(record.deviceType).toBe('Chrome / Windows');

    const subs = service.getUserSubscriptions('user-1');
    expect(subs).toHaveLength(1);
    expect(subs[0].endpoint).toBe(subDto.endpoint);
  });

  it('should update existing subscription if endpoint is re-registered', async () => {
    const subDto = {
      endpoint: 'https://fcm.googleapis.com/fcm/send/sub123',
      keys: { p256dh: 'key1', auth: 'auth1' },
      deviceType: 'Mobile Safari',
    };

    await service.subscribe('user-1', subDto);
    await service.subscribe('user-2', { ...subDto, deviceType: 'Updated Device' });

    const user1Subs = service.getUserSubscriptions('user-1');
    const user2Subs = service.getUserSubscriptions('user-2');
    expect(user1Subs).toHaveLength(0);
    expect(user2Subs).toHaveLength(1);
    expect(user2Subs[0].deviceType).toBe('Updated Device');
  });

  it('should unsubscribe an endpoint cleanly', async () => {
    const subDto = {
      endpoint: 'https://fcm.googleapis.com/fcm/send/sub123',
      keys: { p256dh: 'key1', auth: 'auth1' },
    };

    await service.subscribe('user-1', subDto);
    expect(service.getUserSubscriptions('user-1')).toHaveLength(1);

    await service.unsubscribe('user-1', subDto.endpoint);
    expect(service.getUserSubscriptions('user-1')).toHaveLength(0);
  });

  it('should send push notification to user subscriptions', async () => {
    await service.subscribe('user-1', {
      endpoint: 'https://fcm.googleapis.com/fcm/send/sub1',
      keys: { p256dh: 'k1', auth: 'a1' },
    });
    await service.subscribe('user-1', {
      endpoint: 'https://fcm.googleapis.com/fcm/send/sub2',
      keys: { p256dh: 'k2', auth: 'a2' },
    });

    const res = await service.sendNotificationToUser('user-1', {
      title: 'Post Published',
      body: 'Your scheduled campaign has been dispatched!',
    });

    expect(res.sentCount).toBe(2);
    expect(res.failureCount).toBe(0);
  });

  it('should send push notification to active workspace members', async () => {
    mockPrisma.workspaceMember.findMany.mockResolvedValue([
      { userId: 'u1' },
      { userId: 'u2' },
    ]);

    await service.subscribe('u1', {
      endpoint: 'https://fcm.googleapis.com/fcm/send/u1',
      keys: { p256dh: 'k1', auth: 'a1' },
    });
    await service.subscribe('u2', {
      endpoint: 'https://fcm.googleapis.com/fcm/send/u2',
      keys: { p256dh: 'k2', auth: 'a2' },
    });

    const res = await service.sendNotificationToWorkspace('ws-123', {
      title: 'Draft Approved',
      body: 'Review completed by admin.',
    });

    expect(res.sentCount).toBe(2);
    expect(res.recipientCount).toBe(2);
  });
});
