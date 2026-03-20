import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  serverExternalPackages: ['@prisma/client', 'prisma'],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'sorteiomax.com.br',
      },
      {
        protocol: 'https',
        hostname: '*.sorteiomax.com.br',
      },
    ],
  },
};

export default nextConfig;
