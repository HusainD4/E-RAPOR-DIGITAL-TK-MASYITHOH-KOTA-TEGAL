import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AssessmentScore, PAUD_ASPECTS } from '../../../common/constants';

@Injectable()
export class AssessmentsService {
  constructor(private readonly prisma: PrismaService) {}

  async recordAssessment(data: {
    studentId: string;
    semester: string;
    academicYear: string;
    aspect: string;
    score: AssessmentScore;
    teacherNotes?: string;
  }) {
    return this.prisma.assessment.create({
      data: {
        studentId: data.studentId,
        semester: data.semester,
        academicYear: data.academicYear,
        aspect: data.aspect,
        score: data.score as any,
        teacherNotes: data.teacherNotes,
      },
    });
  }

  async recordBulkAssessments(data: {
    studentId: string;
    semester: string;
    academicYear: string;
    assessments: Array<{
      aspect: string;
      score: AssessmentScore;
      teacherNotes?: string;
    }>;
  }) {
    const results = [];
    for (const item of data.assessments) {
      results.push(
        await this.prisma.assessment.create({
          data: {
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

  async getAssessmentsByStudent(studentId: string, academicYear?: string, semester?: string) {
    const where: any = { studentId };
    if (academicYear) where.academicYear = academicYear;
    if (semester) where.semester = semester;

    return this.prisma.assessment.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
  }
}
