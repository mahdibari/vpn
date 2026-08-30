/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      {
        // این خط باعث میشه ارورهای مسیردهی پیش‌فرض نادیده گرفته بشن
        source: '/auth/:path*',
        destination: '/auth/:path*',
      },
    ]
  },
}

module.exports = nextConfig