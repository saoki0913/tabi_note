/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, { isServer }) => {
    // Fix for Konva/react-konva SSR issues
    if (isServer) {
      config.externals = [...(config.externals || []), 'canvas', 'konva'];
    }
    return config;
  },
};

export default nextConfig;
