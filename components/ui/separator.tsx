"use client";

import { useCallback, useEffect, useRef } from "react";
import { useRough } from "@/hooks/use-rough";
import { cn } from "@/lib/utils";
import {
  resolveRoughVars,
  type CrumbleColorProps,
  type CrumbleTheme,
} from "@/lib/rough";

export interface SeparatorProps extends CrumbleColorProps {
  className?: string;
  id?: string;
  label?: string;
  orientation?: "horizontal" | "vertical";
  theme?: CrumbleTheme;
}

export function Separator({
  className,
  fill,
  id,
  label,
  orientation = "horizontal",
  stroke,
  strokeMuted,
  theme: themeProp,
}: SeparatorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const externalSvgRef = useRef<SVGSVGElement>(null);
  const sepId = id ?? "separator";
  const roughStyle = resolveRoughVars({ stroke, strokeMuted, fill });
  const { drawLine, svgRef } = useRough({
    stableId: sepId,
    svgRef: externalSvgRef,
    theme: themeProp,
    variant: "border",
  });

  const draw = useCallback(() => {
    const container = containerRef.current;
    const svg = svgRef.current;
    if (!container || !svg) return;

    svg.replaceChildren();

    const isH = orientation === "horizontal";
    const w = isH ? container.offsetWidth : 20;
    const h = isH ? 20 : container.offsetHeight;

    svg.setAttribute("width", String(w));
    svg.setAttribute("height", String(h));
    svg.setAttribute("viewBox", `0 0 ${w} ${h}`);

    if (isH && label) {
      const mid = w / 2;
      const gap = 8;
      const labelW = label.length * 7 + 16;
      const left = drawLine(2, 10, mid - labelW / 2 - gap, 10, {
        stroke: "var(--cr-stroke-muted)",
      });
      const right = drawLine(mid + labelW / 2 + gap, 10, w - 2, 10, {
        stroke: "var(--cr-stroke-muted)",
      });
      if (left) svg.appendChild(left);
      if (right) svg.appendChild(right);
    } else if (isH) {
      const line = drawLine(2, 10, w - 2, 10, {
        stroke: "var(--cr-stroke-muted)",
      });
      if (line) svg.appendChild(line);
    } else {
      const line = drawLine(10, 2, 10, h - 2, {
        stroke: "var(--cr-stroke-muted)",
      });
      if (line) svg.appendChild(line);
    }
  }, [drawLine, label, orientation, svgRef]);

  useEffect(() => {
    const id = requestAnimationFrame(() => draw());
    return () => cancelAnimationFrame(id);
  }, [draw]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const ro = new ResizeObserver(() => draw());
    ro.observe(container);
    return () => ro.disconnect();
  }, [draw]);

  const isH = orientation === "horizontal";

  return (
    <div
      ref={containerRef}
      role="separator"
      aria-orientation={orientation}
      className={cn(
        "relative flex items-center",
        isH ? "w-full" : "h-full flex-col",
        className,
      )}
      style={roughStyle}
    >
      <svg
        ref={externalSvgRef}
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 overflow-visible"
      />
      {label ? (
        <span className="relative bg-background px-2 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
          {label}
        </span>
      ) : null}
    </div>
  );
}
