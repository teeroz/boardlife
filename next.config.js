/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  images: {
    domains: ['boardlife.co.kr'],
    unoptimized: true, // 도커 환경에서 이미지 최적화를 비활성화
  },
  serverExternalPackages: ['cheerio', 'parse5', 'htmlparser2', 'entities'],
}

module.exports = nextConfig 