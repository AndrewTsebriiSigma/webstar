/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Disable source maps completely to avoid permission issues
  productionBrowserSourceMaps: false,
  // Reduce file watching overhead and fix permission issues
  webpack: (config, { isServer, dev }) => {
    if (!isServer) {
      // Use polling instead of native file watching to avoid EMFILE errors
      config.watchOptions = {
        poll: 2000,
        aggregateTimeout: 500,
        ignored: ['**/node_modules/**', '**/.git/**', '**/.next/**'],
      };
      
      // Disable source maps in development to avoid permission issues
      if (dev) {
        // Don't set devtool to false - Next.js will override it, but we can reduce file watching
        config.optimization = {
          ...config.optimization,
          minimize: false,
        };
      }
    }
    return config;
  },
  images: {
    domains: [
      'localhost',
      '127.0.0.1',
      'webstar-backend.onrender.com',
      // Add your production backend domain here
    ],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.onrender.com',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
      },
    ],
  },
  async rewrites() {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
    return [
      {
        source: '/api/:path*',
        destination: `${apiUrl}/api/:path*`,
      },
    ];
  },
  // Output configuration for static export (optional)
  // output: 'standalone', // Uncomment if using standalone output
};

module.exports = nextConfig;

