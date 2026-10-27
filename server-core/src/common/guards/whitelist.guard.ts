import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { Request } from 'express';
import { PrismaService } from '../../modules/prisma/prisma.service';
import { RedisService } from '../../modules/redis/redis.service';

@Injectable()
export class IpDomainWhitelistGuard implements CanActivate {
  private readonly logger = new Logger(IpDomainWhitelistGuard.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = ctxToRequest(context);
    const clientIp = this.extractClientIp(request);
    const origin = request.headers.origin || request.headers.referer;

    // Always allow local loopback in development to prevent lockouts
    if (
      process.env.NODE_ENV !== 'production' &&
      (
        clientIp === '127.0.0.1' ||
        clientIp === '::1' ||
        clientIp === 'localhost' ||
        clientIp === '::ffff:127.0.0.1' || // IPv6-mapped IPv4 loopback
        !clientIp
      )
    ) {
      return true;
    }

    // Healthcheck / docs / root always accessible
    if (request.path === '/' || request.path === '/api/health') {
      return true;
    }

    try {
      const isIpAllowed = await this.checkIpAllowed(clientIp);
      if (isIpAllowed) return true;

      if (origin) {
        const isOriginAllowed = await this.checkOriginAllowed(origin);
        if (isOriginAllowed) return true;
      }
    } catch (err) {
      this.logger.error(`Whitelist check error: ${err.message}`);
      return true; // Fail-open to avoid service crash if checking fails, but log error
    }

    this.logger.warn(`Rejected unauthorized access from IP: ${clientIp}, Origin: ${origin}`);
    throw new ForbiddenException('403 Forbidden: Unauthorized Source IP/Origin');
  }

  private extractClientIp(req: Request): string {
    const forwarded = req.headers['x-forwarded-for'];
    if (typeof forwarded === 'string') {
      return forwarded.split(',')[0].trim();
    }
    const raw = req.socket.remoteAddress || '';
    // Normalize ::ffff:x.x.x.x → x.x.x.x
    return raw.startsWith('::ffff:') ? raw.slice(7) : raw;
  }

  private async checkIpAllowed(ip: string): Promise<boolean> {
    if (!ip) return false;
    const isMember = await this.redis.sIsMember('SET:whitelisted_ips', ip);
    if (isMember) return true;

    // Check DB
    const whitelist = await this.prisma.apiWhitelist.findFirst({
      where: {
        isActive: true,
        ipOrCidr: ip,
      },
    });

    if (whitelist) {
      await this.redis.sAdd('SET:whitelisted_ips', ip);
      return true;
    }

    return false;
  }

  private async checkOriginAllowed(origin: string): Promise<boolean> {
    const isMember = await this.redis.sIsMember('SET:whitelisted_origins', origin);
    if (isMember) return true;

    const whitelist = await this.prisma.apiWhitelist.findFirst({
      where: {
        isActive: true,
        domainOrOrigin: origin,
      },
    });

    if (whitelist) {
      await this.redis.sAdd('SET:whitelisted_origins', origin);
      return true;
    }

    return false;
  }
}

function ctxToRequest(ctx: ExecutionContext): Request {
  return ctx.switchToHttp().getRequest<Request>();
}
