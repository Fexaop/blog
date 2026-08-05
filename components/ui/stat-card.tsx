"use client";

import {
  useCallback,
  useEffect,
  useRef,
  type HTMLAttributes,
  type ReactNode,
} from "react";
import { useRough } from "@/hooks/use-rough";
import { cn } from "@/lib/utils";
import {
  randomSeed,
  resolveRoughVars,
  stableSeed,
  type CrumbleColorProps,
  type CrumbleTheme,
} from "@/lib/rough";

export type TrendDirection = "up" | "down" | "flat";

export interface StatCardProps
  extends HTMLAttributes<HTMLDivElement>,
    CrumbleColorProps {
  animateOnHover?: boolean;
  description?: ReactNode;
  id?: string;
  label: string;
  theme?: CrumbleTheme;
  trend?: TrendDirection;
  trendLabel?: string;
  value: ReactNode;
}

export function StatCard({
  animateOnHover = true,
  className,
  description,
  fill,
  id,
  label,
  stroke,
  strokeMuted,
  theme: themeProp,
  trend,
  trendLabel,
  value,
  ...props
}: StatCardProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const borderSvgRef = useRef<SVGSVGElement>(null);
  const trendSvgRef = useRef<SVGSVGElement>(null);
  const cardId = id ?? `stat-${label.toLowerCase().replace(/\s+/g, "-")}`;
  const roughStyle = resolveRoughVars({ stroke, strokeMuted, fill });
  const {
    animateOnHover: animateFromContext,
    drawRect,
    svgRef,
    theme,
  } = useRough({
    stableId: cardId,
    svgRef: borderSvgRef,
    theme: themeProp,
    variant: "border",
  });
  const { drawLine: drawTrendLine } = useRough({
    stableId: `${cardId}-trend`,
    svgRef: trendSvgRef,
    theme: themeProp,
    variant: "border",
  });

  const draw = useCallback(
    (reseed = false) => {
      const container = containerRef.current;
      const svg = svgRef.current;
      if (!container || !svg) return;

      svg.replaceChildren();
      const w = container.offsetWidth;
      const h = container.offsetHeight;
      svg.setAttribute("width", String(w));
      svg.setAttribute("height", String(h));
      svg.setAttribute("viewBox", `0 0 ${w} ${h}`);

      const rect = drawRect(1, 1, w - 2, h - 2, {
        fill: "none",
        seed: reseed ? randomSeed() : undefined,
        stroke: "var(--cr-stroke-muted)",
      });
      if (rect) svg.appendChild(rect);
    },
    [drawRect, svgRef],
  );

  const drawTrend = useCallback(() => {
    const svg = trendSvgRef.current;
    if (!svg || !trend || trend === "flat") return;

    svg.replaceChildren();
    svg.setAttribute("width", "16");
    svg.setAttribute("height", "16");
    svg.setAttribute("viewBox", "0 0 16 16");

    const color =
      trend === "up" ? "oklch(0.5 0.15 145)" : "var(--cr-stroke-error)";
    const baseOpts = {
      stroke: color,
      strokeWidth: theme === "crayon" ? 2 : 1.3,
    };

    if (trend === "up") {
      const left = drawTrendLine(3, 12, 8, 4, baseOpts);
      const right = drawTrendLine(8, 4, 13, 12, {
        ...baseOpts,
        seed: stableSeed(`${cardId}-trend-r`),
      });
      if (left) svg.appendChild(left);
      if (right) svg.appendChild(right);
    } else {
      const left = drawTrendLine(3, 4, 8, 12, baseOpts);
      const right = drawTrendLine(8, 12, 13, 4, {
        ...baseOpts,
        seed: stableSeed(`${cardId}-trend-r`),
      });
      if (left) svg.appendChild(left);
      if (right) svg.appendChild(right);
    }
  }, [cardId, drawTrendLine, theme, trend]);

  useEffect(() => {
    const id = requestAnimationFrame(() => {
      draw();
      drawTrend();
    });
    return () => cancelAnimationFrame(id);
  }, [draw, drawTrend]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const ro = new ResizeObserver(() => draw());
    ro.observe(container);
    return () => ro.disconnect();
  }, [draw]);

  const trendColor =
    trend === "up"
      ? "text-[oklch(0.5_0.15_145)]"
      : trend === "down"
        ? "text-destructive"
        : "text-muted-foreground";

  return (
    <div
      ref={containerRef}
      className={cn("relative p-5 min-w-[160px]", className)}
      style={roughStyle}
      onMouseEnter={() => {
        if (animateOnHover && animateFromContext) draw(true);
      }}
      onMouseLeave={() => {
        if (animateOnHover && animateFromContext) draw(false);
      }}
      {...props}
    >
      <svg
        ref={borderSvgRef}
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 h-full w-full overflow-visible"
      />
      <div className="relative flex flex-col gap-1">
        <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
          {label}
        </p>
        <p className="text-3xl font-semibold tabular-nums text-foreground">{value}</p>
        {trend || trendLabel || description ? (
          <div className="flex items-center gap-1.5 mt-0.5">
            {trend ? (
              <svg
                ref={trendSvgRef}
                aria-hidden="true"
                width="16"
                height="16"
                className="overflow-visible flex-shrink-0"
              />
            ) : null}
            {trendLabel ? (
              <span className={cn("text-xs", trendColor)}>{trendLabel}</span>
            ) : null}
            {description ? (
              <span className="text-xs text-muted-foreground">{description}</span>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}
