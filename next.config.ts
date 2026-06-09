import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  webpack: (config, { isServer }) => {
    if (isServer) {
      // unpdf ships a self-contained serverless pdf.js build that never needs
      // the optional native `canvas` module; aliasing it to false keeps the
      // server bundle from trying to resolve it.
      config.resolve.alias = {
        ...config.resolve.alias,
        canvas: false,
      }
    }
    return config
  },
}

export default nextConfig
