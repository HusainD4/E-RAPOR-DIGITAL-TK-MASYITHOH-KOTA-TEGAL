import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AssessmentsService } from './assessments.service';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators';
import { Role, AssessmentScore } from '../../../common/constants';

@Controller('api/v1')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AssessmentsController {
  constructor(private readonly assessmentsService: AssessmentsService) {}

  @Post('teacher/assessments')
  @Roles(Role.TEACHER, Role.HEADMASTER, Role.ADMINISTRATOR)
  async recordAssessment(
    @Body()
    body: {
      studentId: string;
      semester: string;
      academicYear: string;
      aspect: string;
      score: AssessmentScore;
      teacherNotes?: string;
    },
  ) {
    return this.assessmentsService.recordAssessment(body);
  }

  @Post('teacher/assessments/bulk')
  @Roles(Role.TEACHER, Role.HEADMASTER, Role.ADMINISTRATOR)
  async recordBulkAssessments(
    @Body()
    body: {
      studentId: string;
      semester: string;
      academicYear: string;
      assessments: Array<{
        aspect: string;
        score: AssessmentScore;
        teacherNotes?: string;
      }>;
    },
  ) {
    return this.assessmentsService.recordBulkAssessments(body);
  }

  @Get('student/assessments/:studentId')
  @Roles(Role.STUDENT, Role.TEACHER, Role.HEADMASTER, Role.ADMINISTRATOR)
  async getStudentAssessments(
    @Param('studentId') studentId: string,
    @Query('academicYear') academicYear?: string,
    @Query('semester') semester?: string,
  ) {
    return this.assessmentsService.getAssessmentsByStudent(studentId, academicYear, semester);
  }
}
