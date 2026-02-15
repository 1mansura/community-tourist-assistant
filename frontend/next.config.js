/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  devIndicators: false,
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
      },
      {
        protocol: 'http',
        hostname: 'minio',
      },
      {
        protocol: 'http',
        hostname: 'backend',
      },
    ],
  },
  async rewrites() {
    const internalBase = process.env.INTERNAL_API_URL?.replace('/api', '');
    const publicBase = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '');
    const backendUrl = internalBase || publicBase || 'http://localhost:8000';
    return [
      {
        source: '/media/:path*',
        destination: `${backendUrl}/media/:path*`,
      },
      {
        source: '/api/media/:path*',
        destination: `${backendUrl}/media/:path*`,
      },
      {
        source: '/api/users/leaderboard',
        destination: `${backendUrl}/api/users/leaderboard/`,
      },
    ];
  },
};

module.exports = nextConfig;
