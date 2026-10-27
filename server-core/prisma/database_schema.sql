-- ==============================================================================
-- DDL Basis Data: E-Rapor Digital TK Masyithoh Kota Tegal
-- Sesuai Spesifikasi: docs/backend_database.md
-- Engine: MySQL 8.0+ / MariaDB 10.4+ (XAMPP Stack)
-- ==============================================================================

CREATE DATABASE IF NOT EXISTS db_erapor_masyithoh 
CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;

USE db_erapor_masyithoh;

-- 1. Entitas Pengguna & Otorisasi (RBAC)
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(36) PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE,
    phone_number VARCHAR(20) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('ADMINISTRATOR', 'HEADMASTER', 'TEACHER', 'STUDENT', 'INSTITUTE') NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_user_role (role),
    INDEX idx_user_phone (phone_number)
) ENGINE=InnoDB;

-- 2. Struktur Yayasan & Cabang Unit Sekolah
CREATE TABLE IF NOT EXISTS foundation (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    legal_number VARCHAR(100),
    npwp VARCHAR(50),
    address TEXT,
    logo_url VARCHAR(255),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS schools (
    id VARCHAR(36) PRIMARY KEY,
    foundation_id VARCHAR(36) NOT NULL,
    npsn VARCHAR(20) UNIQUE,
    name VARCHAR(150) NOT NULL,
    address TEXT NOT NULL,
    phone_number VARCHAR(20),
    headmaster_id VARCHAR(36) NULL,
    logo_url VARCHAR(255),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_schools_foundation FOREIGN KEY (foundation_id) REFERENCES foundation(id) ON DELETE CASCADE,
    CONSTRAINT fk_schools_headmaster FOREIGN KEY (headmaster_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- 3. Rombongan Belajar (Rombel) & Siswa
CREATE TABLE IF NOT EXISTS classes (
    id VARCHAR(36) PRIMARY KEY,
    school_id VARCHAR(36) NOT NULL,
    teacher_id VARCHAR(36) NULL,
    name VARCHAR(50) NOT NULL,
    level VARCHAR(20) NOT NULL,
    capacity INT DEFAULT 20,
    academic_year VARCHAR(20) NOT NULL,
    semester ENUM('01', '02', 'Ganjil', 'Genap') NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_classes_school FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE,
    CONSTRAINT fk_classes_teacher FOREIGN KEY (teacher_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_classes_period (academic_year, semester)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS students (
    id VARCHAR(36) PRIMARY KEY,
    school_id VARCHAR(36) NOT NULL,
    class_id VARCHAR(36) NULL,
    user_id VARCHAR(36) NULL,
    nisn VARCHAR(20),
    nis VARCHAR(20),
    nik VARCHAR(16) UNIQUE NOT NULL,
    full_name VARCHAR(150) NOT NULL,
    nickname VARCHAR(50),
    gender ENUM('L', 'P') NOT NULL,
    birth_place VARCHAR(100) NOT NULL,
    birth_date DATE NOT NULL,
    religion VARCHAR(30) DEFAULT 'Islam',
    child_order INT,
    address TEXT NOT NULL,
    father_name VARCHAR(150) NOT NULL,
    father_nik VARCHAR(16) NOT NULL,
    father_education VARCHAR(30),
    father_job VARCHAR(100),
    father_income DECIMAL(12, 2),
    mother_name VARCHAR(150) NOT NULL,
    mother_nik VARCHAR(16) NOT NULL,
    mother_education VARCHAR(30),
    mother_job VARCHAR(100),
    mother_income DECIMAL(12, 2),
    parent_phone_number VARCHAR(20) NOT NULL,
    secondary_phone_number VARCHAR(20),
    height_cm DECIMAL(5, 2),
    weight_kg DECIMAL(5, 2),
    is_active BOOLEAN DEFAULT TRUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_students_school FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE,
    CONSTRAINT fk_students_class FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE SET NULL,
    CONSTRAINT fk_students_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_student_name (full_name),
    INDEX idx_student_parent_phone (parent_phone_number)
) ENGINE=InnoDB;

-- 4. Modul PPDB (Pendaftaran Peserta Didik Baru)
CREATE TABLE IF NOT EXISTS ppdb_registrations (
    id VARCHAR(36) PRIMARY KEY,
    school_id VARCHAR(36) NOT NULL,
    registration_number VARCHAR(50) UNIQUE NOT NULL,
    academic_year VARCHAR(20) NOT NULL,
    target_level VARCHAR(20) NOT NULL,
    assigned_class_id VARCHAR(36) NULL,
    student_id VARCHAR(36) NULL,
    student_payload JSON NOT NULL,
    birth_certificate_url TEXT NOT NULL,
    family_card_url TEXT NOT NULL,
    parent_ktp_url TEXT NOT NULL,
    status ENUM('PENDING', 'VERIFIED', 'ACCEPTED', 'REJECTED') DEFAULT 'PENDING',
    verifier_id VARCHAR(36) NULL,
    verified_at DATETIME NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_ppdb_school FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE,
    CONSTRAINT fk_ppdb_class FOREIGN KEY (assigned_class_id) REFERENCES classes(id) ON DELETE SET NULL,
    CONSTRAINT fk_ppdb_student FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE SET NULL,
    CONSTRAINT fk_ppdb_verifier FOREIGN KEY (verifier_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_ppdb_status (status, academic_year)
) ENGINE=InnoDB;

-- 5. Presensi, Catatan Anekdot & Evaluasi Capaian PAUD
CREATE TABLE IF NOT EXISTS daily_attendances (
    id VARCHAR(36) PRIMARY KEY,
    student_id VARCHAR(36) NOT NULL,
    class_id VARCHAR(36) NOT NULL,
    date DATE NOT NULL,
    status ENUM('HADIR', 'SAKIT', 'IZIN', 'ALPA') NOT NULL,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_attendance_student FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    CONSTRAINT fk_attendance_class FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE,
    UNIQUE KEY uq_student_date (student_id, date)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS anecdotal_records (
    id VARCHAR(36) PRIMARY KEY,
    student_id VARCHAR(36) NOT NULL,
    teacher_id VARCHAR(36) NOT NULL,
    date DATE NOT NULL,
    event_context TEXT NOT NULL,
    observed_behavior TEXT NOT NULL,
    analysis_interpretation TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_anecdote_student FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    CONSTRAINT fk_anecdote_teacher FOREIGN KEY (teacher_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS assessments (
    id VARCHAR(36) PRIMARY KEY,
    student_id VARCHAR(36) NOT NULL,
    semester VARCHAR(10) NOT NULL,
    academic_year VARCHAR(20) NOT NULL,
    aspect VARCHAR(50) NOT NULL,
    score ENUM('BB', 'MB', 'BSH', 'BSB') NOT NULL,
    teacher_notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_assessments_student FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    INDEX idx_assessment_period (student_id, academic_year, semester)
) ENGINE=InnoDB;

-- 6. Dokumen E-Rapor & Validasi Tanda Tangan Digital
CREATE TABLE IF NOT EXISTS report_cards (
    id VARCHAR(36) PRIMARY KEY,
    student_id VARCHAR(36) NOT NULL,
    class_id VARCHAR(36) NOT NULL,
    semester VARCHAR(10) NOT NULL,
    academic_year VARCHAR(20) NOT NULL,
    ai_generated_narrative TEXT,
    final_teacher_narrative TEXT,
    status ENUM('DRAFT', 'PENDING_VALIDATION', 'APPROVED', 'DISTRIBUTED') DEFAULT 'DRAFT',
    validated_by VARCHAR(36) NULL,
    validated_at DATETIME NULL,
    digital_signature_hash VARCHAR(255),
    pdf_filename VARCHAR(255),
    pdf_file_url TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_report_student FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    CONSTRAINT fk_report_class FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE,
    CONSTRAINT fk_report_validator FOREIGN KEY (validated_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_report_student_period (student_id, academic_year, semester)
) ENGINE=InnoDB;

-- 7. Log Pengiriman WhatsApp, Audit Trail & Whitelist
CREATE TABLE IF NOT EXISTS wa_delivery_logs (
    id VARCHAR(36) PRIMARY KEY,
    report_card_id VARCHAR(36) NOT NULL,
    student_id VARCHAR(36) NOT NULL,
    academic_year VARCHAR(20) NOT NULL,
    semester VARCHAR(10) NOT NULL,
    recipient_phone VARCHAR(20) NOT NULL,
    pdf_filename VARCHAR(255) NOT NULL,
    delivery_status ENUM('QUEUED', 'PROCESSING', 'SENT', 'DELIVERED', 'READ', 'FAILED') DEFAULT 'QUEUED',
    error_message TEXT,
    sent_at DATETIME NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_wa_log_report FOREIGN KEY (report_card_id) REFERENCES report_cards(id) ON DELETE CASCADE,
    CONSTRAINT fk_wa_log_student FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    INDEX idx_wa_delivery_period (academic_year, semester, delivery_status)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS audit_logs (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NULL,
    role VARCHAR(30) NOT NULL,
    school_id VARCHAR(36) NULL,
    action VARCHAR(100) NOT NULL,
    resource VARCHAR(100) NOT NULL,
    ip_address VARCHAR(45),
    user_agent TEXT,
    metadata JSON,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_audit_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT fk_audit_school FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS api_whitelists (
    id VARCHAR(36) PRIMARY KEY,
    label VARCHAR(100) NOT NULL,
    ip_or_cidr VARCHAR(50),
    domain_or_origin VARCHAR(150),
    port INT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_by VARCHAR(36) NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_whitelist_creator FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB;
