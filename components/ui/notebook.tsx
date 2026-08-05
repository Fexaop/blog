"use client";

import { useCallback, useEffect, useRef, type HTMLAttributes } from "react";
import { useRough } from "@/hooks/use-rough";
import { cn } from "@/lib/utils";
import {
  resolveRoughVars,
  stableSeed,
  type CrumbleColorProps,
  type CrumbleTheme,
} from "@/lib/rough";

export interface NotebookProps
  extends HTMLAttributes<HTMLDivElement>, CrumbleColorProps {
  id?: string;
  lineColor?: string;
  lineSpacing?: number;
  marginColor?: string;
  showMargin?: boolean;
  theme?: CrumbleTheme;
}

export function Notebook({
  children,
  className,
  fill,
  id,
  lineColor,
  lineSpacing = 24,
  marginColor,
  showMargin = true,
  stroke,
  strokeMuted,
  style,
  theme: themeProp,
  ...props
}: NotebookProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const linesCanvasRef = useRef<SVGSVGElement>(null);
  const borderSvgRef = useRef<SVGSVGElement>(null);
  const notebookId = id ?? "notebook";
  const { drawRect: drawBorder, theme } = useRough({
    variant: "border",
    stableId: notebookId,
    svgRef: borderSvgRef,
    theme: themeProp,
  });
  const { drawLine: drawRuledLine } = useRough({
    variant: "border",
    svgRef: linesCanvasRef,
    theme: themeProp,
  });
  const roughStyle = resolveRoughVars({ stroke, strokeMuted, fill });

  const MARGIN_X = showMargin ? 40 : 0;

  const draw = useCallback(() => {
    const container = containerRef.current;
    const linesSvg = linesCanvasRef.current;
    const borderSvg = borderSvgRef.current;
    if (!container || !linesSvg || !borderSvg) return;

    const w = container.offsetWidth;
    const h = container.offsetHeight;

    const lc =
      lineColor ??
      (theme === "ink"
        ? "oklch(0.75 0.06 240 / 40%)"
        : "oklch(0.72 0.06 240 / 35%)");
    const mc = marginColor ?? "oklch(0.70 0.14 20 / 50%)";

    // Border
    borderSvg.replaceChildren();
    borderSvg.setAttribute("width", String(w));
    borderSvg.setAttribute("height", String(h));
    borderSvg.setAttribute("viewBox", `0 0 ${w} ${h}`);
    const borderEl = drawBorder(1, 1, w - 2, h - 2, {
      fill: "none",
      stroke: "var(--cr-stroke-muted)",
      strokeWidth: theme === "crayon" ? 2 : 1,
    });
    if (borderEl) borderSvg.appendChild(borderEl);

    // Ruled lines + margin
    linesSvg.replaceChildren();
    linesSvg.setAttribute("width", String(w));
    linesSvg.setAttribute("height", String(h));
    linesSvg.setAttribute("viewBox", `0 0 ${w} ${h}`);
    // Draw horizontal ruled lines starting after header area
    const startY = lineSpacing + 8;
    for (let y = startY; y < h - 8; y += lineSpacing) {
      const lineEl = drawRuledLine(8, y, w - 8, y, {
        seed: stableSeed(`${notebookId}-line-${Math.round(y)}`),
        roughness: theme === "pencil" ? 0.3 : theme === "ink" ? 0.1 : 0.5,
        stroke: lc,
        strokeWidth: 0.6,
      });
      if (lineEl) linesSvg.appendChild(lineEl);
    }

    // Margin vertical line
    if (showMargin) {
      const marginLine = drawRuledLine(MARGIN_X, 8, MARGIN_X, h - 8, {
        seed: stableSeed(`${notebookId}-margin`),
        roughness: theme === "pencil" ? 0.4 : 0.2,
        stroke: mc,
        strokeWidth: theme === "crayon" ? 1.5 : 0.8,
      });
      if (marginLine) linesSvg.appendChild(marginLine);
    }
  }, [
    MARGIN_X,
    drawBorder,
    drawRuledLine,
    lineColor,
    lineSpacing,
    marginColor,
    notebookId,
    showMargin,
    theme,
  ]);

  useEffect(() => {
    const rid = requestAnimationFrame(() => draw());
    return () => cancelAnimationFrame(rid);
  }, [draw]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const ro = new ResizeObserver(() => draw());
    ro.observe(container);
    return () => ro.disconnect();
  }, [draw]);

  return (
    <div
      ref={containerRef}
      className={cn("relative min-h-[200px] bg-background", className)}
      style={{ ...roughStyle, ...style }}
      {...props}
    >
      {/* Ruled lines layer (behind content) */}
      <svg
        ref={linesCanvasRef}
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 overflow-visible"
      />
      {/* Border layer */}
      <svg
        ref={borderSvgRef}
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 h-full w-full overflow-visible"
      />
      {/* Content — padded to respect margin and line spacing */}
      <div
        className="relative font-[family-name:var(--font-display)] "
        style={{
          paddingLeft: MARGIN_X + 12,
          paddingRight: 16,
          paddingTop: 12,
          paddingBottom: 12,
          lineHeight: `${lineSpacing}px`,
        }}
      >
        {children}
      </div>
    </div>
  );
}
