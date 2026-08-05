/**
 * Faint graph-paper grid — same treatment as bydefaulthuman.fun hero.
 * No doodles, no hard shadows, no neo-brutal chrome.
 */

import { cn } from "@/lib/utils";

interface SketchBackgroundProps {
  className?: string;
  /** Extra-faint on dense content sections */
  faint?: boolean;
}

export function SketchBackground({
  className,
  faint = false,
}: SketchBackgroundProps) {
  return (
    <div
      aria-hidden
      className={cn(
        "pointer-events-none absolute inset-0 overflow-hidden",
        faint ? "opacity-[0.03]" : "opacity-[0.055]",
        className,
      )}
      style={{
        backgroundImage:
          "repeating-linear-gradient(0deg,currentColor 0,currentColor 1px,transparent 1px,transparent 40px)," +
          "repeating-linear-gradient(90deg,currentColor 0,currentColor 1px,transparent 1px,transparent 40px)",
      }}
    />
  );
}
