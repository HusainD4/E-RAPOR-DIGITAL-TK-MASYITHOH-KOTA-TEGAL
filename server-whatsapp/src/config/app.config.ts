import 'dotenv/config';

export const config = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3001', 10),
  appUrl: process.env.APP_URL || 'http://127.0.0.1:3001',

  security: {
    internalApiKey: process.env.INTERNAL_API_KEY || '',
    webhookHmacSecret: process.env.WEBHOOK_HMAC_SECRET || '',
    coreServerWebhookUrl: process.env.CORE_SERVER_WEBHOOK_URL || '',
    allowedOriginIps: (process.env.ALLOWED_ORIGIN_IPS || '127.0.0.1').split(','),
  },

  session: {
    maxConcurrentSessions: parseInt(process.env.MAX_CONCURRENT_SESSIONS || '50', 10),
    storagePath: process.env.SESSION_STORAGE_PATH || './sessions',
  },

  redis: {
    host: process.env.REDIS_HOST || '127.0.0.1',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
  },

  baileys: {
    minDelaySeconds: parseInt(process.env.MIN_DELAY_SECONDS || '3', 10),
    maxDelaySeconds: parseInt(process.env.MAX_DELAY_SECONDS || '8', 10),
    maxRetryAttempts: parseInt(process.env.MAX_RETRY_ATTEMPTS || '3', 10),
    streamBufferTimeoutMs: parseInt(process.env.STREAM_BUFFER_TIMEOUT_MS || '60000', 10),
    connectTimeoutMs: parseInt(process.env.CONNECT_TIMEOUT_MS || '60000', 10),
  },
};
