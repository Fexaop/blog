/**
 * Pac-Man cross-site transition (canvas).
 *
 * to-blog:        Pac-Man AHEAD (right), eats candy; red ghost BEHIND hunting.
 * to-portfolio:   Pac-Man chases blue ghost ahead and eats it.
 *
 * Cross-origin handoff: ?xsite=… query param.
 */

import {
  withXSiteParam,
  readAndClearXSiteParam,
  type XSiteDirection,
} from "@/lib/site";

const DURATION_MS = 2800;

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
  const cssW = Math.min(window.innerWidth, 960);
  const cssH = Math.min(Math.round(window.innerHeight * 0.45), 340);
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(cssW * dpr);
  canvas.height = Math.round(cssH * dpr);
  canvas.style.width = `${cssW}px`;
  canvas.style.height = `${cssH}px`;
  overlay.appendChild(canvas);
  document.body.appendChild(overlay);
  document.body.style.overflow = "hidden";

  const ctx = canvas.getContext("2d")!;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  const W = cssW;
  const H = cssH;
  const cy = H * 0.5;
  const R = Math.max(16, Math.min(26, W * 0.032));

  const isChase = direction === "to-portfolio";
  const laneL = W * 0.08;
  const laneR = W * 0.92;

  type Candy = { x: number; eaten: boolean; power: boolean };
  const candy: Candy[] = [];
  const candyCount = 18;
  for (let i = 0; i < candyCount; i++) {
    candy.push({
      x: laneL + R * 2 + ((laneR - laneL - R * 4) * i) / (candyCount - 1),
      eaten: false,
      power: i === 0 || i === candyCount - 1,
    });
  }

  const t0 = performance.now();
  let done = false;

  const finish = () => {
    if (done) return;
    done = true;
    // Sets cookie Domain=.pwnhub.in + ?xsite= query (cross-origin safe)
    window.location.replace(withXSiteParam(url, direction));
  };
  const failSafe = window.setTimeout(finish, DURATION_MS + 700);

  function drawPac(x: number, y: number, mouth: number) {
    const open = 0.18 + mouth * 0.32;
    ctx.save();
    ctx.translate(x, y);
    ctx.fillStyle = "#ffe14f";
    ctx.beginPath();
    ctx.moveTo(0, 0);
    // Face RIGHT — mouth opens toward +x
    ctx.arc(0, 0, R, open * Math.PI, (2 - open) * Math.PI, false);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "#111";
    ctx.beginPath();
    ctx.arc(R * 0.05, -R * 0.45, R * 0.14, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function drawGhost(
    x: number,
    y: number,
    color: string,
    lookDir: number,
    frightened: boolean,
  ) {
    const gw = R * 1.85;
    const gh = R * 2.0;
    ctx.save();
    ctx.translate(x, y);

    ctx.fillStyle = frightened ? "#2121ff" : color;
    ctx.beginPath();
    ctx.arc(0, -gh * 0.15, gw / 2, Math.PI, 0, false);
    ctx.lineTo(gw / 2, gh * 0.4);
    for (let i = 3; i >= 0; i--) {
      const t = i / 3;
      const sx = gw / 2 - gw * t;
      const sy = gh * 0.4 + (i % 2 === 0 ? 0 : -gh * 0.16);
      ctx.lineTo(sx, sy);
    }
    ctx.closePath();
    ctx.fill();

    const ey = -gh * 0.2;
    const ex = gw * 0.2;
    ctx.fillStyle = "#fff";
    ctx.beginPath();
    ctx.ellipse(-ex, ey, gw * 0.15, gw * 0.18, 0, 0, Math.PI * 2);
    ctx.ellipse(ex, ey, gw * 0.15, gw * 0.18, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = frightened ? "#fff" : "#2121de";
    const px = lookDir * gw * 0.06;
    ctx.beginPath();
    ctx.arc(-ex + px, ey, gw * 0.08, 0, Math.PI * 2);
    ctx.arc(ex + px, ey, gw * 0.08, 0, Math.PI * 2);
    ctx.fill();

    if (frightened) {
      ctx.strokeStyle = "#ffb8ff";
      ctx.lineWidth = 1.6;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(-gw * 0.3, gh * 0.08);
      ctx.quadraticCurveTo(-gw * 0.1, gh * 0.2, 0, gh * 0.08);
      ctx.quadraticCurveTo(gw * 0.1, -gh * 0.02, gw * 0.3, gh * 0.08);
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawGhostEyes(x: number, y: number) {
    ctx.fillStyle = "#fff";
    ctx.beginPath();
    ctx.ellipse(x - 8, y - 3, 6, 7, 0, 0, Math.PI * 2);
    ctx.ellipse(x + 8, y - 3, 6, 7, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#2121de";
    ctx.beginPath();
    ctx.arc(x - 6, y - 3, 2.5, 0, Math.PI * 2);
    ctx.arc(x + 10, y - 3, 2.5, 0, Math.PI * 2);
    ctx.fill();
  }

  function frame(now: number) {
    const t = Math.min(1, (now - t0) / DURATION_MS);
    const e = t * t * (3 - 2 * t);

    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, W, H);

    const railY1 = cy - R * 2.6;
    const railY2 = cy + R * 2.6;
    ctx.strokeStyle = "#2121de";
    ctx.lineWidth = 3.5;
    ctx.strokeRect(laneL - 8, railY1 - 4, laneR - laneL + 16, railY2 - railY1 + 8);
    ctx.strokeStyle = "#1919a6";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(laneL, railY1);
    ctx.lineTo(laneR, railY1);
    ctx.moveTo(laneL, railY2);
    ctx.lineTo(laneR, railY2);
    ctx.stroke();

    // Pac-Man moves left → right (always AHEAD of hunting ghost)
    const pacX = laneL + R * 1.5 + (laneR - laneL - R * 3) * e;

    let ghostX: number;
    let ghostEaten = false;
    let ghostFrightened = false;
    const ghostLook = 1; // look right toward / along path

    if (isChase) {
      ghostFrightened = t > 0.28;
      const lead = R * 4.5 * (1 - e * 0.75) + R * 1.2;
      ghostX = pacX + lead;
      if (t > 0.8) ghostX = pacX + R * 0.7;
      if (t > 0.88) ghostEaten = true;
    } else {
      // HUNT: ghost BEHIND (left of) Pac-Man — Pac-Man is ahead eating candy
      const gap = R * 5.5 - e * R * 2.2;
      ghostX = pacX - Math.max(gap, R * 3.2);
    }

    // candy
    const mouthFront = pacX + R * 0.55;
    for (const c of candy) {
      if (!c.eaten && mouthFront >= c.x) c.eaten = true;
      if (c.eaten) continue;
      ctx.fillStyle = c.power ? "#ffb897" : "#ffb8ae";
      ctx.beginPath();
      ctx.arc(c.x, cy, c.power ? R * 0.38 : R * 0.2, 0, Math.PI * 2);
      ctx.fill();
    }

    if (!ghostEaten) {
      drawGhost(ghostX, cy, "#ff0000", ghostLook, ghostFrightened);
    } else {
      drawGhostEyes(ghostX + (t - 0.88) * W * 0.15, cy - (t - 0.88) * 40);
    }

    const mouth = (Math.sin(now / 65) + 1) / 2;
    drawPac(pacX, cy, mouth);

    ctx.fillStyle = "rgba(255,255,255,0.55)";
    ctx.font = "13px ui-monospace, SFMono-Regular, Menlo, monospace";
    ctx.textAlign = "center";
    ctx.fillText(
      isChase
        ? "→  pwnhub.in  (chase the ghost)"
        : "→  blog.pwnhub.in  (ghost is hunting you)",
      W / 2,
      H - 16,
    );

    if (t < 1) {
      requestAnimationFrame(frame);
    } else {
      window.clearTimeout(failSafe);
      window.setTimeout(finish, 80);
    }
  }

  requestAnimationFrame(frame);
}

export function consumeXSiteArrival(): XSiteDirection | null {
  return readAndClearXSiteParam();
}
