import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { config } from './config/app.config';
import { apiKeyMiddleware } from './middleware/apiKey.middleware';
import { ipWhitelistMiddleware } from './middleware/ipWhitelist.middleware';
import { sessionRouter } from './modules/session/session.controller';
import { messagingRouter } from './modules/messaging/messaging.controller';

const app = express();

// --- Global Middleware ---
app.use(express.json({ limit: '20mb' }));
app.use(cors({ origin: config.security.allowedOriginIps }));

// --- Health Check (no auth required) ---
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'WA Gateway', env: config.env, port: config.port });
});

// --- Protected API Routes ---
app.use('/api/v1', ipWhitelistMiddleware, apiKeyMiddleware);
app.use('/api/v1/sessions', sessionRouter);
app.use('/api/v1/messages', messagingRouter);

// --- 404 Handler ---
app.use((_req, res) => {
  res.status(404).json({ success: false, message: 'Endpoint not found.' });
});

export default app;
