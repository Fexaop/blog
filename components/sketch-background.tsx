"use client";

/**
 * Hand-drawn SVG background via bydefaulthuman useRough (pencil).
 * Sparse lines, circles, waves, sparks — not a wall of UI boxes.
 */

import { useCallback, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { useRough } from "@/hooks/use-rough";
import { stableSeed } from "@/lib/rough";

interface SketchBackgroundProps {
  className?: string;
  /** Quieter density for reading pages */
  faint?: boolean;
  density?: "hero" | "page" | "sparse";
}

export function SketchBackground({
  className,
  faint = false,
  density: densityProp,
}: SketchBackgroundProps) {
  const density = densityProp ?? (faint ? "sparse" : "page");
  const containerRef = useRef<HTMLDivElement>(null);
  const { drawCircle, drawLine, drawPath, svgRef, theme } = useRough({
    stableId: `bg-${density}`,
    theme: "pencil",
    variant: "border",
  });

  const draw = useCallback(() => {
    const container = containerRef.current;
    const svg = svgRef.current;
    if (!container || !svg) return;

    const w = container.offsetWidth;
    const h = container.offsetHeight;
    if (w < 8 || h < 8) return;

    svg.replaceChildren();
    svg.setAttribute("width", String(w));
    svg.setAttribute("height", String(h));
    svg.setAttribute("viewBox", `0 0 ${w} ${h}`);

    const stroke = "currentColor";
    const count = density === "hero" ? 16 : density === "page" ? 11 : 7;
    const rng = mulberry32(
      stableSeed(`layout-${density}-${Math.round(w / 80)}`),
    );

    for (let i = 0; i < count; i++) {
      const seed = stableSeed(`bg-${density}-${i}`);
      const roll = rng();
      const x = 20 + rng() * (w - 40);
      const y = 20 + rng() * (h - 40);

      if (roll < 0.34) {
        const len = 40 + rng() * 80;
        const ang = (rng() - 0.5) * 1.1;
        const node = drawLine(
          x,
          y,
          x + Math.cos(ang) * len,
          y + Math.sin(ang) * len,
          { seed, stroke, strokeWidth: 1.15 },
        );
        if (node) svg.appendChild(node);
      } else if (roll < 0.58) {
        const d = 14 + rng() * 30;
        const node = drawCircle(x, y, d, {
          seed,
          stroke,
          strokeWidth: 1,
          fill: "none",
        });
        if (node) svg.appendChild(node);
      } else if (roll < 0.8) {
        const ww = 48 + rng() * 70;
        const d = `M ${x} ${y} Q ${x + ww * 0.25} ${y - 9} ${x + ww * 0.5} ${y} T ${x + ww} ${y + 1}`;
        const node = drawPath(d, {
          seed,
          stroke,
          strokeWidth: 1.1,
          fill: "none",
        });
        if (node) svg.appendChild(node);
      } else {
        const s = 5 + rng() * 8;
        const d = `M ${x} ${y - s} L ${x} ${y + s} M ${x - s} ${y} L ${x + s} ${y} M ${x - s * 0.7} ${y - s * 0.7} L ${x + s * 0.7} ${y + s * 0.7} M ${x + s * 0.7} ${y - s * 0.7} L ${x - s * 0.7} ${y + s * 0.7}`;
        const node = drawPath(d, {
          seed,
          stroke,
          strokeWidth: 0.95,
          fill: "none",
        });
        if (node) svg.appendChild(node);
      }
    }
  }, [density, drawCircle, drawLine, drawPath, svgRef]);

  useEffect(() => {
    const id = requestAnimationFrame(() => draw());
    return () => cancelAnimationFrame(id);
  }, [draw, theme]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => draw());
    ro.observe(el);
    return () => ro.disconnect();
  }, [draw]);

  return (
    <div
      ref={containerRef}
      aria-hidden
      className={cn(
        "pointer-events-none absolute inset-0 overflow-hidden text-purple",
        density === "hero" && "opacity-[0.16]",
        density === "page" && "opacity-[0.12]",
        density === "sparse" && "opacity-[0.09]",
        className,
      )}
    >
      <svg ref={svgRef} className="h-full w-full overflow-visible" aria-hidden />
    </div>
  );
}

function mulberry32(seed: number) {
  let s = seed;
  return () => {
    s |= 0;
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
