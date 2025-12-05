const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  basePath: '/taskapp',
  assetPrefix: '/taskapp',
  output: 'export', // Static export for Firebase hosting
  images: {
    unoptimized: true, // Required for static export
  },
  trailingSlash: true, // Helps with Firebase hosting
};

module.exports = withPWA(nextConfig);

