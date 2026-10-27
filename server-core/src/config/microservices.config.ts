import { registerAs } from '@nestjs/config';

export const microservicesConfig = registerAs('microservices', () => ({
  wa: {
    url: process.env.WA_GATEWAY_URL || 'http://127.0.0.1:3001',
    apiKey: process.env.WA_GATEWAY_API_KEY || 'HaisenNexus.WhatsApp_Relay.Tegal_2026!w8',
  },
  ai: {
    url: process.env.AI_ENGINE_URL || 'http://127.0.0.1:8001',
    apiKey: process.env.AI_ENGINE_API_KEY || 'HaisenCognition.Masyithoh_AI.Brain_2026!28',
  },
  redis: {
    host: process.env.REDIS_HOST || '127.0.0.1',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD || undefined,
  },
}));
