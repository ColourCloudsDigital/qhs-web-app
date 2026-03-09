/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: false,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  reactStrictMode: true,
  // swcMinify is now the default; property can be safely removed

  // Updated Image optimization
  images: {
    formats: ['image/webp', 'image/avif'],
    minimumCacheTTL: 60,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'qarashotels.com.ng',
      },
      {
        protocol: 'https',
        hostname: 'qarashotels.com',
      },
      {
        protocol: 'http', // Keep for local dev if needed
        hostname: 'localhost',
        port: '3000',
      },
      // Note: Keeping wildcard patterns allows images from ANY source.
      // For better security, restrict these to your specific CDN/S3 bucket.
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },

  // External packages configuration
  experimental: {
    serverComponentsExternalPackages: ['bcrypt', 'mysql2'],
  },

  compress: true,
  poweredByHeader: false,
  output: 'standalone',

  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
        ],
      },
    ];
  },
};

export default nextConfig;