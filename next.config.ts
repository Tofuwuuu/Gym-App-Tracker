import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Docker uses the standalone server. Vercel expects the default output trace.
  output: process.env.VERCEL ? undefined : "standalone",
};

export default nextConfig;
