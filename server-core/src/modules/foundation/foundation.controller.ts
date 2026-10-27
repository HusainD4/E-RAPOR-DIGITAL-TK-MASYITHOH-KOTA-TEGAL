import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { FoundationService } from './foundation.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles, CurrentUser } from '../../common/decorators';
import { Role } from '../../common/constants';

@Controller('api/v1/institute')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.INSTITUTE, Role.ADMINISTRATOR)
export class FoundationController {
  constructor(private readonly foundationService: FoundationService) {}

  @Get('overview')
  async getOverview() {
    return this.foundationService.getOverview();
  }

  @Get('reports/performance')
  async getPerformanceReport() {
    return this.foundationService.getPerformanceReport();
  }

  @Post('broadcasts')
  async broadcast(
    @CurrentUser('id') authorId: string,
    @Body() body: { title: string; content: string },
  ) {
    return this.foundationService.broadcastAnnouncement({ ...body, authorId });
  }
}
