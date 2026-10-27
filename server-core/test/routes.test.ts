/**
 * Server-Core Route Test Suite
 * Tests semua endpoint: Auth, Admin, Schools, PPDB, Classes, Attendance, Assessments, Anecdotes, Reports
 * Hasil log disimpan ke test/test_results.log
 */
import axios, { AxiosError, AxiosResponse } from 'axios';
import * as fs from 'fs';
import * as path from 'path';

const BASE_URL = 'http://127.0.0.1:8000';
const LOG_FILE = path.resolve(__dirname, 'test_results.log');

const results: string[] = [];
let accessToken = '';
let refreshToken = '';
let teacherAccessToken = '';

// Test data IDs (akan diisi saat test berjalan)
let createdUserId = '';
let createdSchoolId = '';
let createdClassId = '';
let createdStudentId = '';
let createdWhitelistId = '';

// ── Helpers ──────────────────────────────────────────────────

function log(msg: string): void {
  const line = `[${new Date().toISOString()}] ${msg}`;
  console.log(line);
  results.push(line);
}

function separator(title: string): void {
  const line = `\n${'─'.repeat(65)}\n  ${title}\n${'─'.repeat(65)}`;
  console.log(line);
  results.push(line);
}

function fmt(res: AxiosResponse): string {
  const body = JSON.stringify(res.data);
  return `HTTP ${res.status} | ${body.length > 200 ? body.slice(0, 200) + '...' : body}`;
}

function fmtErr(err: AxiosError): string {
  if (err.response) {
    const body = JSON.stringify(err.response.data);
    return `HTTP ${err.response.status} | ${body.length > 200 ? body.slice(0, 200) + '...' : body}`;
  }
  return `ERROR: ${err.message}`;
}

