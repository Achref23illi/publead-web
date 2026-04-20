import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  experimental: {
    // Enable optimistic client cache for faster route transitions
    optimisticClientCache: true,
  },
};

export default nextConfig;
