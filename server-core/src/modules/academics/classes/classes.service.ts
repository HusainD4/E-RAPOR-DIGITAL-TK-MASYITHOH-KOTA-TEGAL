import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ClassesService {
  constructor(private readonly prisma: PrismaService) {}

  async findClassesBySchool(schoolId: string | null) {
    return this.prisma.class.findMany({
      where: schoolId ? { schoolId } : undefined,
      include: {
        teacher: { select: { id: true, username: true, phoneNumber: true } },
        _count: { select: { students: true } },
      },
      orderBy: { name: 'asc' },
    });
  }

  async createClass(data: {
    schoolId: string;
    name: string;
    level: string;
    capacity?: number;
    academicYear: string;
    semester: any;
    teacherId?: string;
  }) {
    return this.prisma.class.create({
      data,
    });
  }

  async updateClass(
    id: string,
    data: {
      name?: string;
      level?: string;
      capacity?: number;
      teacherId?: string;
    },
  ) {
    const existing = await this.prisma.class.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Rombel tidak ditemukan');

    return this.prisma.class.update({
      where: { id },
      data,
    });
  }

  async deleteClass(id: string) {
    const existing = await this.prisma.class.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Rombel tidak ditemukan');

    return this.prisma.class.delete({ where: { id } });
  }

  async transferStudent(classId: string, studentId: string) {
    const targetClass = await this.prisma.class.findUnique({
      where: { id: classId },
      include: { _count: { select: { students: true } } },
    });
    if (!targetClass) throw new NotFoundException('Kelas tujuan tidak ditemukan');

    if (targetClass._count.students >= targetClass.capacity) {
      throw new BadRequestException('Kapasitas kelas tujuan sudah penuh');
    }

    const student = await this.prisma.student.findUnique({ where: { id: studentId } });
    if (!student) throw new NotFoundException('Data siswa tidak ditemukan');

    return this.prisma.student.update({
      where: { id: studentId },
      data: { classId },
    });
  }

  async promoteStudentsMass(data: {
    fromClassId: string;
    toClassId: string;
    studentIds?: string[];
  }) {
    const toClass = await this.prisma.class.findUnique({ where: { id: data.toClassId } });
    if (!toClass) throw new NotFoundException('Kelas tujuan promosi tidak ditemukan');

    const where: any = { classId: data.fromClassId };
    if (data.studentIds && data.studentIds.length > 0) {
      where.id = { in: data.studentIds };
    }

    const result = await this.prisma.student.updateMany({
      where,
      data: { classId: data.toClassId },
    });

    return {
      success: true,
      promotedCount: result.count,
      targetClassName: toClass.name,
    };
  }

  async getHeadmasterDashboardStats(schoolId: string | null) {
    const schoolFilter = schoolId ? { schoolId } : {};
    const [totalStudents, totalClasses, teachers, reportsCount] = await Promise.all([
      this.prisma.student.count({ where: { ...schoolFilter, isActive: true } }),
      this.prisma.class.count({ where: schoolFilter }),
      this.prisma.user.findMany({
        where: {
          role: 'TEACHER',
          ...(schoolId ? { classesTeacher: { some: { schoolId } } } : {}),
        },
        select: { id: true, username: true, phoneNumber: true },
      }),
      this.prisma.reportCard.groupBy({
        by: ['status'],
        where: schoolId ? { class: { schoolId } } : {},
        _count: true,
      }),
    ]);

    return {
      totalStudents,
      totalClasses,
      totalTeachers: teachers.length,
      reportProgress: reportsCount,
    };
  }

  async getTeachersBySchool(schoolId: string | null) {
    return this.prisma.user.findMany({
      where: {
        role: 'TEACHER',
        ...(schoolId ? { classesTeacher: { some: { schoolId } } } : {}),
      },
      select: {
        id: true,
        username: true,
        phoneNumber: true,
        email: true,
        classesTeacher: { select: { id: true, name: true, level: true } },
      },
    });
  }

  async assignTeacherToClass(classId: string, teacherId: string) {
    return this.prisma.class.update({
      where: { id: classId },
      data: { teacherId },
    });
  }
}
