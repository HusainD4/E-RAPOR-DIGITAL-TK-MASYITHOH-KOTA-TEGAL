import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AttendanceService } from './attendance.service';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles, CurrentUser } from '../../../common/decorators';
import { Role, AttendanceStatus } from '../../../common/constants';

@Controller('api/v1')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AttendanceController {
  constructor(private readonly attendanceService: AttendanceService) {}

  @Post('teacher/attendance')
  @Roles(Role.TEACHER, Role.HEADMASTER, Role.ADMINISTRATOR)
  async recordAttendance(
    @Body()
    body: {
      studentId: string;
      classId: string;
      date: string;
      status: AttendanceStatus;
      notes?: string;
    },
  ) {
    return this.attendanceService.recordAttendance(body);
  }

  @Post('teacher/attendance/bulk')
  @Roles(Role.TEACHER, Role.HEADMASTER, Role.ADMINISTRATOR)
  async recordBulkAttendance(
    @Body('attendances')
    attendances: Array<{
      studentId: string;
      classId: string;
      date: string;
      status: AttendanceStatus;
      notes?: string;
    }>,
  ) {
    return this.attendanceService.recordBulkAttendance(attendances);
  }

  @Get('teacher/attendance/class/:classId')
  @Roles(Role.TEACHER, Role.HEADMASTER, Role.ADMINISTRATOR)
  async getClassAttendance(
    @Param('classId') classId: string,
    @Query('date') date: string,
  ) {
    return this.attendanceService.getClassAttendanceByDate(
      classId,
      date || new Date().toISOString().split('T')[0],
    );
  }

  @Get('student/attendance')
  @Roles(Role.STUDENT, Role.TEACHER, Role.HEADMASTER, Role.ADMINISTRATOR)
  async getStudentAttendance(
    @CurrentUser('id') userId: string,
    @Query('studentId') studentId?: string,
  ) {
    return this.attendanceService.getStudentAttendanceSummary(studentId || userId);
  }
}
