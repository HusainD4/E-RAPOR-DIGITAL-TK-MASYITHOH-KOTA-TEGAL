import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuditTrailService {
  private readonly logger = new Logger(AuditTrailService.name);

  constructor(private readonly prisma: PrismaService) {}

  async log(params: {
    userId?: string;
    role: string;
    schoolId?: string;
    action: string;
    resource: string;
    ipAddress?: string;
    userAgent?: string;
    metadata?: any;
  }) {
    try {
      await this.prisma.auditLog.create({
        data: {
          userId: params.userId || null,
          role: params.role || 'GUEST',
          schoolId: params.schoolId || null,
          action: params.action,
          resource: params.resource,
          ipAddress: params.ipAddress || null,
          userAgent: params.userAgent || null,
          metadata: params.metadata || null,
        },
      });
    } catch (err) {
      this.logger.error(`Failed to record audit log: ${err.message}`);
    }
  }

  async getLogs(query: {
    role?: string;
    schoolId?: string;
    limit?: number;
    offset?: number;
  }) {
    const where: any = {};
    if (query.role) where.role = query.role;
    if (query.schoolId) where.schoolId = query.schoolId;

    return this.prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: query.limit || 50,
      skip: query.offset || 0,
      include: {
        user: {
          select: {
            id: true,
            username: true,
            role: true,
          },
        },
      },
    });
  }
}
