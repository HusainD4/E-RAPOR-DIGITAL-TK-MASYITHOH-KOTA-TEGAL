import { Router, Request, Response } from 'express';
import { sendPdfWithDelay, SendPdfPayload } from './messaging.service';
import { queueService } from '../queue/queue.service';
import { SessionManager } from '../session/session.manager';

const router = Router();

// POST /api/v1/messages/send-pdf
router.post('/send-pdf', async (req: Request, res: Response) => {
  const body = req.body || {};
  const activeSession = SessionManager.listSessions().find(s => s.status === 'CONNECTED')?.sessionId || 'live_test_merli';
  const sessionId = body.sessionId || activeSession;
  const recipientPhone = body.recipientPhone || body.phone;
  const documentUrl = body.documentUrl || body.pdfUrl || '';
  const fileName = body.fileName || body.filename || 'raport.pdf';
  const caption = body.caption || '';
  const studentName = body.studentName || 'Siswa';
  const semester = body.semester || 'SEM_01';
  const academicYear = body.academicYear || '2025/2026';
  const metadata = body.metadata || {
    studentId: body.studentId || '',
    reportId: body.reportId || body.logId || '',
    teacherId: body.teacherId || '',
    academicYear,
    semester,
  };

  if (!recipientPhone) {
    res.status(400).json({ success: false, message: 'Missing required field: recipientPhone (or phone).' });
    return;
  }

  const payload: SendPdfPayload = {
    sessionId,
    recipientPhone,
    documentUrl,
    fileName,
    caption,
    studentName,
    semester,
    academicYear,
    metadata,
  };

  try {
    // Fire-and-forget with anti-ban delay
    sendPdfWithDelay(payload).catch(err => {
      console.error(`[Messaging] Failed to send PDF to ${payload.recipientPhone}:`, err.message);
    });
    res.json({ success: true, message: 'PDF queued for delivery.' });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    res.status(500).json({ success: false, message });
  }
});

// POST /api/v1/messages/send-bulk-pdf
router.post('/send-bulk-pdf', async (req: Request, res: Response) => {
  const { items } = req.body as { items: SendPdfPayload[] };

  if (!Array.isArray(items) || items.length === 0) {
    res.status(400).json({ success: false, message: 'items array is required and must not be empty.' });
    return;
  }

  const jobIds = await queueService.enqueueBulk(items);
  res.json({ success: true, message: `${items.length} jobs queued.`, jobIds });
});

export const messagingRouter = router;
