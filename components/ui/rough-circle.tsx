"use client";

import {
  useCallback,
  useEffect,
  type ReactNode,
} from "react";
import { cn } from "@/lib/utils";
import { randomSeed, type CrumbleTheme } from "@/lib/rough";
import { useRough } from "@/hooks/use-rough";

export interface RoughCircleProps {
  children?: ReactNode;
  className?: string;
  diameter: number;
  fill?: string;
  id?: string;
  stroke?: string;
  theme?: CrumbleTheme;
}

export function RoughCircle({
  children,
  className,
  diameter,
  fill,
  id,
  stroke,
  theme: themeProp,
}: RoughCircleProps) {
  const { animateOnHover, drawCircle, svgRef, theme } = useRough({
    stableId: id,
    theme: themeProp,
    variant: "border",
  });

  const draw = useCallback(
    (reseed = false) => {
      const svg = svgRef.current;
      if (!svg) return;

      svg.replaceChildren();
      svg.setAttribute("width", String(diameter));
      svg.setAttribute("height", String(diameter));
      svg.setAttribute("viewBox", `0 0 ${diameter} ${diameter}`);

      const node = drawCircle(diameter / 2, diameter / 2, diameter - 4, {
        fill: fill ?? "none",
        seed: reseed ? randomSeed() : undefined,
        stroke: stroke ?? "currentColor",
      });

      if (node) {
        svg.appendChild(node);
      }
    },
    [diameter, drawCircle, fill, stroke, svgRef],
  );

  useEffect(() => {
    draw();
  }, [draw, theme]);

  return (
    <div
      className={cn(
        "relative inline-flex items-center justify-center",
        className,
      )}
      onMouseEnter={() => {
        if (animateOnHover) draw(true);
      }}
      onMouseLeave={() => {
        if (animateOnHover) draw(false);
      }}
      style={{ height: diameter, width: diameter }}
    >
      <svg
        ref={svgRef}
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 overflow-visible"
        height={diameter}
        width={diameter}
      />
      {children ? <div className="relative z-10">{children}</div> : null}
    </div>
  );
}
