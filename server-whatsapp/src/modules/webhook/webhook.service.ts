import axios from 'axios';
import * as crypto from 'crypto';
import { config } from '../../config/app.config';

export interface WebhookPayload {
  sessionId: string;
  messageId: string;
  recipientPhone: string;
  studentId: string;
  reportId: string;
  academicYear: string;
  semester: string;
  pdfFileName: string;
  status: 'QUEUED' | 'PROCESSING' | 'SENT' | 'DELIVERED' | 'READ' | 'FAILED';
  timestamp: string;
  error: string | null;
}

class WebhookServiceClass {
  private signPayload(body: string): string {
    return 'sha256=' + crypto
      .createHmac('sha256', config.security.webhookHmacSecret)
      .update(body)
      .digest('hex');
  }

  async sendCallback(payload: WebhookPayload): Promise<void> {
    const body = JSON.stringify(payload);
    const signature = this.signPayload(body);

    try {
      await axios.post(config.security.coreServerWebhookUrl, payload, {
        headers: {
          'Content-Type': 'application/json',
          'X-Webhook-Signature': signature,
        },
        timeout: 10000,
      });
      console.log(`[Webhook] Callback sent: ${payload.status} for ${payload.pdfFileName}`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown';
      console.error(`[Webhook] Failed to send callback: ${msg}`);
    }
  }
}

export const webhookService = new WebhookServiceClass();
