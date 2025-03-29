/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: process.env.NODE_ENV === 'production'
          ? `${process.env.POSTGREST_URL}/:path*`  // Production PostgREST URL
          : 'http://localhost:3000/:path*'  // Development PostgREST URL
      }
    ]
  }
}

module.exports = nextConfig




