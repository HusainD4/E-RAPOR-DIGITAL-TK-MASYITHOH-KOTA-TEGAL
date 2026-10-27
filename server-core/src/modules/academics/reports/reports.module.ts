import { Module } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { ReportsController } from './reports.controller';
import { AiIntegrationModule } from '../../ai-integration/ai-integration.module';
import { WaDistributionModule } from '../../wa-distribution/wa-distribution.module';

@Module({
  imports: [AiIntegrationModule, WaDistributionModule],
  controllers: [ReportsController],
  providers: [ReportsService],
  exports: [ReportsService],
})
export class ReportsModule {}
