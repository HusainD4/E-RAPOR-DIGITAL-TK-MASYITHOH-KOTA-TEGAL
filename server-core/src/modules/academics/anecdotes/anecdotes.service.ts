import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AnecdotesService {
  constructor(private readonly prisma: PrismaService) {}

  async createAnecdote(data: {
    studentId: string;
    teacherId: string;
    date: string;
    eventContext: string;
    observedBehavior: string;
    analysisInterpretation?: string;
  }) {
    return this.prisma.anecdotalRecord.create({
      data: {
        studentId: data.studentId,
        teacherId: data.teacherId,
        date: new Date(data.date),
        eventContext: data.eventContext,
        observedBehavior: data.observedBehavior,
        analysisInterpretation: data.analysisInterpretation,
      },
    });
  }

  async findByStudent(studentId: string) {
    return this.prisma.anecdotalRecord.findMany({
      where: { studentId },
      orderBy: { date: 'desc' },
      include: {
        teacher: { select: { id: true, username: true } },
      },
    });
  }
}
