import type { Options } from "roughjs/bin/core";
import { createContext, type CSSProperties } from "react";

export type CrumbleTheme = "pencil" | "ink" | "crayon";

export type ComponentVariant = "border" | "fill" | "interactive" | "chart";

export const roughThemes: Record<CrumbleTheme, Options> = {
  pencil: {
    roughness: 1.2,
    bowing: 1,
    strokeWidth: 1,
    fillStyle: "hachure",
    fillWeight: 0.8,
    hachureGap: 6,
    hachureAngle: -41,
    preserveVertices: false,
  },
  ink: {
    roughness: 0.6,
    bowing: 0.5,
    strokeWidth: 2,
    fillStyle: "solid",
    fillWeight: 2,
    preserveVertices: false,
  },
  crayon: {
    roughness: 2.4,
    bowing: 2,
    strokeWidth: 3.5,
    fillStyle: "zigzag",
    fillWeight: 1.5,
    hachureGap: 5,
    hachureAngle: -41,
    preserveVertices: false,
  },
};

export const componentOverrides: Record<
  ComponentVariant,
  Partial<Record<CrumbleTheme, Partial<Options>>>
> = {
  border: {
    pencil: { roughness: 0.8, strokeWidth: 1 },
    ink: { roughness: 0.4, strokeWidth: 1.5 },
    crayon: { roughness: 2, strokeWidth: 3 },
  },
  fill: {
    pencil: { roughness: 1, fillWeight: 0.6, hachureGap: 8 },
    ink: { roughness: 0.3, fillStyle: "solid" },
    crayon: { roughness: 2.2, fillWeight: 1.2, hachureGap: 4 },
  },
  interactive: {
    pencil: { roughness: 1.5, bowing: 1.2 },
    ink: { roughness: 0.8, bowing: 0.6 },
    crayon: { roughness: 2.8, bowing: 2.5 },
  },
  chart: {
    pencil: { roughness: 1, strokeWidth: 1.2, fillStyle: "hachure" },
    ink: { roughness: 0.5, strokeWidth: 2, fillStyle: "solid" },
    crayon: { roughness: 2, strokeWidth: 3, fillStyle: "zigzag" },
  },
};

export function getRoughOptions(
  theme: CrumbleTheme,
  variant: ComponentVariant = "border",
  extra?: Partial<Options>,
): Options {
  const base = roughThemes[theme];
  const override = componentOverrides[variant]?.[theme] ?? {};

  return { ...base, ...override, ...extra };
}

export function stableSeed(id: string): number {
  let hash = 5381;

  for (let i = 0; i < id.length; i += 1) {
    hash = (hash * 33) ^ id.charCodeAt(i);
  }

  return Math.abs(hash);
}

export function randomSeed(): number {
  return Math.floor(Math.random() * 2 ** 31);
}

export interface CrumbleConfig {
  theme: CrumbleTheme;
  animateOnMount: boolean;
  animateOnHover: boolean;
}

const config: CrumbleConfig = {
  theme: "pencil",
  animateOnMount: true,
  animateOnHover: true,
};

export function configureCrumble(options: Partial<CrumbleConfig>): void {
  if (options.theme !== undefined) {
    config.theme = options.theme;
  }

  if (options.animateOnMount !== undefined) {
    config.animateOnMount = options.animateOnMount;
  }

  if (options.animateOnHover !== undefined) {
    config.animateOnHover = options.animateOnHover;
  }
}

export function getCrumbleConfig(): CrumbleConfig {
  return { ...config };
}

export interface CrumbleContextValue {
  theme: CrumbleTheme;
  animateOnMount: boolean;
  animateOnHover: boolean;
}

export const CrumbleContext = createContext<CrumbleContextValue>({
  theme: "pencil",
  animateOnMount: true,
  animateOnHover: true,
});

export interface CrumbleColorProps {
  stroke?: string;
  strokeMuted?: string;
  fill?: string;
}

export function resolveRoughVars({
  stroke,
  strokeMuted,
  fill,
}: CrumbleColorProps = {}): CSSProperties {
  const resolved: Record<string, string | undefined> = {
    "--cr-stroke": stroke,
    "--cr-stroke-muted":
      strokeMuted ??
      (stroke ? `color-mix(in srgb, ${stroke} 40%, transparent)` : undefined),
    "--cr-fill": fill,
  };

  return Object.fromEntries(
    Object.entries(resolved).filter(([, value]) => value !== undefined),
  ) as CSSProperties;
}
