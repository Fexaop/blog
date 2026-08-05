import type { NextConfig } from "next";

/**
 * Static export for GitHub Pages (and any static host).
 * `PAGES_BASE_PATH` is set by actions/configure-pages in CI so project sites
 * (user.github.io/repo) get the correct `/repo` prefix automatically.
 */
const nextConfig: NextConfig = {
  output: "export",
  images: {
    unoptimized: true,
  },
  trailingSlash: true,
  basePath: process.env.PAGES_BASE_PATH || undefined,
  assetPrefix: process.env.PAGES_BASE_PATH || undefined,
};

export default nextConfig;
