/** Cross-site URLs for pwnhub portfolio ↔ blog */

export const PORTFOLIO_URL =
  process.env.NEXT_PUBLIC_PORTFOLIO_URL ?? "https://pwnhub.in";

export const BLOG_URL =
  process.env.NEXT_PUBLIC_BLOG_URL ?? "https://blog.pwnhub.in";

/** sessionStorage key for silent cross-site handoff */
export const XSITE_KEY = "pwnhub-xsite";

export type XSiteDirection = "to-blog" | "to-portfolio";
