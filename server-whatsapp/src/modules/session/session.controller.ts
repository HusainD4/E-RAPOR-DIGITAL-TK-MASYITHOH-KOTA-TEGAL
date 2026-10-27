import { Router, Request, Response } from 'express';
import { SessionManager } from './session.manager';
import * as QRCode from 'qrcode';

const router = Router();

// POST /api/v1/sessions/init
router.post('/init', async (req: Request, res: Response) => {
  const { sessionId, label } = req.body as { sessionId?: string; label?: string };
  if (!sessionId || !label) {
    res.status(400).json({ success: false, message: 'sessionId and label are required.' });
    return;
  }

  await SessionManager.initSession(sessionId, label);
  res.json({ success: true, message: `Session ${sessionId} initialized.` });
});

// GET /api/v1/sessions
router.get('/', (_req: Request, res: Response) => {
  res.json({ success: true, data: SessionManager.listSessions() });
});

// GET /api/v1/sessions/:sessionId/status
router.get('/:sessionId/status', (req: Request, res: Response) => {
  const sessionId = req.params.sessionId as string;
  const entry = SessionManager.getSession(sessionId);
  if (!entry) {
    res.status(404).json({ success: false, message: 'Session not found.' });
    return;
  }
  res.json({ success: true, data: { sessionId, status: entry.status, phoneNumber: entry.phoneNumber } });
});

// GET /api/v1/sessions/:sessionId/qr
router.get('/:sessionId/qr', async (req: Request, res: Response) => {
  const sessionId = req.params.sessionId as string;
  const entry = SessionManager.getSession(sessionId);
  if (!entry) {
    res.status(404).json({ success: false, message: 'Session not found.' });
    return;
  }
  if (!entry.qr) {
    res.status(409).json({ success: false, message: 'QR not available. Session may already be connected.' });
    return;
  }

  const qrDataUrl = await QRCode.toDataURL(entry.qr);
  res.json({ success: true, data: { qr: entry.qr, qrDataUrl } });
});

// POST /api/v1/sessions/:sessionId/logout
router.post('/:sessionId/logout', async (req: Request, res: Response) => {
  const sessionId = req.params.sessionId as string;
  await SessionManager.logoutSession(sessionId);
  res.json({ success: true, message: `Session ${sessionId} logged out.` });
});

export const sessionRouter = router;
