/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable server components experimental features for native modules
  experimental: {
    serverComponentsExternalPackages: ['@resvg/resvg-js'],
  },
  webpack: (config, { isServer }) => {
    // Fix for Konva/react-konva SSR issues
    if (isServer) {
      config.externals = [...(config.externals || []), 'canvas', 'konva'];
    }

    // Handle native modules for @resvg/resvg-js
    config.resolve.alias = {
      ...config.resolve.alias,
    };

    // Ignore .node files in webpack
    config.module.rules.push({
      test: /\.node$/,
      loader: 'node-loader',
    });

    return config;
  },
};

export default nextConfig;
