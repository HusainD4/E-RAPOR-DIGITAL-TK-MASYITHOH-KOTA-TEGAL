import { Module } from '@nestjs/common';
import { PpdbService } from './ppdb.service';
import { PpdbController } from './ppdb.controller';

@Module({
  controllers: [PpdbController],
  providers: [PpdbService],
  exports: [PpdbService],
})
export class PpdbModule {}
