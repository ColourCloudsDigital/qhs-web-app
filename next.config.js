/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: false,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: true,

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
        protocol: 'http', 
        hostname: 'localhost',
        port: '3000',
      },
      // Note: While valid in newer versions, a blanket wildcard can sometimes 
      // cause validation issues depending on your hosting provider.
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },

  // External packages for server components (Next.js 14 syntax)
  experimental: {
    serverComponentsExternalPackages: ['bcrypt', 'mysql2'],
  },

  compress: true,
  poweredByHeader: false,
  
  // Note: Only keep 'standalone' if deploying to Docker/custom VPS. 
  // If deploying to Vercel or Netlify, you should comment this out.
  output: 'standalone',

  async headers() {
    return [
      {
        // FIXED: Updated regex syntax for Next.js routing
        source: '/:path*', 
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