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
  // Don't set assetPrefix for Electron - use default relative paths
  trailingSlash: true,
  distDir: process.env.ELECTRON ? 'out' : '.next',
  webpack: (config, { isServer, webpack }) => {
    // Exclude better-sqlite3 from web builds (it's Node.js only)
    if (!isServer && !process.env.ELECTRON) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        crypto: false,
      }
      
      // Ignore better-sqlite3 and related Node.js modules in web builds
      config.plugins.push(
        new webpack.IgnorePlugin({
          resourceRegExp: /^(better-sqlite3|fs|path|crypto)$/,
        })
      )
      
      // Also add to externals to prevent bundling
      config.externals = config.externals || []
      if (Array.isArray(config.externals)) {
        config.externals.push('better-sqlite3')
      } else {
        config.externals = [config.externals, 'better-sqlite3']
      }
    }
    
    return config
  },
}

export default nextConfig
