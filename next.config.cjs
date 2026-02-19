/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: false, // Fix ESLint errors instead of ignoring
  },
  typescript: {
    ignoreBuildErrors: false, // Fix TypeScript errors instead of ignoring
  },
  reactStrictMode: true,
  
  // Optimized webpack configuration for production
  webpack: (config, { dev, isServer }) => {
    // Development optimizations
    if (dev) {
      config.cache = {
        type: 'memory',
      };
    }
    
    // Production optimizations
    if (!dev) {
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          chunks: 'all',
          cacheGroups: {
            vendor: {
              test: /[\\/]node_modules[\\/]/,
              name: 'vendors',
              chunks: 'all',
            },
          },
        },
      };
    }
    
    // Disable webpack cache for server-side compilation in development
    if (dev && isServer) {
      config.cache = false;
    }
    
    return config;
  },
  
  // Image optimization for VPS hosting
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
    // Optimize for VPS hosting
    formats: ['image/webp', 'image/avif'],
    minimumCacheTTL: 60,
  },
  
  // External packages configuration
  experimental: {
    serverComponentsExternalPackages: ['@prisma/client', 'bcrypt'],
    // Enable optimized package imports
    optimizePackageImports: ['lucide-react', '@radix-ui/react-icons'],
  },
  
  // VPS-optimized output (remove standalone for VPS)
  // output: 'standalone', // Remove this for VPS hosting
  
  // Add compression and performance optimizations
  compress: true,
  poweredByHeader: false,
  
  // Environment-specific configurations
  env: {
    CUSTOM_KEY: process.env.NODE_ENV,
  },
  
  // Add proper headers for VPS hosting
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

module.exports = nextConfig; 