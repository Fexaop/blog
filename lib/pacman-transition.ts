/**
 * Pac-Man cross-site transition (blog).
 *
 * Cinematic handoff by default. Press Space during it to play a real maze.
 * Esc / Enter finishes and navigates.
 */

import {
  withXSiteParam,
  readAndClearXSiteParam,
  type XSiteDirection,
} from "@/lib/site";

const CINEMA_MS = 2600;

// 0 empty  1 wall  2 pellet  3 power  4 gate
const MAZE: number[][] = [
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
  [1, 2, 2, 2, 2, 2, 2, 2, 2, 1, 2, 2, 2, 2, 2, 2, 2, 2, 1],
  [1, 3, 1, 1, 2, 1, 1, 1, 2, 1, 2, 1, 1, 1, 2, 1, 1, 3, 1],
  [1, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 1],
  [1, 2, 1, 1, 2, 1, 2, 1, 1, 1, 1, 1, 2, 1, 2, 1, 1, 2, 1],
  [1, 2, 2, 2, 2, 1, 2, 2, 2, 1, 2, 2, 2, 1, 2, 2, 2, 2, 1],
  [1, 1, 1, 1, 2, 1, 1, 1, 0, 1, 0, 1, 1, 1, 2, 1, 1, 1, 1],
  [0, 0, 0, 1, 2, 1, 0, 0, 0, 0, 0, 0, 0, 1, 2, 1, 0, 0, 0],
  [1, 1, 1, 1, 2, 1, 0, 1, 1, 4, 1, 1, 0, 1, 2, 1, 1, 1, 1],
  [0, 0, 0, 0, 2, 0, 0, 1, 0, 0, 0, 1, 0, 0, 2, 0, 0, 0, 0],
  [1, 1, 1, 1, 2, 1, 0, 1, 1, 1, 1, 1, 0, 1, 2, 1, 1, 1, 1],
  [0, 0, 0, 1, 2, 1, 0, 0, 0, 0, 0, 0, 0, 1, 2, 1, 0, 0, 0],
  [1, 1, 1, 1, 2, 1, 0, 1, 1, 1, 1, 1, 0, 1, 2, 1, 1, 1, 1],
  [1, 2, 2, 2, 2, 2, 2, 2, 2, 1, 2, 2, 2, 2, 2, 2, 2, 2, 1],
  [1, 2, 1, 1, 2, 1, 1, 1, 2, 1, 2, 1, 1, 1, 2, 1, 1, 2, 1],
  [1, 3, 2, 1, 2, 2, 2, 2, 2, 0, 2, 2, 2, 2, 2, 1, 2, 3, 1],
  [1, 1, 2, 1, 2, 1, 2, 1, 1, 1, 1, 1, 2, 1, 2, 1, 2, 1, 1],
  [1, 2, 2, 2, 2, 1, 2, 2, 2, 1, 2, 2, 2, 1, 2, 2, 2, 2, 1],
  [1, 2, 1, 1, 1, 1, 1, 1, 2, 1, 2, 1, 1, 1, 1, 1, 1, 2, 1],
  [1, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 1],
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
];

const ROWS = MAZE.length;
const COLS = MAZE[0].length;
const DIRS = [
  { x: 1, y: 0 },
  { x: -1, y: 0 },
  { x: 0, y: -1 },
  { x: 0, y: 1 },
] as const;

type Dir = { x: number; y: number };

type Ghost = {
  x: number;
  y: number;
  dir: Dir;
  color: string;
  mode: "chase" | "frightened" | "eaten";
  home: { x: number; y: number };
};

function cloneMaze(): number[][] {
  return MAZE.map((row) => row.slice());
}

function isWall(grid: number[][], c: number, r: number, allowGate = false) {
  if (r < 0 || r >= ROWS || c < 0 || c >= COLS) return true;
  const cell = grid[r][c];
  if (cell === 1) return true;
  if (cell === 4 && !allowGate) return true;
  return false;
}

