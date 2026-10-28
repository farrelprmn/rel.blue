import { IMAGE_BASE } from "./lib/images.js";

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [new URL(`${IMAGE_BASE}**`)],
  },
  async rewrites() {
    return [
      { source: "/llm.md", destination: "/api/llm" },
      { source: "/llms.txt", destination: "/api/llm" },
    ];
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  reactStrictMode: true,
};

export default nextConfig;
