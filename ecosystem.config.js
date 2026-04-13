module.exports = {
  apps: [
    {
      name: 'unione-api',
      script: 'src/server.js',
      instances: 'max', // Auto-scale to CPU cores
      exec_mode: 'cluster',
      max_memory_restart: '500M',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
      // Logging
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      error_file: './logs/pm2-error.log',
      out_file: './logs/pm2-out.log',
      merge_logs: true,

      // Auto-restart
      min_uptime: '10s',
      max_restarts: 10,

      // Health check
      wait_ready: true,
      listen_timeout: 10000,
      kill_timeout: 5000,
    },
    {
      name: 'unione-worker',
      script: 'src/workers/queueWorker.js',
      instances: 2,
      exec_mode: 'fork',
      max_memory_restart: '300M',
      env: {
        NODE_ENV: 'production',
      },
      // Logging
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      error_file: './logs/pm2-worker-error.log',
      out_file: './logs/pm2-worker-out.log',
      merge_logs: true,

      // Auto-restart
      min_uptime: '10s',
      max_restarts: 10,
    },
  ],
};
