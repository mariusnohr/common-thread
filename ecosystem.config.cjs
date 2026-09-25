module.exports = {
  apps: [
    {
      name: "common-thread",
      cwd: __dirname,
      script: "node_modules/next/dist/bin/next",
      args: "start -p 3100",
      env: {
        NODE_ENV: "production",
        // DATABASE_URL, ADMIN_PASSWORD, SESSION_SECRET, LAUNCH_DATE and the AI
        // variables (ANTHROPIC_API_KEY / OPENAI_API_KEY, AI_MODEL) are
        // supplied by the deploy environment (see .env.example).
      },
    },
  ],
};
