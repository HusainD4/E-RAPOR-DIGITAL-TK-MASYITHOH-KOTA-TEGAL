import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';

export interface JwtPayload {
  sub: string;
  username: string;
  role: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: (req) => {
        // Primary: HttpOnly cookie
        if (req?.cookies?.access_token) return req.cookies.access_token;
        // Fallback: Authorization: Bearer <token>
        return ExtractJwt.fromAuthHeaderAsBearerToken()(req);
      },
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('app.jwtSecret', 'Masyithoh_Vault_LakaLaka_HMM99'),
    });
  }

  async validate(payload: JwtPayload) {
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      include: {
        schoolsHeadmaster: { select: { id: true, name: true } },
        classesTeacher: { select: { id: true, name: true, schoolId: true } },
        studentsParent: { select: { id: true, fullName: true, schoolId: true, classId: true } },
      },
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedException('Pengguna tidak aktif atau tidak ditemukan');
    }

    const schoolId =
      user.schoolsHeadmaster[0]?.id ||
      user.classesTeacher[0]?.schoolId ||
      user.studentsParent[0]?.schoolId ||
      null;

    return {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      schoolId,
      headmasterSchools: user.schoolsHeadmaster,
      teacherClasses: user.classesTeacher,
      parentStudents: user.studentsParent,
    };
  }
}
