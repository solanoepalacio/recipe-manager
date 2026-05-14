import type { NextConfig } from 'next';

const apiInternalUrl = process.env.INTERNAL_API_URL ?? 'http://localhost:3001';

const nextConfig: NextConfig = {
  images: {
    // Uploads are served directly by Caddy → API; the Next.js image optimizer
    // can't reliably reach them via its internal loopback fetch in Docker.
    unoptimized: true,
  },
  async rewrites() {
    return [
      { source: '/api/:path*', destination: `${apiInternalUrl}/api/:path*` },
    ];
  },
};

export default nextConfig;
