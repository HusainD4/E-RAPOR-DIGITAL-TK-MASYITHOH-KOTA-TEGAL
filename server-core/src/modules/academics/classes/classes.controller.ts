import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  Query,
} from '@nestjs/common';
import { ClassesService } from './classes.service';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles, CurrentUser } from '../../../common/decorators';
import { Role } from '../../../common/constants';

@Controller('api/v1/headmaster')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.HEADMASTER, Role.ADMINISTRATOR)
export class ClassesController {
  constructor(private readonly classesService: ClassesService) {}

  @Get('dashboard-stats')
  async getDashboardStats(
    @CurrentUser('schoolId') schoolId: string,
    @Query('schoolId') querySchoolId?: string,
  ) {
    return this.classesService.getHeadmasterDashboardStats(querySchoolId || schoolId);
  }

  @Get('classes')
  async findClasses(
    @CurrentUser('schoolId') schoolId: string,
    @Query('schoolId') querySchoolId?: string,
  ) {
    return this.classesService.findClassesBySchool(querySchoolId || schoolId);
  }

  @Post('classes')
  async createClass(
    @CurrentUser('schoolId') schoolId: string,
    @Body()
    body: {
      name: string;
      level: string;
      capacity?: number;
      academicYear: string;
      semester: any;
      teacherId?: string;
      schoolId?: string;
    },
  ) {
    return this.classesService.createClass({
      ...body,
      schoolId: body.schoolId || schoolId,
    });
  }

  @Put('classes/:id')
  async updateClass(
    @Param('id') id: string,
    @Body()
    body: {
      name?: string;
      level?: string;
      capacity?: number;
      teacherId?: string;
    },
  ) {
    return this.classesService.updateClass(id, body);
  }

  @Delete('classes/:id')
  async deleteClass(@Param('id') id: string) {
    return this.classesService.deleteClass(id);
  }

  @Post('classes/:id/transfer-student')
  async transferStudent(
    @Param('id') classId: string,
    @Body('studentId') studentId: string,
  ) {
    return this.classesService.transferStudent(classId, studentId);
  }

  @Post('classes/promote')
  async promoteStudents(
    @Body()
    body: {
      fromClassId: string;
      toClassId: string;
      studentIds?: string[];
    },
  ) {
    return this.classesService.promoteStudentsMass(body);
  }

  @Get('teachers')
  async getTeachers(
    @CurrentUser('schoolId') schoolId: string,
    @Query('schoolId') querySchoolId?: string,
  ) {
    return this.classesService.getTeachersBySchool(querySchoolId || schoolId);
  }

  @Put('teachers/assign')
  async assignTeacher(
    @Body('classId') classId: string,
    @Body('teacherId') teacherId: string,
  ) {
    return this.classesService.assignTeacherToClass(classId, teacherId);
  }
}
