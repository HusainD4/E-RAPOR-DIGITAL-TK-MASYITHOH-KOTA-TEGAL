import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AssessmentScore } from '../../../common/constants';

export const ASWAJA_ASPECTS = [
  'Hafalan_Doa_Harian',
  'Hafalan_Surat_Pendek',
  'Sholawat_Nahdliyyah',
  'Praktik_Ibadah_NU',
] as const;

export type AswajaAspect = (typeof ASWAJA_ASPECTS)[number];

@Injectable()
export class AswajaService {
  constructor(private readonly prisma: PrismaService) {}

  async saveAswajaAssessments(data: {
    studentId: string;
    semester: string;
    academicYear: string;
    items: Array<{
      aspect: AswajaAspect;
      score: AssessmentScore;
      teacherNotes?: string;
    }>;
  }) {
    // Upsert per aspect (replace existing if already exists for same student/semester/year)
    const results = [];
    for (const item of data.items) {
      results.push(
        await this.prisma.aswajaAssessment.upsert({
          where: {
            studentId_semester_academicYear_aspect: {
              studentId: data.studentId,
              semester: data.semester,
              academicYear: data.academicYear,
              aspect: item.aspect,
            },
          },
          update: {
            score: item.score as any,
            teacherNotes: item.teacherNotes,
          },
          create: {
            studentId: data.studentId,
            semester: data.semester,
            academicYear: data.academicYear,
            aspect: item.aspect,
            score: item.score as any,
            teacherNotes: item.teacherNotes,
          },
        }),
      );
    }
    return results;
  }

  async getAswajaByStudent(studentId: string, academicYear?: string, semester?: string) {
    const where: any = { studentId };
    if (academicYear) where.academicYear = academicYear;
    if (semester) where.semester = semester;

    return this.prisma.aswajaAssessment.findMany({
      where,
      orderBy: { aspect: 'asc' },
    });
  }
}
