import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class WaDistributionService {
  private readonly logger = new Logger(WaDistributionService.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {}

  async dispatchReportCard(params: {
    reportCardId: string;
    studentId: string;
    academicYear: string;
    semester: string;
    recipientPhone: string;
    pdfFilename: string;
    pdfUrl: string;
    studentName: string;
  }) {
    const waUrl = this.configService.get<string>(
      'microservices.wa.url',
      'http://127.0.0.1:3001',
    );
    const apiKey = this.configService.get<string>('microservices.wa.apiKey', '');

    // 1. Create delivery log record
    const deliveryLog = await this.prisma.waDeliveryLog.create({
      data: {
        reportCardId: params.reportCardId,
        studentId: params.studentId,
        academicYear: params.academicYear,
        semester: params.semester,
        recipientPhone: params.recipientPhone,
        pdfFilename: params.pdfFilename,
        deliveryStatus: 'QUEUED',
      },
    });

    // 2. Dispatch to WA Gateway
    try {
      const response = await axios.post(
        `${waUrl}/api/v1/messages/send-pdf`,
        {
          logId: deliveryLog.id,
          sessionId: 'session_tk_masyithoh_01',
          recipientPhone: params.recipientPhone,
          phone: params.recipientPhone,
          caption: `Bismillah, berikut kami lampirkan Dokumen E-Rapor Resmi Ananda ${params.studentName} untuk Tahun Ajaran ${params.academicYear} Semester ${params.semester}. Terima kasih atas kerja sama Ayah/Bunda. - TK Masyithoh Kota Tegal`,
          documentUrl: params.pdfUrl,
          pdfUrl: params.pdfUrl,
          fileName: params.pdfFilename,
          filename: params.pdfFilename,
          studentName: params.studentName,
          semester: params.semester,
          academicYear: params.academicYear,
        },
        {
          headers: {
            'X-API-KEY': apiKey,
            'Content-Type': 'application/json',
          },
          timeout: 10000,
        },
      );

      await this.prisma.waDeliveryLog.update({
        where: { id: deliveryLog.id },
        data: {
          deliveryStatus: 'SENT',
          sentAt: new Date(),
        },
      });

      return {
        success: true,
        logId: deliveryLog.id,
        status: 'SENT',
        gatewayResponse: response.data,
      };
    } catch (err) {
      this.logger.warn(`WA Dispatch warning: ${err.message}. Marking as queued for retry.`);
      await this.prisma.waDeliveryLog.update({
        where: { id: deliveryLog.id },
        data: {
          deliveryStatus: 'QUEUED',
          errorMessage: err.message,
        },
      });

      return {
        success: true,
        logId: deliveryLog.id,
        status: 'QUEUED_FOR_DISPATCH',
        note: 'Antrean pengiriman tersimpan, akan didistribusikan saat gateway aktif',
      };
    }
  }

  async getDeliveryLogs(reportCardId?: string) {
    const where: any = {};
    if (reportCardId) where.reportCardId = reportCardId;

    return this.prisma.waDeliveryLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: {
        student: { select: { fullName: true, parentPhoneNumber: true } },
      },
    });
  }
}
