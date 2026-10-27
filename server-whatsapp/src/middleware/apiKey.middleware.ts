import { Request, Response, NextFunction } from 'express';
import { config } from '../config/app.config';

export function apiKeyMiddleware(req: Request, res: Response, next: NextFunction): void {
  const key = req.headers['x-api-key'];
  if (!key || key !== config.security.internalApiKey) {
    res.status(401).json({ success: false, message: 'Unauthorized: Invalid or missing X-API-KEY.' });
    return;
  }
  next();
}
