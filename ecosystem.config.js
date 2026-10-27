const path = require('path');

module.exports = {
  apps: [
    {
      name: 'core-api',
      cwd: path.join(__dirname, 'server-core'),
      script: 'dist/src/main.js',
      exec_mode: 'fork',    // Aktifkan cluster mode untuk membagi beban ke banyak core
      instances: 1,            // Alokasikan 4 worker (sesuaikan jika ingin 2 atau 4 core)
      watch: false,
      autorestart: true,
      max_memory_restart: '500M',
      env: {
        NODE_ENV: 'development', // Ubah ke production agar performa NestJS optimal
      },
    },
    {
      name: 'wa-gateway',
      cwd: path.join(__dirname, 'server-whatsapp'),
      script: 'dist/server.js',
      exec_mode: 'fork',       // Wajib FORK mode untuk Baileys agar sesi WhatsApp tidak konflik
      instances: 1,            // Tetap 1 instance
      watch: false,
      autorestart: true,
      max_memory_restart: '500M',
      env: {
        NODE_ENV: 'development',
      },
    },
  ],
};