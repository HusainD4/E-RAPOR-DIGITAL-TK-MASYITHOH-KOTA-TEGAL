import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private client: Redis | null = null;
  private isAvailable = false;
  private memoryCache = new Map<string, { value: string; expiry?: number }>();

  constructor(private readonly configService: ConfigService) {}

  async onModuleInit() {
    const host = this.configService.get<string>('microservices.redis.host', '127.0.0.1');
    const port = this.configService.get<number>('microservices.redis.port', 6379);
    const password = this.configService.get<string>('microservices.redis.password');

    try {
      this.client = new Redis({
        host,
        port,
        password,
        lazyConnect: true,
        maxRetriesPerRequest: 1,
        retryStrategy: () => null,
        enableOfflineQueue: false,
      });

      this.client.on('error', (err) => {
        if (this.isAvailable) {
          this.logger.warn(`Redis disconnected: ${err.message}. Switching to in-memory fallback.`);
          this.isAvailable = false;
        }
      });

      this.client.on('connect', () => {
        this.logger.log(`Connected to Redis at ${host}:${port}`);
        this.isAvailable = true;
      });

      await this.client.connect().catch((err) => {
        this.logger.warn(`Redis connection failed (${err.message}). Using resilient in-memory cache fallback.`);
        this.isAvailable = false;
      });
    } catch (err) {
      this.logger.warn(`Redis init warning: ${err.message}. Using in-memory fallback.`);
      this.isAvailable = false;
    }
  }

  async onModuleDestroy() {
    if (this.client) {
      await this.client.quit().catch(() => {});
    }
  }

  get isConnected(): boolean {
    return this.isAvailable;
  }

  async get(key: string): Promise<string | null> {
    if (this.isAvailable && this.client) {
      try {
        return await this.client.get(key);
      } catch {
        // Fall back to memory
      }
    }
    const item = this.memoryCache.get(key);
    if (!item) return null;
    if (item.expiry && Date.now() > item.expiry) {
      this.memoryCache.delete(key);
      return null;
    }
    return item.value;
  }

  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    if (this.isAvailable && this.client) {
      try {
        if (ttlSeconds) {
          await this.client.set(key, value, 'EX', ttlSeconds);
        } else {
          await this.client.set(key, value);
        }
        return;
      } catch {
        // Fall back to memory
      }
    }
    const expiry = ttlSeconds ? Date.now() + ttlSeconds * 1000 : undefined;
    this.memoryCache.set(key, { value, expiry });
  }

  async del(key: string): Promise<void> {
    if (this.isAvailable && this.client) {
      try {
        await this.client.del(key);
      } catch {
        // Fall back to memory
      }
    }
    this.memoryCache.delete(key);
  }

  async sAdd(key: string, ...members: string[]): Promise<void> {
    if (this.isAvailable && this.client) {
      try {
        await this.client.sadd(key, ...members);
        return;
      } catch {
        // Fall back
      }
    }
    const existing = this.memoryCache.get(key)?.value;
    const set = new Set<string>(existing ? JSON.parse(existing) : []);
    members.forEach((m) => set.add(m));
    this.memoryCache.set(key, { value: JSON.stringify(Array.from(set)) });
  }

  async sIsMember(key: string, member: string): Promise<boolean> {
    if (this.isAvailable && this.client) {
      try {
        const res = await this.client.sismember(key, member);
        return res === 1;
      } catch {
        // Fall back
      }
    }
    const existing = this.memoryCache.get(key)?.value;
    if (!existing) return false;
    const list: string[] = JSON.parse(existing);
    return list.includes(member);
  }

  async sMembers(key: string): Promise<string[]> {
    if (this.isAvailable && this.client) {
      try {
        return await this.client.smembers(key);
      } catch {
        // Fall back
      }
    }
    const existing = this.memoryCache.get(key)?.value;
    return existing ? JSON.parse(existing) : [];
  }
}
