import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ReportsService } from './reports.service';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles, CurrentUser } from '../../../common/decorators';
import { Role } from '../../../common/constants';

@Controller('api/v1')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Post('teacher/reports/generate-ai-narrative')
  @Roles(Role.TEACHER, Role.HEADMASTER, Role.ADMINISTRATOR)
  async generateAiNarrative(
    @Body()
    body: {
      studentId: string;
      academicYear: string;
      semester: string;
    },
  ) {
    return this.reportsService.generateAiNarrative(
      body.studentId,
      body.academicYear,
      body.semester,
    );
  }

  @Post('teacher/reports/draft')
  @Roles(Role.TEACHER, Role.HEADMASTER, Role.ADMINISTRATOR)
  async saveDraft(
    @Body()
    body: {
      studentId: string;
      classId: string;
      semester: string;
      academicYear: string;
      aiGeneratedNarrative?: string;
      finalTeacherNarrative: string;
    },
  ) {
    return this.reportsService.saveDraftReport(body);
  }

  @Get('headmaster/reports/pending')
  @Roles(Role.HEADMASTER, Role.ADMINISTRATOR)
  async getPendingReports(
    @CurrentUser('schoolId') schoolId: string,
    @Query('schoolId') querySchoolId?: string,
  ) {
    return this.reportsService.getPendingValidation(querySchoolId || schoolId);
  }

  @Post('headmaster/reports/:id/validate')
  @Roles(Role.HEADMASTER, Role.ADMINISTRATOR)
  async validateReport(
    @Param('id') id: string,
    @CurrentUser('id') headmasterId: string,
  ) {
    return this.reportsService.validateAndSign(id, headmasterId);
  }

  @Post('teacher/reports/dispatch-wa')
  @Roles(Role.TEACHER, Role.HEADMASTER, Role.ADMINISTRATOR)
  async dispatchWa(@Body('reportId') reportId: string) {
    return this.reportsService.dispatchToWhatsApp(reportId);
  }

  @Get('student/report-card')
  @Roles(Role.STUDENT, Role.TEACHER, Role.HEADMASTER, Role.ADMINISTRATOR)
  async getStudentReport(
    @CurrentUser('id') userId: string,
    @Query('studentId') studentId?: string,
    @Query('academicYear') academicYear?: string,
    @Query('semester') semester?: string,
  ) {
    return this.reportsService.getStudentReport(
      studentId || userId,
      academicYear,
      semester,
    );
  }
}
