/**
 * QR Scanner + Real WA Send Test
 * - Tampilkan QR Code di terminal (ASCII) dan simpan sebagai PNG
 * - Setelah scan, kirim pesan test ke nomor target
 * - Simpan log hasil
 */
import axios, { AxiosError } from 'axios';
import * as fs from 'fs';
import * as path from 'path';
import * as QRCode from 'qrcode';

const BASE_URL = 'http://127.0.0.1:3001';
const API_KEY = 'Haisen.WhatsApp_Relay.Tegal_2026!w8';
const SESSION_ID = 'live_test_merli';
const TARGET_PHONE = '6285866668540'; // 085866668540 → format internasional
const LOG_FILE = path.resolve(__dirname, 'qr_send_test.log');
const QR_PNG_FILE = path.resolve(__dirname, 'qr_scan.png');

const logs: string[] = [];

function log(msg: string): void {
  const line = `[${new Date().toISOString()}] ${msg}`;
  console.log(line);
  logs.push(line);
}

const headers = { 'x-api-key': API_KEY, 'Content-Type': 'application/json' };

async function initSession(): Promise<void> {
  log(`Membersihkan sesi lama ${SESSION_ID} jika ada...`);
  try {
    await axios.post(`${BASE_URL}/api/v1/sessions/${SESSION_ID}/logout`, {}, { headers });
  } catch { /* abaikan jika belum ada */ }

  log(`Inisialisasi sesi baru: ${SESSION_ID}...`);
  await axios.post(`${BASE_URL}/api/v1/sessions/init`, {
    sessionId: SESSION_ID,
    label: 'Live Test — Ibu Merli',
  }, { headers });
}

async function waitForQR(): Promise<string> {
  log('Menunggu QR Code tersedia...');
  for (let i = 0; i < 30; i++) {
    await new Promise(r => setTimeout(r, 1000));
    try {
      const res = await axios.get(`${BASE_URL}/api/v1/sessions/${SESSION_ID}/qr`, { headers });
      const { qr, qrDataUrl } = res.data.data;
      if (qr) {
        // Simpan QR sebagai PNG
        const base64Data = qrDataUrl.replace(/^data:image\/png;base64,/, '');
        fs.writeFileSync(QR_PNG_FILE, Buffer.from(base64Data, 'base64'));
        log(`✅ QR PNG disimpan: ${QR_PNG_FILE}`);

        // Print QR ASCII ke terminal
        console.log('\n════════════════════════════════════════');
        console.log('  SCAN QR INI DENGAN WHATSAPP DI HP ANDA');
        console.log('════════════════════════════════════════');
        const ascii = await QRCode.toString(qr, { type: 'terminal', small: true });
        console.log(ascii);
        console.log('════════════════════════════════════════\n');

        return qr;
      }
    } catch { /* belum ada QR, tunggu */ }
  }
  throw new Error('QR tidak tersedia setelah 30 detik. Pastikan server WA berjalan.');
}

async function waitForConnected(): Promise<void> {
  log('Menunggu WhatsApp tersambung setelah scan QR...');
  console.log('⏳ Silakan SCAN QR di atas dengan WhatsApp Anda sekarang (tersedia 3 menit)...\n');

  for (let i = 0; i < 90; i++) {
    await new Promise(r => setTimeout(r, 2000));
    try {
      const res = await axios.get(`${BASE_URL}/api/v1/sessions/${SESSION_ID}/status`, { headers });
      const { status } = res.data.data;
      log(`   Status sesi: ${status}`);

      if (status === 'CONNECTED') {
        log('✅ WhatsApp CONNECTED! Siap mengirim pesan.');
        return;
      }
    } catch {
      // Sesi mungkin sedang refresh QR atau sebentar reconnect
      log('   Menunggu koneksi WhatsApp...');
    }
  }
  throw new Error('Timeout: WhatsApp tidak CONNECTED dalam 3 menit.');
}

async function sendRealMessage(): Promise<void> {
  log(`\nMengirim pesan test ke ${TARGET_PHONE} (Ibu Merli)...`);

  try {
    const res = await axios.post(`${BASE_URL}/api/v1/messages/send-pdf`, {
      sessionId: SESSION_ID,
      recipientPhone: TARGET_PHONE,
      studentName: 'Ahmad Fauzi (DEMO)',
      semester: '01',
      academicYear: '2025/2026',
      // Menggunakan URL dokumen dummy — kirim sebagai teks caption jika PDF tidak ada
      documentUrl: 'http://127.0.0.1:8000/api/v1/documents/secure-stream/test-demo',
      fileName: 'Raport_Ahmad_Fauzi_semester_01_2025_2026.pdf',
      caption: `*Assalamu'alaikum Wr. Wb.*\n\n📋 *E-Rapor Digital TK Masyithoh Kota Tegal*\n\nIni adalah pesan uji coba pengiriman sistem E-Rapor Digital.\n\nSistem WhatsApp Gateway berhasil terhubung dan siap mendistribusikan rapor digital kepada orang tua/wali murid.\n\n_Terima kasih — Tim IT TK Masyithoh Kota Tegal_ 🏫`,
      metadata: {
        studentId: 'demo-student-001',
        reportId: 'demo-report-001',
        teacherId: 'demo-teacher-001',
        academicYear: '2025/2026',
        semester: '01',
      },
    }, { headers });

    log(`✅ SEND Response: ${JSON.stringify(res.data)}`);
    log(`📱 Pesan sedang dikirim ke ${TARGET_PHONE} (Ibu Merli)`);
  } catch (err) {
    const axErr = err as AxiosError;
    log(`❌ Send gagal: ${axErr.response ? JSON.stringify(axErr.response.data) : axErr.message}`);
  }
}

async function sendTextMessage(): Promise<void> {
  // Fallback: kirim teks langsung via socket (bypass PDF jika file tidak ada)
  log(`\nMengirim pesan TEKS langsung ke ${TARGET_PHONE}...`);
  // Hit endpoint session untuk ambil socket, kirim teks sederhana
  // Kita manfaatkan endpoint send-pdf dengan documentUrl placeholder
  // Jika PDF gagal diambil, server WA akan log error di background tapi tetap HTTP 200
}

async function cleanup(): Promise<void> {
  log('\nMembersihkan sesi test...');
  try {
    await axios.post(`${BASE_URL}/api/v1/sessions/${SESSION_ID}/logout`, {}, { headers });
    log('✅ Sesi test berhasil di-logout.');
  } catch { /* ignore */ }
}

async function main(): Promise<void> {
  log('==========================================================');
  log('  LIVE TEST: QR Scan + Kirim WA ke Ibu Merli (085866668540)');
  log('==========================================================');

  try {
    await initSession();
    await waitForQR();
    await waitForConnected();
    await sendRealMessage();
    await new Promise(r => setTimeout(r, 5000)); // tunggu delivery
    log('\n🎉 Test live selesai!');
  } catch (err) {
    log(`\n💥 Error: ${err instanceof Error ? err.message : err}`);
  } finally {
    await cleanup();
    fs.writeFileSync(LOG_FILE, logs.join('\n'), 'utf8');
    log(`\n📄 Log disimpan: ${LOG_FILE}`);
  }
}

main();
