/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // Ensure the CSV data file is bundled with the analytics serverless function on Vercel
  outputFileTracingIncludes: {
    '/dashboard/analytics': ['./app/dashboard/analytics/*.csv'],
  },
}

export default nextConfig
