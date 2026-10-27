export enum Role {
  ADMINISTRATOR = 'ADMINISTRATOR',
  HEADMASTER = 'HEADMASTER',
  TEACHER = 'TEACHER',
  STUDENT = 'STUDENT',
  INSTITUTE = 'INSTITUTE',
}

export enum AssessmentScore {
  BB = 'BB',   // Belum Berkembang
  MB = 'MB',   // Mulai Berkembang
  BSH = 'BSH', // Berkembang Sesuai Harapan
  BSB = 'BSB', // Berkembang Sangat Baik
}

export enum AttendanceStatus {
  HADIR = 'HADIR',
  SAKIT = 'SAKIT',
  IZIN = 'IZIN',
  ALPA = 'ALPA',
}

export enum ReportStatus {
  DRAFT = 'DRAFT',
  PENDING_VALIDATION = 'PENDING_VALIDATION',
  APPROVED = 'APPROVED',
  DISTRIBUTED = 'DISTRIBUTED',
}

export const PAUD_ASPECTS = [
  'Nilai Agama & Moral',
  'Motorik',
  'Kognitif',
  'Bahasa',
  'Sosial-Emosional',
  'Seni',
] as const;
