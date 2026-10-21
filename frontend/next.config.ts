import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone", // image Docker kecil
  reactStrictMode: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
