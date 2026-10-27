import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';

@Injectable()
export class SecurityWhitelistService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  async findAll() {
    return this.prisma.apiWhitelist.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        creator: {
          select: { id: true, username: true, role: true },
        },
      },
    });
  }

  async create(data: {
    label: string;
    ipOrCidr?: string;
    domainOrOrigin?: string;
    port?: number;
    userId: string;
  }) {
    const created = await this.prisma.apiWhitelist.create({
      data: {
        label: data.label,
        ipOrCidr: data.ipOrCidr,
        domainOrOrigin: data.domainOrOrigin,
        port: data.port,
        createdBy: data.userId,
      },
    });

    await this.syncToRedis(created);
    return created;
  }

  async update(
    id: string,
    data: {
      label?: string;
      ipOrCidr?: string;
      domainOrOrigin?: string;
      port?: number;
      isActive?: boolean;
    },
  ) {
    const existing = await this.prisma.apiWhitelist.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Whitelist entry not found');

    const updated = await this.prisma.apiWhitelist.update({
      where: { id },
      data,
    });

    await this.syncToRedis(updated);
    return updated;
  }

  async remove(id: string) {
    const existing = await this.prisma.apiWhitelist.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Whitelist entry not found');

    if (existing.ipOrCidr) {
      // Remove from memory/Redis set if needed
    }

    return this.prisma.apiWhitelist.delete({ where: { id } });
  }

  private async syncToRedis(item: { ipOrCidr?: string; domainOrOrigin?: string; isActive: boolean }) {
    if (item.isActive) {
      if (item.ipOrCidr) await this.redis.sAdd('SET:whitelisted_ips', item.ipOrCidr);
      if (item.domainOrOrigin) await this.redis.sAdd('SET:whitelisted_origins', item.domainOrOrigin);
    }
  }
}
