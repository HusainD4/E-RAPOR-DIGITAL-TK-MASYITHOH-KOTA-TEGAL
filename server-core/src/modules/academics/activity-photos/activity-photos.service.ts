import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import * as path from 'path';
import * as fs from 'fs/promises';

@Injectable()
export class ActivityPhotosService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Simpan metadata foto kegiatan ke staging pool rombel.
   * File fisik sudah di-upload oleh controller ke storage/staging/{schoolId}/{classId}/{date}/
   */
  async createPhoto(data: {
    classId: string;
    schoolId: string;
    uploadedByUserId: string;
    activityDate: string;
    caption?: string;
    fileUrl: string;
    taggedStudentIds?: string[];
  }) {
    return this.prisma.activityPhoto.create({
      data: {
        classId: data.classId,
        schoolId: data.schoolId,
        uploadedByUserId: data.uploadedByUserId,
        activityDate: new Date(data.activityDate),
        caption: data.caption,
        fileUrl: data.fileUrl,
        taggedStudentIds: data.taggedStudentIds ?? [],
        isUsedInRapor: false,
      },
    });
  }

  /**
   * Ambil foto staging per kelas, difilter opsional per tanggal/siswa
   */
  async getStagingPhotos(classId: string, filters?: {
    activityDate?: string;
    taggedStudentId?: string;
  }) {
    const where: any = { classId, isUsedInRapor: false };
    if (filters?.activityDate) where.activityDate = new Date(filters.activityDate);
    if (filters?.taggedStudentId) {
      where.taggedStudentIds = { array_contains: filters.taggedStudentId };
    }

    return this.prisma.activityPhoto.findMany({
      where,
      orderBy: { activityDate: 'desc' },
    });
  }

  /**
   * Pindahkan foto dari staging ke rapor siswa (auto-move file fisik).
   * Menandai foto sebagai isUsedInRapor = true dan mencatat studentId tujuan.
   */
  async movePhotoToReport(photoId: string, targetStudentId: string, reportId: string) {
    const photo = await this.prisma.activityPhoto.findUnique({ where: { id: photoId } });
    if (!photo) throw new NotFoundException(`Foto ID ${photoId} tidak ditemukan`);

    // Tentukan path tujuan
    const stagingPath = photo.fileUrl; // misal: storage/staging/.../photo.webp
    const fileName = path.basename(stagingPath);
    const targetDir = `storage/students/${targetStudentId}/reports/${reportId}`;
    const targetPath = `${targetDir}/${fileName}`;

    // Pindahkan file fisik (server-side move)
    try {
      await fs.mkdir(targetDir, { recursive: true });
      await fs.rename(stagingPath, targetPath);
    } catch {
      // File mungkin sudah dipindahkan atau path virtual — log saja
    }

    return this.prisma.activityPhoto.update({
      where: { id: photoId },
      data: {
        isUsedInRapor: true,
        usedInReportId: reportId,
        fileUrl: targetPath,
      },
    });
  }

  /**
   * Hapus foto dari staging (cleanup manual oleh guru)
   */
  async deletePhoto(photoId: string) {
    const photo = await this.prisma.activityPhoto.findUnique({ where: { id: photoId } });
    if (!photo) throw new NotFoundException(`Foto ID ${photoId} tidak ditemukan`);

    // Hapus file fisik jika ada
    try { await fs.unlink(photo.fileUrl); } catch { /* skip if already gone */ }

    return this.prisma.activityPhoto.delete({ where: { id: photoId } });
  }
}
