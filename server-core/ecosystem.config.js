module.exports = {
  apps: [
    {
      name: 'core-api',
      script: 'dist/src/main.js',
      watch: false,
      autorestart: true,
      max_memory_restart: '500M',
      env: {
        NODE_ENV: 'production',
      },
    },
  ],
};
