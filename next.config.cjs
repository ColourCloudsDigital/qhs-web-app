/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: true,
  // Workaround for Webpack caching errors in development mode
  webpack: (config, { dev, isServer }) => {
    // Only apply in development mode
    if (dev) {
      // Use memory cache instead of pack for development to avoid filesystem issues
      config.cache = {
        type: 'memory',
      };
    }
    
    // Disable the webpack cache for server-side compilation in development
    if (dev && isServer) {
      config.cache = false;
    }
    
    return config;
  },
  images: {
    domains: ['localhost', 'qarashotels.com.ng', 'qarashotels.com'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
      {
        protocol: 'http',
        hostname: '**',
      },
    ],
  },
  experimental: {
    serverComponentsExternalPackages: ['@prisma/client', 'bcrypt'],
  },
  output: 'standalone',
};

module.exports = nextConfig; 