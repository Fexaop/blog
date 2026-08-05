"use client";

import { useCallback, useEffect } from "react";
import type { CrumbleTheme } from "@/lib/rough";
import { useRough } from "@/hooks/use-rough";

export interface RoughArrowProps {
  className?: string;
  curvature?: number;
  height?: number;
  id?: string;
  stroke?: string;
  theme?: CrumbleTheme;
  width?: number;
  x1: number;
  x2: number;
  y1: number;
  y2: number;
}

export function RoughArrow({
  className,
  curvature = 30,
  height = 100,
  id,
  stroke,
  theme: themeProp,
  width = 200,
  x1,
  x2,
  y1,
  y2,
}: RoughArrowProps) {
  const { drawLine, drawPath, svgRef, theme } = useRough({
    stableId: id,
    theme: themeProp,
    variant: "border",
  });

  const draw = useCallback(() => {
    const svg = svgRef.current;
    if (!svg) return;

    svg.replaceChildren();

    const strokeColor = stroke ?? "currentColor";
    const midX = (x1 + x2) / 2;
    const midY = (y1 + y2) / 2 - curvature;
    const pathD = `M ${x1} ${y1} Q ${midX} ${midY} ${x2} ${y2}`;

    const lineNode = drawPath(pathD, {
      fill: "none",
      stroke: strokeColor,
    });

    if (lineNode) {
      svg.appendChild(lineNode);
    }

    const angle = Math.atan2(y2 - midY, x2 - midX);
    const arrowSize = theme === "crayon" ? 12 : 8;
    const ax1 = x2 - arrowSize * Math.cos(angle - Math.PI / 6);
    const ay1 = y2 - arrowSize * Math.sin(angle - Math.PI / 6);
    const ax2 = x2 - arrowSize * Math.cos(angle + Math.PI / 6);
    const ay2 = y2 - arrowSize * Math.sin(angle + Math.PI / 6);

    const head1 = drawLine(x2, y2, ax1, ay1, { stroke: strokeColor });
    const head2 = drawLine(x2, y2, ax2, ay2, { stroke: strokeColor });

    if (head1) {
      svg.appendChild(head1);
    }

    if (head2) {
      svg.appendChild(head2);
    }
  }, [curvature, drawLine, drawPath, stroke, svgRef, theme, x1, x2, y1, y2]);

  useEffect(() => {
    draw();
  }, [draw, theme]);

  return (
    <svg
      ref={svgRef}
      aria-hidden="true"
      className={className}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      width={width}
    />
  );
}
