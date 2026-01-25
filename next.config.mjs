/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // Optimizar el output para Vercel
  output: 'standalone',
  serverExternalPackages: ['@napi-rs/canvas'],
}

export default nextConfig
