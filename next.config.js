/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Enable client-side environment variables
  env: {
    GEMINI_API_KEY: process.env.GEMINI_API_KEY,
  },
};

module.exports = nextConfig;

