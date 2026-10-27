import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AttendanceStatus } from '../../../common/constants';

@Injectable()
export class AttendanceService {
  constructor(private readonly prisma: PrismaService) {}

  async recordAttendance(data: {
    studentId: string;
    classId: string;
    date: string;
    status: AttendanceStatus;
    notes?: string;
  }) {
    const recordDate = new Date(data.date);

    return this.prisma.dailyAttendance.upsert({
      where: {
        studentId_date: {
          studentId: data.studentId,
          date: recordDate,
        },
      },
      update: {
        status: data.status,
        notes: data.notes,
        classId: data.classId,
      },
      create: {
        studentId: data.studentId,
        classId: data.classId,
        date: recordDate,
        status: data.status,
        notes: data.notes,
      },
    });
  }

  async recordBulkAttendance(items: Array<{
    studentId: string;
    classId: string;
    date: string;
    status: AttendanceStatus;
    notes?: string;
  }>) {
    const results = [];
    for (const item of items) {
      results.push(await this.recordAttendance(item));
    }
    return { count: results.length, data: results };
  }

  async getStudentAttendanceSummary(studentId: string) {
    const records = await this.prisma.dailyAttendance.findMany({
      where: { studentId },
      orderBy: { date: 'desc' },
    });

    const summary = {
      HADIR: 0,
      SAKIT: 0,
      IZIN: 0,
      ALPA: 0,
      totalDays: records.length,
    };

    records.forEach((r) => {
      summary[r.status] = (summary[r.status] || 0) + 1;
    });

    return {
      summary,
      recentRecords: records.slice(0, 30),
    };
  }

  async getClassAttendanceByDate(classId: string, date: string) {
    const targetDate = new Date(date);
    return this.prisma.dailyAttendance.findMany({
      where: {
        classId,
        date: targetDate,
      },
      include: {
        student: { select: { id: true, fullName: true, nik: true } },
      },
    });
  }
}
