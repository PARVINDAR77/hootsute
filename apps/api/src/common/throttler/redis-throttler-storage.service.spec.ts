import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { RedisThrottlerStorage } from './redis-throttler-storage.service';
import { ServiceUnavailableException } from '@nestjs/common';

describe('RedisThrottlerStorage', () => {
  it('operates in IN_MEMORY_LOCAL mode when REDIS_URL and REDIS_HOST are not set', async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RedisThrottlerStorage,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockReturnValue(null),
          },
        },
      ],
    }).compile();

    const storage = module.get<RedisThrottlerStorage>(RedisThrottlerStorage);
    expect(storage.getStorageMode()).toBe('IN_MEMORY_LOCAL');
    expect(storage.isRedisConnected()).toBe(false);

    // Test in-memory incrementing
    const res1 = await storage.increment('test-ip-1', 60000);
    expect(res1.totalHits).toBe(1);
    expect(res1.timeToExpire).toBeGreaterThan(0);

    const res2 = await storage.increment('test-ip-1', 60000);
    expect(res2.totalHits).toBe(2);

    const resOther = await storage.increment('test-ip-2', 60000);
    expect(resOther.totalHits).toBe(1);
  });

  it('resets in-memory hits after TTL expiration', async () => {
    const storage = new RedisThrottlerStorage({
      get: jest.fn().mockReturnValue(null),
    } as any);

    const res1 = await storage.increment('expiring-key', 50); // 50ms TTL
    expect(res1.totalHits).toBe(1);

    // Wait for TTL expiration
    await new Promise((resolve) => setTimeout(resolve, 60));

    const res2 = await storage.increment('expiring-key', 50);
    expect(res2.totalHits).toBe(1);
  });

  it('throws ServiceUnavailableException when Redis fails under fail-closed policy in production', async () => {
    const mockRedis = {
      eval: jest.fn().mockRejectedValue(new Error('Connection timed out')),
      quit: jest.fn().mockResolvedValue('OK'),
      on: jest.fn(),
    } as any;

    const storage = new RedisThrottlerStorage(
      {
        get: jest.fn().mockImplementation((key: string) => {
          if (key === 'nodeEnv') return 'production';
          return null;
        }),
      } as any,
      mockRedis,
    );

    expect(storage.getFallbackPolicy()).toBe('fail-closed');
    expect(storage.getStorageMode()).toBe('REDIS_DISTRIBUTED');

    await expect(storage.increment('blocked-key', 60000)).rejects.toThrow(
      ServiceUnavailableException,
    );
  });

  it('degrades to in-memory when Redis fails under local-fallback policy', async () => {
    const mockRedis = {
      eval: jest.fn().mockRejectedValue(new Error('Network partition')),
      quit: jest.fn().mockResolvedValue('OK'),
      on: jest.fn(),
    } as any;

    const storage = new RedisThrottlerStorage(
      {
        get: jest.fn().mockImplementation((key: string) => {
          if (key === 'nodeEnv') return 'development';
          if (key === 'throttler.redisFallbackPolicy') return 'local-fallback';
          return null;
        }),
      } as any,
      mockRedis,
    );

    expect(storage.getFallbackPolicy()).toBe('local-fallback');

    const res = await storage.increment('fallback-key', 60000);
    expect(res.totalHits).toBe(1);
    expect(res.timeToExpire).toBe(60);
  });

  it('parses Redis Lua result correctly when connected', async () => {
    const mockRedis = {
      eval: jest.fn().mockResolvedValue([5, 45200]), // 5 hits, 45200ms remaining
      quit: jest.fn().mockResolvedValue('OK'),
      on: jest.fn(),
    } as any;

    const storage = new RedisThrottlerStorage(
      {
        get: jest.fn().mockReturnValue(null),
      } as any,
      mockRedis,
    );

    const res = await storage.increment('redis-key', 60000);
    expect(res.totalHits).toBe(5);
    expect(res.timeToExpire).toBe(46); // Math.ceil(45200 / 1000)
    expect(mockRedis.eval).toHaveBeenCalledWith(
      expect.any(String),
      1,
      'ratelimit:redis-key',
      '60000',
    );
  });

  it('shuts down cleanly on application shutdown', async () => {
    const mockRedis = {
      quit: jest.fn().mockResolvedValue('OK'),
      on: jest.fn(),
    } as any;

    const storage = new RedisThrottlerStorage(
      {
        get: jest.fn().mockReturnValue(null),
      } as any,
      mockRedis,
    );

    await storage.onApplicationShutdown();
    expect(mockRedis.quit).toHaveBeenCalled();
  });
});
