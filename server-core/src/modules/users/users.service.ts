import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { Role } from '../../common/constants';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: { role?: Role; search?: string; limit?: number; offset?: number }) {
    const where: any = {};
    if (query.role) where.role = query.role;
    if (query.search) {
      where.OR = [
        { username: { contains: query.search } },
        { phoneNumber: { contains: query.search } },
        { email: { contains: query.search } },
      ];
    }

    const [total, users] = await Promise.all([
      this.prisma.user.count({ where }),
      this.prisma.user.findMany({
        where,
        select: {
          id: true,
          username: true,
          email: true,
          phoneNumber: true,
          role: true,
          isActive: true,
          createdAt: true,
          schoolsHeadmaster: { select: { id: true, name: true } },
          classesTeacher: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: query.limit || 50,
        skip: query.offset || 0,
      }),
    ]);

    return { total, users };
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        username: true,
        email: true,
        phoneNumber: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    });
    if (!user) throw new NotFoundException('User tidak ditemukan');
    return user;
  }

  async create(data: {
    username: string;
    email?: string;
    phoneNumber: string;
    password: string;
    role: Role;
    schoolId?: string;
  }) {
    const existing = await this.prisma.user.findFirst({
      where: {
        OR: [
          { username: data.username },
          { phoneNumber: data.phoneNumber },
          ...(data.email ? [{ email: data.email }] : []),
        ],
      },
    });

    if (existing) {
      throw new BadRequestException('Username, nomor HP, atau email sudah terdaftar');
    }

    const passwordHash = await bcrypt.hash(data.password, 10);

    const user = await this.prisma.user.create({
      data: {
        username: data.username,
        email: data.email || null,
        phoneNumber: data.phoneNumber,
        passwordHash,
        role: data.role,
      },
      select: {
        id: true,
        username: true,
        email: true,
        phoneNumber: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    });

    if (data.schoolId && data.role === Role.HEADMASTER) {
      await this.prisma.school
        .update({
          where: { id: data.schoolId },
          data: { headmasterId: user.id },
        })
        .catch(() => null);
    }

    return user;
  }

  async update(
    id: string,
    data: {
      email?: string;
      phoneNumber?: string;
      password?: string;
      role?: Role;
      isActive?: boolean;
      schoolId?: string;
    },
  ) {
    const existing = await this.prisma.user.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('User tidak ditemukan');

    const updateData: any = {};
    if (data.email !== undefined) updateData.email = data.email || null;
    if (data.phoneNumber !== undefined) updateData.phoneNumber = data.phoneNumber;
    if (data.role !== undefined) updateData.role = data.role;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;

    if (data.password) {
      updateData.passwordHash = await bcrypt.hash(data.password, 10);
    }

    const updatedUser = await this.prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        username: true,
        email: true,
        phoneNumber: true,
        role: true,
        isActive: true,
        schoolsHeadmaster: { select: { id: true, name: true } },
      },
    });

    if (data.schoolId && (existing.role === Role.HEADMASTER || data.role === Role.HEADMASTER)) {
      await this.prisma.school
        .update({
          where: { id: data.schoolId },
          data: { headmasterId: id },
        })
        .catch(() => null);
    }

    return updatedUser;
  }

  async delete(id: string) {
    const existing = await this.prisma.user.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('User tidak ditemukan');

    return this.prisma.user.delete({ where: { id } });
  }

  async getActiveSessions() {
    // Return sample active sessions metrics for admin monitoring
    const users = await this.prisma.user.findMany({
      where: { isActive: true },
      take: 20,
      orderBy: { updatedAt: 'desc' },
      select: {
        id: true,
        username: true,
        role: true,
        updatedAt: true,
      },
    });

    return {
      activeCount: users.length,
      sessions: users.map((u) => ({
        userId: u.id,
        username: u.username,
        role: u.role,
        lastActive: u.updatedAt,
        status: 'ONLINE',
      })),
    };
  }
}
