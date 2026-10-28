import { IMAGE_BASE } from "./lib/images.js";

/** @type {import('next').NextConfig} */
const nextConfig = {
  // project screenshots are uploaded to S3 from the dashboard
  images: {
    remotePatterns: [new URL(`${IMAGE_BASE}**`)],
  },
  // the site as markdown for language models, built from the database (pages/api/llm.js)
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
