/** Cross-site URLs for pwnhub portfolio ↔ blog */

export const PORTFOLIO_URL =
  process.env.NEXT_PUBLIC_PORTFOLIO_URL ?? "https://pwnhub.in";

export const BLOG_URL =
  process.env.NEXT_PUBLIC_BLOG_URL ?? "https://blog.pwnhub.in";

/**
 * Cross-origin handoff cannot use sessionStorage (different origins).
 * Use query param instead — readable on the destination host.
 */
export const XSITE_QUERY = "xsite";

export type XSiteDirection = "to-blog" | "to-portfolio";

export function withXSiteParam(url: string, direction: XSiteDirection): string {
  try {
    const u = new URL(url, typeof window !== "undefined" ? window.location.href : "https://pwnhub.in");
    u.searchParams.set(XSITE_QUERY, direction);
    return u.toString();
  } catch {
    const join = url.includes("?") ? "&" : "?";
    return `${url}${join}${XSITE_QUERY}=${encodeURIComponent(direction)}`;
  }
}

export function readAndClearXSiteParam(): XSiteDirection | null {
  if (typeof window === "undefined") return null;
  try {
    const u = new URL(window.location.href);
    const v = u.searchParams.get(XSITE_QUERY);
    if (v === "to-blog" || v === "to-portfolio") {
      u.searchParams.delete(XSITE_QUERY);
      const clean = u.pathname + u.search + u.hash;
      window.history.replaceState(null, "", clean || "/");
      return v;
    }
  } catch {
    /* ignore */
  }
  return null;
}
