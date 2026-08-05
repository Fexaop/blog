/**
 * Fullscreen Pac-Man cross-site transition.
 * - to-blog: Pac-Man eats pellets while hunted by a ghost
 * - to-portfolio: reverse — Pac-Man chases and eats the ghost
 * Then silently navigates (no browser loading chrome we control; overlay stays until unload).
 */

import { XSITE_KEY, type XSiteDirection } from "@/lib/site";

const DURATION_MS = 2400;

export function playPacmanTransition(
  url: string,
  direction: XSiteDirection,
): void {
  if (typeof window === "undefined") return;
  if (document.getElementById("pwnhub-pacman-overlay")) return;

  const overlay = document.createElement("div");
  overlay.id = "pwnhub-pacman-overlay";
  overlay.setAttribute("role", "presentation");
  overlay.style.cssText = [
    "position:fixed",
    "inset:0",
    "z-index:2147483646",
    "background:#000",
    "display:flex",
    "align-items:center",
    "justify-content:center",
    "cursor:wait",
  ].join(";");

  const canvas = document.createElement("canvas");
  canvas.width = Math.min(window.innerWidth, 960);
  canvas.height = Math.min(window.innerHeight, 360);
  canvas.style.cssText = "width:min(100vw,960px);height:auto;max-height:50vh";
  overlay.appendChild(canvas);
  document.body.appendChild(overlay);
  document.body.style.overflow = "hidden";

  const ctx = canvas.getContext("2d")!;
  const w = canvas.width;
  const h = canvas.height;
  const cy = h / 2;
  const scale = Math.max(0.7, Math.min(w / 640, 1.4));
  const r = 18 * scale;

  const reverse = direction === "to-portfolio";
  // reverse: pacman chases ghost leftward; normal: pacman flees right, ghost hunts
  const pacStart = reverse ? w * 0.15 : w * 0.12;
  const pacEnd = reverse ? w * 0.78 : w * 0.72;
  const ghostOffset = reverse ? 90 * scale : -100 * scale;

  // pellets
  const pellets: { x: number; eaten: boolean }[] = [];
  const pelletStart = w * 0.18;
  const pelletEnd = w * 0.82;
  const pelletCount = 14;
  for (let i = 0; i < pelletCount; i++) {
    pellets.push({
      x: pelletStart + ((pelletEnd - pelletStart) * i) / (pelletCount - 1),
      eaten: false,
    });
  }

  const t0 = performance.now();
  let navigated = false;

  const go = () => {
    if (navigated) return;
    navigated = true;
    try {
      sessionStorage.setItem(XSITE_KEY, direction);
    } catch {
      /* private mode */
    }
    // Keep overlay painted during navigation so native loading chrome is covered
    window.location.href = url;
  };

  // Soft timeout if animation stalls
  const failSafe = window.setTimeout(go, DURATION_MS + 800);

  function drawPac(x: number, y: number, facingRight: boolean, mouth: number) {
    const open = 0.25 + mouth * 0.35;
    ctx.fillStyle = "#ffe14f";
    ctx.beginPath();
    if (facingRight) {
      ctx.arc(x, y, r, open * Math.PI, (2 - open) * Math.PI, false);
    } else {
      ctx.arc(x, y, r, (1 + open) * Math.PI, (1 - open) * Math.PI, false);
    }
    ctx.lineTo(x, y);
    ctx.closePath();
    ctx.fill();

    // eye
    ctx.fillStyle = "#111";
    const ex = facingRight ? x + r * 0.15 : x - r * 0.15;
    ctx.beginPath();
    ctx.arc(ex, y - r * 0.35, r * 0.12, 0, Math.PI * 2);
    ctx.fill();
  }

  function drawGhost(
    x: number,
    y: number,
    color: string,
    frightened: boolean,
  ) {
    const gh = r * 1.85;
    const gw = r * 1.7;
    ctx.fillStyle = frightened ? "#2121ff" : color;
    ctx.beginPath();
    ctx.arc(x, y - gh * 0.15, gw / 2, Math.PI, 0, false);
    ctx.lineTo(x + gw / 2, y + gh * 0.45);
    // scalloped bottom
    const scallops = 4;
    for (let i = scallops; i >= 0; i--) {
      const sx = x + gw / 2 - (gw * i) / scallops;
      const sy =
        y + gh * 0.45 + (i % 2 === 0 ? 0 : -gh * 0.12);
      ctx.lineTo(sx, sy);
    }
    ctx.closePath();
    ctx.fill();

    // eyes
    ctx.fillStyle = "#fff";
    const eyeY = y - gh * 0.2;
    ctx.beginPath();
    ctx.ellipse(x - gw * 0.18, eyeY, gw * 0.12, gw * 0.15, 0, 0, Math.PI * 2);
    ctx.ellipse(x + gw * 0.18, eyeY, gw * 0.12, gw * 0.15, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = frightened ? "#fff" : "#2121de";
    ctx.beginPath();
    ctx.arc(x - gw * 0.15, eyeY, gw * 0.06, 0, Math.PI * 2);
    ctx.arc(x + gw * 0.21, eyeY, gw * 0.06, 0, Math.PI * 2);
    ctx.fill();
  }

  function frame(now: number) {
    const t = Math.min(1, (now - t0) / DURATION_MS);
    // ease in-out
    const e = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;

    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, w, h);

    // corridor rails
    ctx.strokeStyle = "#2121de";
    ctx.lineWidth = 3 * scale;
    ctx.beginPath();
    ctx.moveTo(w * 0.08, cy - r * 2.2);
    ctx.lineTo(w * 0.92, cy - r * 2.2);
    ctx.moveTo(w * 0.08, cy + r * 2.2);
    ctx.lineTo(w * 0.92, cy + r * 2.2);
    ctx.stroke();

    const pacX = pacStart + (pacEnd - pacStart) * e;
    const facingRight = !reverse;
    const mouth = (Math.sin(now / 80) + 1) / 2;

    // eat pellets when pacman passes
    for (const p of pellets) {
      if (!p.eaten) {
        const crossed = reverse ? pacX > p.x - r * 0.4 : pacX > p.x - r * 0.4;
        if (crossed && Math.abs(pacX - p.x) < r * 1.2) p.eaten = true;
      }
      if (!p.eaten) {
        ctx.fillStyle = "#ffb8ae";
        ctx.beginPath();
        ctx.arc(p.x, cy, 3.5 * scale, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    let ghostX = pacX + ghostOffset;
    // reverse: ghost flees ahead then gets caught near the end
    if (reverse) {
      const flee = pacStart + 70 * scale + (pacEnd - pacStart) * Math.min(1, e * 1.05);
      ghostX = flee;
      if (t > 0.82) {
        // snap toward pac for "eat"
        ghostX = pacX + r * 0.3;
      }
    } else {
      // hunt: close the gap slightly over time
      ghostX = pacX - 95 * scale + e * 28 * scale;
    }

    const frightened = reverse && t > 0.55;
    if (!(reverse && t > 0.9)) {
      drawGhost(ghostX, cy, "#ff0000", frightened);
    } else {
      // eyes only after eaten
      ctx.fillStyle = "#fff";
      ctx.beginPath();
      ctx.arc(ghostX - 6, cy - 4, 4 * scale, 0, Math.PI * 2);
      ctx.arc(ghostX + 6, cy - 4, 4 * scale, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#2121de";
      ctx.beginPath();
      ctx.arc(ghostX - 5, cy - 4, 2 * scale, 0, Math.PI * 2);
      ctx.arc(ghostX + 7, cy - 4, 2 * scale, 0, Math.PI * 2);
      ctx.fill();
    }

    drawPac(pacX, cy, facingRight, mouth);

    // caption
    ctx.fillStyle = "rgba(255,255,255,0.55)";
    ctx.font = `${12 * scale}px ui-monospace, monospace`;
    ctx.textAlign = "center";
    ctx.fillText(
      reverse ? "pwnhub.in  ←  chasing the stack" : "blog.pwnhub.in  →  writing mode",
      w / 2,
      h - 16 * scale,
    );

    if (t < 1) {
      requestAnimationFrame(frame);
    } else {
      window.clearTimeout(failSafe);
      // brief hold then navigate
      window.setTimeout(go, 120);
    }
  }

  requestAnimationFrame(frame);
}

/** On arrival: skip loaders / flash if we came via Pac-Man handoff */
export function consumeXSiteArrival(): XSiteDirection | null {
  if (typeof window === "undefined") return null;
  try {
    const v = sessionStorage.getItem(XSITE_KEY) as XSiteDirection | null;
    if (v === "to-blog" || v === "to-portfolio") {
      sessionStorage.removeItem(XSITE_KEY);
      return v;
    }
  } catch {
    /* ignore */
  }
  return null;
}
