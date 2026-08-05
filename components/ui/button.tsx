"use client";

import {
  useCallback,
  useEffect,
  useRef,
  type ButtonHTMLAttributes,
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

export type ButtonVariant = "default" | "ghost" | "destructive";
export type ButtonSize = "sm" | "md" | "lg";

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    CrumbleColorProps {
  children: ReactNode;
  size?: ButtonSize;
  theme?: CrumbleTheme;
  variant?: ButtonVariant;
}

const sizeClasses: Record<ButtonSize, string> = {
  lg: "h-12 px-5 text-base",
  md: "h-10 px-4 text-sm",
  sm: "h-8 px-3 text-[13px]",
};

const sizeHeights: Record<ButtonSize, number> = {
  lg: 48,
  md: 40,
  sm: 32,
};

const variantStroke: Record<ButtonVariant, string> = {
  default: "currentColor",
  destructive: "#dc2626",
  ghost: "currentColor",
};

export function Button({
  children,
  className,
  disabled,
  fill,
  onClick,
  size = "md",
  stroke,
  strokeMuted,
  theme: themeProp,
  variant = "default",
  ...props
}: ButtonProps) {
  const btnRef = useRef<HTMLButtonElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const roughStyle = resolveRoughVars({ stroke, strokeMuted, fill });
  const { animateOnHover, drawRect, theme } = useRough({
    stableId: `btn-${typeof children === "string" ? children : "content"}`,
    svgRef,
    theme: themeProp,
    variant: "interactive",
  });
  const h = sizeHeights[size];

  const draw = useCallback(
    (reseed = false) => {
      const btn = btnRef.current;
      const svg = svgRef.current;

      if (!btn || !svg) return;

      svg.replaceChildren();

      const width = btn.offsetWidth;
      svg.setAttribute("width", String(width));
      svg.setAttribute("height", String(h));
      svg.setAttribute("viewBox", `0 0 ${width} ${h}`);

      const node = drawRect(1, 1, width - 2, h - 2, {
        fill: "none",
        seed: reseed ? randomSeed() : undefined,
        stroke: disabled ? "#9ca3af" : variantStroke[variant],
      });

      if (node) {
        svg.appendChild(node);
      }
    },
    [disabled, drawRect, h, variant],
  );

  useEffect(() => {
    draw();
  }, [draw, theme]);

  useEffect(() => {
    const button = btnRef.current;
    if (!button) return;

    const observer = new ResizeObserver(() => draw());
    observer.observe(button);

    return () => observer.disconnect();
  }, [draw]);

  return (
    <button
      ref={btnRef}
      className={cn(
        "relative inline-flex select-none items-center justify-center font-medium transition-opacity",
        "disabled:cursor-not-allowed disabled:opacity-40",
        sizeClasses[size],
        variant === "destructive" && "text-red-600",
        variant === "ghost" && "opacity-60 hover:opacity-100",
        className,
      )}
      disabled={disabled}
      onClick={onClick}
      style={roughStyle}
      onMouseDown={() => {
        if (!disabled) draw(true);
      }}
      onMouseEnter={() => {
        if (!disabled && animateOnHover) draw(true);
      }}
      onMouseLeave={() => {
        if (!disabled && animateOnHover) draw(false);
      }}
      {...props}
    >
      <svg
        ref={svgRef}
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 h-full w-full overflow-visible"
      />
      <span className="relative">{children}</span>
    </button>
  );
}
