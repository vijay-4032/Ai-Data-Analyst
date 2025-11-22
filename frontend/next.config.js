/** @type {import('next').NextConfig} */
const nextConfig = {
    // Enable React strict mode for better development experience
    reactStrictMode: true,
  
    // Image optimization configuration
    images: {
      domains: ["localhost"],
      formats: ["image/avif", "image/webp"],
    },
  
    // Environment variables exposed to the browser
    env: {
      NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000",
      NEXT_PUBLIC_APP_NAME: "AI Analyst",
    },
  
    // Redirect API calls to Python backend in development
    async rewrites() {
      return [
        {
          source: "/api/v1/:path*",
          destination: `${process.env.BACKEND_URL || "http://localhost:8000"}/api/v1/:path*`,
        },
      ];
    },
  
    // Security headers
    async headers() {
      return [
        {
          source: "/:path*",
          headers: [
            {
              key: "X-Frame-Options",
              value: "DENY",
            },
            {
              key: "X-Content-Type-Options",
              value: "nosniff",
            },
            {
              key: "Referrer-Policy",
              value: "origin-when-cross-origin",
            },
          ],
        },
      ];
    },
  
    // Webpack configuration for handling specific file types
    webpack: (config) => {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
      };
      return config;
    },
  };
  
  module.exports = nextConfig;