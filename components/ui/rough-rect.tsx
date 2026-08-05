"use client";

import {
  useCallback,
  useEffect,
  useRef,
  type CSSProperties,
  type ReactNode,
} from "react";
import { cn } from "@/lib/utils";
import { randomSeed, type CrumbleTheme } from "@/lib/rough";
import { useRough } from "@/hooks/use-rough";

export interface RoughRectProps {
  animateOnHover?: boolean;
  children?: ReactNode;
  className?: string;
  fill?: string;
  id?: string;
  onClick?: () => void;
  padding?: number;
  rounded?: boolean;
  stroke?: string;
  style?: CSSProperties;
  theme?: CrumbleTheme;
}

export function RoughRect({
  animateOnHover: animateOnHoverProp,
  children,
  className,
  fill,
  id,
  onClick,
  padding = 8,
  rounded = false,
  stroke,
  style,
  theme: themeProp,
}: RoughRectProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mountSeed = useRef(randomSeed());
  const { drawRect, svgRef, theme, animateOnHover } = useRough({
    stableId: id,
    theme: themeProp,
    variant: "border",
  });
  const shouldAnimateHover = animateOnHoverProp ?? animateOnHover;

  const draw = useCallback(
    (reseed = false) => {
      const svg = svgRef.current;
      const container = containerRef.current;

      if (!svg || !container) return;

      svg.replaceChildren();

      const width = container.offsetWidth;
      const height = container.offsetHeight;
      const inset = 2;

      svg.setAttribute("width", String(width));
      svg.setAttribute("height", String(height));
      svg.setAttribute("viewBox", `0 0 ${width} ${height}`);

      const node = drawRect(
        inset,
        inset,
        width - inset * 2,
        height - inset * 2,
        {
          fill: fill ?? "none",
          stroke: stroke ?? "currentColor",
          ...(rounded && { roughness: 0.5 }),
          seed: reseed ? randomSeed() : id ? undefined : mountSeed.current,
        },
      );

      if (node) {
        svg.appendChild(node);
      }
    },
    [drawRect, fill, id, rounded, stroke, svgRef],
  );

  useEffect(() => {
    draw();
  }, [draw]);

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
      className={cn("relative", className)}
      onClick={onClick}
      onMouseEnter={() => {
        if (shouldAnimateHover) draw(true);
      }}
      onMouseLeave={() => {
        if (shouldAnimateHover) draw(false);
      }}
      style={style}
    >
      <svg
        ref={svgRef}
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 h-full w-full overflow-visible"
      />
      <div className="relative" style={{ padding }}>
        {children}
      </div>
    </div>
  );
}
