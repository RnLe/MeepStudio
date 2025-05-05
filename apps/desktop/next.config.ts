import { NextConfig } from 'next';

const nextConfig: NextConfig = {
  output: 'export',   // Only affects next build, not next dev
  trailingSlash: true,
  experimental: {
    serverActions: {
      bodySizeLimit: '200mb',
    },
  },
  serverExternalPackages: ['pino'],
  // ...other existing properties...

  webpack(config, { isServer }) {
    // 1) Stub out all `require('canvas')` calls to an empty module
    config.resolve.fallback = {
      ...(config.resolve.fallback || {}),
      canvas: false,
    };

    if (!isServer) {
      // 2) Alias both the package root and the specific Core.js import
      config.resolve.alias = {
        ...(config.resolve.alias || {}),
        // All `import 'konva'` → browser bundle
        konva$: require.resolve('konva/konva.min.js'),
        // Any sub-path like 'konva/lib/Core.js' → same bundle
        'konva/lib/Core.js': require.resolve('konva/konva.min.js'),
      };
    }

    return config;
  },
};

export default nextConfig;