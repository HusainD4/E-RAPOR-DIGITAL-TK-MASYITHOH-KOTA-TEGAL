import {
  Controller,
  Post,
  Get,
  Put,
  Body,
  Req,
  Res,
  UseGuards,
  HttpCode,
  HttpStatus,
  UnauthorizedException,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { LoginDto, RefreshTokenDto, UpdateProfileDto } from './dto/auth.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { Public, CurrentUser } from '../../common/decorators';

const COOKIE_OPTS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/',
};

@Controller('api/v1/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() loginDto: LoginDto, @Res({ passthrough: true }) res: Response) {
    const result = await this.authService.login(loginDto);
    res.cookie('access_token', result.accessToken, {
      ...COOKIE_OPTS,
      maxAge: result.expiresIn * 1000,
    });
    res.cookie('refresh_token', result.refreshToken, {
      ...COOKIE_OPTS,
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    return {
      user: result.user,
      accessToken: result.accessToken,
    };
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(
    @Req() req: Request,
    @Body() refreshDto: RefreshTokenDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const rawToken = req?.cookies?.refresh_token || refreshDto?.refreshToken;
    if (!rawToken) {
      throw new UnauthorizedException('Refresh token tidak ditemukan');
    }

    const result = await this.authService.refreshToken({ refreshToken: rawToken });
    res.cookie('access_token', result.accessToken, {
      ...COOKIE_OPTS,
      maxAge: result.expiresIn * 1000,
    });
    res.cookie('refresh_token', result.refreshToken, {
      ...COOKIE_OPTS,
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    return {
      message: 'Token diperbarui',
      accessToken: result.accessToken,
    };
  }

  @Public()
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const refreshToken = req?.cookies?.refresh_token;
    if (refreshToken) {
      try {
        const decoded: any = this.authService.verifyRefreshToken(refreshToken);
        if (decoded?.sub) {
          await this.authService.logout(decoded.sub);
        }
      } catch {
        // Abaikan galat verifikasi token saat logout
      }
    }
    res.clearCookie('access_token', { ...COOKIE_OPTS });
    res.clearCookie('refresh_token', { ...COOKIE_OPTS });
    return { message: 'Berhasil logout' };
  }


  @UseGuards(JwtAuthGuard)
  @Get('profile')
  async getProfile(@CurrentUser('id') userId: string) {
    return this.authService.getProfile(userId);
  }

  @UseGuards(JwtAuthGuard)
  @Put('profile')
  async updateProfile(
    @CurrentUser('id') userId: string,
    @Body() updateDto: UpdateProfileDto,
  ) {
    return this.authService.updateProfile(userId, updateDto);
  }
}
