module.exports = {
  apps: [
    {
      name: "common-thread",
      cwd: __dirname,
      script: "node_modules/next/dist/bin/next",
      args: "start -p 3100",
      env: {
        NODE_ENV: "production",
        // DATABASE_URL, ADMIN_PASSWORD, SESSION_SECRET, OPENCODE_URL and
        // LAUNCH_DATE are supplied by the deploy environment (see .env.example).
      },
    },
    {
      name: "common-thread-opencode",
      script: "opencode",
      // Bound to loopback only: this server can run tools and must never be
      // reachable from the internet.
      args: "serve --port 4096 --hostname 127.0.0.1", // Phase 4
    },
  ],
};
