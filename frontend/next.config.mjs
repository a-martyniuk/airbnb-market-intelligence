/** @type {import('next').NextConfig} */
const nextConfig = {
  // assetPrefix loads _next/ assets directly from the Vercel deployment URL
  // so the portfolio proxy (/airmarket) doesn't need to serve them.
  assetPrefix: process.env.NODE_ENV === 'production'
    ? 'https://airbnb-market-intelligence.vercel.app'
    : '',
};

export default nextConfig;
