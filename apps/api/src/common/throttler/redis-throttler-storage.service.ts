import {
  Injectable,
  Logger,
  OnApplicationShutdown,
  Optional,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ThrottlerStorage } from '@nestjs/throttler';
import Redis, { RedisOptions } from 'ioredis';

export interface ThrottlerStorageRecord {
  totalHits: number;
  timeToExpire: number;
}

export type ThrottlerStorageMode = 'REDIS_DISTRIBUTED' | 'IN_MEMORY_LOCAL';
export type RedisFallbackPolicy = 'fail-closed' | 'local-fallback';

interface MemoryRecord {
  totalHits: number;
  expiresAt: number;
}

@Injectable()
export class RedisThrottlerStorage implements ThrottlerStorage, OnApplicationShutdown {
  private readonly logger = new Logger(RedisThrottlerStorage.name);
  private redisClient: Redis | null = null;
  private mode: ThrottlerStorageMode = 'IN_MEMORY_LOCAL';
  private isConnected = false;
  private readonly fallbackPolicy: RedisFallbackPolicy;
  private readonly isProduction: boolean;

  // Local fallback storage
  private readonly memoryStorage = new Map<string, MemoryRecord>();

  // Atomic Lua script for Redis rate-limiting (increment + set TTL if new + return PTTL)
  private readonly luaScript = `
    local current = redis.call('INCR', KEYS[1])
    if current == 1 then
      redis.call('PEXPIRE', KEYS[1], ARGV[1])
    end
    local pttl = redis.call('PTTL', KEYS[1])
    return {current, pttl}
  `;

  constructor(
    private readonly configService: ConfigService,
    @Optional() injectedRedisClient?: Redis,
  ) {
    const nodeEnv = (
      this.configService.get<string>('nodeEnv') ||
      process.env.NODE_ENV ||
      'development'
    ).toLowerCase();
    this.isProduction = nodeEnv === 'production';

    this.fallbackPolicy = (
      this.configService.get<string>('throttler.redisFallbackPolicy') ||
      process.env.RATE_LIMIT_REDIS_FALLBACK ||
      (this.isProduction ? 'fail-closed' : 'local-fallback')
    ).toLowerCase() as RedisFallbackPolicy;

    const redisUrl =
      this.configService.get<string>('REDIS_URL') ||
      process.env.REDIS_URL ||
      '';

    const redisHost =
      this.configService.get<string>('REDIS_HOST') ||
      process.env.REDIS_HOST ||
      '';

    if (injectedRedisClient) {
      this.redisClient = injectedRedisClient;
      this.isConnected = true;
      this.mode = 'REDIS_DISTRIBUTED';
      this.logger.log('ThrottlerStorage: Using injected Redis client.');
    } else if (redisUrl || redisHost) {
      this.initRedisClient(redisUrl, redisHost);
    } else {
      this.mode = 'IN_MEMORY_LOCAL';
      this.logger.log(
        'ThrottlerStorage: Operating in single-instance in-memory mode (REDIS_URL not configured).',
      );
    }
  }

  private initRedisClient(redisUrl: string, redisHost: string) {
    try {
      const options: RedisOptions = {
        connectTimeout: 5000,
        commandTimeout: 2000,
        enableOfflineQueue: false,
        maxRetriesPerRequest: 1,
        retryStrategy: (times) => {
          if (times > 10) return null; // Stop retrying after 10 attempts
          return Math.min(times * 100, 2000);
        },
      };

      if (redisUrl) {
        this.redisClient = new Redis(redisUrl, options);
      } else {
        const port = parseInt(process.env.REDIS_PORT || '6379', 10);
        const password = process.env.REDIS_PASSWORD || undefined;
        this.redisClient = new Redis({
          ...options,
          host: redisHost,
          port,
          password,
        });
      }

      this.redisClient.on('connect', () => {
        this.isConnected = true;
        this.mode = 'REDIS_DISTRIBUTED';
        this.logger.log('ThrottlerStorage: Connected to Redis. Distributed rate limiting is ACTIVE.');
      });

      this.redisClient.on('error', (err) => {
        this.isConnected = false;
        this.logger.error(`ThrottlerStorage: Redis error encountered: ${err.message}`);
      });

      this.redisClient.on('close', () => {
        this.isConnected = false;
        this.logger.warn('ThrottlerStorage: Redis connection closed.');
      });
    } catch (err: any) {
      this.isConnected = false;
      this.logger.error(`ThrottlerStorage: Failed to initialize Redis client: ${err.message}`);
    }
  }

  async increment(key: string, ttl: number): Promise<ThrottlerStorageRecord> {
    const prefixedKey = `ratelimit:${key}`;

    if (this.mode === 'REDIS_DISTRIBUTED' && this.redisClient && this.isConnected) {
      try {
        const result = (await this.redisClient.eval(
          this.luaScript,
          1,
          prefixedKey,
          ttl.toString(),
        )) as [number, number];

        const [totalHits, timeToExpireMs] = result;
        return {
          totalHits: Number(totalHits),
          timeToExpire: Math.max(0, Math.ceil(Number(timeToExpireMs) / 1000)),
        };
      } catch (err: any) {
        this.logger.error(`ThrottlerStorage: Redis increment failed: ${err.message}`);

        if (this.fallbackPolicy === 'fail-closed') {
          throw new ServiceUnavailableException(
            'Distributed rate limiting service temporarily unavailable. Request blocked for system protection.',
          );
        }

        // If local-fallback policy is explicitly configured
        this.logger.warn(
          `ThrottlerStorage: Degrading to local in-memory throttler for key [${key}] due to Redis failure.`,
        );
        return this.incrementMemory(key, ttl);
      }
    }

    // Default in-memory local behavior (e.g. testing, dev, or local fallback)
    return this.incrementMemory(key, ttl);
  }

  private incrementMemory(key: string, ttl: number): ThrottlerStorageRecord {
    const now = Date.now();
    const existing = this.memoryStorage.get(key);

    if (!existing || now >= existing.expiresAt) {
      const expiresAt = now + ttl;
      this.memoryStorage.set(key, { totalHits: 1, expiresAt });
      return { totalHits: 1, timeToExpire: Math.ceil(ttl / 1000) };
    }

    existing.totalHits += 1;
    const timeToExpire = Math.max(0, Math.ceil((existing.expiresAt - now) / 1000));
    return { totalHits: existing.totalHits, timeToExpire };
  }

  getStorageMode(): ThrottlerStorageMode {
    return this.mode;
  }

  isRedisConnected(): boolean {
    return this.isConnected;
  }

  getFallbackPolicy(): RedisFallbackPolicy {
    return this.fallbackPolicy;
  }

  async onApplicationShutdown() {
    if (this.redisClient) {
      try {
        await this.redisClient.quit();
        this.logger.log('ThrottlerStorage: Redis client disconnected cleanly.');
      } catch (err: any) {
        this.logger.warn(`ThrottlerStorage: Error disconnecting Redis client: ${err.message}`);
      }
    }
  }
}
