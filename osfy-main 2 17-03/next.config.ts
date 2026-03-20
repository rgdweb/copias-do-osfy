import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  // Garantir que o prisma seja incluído no standalone
  serverExternalPackages: ['@prisma/client', 'prisma'],
};

export default nextConfig;
