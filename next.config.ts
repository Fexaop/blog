import type { NextConfig } from "next";

/**
 * Static export for GitHub Pages + custom domain blog.pwnhub.in.
 * Custom domain → always root path (no /repo prefix).
 * Set FORCE_PAGES_BASE_PATH only if you deploy without CNAME.
 */
const useCustomDomain = true;
const basePath =
  useCustomDomain
    ? undefined
    : process.env.PAGES_BASE_PATH || undefined;

const nextConfig: NextConfig = {
  output: "export",
  images: {
    unoptimized: true,
  },
  trailingSlash: true,
  basePath,
  assetPrefix: basePath,
};

export default nextConfig;
