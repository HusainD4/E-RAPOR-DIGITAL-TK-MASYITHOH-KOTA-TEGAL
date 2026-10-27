import { Controller, Post, Get, Body, Param, UseGuards } from '@nestjs/common';
import { AnecdotesService } from './anecdotes.service';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles, CurrentUser } from '../../../common/decorators';
import { Role } from '../../../common/constants';

@Controller('api/v1')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AnecdotesController {
  constructor(private readonly anecdotesService: AnecdotesService) {}

  @Post('teacher/anecdotes')
  @Roles(Role.TEACHER, Role.HEADMASTER, Role.ADMINISTRATOR)
  async createAnecdote(
    @CurrentUser('id') teacherId: string,
    @Body()
    body: {
      studentId: string;
      date: string;
      eventContext: string;
      observedBehavior: string;
      analysisInterpretation?: string;
    },
  ) {
    return this.anecdotesService.createAnecdote({ ...body, teacherId });
  }

  @Get('teacher/anecdotes/:studentId')
  @Roles(Role.TEACHER, Role.HEADMASTER, Role.ADMINISTRATOR)
  async getStudentAnecdotes(@Param('studentId') studentId: string) {
    return this.anecdotesService.findByStudent(studentId);
  }
}
