/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    domains: ['placeholder.com', 'sites.psu.edu', 'images.unsplash.com', 'via.placeholder.com', 'picsum.photos'],
    unoptimized: true,
  },
  // For Electron compatibility
  output: process.env.ELECTRON ? 'export' : undefined,
  basePath: process.env.ELECTRON ? '' : undefined,
  assetPrefix: process.env.ELECTRON ? '/' : undefined,
  trailingSlash: true,
}

export default nextConfig
