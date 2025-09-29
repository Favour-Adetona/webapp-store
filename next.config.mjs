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
}

export default nextConfig
