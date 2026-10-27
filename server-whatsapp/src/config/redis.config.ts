import Redis from 'ioredis';
import { config } from './app.config';

let redisClient: Redis | null = null;
let isConnected = false;

export function isRedisConnected(): boolean {
  return isConnected;
}

export function getRedisClient(): Redis | null {
  return isConnected ? redisClient : null;
}

// Inisialisasi koneksi aman dengan timeout 1 detik tanpa memblokir sistem
try {
  const probe = new Redis({
    host: config.redis.host,
    port: config.redis.port,
    lazyConnect: true,
    connectTimeout: 1000,
    maxRetriesPerRequest: 0,
    retryStrategy: () => null,
  });

  probe.on('connect', () => {
    console.log('[RedisConfig] Terhubung ke Redis.');
    isConnected = true;
    redisClient = probe;
  });

  probe.on('error', () => {
    isConnected = false;
    redisClient = null;
  });

  probe.connect().catch(() => {
    isConnected = false;
    redisClient = null;
  });
} catch {
  isConnected = false;
  redisClient = null;
}
