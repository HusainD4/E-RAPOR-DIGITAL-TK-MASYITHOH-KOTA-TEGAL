import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SchoolsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.school.findMany({
      include: {
        headmaster: {
          select: { id: true, username: true, phoneNumber: true, email: true },
        },
        _count: {
          select: { classes: true, students: true },
        },
      },
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: string) {
    const school = await this.prisma.school.findUnique({
      where: { id },
      include: {
        headmaster: { select: { id: true, username: true, phoneNumber: true, email: true } },
        classes: { select: { id: true, name: true, level: true, capacity: true } },
        _count: { select: { students: true, classes: true } },
      },
    });
    if (!school) throw new NotFoundException('Sekolah tidak ditemukan');
    return school;
  }

  async create(data: {
    foundationId: string;
    npsn?: string;
    name: string;
    address: string;
    phoneNumber?: string;
    headmasterId?: string;
    logoUrl?: string;
  }) {
    return this.prisma.school.create({
      data,
    });
  }

  async update(
    id: string,
    data: {
      npsn?: string;
      name?: string;
      address?: string;
      phoneNumber?: string;
      headmasterId?: string;
      logoUrl?: string;
    },
  ) {
    const existing = await this.prisma.school.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Sekolah tidak ditemukan');

    return this.prisma.school.update({
      where: { id },
      data,
    });
  }

  async delete(id: string) {
    const existing = await this.prisma.school.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Sekolah tidak ditemukan');

    return this.prisma.school.delete({ where: { id } });
  }
}
