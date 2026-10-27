import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { ActivityPhotosController } from './activity-photos.controller';
import { ActivityPhotosService } from './activity-photos.service';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule, MulterModule.register()],
  controllers: [ActivityPhotosController],
  providers: [ActivityPhotosService],
  exports: [ActivityPhotosService],
})
export class ActivityPhotosModule {}
