/**
 * Pac-Man cross-site transition (blog).
 *
 * to-blog:      Pac-Man flees right eating candy; red ghost BEHIND hunting.
 * to-portfolio: Pac-Man chases blue ghost AHEAD and eats it.
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
  const cssW = Math.min(window.innerWidth, 960);
  const cssH = Math.min(Math.round(window.innerHeight * 0.48), 360);
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
  const R = Math.max(18, Math.min(28, W * 0.034));

  const chaseGhost = direction === "to-portfolio";
  const laneL = W * 0.07;
  const laneR = W * 0.93;
  const pathLen = laneR - laneL - R * 3;

  type Candy = { x: number; eaten: boolean; power: boolean };
  const candy: Candy[] = [];
  const n = 20;
  for (let i = 0; i < n; i++) {
    candy.push({
      x: laneL + R * 2.2 + (pathLen * i) / (n - 1),
      eaten: false,
      power: i === 0 || i === n - 1,
    });
  }

  const t0 = performance.now();
  let finished = false;

  const finish = () => {
    if (finished) return;
    finished = true;
    window.location.replace(withXSiteParam(url, direction));
  };
  const failSafe = window.setTimeout(finish, DURATION_MS + 500);

  function drawPac(x: number, y: number, mouth: number) {
    const a = (0.2 + mouth * 0.35) * Math.PI;
    ctx.save();
    ctx.translate(x, y);
    ctx.fillStyle = "#ffcc00";
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.arc(0, 0, R, a, -a, false);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "#111";
    ctx.beginPath();
    ctx.arc(R * 0.1, -R * 0.42, R * 0.13, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  /** Classic arcade ghost: dome top, sides, 3 bottom waves, big eyes */
  function drawGhost(
    x: number,
    y: number,
    bodyColor: string,
    lookRight: boolean,
    frightened: boolean,
  ) {
    const w = R * 1.75;
    const h = R * 2.15;
    const left = -w / 2;
    const right = w / 2;
    const top = -h * 0.48;
    const skirt = h * 0.38;
    const domeR = w / 2;

    ctx.save();
    ctx.translate(x, y);

    ctx.fillStyle = frightened ? "#2121ff" : bodyColor;
    ctx.beginPath();
    ctx.moveTo(left, skirt);
    ctx.lineTo(left, top + domeR);
    ctx.arc(0, top + domeR, domeR, Math.PI, 0, false);
    ctx.lineTo(right, skirt);
    const waves = 3;
    const waveW = w / waves;
    for (let i = 0; i < waves; i++) {
      const x0 = right - i * waveW;
      const x1 = x0 - waveW / 2;
      const x2 = x0 - waveW;
      ctx.quadraticCurveTo(x0 - waveW * 0.25, skirt + waveW * 0.55, x1, skirt);
      ctx.quadraticCurveTo(x2 + waveW * 0.25, skirt - waveW * 0.15, x2, skirt);
    }
    ctx.closePath();
    ctx.fill();

    const eyeY = -h * 0.12;
    const eyeX = w * 0.22;
    const eyeRx = w * 0.14;
    const eyeRy = w * 0.17;

    if (frightened) {
      ctx.fillStyle = "#fff";
      ctx.beginPath();
      ctx.arc(-eyeX, eyeY, eyeRx * 0.55, 0, Math.PI * 2);
      ctx.arc(eyeX, eyeY, eyeRx * 0.55, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#2121ff";
      ctx.beginPath();
      ctx.arc(-eyeX, eyeY, eyeRx * 0.28, 0, Math.PI * 2);
      ctx.arc(eyeX, eyeY, eyeRx * 0.28, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#fff";
      ctx.lineWidth = Math.max(1.5, R * 0.1);
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.beginPath();
      const my = h * 0.12;
      ctx.moveTo(-w * 0.28, my);
      ctx.lineTo(-w * 0.14, my + R * 0.12);
      ctx.lineTo(0, my);
      ctx.lineTo(w * 0.14, my + R * 0.12);
      ctx.lineTo(w * 0.28, my);
      ctx.stroke();
    } else {
      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.ellipse(-eyeX, eyeY, eyeRx, eyeRy, 0, 0, Math.PI * 2);
      ctx.ellipse(eyeX, eyeY, eyeRx, eyeRy, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#2121de";
      const look = lookRight ? eyeRx * 0.35 : -eyeRx * 0.35;
      const pupilR = eyeRx * 0.48;
      ctx.beginPath();
      ctx.arc(-eyeX + look, eyeY, pupilR, 0, Math.PI * 2);
      ctx.arc(eyeX + look, eyeY, pupilR, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  function drawEyes(x: number, y: number) {
    ctx.fillStyle = "#fff";
    ctx.beginPath();
    ctx.ellipse(x - 8, y, 5.5, 6.5, 0, 0, Math.PI * 2);
    ctx.ellipse(x + 8, y, 5.5, 6.5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#2121de";
    ctx.beginPath();
    ctx.arc(x - 6, y, 2.4, 0, Math.PI * 2);
    ctx.arc(x + 10, y, 2.4, 0, Math.PI * 2);
    ctx.fill();
  }

  function frame(now: number) {
    const t = Math.min(1, (now - t0) / DURATION_MS);
    const e = t * t * (3 - 2 * t);

    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, W, H);

    const top = cy - R * 2.7;
    const bot = cy + R * 2.7;
    ctx.strokeStyle = "#2121de";
    ctx.lineWidth = 4;
    ctx.strokeRect(laneL - 10, top - 6, laneR - laneL + 20, bot - top + 12);
    ctx.strokeStyle = "#1919a6";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(laneL, top);
    ctx.lineTo(laneR, top);
    ctx.moveTo(laneL, bot);
    ctx.lineTo(laneR, bot);
    ctx.stroke();

    const pathLen = laneR - laneL - R * 3;
    const pacX = laneL + R * 1.6 + pathLen * e;
    const mouth = (Math.sin(now / 60) + 1) / 2;

    let ghostX: number;
    let frightened = false;
    let eaten = false;

    if (chaseGhost) {
      // Ghost AHEAD — Pac-Man chases & eats
      frightened = t > 0.25;
      const lead = R * 5 * (1 - e * 0.7) + R * 1.4;
      ghostX = Math.min(laneR - R, pacX + lead);
      if (t > 0.78) ghostX = pacX + R * 0.85;
      if (t > 0.88) eaten = true;
    } else {
      // Ghost BEHIND — hunts Pac-Man (portfolio → blog)
      const minGap = R * 2.8;
      const startGap = R * 6.5;
      const gap = startGap - e * (startGap - minGap);
      ghostX = pacX - Math.max(gap, minGap);
      if (ghostX < laneL + R) ghostX = laneL + R;
    }

    const biteX = pacX + R * 0.35;
    for (const c of candy) {
      if (!c.eaten && biteX >= c.x) c.eaten = true;
      if (c.eaten) continue;
      ctx.fillStyle = c.power ? "#ffb897" : "#ffcc66";
      ctx.beginPath();
      ctx.arc(c.x, cy, c.power ? R * 0.42 : R * 0.22, 0, Math.PI * 2);
      ctx.fill();
    }

    if (!eaten) {
      drawGhost(ghostX, cy, "#ff0000", true, frightened);
    } else {
      drawEyes(ghostX + (t - 0.88) * 100, cy - 8);
    }

    drawPac(pacX, cy, mouth);

    ctx.fillStyle = "rgba(255,255,255,0.6)";
    ctx.font = "13px ui-monospace, Menlo, monospace";
    ctx.textAlign = "center";
    ctx.fillText(
      chaseGhost
        ? "→ portfolio  ·  Pac-Man eats the ghost"
        : "→ blog  ·  Pac-Man flees, ghost hunts from behind",
      W / 2,
      H - 14,
    );

    if (t < 1) requestAnimationFrame(frame);
    else {
      window.clearTimeout(failSafe);
      window.setTimeout(finish, 60);
    }
  }

  requestAnimationFrame(frame);
}

export function consumeXSiteArrival(): XSiteDirection | null {
  return readAndClearXSiteParam();
}
