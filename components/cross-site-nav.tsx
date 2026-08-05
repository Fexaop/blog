"use client";

import { useEffect } from "react";
import { playPacmanTransition, consumeXSiteArrival } from "@/lib/pacman-transition";
import { PORTFOLIO_URL } from "@/lib/site";
import { Button } from "@/components/ui/button";

/** Soft-land after Pac-Man handoff (query param ?xsite=…) */
export function XSiteArrival() {
  useEffect(() => {
    const dir = consumeXSiteArrival();
    if (!dir) return;
    // Cover first paint, then fade
    const veil = document.createElement("div");
    veil.id = "pwnhub-arrival-veil";
    veil.style.cssText =
      "position:fixed;inset:0;z-index:99999;background:#000;pointer-events:none;opacity:1;transition:opacity .4s ease";
    document.body.appendChild(veil);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        veil.style.opacity = "0";
      });
    });
    window.setTimeout(() => veil.remove(), 450);
  }, []);
  return null;
}

export function PortfolioButton({ className }: { className?: string }) {
  return (
    <Button
      type="button"
      size="sm"
      theme="ink"
      className={className}
      onClick={() => playPacmanTransition(PORTFOLIO_URL, "to-portfolio")}
      aria-label="Go to portfolio on pwnhub.in"
    >
      Portfolio →
    </Button>
  );
}
