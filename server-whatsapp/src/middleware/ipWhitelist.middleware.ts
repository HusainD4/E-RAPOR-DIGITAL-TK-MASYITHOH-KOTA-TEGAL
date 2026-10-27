import { Request, Response, NextFunction } from 'express';
import { config } from '../config/app.config';

export function ipWhitelistMiddleware(req: Request, res: Response, next: NextFunction): void {
  const clientIp = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim()
    || req.socket.remoteAddress
    || '';

  const allowed = config.security.allowedOriginIps;
  if (!allowed.includes(clientIp)) {
    res.status(403).json({ success: false, message: `Forbidden: IP ${clientIp} is not whitelisted.` });
    return;
  }
  next();
}
