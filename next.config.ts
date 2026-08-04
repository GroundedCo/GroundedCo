import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  output: 'standalone',
  images: {
    minimumCacheTTL: 86400, // cache optimised images for 24h (default 60s)
    qualities: [75, 90], // 90 for the full-bleed hero; 75 stays the default elsewhere
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'grounded-api.app.vazhemadom.com',
      },
    ],
  },
}

export default nextConfig
