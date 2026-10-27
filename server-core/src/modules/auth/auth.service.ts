import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto, RefreshTokenDto, UpdateProfileDto } from './dto/auth.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async login(loginDto: LoginDto) {
    const { username, password } = loginDto;

    const user = await this.prisma.user.findFirst({
      where: {
        OR: [{ username }, { phoneNumber: username }, { email: username }],
      },
    });

    if (!user) {
      throw new UnauthorizedException('Kredensial login tidak valid');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Akun Anda dinonaktifkan. Silakan hubungi Administrator');
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Kredensial login tidak valid');
    }

    const tokens = await this.generateTokens(user.id, user.username, user.role);

    // Simpan refreshToken ke database untuk pelacakan sesi dan validasi pencabutan token
    await this.prisma.user.update({
      where: { id: user.id },
      data: { refreshToken: tokens.refreshToken },
    });

    return {
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        phoneNumber: user.phoneNumber,
        role: user.role,
      },
      ...tokens,
    };
  }

  async refreshToken(dto: RefreshTokenDto) {
    try {
      const refreshSecret = this.configService.get<string>(
        'app.jwtRefreshSecret',
        'masyithoh_tegal__Forge_Session_Core_V1',
      );
      const decoded = this.jwtService.verify(dto.refreshToken, { secret: refreshSecret });

      const user = await this.prisma.user.findUnique({
        where: { id: decoded.sub },
      });

      if (!user || !user.isActive || user.refreshToken !== dto.refreshToken) {
        throw new UnauthorizedException('Sesi tidak valid atau telah dicabut');
      }

      const tokens = await this.generateTokens(user.id, user.username, user.role);

      // Perbarui refresh token di database
      await this.prisma.user.update({
        where: { id: user.id },
        data: { refreshToken: tokens.refreshToken },
      });

      return tokens;
    } catch {
      throw new UnauthorizedException('Refresh token kedaluwarsa atau tidak valid');
    }
  }

  async logout(userId: string) {
    if (!userId) return;
    try {
      await this.prisma.user.update({
        where: { id: userId },
        data: { refreshToken: null },
      });
    } catch {
      // User may already be removed or session cleared
    }
  }

  verifyRefreshToken(token: string) {
    const refreshSecret = this.configService.get<string>(
      'app.jwtRefreshSecret',
      'masyithoh_tegal__Forge_Session_Core_V1',
    );
    return this.jwtService.verify(token, { secret: refreshSecret });
  }

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        email: true,
        phoneNumber: true,
        role: true,
        isActive: true,
        createdAt: true,
        schoolsHeadmaster: {
          select: { id: true, name: true, npsn: true, address: true },
        },
        classesTeacher: {
          select: { id: true, name: true, level: true, school: { select: { id: true, name: true } } },
        },
        studentsParent: {
          select: {
            id: true,
            fullName: true,
            nik: true,
            school: { select: { id: true, name: true } },
            class: { select: { id: true, name: true } },
          },
        },
      },
    });

    if (!user) throw new NotFoundException('Profil tidak ditemukan');
    return user;
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User tidak ditemukan');

    const updateData: any = {};
    if (dto.phoneNumber) updateData.phoneNumber = dto.phoneNumber;
    if (dto.email) updateData.email = dto.email;

    if (dto.newPassword) {
      if (!dto.currentPassword) {
        throw new BadRequestException('Password saat ini wajib diisi untuk mengganti password');
      }
      const isMatch = await bcrypt.compare(dto.currentPassword, user.passwordHash);
      if (!isMatch) {
        throw new BadRequestException('Password saat ini salah');
      }
      updateData.passwordHash = await bcrypt.hash(dto.newPassword, 10);
    }

    return this.prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        username: true,
        email: true,
        phoneNumber: true,
        role: true,
      },
    });
  }

  private async generateTokens(userId: string, username: string, role: string) {
    const jwtSecret = this.configService.get<string>(
      'app.jwtSecret',
      'Masyithoh_Vault_LakaLaka_HMM99',
    );
    const refreshSecret = this.configService.get<string>(
      'app.jwtRefreshSecret',
      'masyithoh_tegal__Forge_Session_Core_V1',
    );

    const payload = { sub: userId, username, role };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: jwtSecret,
        expiresIn: this.configService.get<string>('app.jwtExpiresIn', '1d'),
      }),
      this.jwtService.signAsync(payload, {
        secret: refreshSecret,
        expiresIn: this.configService.get<string>('app.jwtRefreshExpiresIn', '7d'),
      }),
    ]);

    return {
      accessToken,
      refreshToken,
      tokenType: 'Bearer',
      expiresIn: 86400,
    };
  }
}
