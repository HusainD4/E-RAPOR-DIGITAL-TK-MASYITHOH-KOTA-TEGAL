import axios, { AxiosError, AxiosResponse } from 'axios';
import * as fs from 'fs';
import * as path from 'path';

const BASE_URL = 'http://127.0.0.1:3001';
const API_KEY = 'Haisen.WhatsApp_Relay.Tegal_2026!w8';
const TEST_SESSION_ID = 'test_session_001';
const LOG_FILE = path.resolve(__dirname, 'test_results.log');

const results: string[] = [];

function log(msg: string): void {
  const line = `[${new Date().toISOString()}] ${msg}`;
  console.log(line);
  results.push(line);
}

function separator(title: string): void {
  const line = `\n${'─'.repeat(60)}\n  ${title}\n${'─'.repeat(60)}`;
  console.log(line);
  results.push(line);
}

function formatResponse(res: AxiosResponse): string {
  return `HTTP ${res.status} | ${JSON.stringify(res.data)}`;
}

function formatError(err: AxiosError): string {
  if (err.response) return `HTTP ${err.response.status} | ${JSON.stringify(err.response.data)}`;
  return `ERROR: ${err.message}`;
}

async function get(path: string, withAuth = true): Promise<void> {
  const label = `GET ${path}`;
  try {
    const headers = withAuth ? { 'x-api-key': API_KEY } : {};
    const res = await axios.get(`${BASE_URL}${path}`, { headers });
    log(`✅ ${label} → ${formatResponse(res)}`);
  } catch (err) {
    log(`❌ ${label} → ${formatError(err as AxiosError)}`);
  }
}

async function post(path: string, body: object, withAuth = true): Promise<void> {
  const label = `POST ${path}`;
  try {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (withAuth) headers['x-api-key'] = API_KEY;
    const res = await axios.post(`${BASE_URL}${path}`, body, { headers });
    log(`✅ ${label} → ${formatResponse(res)}`);
  } catch (err) {
    log(`❌ ${label} → ${formatError(err as AxiosError)}`);
  }
}

async function runTests(): Promise<void> {
  log('========================================================');
  log('  WA Gateway Route Test Suite — server-whatsapp:3001   ');
  log('========================================================');

  // ── 1. Health Check (no auth) ────────────────────────────
  separator('1. Health Check');
  await get('/health', false);

  // ── 2. Auth Guard Tests ──────────────────────────────────
  separator('2. Auth Guard — Requests without API Key (should 401)');
  await get('/api/v1/sessions', false);
  await post('/api/v1/sessions/init', { sessionId: 'test', label: 'test' }, false);

  // ── 3. Session Management ────────────────────────────────
  separator('3. Session Management');

  // Init session
  await post('/api/v1/sessions/init', {
    sessionId: TEST_SESSION_ID,
    label: 'Test Session Guru A1',
  });

  // Small delay to let session initialize
  await new Promise(r => setTimeout(r, 2000));

  // List all sessions
  await get('/api/v1/sessions');

  // Get status
  await get(`/api/v1/sessions/${TEST_SESSION_ID}/status`);

  // Get QR (expected: either QR or 409 if already connected)
  await get(`/api/v1/sessions/${TEST_SESSION_ID}/qr`);

  // Non-existent session
  await get('/api/v1/sessions/non_existent_session/status');
  await get('/api/v1/sessions/non_existent_session/qr');

  // ── 4. Messaging — Validation Errors ────────────────────
  separator('4. Messaging — Missing fields validation (should 400)');
  await post('/api/v1/messages/send-pdf', {
    sessionId: TEST_SESSION_ID,
    // missing recipientPhone, documentUrl, fileName
  });

  await post('/api/v1/messages/send-bulk-pdf', {
    items: [], // empty array
  });

  await post('/api/v1/messages/send-bulk-pdf', {
    // missing items
  });

  // ── 5. Messaging — Send PDF ─────────────────────────────
  separator('5. Messaging — send-pdf (Disposisi Rapor Resmi)');
  await post('/api/v1/messages/send-pdf', {
    sessionId: 'session_tk_masyithoh_01',
    recipientPhone: '085866668540',
    studentName: 'Shafa Kamila Az-Zahra',
    semester: 'SEM_01',
    academicYear: '2025/2026',
    documentUrl: '/storage/documents/2025_2026/semester_01/20329001/Kelompok_A1/Raport_Shafa_Kamila_Az-Zahra_semester_01_2025_2026.pdf',
    fileName: 'Raport_Shafa_Kamila_Az-Zahra_semester_01_2025_2026.pdf',
    caption: 'Bismillah, terlampir Dokumen E-Rapor Resmi Ananda Shafa Kamila Az-Zahra Semester 1 Tahun Ajaran 2025/2026. - TK Masyithoh 01 Kota Tegal',
    metadata: {
      studentId: '3328015505200001',
      reportId: 'rapor_shafa_sem1',
      teacherId: 'guru_dewi',
      academicYear: '2025/2026',
      semester: 'SEM_01',
    },
  });

  // ── 6. Messaging — Bulk Send ─────────────────────────────
  separator('6. Messaging — send-bulk-pdf (Antrean Rombel)');
  await post('/api/v1/messages/send-bulk-pdf', {
    items: [
      {
        sessionId: 'session_tk_masyithoh_01',
        recipientPhone: '085866668540',
        studentName: 'Shafa Kamila Az-Zahra',
        semester: 'SEM_01',
        academicYear: '2025/2026',
        documentUrl: '/storage/documents/2025_2026/semester_01/20329001/Kelompok_A1/Raport_Shafa_Kamila_Az-Zahra_semester_01_2025_2026.pdf',
        fileName: 'Raport_Shafa_Kamila_Az-Zahra_semester_01_2025_2026.pdf',
        caption: 'Bismillah, terlampir Dokumen E-Rapor Resmi Ananda Shafa Kamila Az-Zahra Semester 1. - TK Masyithoh 01 Kota Tegal',
        metadata: {
          studentId: '3328015505200001',
          reportId: 'rapor_shafa_sem1',
          teacherId: 'guru_dewi',
          academicYear: '2025/2026',
          semester: 'SEM_01',
        },
      },
    ],
  });

  // ── 7. Session Logout ────────────────────────────────────
  separator('7. Session — Logout');
  await post(`/api/v1/sessions/${TEST_SESSION_ID}/logout`, {});

  // Verify session removed
  await get(`/api/v1/sessions/${TEST_SESSION_ID}/status`);
  await get('/api/v1/sessions');

  // ── 8. 404 Handler ──────────────────────────────────────
  separator('8. 404 — Unknown endpoint');
  await get('/api/v1/unknown/route');

  // ── Done ─────────────────────────────────────────────────
  log('\n========================================================');
  log('  TEST SUITE COMPLETE');
  log('========================================================\n');

  // Write to log file
  fs.writeFileSync(LOG_FILE, results.join('\n'), 'utf8');
  console.log(`\n📄 Log saved to: ${LOG_FILE}`);
}

runTests().catch(err => {
  console.error('Test runner crashed:', err);
  process.exit(1);
});
