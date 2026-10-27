@echo off
title E-Rapor Digital TK Masyithoh - PRODUCTION Launcher
color 0B
echo.
echo  =====================================================
echo   E-Rapor Digital TK Masyithoh Kota Tegal
echo   Mode: PRODUCTION (PM2)
echo  =====================================================
echo.

REM Pastikan pm2 tersedia
where pm2 >nul 2>nul
if %ERRORLEVEL% neq 0 (
  echo  [ERROR] PM2 tidak ditemukan! Install dengan:
  echo         npm install -g pm2
  pause
  exit /b 1
)

echo  Menjalankan semua layanan via PM2...
pm2 start "%~dp0ecosystem.config.js"

echo.
pm2 status

echo.
echo  =====================================================
echo   Perintah berguna:
echo   pm2 status          - Lihat status semua app
echo   pm2 logs core-api   - Log server-core
echo   pm2 logs wa-gateway - Log server-whatsapp
echo   pm2 monit           - Monitor CPU dan RAM
echo   pm2 stop all        - Hentikan semua app
echo  =====================================================
echo.
pause
