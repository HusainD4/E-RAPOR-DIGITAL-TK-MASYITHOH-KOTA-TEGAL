import makeWASocket, {
  DisconnectReason,
  useMultiFileAuthState,
  WASocket,
  BaileysEventMap,
} from '@whiskeysockets/baileys';
import { Boom } from '@hapi/boom';
import * as fs from 'fs';
import * as path from 'path';
import { config } from '../../config/app.config';

export type SessionStatus = 'CONNECTING' | 'SCAN_QR' | 'CONNECTED' | 'DISCONNECTED';

interface SessionEntry {
  socket: WASocket;
  status: SessionStatus;
  qr?: string;
  label: string;
  phoneNumber?: string;
}

class SessionManagerClass {
  private sessions: Map<string, SessionEntry> = new Map();

  private sessionDir(sessionId: string): string {
    return path.resolve(config.session.storagePath, sessionId);
  }

  async initSession(sessionId: string, label: string): Promise<void> {
    if (this.sessions.has(sessionId)) {
      console.log(`[SessionManager] Session ${sessionId} already exists.`);
      return;
    }

    const sessionPath = this.sessionDir(sessionId);
    fs.mkdirSync(sessionPath, { recursive: true });

    const { state, saveCreds } = await useMultiFileAuthState(sessionPath);

    const socket = makeWASocket({
      auth: state,
      syncFullHistory: false,
      markOnlineOnConnect: false,
      browser: ['TK Masyithoh E-Rapor', 'Chrome', '120.0.0'],
      defaultQueryTimeoutMs: config.baileys.connectTimeoutMs,
      connectTimeoutMs: config.baileys.connectTimeoutMs,
      keepAliveIntervalMs: 15000,
      retryRequestDelayMs: 2000,
    });

    this.sessions.set(sessionId, { socket, status: 'CONNECTING', label });

    socket.ev.on('creds.update', saveCreds);

    socket.ev.on('connection.update', (update: BaileysEventMap['connection.update']) => {
      const { connection, lastDisconnect, qr } = update;
      const entry = this.sessions.get(sessionId);
      if (!entry) return;

      if (qr) {
        entry.status = 'SCAN_QR';
        entry.qr = qr;
        console.log(`[SessionManager] QR ready for ${sessionId}`);
      }

      if (connection === 'open') {
        entry.status = 'CONNECTED';
        entry.qr = undefined;
        const jid = socket.user?.id ?? '';
        entry.phoneNumber = jid.split(':')[0].split('@')[0];
        console.log(`[SessionManager] ${sessionId} CONNECTED as ${entry.phoneNumber}`);
      }

      if (connection === 'close') {
        const code = (lastDisconnect?.error as Boom)?.output?.statusCode;
        const shouldReconnect = code !== DisconnectReason.loggedOut;
        console.log(`[SessionManager] ${sessionId} disconnected (code ${code}), reconnect: ${shouldReconnect}`);

        if (shouldReconnect) {
          this.sessions.delete(sessionId);
          // Hapus file session-*.json yang basi untuk mencegah MessageCounterError saat reconnect
          const sessionPath = this.sessionDir(sessionId);
          if (fs.existsSync(sessionPath)) {
            try {
              const staleFiles = fs.readdirSync(sessionPath).filter(f => f.startsWith('session-'));
              for (const f of staleFiles) {
                fs.unlinkSync(`${sessionPath}/${f}`);
              }
              if (staleFiles.length > 0) {
                console.log(`[SessionManager] Dibersihkan ${staleFiles.length} kunci sesi basi (stale session keys) untuk ${sessionId}.`);
              }
            } catch { /* ignore */ }
          }
          setTimeout(() => this.initSession(sessionId, label), 3000);
        } else {
          entry.status = 'DISCONNECTED';
          this.sessions.delete(sessionId);
          const sessionPath = this.sessionDir(sessionId);
          if (fs.existsSync(sessionPath)) {
            try {
              fs.rmSync(sessionPath, { recursive: true, force: true });
            } catch { /* ignore */ }
          }
          console.log(`[SessionManager] ${sessionId} logged out; cleaned credentials directory.`);
        }
      }
    });
  }

  getSession(sessionId: string): SessionEntry | undefined {
    if (this.sessions.has(sessionId)) {
      return this.sessions.get(sessionId);
    }
    // Fallback ke sesi aktif apapun yang berstatus CONNECTED
    for (const entry of this.sessions.values()) {
      if (entry.status === 'CONNECTED') {
        return entry;
      }
    }
    return undefined;
  }

  getSocket(sessionId: string): WASocket | undefined {
    return this.getSession(sessionId)?.socket;
  }

  listSessions(): Array<{ sessionId: string; label: string; status: SessionStatus; phoneNumber?: string }> {
    const result = [];
    for (const [sessionId, entry] of this.sessions.entries()) {
      result.push({ sessionId, label: entry.label, status: entry.status, phoneNumber: entry.phoneNumber });
    }
    return result;
  }

  async logoutSession(sessionId: string): Promise<void> {
    const entry = this.sessions.get(sessionId);
    if (!entry) return;

    try {
      await entry.socket.logout();
    } catch { /* ignore */ }

    this.sessions.delete(sessionId);

    const sessionPath = this.sessionDir(sessionId);
    if (fs.existsSync(sessionPath)) {
      fs.rmSync(sessionPath, { recursive: true, force: true });
    }
    console.log(`[SessionManager] Session ${sessionId} logged out and credentials removed.`);
  }

  async restorePersistedSessions(): Promise<void> {
    const base = path.resolve(config.session.storagePath);
    if (!fs.existsSync(base)) return;

    const dirs = fs.readdirSync(base, { withFileTypes: true })
      .filter(d => d.isDirectory())
      .map(d => d.name);

    console.log(`[SessionManager] Restoring ${dirs.length} persisted session(s)...`);
    for (const sessionId of dirs) {
      await this.initSession(sessionId, sessionId);
    }
  }
}

export const SessionManager = new SessionManagerClass();
