import { Injectable, Res } from '@nestjs/common';
import { Response } from 'express';
import { PrismaService } from '../prisma/prisma.service';
import { AuditTrailService } from '../audit-trail/audit-trail.service';

@Injectable()
export class SystemBackupService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditTrail: AuditTrailService,
  ) {}

  async generateSystemSnapshot() {
    const [schools, classes, users, students, reports] = await Promise.all([
      this.prisma.school.findMany(),
      this.prisma.class.findMany(),
      this.prisma.user.findMany({ select: { id: true, username: true, role: true, email: true, phoneNumber: true } }),
      this.prisma.student.findMany(),
      this.prisma.reportCard.findMany(),
    ]);

    return {
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      database: 'db_erapor_masyithoh',
      entityCounts: {
        schools: schools.length,
        classes: classes.length,
        users: users.length,
        students: students.length,
        reports: reports.length,
      },
      data: {
        schools,
        classes,
        users,
        students,
        reports,
      },
    };
  }

  async getAuditLogs(query: { role?: string; schoolId?: string; limit?: number; offset?: number }) {
    return this.auditTrail.getLogs(query);
  }
}
