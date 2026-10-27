import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AswajaService, AswajaAspect } from './aswaja.service';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators';
import { Role, AssessmentScore } from '../../../common/constants';

@Controller('api/v1/teacher/aswaja')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.TEACHER, Role.HEADMASTER, Role.ADMINISTRATOR)
export class AswajaController {
  constructor(private readonly aswajaService: AswajaService) {}

  /**
   * POST /api/v1/teacher/aswaja
   * Simpan penilaian Aswaja (Ke-NU-an) untuk satu siswa — semua aspek sekaligus
   */
  @Post()
  async saveAswaja(
    @Body()
    body: {
      studentId: string;
      semester: string;
      academicYear: string;
      items: Array<{
        aspect: AswajaAspect;
        score: AssessmentScore;
        teacherNotes?: string;
      }>;
    },
  ) {
    return this.aswajaService.saveAswajaAssessments(body);
  }

  /**
   * GET /api/v1/teacher/aswaja/:studentId
   * Ambil data Aswaja siswa (filter semester & tahun ajaran)
   */
  @Get(':studentId')
  @Roles(Role.TEACHER, Role.HEADMASTER, Role.ADMINISTRATOR, Role.STUDENT)
  async getAswaja(
    @Param('studentId') studentId: string,
    @Query('academicYear') academicYear?: string,
    @Query('semester') semester?: string,
  ) {
    return this.aswajaService.getAswajaByStudent(studentId, academicYear, semester);
  }
}
