import { Module } from '@nestjs/common';
import { AswajaController } from './aswaja.controller';
import { AswajaService } from './aswaja.service';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [AswajaController],
  providers: [AswajaService],
  exports: [AswajaService],
})
export class AswajaModule {}
