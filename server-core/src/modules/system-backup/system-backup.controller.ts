import {
  Controller,
  Get,
  Query,
  UseGuards,
  Header,
} from '@nestjs/common';
import { SystemBackupService } from './system-backup.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators';
import { Role } from '../../common/constants';

@Controller('api/v1/admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMINISTRATOR)
export class SystemBackupController {
  constructor(private readonly backupService: SystemBackupService) {}

  @Get('system/backup')
  @Header('Content-Disposition', 'attachment; filename="system_backup_masyithoh.json"')
  async downloadBackup() {
    return this.backupService.generateSystemSnapshot();
  }

  @Get('audit-logs')
  async getAuditLogs(
    @Query('role') role?: string,
    @Query('schoolId') schoolId?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    return this.backupService.getAuditLogs({
      role,
      schoolId,
      limit: limit ? parseInt(limit, 10) : undefined,
      offset: offset ? parseInt(offset, 10) : undefined,
    });
  }
}
