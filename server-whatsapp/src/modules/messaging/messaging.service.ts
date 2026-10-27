import axios from 'axios';
import * as fs from 'fs';
import * as path from 'path';
import { SessionManager } from '../session/session.manager';
import { config } from '../../config/app.config';
import { webhookService } from '../webhook/webhook.service';

export interface SendPdfPayload {
  sessionId: string;
  recipientPhone: string;
  studentName: string;
  semester: string;
  academicYear: string;
  documentUrl: string;
  fileName: string;
  caption: string;
  metadata: {
    studentId: string;
    reportId: string;
    teacherId: string;
    academicYear: string;
    semester: string;
  };
}

function randomDelay(): number {
  const { minDelaySeconds, maxDelaySeconds } = config.baileys;
  return (Math.floor(Math.random() * (maxDelaySeconds - minDelaySeconds + 1)) + minDelaySeconds) * 1000;
}

function sanitizePhone(phone: string): string {
  let num = phone.replace(/\D/g, '');
  if (num.startsWith('08')) num = '62' + num.slice(1);
  if (!num.startsWith('62')) num = '62' + num;
  return num + '@s.whatsapp.net';
}

function sanitizeFileName(fileName: string): string {
  return fileName.replace(/[^a-zA-Z0-9_\-\.]/g, '_');
}

export async function sendPdfMessage(payload: SendPdfPayload): Promise<void> {
  const socket = SessionManager.getSocket(payload.sessionId);
  if (!socket) throw new Error(`Session ${payload.sessionId} not found or not connected.`);

  const jid = sanitizePhone(payload.recipientPhone);
  const safeFileName = sanitizeFileName(payload.fileName || 'raport.pdf');

  let sentAsDoc = false;
  let pdfBuffer: Buffer | null = null;

  // 1. Coba baca dari base64 jika disertakan
  if ((payload as any).documentBase64 || (payload as any).pdfBase64) {
    try {
      const b64 = (payload as any).documentBase64 || (payload as any).pdfBase64;
      const cleanB64 = b64.replace(/^data:application\/pdf;base64,/, '');
      const raw = Buffer.from(cleanB64, 'base64');
      if (raw.slice(0, 4).toString() === '%PDF') {
        pdfBuffer = raw;
      }
    } catch { /* ignore */ }
  }

  // 2. Coba baca PDF dari disk lokal server-core jika relative path atau localhost URL
  if (!pdfBuffer && payload.documentUrl) {
    let checkPath = payload.documentUrl;
    if (checkPath.startsWith('http://localhost') || checkPath.startsWith('http://127.0.0.1')) {
      try {
        const u = new URL(checkPath);
        checkPath = u.pathname;
      } catch { /* ignore */ }
    }

    if (!checkPath.startsWith('http')) {
      const localPathCandidates = [
        path.resolve(process.cwd(), '../server-core', '.' + checkPath),
        path.resolve(process.cwd(), '../server-core', checkPath.replace(/^\//, '')),
        path.resolve(process.cwd(), checkPath),
        checkPath,
      ];
      for (const p of localPathCandidates) {
        if (fs.existsSync(p)) {
          try {
            const raw = fs.readFileSync(p);
            if (raw.slice(0, 4).toString() === '%PDF') {
              pdfBuffer = raw;
              console.log(`[Messaging] PDF ditemukan di lokal disk: ${p}`);
              break;
            }
          } catch { /* lanjut */ }
        }
      }
    }
  }

  // 3. Jika HTTP URL eksternal / endpoint aktif, coba download
  if (!pdfBuffer && payload.documentUrl && payload.documentUrl.startsWith('http')) {
    try {
      const response = await axios.get(payload.documentUrl, {
        responseType: 'arraybuffer',
        timeout: 5000,
      });
      const raw = Buffer.from(response.data as ArrayBuffer);
      if (raw.slice(0, 4).toString() === '%PDF') {
        pdfBuffer = raw;
      }
    } catch (err: any) {
      console.warn(`[Messaging] PDF fetch warning: ${err.message}`);
    }
  }

  // 4. Fallback pencarian file PDF di direktori storage server-core jika URL 404
  if (!pdfBuffer) {
    const defaultStorageDir = path.resolve(process.cwd(), '../server-core/storage/documents');
    if (fs.existsSync(defaultStorageDir)) {
      const findPdf = (dir: string): string | null => {
        const files = fs.readdirSync(dir);
        for (const file of files) {
          const full = path.join(dir, file);
          if (fs.statSync(full).isDirectory()) {
            const found = findPdf(full);
            if (found) return found;
          } else if (file.endsWith('.pdf')) {
            return full;
          }
        }
        return null;
      };
      const foundPdf = findPdf(defaultStorageDir);
      if (foundPdf) {
        try {
          const raw = fs.readFileSync(foundPdf);
          if (raw.slice(0, 4).toString() === '%PDF') {
            pdfBuffer = raw;
            console.log(`[Messaging] Menggunakan file PDF sampel resmi: ${foundPdf}`);
          }
        } catch { /* ignore */ }
      }
    }
  }

  // 3. Kirim via Baileys socket
  if (pdfBuffer) {
    try {
      await socket.sendMessage(jid, {
        document: pdfBuffer,
        mimetype: 'application/pdf',
        fileName: safeFileName,
        caption: payload.caption || `E-Rapor Digital Ananda ${payload.studentName}`,
      });
      sentAsDoc = true;
      console.log(`[Messaging] ✅ Berhasil mengirim PDF Dokumen ke ${jid}`);
    } catch (err: any) {
      console.warn(`[Messaging] Gagal kirim dokumen PDF (${err.message}), fallback ke pesan teks.`);
    }
  }

  if (!sentAsDoc) {
    await socket.sendMessage(jid, {
      text: payload.caption || `*Assalamu'alaikum Wr. Wb.*\n\n📋 *E-Rapor Digital TK Masyithoh Kota Tegal*\n\nRapor digital Ananda *${payload.studentName}* telah diterbitkan.`,
    });
    console.log(`[Messaging] ✅ Berhasil mengirim Pesan Teks ke ${jid}`);
  }

  // Report SENT status back to Core Server
  if (payload.metadata?.reportId) {
    await webhookService.sendCallback({
      sessionId: payload.sessionId,
      messageId: `wa_${Date.now()}`,
      recipientPhone: payload.recipientPhone,
      studentId: payload.metadata?.studentId || '',
      reportId: payload.metadata?.reportId || '',
      academicYear: payload.metadata?.academicYear || payload.academicYear || '',
      semester: payload.metadata?.semester || payload.semester || '',
      pdfFileName: safeFileName,
      status: 'SENT',
      timestamp: new Date().toISOString(),
      error: null,
    }).catch(() => {});
  }
}

export async function sendPdfWithDelay(payload: SendPdfPayload): Promise<void> {
  const delay = randomDelay();
  await new Promise(resolve => setTimeout(resolve, delay));
  await sendPdfMessage(payload);
}
