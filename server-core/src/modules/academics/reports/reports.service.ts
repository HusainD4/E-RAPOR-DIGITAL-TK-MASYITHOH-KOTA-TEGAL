import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import * as path from 'path';
import * as fs from 'fs';
import { PrismaService } from '../../prisma/prisma.service';
import { AiIntegrationService } from '../../ai-integration/ai-integration.service';
import { WaDistributionService } from '../../wa-distribution/wa-distribution.service';
import { CryptoUtil } from '../../../common/utils/crypto.util';
import { ReportStatus } from '../../../common/constants';

@Injectable()
export class ReportsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly aiService: AiIntegrationService,
    private readonly waService: WaDistributionService,
  ) {}

  async generateAiNarrative(studentId: string, academicYear: string, semester: string) {
    const student = await this.prisma.student.findUnique({
      where: { id: studentId },
      include: {
        class: true,
        assessments: {
          where: { academicYear, semester },
        },
        anecdotes: {
          take: 5,
          orderBy: { date: 'desc' },
        },
      },
    });

    if (!student) throw new NotFoundException('Siswa tidak ditemukan');

    const result = await this.aiService.generateNarrative({
      studentName: student.fullName,
      level: student.class?.level || 'TK-A',
      assessments: student.assessments.map((a) => ({
        aspect: a.aspect,
        score: a.score,
        notes: a.teacherNotes || '',
      })),
      anecdotes: student.anecdotes.map((an) => ({
        eventContext: an.eventContext,
        observedBehavior: an.observedBehavior,
      })),
    });

    return {
      studentId,
      studentName: student.fullName,
      suggestedNarrative: result.narrative,
      source: result.source,
    };
  }

  async saveDraftReport(data: {
    studentId: string;
    classId: string;
    semester: string;
    academicYear: string;
    aiGeneratedNarrative?: string;
    finalTeacherNarrative: string;
  }) {
    const existing = await this.prisma.reportCard.findFirst({
      where: {
        studentId: data.studentId,
        semester: data.semester,
        academicYear: data.academicYear,
      },
    });

    if (existing) {
      return this.prisma.reportCard.update({
        where: { id: existing.id },
        data: {
          classId: data.classId,
          aiGeneratedNarrative: data.aiGeneratedNarrative,
          finalTeacherNarrative: data.finalTeacherNarrative,
          status: ReportStatus.PENDING_VALIDATION,
        },
      });
    }

    return this.prisma.reportCard.create({
      data: {
        studentId: data.studentId,
        classId: data.classId,
        semester: data.semester,
        academicYear: data.academicYear,
        aiGeneratedNarrative: data.aiGeneratedNarrative,
        finalTeacherNarrative: data.finalTeacherNarrative,
        status: ReportStatus.PENDING_VALIDATION,
      },
    });
  }

  async getPendingValidation(schoolId?: string) {
    const where: any = { status: ReportStatus.PENDING_VALIDATION };
    if (schoolId) {
      where.class = { schoolId };
    }

    return this.prisma.reportCard.findMany({
      where,
      include: {
        student: {
          select: { id: true, fullName: true, nik: true, nis: true },
        },
        class: {
          select: { id: true, name: true, level: true, school: { select: { name: true } } },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async validateAndSign(reportId: string, headmasterId: string) {
    const report = await this.prisma.reportCard.findUnique({
      where: { id: reportId },
      include: {
        student: { include: { school: true, class: true } },
      },
    });

    if (!report) throw new NotFoundException('Dokumen rapor tidak ditemukan');

    const validatedAt = new Date();
    const signatureHash = CryptoUtil.generateDigitalSignature({
      studentId: report.studentId,
      academicYear: report.academicYear,
      semester: report.semester,
      validatorId: headmasterId,
      validatedAt: validatedAt.toISOString(),
    });

    // Format filename anti-collision: Raport_{namaSiswa}_semester_{XX}_{tahunMulai}_{tahunSelesai}.pdf
    const sanitizedName = report.student.fullName.replace(/\s+/g, '_');
    const academicYearClean = report.academicYear.replace(/[\/\\]/g, '_');
    const semesterClean = report.semester.padStart(2, '0');
    const filename = `Raport_${sanitizedName}_semester_${semesterClean}_${academicYearClean}.pdf`;

    // Folder hierarchy: storage/documents/{academicYear}/{semester}/{schoolCode}/{className}/
    const schoolCode = report.student.school?.npsn || 'TK_GENERAL';
    const classNameClean = (report.student.class?.name || 'Class').replace(/\s+/g, '_');
    const targetDir = path.resolve(
      process.cwd(),
      'storage',
      'documents',
      academicYearClean,
      `semester_${semesterClean}`,
      schoolCode,
      classNameClean,
    );

    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }

    const filePath = path.join(targetDir, filename);

    // Save placeholder or generated PDF structure if not exists
    if (!fs.existsSync(filePath)) {
      fs.writeFileSync(filePath, `%PDF-1.4 [TK MASYITHOH E-RAPOR] ${report.student.fullName}`);
    }

    return this.prisma.reportCard.update({
      where: { id: reportId },
      data: {
        status: ReportStatus.APPROVED,
        validatedBy: headmasterId,
        validatedAt,
        digitalSignatureHash: signatureHash,
        pdfFilename: filename,
        pdfFileUrl: `/storage/documents/${academicYearClean}/semester_${semesterClean}/${schoolCode}/${classNameClean}/${filename}`,
      },
      include: {
        student: true,
      },
    });
  }

  async dispatchToWhatsApp(reportId: string) {
    const report = await this.prisma.reportCard.findUnique({
      where: { id: reportId },
      include: {
        student: true,
      },
    });

    if (!report) throw new NotFoundException('Rapor tidak ditemukan');
    if (report.status !== ReportStatus.APPROVED && report.status !== ReportStatus.DISTRIBUTED) {
      throw new BadRequestException('Rapor harus disahkan/divalidasi Kepala Sekolah terlebih dahulu');
    }

    const res = await this.waService.dispatchReportCard({
      reportCardId: report.id,
      studentId: report.studentId,
      academicYear: report.academicYear,
      semester: report.semester,
      recipientPhone: report.student.parentPhoneNumber,
      pdfFilename: report.pdfFilename || `Raport_${report.student.fullName}.pdf`,
      pdfUrl: report.pdfFileUrl || '',
      studentName: report.student.fullName,
    });

    await this.prisma.reportCard.update({
      where: { id: reportId },
      data: { status: ReportStatus.DISTRIBUTED },
    });

    return res;
  }

  async getStudentReport(studentId: string, academicYear?: string, semester?: string) {
    const where: any = { studentId };
    if (academicYear) where.academicYear = academicYear;
    if (semester) where.semester = semester;

    const report = await this.prisma.reportCard.findFirst({
      where,
      include: {
        student: {
          select: {
            id: true,
            fullName: true,
            nik: true,
            nis: true,
            school: { select: { name: true, npsn: true, address: true } },
            class: { select: { name: true, level: true } },
          },
        },
        validator: { select: { username: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!report) throw new NotFoundException('Laporan E-Rapor belum diterbitkan');
    return report;
  }
}
