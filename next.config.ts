import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // The deploy platform stages `.next/standalone` and runs its server.
  output: "standalone",
};

export default nextConfig;
