import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow larger file uploads (10 MB)
  experimental: {
    serverActions: {
      bodySizeLimit: "11mb",
    },
  },
};

export default nextConfig;
