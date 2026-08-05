"use client";

import { useCallback, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import type { CrumbleTheme } from "@/lib/rough";
import { useRough } from "@/hooks/use-rough";

export interface RoughLineProps {
  className?: string;
  id?: string;
  length?: number;
  orientation?: "horizontal" | "vertical";
  stroke?: string;
  strokeWidth?: number;
  theme?: CrumbleTheme;
}

export function RoughLine({
  className,
  id,
  length,
  orientation = "horizontal",
  stroke,
  strokeWidth,
  theme: themeProp,
}: RoughLineProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { drawLine, svgRef, theme } = useRough({
    stableId: id,
    theme: themeProp,
    variant: "border",
  });

  const draw = useCallback(() => {
    const container = containerRef.current;
    const svg = svgRef.current;

    if (!container || !svg) return;

    svg.replaceChildren();

    const width = orientation === "horizontal" ? (length ?? container.offsetWidth) : 20;
    const height = orientation === "vertical" ? (length ?? container.offsetHeight) : 20;

    svg.setAttribute("width", String(width));
    svg.setAttribute("height", String(height));
    svg.setAttribute("viewBox", `0 0 ${width} ${height}`);

    const node =
      orientation === "horizontal"
        ? drawLine(2, 10, width - 2, 10, {
            stroke: stroke ?? "currentColor",
            strokeWidth,
          })
        : drawLine(10, 2, 10, height - 2, {
            stroke: stroke ?? "currentColor",
            strokeWidth,
          });

    if (node) {
      svg.appendChild(node);
    }
  }, [drawLine, length, orientation, stroke, strokeWidth, svgRef]);

  useEffect(() => {
    draw();
  }, [draw, theme]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new ResizeObserver(() => draw());
    observer.observe(container);

    return () => observer.disconnect();
  }, [draw]);

  return (
    <div
      ref={containerRef}
      className={cn(
        orientation === "horizontal" ? "w-full" : "h-full",
        className,
      )}
    >
      <svg ref={svgRef} aria-hidden="true" className="overflow-visible" />
    </div>
  );
}