function authHeaders(customToken?: string): Record<string, string> {
  const token = customToken || accessToken;
  return { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
}

async function GET(path: string, label?: string, token?: string): Promise<AxiosResponse | null> {
  const tag = label || `GET ${path}`;
  try {
    const res = await axios.get(`${BASE_URL}${path}`, { headers: authHeaders(token) });
    log(`✅ ${tag} → ${fmt(res)}`);
    return res;
  } catch (err) {
    log(`❌ ${tag} → ${fmtErr(err as AxiosError)}`);
    return null;
  }
}

async function POST(path: string, body: object, label?: string, useAuth = true, token?: string): Promise<AxiosResponse | null> {
  const tag = label || `POST ${path}`;
  try {
    const headers = useAuth ? authHeaders(token) : { 'Content-Type': 'application/json' };
    const res = await axios.post(`${BASE_URL}${path}`, body, { headers });
    log(`✅ ${tag} → ${fmt(res)}`);
    return res;
  } catch (err) {
    log(`❌ ${tag} → ${fmtErr(err as AxiosError)}`);
    return null;
  }
}

async function PUT(path: string, body: object, label?: string, token?: string): Promise<AxiosResponse | null> {
  const tag = label || `PUT ${path}`;
  try {
    const res = await axios.put(`${BASE_URL}${path}`, body, { headers: authHeaders(token) });
    log(`✅ ${tag} → ${fmt(res)}`);
    return res;
  } catch (err) {
    log(`❌ ${tag} → ${fmtErr(err as AxiosError)}`);
    return null;
  }
}

async function DELETE(path: string, label?: string, token?: string): Promise<AxiosResponse | null> {
  const tag = label || `DELETE ${path}`;
  try {
    const res = await axios.delete(`${BASE_URL}${path}`, { headers: authHeaders(token) });
    log(`✅ ${tag} → ${fmt(res)}`);
    return res;
  } catch (err) {
    log(`❌ ${tag} → ${fmtErr(err as AxiosError)}`);
    return null;
  }
}

async function PATCH(path: string, body: object, label?: string, token?: string): Promise<AxiosResponse | null> {
  const tag = label || `PATCH ${path}`;
  try {
    const res = await axios.patch(`${BASE_URL}${path}`, body, { headers: authHeaders(token) });
    log(`✅ ${tag} → ${fmt(res)}`);
    return res;
  } catch (err) {
    log(`❌ ${tag} → ${fmtErr(err as AxiosError)}`);
    return null;
  }
}

// ── Test Suites ───────────────────────────────────────────────

async function testAuth(): Promise<void> {
  separator('1. AUTH — Login, Refresh, Profile');

  // Login berhasil
  const loginRes = await POST('/api/v1/auth/login',
    { username: 'superadmin', password: 'AdminMasyithoh2026!' },
    'POST /auth/login (superadmin)', false
  );
  if (loginRes?.data?.data?.accessToken) {
    accessToken = loginRes.data.data.accessToken;
    refreshToken = loginRes.data.data.refreshToken;
    log(`   → accessToken diperoleh ✔`);
  }

  // Login salah password
  await POST('/api/v1/auth/login',
    { username: 'superadmin', password: 'SalahPassword123' },
    'POST /auth/login (password salah → 401)', false
  );

  // Get profile
  await GET('/api/v1/auth/profile', 'GET /auth/profile');

  // Update profile
  await PUT('/api/v1/auth/profile',
    { phoneNumber: '081234567890' },
    'PUT /auth/profile'
  );

  // Refresh token
  if (refreshToken) {
    const refRes = await POST('/api/v1/auth/refresh',
      { refreshToken },
      'POST /auth/refresh', false
    );
    if (refRes?.data?.data?.accessToken) {
      accessToken = refRes.data.data.accessToken;
      log(`   → accessToken diperbarui dari refresh ✔`);
    }
  }
}

async function testUsers(): Promise<void> {
  separator('2. ADMIN — User Management (Staf & Guru)');

  // List users
  await GET('/api/v1/admin/users', 'GET /admin/users');

  // Create user guru resmi
  const createRes = await POST('/api/v1/admin/users', {
    username: 'guru_nurul',
    email: 'nurul.hidayah@masyithohkotategal.my.id',
    phoneNumber: '081999888777',
    password: 'GuruMasyithoh2026!',
    role: 'TEACHER',
  }, 'POST /admin/users (tambah guru: Ibu Nurul Hidayah, S.Pd.)');
  if (createRes?.data?.data?.id) {
    createdUserId = createRes.data.data.id;
    log(`   → userId: ${createdUserId}`);
  }

  // Get user by ID
  if (createdUserId) {
    await GET(`/api/v1/admin/users/${createdUserId}`, `GET /admin/users/:id`);
    await PUT(`/api/v1/admin/users/${createdUserId}`, { isActive: false }, 'PUT /admin/users/:id (nonaktifkan)');
  }

  // Active sessions monitoring
  await GET('/api/v1/admin/monitoring/active-sessions', 'GET /admin/monitoring/active-sessions');
}

async function testSecurityWhitelist(): Promise<void> {
  separator('3. ADMIN — Security Whitelist');

  // List whitelists
  await GET('/api/v1/admin/security/whitelists', 'GET /admin/security/whitelists');

  // Create whitelist entry
  const createRes = await POST('/api/v1/admin/security/whitelists', {
    label: 'Portal Rapor Frontend Dev',
    domainOrOrigin: 'http://localhost:5173',
    port: 5173,
  }, 'POST /admin/security/whitelists');
  if (createRes?.data?.data?.id) {
    createdWhitelistId = createRes.data.data.id;
  }

  // Update
  if (createdWhitelistId) {
    await PUT(`/api/v1/admin/security/whitelists/${createdWhitelistId}`,
      { isActive: false },
      'PUT /admin/security/whitelists/:id'
    );
    // Delete
    await DELETE(`/api/v1/admin/security/whitelists/${createdWhitelistId}`, 'DELETE /admin/security/whitelists/:id');
  }
}

async function testSchools(): Promise<void> {
  separator('4. ADMIN — Schools Management (Cabang TK)');

  // List — ambil foundationId dari sekolah existing
  const listRes = await GET('/api/v1/admin/schools', 'GET /admin/schools');
  if (listRes?.data?.data?.[0]?.id) {
    createdSchoolId = listRes.data.data[0].id;
    log(`   → Menggunakan sekolah existing: ${createdSchoolId}`);
  }

  let foundationId = listRes?.data?.data?.[0]?.foundationId || '';

  // Create cabang sekolah resmi
  if (foundationId) {
    const createRes = await POST('/api/v1/admin/schools', {
      foundationId,
      npsn: '20329002',
      name: 'TK Masyithoh 02 Kota Tegal',
      address: 'Jl. Pemuda No. 12, Kraton, Kec. Tegal Barat, Kota Tegal',
      phoneNumber: '0283-356790',
    }, 'POST /admin/schools (cabang TK Masyithoh 02)');

    if (createRes?.data?.data?.id) {
      const testSchoolId = createRes.data.data.id;
      await GET(`/api/v1/admin/schools/${testSchoolId}`, 'GET /admin/schools/:id');
      await PUT(`/api/v1/admin/schools/${testSchoolId}`, { name: 'TK Masyithoh 02 Kota Tegal (Terverifikasi)' }, 'PUT /admin/schools/:id');
      await DELETE(`/api/v1/admin/schools/${testSchoolId}`, 'DELETE /admin/schools/:id');
    }
  } else {
    log('⏭️  Skip create school test (foundationId tidak tersedia)');
  }
}

async function testHeadmaster(): Promise<void> {
  separator('5. HEADMASTER — Dashboard, Classes, Teachers');

  // Dashboard stats
  await GET('/api/v1/headmaster/dashboard-stats', 'GET /headmaster/dashboard-stats');

  // List classes
  const classRes = await GET('/api/v1/headmaster/classes', 'GET /headmaster/classes');
  if (classRes?.data?.data?.[0]?.id) {
    createdClassId = classRes.data.data[0].id;
    log(`   → Menggunakan kelas existing: ${createdClassId}`);
  }

  // Create rombel kelas resmi
  const newClassRes = await POST('/api/v1/headmaster/classes', {
    schoolId: createdSchoolId,
    name: 'Kelompok B1',
    level: 'TK_B',
    capacity: 20,
    academicYear: '2025/2026',
    semester: 'SEM_01',
  }, 'POST /headmaster/classes (buat rombel Kelompok B1)');

  if (newClassRes?.data?.data?.id) {
    const testClassId = newClassRes.data.data.id;
    await PUT(`/api/v1/headmaster/classes/${testClassId}`, { name: 'Kelompok B1 Unggulan' }, 'PUT /headmaster/classes/:id');
    await DELETE(`/api/v1/headmaster/classes/${testClassId}`, 'DELETE /headmaster/classes/:id');
  }

  // List teachers
  await GET('/api/v1/headmaster/teachers', 'GET /headmaster/teachers');
}

async function testPpdb(): Promise<void> {
  separator('6. PPDB — Penerimaan Peserta Didik Baru (Target: 085866668540)');

  // List candidates
  await GET('/api/v1/ppdb/candidates', 'GET /ppdb/candidates');

  // Register siswa resmi: Shafa Kamila Az-Zahra dengan wali Ibu Merli
  const dynamicNik = '332801' + Date.now().toString().slice(-10);
  const registerRes = await POST('/api/v1/ppdb/register', {
    schoolId: createdSchoolId,
    academicYear: '2025/2026',
    targetLevel: 'TK_A',
    studentPayload: {
      fullName: 'Shafa Kamila Az-Zahra',
      nik: dynamicNik,
      gender: 'P',
      birthPlace: 'Tegal',
      birthDate: '2020-05-15',
      fatherName: 'Bapak Shafa',
      fatherNik: '3328011004850001',
      motherName: 'Ibu Merli',
      motherNik: '3328015206880002',
      parentPhoneNumber: '085866668540',
      address: 'Jl. KH. Mukhlas No. 20, Kel. Pekauman, Kota Tegal',
    },
    birthCertificateUrl: '/storage/documents/akta_shafa.pdf',
    familyCardUrl: '/storage/documents/kk_shafa.pdf',
    parentKtpUrl: '/storage/documents/ktp_ibu_merli.pdf',
  }, 'POST /ppdb/register (Siswa: Shafa Kamila Az-Zahra, Wali: Ibu Merli 085866668540)');

  const candidateId = registerRes?.data?.data?.id;
  if (candidateId) {
    // Detail kandidat
    await GET(`/api/v1/ppdb/candidates/${candidateId}`, 'GET /ppdb/candidates/:id');

    // Update status ke VERIFIED
    await PATCH(`/api/v1/ppdb/candidates/${candidateId}/status`, {
      status: 'VERIFIED',
      assignedClassId: createdClassId,
    }, 'PATCH /ppdb/candidates/:id/status (VERIFIED)');

    // Enroll kandidat resmi ke rombel
    if (createdClassId) {
      const enrollRes = await POST(`/api/v1/ppdb/candidates/${candidateId}/enroll`, {
        assignedClassId: createdClassId,
      }, 'POST /ppdb/candidates/:id/enroll (terima siswa resmi ke rombel)');

      const newStudentId = enrollRes?.data?.student?.id || enrollRes?.data?.data?.student?.id;
      if (newStudentId) {
        createdStudentId = newStudentId;
        log(`   → Siswa resmi terdaftar dengan studentId: ${createdStudentId} (Wali: Ibu Merli - 085866668540)`);
      }
    }
  }
}

async function setupTeacherAccount(): Promise<void> {
  separator('6b. TEACHER AUTH — Login / Auto-Create Akun Guru Beneran');

  // Coba login sebagai guru_dewi
  let loginRes = await POST('/api/v1/auth/login',
    { username: 'guru_dewi', password: 'GuruMasyithoh2026!' },
    'POST /auth/login (login akun guru: guru_dewi)', false
  );

  if (loginRes?.data?.data?.accessToken) {
    teacherAccessToken = loginRes.data.data.accessToken;
    log(`   → Teacher login berhasil (guru_dewi) ✔`);
    return;
  }

  // Jika belum ada akun guru, otomatis buat via Admin
  log(`   ⚠️ Akun guru_dewi belum ada/gagal login. Membuat akun guru test baru...`);
  const createTeacherRes = await POST('/api/v1/admin/users', {
    username: 'guru_dewi_test',
    email: 'guru.dewi.test@masyithohkotategal.my.id',
    phoneNumber: '085866668540',
    password: 'GuruMasyithoh2026!',
    role: 'TEACHER',
  }, 'POST /admin/users (auto-create akun guru testing)');

  const newUsername = createTeacherRes?.data?.data?.username || 'guru_dewi_test';
  loginRes = await POST('/api/v1/auth/login',
    { username: newUsername, password: 'GuruMasyithoh2026!' },
    `POST /auth/login (login guru: ${newUsername})`, false
  );

  if (loginRes?.data?.data?.accessToken) {
    teacherAccessToken = loginRes.data.data.accessToken;
    log(`   → Teacher login berhasil (${newUsername}) ✔`);
  } else {
    log(`   ⚠️ Gagal mendapatkan token teacher, fallback ke accessToken Admin`);
    teacherAccessToken = accessToken;
  }
}

async function testAttendance(): Promise<void> {
  separator('7. TEACHER — Attendance (Auth: Teacher)');

  if (!createdClassId) {
    log('⏭️  Skip attendance test (tidak ada classId)');
    return;
  }

  if (!createdStudentId) {
    log('⏭️  Skip POST attendance (belum ada studentId)');
  } else {
    await POST('/api/v1/teacher/attendance', {
      studentId: createdStudentId,
      classId: createdClassId,
      date: new Date().toISOString().slice(0, 10),
      status: 'HADIR',
      notes: 'Test presensi harian oleh guru',
    }, 'POST /teacher/attendance (single - guru beneran)', true, teacherAccessToken);
  }

  // GET attendance by class
  await GET(`/api/v1/teacher/attendance/class/${createdClassId}`, `GET /teacher/attendance/class/:classId`, teacherAccessToken);
}

async function testAssessments(): Promise<void> {
  separator('8. TEACHER — Assessments (Capaian PAUD - Auth: Teacher)');

  if (!createdStudentId) {
    log('⏭️  Skip POST assessments (belum ada studentId)');
  } else {
    await POST('/api/v1/teacher/assessments', {
      studentId: createdStudentId,
      semester: 'SEM_01',
      academicYear: '2025/2026',
      aspect: 'Nilai Agama & Moral',
      score: 'BSH',
      teacherNotes: 'Anak sudah bisa berdoa dengan baik',
    }, 'POST /teacher/assessments (single - guru beneran)', true, teacherAccessToken);
  }

  await GET(`/api/v1/student/assessments/${createdStudentId || 'no-student'}`, 'GET /student/assessments/:studentId', teacherAccessToken);
}

async function testAnecdotes(): Promise<void> {
  separator('9. TEACHER — Anecdotal Records (Auth: Teacher)');

  if (!createdStudentId) {
    log('⏭️  Skip POST anecdotes (belum ada studentId)');
  } else {
    await POST('/api/v1/teacher/anecdotes', {
      studentId: createdStudentId,
      date: new Date().toISOString().slice(0, 10),
      eventContext: 'Kegiatan bermain di luar ruangan',
      observedBehavior: 'Anak menunjukkan empati kepada temannya yang jatuh',
      analysisInterpretation: 'Perkembangan sosial-emosional anak sangat baik',
    }, 'POST /teacher/anecdotes (guru beneran)', true, teacherAccessToken);
  }

  await GET(`/api/v1/teacher/anecdotes/${createdStudentId || 'no-student'}`, 'GET /teacher/anecdotes/:studentId', teacherAccessToken);
}

async function testReports(): Promise<void> {
  separator('10. REPORTS — Draft, Validate, Distribute (Real WA Dispatch)');

  // Pending reports (headmaster)
  await GET('/api/v1/headmaster/reports/pending', 'GET /headmaster/reports/pending');

  if (createdStudentId && createdClassId) {
    // Draft report oleh Guru beneran
    const draftRes = await POST('/api/v1/teacher/reports/draft', {
      studentId: createdStudentId,
      classId: createdClassId,
      semester: 'SEM_01',
      academicYear: '2025/2026',
      finalTeacherNarrative: 'Ananda Shafa Kamila Az-Zahra menunjukkan capaian perkembangan yang sangat membanggakan di Kelompok A1. Ananda memiliki adab yang santun, aktif dalam kegiatan belajar dan bermain, serta memiliki keterampilan motorik dan dasar literasi yang sangat baik.',
    }, 'POST /teacher/reports/draft (guru resmi: Ibu Dewi Sartika, S.Pd.)', true, teacherAccessToken);

    const reportId = draftRes?.data?.data?.id;
    if (reportId) {
      // Validasi oleh Kepala Sekolah
      await POST(`/api/v1/headmaster/reports/${reportId}/validate`, {}, 'POST /headmaster/reports/:id/validate');

      // Dispatch WA langsung ke nomor target Ibu Merli (085866668540)
      await POST('/api/v1/teacher/reports/dispatch-wa', {
        reportId,
      }, 'POST /teacher/reports/dispatch-wa (Kirim WA Rapor ke Target Real Ibu Merli 085866668540)', true, teacherAccessToken);
    }

    // Student report card
    await GET(`/api/v1/student/report-card?studentId=${createdStudentId}&academicYear=2025/2026&semester=SEM_01`, 'GET /student/report-card', teacherAccessToken);
  }
}

async function testFoundation(): Promise<void> {
  separator('11. INSTITUTE — Foundation Overview');

  await GET('/api/v1/institute/overview', 'GET /institute/overview');
  await GET('/api/v1/institute/reports/performance', 'GET /institute/reports/performance');
}

async function testSystemBackup(): Promise<void> {
  separator('12. SYSTEM — Backup & Audit Logs');

  await GET('/api/v1/admin/system/backup', 'GET /admin/system/backup');
  await GET('/api/v1/admin/audit-logs', 'GET /admin/audit-logs');
}

async function testDeleteUser(): Promise<void> {
  separator('13. CLEANUP — Hapus User Test');

  if (createdUserId) {
    await DELETE(`/api/v1/admin/users/${createdUserId}`, 'DELETE /admin/users/:id (cleanup)');
  }
}

// ── Main Runner ───────────────────────────────────────────────

async function main(): Promise<void> {
  log('═══════════════════════════════════════════════════════════════');
  log('  SERVER-CORE Route Test Suite — http://127.0.0.1:8000         ');
  log('═══════════════════════════════════════════════════════════════');

  await testAuth();
  await testUsers();
  await testSecurityWhitelist();
  await testSchools();
  await testHeadmaster();
  await testPpdb();
  await setupTeacherAccount();
  await testAttendance();
  await testAssessments();
  await testAnecdotes();
  await testReports();
  await testFoundation();
  await testSystemBackup();
  await testDeleteUser();

  log('\n═══════════════════════════════════════════════════════════════');
  log('  TEST SUITE COMPLETE');
  log('═══════════════════════════════════════════════════════════════\n');

  fs.writeFileSync(LOG_FILE, results.join('\n'), 'utf8');
  console.log(`\n📄 Log disimpan: ${LOG_FILE}`);
}

main().catch(err => {
  console.error('Test runner error:', err);
  process.exit(1);
});
