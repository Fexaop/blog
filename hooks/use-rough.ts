"use client";

import { useCallback, useContext, useRef, type RefObject } from "react";
import rough from "roughjs";
import type { Options } from "roughjs/bin/core";
import type { RoughSVG } from "roughjs/bin/svg";
import {
  CrumbleContext,
  getRoughOptions,
  randomSeed,
  stableSeed,
  type ComponentVariant,
  type CrumbleTheme,
} from "@/lib/rough";

interface UseRoughProps {
  variant?: ComponentVariant;
  options?: Partial<Options>;
  stableId?: string;
  theme?: CrumbleTheme;
  svgRef?: RefObject<SVGSVGElement | null>;
}

export function useRough({
  variant = "border",
  options,
  stableId,
  theme: themeProp,
  svgRef: externalSvgRef,
}: UseRoughProps = {}) {
  const internalSvgRef = useRef<SVGSVGElement>(null);
  const svgRef = externalSvgRef ?? internalSvgRef;
  const rcRef = useRef<RoughSVG | null>(null);
  const lastSvgRef = useRef<SVGSVGElement | null>(null);
  const {
    animateOnHover,
    animateOnMount,
    theme: contextTheme,
  } = useContext(CrumbleContext);
  const theme = themeProp ?? contextTheme;

  const getRenderer = useCallback(() => {
    if (!svgRef.current) return null;

    if (rcRef.current && lastSvgRef.current === svgRef.current) {
      return rcRef.current;
    }

    rcRef.current = rough.svg(svgRef.current);
    lastSvgRef.current = svgRef.current;
    return rcRef.current;
  }, [svgRef]);

  const getOptions = useCallback(
    (extra?: Partial<Options>) => {
      const resolvedSeed =
        extra?.seed ?? (stableId ? stableSeed(stableId) : randomSeed());
      return getRoughOptions(theme, variant, {
        ...options,
        ...extra,
        seed: resolvedSeed,
      });
    },
    [animateOnHover, options, stableId, theme, variant],
  );

  const drawRect = useCallback(
    (
      x: number,
      y: number,
      width: number,
      height: number,
      extra?: Partial<Options>,
    ) => {
      const rc = getRenderer();
      if (!rc) return null;

      return rc.rectangle(x, y, width, height, getOptions(extra));
    },
    [getOptions, getRenderer],
  );

  const drawCircle = useCallback(
    (cx: number, cy: number, diameter: number, extra?: Partial<Options>) => {
      const rc = getRenderer();
      if (!rc) return null;

      return rc.circle(cx, cy, diameter, getOptions(extra));
    },
    [getOptions, getRenderer],
  );

  const drawLine = useCallback(
    (
      x1: number,
      y1: number,
      x2: number,
      y2: number,
      extra?: Partial<Options>,
    ) => {
      const rc = getRenderer();
      if (!rc) return null;

      return rc.line(x1, y1, x2, y2, getOptions(extra));
    },
    [getOptions, getRenderer],
  );

  const drawPath = useCallback(
    (pathData: string, extra?: Partial<Options>) => {
      const rc = getRenderer();
      if (!rc) return null;

      return rc.path(pathData, getOptions(extra));
    },
    [getOptions, getRenderer],
  );

  const drawPolygon = useCallback(
    (points: [number, number][], extra?: Partial<Options>) => {
      const rc = getRenderer();
      if (!rc) return null;

      return rc.polygon(points, getOptions(extra));
    },
    [getOptions, getRenderer],
  );

  const drawEllipse = useCallback(
    (
      cx: number,
      cy: number,
      width: number,
      height: number,
      extra?: Partial<Options>,
    ) => {
      const rc = getRenderer();
      if (!rc) return null;

      return rc.ellipse(cx, cy, width, height, getOptions(extra));
    },
    [getOptions, getRenderer],
  );
  return {
    animateOnHover,
    drawEllipse,
    drawPolygon,
    animateOnMount,
    drawCircle,
    drawLine,
    drawPath,
    drawRect,
    getOptions,
    rc: rcRef,
    svgRef,
    theme,
  };
}
