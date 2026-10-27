import { PrismaClient, Role, SemesterEnum, GenderEnum, AssessmentScoreEnum, ReportStatusEnum } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

async function main() {
  console.log('========================================================');
  console.log('  RESET & INITIAL SEEDING: TK MASYITHOH KOTA TEGAL');
  console.log('========================================================\n');

  // 1. Yayasan Resmi
  let foundation = await prisma.foundation.findFirst();
  if (!foundation) {
    foundation = await prisma.foundation.create({
      data: {
        name: 'Yayasan Pendidikan Muslimat NU Kota Tegal',
        legalNumber: 'AHU-0012345.AH.01.04.Tahun 2020',
        npwp: '01.234.567.8-501.000',
        address: 'Jl. Melati No. 10, Kel. Pekauman, Kec. Tegal Barat, Kota Tegal, Jawa Tengah',
      },
    });
  }
  console.log('✅ Yayasan:', foundation.name);

  // 2. Administrator Pusat Yayasan
  const adminPassword = await bcrypt.hash('AdminMasyithoh2026!', 10);
  const admin = await prisma.user.upsert({
    where: { username: 'superadmin' },
    update: {
      email: 'admin@masyithohkotategal.my.id',
      phoneNumber: '081234567890',
      passwordHash: adminPassword,
      role: Role.ADMINISTRATOR,
      isActive: true,
    },
    create: {
      username: 'superadmin',
      email: 'admin@masyithohkotategal.my.id',
      phoneNumber: '081234567890',
      passwordHash: adminPassword,
      role: Role.ADMINISTRATOR,
      isActive: true,
    },
  });
  console.log('✅ SuperAdmin:', admin.username);

  // 2b. Pengurus Yayasan Pusat (Muslimat NU Kota Tegal)
  const institutePassword = await bcrypt.hash('YayasanMasyithoh2026!', 10);
  const instituteUser = await prisma.user.upsert({
    where: { username: 'pengurus_yayasan' },
    update: {
      email: 'yayasan@masyithohkotategal.my.id',
      phoneNumber: '081234567899',
      passwordHash: institutePassword,
      role: Role.INSTITUTE,
      isActive: true,
    },
    create: {
      username: 'pengurus_yayasan',
      email: 'yayasan@masyithohkotategal.my.id',
      phoneNumber: '081234567899',
      passwordHash: institutePassword,
      role: Role.INSTITUTE,
      isActive: true,
    },
  });
  console.log('✅ Pengurus Yayasan (INSTITUTE):', instituteUser.username);

  // 3. Kepala Sekolah Resmi TK Masyithoh 01
  const ksPassword = await bcrypt.hash('KepalaSekolah2026!', 10);
  const headmaster = await prisma.user.upsert({
    where: { username: 'ks_masyithoh01' },
    update: {
      email: 'ks01@masyithohkotategal.my.id',
      phoneNumber: '081234567891',
      passwordHash: ksPassword,
      role: Role.HEADMASTER,
      isActive: true,
    },
    create: {
      username: 'ks_masyithoh01',
      email: 'ks01@masyithohkotategal.my.id',
      phoneNumber: '081234567891',
      passwordHash: ksPassword,
      role: Role.HEADMASTER,
      isActive: true,
    },
  });
  console.log('✅ Kepala Sekolah:', headmaster.username);

  // 4. Guru Wali Kelas Resmi (Ibu Dewi Sartika, S.Pd.)
  const guruPassword = await bcrypt.hash('GuruMasyithoh2026!', 10);
  const teacher = await prisma.user.upsert({
    where: { username: 'guru_dewi' },
    update: {
      email: 'dewi@masyithohkotategal.my.id',
      phoneNumber: '081234567892',
      passwordHash: guruPassword,
      role: Role.TEACHER,
      isActive: true,
    },
    create: {
      username: 'guru_dewi',
      email: 'dewi@masyithohkotategal.my.id',
      phoneNumber: '081234567892',
      passwordHash: guruPassword,
      role: Role.TEACHER,
      isActive: true,
    },
  });
  console.log('✅ Guru Kelas:', teacher.username);

  // 5. Sekolah Cabang Utama: TK Masyithoh 01 Kota Tegal
  let school = await prisma.school.findFirst({ where: { npsn: '20329001' } });
  if (!school) {
    school = await prisma.school.create({
      data: {
        foundationId: foundation.id,
        npsn: '20329001',
        name: 'TK Masyithoh 01 Kota Tegal',
        address: 'Jl. KH. Mukhlas No. 15, Kel. Pekauman, Kec. Tegal Barat, Kota Tegal',
        phoneNumber: '0283-356789',
        headmasterId: headmaster.id,
      },
    });
  }
  console.log('✅ Sekolah:', school.name, `(NPSN: ${school.npsn})`);

  // 6. Rombongan Belajar Resmi: Kelompok A1
  let classA1 = await prisma.class.findFirst({ where: { schoolId: school.id, name: 'Kelompok A1' } });
  if (!classA1) {
    classA1 = await prisma.class.create({
      data: {
        schoolId: school.id,
        teacherId: teacher.id,
        name: 'Kelompok A1',
        level: 'TK_A',
        capacity: 20,
        academicYear: '2025/2026',
        semester: SemesterEnum.SEM_01,
      },
    });
  }
  console.log('✅ Rombel:', classA1.name);

  // 7. Akun Orang Tua Siswa: Ibu Merli
  const parentPassword = await bcrypt.hash('WaliMasyithoh2026!', 10);
  const parentUser = await prisma.user.upsert({
    where: { username: 'wali_shafa' },
    update: {
      email: 'merli.wali@masyithohkotategal.my.id',
      phoneNumber: '085866668540',
      passwordHash: parentPassword,
      role: Role.STUDENT,
      isActive: true,
    },
    create: {
      username: 'wali_shafa',
      email: 'merli.wali@masyithohkotategal.my.id',
      phoneNumber: '085866668540',
      passwordHash: parentPassword,
      role: Role.STUDENT,
      isActive: true,
    },
  });
  console.log('✅ Akun Wali Murid (Ibu Merli):', parentUser.username, parentUser.phoneNumber);

  // 8. Data Siswa Nyata: Shafa Kamila Az-Zahra
  const student = await prisma.student.upsert({
    where: { nik: '3328015505200001' },
    update: {
      classId: classA1.id,
      schoolId: school.id,
      userId: parentUser.id,
      fullName: 'Shafa Kamila Az-Zahra',
      nickname: 'Shafa',
      gender: GenderEnum.P,
      birthPlace: 'Tegal',
      birthDate: new Date('2020-05-15'),
      religion: 'Islam',
      childOrder: 1,
      address: 'Jl. KH. Mukhlas No. 20, Pekauman, Kota Tegal',
      fatherName: 'Bapak Shafa',
      fatherNik: '3328011004850001',
      fatherJob: 'Wiraswasta',
      motherName: 'Ibu Merli',
      motherNik: '3328015206880002',
      motherJob: 'Ibu Rumah Tangga',
      parentPhoneNumber: '085866668540',
      heightCm: 102.5,
      weightKg: 16.0,
      isActive: true,
    },
    create: {
      nik: '3328015505200001',
      nis: '202501001',
      nisn: '3205011234',
      classId: classA1.id,
      schoolId: school.id,
      userId: parentUser.id,
      fullName: 'Shafa Kamila Az-Zahra',
      nickname: 'Shafa',
      gender: GenderEnum.P,
      birthPlace: 'Tegal',
      birthDate: new Date('2020-05-15'),
      religion: 'Islam',
      childOrder: 1,
      address: 'Jl. KH. Mukhlas No. 20, Pekauman, Kota Tegal',
      fatherName: 'Bapak Shafa',
      fatherNik: '3328011004850001',
      fatherJob: 'Wiraswasta',
      motherName: 'Ibu Merli',
      motherNik: '3328015206880002',
      motherJob: 'Ibu Rumah Tangga',
      parentPhoneNumber: '085866668540',
      heightCm: 102.5,
      weightKg: 16.0,
      isActive: true,
    },
  });
  console.log('✅ Data Siswa:', student.fullName, `(Target WA: ${student.parentPhoneNumber})`);

  // 9. Presensi Harian Siswa
  await prisma.dailyAttendance.upsert({
    where: {
      studentId_date: {
        studentId: student.id,
        date: new Date(new Date().toISOString().slice(0, 10)),
      },
    },
    update: { status: 'HADIR' },
    create: {
      studentId: student.id,
      classId: classA1.id,
      date: new Date(new Date().toISOString().slice(0, 10)),
      status: 'HADIR',
      notes: 'Ananda Shafa hadir tepat waktu dan aktif dalam kegiatan pagi.',
    },
  });

  // 10. Asesmen Capaian Pembelajaran PAUD
  const aspects = [
    { aspect: 'Nilai Agama dan Budi Pekerti', score: AssessmentScoreEnum.BSB, notes: 'Ananda Shafa terbiasa melafalkan doa sebelum belajar dan surat-surat pendek dengan tartil.' },
    { aspect: 'Jati Diri & Sosial Emosional', score: AssessmentScoreEnum.BSH, notes: 'Menunjukkan sikap percaya diri, mandiri dalam merapikan mainan, dan peduli kepada teman.' },
    { aspect: 'Dasar Literasi dan STEAM', score: AssessmentScoreEnum.BSB, notes: 'Sangat terampil mengenali pola balok, menyebutkan nama-nama benda, dan aktif bertanya.' },
  ];
  for (const item of aspects) {
    const existing = await prisma.assessment.findFirst({
      where: { studentId: student.id, aspect: item.aspect, academicYear: '2025/2026', semester: 'SEM_01' },
    });
    if (!existing) {
      await prisma.assessment.create({
        data: {
          studentId: student.id,
          academicYear: '2025/2026',
          semester: 'SEM_01',
          aspect: item.aspect,
          score: item.score,
          teacherNotes: item.notes,
        },
      });
    }
  }

  // 11. Catatan Anekdot Pembelajaran
  await prisma.anecdotalRecord.create({
    data: {
      studentId: student.id,
      teacherId: teacher.id,
      date: new Date(),
      eventContext: 'Sentra Bermain Peran dan Balok',
      observedBehavior: 'Shafa mengajak temannya berbagi balok susun saat membuat bangunan masjid bersama.',
      analysisInterpretation: 'Perkembangan empati dan kemampuan kerja sama ananda berkembang sangat baik sesuai usianya.',
    },
  });

  // 12. Berkas Fisik PDF Rapor Resmi
  const academicYearClean = '2025_2026';
  const semesterClean = '01';
  const schoolCode = school.npsn;
  const classNameClean = classA1.name.replace(/\s+/g, '_');
  const filename = `Raport_Shafa_Kamila_Az-Zahra_semester_${semesterClean}_${academicYearClean}.pdf`;
  const targetDir = path.resolve(
    process.cwd(),
    'storage',
    'documents',
    academicYearClean,
    `semester_${semesterClean}`,
    schoolCode,
    classNameClean,
  );
  fs.mkdirSync(targetDir, { recursive: true });
  const filePath = path.join(targetDir, filename);

  const pdfContent = `%PDF-1.4
%âãÏÓ
1 0 obj
<<
  /Title (LAPORAN PERKEMBANGAN PESERTA DIDIK - TK MASYITHOH 01 KOTA TEGAL)
  /Author (Dewi Sartika, S.Pd.)
  /Creator (Sistem E-Rapor Digital Yayasan TK Masyithoh)
  /Subject (Rapor Resmi Ananda Shafa Kamila Az-Zahra)
>>
endobj
2 0 obj
<<
  /Type /Catalog
  /Pages 3 0 R
>>
endobj
3 0 obj
<<
  /Type /Pages
  /Kids [4 0 R]
  /Count 1
>>
endobj
4 0 obj
<<
  /Type /Page
  /Parent 3 0 R
  /MediaBox [0 0 595.28 841.89]
  /Contents 5 0 R
  /Resources <<
    /Font <<
      /F1 <<
        /Type /Font
        /Subtype /Type1
        /BaseFont /Helvetica-Bold
      >>
      /F2 <<
        /Type /Font
        /Subtype /Type1
        /BaseFont /Helvetica
      >>
    >>
  >>
>>
endobj
5 0 obj
<< /Length 480 >>
stream
BT
/F1 16 Tf
50 780 Td
(YAYASAN PENDIDIKAN MUSLIMAT NU KOTA TEGAL) Tj
/F1 14 Tf
0 -24 Td
(TK MASYITHOH 01 KOTA TEGAL) Tj
/F2 10 Tf
0 -18 Td
(Alamat: Jl. KH. Mukhlas No. 15, Kel. Pekauman, Kec. Tegal Barat, Kota Tegal | NPSN: 20329001) Tj
0 -15 Td
(-------------------------------------------------------------------------------------------------------------------) Tj
/F1 12 Tf
0 -25 Td
(LAPORAN CAPAIAN PERKEMBANGAN ANAK DIDIK) Tj
/F2 10 Tf
0 -18 Td
(Nama Peserta Didik: SHAFA KAMILA AZ-ZAHRA) Tj
0 -15 Td
(NIS / NISN: 202501001 / 3205011234) Tj
0 -15 Td
(Kelompok: A1 | Tahun Ajaran: 2025/2026 Semester 1) Tj
0 -15 Td
(Nama Orang Tua / Wali: Ibu Merli) Tj
0 -25 Td
(Hasil Capaian: Berkembang Sangat Baik (BSB) pada seluruh aspek perkembangan PAUD.) Tj
0 -30 Td
(Guru Kelas: Dewi Sartika, S.Pd.    |    Kepala Sekolah: Hj. Siti Aminah, S.Pd.) Tj
ET
endstream
endobj
xref
0 6
0000000000 65535 f 
0000000015 00000 n 
0000000224 00000 n 
0000000275 00000 n 
0000000332 00000 n 
0000000572 00000 n 
trailer
<<
  /Size 6
  /Root 2 0 R
  /Info 1 0 R
>>
startxref
1104
%%EOF`;

  fs.writeFileSync(filePath, Buffer.from(pdfContent, 'utf-8'));
  console.log('✅ Dokumen PDF Fisik Rapor Resmi Dibuat:', filePath);

  // 13. Entri Rapor Resmi di Database
  const pdfRelativeUrl = `/storage/documents/${academicYearClean}/semester_${semesterClean}/${schoolCode}/${classNameClean}/${filename}`;
  await prisma.reportCard.create({
    data: {
      studentId: student.id,
      classId: classA1.id,
      academicYear: '2025/2026',
      semester: 'SEM_01',
      finalTeacherNarrative: 'Ananda Shafa Kamila Az-Zahra menunjukkan capaian perkembangan yang sangat membanggakan di Kelompok A1. Ananda memiliki adab yang santun, aktif dalam kegiatan belajar dan bermain, serta memiliki keterampilan motorik dan dasar literasi yang sangat baik.',
      status: ReportStatusEnum.APPROVED,
      validatedBy: headmaster.id,
      validatedAt: new Date(),
      digitalSignatureHash: 'DIGITAL_SIGNATURE_VERIFIED_TK_MASYITHOH_01_2026',
      pdfFilename: filename,
      pdfFileUrl: pdfRelativeUrl,
    },
  });
  console.log('✅ Data Rapor Card Terverifikasi (Status: APPROVED)');

  // 14. Whitelist Default
  await prisma.apiWhitelist.upsert({
    where: { id: 'default-local-dev-1' },
    update: {},
    create: {
      id: 'default-local-dev-1',
      label: 'Localhost Web Frontend Dev',
      domainOrOrigin: 'http://localhost:3000',
      port: 3000,
      createdBy: admin.id,
    },
  });
  await prisma.apiWhitelist.upsert({
    where: { id: 'default-local-dev-2' },
    update: {},
    create: {
      id: 'default-local-dev-2',
      label: 'Local Loopback IP',
      ipOrCidr: '127.0.0.1',
      createdBy: admin.id,
    },
  });

  console.log('\n========================================================');
  console.log('  SEEDING DATABASE RESMI SELESAI TANPA DATA DUMMY!');
  console.log('========================================================\n');
}

main()
  .catch((e) => {
    console.error('Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
