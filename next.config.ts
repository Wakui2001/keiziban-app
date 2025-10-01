import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    // Vercelでのビルド時にLintエラーを無視する設定
    ignoreDuringBuilds: true,
  },
  /* config options here */
};

export default nextConfig;
