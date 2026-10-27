import * as crypto from 'crypto';

export class CryptoUtil {
  /**
   * Hashes report card payload to create a digital signature verification token
   */
  static generateDigitalSignature(payload: {
    studentId: string;
    academicYear: string;
    semester: string;
    validatorId: string;
    validatedAt: string;
  }): string {
    const data = JSON.stringify(payload);
    return crypto.createHash('sha256').update(data).digest('hex');
  }

  /**
   * Generates HMAC-SHA256 presigned token for secure document streaming (15 mins)
   */
  static generatePresignedToken(
    fileId: string,
    secret: string,
    expiresInMinutes = 15,
  ): { token: string; expiresAt: number } {
    const expiresAt = Math.floor(Date.now() / 1000) + expiresInMinutes * 60;
    const payload = `${fileId}:${expiresAt}`;
    const signature = crypto
      .createHmac('sha256', secret)
      .update(payload)
      .digest('hex');
    const token = Buffer.from(`${payload}:${signature}`).toString('base64url');
    return { token, expiresAt };
  }

  /**
   * Verifies the HMAC-SHA256 presigned token
   */
  static verifyPresignedToken(
    fileId: string,
    token: string,
    secret: string,
  ): boolean {
    try {
      const decoded = Buffer.from(token, 'base64url').toString('utf-8');
      const parts = decoded.split(':');
      if (parts.length !== 3) return false;

      const [tokenFileId, tokenExpiresAt, tokenSignature] = parts;
      if (tokenFileId !== fileId) return false;

      const expiresAt = parseInt(tokenExpiresAt, 10);
      if (Date.now() / 1000 > expiresAt) return false;

      const expectedSignature = crypto
        .createHmac('sha256', secret)
        .update(`${tokenFileId}:${tokenExpiresAt}`)
        .digest('hex');

      return crypto.timingSafeEqual(
        Buffer.from(tokenSignature),
        Buffer.from(expectedSignature),
      );
    } catch {
      return false;
    }
  }
}
