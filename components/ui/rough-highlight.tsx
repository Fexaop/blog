"use client";

import {
  useCallback,
  useEffect,
  useRef,
  type CSSProperties,
  type ReactNode,
} from "react";
import { cn } from "@/lib/utils";
import { type CrumbleTheme } from "@/lib/rough";
import { useRough } from "@/hooks/use-rough";

export type HighlightType =
  | "underline"
  | "box"
  | "circle"
  | "highlight"
  | "strike-through"
  | "bracket";

export interface RoughHighlightProps {
  animate?: boolean;
  animationDuration?: number;
  children: ReactNode;
  className?: string;
  color?: string;
  id?: string;
  opacity?: number;
  style?: CSSProperties;
  theme?: CrumbleTheme;
  type?: HighlightType;
}

function animateGroup(node: SVGGElement, duration: number) {
  const paths = node.querySelectorAll("path");

  paths.forEach((path) => {
    const length = path.getTotalLength();
    path.style.strokeDasharray = String(length);
    path.style.strokeDashoffset = String(length);
    path.style.transition = `stroke-dashoffset ${duration}ms ease-out`;

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        path.style.strokeDashoffset = "0";
      });
    });
  });
}

export function RoughHighlight({
  animate = true,
  animationDuration,
  children,
  className,
  color = "currentColor",
  id,
  opacity = 0.3,
  style,
  theme: themeProp,
  type = "underline",
}: RoughHighlightProps) {
  const containerRef = useRef<HTMLSpanElement>(null);
  const externalSvgRef = useRef<SVGSVGElement>(null);
  const { animateOnMount, drawPath, getOptions, rc, svgRef, theme } = useRough({
    stableId: id,
    svgRef: externalSvgRef,
    theme: themeProp,
    variant: "border",
  });
  const shouldAnimate = animate && animateOnMount;
  const duration =
    animationDuration ??
    (theme === "ink" ? 400 : theme === "crayon" ? 600 : 800);

  const draw = useCallback(() => {
    const container = containerRef.current;
    const svg = svgRef.current;

    if (!container || !svg) return;

    svg.replaceChildren();

    const width = container.offsetWidth;
    const height = container.offsetHeight;
    const pad = 4;
    const borderOptions = {
      stroke: color,
      strokeWidth: theme === "crayon" ? 3 : theme === "ink" ? 2 : 1,
    };

    svg.setAttribute("width", String(width));
    svg.setAttribute("height", String(height + 8));
    svg.setAttribute("viewBox", `0 0 ${width} ${height + 8}`);

    let node: SVGGElement | null = null;

    switch (type) {
      case "underline":
        node = drawPath(
          `M ${-pad} ${height + 2} L ${width + pad} ${height + 2}`,
          borderOptions,
        ) as SVGGElement;
        break;
      case "box":
        node = drawPath(
          `M ${-pad} ${-pad} L ${width + pad} ${-pad} L ${width + pad} ${height + pad} L ${-pad} ${height + pad} Z`,
          { ...borderOptions, fill: "none" },
        ) as SVGGElement;
        break;
      case "circle":
        node = rc.current?.ellipse(
          width / 2,
          height / 2,
          width + pad * 3,
          height + pad * 3,
          getOptions({ ...borderOptions, fill: "none" }),
        ) as SVGGElement | null;
        break;
      case "highlight":
        node = drawPath(
          `M ${-pad} 0 L ${width + pad} 0 L ${width + pad} ${height} L ${-pad} ${height} Z`,
          {
            ...borderOptions,
            fill: color,
            fillStyle: "solid",
            fillWeight: 1,
            roughness: 1.5,
            stroke: "none",
          },
        ) as SVGGElement;
        if (node) node.style.opacity = String(opacity);
        break;
      case "strike-through":
        node = drawPath(
          `M ${-pad} ${height / 2} L ${width + pad} ${height / 2}`,
          borderOptions,
        ) as SVGGElement;
        break;
      case "bracket": {
        const left = drawPath(
          `M ${-pad} 0 L ${-pad} ${height}`,
          borderOptions,
        ) as SVGGElement;
        const right = drawPath(
          `M ${width + pad} 0 L ${width + pad} ${height}`,
          borderOptions,
        ) as SVGGElement;

        if (!left || !right) return;
        svg.append(left, right);

        if (shouldAnimate) {
          animateGroup(left, duration);
          animateGroup(right, duration);
        }
        return;
      }
      default:
        return;
    }

    if (!node) return;
    svg.appendChild(node);

    if (shouldAnimate) {
      animateGroup(node, duration);
    }
  }, [
    color,
    drawPath,
    duration,
    getOptions,
    opacity,
    rc,
    shouldAnimate,
    svgRef,
    theme,
    type,
  ]);

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
    <span
      ref={containerRef}
      className={cn("relative inline-block", className)}
      style={style}
    >
      {children}
      <svg
        ref={externalSvgRef}
        aria-hidden="true"
        className="pointer-events-none absolute -left-1 overflow-visible"
        style={{
          top:
            type === "underline"
              ? undefined
              : type === "highlight"
                ? 0
                : "-4px",
        }}
      />
    </span>
  );
}
