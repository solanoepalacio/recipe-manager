import type { NextConfig } from 'next';

const apiInternalUrl = process.env.INTERNAL_API_URL ?? 'http://localhost:3001';

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      { source: '/api/:path*', destination: `${apiInternalUrl}/api/:path*` },
      { source: '/uploads/:path*', destination: `${apiInternalUrl}/uploads/:path*` },
    ];
  },
};

export default nextConfig;
