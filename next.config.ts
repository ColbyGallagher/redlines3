import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  reactStrictMode: false,
  experimental: {
    serverActions: {
      bodySizeLimit: '100mb',
    },
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  transpilePackages: ['@ifc-lite/viewer', '@ifc-lite/sdk', '@ifc-lite/core'],
  webpack: (config) => {
    // Treat .wasm files as assets, not modules
    config.module.rules.push({
      test: /\.wasm$/,
      type: 'asset/resource',
      generator: {
        filename: 'static/wasm/[name].[contenthash][ext]',
      },
    });

    config.resolve.alias = {
      ...config.resolve.alias,
      // Force parquet-wasm to use the ESM version which we patch in copy-ifc-wasm.js
      'parquet-wasm$': path.resolve(process.cwd(), 'node_modules/parquet-wasm/esm/arrow2.js'),
      'parquet-wasm/esm': path.resolve(process.cwd(), 'node_modules/parquet-wasm/esm'),
    };
    return config;
  },
};

export default nextConfig;
