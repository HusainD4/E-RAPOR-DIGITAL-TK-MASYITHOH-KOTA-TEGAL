import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { Role } from '../../common/constants';

@Injectable()
export class PpdbService {
  constructor(private readonly prisma: PrismaService) {}

  async registerCandidate(data: {
    schoolId: string;
    academicYear: string;
    targetLevel: string;
    studentPayload: any;
    birthCertificateUrl: string;
    familyCardUrl: string;
    parentKtpUrl: string;
  }) {
    // Generate Registration Number: PPDB-YEAR-RANDOM
    const prefix = `PPDB-${data.academicYear.replace(/[\/\\]/g, '')}`;
    const count = await this.prisma.ppdbRegistration.count();
    const regNumber = `${prefix}-${(count + 1).toString().padStart(4, '0')}`;

    return this.prisma.ppdbRegistration.create({
      data: {
        schoolId: data.schoolId,
        registrationNumber: regNumber,
        academicYear: data.academicYear,
        targetLevel: data.targetLevel,
        studentPayload: data.studentPayload,
        birthCertificateUrl: data.birthCertificateUrl,
        familyCardUrl: data.familyCardUrl,
        parentKtpUrl: data.parentKtpUrl,
        status: 'PENDING',
      },
    });
  }

  async getCandidates(query: {
    schoolId?: string;
    academicYear?: string;
    targetLevel?: string;
    status?: any;
    limit?: number;
    offset?: number;
  }) {
    const where: any = {};
    if (query.schoolId) where.schoolId = query.schoolId;
    if (query.academicYear) where.academicYear = query.academicYear;
    if (query.targetLevel) where.targetLevel = query.targetLevel;
    if (query.status) where.status = query.status;

    const [total, candidates] = await Promise.all([
      this.prisma.ppdbRegistration.count({ where }),
      this.prisma.ppdbRegistration.findMany({
        where,
        include: {
          school: { select: { id: true, name: true, npsn: true } },
          assignedClass: { select: { id: true, name: true } },
          verifier: { select: { id: true, username: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: query.limit || 50,
        skip: query.offset || 0,
      }),
    ]);

    return { total, candidates };
  }

  async getCandidateDetail(id: string) {
    const candidate = await this.prisma.ppdbRegistration.findUnique({
      where: { id },
      include: {
        school: true,
        assignedClass: true,
        verifier: { select: { id: true, username: true } },
      },
    });

    if (!candidate) throw new NotFoundException('Data pendaftar PPDB tidak ditemukan');
    return candidate;
  }

  async updateStatus(
    id: string,
    verifierId: string,
    status: 'VERIFIED' | 'ACCEPTED' | 'REJECTED',
    assignedClassId?: string,
  ) {
    const candidate = await this.prisma.ppdbRegistration.findUnique({ where: { id } });
    if (!candidate) throw new NotFoundException('Data pendaftar tidak ditemukan');

    return this.prisma.ppdbRegistration.update({
      where: { id },
      data: {
        status,
        verifierId,
        verifiedAt: new Date(),
        assignedClassId: assignedClassId || candidate.assignedClassId,
      },
    });
  }

  async enrollCandidate(id: string, assignedClassId: string) {
    const candidate = await this.prisma.ppdbRegistration.findUnique({ where: { id } });
    if (!candidate) throw new NotFoundException('Pendaftar tidak ditemukan');

    const payload = candidate.studentPayload as any;
    const parentPhone = payload.parentPhoneNumber || payload.fatherPhone || '081234567890';
    const nik = payload.nik || `NIK-${Date.now()}`;

    // 1. Create parent user login account if not exists
    const defaultPassword = 'Masyithoh2026!';
    const passwordHash = await bcrypt.hash(defaultPassword, 10);
    const username = `ortu_${payload.nickname || payload.fullName?.slice(0, 6) || 'siswa'}_${Date.now().toString().slice(-4)}`.toLowerCase().replace(/\s+/g, '');

    const parentUser = await this.prisma.user.create({
      data: {
        username,
        phoneNumber: parentPhone,
        passwordHash,
        role: Role.STUDENT, // Role STUDENT serves Student & Parent in RBAC
      },
    });

    // 2. Insert into students table
    const student = await this.prisma.student.create({
      data: {
        schoolId: candidate.schoolId,
        classId: assignedClassId,
        userId: parentUser.id,
        nik,
        fullName: payload.fullName || 'Nama Siswa',
        nickname: payload.nickname || null,
        gender: payload.gender === 'P' ? 'P' : 'L',
        birthPlace: payload.birthPlace || 'Tegal',
        birthDate: payload.birthDate ? new Date(payload.birthDate) : new Date('2020-01-01'),
        religion: payload.religion || 'Islam',
        childOrder: payload.childOrder ? parseInt(payload.childOrder, 10) : 1,
        address: payload.address || 'Kota Tegal',
        fatherName: payload.fatherName || 'Ayah',
        fatherNik: payload.fatherNik || '3328000000000001',
        motherName: payload.motherName || 'Ibu',
        motherNik: payload.motherNik || '3328000000000002',
        parentPhoneNumber: parentPhone,
        heightCm: payload.heightCm ? parseFloat(payload.heightCm) : null,
        weightKg: payload.weightKg ? parseFloat(payload.weightKg) : null,
      },
    });

    // 3. Mark candidate as ACCEPTED and link studentId
    await this.prisma.ppdbRegistration.update({
      where: { id },
      data: {
        status: 'ACCEPTED',
        studentId: student.id,
        assignedClassId,
      },
    });

    return {
      success: true,
      message: 'Siswa berhasil diterima dan terdaftar aktif di rombel',
      student,
      parentAccount: {
        username: parentUser.username,
        defaultPassword,
        phone: parentPhone,
      },
    };
  }
}
