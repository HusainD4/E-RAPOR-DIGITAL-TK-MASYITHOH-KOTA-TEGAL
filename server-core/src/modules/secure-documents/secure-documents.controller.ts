import {
  Controller,
  Post,
  Get,
  Param,
  Query,
  Body,
  Res,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';
import * as fs from 'fs';
import { SecureDocumentsService } from './secure-documents.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles, Public } from '../../common/decorators';
import { Role } from '../../common/constants';

@Controller('api/v1/documents')
export class SecureDocumentsController {
  constructor(private readonly service: SecureDocumentsService) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.HEADMASTER, Role.ADMINISTRATOR, Role.TEACHER)
  @Post('request-view-token')
  @HttpCode(HttpStatus.OK)
  async requestViewToken(@Body('fileId') fileId: string) {
    return this.service.generateTokenForDocument(fileId);
  }

  @Public()
  @Get('secure-stream/:fileId')
  async streamSecureDocument(
    @Param('fileId') fileId: string,
    @Query('token') token: string,
    @Res() res: Response,
  ) {
    const { filePath, mimeType } = this.service.getSecureFilePath(fileId, token);

    res.set({
      'Content-Type': mimeType,
      'Content-Security-Policy': "default-src 'none'",
      'X-Content-Type-Options': 'nosniff',
      'Cache-Control': 'private, no-cache, no-store, must-revalidate',
      'Content-Disposition': 'inline',
    });

    const stream = fs.createReadStream(filePath);
    stream.pipe(res);
  }
}
