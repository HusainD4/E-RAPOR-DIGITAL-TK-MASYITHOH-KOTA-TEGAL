@echo off
echo ========================================================
echo Inisialisasi Database E-Rapor Digital TK Masyithoh
echo ========================================================
echo.

set DB_USER=root
set DB_PASS=
set DB_HOST=127.0.0.1
set DB_PORT=3306
set SQL_FILE=%~dp0database_schema.sql

echo [1/3] Menjalankan SQL DDL ke MySQL (XAMPP)...
mysql -h %DB_HOST% -P %DB_PORT% -u %DB_USER% < "%SQL_FILE%"
if %errorlevel% neq 0 (
    echo [INFO] Perintah 'mysql' CLI tidak ditemukan di PATH sistem.
    echo Menjalankan fallback menggunakan Prisma client...
)

cd /d "%~dp0.."
echo [2/3] Sinkronisasi Skema via Prisma...
call npm run prisma:push

echo [3/3] Menjalankan Data Awal (Seed)...
call npm run prisma:seed

echo.
echo ========================================================
echo Database db_erapor_masyithoh siap digunakan!
echo ========================================================
pause
