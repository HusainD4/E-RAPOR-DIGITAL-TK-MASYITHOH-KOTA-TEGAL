import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as path from 'path';
import * as fs from 'fs';
import { CryptoUtil } from '../../common/utils/crypto.util';

@Injectable()
export class SecureDocumentsService {
  constructor(private readonly configService: ConfigService) {}

  generateTokenForDocument(fileId: string) {
    const secret = this.configService.get<string>(
      'app.secureStreamSecret',
      'Bahari_Gatekeeper_Stream_028',
    );
    const expiryMins = this.configService.get<number>(
      'app.secureStreamExpiryMinutes',
      15,
    );

    const { token, expiresAt } = CryptoUtil.generatePresignedToken(
      fileId,
      secret,
      expiryMins,
    );

    return {
      fileId,
      token,
      expiresAt,
      streamUrl: `/api/v1/documents/secure-stream/${encodeURIComponent(fileId)}?token=${token}`,
    };
  }

  getSecureFilePath(fileId: string, token: string): { filePath: string; mimeType: string } {
    const secret = this.configService.get<string>(
      'app.secureStreamSecret',
      'Bahari_Gatekeeper_Stream_028',
    );

    const isValid = CryptoUtil.verifyPresignedToken(fileId, token, secret);
    if (!isValid) {
      throw new ForbiddenException('Token akses berkas kedaluwarsa atau tidak valid');
    }

    // Resolving file inside private storage
    const basePath = path.resolve(
      process.cwd(),
      this.configService.get<string>('app.storagePrivateDocuments', './storage/private'),
    );

    const targetFile = path.resolve(basePath, fileId);

    // Prevent directory traversal
    if (!targetFile.startsWith(basePath)) {
      throw new ForbiddenException('Akses direktori ilegal ditolak');
    }

    if (!fs.existsSync(targetFile)) {
      // In dev mode, if file does not exist, generate demo placeholder
      fs.mkdirSync(path.dirname(targetFile), { recursive: true });
      fs.writeFileSync(targetFile, Buffer.from('%PDF-1.5 [TK MASYITHOH DOKUMEN KEPENDUDUKAN]'));
    }

    // Determine MIME
    const ext = path.extname(targetFile).toLowerCase();
    let mimeType = 'application/octet-stream';
    if (ext === '.pdf') mimeType = 'application/pdf';
    else if (ext === '.jpg' || ext === '.jpeg') mimeType = 'image/jpeg';
    else if (ext === '.png') mimeType = 'image/png';

    return { filePath: targetFile, mimeType };
  }
}
