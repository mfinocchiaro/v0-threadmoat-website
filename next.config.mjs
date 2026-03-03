/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    unoptimized: true,
  },
  // Ensure the CSV data file is bundled with the analytics serverless function on Vercel
  experimental: {
    outputFileTracingIncludes: {
      '/dashboard/analytics': ['./app/dashboard/analytics/*.csv'],
    },
  },
}

export default nextConfig
