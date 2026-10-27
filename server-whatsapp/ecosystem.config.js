module.exports = {
  apps: [
    {
      name: 'wa-gateway',
      script: 'dist/server.js',
      watch: false,
      autorestart: true,
      max_memory_restart: '500M',
      env: {
        NODE_ENV: 'production',
      },
    },
  ],
};
