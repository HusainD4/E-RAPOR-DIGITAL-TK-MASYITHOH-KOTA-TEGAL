# 1. Pindah ke direktori server-core
cd "c:\0 SKRIPSI\E-RAPOR YAYASAN TK MASYITHOH KOTA TEGAL\Server E-Rapor Digital TK Masyithoh\server\server-core"
# 2. Sinkronisasi skema Prisma ke database
npm run prisma:generate
npm run prisma:push
# 3. (Opsional) Jalankan database seeding jika data awal diperlukan
npm run prisma:seed
# 4. Jalankan server dalam mode development
npm run start:dev
# 5. Jalankan seluruh proses inisialisasi database (generate + push schema + seeding) sekaligus:
npm run db:setup
# 6. Atau jalankan batch script inisialisasi:
.\prisma\init_db.bat
# 7. Jika ingin reset database ke kondisi awal dari nol:
npm run db:reset
