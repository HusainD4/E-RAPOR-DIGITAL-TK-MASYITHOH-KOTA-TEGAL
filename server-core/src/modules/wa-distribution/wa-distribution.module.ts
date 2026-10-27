import { Module } from '@nestjs/common';
import { WaDistributionService } from './wa-distribution.service';

@Module({
  providers: [WaDistributionService],
  exports: [WaDistributionService],
})
export class WaDistributionModule {}
