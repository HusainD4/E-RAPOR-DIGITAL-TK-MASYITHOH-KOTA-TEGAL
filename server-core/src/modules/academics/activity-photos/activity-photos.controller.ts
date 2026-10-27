import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import * as path from 'path';
import * as crypto from 'crypto';
import { ActivityPhotosService } from './activity-photos.service';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles, CurrentUser } from '../../../common/decorators';
import { Role } from '../../../common/constants';

const ALLOWED_MIME = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_SIZE = 5 * 1024 * 1024; // 5 MB

@Controller('api/v1/teacher/activity-photos')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.TEACHER, Role.HEADMASTER, Role.ADMINISTRATOR)
export class ActivityPhotosController {
  constructor(private readonly activityPhotosService: ActivityPhotosService) {}

  /**
   * POST /api/v1/teacher/activity-photos/upload
   * Upload foto kegiatan dari HP guru — disimpan ke staging pool
   */
  @Post('upload')
  @UseInterceptors(
    FileInterceptor('photo', {
      storage: diskStorage({
        destination: (req, _file, cb) => {
          const { classId, schoolId, activityDate } = req.body;
          const safeDate = (activityDate || new Date().toISOString().split('T')[0]).replace(/-/g, '_');
          const dir = `storage/staging/${schoolId}/${classId}/${safeDate}`;
          const fs = require('fs');
          fs.mkdirSync(dir, { recursive: true });
          cb(null, dir);
        },
        filename: (_req, file, cb) => {
          const ext = path.extname(file.originalname) || '.webp';
          const name = `${Date.now()}_${crypto.randomBytes(4).toString('hex')}${ext}`;
          cb(null, name);
        },
      }),
      limits: { fileSize: MAX_SIZE },
      fileFilter: (_req, file, cb) => {
        if (!ALLOWED_MIME.includes(file.mimetype)) {
          return cb(new BadRequestException('Format gambar tidak didukung. Gunakan JPEG, PNG, atau WebP.'), false);
        }
        cb(null, true);
      },
    }),
  )
  async uploadPhoto(
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser('id') userId: string,
    @Body('classId') classId: string,
    @Body('schoolId') schoolId: string,
    @Body('activityDate') activityDate: string,
    @Body('caption') caption?: string,
    @Body('taggedStudentIds') taggedStudentIdsRaw?: string,
  ) {
    const taggedStudentIds = taggedStudentIdsRaw
      ? JSON.parse(taggedStudentIdsRaw)
      : [];

    return this.activityPhotosService.createPhoto({
      classId,
      schoolId,
      uploadedByUserId: userId,
      activityDate: activityDate || new Date().toISOString().split('T')[0],
      caption,
      fileUrl: file.path,
      taggedStudentIds,
    });
  }

  /**
   * GET /api/v1/teacher/activity-photos
   * Ambil foto staging untuk kelas tertentu
   */
  @Get()
  async getPhotos(
    @Query('classId') classId: string,
    @Query('activityDate') activityDate?: string,
    @Query('taggedStudentId') taggedStudentId?: string,
  ) {
    return this.activityPhotosService.getStagingPhotos(classId, {
      activityDate,
      taggedStudentId,
    });
  }

  /**
   * POST /api/v1/teacher/activity-photos/:id/move-to-report
   * Pindahkan foto ke rapor siswa (auto-delete dari staging)
   */
  @Post(':id/move-to-report')
  async moveToReport(
    @Param('id') photoId: string,
    @Body('targetStudentId') targetStudentId: string,
    @Body('reportId') reportId: string,
  ) {
    return this.activityPhotosService.movePhotoToReport(photoId, targetStudentId, reportId);
  }

  /**
   * DELETE /api/v1/teacher/activity-photos/:id
   * Hapus foto dari staging (cleanup manual)
   */
  @Delete(':id')
  async deletePhoto(@Param('id') photoId: string) {
    return this.activityPhotosService.deletePhoto(photoId);
  }
}
