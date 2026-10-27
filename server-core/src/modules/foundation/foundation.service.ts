import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class FoundationService {
  constructor(private readonly prisma: PrismaService) {}

  async getOverview() {
    const [schoolsCount, studentsCount, teachersCount, headmastersCount] =
      await Promise.all([
        this.prisma.school.count(),
        this.prisma.student.count({ where: { isActive: true } }),
        this.prisma.user.count({ where: { role: 'TEACHER', isActive: true } }),
        this.prisma.user.count({ where: { role: 'HEADMASTER', isActive: true } }),
      ]);

    const schools = await this.prisma.school.findMany({
      select: {
        id: true,
        name: true,
        npsn: true,
        address: true,
        headmaster: { select: { username: true, phoneNumber: true } },
        _count: { select: { students: true, classes: true } },
      },
    });

    return {
      totalSchools: schoolsCount,
      totalStudents: studentsCount,
      totalTeachers: teachersCount,
      totalHeadmasters: headmastersCount,
      schoolsSummary: schools,
    };
  }

  async getPerformanceReport() {
    const reportStats = await this.prisma.reportCard.groupBy({
      by: ['status'],
      _count: true,
    });

    const schools = await this.prisma.school.findMany({
      select: {
        id: true,
        name: true,
        students: {
          select: {
            id: true,
            reportCards: {
              select: {
                status: true,
                semester: true,
                academicYear: true,
              },
            },
          },
        },
      },
    });

    return {
      globalReportStatus: reportStats,
      schoolPerformance: schools.map((s) => ({
        schoolId: s.id,
        schoolName: s.name,
        totalStudents: s.students.length,
        totalReports: s.students.flatMap((st) => st.reportCards).length,
      })),
    };
  }

  async broadcastAnnouncement(data: {
    title: string;
    content: string;
    authorId: string;
  }) {
    // Audit broadcast
    await this.prisma.auditLog.create({
      data: {
        userId: data.authorId,
        role: 'INSTITUTE',
        action: 'BROADCAST_ANNOUNCEMENT',
        resource: 'INSTITUTE_BROADCAST',
        metadata: { title: data.title, content: data.content },
      },
    });

    return {
      success: true,
      message: 'Pengumuman resmi yayasan berhasil diterbitkan ke seluruh unit sekolah',
      broadcast: {
        title: data.title,
        publishedAt: new Date().toISOString(),
      },
    };
  }
}
