"use client";

import { useEffect } from "react";
import { playPacmanTransition, consumeXSiteArrival } from "@/lib/pacman-transition";
import { PORTFOLIO_URL } from "@/lib/site";
import { Button } from "@/components/ui/button";

/** Runs on every blog page: soft-land after Pac-Man handoff (no loader flash). */
export function XSiteArrival() {
  useEffect(() => {
    const dir = consumeXSiteArrival();
    if (!dir) return;
    // Brief black veil that fades so browser paint isn't a white flash
    const veil = document.createElement("div");
    veil.style.cssText =
      "position:fixed;inset:0;z-index:99999;background:#000;pointer-events:none;transition:opacity .45s ease";
    document.body.appendChild(veil);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        veil.style.opacity = "0";
      });
    });
    window.setTimeout(() => veil.remove(), 500);
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
