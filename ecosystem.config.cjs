/**
 * PM2 process definition for the VPS.
 *
 * Usage on the server:
 *   pm2 start ecosystem.config.cjs
 *   pm2 save && pm2 startup     # survive a reboot
 *   pm2 logs yt-onyx
 *
 * One instance only: the SQLite database is a single file and the rate
 * limiter keeps its counters in memory, so clustering would split both.
 * If you ever need more throughput, move to PostgreSQL first (see README).
 */
module.exports = {
  apps: [
    {
      name: "yt-onyx",
      script: "node_modules/next/dist/bin/next",
      args: "start --port 3000",
      cwd: __dirname,
      instances: 1,
      exec_mode: "fork",
      autorestart: true,
      max_memory_restart: "600M",
      env: {
        NODE_ENV: "production",
        PORT: "3000",
      },
      // .env is read by Next itself; nothing secret belongs in this file.
      out_file: "./logs/out.log",
      error_file: "./logs/error.log",
      merge_logs: true,
      time: true,
    },
  ],
};