function wrapCol(c: number) {
  if (c < 0) return COLS - 1;
  if (c >= COLS) return 0;
  return c;
}

function countPellets(grid: number[][]) {
  let n = 0;
  for (const row of grid) for (const v of row) if (v === 2 || v === 3) n++;
  return n;
}

export function playPacmanTransition(
  url: string,
  direction: XSiteDirection,
): void {
  if (typeof window === "undefined") return;
  if (document.getElementById("pwnhub-pacman-overlay")) return;

  const overlay = document.createElement("div");
  overlay.id = "pwnhub-pacman-overlay";
  overlay.setAttribute("role", "presentation");
  overlay.tabIndex = 0;
  overlay.style.cssText =
    "position:fixed;inset:0;z-index:2147483646;background:#000;display:flex;flex-direction:column;align-items:center;justify-content:center;cursor:default;outline:none";

  const canvas = document.createElement("canvas");
  overlay.appendChild(canvas);
  document.body.appendChild(overlay);
  document.body.style.overflow = "hidden";
  overlay.focus();

  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const ctx = canvas.getContext("2d")!;

  let finished = false;
  let mode: "cinema" | "game" = "cinema";
  let cinemaRaf = 0;
  let gameRaf = 0;
  let failSafe = 0;
  let powerUntil = 0;
  let score = 0;
  let lives = 3;
  let mouth = 0;
  let lastTs = 0;
  let invulnUntil = 0;
  let won = false;
  let deadFlash = 0;

  const finish = () => {
    if (finished) return;
    finished = true;
    window.clearTimeout(failSafe);
    cancelAnimationFrame(cinemaRaf);
    cancelAnimationFrame(gameRaf);
    window.removeEventListener("keydown", onKeyDown);
    window.removeEventListener("keyup", onKeyUp);
    window.location.replace(withXSiteParam(url, direction));
  };

  const keys = new Set<string>();
  const onKeyDown = (e: KeyboardEvent) => {
    if (e.code === "Space") {
      e.preventDefault();
      if (mode === "cinema") startGame();
      return;
    }
    if (e.code === "Escape" || e.code === "Enter") {
      e.preventDefault();
      finish();
      return;
    }
    if (mode === "game") {
      keys.add(e.code);
      e.preventDefault();
    }
  };
  const onKeyUp = (e: KeyboardEvent) => {
    keys.delete(e.code);
  };
  window.addEventListener("keydown", onKeyDown);
  window.addEventListener("keyup", onKeyUp);

  // —— cinema state ——
  const chaseGhost = direction === "to-portfolio";
  let cinemaW = 0;
  let cinemaH = 0;

  function sizeCinema() {
    cinemaW = Math.min(window.innerWidth, 960);
    cinemaH = Math.min(Math.round(window.innerHeight * 0.48), 360);
    canvas.width = Math.round(cinemaW * dpr);
    canvas.height = Math.round(cinemaH * dpr);
    canvas.style.width = `${cinemaW}px`;
    canvas.style.height = `${cinemaH}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function drawPacFace(
    x: number,
    y: number,
    r: number,
    facing: Dir,
    open: number,
  ) {
    const base = Math.atan2(facing.y, facing.x);
    const a = (0.18 + open * 0.32) * Math.PI;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(base);
    ctx.fillStyle = "#ffcc00";
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.arc(0, 0, r, a, -a, false);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "#111";
    ctx.beginPath();
    ctx.arc(r * 0.08, -r * 0.42, r * 0.12, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function drawGhostBody(
    x: number,
    y: number,
    r: number,
    bodyColor: string,
    look: Dir,
    frightened: boolean,
  ) {
    const w = r * 1.75;
    const h = r * 2.15;
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
    } else {
      ctx.fillStyle = "#fff";
      ctx.beginPath();
      ctx.ellipse(-eyeX, eyeY, eyeRx, eyeRy, 0, 0, Math.PI * 2);
      ctx.ellipse(eyeX, eyeY, eyeRx, eyeRy, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#2121de";
      const lx = look.x * eyeRx * 0.4;
      const ly = look.y * eyeRy * 0.35;
      const pupilR = eyeRx * 0.48;
      ctx.beginPath();
      ctx.arc(-eyeX + lx, eyeY + ly, pupilR, 0, Math.PI * 2);
      ctx.arc(eyeX + lx, eyeY + ly, pupilR, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  // cinema loop
  sizeCinema();
  const t0 = performance.now();
  failSafe = window.setTimeout(finish, CINEMA_MS + 800);

  type Candy = { x: number; eaten: boolean; power: boolean };
  const candy: Candy[] = [];
  {
    const laneL = cinemaW * 0.07;
    const laneR = cinemaW * 0.93;
    const R = Math.max(18, Math.min(28, cinemaW * 0.034));
    const pathLen = laneR - laneL - R * 3;
    const n = 20;
    for (let i = 0; i < n; i++) {
      candy.push({
        x: laneL + R * 2.2 + (pathLen * i) / (n - 1),
        eaten: false,
        power: i === 0 || i === n - 1,
      });
    }
  }

  function cinemaFrame(now: number) {
    if (mode !== "cinema" || finished) return;
    const W = cinemaW;
    const H = cinemaH;
    const cy = H * 0.5;
    const R = Math.max(18, Math.min(28, W * 0.034));
    const laneL = W * 0.07;
    const laneR = W * 0.93;
    const pathLen = laneR - laneL - R * 3;
    const t = Math.min(1, (now - t0) / CINEMA_MS);
    const e = t * t * (3 - 2 * t);

    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, W, H);

    const top = cy - R * 2.7;
    const bot = cy + R * 2.7;
    ctx.strokeStyle = "#2121de";
    ctx.lineWidth = 4;
    ctx.strokeRect(laneL - 10, top - 6, laneR - laneL + 20, bot - top + 12);

    const pacX = laneL + R * 1.6 + pathLen * e;
    const open = (Math.sin(now / 60) + 1) / 2;
    let ghostX: number;
    let frightened = false;
    let eaten = false;

    if (chaseGhost) {
      frightened = t > 0.25;
      const lead = R * 5 * (1 - e * 0.7) + R * 1.4;
      ghostX = Math.min(laneR - R, pacX + lead);
      if (t > 0.78) ghostX = pacX + R * 0.85;
      if (t > 0.88) eaten = true;
    } else {
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
      drawGhostBody(ghostX, cy, R, "#ff0000", { x: 1, y: 0 }, frightened);
    }
    drawPacFace(pacX, cy, R, { x: 1, y: 0 }, open);

    ctx.fillStyle = "rgba(255,255,255,0.75)";
    ctx.font = "13px Monaco, Menlo, monospace";
    ctx.textAlign = "center";
    ctx.fillText(
      chaseGhost ? "→ portfolio" : "→ blog",
      W / 2,
      H - 28,
    );
    ctx.fillStyle = "#ffcc00";
    ctx.font = "12px Monaco, Menlo, monospace";
    ctx.fillText("space = play for real   ·   esc = skip", W / 2, H - 10);

    if (t < 1) cinemaRaf = requestAnimationFrame(cinemaFrame);
    else {
      window.clearTimeout(failSafe);
      window.setTimeout(finish, 80);
    }
  }

  cinemaRaf = requestAnimationFrame(cinemaFrame);

  // —— full game ——
  let grid = cloneMaze();
  let pac = { x: 9.5, y: 15.5, dir: { x: -1, y: 0 } as Dir, next: { x: -1, y: 0 } as Dir };
  let ghosts: Ghost[] = [];
  let cell = 20;
  let offsetX = 0;
  let offsetY = 0;
  let remaining = 0;

  function resetActors() {
    pac = { x: 9.5, y: 15.5, dir: { x: -1, y: 0 }, next: { x: -1, y: 0 } };
    ghosts = [
      { x: 9.5, y: 9.5, dir: { x: -1, y: 0 }, color: "#ff0000", mode: "chase", home: { x: 9.5, y: 9.5 } },
      { x: 8.5, y: 9.5, dir: { x: 1, y: 0 }, color: "#ffb8ff", mode: "chase", home: { x: 8.5, y: 9.5 } },
      { x: 10.5, y: 9.5, dir: { x: -1, y: 0 }, color: "#00ffff", mode: "chase", home: { x: 10.5, y: 9.5 } },
      { x: 9.5, y: 8.5, dir: { x: 0, y: -1 }, color: "#ffb852", mode: "chase", home: { x: 9.5, y: 8.5 } },
    ];
  }

  function layoutGame() {
    const maxW = Math.min(window.innerWidth - 24, 720);
    const maxH = Math.min(window.innerHeight - 80, 760);
    cell = Math.floor(Math.min(maxW / COLS, maxH / ROWS));
    const w = cell * COLS;
    const h = cell * ROWS + 36;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    offsetX = 0;
    offsetY = 28;
  }

  function startGame() {
    if (mode === "game") return;
    mode = "game";
    window.clearTimeout(failSafe);
    cancelAnimationFrame(cinemaRaf);
    overlay.style.cursor = "none";
    grid = cloneMaze();
    remaining = countPellets(grid);
    score = 0;
    lives = 3;
    powerUntil = 0;
    invulnUntil = 0;
    won = false;
    deadFlash = 0;
    resetActors();
    layoutGame();
    lastTs = performance.now();
    gameRaf = requestAnimationFrame(gameFrame);
  }

  function wantDir(): Dir | null {
    if (keys.has("ArrowRight") || keys.has("KeyD")) return { x: 1, y: 0 };
    if (keys.has("ArrowLeft") || keys.has("KeyA")) return { x: -1, y: 0 };
    if (keys.has("ArrowUp") || keys.has("KeyW")) return { x: 0, y: -1 };
    if (keys.has("ArrowDown") || keys.has("KeyS")) return { x: 0, y: 1 };
    return null;
  }

  function nearCenter(v: number) {
    return Math.abs(v - Math.floor(v) - 0.5) < 0.12;
  }

  function tryTurn(entity: { x: number; y: number; dir: Dir }, next: Dir, allowGate = false) {
    if (!nearCenter(entity.x) || !nearCenter(entity.y)) return false;
    const cx = Math.floor(entity.x);
    const cy = Math.floor(entity.y);
    const nx = wrapCol(cx + next.x);
    const ny = cy + next.y;
    if (isWall(grid, nx, ny, allowGate)) return false;
    entity.x = cx + 0.5;
    entity.y = cy + 0.5;
    entity.dir = next;
    return true;
  }

  function moveEntity(
    entity: { x: number; y: number; dir: Dir },
    speed: number,
    dt: number,
    allowGate = false,
  ) {
    const step = speed * dt;
    const cx = Math.floor(entity.x);
    const cy = Math.floor(entity.y);
    const aheadC = wrapCol(cx + entity.dir.x);
    const aheadR = cy + entity.dir.y;
    if (isWall(grid, aheadC, aheadR, allowGate) && nearCenter(entity.x) && nearCenter(entity.y)) {
      entity.x = cx + 0.5;
      entity.y = cy + 0.5;
      return;
    }
    entity.x += entity.dir.x * step;
    entity.y += entity.dir.y * step;
    if (entity.x < 0) entity.x += COLS;
    if (entity.x >= COLS) entity.x -= COLS;
  }

  function pickGhostDir(g: Ghost, now: number) {
    const cx = Math.floor(g.x);
    const cy = Math.floor(g.y);
    if (!nearCenter(g.x) || !nearCenter(g.y)) return;

    const options: Dir[] = [];
    for (const d of DIRS) {
      if (d.x === -g.dir.x && d.y === -g.dir.y) continue;
      const nx = wrapCol(cx + d.x);
      const ny = cy + d.y;
      if (!isWall(grid, nx, ny, g.mode === "eaten")) options.push(d);
    }
    if (options.length === 0) {
      g.dir = { x: -g.dir.x, y: -g.dir.y };
      return;
    }

    let targetX = pac.x;
    let targetY = pac.y;
    if (g.mode === "eaten") {
      targetX = g.home.x;
      targetY = g.home.y;
    } else if (g.mode === "frightened") {
      g.dir = options[Math.floor(Math.random() * options.length)];
      g.x = cx + 0.5;
      g.y = cy + 0.5;
      return;
    } else {
      // slight personality offset by color
      if (g.color === "#00ffff") {
        targetX = pac.x + pac.dir.x * 2;
        targetY = pac.y + pac.dir.y * 2;
      } else if (g.color === "#ffb852") {
        targetX = pac.x - 2;
        targetY = pac.y;
      } else if (g.color === "#ffb8ff") {
        targetX = pac.x;
        targetY = pac.y - 2;
      }
    }

    let best = options[0];
    let bestD = Infinity;
    for (const d of options) {
      const nx = wrapCol(cx + d.x) + 0.5;
      const ny = cy + d.y + 0.5;
      const dist = (nx - targetX) ** 2 + (ny - targetY) ** 2;
      if (dist < bestD) {
        bestD = dist;
        best = d;
      }
    }
    g.dir = best;
    g.x = cx + 0.5;
    g.y = cy + 0.5;
    void now;
  }

  function killPac(now: number) {
    if (now < invulnUntil) return;
    lives -= 1;
    deadFlash = now + 700;
    invulnUntil = now + 1200;
    if (lives <= 0) {
      // free continue after a beat — it's a transition, not a coin-op
      window.setTimeout(finish, 900);
      return;
    }
    resetActors();
    for (const g of ghosts) g.mode = "chase";
    powerUntil = 0;
  }

  function gameFrame(now: number) {
    if (mode !== "game" || finished) return;
    const dt = Math.min(0.04, (now - lastTs) / 1000);
    lastTs = now;
    mouth = (mouth + dt * 10) % (Math.PI * 2);

    if (!won && lives > 0 && now > deadFlash) {
      const w = wantDir();
      if (w) pac.next = w;
      tryTurn(pac, pac.next);
      moveEntity(pac, 5.2, dt);

      // pellets
      const pc = Math.floor(pac.x);
      const pr = Math.floor(pac.y);
      if (pr >= 0 && pr < ROWS) {
        const cellV = grid[pr][pc];
        if (cellV === 2) {
          grid[pr][pc] = 0;
          score += 10;
          remaining -= 1;
        } else if (cellV === 3) {
          grid[pr][pc] = 0;
          score += 50;
          remaining -= 1;
          powerUntil = now + 6000;
          for (const g of ghosts) if (g.mode !== "eaten") g.mode = "frightened";
        }
      }

      if (remaining <= 0) {
        won = true;
        window.setTimeout(finish, 1200);
      }

      const frightened = now < powerUntil;
      if (!frightened) {
        for (const g of ghosts) if (g.mode === "frightened") g.mode = "chase";
      }

      for (const g of ghosts) {
        if (g.mode === "eaten") {
          const dx = g.home.x - g.x;
          const dy = g.home.y - g.y;
          if (dx * dx + dy * dy < 0.08) {
            g.mode = "chase";
            g.x = g.home.x;
            g.y = g.home.y;
          }
        }
        pickGhostDir(g, now);
        const spd = g.mode === "frightened" ? 2.8 : g.mode === "eaten" ? 7 : 4.2;
        moveEntity(g, spd, dt, g.mode === "eaten");

        const ddx = g.x - pac.x;
        const ddy = g.y - pac.y;
        if (ddx * ddx + ddy * ddy < 0.35) {
          if (g.mode === "frightened") {
            g.mode = "eaten";
            score += 200;
          } else if (g.mode === "chase") {
            killPac(now);
          }
        }
      }
    }

    // draw
    const W = cell * COLS;
    const H = cell * ROWS + 36;
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, W, H);

    ctx.fillStyle = "#ffcc00";
    ctx.font = `bold ${Math.max(12, cell * 0.55)}px Monaco, Menlo, monospace`;
    ctx.textAlign = "left";
    ctx.fillText(`SCORE ${score}`, 8, 18);
    ctx.textAlign = "right";
    ctx.fillText(`${"♥".repeat(Math.max(0, lives))}`, W - 8, 18);
    ctx.textAlign = "center";
    ctx.fillStyle = "rgba(255,255,255,0.45)";
    ctx.font = "11px Monaco, Menlo, monospace";
    ctx.fillText("arrows/wasd  ·  esc continue", W / 2, 18);

    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const v = grid[r][c];
        const x = offsetX + c * cell;
        const y = offsetY + r * cell;
        if (v === 1) {
          ctx.fillStyle = "#2121de";
          ctx.fillRect(x + 1, y + 1, cell - 2, cell - 2);
        } else if (v === 4) {
          ctx.fillStyle = "#ffb8ff";
          ctx.fillRect(x + 2, y + cell * 0.42, cell - 4, 2);
        } else if (v === 2) {
          ctx.fillStyle = "#ffb897";
          ctx.beginPath();
          ctx.arc(x + cell / 2, y + cell / 2, cell * 0.1, 0, Math.PI * 2);
          ctx.fill();
        } else if (v === 3) {
          ctx.fillStyle = "#ffb897";
          ctx.beginPath();
          ctx.arc(x + cell / 2, y + cell / 2, cell * 0.28, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }

    const pr = cell * 0.42;
    for (const g of ghosts) {
      const gx = offsetX + g.x * cell;
      const gy = offsetY + g.y * cell;
      if (g.mode === "eaten") {
        ctx.fillStyle = "#fff";
        ctx.beginPath();
        ctx.ellipse(gx - 4, gy, 3.5, 4, 0, 0, Math.PI * 2);
        ctx.ellipse(gx + 4, gy, 3.5, 4, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#2121de";
        ctx.beginPath();
        ctx.arc(gx - 3, gy, 1.5, 0, Math.PI * 2);
        ctx.arc(gx + 5, gy, 1.5, 0, Math.PI * 2);
        ctx.fill();
      } else {
        drawGhostBody(
          gx,
          gy,
          pr,
          g.color,
          g.dir,
          g.mode === "frightened",
        );
      }
    }

    if (now > deadFlash || lives <= 0) {
      const open = (Math.sin(mouth) + 1) / 2;
      drawPacFace(
        offsetX + pac.x * cell,
        offsetY + pac.y * cell,
        pr,
        pac.dir,
        open,
      );
    }

    if (won) {
      ctx.fillStyle = "rgba(0,0,0,0.55)";
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = "#ffcc00";
      ctx.font = `bold ${Math.max(18, cell)}px Monaco, Menlo, monospace`;
      ctx.textAlign = "center";
      ctx.fillText("YOU WIN", W / 2, H / 2);
      ctx.font = "12px Monaco, Menlo, monospace";
      ctx.fillStyle = "#fff";
      ctx.fillText("warping…", W / 2, H / 2 + 28);
    } else if (lives <= 0) {
      ctx.fillStyle = "rgba(0,0,0,0.55)";
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = "#ff5555";
      ctx.font = `bold ${Math.max(18, cell)}px Monaco, Menlo, monospace`;
      ctx.textAlign = "center";
      ctx.fillText("GAME OVER", W / 2, H / 2);
      ctx.font = "12px Monaco, Menlo, monospace";
      ctx.fillStyle = "#fff";
      ctx.fillText("still sending you…", W / 2, H / 2 + 28);
    }

    gameRaf = requestAnimationFrame(gameFrame);
  }
}

export function consumeXSiteArrival(): XSiteDirection | null {
  return readAndClearXSiteParam();
}
