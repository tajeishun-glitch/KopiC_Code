/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    unoptimized: true
  },
  eslint: {
    // Ensures cloud CI/CD platforms (Vercel, Render, Railway, AWS) build smoothly without interactive prompts
    ignoreDuringBuilds: true
  }
};

export default nextConfig;
