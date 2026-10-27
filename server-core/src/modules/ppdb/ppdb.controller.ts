import {
  Controller,
  Post,
  Get,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { PpdbService } from './ppdb.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles, Public, CurrentUser } from '../../common/decorators';
import { Role } from '../../common/constants';

@Controller('api/v1/ppdb')
export class PpdbController {
  constructor(private readonly ppdbService: PpdbService) {}

  @Public()
  @Post('register')
  async register(
    @Body()
    body: {
      schoolId: string;
      academicYear: string;
      targetLevel: string;
      studentPayload: any;
      birthCertificateUrl: string;
      familyCardUrl: string;
      parentKtpUrl: string;
    },
  ) {
    return this.ppdbService.registerCandidate(body);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.HEADMASTER, Role.ADMINISTRATOR, Role.TEACHER)
  @Get('candidates')
  async getCandidates(
    @CurrentUser('schoolId') schoolId: string,
    @Query('schoolId') querySchoolId?: string,
    @Query('academicYear') academicYear?: string,
    @Query('targetLevel') targetLevel?: string,
    @Query('status') status?: any,
  ) {
    return this.ppdbService.getCandidates({
      schoolId: querySchoolId || schoolId,
      academicYear,
      targetLevel,
      status,
    });
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.HEADMASTER, Role.ADMINISTRATOR, Role.TEACHER)
  @Get('candidates/:id')
  async getCandidateDetail(@Param('id') id: string) {
    return this.ppdbService.getCandidateDetail(id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.HEADMASTER, Role.ADMINISTRATOR)
  @Patch('candidates/:id/status')
  async updateStatus(
    @Param('id') id: string,
    @CurrentUser('id') verifierId: string,
    @Body('status') status: 'VERIFIED' | 'ACCEPTED' | 'REJECTED',
    @Body('assignedClassId') assignedClassId?: string,
  ) {
    return this.ppdbService.updateStatus(id, verifierId, status, assignedClassId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.HEADMASTER, Role.ADMINISTRATOR)
  @Post('candidates/:id/enroll')
  async enrollCandidate(
    @Param('id') id: string,
    @Body('assignedClassId') assignedClassId: string,
  ) {
    return this.ppdbService.enrollCandidate(id, assignedClassId);
  }
}
