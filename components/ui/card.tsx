"use client";

import {
  useCallback,
  useEffect,
  useRef,
  type CSSProperties,
  type HTMLAttributes,
  type ReactNode,
} from "react";
import { cn } from "@/lib/utils";
import {
  randomSeed,
  resolveRoughVars,
  type CrumbleColorProps,
  type CrumbleTheme,
} from "@/lib/rough";
import { useRough } from "@/hooks/use-rough";

export interface CardProps
  extends HTMLAttributes<HTMLDivElement>,
    CrumbleColorProps {
  children: ReactNode;
  id?: string;
  padding?: number;
  stacked?: boolean;
  style?: CSSProperties;
  theme?: CrumbleTheme;
}

export function Card({
  children,
  className,
  fill,
  id,
  onClick,
  padding = 20,
  stacked = false,
  stroke,
  strokeMuted,
  style,
  theme: themeProp,
  ...props
}: CardProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const svg2Ref = useRef<SVGSVGElement>(null);
  const svg3Ref = useRef<SVGSVGElement>(null);
  const { animateOnHover, drawRect, theme } = useRough({
    stableId: id ?? "card",
    svgRef,
    theme: themeProp,
    variant: "border",
  });
  const roughStyle = resolveRoughVars({ stroke, strokeMuted, fill });

  const drawInto = useCallback(
    (
      svgEl: SVGSVGElement,
      width: number,
      height: number,
      options: {
        inset?: number;
        offsetX?: number;
        offsetY?: number;
        reseed?: boolean;
        rotate?: number;
        strokeOpacity?: number;
      } = {},
    ) => {
      const {
        inset = 2,
        offsetX = 0,
        offsetY = 0,
        reseed = false,
        rotate = 0,
        strokeOpacity = 1,
      } = options;

      svgEl.replaceChildren();
      svgEl.setAttribute("width", String(width + Math.abs(offsetX) + 8));
      svgEl.setAttribute("height", String(height + Math.abs(offsetY) + 8));

      const node = drawRect(
        inset + offsetX,
        inset + offsetY,
        width - inset * 2,
        height - inset * 2,
        {
          fill: fill ?? "none",
          seed: reseed ? randomSeed() : undefined,
          stroke: stroke ?? "currentColor",
        },
      );

      if (!node) return;

      if (strokeOpacity < 1) {
        node.style.opacity = String(strokeOpacity);
      }

      if (rotate !== 0) {
        const cx = width / 2 + offsetX;
        const cy = height / 2 + offsetY;
        node.setAttribute("transform", `rotate(${rotate} ${cx} ${cy})`);
      }

      svgEl.appendChild(node);
    },
    [drawRect, fill, stroke],
  );

  const draw = useCallback(
    (reseed = false) => {
      const container = containerRef.current;
      const svg = svgRef.current;

      if (!container || !svg) return;

      const width = container.offsetWidth;
      const height = container.offsetHeight;
      svg.setAttribute("width", String(width));
      svg.setAttribute("height", String(height));

      drawInto(svg, width, height, { reseed });

      if (stacked) {
        if (svg2Ref.current) {
          drawInto(svg2Ref.current, width, height, {
            offsetX: 4,
            offsetY: 5,
            rotate: 1.5,
            strokeOpacity: 0.3,
          });
        }

        if (svg3Ref.current) {
          drawInto(svg3Ref.current, width, height, {
            offsetX: 8,
            offsetY: 9,
            rotate: 3,
            strokeOpacity: 0.15,
          });
        }
      }
    },
    [drawInto, stacked],
  );

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
      onClick={onClick}
      className="relative block w-full"
      style={{ ...roughStyle, ...style }}
    >
      {stacked ? (
        <>
          <svg
            ref={svg3Ref}
            aria-hidden="true"
            className="pointer-events-none absolute left-0 top-0 z-0 overflow-visible"
          />
          <svg
            ref={svg2Ref}
            aria-hidden="true"
            className="pointer-events-none absolute left-0 top-0 z-[1] overflow-visible"
          />
        </>
      ) : null}
      <div
        ref={containerRef}
        className={cn("relative z-[2]", className)}
        onMouseEnter={() => {
          if (animateOnHover) draw(true);
        }}
        onMouseLeave={() => {
          if (animateOnHover) draw(false);
        }}
        {...props}
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
    </div>
  );
}

export function CardHeader({
  children,
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)} {...props}>
      {children}
    </div>
  );
}

export function CardTitle({
  children,
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("text-base font-semibold leading-none", className)}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardDescription({
  children,
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("text-sm text-muted-foreground", className)} {...props}>
      {children}
    </div>
  );
}

export function CardContent({
  children,
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("mt-4", className)} {...props}>
      {children}
    </div>
  );
}

export function CardFooter({
  children,
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("mt-5 flex items-center", className)} {...props}>
      {children}
    </div>
  );
}
