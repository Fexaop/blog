/** Cross-site URLs for pwnhub portfolio ↔ blog */

export const PORTFOLIO_URL =
  process.env.NEXT_PUBLIC_PORTFOLIO_URL ?? "https://pwnhub.in";

export const BLOG_URL =
  process.env.NEXT_PUBLIC_BLOG_URL ?? "https://blog.pwnhub.in";

/**
 * Cross-origin handoff (blog.pwnhub.in ↔ pwnhub.in):
 * - query param works on any host
 * - cookie Domain=.pwnhub.in is shared across subdomains
 * sessionStorage does NOT work across origins.
 */
export const XSITE_QUERY = "xsite";
export const XSITE_COOKIE = "pwnhub_xsite";

export type XSiteDirection = "to-blog" | "to-portfolio";

export function setXSiteHandoff(direction: XSiteDirection): void {
  if (typeof document === "undefined") return;
  try {
    // Shared across blog.pwnhub.in and pwnhub.in
    document.cookie = `${XSITE_COOKIE}=${encodeURIComponent(direction)}; Domain=.pwnhub.in; Path=/; Max-Age=90; SameSite=Lax`;
  } catch {
    /* ignore */
  }
  try {
    // Fallback for localhost / same-origin testing
    sessionStorage.setItem(XSITE_COOKIE, direction);
  } catch {
    /* ignore */
  }
}

export function withXSiteParam(url: string, direction: XSiteDirection): string {
  setXSiteHandoff(direction);
  try {
    const u = new URL(
      url,
      typeof window !== "undefined" ? window.location.href : "https://pwnhub.in",
    );
    u.searchParams.set(XSITE_QUERY, direction);
    return u.toString();
  } catch {
    const join = url.includes("?") ? "&" : "?";
    return `${url}${join}${XSITE_QUERY}=${encodeURIComponent(direction)}`;
  }
}

function readCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const parts = document.cookie.split(";").map((s) => s.trim());
  for (const p of parts) {
    if (p.startsWith(name + "=")) {
      return decodeURIComponent(p.slice(name.length + 1));
    }
  }
  return null;
}

function clearCookie(name: string): void {
  try {
    document.cookie = `${name}=; Domain=.pwnhub.in; Path=/; Max-Age=0; SameSite=Lax`;
    document.cookie = `${name}=; Path=/; Max-Age=0; SameSite=Lax`;
  } catch {
    /* ignore */
  }
}

/** Call on blog arrival */
export function readAndClearXSiteParam(): XSiteDirection | null {
  if (typeof window === "undefined") return null;
  let found: XSiteDirection | null = null;

  try {
    const u = new URL(window.location.href);
    const v = u.searchParams.get(XSITE_QUERY);
    if (v === "to-blog" || v === "to-portfolio") {
      found = v;
      u.searchParams.delete(XSITE_QUERY);
      const clean = u.pathname + u.search + u.hash;
      window.history.replaceState(null, "", clean || "/");
    }
  } catch {
    /* ignore */
  }

  if (!found) {
    const c = readCookie(XSITE_COOKIE);
    if (c === "to-blog" || c === "to-portfolio") found = c;
  }

  if (!found) {
    try {
      const s = sessionStorage.getItem(XSITE_COOKIE);
      if (s === "to-blog" || s === "to-portfolio") found = s;
    } catch {
      /* ignore */
    }
  }

  if (found) {
    clearCookie(XSITE_COOKIE);
    try {
      sessionStorage.removeItem(XSITE_COOKIE);
    } catch {
      /* ignore */
    }
  }

  return found;
}
