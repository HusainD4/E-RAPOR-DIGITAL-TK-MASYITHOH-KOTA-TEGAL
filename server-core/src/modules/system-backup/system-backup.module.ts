import { Module } from '@nestjs/common';
import { SystemBackupService } from './system-backup.service';
import { SystemBackupController } from './system-backup.controller';

@Module({
  controllers: [SystemBackupController],
  providers: [SystemBackupService],
  exports: [SystemBackupService],
})
export class SystemBackupModule {}
