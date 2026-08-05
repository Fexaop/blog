/**
 * Fullscreen Pac-Man cross-site transition (canvas).
 * - to-blog: Pac-Man runs right eating dots; red ghost hunts from behind
 * - to-portfolio: Pac-Man runs right; blue ghost flees; Pac-Man catches it
 *
 * Cross-origin handoff uses ?xsite=… (sessionStorage does not work across hosts).
 */

import {
  withXSiteParam,
  readAndClearXSiteParam,
  type XSiteDirection,
} from "@/lib/site";

const DURATION_MS = 2600;

export function playPacmanTransition(
  url: string,
  direction: XSiteDirection,
): void {
  if (typeof window === "undefined") return;
  if (document.getElementById("pwnhub-pacman-overlay")) return;

  const overlay = document.createElement("div");
  overlay.id = "pwnhub-pacman-overlay";
  overlay.setAttribute("role", "presentation");
  overlay.style.cssText =
    "position:fixed;inset:0;z-index:2147483646;background:#000;display:flex;align-items:center;justify-content:center;cursor:wait";

  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const cssW = Math.min(window.innerWidth, 920);
  const cssH = Math.min(Math.round(window.innerHeight * 0.42), 320);
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(cssW * dpr);
  canvas.height = Math.round(cssH * dpr);
  canvas.style.cssText = `width:${cssW}px;height:${cssH}px`;
  overlay.appendChild(canvas);
  document.body.appendChild(overlay);
  document.body.style.overflow = "hidden";

  const ctx = canvas.getContext("2d")!;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  const w = cssW;
  const h = cssH;
  const cy = h * 0.48;
  const r = Math.max(14, Math.min(22, w * 0.028));

  const chase = direction === "to-portfolio"; // Pac-Man chases ghost
  const pacStart = w * 0.1;
  const pacEnd = w * 0.82;

  type Pellet = { x: number; eaten: boolean };
  const pellets: Pellet[] = [];
  for (let i = 0; i < 16; i++) {
    pellets.push({
      x: w * 0.18 + ((w * 0.7) * i) / 15,
      eaten: false,
    });
  }

  const t0 = performance.now();
  let navigated = false;

  const go = () => {
    if (navigated) return;
    navigated = true;
    // Query param works cross-origin; keep overlay until unload
    window.location.href = withXSiteParam(url, direction);
  };

  const failSafe = window.setTimeout(go, DURATION_MS + 600);

  function drawPac(x: number, y: number, mouth: number) {
    // Classic Pac-Man facing RIGHT, mouth opens/closes
    const a = 0.2 + mouth * 0.35; // radians fraction of π
    ctx.save();
    ctx.translate(x, y);
    ctx.fillStyle = "#ffe14f";
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.arc(0, 0, r, a * Math.PI, (2 - a) * Math.PI, false);
    ctx.closePath();
    ctx.fill();
    // eye
    ctx.fillStyle = "#111";
    ctx.beginPath();
    ctx.arc(r * 0.08, -r * 0.42, r * 0.13, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function drawGhost(
    x: number,
    y: number,
    body: string,
    frightened: boolean,
  ) {
    const gw = r * 1.75;
    const gh = r * 1.9;
    ctx.save();
    ctx.translate(x, y);
    ctx.fillStyle = frightened ? "#2121de" : body;
    ctx.beginPath();
    ctx.arc(0, -gh * 0.12, gw / 2, Math.PI, 0, false);
    ctx.lineTo(gw / 2, gh * 0.42);
    for (let i = 3; i >= 0; i--) {
      const sx = gw / 2 - (gw * i) / 3;
      const sy = gh * 0.42 + (i % 2 === 0 ? 0 : -gh * 0.14);
      ctx.lineTo(sx, sy);
    }
    ctx.closePath();
    ctx.fill();

    // eyes
    const ey = -gh * 0.18;
    ctx.fillStyle = "#fff";
    ctx.beginPath();
    ctx.ellipse(-gw * 0.18, ey, gw * 0.14, gw * 0.16, 0, 0, Math.PI * 2);
    ctx.ellipse(gw * 0.18, ey, gw * 0.14, gw * 0.16, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = frightened ? "#fff" : "#2121de";
    // pupils look toward Pac-Man direction (right when fleeing, left when hunting)
    const pupilShift = frightened ? 0.04 : -0.03;
    ctx.beginPath();
    ctx.arc(-gw * (0.14 - pupilShift), ey, gw * 0.07, 0, Math.PI * 2);
    ctx.arc(gw * (0.22 + pupilShift), ey, gw * 0.07, 0, Math.PI * 2);
    ctx.fill();

    if (frightened) {
      // wavy mouth
      ctx.strokeStyle = "#fff";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(-gw * 0.28, gh * 0.12);
      ctx.quadraticCurveTo(-gw * 0.1, gh * 0.22, 0, gh * 0.12);
      ctx.quadraticCurveTo(gw * 0.1, gh * 0.02, gw * 0.28, gh * 0.12);
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawEyesOnly(x: number, y: number) {
    ctx.fillStyle = "#fff";
    ctx.beginPath();
    ctx.ellipse(x - 7, y - 4, 5, 6, 0, 0, Math.PI * 2);
    ctx.ellipse(x + 7, y - 4, 5, 6, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#2121de";
    ctx.beginPath();
    ctx.arc(x - 5, y - 4, 2.2, 0, Math.PI * 2);
    ctx.arc(x + 9, y - 4, 2.2, 0, Math.PI * 2);
    ctx.fill();
  }

  function frame(now: number) {
    const t = Math.min(1, (now - t0) / DURATION_MS);
    // smoothstep
    const e = t * t * (3 - 2 * t);

    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, w, h);

    // rails
    ctx.strokeStyle = "#1a1ab0";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(w * 0.06, cy - r * 2.4);
    ctx.lineTo(w * 0.94, cy - r * 2.4);
    ctx.moveTo(w * 0.06, cy + r * 2.4);
    ctx.lineTo(w * 0.94, cy + r * 2.4);
    ctx.stroke();
    ctx.strokeStyle = "#2a2ad0";
    ctx.lineWidth = 1.5;
    ctx.strokeRect(w * 0.05, cy - r * 2.55, w * 0.9, r * 5.1);

    const pacX = pacStart + (pacEnd - pacStart) * e;
    const mouth = (Math.sin(now / 70) + 1) / 2; // 0..1 chomp

    // pellets ahead of pac get eaten
    for (const p of pellets) {
      if (!p.eaten && pacX >= p.x - r * 0.2) p.eaten = true;
      if (!p.eaten) {
        ctx.fillStyle = "#ffb897";
        ctx.beginPath();
        ctx.arc(p.x, cy, Math.max(2.5, r * 0.16), 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Ghost motion
    let ghostX: number;
    let ghostEaten = false;
    if (chase) {
      // ghost stays ahead, then gets caught
      const ahead = 95 + r;
      ghostX = pacX + ahead * (1 - e * 0.85);
      if (ghostX < pacX + r * 0.9) ghostX = pacX + r * 0.9;
      if (t > 0.82) {
        ghostX = pacX + r * 0.5;
      }
      if (t > 0.9) ghostEaten = true;
    } else {
      // hunt: always behind, slowly closing in
      const gap = 110 - e * 40;
      ghostX = pacX - gap;
    }

    const frightened = chase && t > 0.35 && !ghostEaten;
    if (!ghostEaten) {
      drawGhost(ghostX, cy, "#ff0000", frightened);
    } else {
      drawEyesOnly(ghostX + (t - 0.9) * 80, cy);
    }

    drawPac(pacX, cy, mouth);

    ctx.fillStyle = "rgba(255,255,255,0.5)";
    ctx.font = "12px ui-monospace, SFMono-Regular, Menlo, monospace";
    ctx.textAlign = "center";
    ctx.fillText(
      chase ? "pwnhub.in  →  portfolio" : "blog.pwnhub.in  →  lab notes",
      w / 2,
      h - 14,
    );

    if (t < 1) {
      requestAnimationFrame(frame);
    } else {
      window.clearTimeout(failSafe);
      window.setTimeout(go, 100);
    }
  }

  requestAnimationFrame(frame);
}

/** Soft-land on blog after Pac-Man handoff */
export function consumeXSiteArrival(): XSiteDirection | null {
  return readAndClearXSiteParam();
}
