import axios, { AxiosError } from 'axios';
import * as fs from 'fs';
import * as path from 'path';
import * as QRCode from 'qrcode';

const BASE_URL = 'http://127.0.0.1:3001';
const API_KEY = 'Haisen.WhatsApp_Relay.Tegal_2026!w8';
const SESSION_ID = 'live_test_merli';
const TARGET_PHONE = '085866668540'; // Ibu Merli
const QR_PNG_FILE = path.resolve(__dirname, 'qr_scan.png');
const headers = { 'x-api-key': API_KEY, 'Content-Type': 'application/json' };

async function checkSession(): Promise<string> {
  try {
    const res = await axios.get(`${BASE_URL}/api/v1/sessions/${SESSION_ID}/status`, { headers });
    return res.data?.data?.status || 'NOT_FOUND';
  } catch {
    return 'NOT_FOUND';
  }
}

async function startSession(): Promise<void> {
  console.log(`[WA Test] Menginisialisasi sesi: ${SESSION_ID}...`);
  await axios.post(`${BASE_URL}/api/v1/sessions/init`, {
    sessionId: SESSION_ID,
    label: 'Live Test — Ibu Merli',
  }, { headers });
}

async function getQRCode(): Promise<string | null> {
  for (let i = 0; i < 20; i++) {
    await new Promise(r => setTimeout(r, 1000));
    try {
      const res = await axios.get(`${BASE_URL}/api/v1/sessions/${SESSION_ID}/qr`, { headers });
      const { qr, qrDataUrl } = res.data.data;
      if (qr) {
        if (qrDataUrl) {
          const base64Data = qrDataUrl.replace(/^data:image\/png;base64,/, '');
          fs.writeFileSync(QR_PNG_FILE, Buffer.from(base64Data, 'base64'));
        }
        return qr;
      }
    } catch {
      // Tunggu hingga QR digenerate Baileys
    }
  }
  return null;
}

async function waitForConnection(): Promise<boolean> {
  for (let i = 0; i < 60; i++) {
    await new Promise(r => setTimeout(r, 2000));
    const status = await checkSession();
    if (status === 'CONNECTED') {
      return true;
    }
    process.stdout.write('.');
  }
  return false;
}

async function sendMessage(): Promise<void> {
  console.log(`\n[WA Test] Mengirim dokumen PDF & pesan WhatsApp ke ${TARGET_PHONE} (Ibu Merli)...`);
  const caption = `*Assalamu'alaikum Wr. Wb. Ibu Merli*\n\n📋 *Dokumen Resmi E-Rapor Digital TK Masyithoh 01 Kota Tegal*\n\nNama Siswa : *Shafa Kamila Az-Zahra*\nKelas      : Kelompok A1\nSemester   : Semester 1 (Ganjil) 2025/2026\nStatus     : Disahkan & Tervalidasi Resmi\n\nTerlampir file dokumen PDF E-Rapor Digital hasil perkembangan ananda selama semester ini.\n\n_Wassalamu'alaikum Wr. Wb._\n*TK Masyithoh 01 Kota Tegal* 🏫✨`;

  const realPdfPath = path.resolve(__dirname, '../../server-core/storage/documents/2025_2026/semester_01/20329001/Kelompok_A1/Raport_Shafa_Kamila_Az-Zahra_semester_01_2025_2026.pdf');
  let pdfBase64: string | undefined;
  if (fs.existsSync(realPdfPath)) {
    pdfBase64 = fs.readFileSync(realPdfPath).toString('base64');
    console.log(`[WA Test] Dokumen fisik PDF ditemukan (${pdfBase64.length} bytes base64).`);
  }

  const res = await axios.post(`${BASE_URL}/api/v1/messages/send-pdf`, {
    sessionId: SESSION_ID,
    recipientPhone: TARGET_PHONE,
    phone: TARGET_PHONE,
    documentUrl: '/storage/documents/2025_2026/semester_01/20329001/Kelompok_A1/Raport_Shafa_Kamila_Az-Zahra_semester_01_2025_2026.pdf',
    documentBase64: pdfBase64,
    fileName: 'Raport_Shafa_Kamila_Az-Zahra_semester_01_2025_2026.pdf',
    filename: 'Raport_Shafa_Kamila_Az-Zahra_semester_01_2025_2026.pdf',
    studentName: 'Shafa Kamila Az-Zahra',
    semester: 'SEM_01',
    academicYear: '2025/2026',
    caption,
  }, { headers });

  console.log('✅ Response Gateway:', JSON.stringify(res.data));
  console.log(`🎉 Dokumen PDF & pesan WhatsApp berhasil dikirim ke ${TARGET_PHONE}!`);
}

async function main(): Promise<void> {
  console.log('════════════════════════════════════════════════════════════');
  console.log(`  PENGUJIAN KIRIM WHATSAPP REAL → ${TARGET_PHONE}`);
  console.log('════════════════════════════════════════════════════════════\n');

  let status = await checkSession();
  console.log(`Status sesi saat ini: ${status}`);

  if (status !== 'CONNECTED') {
    await startSession();
    const qr = await getQRCode();
    if (qr) {
      console.log('\n════════════════════════════════════════════════');
      console.log('  SCAN QR INI MENGGUNAKAN WHATSAPP DI HP ANDA:');
      console.log('════════════════════════════════════════════════');
      const ascii = await QRCode.toString(qr, { type: 'terminal', small: true });
      console.log(ascii);
      console.log('════════════════════════════════════════════════');
      console.log(`📸 File QR juga disimpan di: ${QR_PNG_FILE}`);
      console.log('⏳ Menunggu scan WhatsApp dari HP...');

      const connected = await waitForConnection();
      if (!connected) {
        console.error('\n❌ Waktu scan habis. Silakan jalankan script kembali.');
        process.exit(1);
      }
      console.log('\n✅ WhatsApp Berhasil Terhubung!');
    } else {
      // Cek lagi apakah langsung connected
      status = await checkSession();
      if (status !== 'CONNECTED') {
        console.error('❌ Gagal mendapatkan QR code. Pastikan server WA aktif.');
        process.exit(1);
      }
    }
  }

  await sendMessage();
  console.log('\nSesi tetap dipertahankan CONNECTED untuk operasional E-Rapor.');
}

main().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
