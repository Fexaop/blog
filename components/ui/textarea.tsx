"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type TextareaHTMLAttributes,
} from "react";
import { useRough } from "@/hooks/use-rough";
import {
  resolveRoughVars,
  type CrumbleColorProps,
  type CrumbleTheme,
} from "@/lib/rough";
import { cn } from "@/lib/utils";

export interface TextareaProps
  extends TextareaHTMLAttributes<HTMLTextAreaElement>,
    CrumbleColorProps {
  autoGrow?: boolean;
  error?: string;
  label?: string;
  theme?: CrumbleTheme;
}

export function Textarea({
  autoGrow = false,
  className,
  error,
  fill,
  id,
  label,
  onBlur,
  onChange,
  onFocus,
  stroke,
  strokeMuted,
  theme: themeProp,
  ...props
}: TextareaProps) {
  const [focused, setFocused] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const roughStyle = resolveRoughVars({ stroke, strokeMuted, fill });
  const textareaId =
    id ?? `textarea-${label?.toLowerCase().replace(/\s+/g, "-") ?? "field"}`;

  const { drawRect, theme } = useRough({
    stableId: textareaId,
    svgRef,
    theme: themeProp,
    variant: "border",
  });

  const draw = useCallback(() => {
    const svg = svgRef.current;
    const wrapper = wrapperRef.current;
    if (!svg || !wrapper) return;

    svg.replaceChildren();

    const width = wrapper.offsetWidth;
    const height = wrapper.offsetHeight;
    svg.setAttribute("width", String(width));
    svg.setAttribute("height", String(height));
    svg.setAttribute("viewBox", `0 0 ${width} ${height}`);

    const currentStroke = error
      ? "color-mix(in srgb, currentColor 10%, red)"
      : focused
        ? "currentColor"
        : "color-mix(in srgb, currentColor 40%, transparent)";

    const node = drawRect(1, 1, width - 2, height - 2, {
      fill: "none",
      stroke: currentStroke,
    });

    if (node) svg.appendChild(node);
  }, [drawRect, error, focused]);

  useEffect(() => {
    draw();
  }, [draw, focused, theme]);

  useEffect(() => {
    const target = autoGrow ? wrapperRef.current : textareaRef.current;
    if (!target) return;

    const observer = new ResizeObserver(() => {
      if (!autoGrow && textareaRef.current && wrapperRef.current) {
        wrapperRef.current.style.height = `${textareaRef.current.offsetHeight}px`;
      }
      draw();
    });

    observer.observe(target);
    return () => observer.disconnect();
  }, [autoGrow, draw]);

  const handleChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
    if (autoGrow && textareaRef.current && wrapperRef.current) {
      textareaRef.current.style.height = "auto";
      const nextHeight = textareaRef.current.scrollHeight;
      textareaRef.current.style.height = `${nextHeight}px`;
      wrapperRef.current.style.height = `${nextHeight}px`;
      draw();
    }

    onChange?.(event);
  };

  return (
    <div className={cn("flex flex-col gap-1.5", className)} style={roughStyle}>
      {label ? (
        <label
          htmlFor={textareaId}
          className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground"
        >
          {label}
        </label>
      ) : null}

      {autoGrow ? (
        <div ref={wrapperRef} className="relative min-h-24">
          <svg
            ref={svgRef}
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 overflow-visible"
          />
          <textarea
            ref={textareaRef}
            id={textareaId}
            rows={3}
            onBlur={(event) => {
              setFocused(false);
              onBlur?.(event);
            }}
            onChange={handleChange}
            onFocus={(event) => {
              setFocused(true);
              onFocus?.(event);
            }}
            className="w-full resize-none border-none bg-transparent px-3 py-2.5 font-[inherit] text-sm text-foreground outline-none"
            style={{ display: "block" }}
            {...props}
          />
        </div>
      ) : (
        <div ref={wrapperRef} className="relative min-h-24">
          <svg
            ref={svgRef}
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 h-full w-full overflow-visible"
          />
          <textarea
            ref={textareaRef}
            id={textareaId}
            onBlur={(event) => {
              setFocused(false);
              onBlur?.(event);
            }}
            onChange={handleChange}
            onFocus={(event) => {
              setFocused(true);
              onFocus?.(event);
            }}
            className="absolute inset-0 h-full w-full resize-y border-none bg-transparent px-3 py-2.5 font-[inherit] text-sm text-foreground outline-none"
            {...props}
          />
        </div>
      )}

      {error ? <span className="text-xs text-destructive">{error}</span> : null}
    </div>
  );
}
