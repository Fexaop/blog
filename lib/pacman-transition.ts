/**
 * Pac-Man cross-site transition (blog).
 *
 * Space during cinema → real maze + Web Audio SFX.
 * Esc / Enter → navigate.
 */

import {
  withXSiteParam,
  readAndClearXSiteParam,
  type XSiteDirection,
} from "@/lib/site";

const CINEMA_MS = 2600;

// # wall  . pellet  o power  - gate  P pac-start  space empty/tunnel
const MAZE_STR = [
  "###################",
  "#........#........#",
  "#o##.###.#.###.##o#",
  "#.................#",
  "#.##.#.#####.#.##.#",
  "#....#...#...#....#",
  "####.### # ###.####",
  "   #.#       #.#   ",
  "####.# ##-## #.####",
  "    .  #   #  .    ",
  "####.# ##### #.####",
  "   #.#       #.#   ",
  "####.#.#####.#.####",
  "#........#........#",
  "#.##.###.#.###.##.#",
  "#o.#.....P.....#.o#",
  "##.#.#.#####.#.#.##",
  "#....#...#...#....#",
  "#.######.#.######.#",
  "#.................#",
  "###################",
];

const ROWS = MAZE_STR.length;
const COLS = MAZE_STR[0].length;

type Cell = "wall" | "pellet" | "power" | "gate" | "empty";
type Dir = { x: number; y: number };

const UP: Dir = { x: 0, y: -1 };
const DOWN: Dir = { x: 0, y: 1 };
const LEFT: Dir = { x: -1, y: 0 };
const RIGHT: Dir = { x: 1, y: 0 };
const DIRS = [UP, DOWN, LEFT, RIGHT];

function parseMaze() {
  const grid: Cell[][] = [];
  let pacC = 9;
  let pacR = 15;
  for (let r = 0; r < ROWS; r++) {
    const row: Cell[] = [];
    for (let c = 0; c < COLS; c++) {
      const ch = MAZE_STR[r][c];
      if (ch === "#") row.push("wall");
      else if (ch === ".") row.push("pellet");
      else if (ch === "o") row.push("power");
      else if (ch === "-") row.push("gate");
      else if (ch === "P") {
        row.push("empty");
        pacC = c;
        pacR = r;
      } else row.push("empty");
    }
    grid.push(row);
  }
  return { grid, pacC, pacR };
}

function cloneGrid(g: Cell[][]) {
  return g.map((r) => r.slice());
}

function countPellets(g: Cell[][]) {
  let n = 0;
  for (const row of g) for (const c of row) if (c === "pellet" || c === "power") n++;
  return n;
}

function createSfx() {
  let ctx: AudioContext | null = null;
  const ensure = () => {
    if (!ctx) {
      const AC =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext;
      ctx = new AC();
    }
    if (ctx.state === "suspended") void ctx.resume();
    return ctx;
  };
  const beep = (
    freq: number,
    dur: number,
    type: OscillatorType = "square",
    gain = 0.06,
    when = 0,
  ) => {
    try {
      const ac = ensure();
      const t0 = ac.currentTime + when;
      const o = ac.createOscillator();
      const g = ac.createGain();
      o.type = type;
      o.frequency.setValueAtTime(freq, t0);
      g.gain.setValueAtTime(gain, t0);
      g.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
      o.connect(g);
      g.connect(ac.destination);
      o.start(t0);
      o.stop(t0 + dur + 0.02);
    } catch {
      /* no audio */
    }
  };
  let chompHi = true;
  return {
    resume: () => {
      try {
        ensure();
      } catch {
        /* */
      }
    },
    start: () => {
      beep(440, 0.08, "square", 0.07, 0);
      beep(554, 0.08, "square", 0.07, 0.1);
      beep(659, 0.14, "square", 0.08, 0.2);
    },
    chomp: () => {
      beep(chompHi ? 620 : 480, 0.045, "triangle", 0.05);
      chompHi = !chompHi;
    },
    power: () => beep(180, 0.22, "sawtooth", 0.05),
    eatGhost: () => {
      beep(320, 0.06, "square", 0.06, 0);
      beep(480, 0.06, "square", 0.06, 0.07);
      beep(640, 0.1, "square", 0.07, 0.14);
    },
    death: () => {
      for (let i = 0; i < 6; i++) beep(520 - i * 70, 0.08, "sawtooth", 0.05, i * 0.07);
    },
    win: () => {
      beep(523, 0.1, "square", 0.07, 0);
      beep(659, 0.1, "square", 0.07, 0.12);
      beep(784, 0.18, "square", 0.08, 0.24);
    },
  };
}

export function playPacmanTransition(
  url: string,
  direction: XSiteDirection,
): void {
  if (typeof window === "undefined") return;
  if (document.getElementById("pwnhub-pacman-overlay")) return;

  if (document.activeElement instanceof HTMLElement) {
    document.activeElement.blur();
  }

  const overlay = document.createElement("div");
  overlay.id = "pwnhub-pacman-overlay";
  overlay.setAttribute("role", "application");
  overlay.tabIndex = -1;
  overlay.style.cssText =
    "position:fixed;inset:0;z-index:2147483646;background:#000;display:flex;align-items:center;justify-content:center;outline:none;touch-action:none";

  const canvas = document.createElement("canvas");
  canvas.tabIndex = 0;
  canvas.style.cssText = "outline:none;display:block;max-width:100%";
  overlay.appendChild(canvas);
  document.body.appendChild(overlay);
  document.body.style.overflow = "hidden";

  const grabFocus = () => {
    try {
      canvas.focus({ preventScroll: true });
    } catch {
      canvas.focus();
    }
  };
  grabFocus();
  requestAnimationFrame(grabFocus);
  overlay.addEventListener("pointerdown", grabFocus);

  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const ctx = canvas.getContext("2d")!;
  const sfx = createSfx();

  let finished = false;
  let mode: "cinema" | "game" = "cinema";
  let cinemaRaf = 0;
  let gameRaf = 0;
  let failSafe = 0;
  let focusTimer = 0;

  const finish = () => {
    if (finished) return;
    finished = true;
    window.clearTimeout(failSafe);
    window.clearInterval(focusTimer);
    cancelAnimationFrame(cinemaRaf);
    cancelAnimationFrame(gameRaf);
    document.removeEventListener("keydown", onKeyDown, true);
    document.removeEventListener("keyup", onKeyUp, true);
    window.location.replace(withXSiteParam(url, direction));
  };

  // input: desired direction (null = keep current)
  let want: Dir | null = null;

  const readDir = (e: KeyboardEvent): Dir | null => {
    switch (e.key) {
      case "ArrowRight":
      case "d":
      case "D":
        return RIGHT;
      case "ArrowLeft":
      case "a":
      case "A":
        return LEFT;
      case "ArrowUp":
      case "w":
      case "W":
        return UP;
      case "ArrowDown":
      case "s":
      case "S":
        return DOWN;
      default:
        switch (e.code) {
          case "ArrowRight":
          case "KeyD":
            return RIGHT;
          case "ArrowLeft":
          case "KeyA":
            return LEFT;
          case "ArrowUp":
          case "KeyW":
            return UP;
          case "ArrowDown":
          case "KeyS":
            return DOWN;
          default:
            return null;
        }
    }
  };

  const onKeyDown = (e: KeyboardEvent) => {
    if (e.code === "Space" || e.key === " ") {
      e.preventDefault();
      e.stopPropagation();
      if (mode === "cinema") startGame();
      return;
    }
    if (e.key === "Escape" || e.key === "Enter" || e.code === "Escape") {
      e.preventDefault();
      e.stopPropagation();
      finish();
      return;
    }
    const d = readDir(e);
    if (d) {
      e.preventDefault();
      e.stopPropagation();
      want = d;
      if (mode === "game") pac.next = d;
    }
  };

  const onKeyUp = (e: KeyboardEvent) => {
    const d = readDir(e);
    // keep want sticky (classic pacman) — only clear if matching
    if (d && want && d.x === want.x && d.y === want.y) {
      // leave sticky on purpose
    }
  };

  document.addEventListener("keydown", onKeyDown, true);
  document.addEventListener("keyup", onKeyUp, true);
  focusTimer = window.setInterval(() => {
    if (!finished && document.activeElement !== canvas) grabFocus();
  }, 300);

  // —— draw helpers ——
  function drawPac(
    x: number,
    y: number,
    r: number,
    facing: Dir,
    open: number,
  ) {
    const base = Math.atan2(facing.y, facing.x);
    const a = (0.2 + open * 0.35) * Math.PI;
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
    ctx.arc(r * 0.1, -r * 0.4, r * 0.12, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function drawGhost(
    x: number,
    y: number,
    r: number,
    color: string,
    look: Dir,
    frightened: boolean,
  ) {
    const w = r * 1.75;
    const h = r * 2.1;
    const left = -w / 2;
    const right = w / 2;
    const top = -h * 0.48;
    const skirt = h * 0.38;
    const domeR = w / 2;
    ctx.save();
    ctx.translate(x, y);
    ctx.fillStyle = frightened ? "#2121ff" : color;
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
    ctx.fillStyle = "#fff";
    ctx.beginPath();
    ctx.ellipse(-eyeX, eyeY, eyeRx, eyeRy, 0, 0, Math.PI * 2);
    ctx.ellipse(eyeX, eyeY, eyeRx, eyeRy, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = frightened ? "#2121ff" : "#2121de";
    const lx = look.x * eyeRx * 0.4;
    const ly = look.y * eyeRy * 0.35;
    const pr = eyeRx * (frightened ? 0.3 : 0.48);
    ctx.beginPath();
    ctx.arc(-eyeX + lx, eyeY + ly, pr, 0, Math.PI * 2);
    ctx.arc(eyeX + lx, eyeY + ly, pr, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // —— cinema ——
  const chaseGhost = direction === "to-portfolio";
  let cinemaW = Math.min(window.innerWidth, 960);
  let cinemaH = Math.min(Math.round(window.innerHeight * 0.48), 360);

  function sizeCinema() {
    cinemaW = Math.min(window.innerWidth, 960);
    cinemaH = Math.min(Math.round(window.innerHeight * 0.48), 360);
    canvas.width = Math.round(cinemaW * dpr);
    canvas.height = Math.round(cinemaH * dpr);
    canvas.style.width = `${cinemaW}px`;
    canvas.style.height = `${cinemaH}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

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
    for (let i = 0; i < 20; i++) {
      candy.push({
        x: laneL + R * 2.2 + (pathLen * i) / 19,
        eaten: false,
        power: i === 0 || i === 19,
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
    if (!eaten) drawGhost(ghostX, cy, R, "#ff0000", RIGHT, frightened);
    drawPac(pacX, cy, R, RIGHT, open);

    ctx.fillStyle = "rgba(255,255,255,0.75)";
    ctx.font = "13px Monaco, Menlo, monospace";
    ctx.textAlign = "center";
    ctx.fillText(chaseGhost ? "→ portfolio" : "→ blog", W / 2, H - 28);
    ctx.fillStyle = "#ffcc00";
    ctx.font = "12px Monaco, Menlo, monospace";
    ctx.fillText("space = play   ·   esc = skip", W / 2, H - 10);

    if (t < 1) cinemaRaf = requestAnimationFrame(cinemaFrame);
    else {
      window.clearTimeout(failSafe);
      window.setTimeout(finish, 80);
    }
  }
  cinemaRaf = requestAnimationFrame(cinemaFrame);

  // —— game ——
  const base = parseMaze();
  let grid = cloneGrid(base.grid);
  let TILE = 20;
  let PAD = 32;
  let score = 0;
  let lives = 3;
  let remaining = 0;
  let powerUntil = 0;
  let invulnUntil = 0;
  let deadUntil = 0;
  let won = false;
  let mouth = 0;
  let lastTs = 0;
  let chompCool = 0;

  type Body = {
    // pixel position of center
    x: number;
    y: number;
    dir: Dir;
    next: Dir;
  };

  type GhostBody = Body & {
    color: string;
    mode: "chase" | "frightened" | "eaten";
    homeX: number;
    homeY: number;
  };

  let pac: Body = { x: 0, y: 0, dir: LEFT, next: LEFT };
  let ghosts: GhostBody[] = [];

  function tileCenter(c: number, r: number) {
    return { x: c * TILE + TILE / 2, y: PAD + r * TILE + TILE / 2 };
  }

  function pixelToTile(px: number, py: number) {
    let c = Math.floor(px / TILE);
    const r = Math.floor((py - PAD) / TILE);
    if (c < 0) c += COLS;
    if (c >= COLS) c -= COLS;
    return { c, r };
  }

  function blocked(c: number, r: number, allowGate: boolean) {
    if (r < 0 || r >= ROWS) return true;
    let cc = c;
    if (cc < 0) cc = COLS - 1;
    if (cc >= COLS) cc = 0;
    const v = grid[r][cc];
    if (v === "wall") return true;
    if (v === "gate" && !allowGate) return true;
    return false;
  }

  /** solid radius check: sample center + edges */
  function hitsWall(px: number, py: number, allowGate: boolean) {
    const rad = TILE * 0.35;
    const samples = [
      [px, py],
      [px - rad, py],
      [px + rad, py],
      [px, py - rad],
      [px, py + rad],
    ];
    for (const [sx, sy] of samples) {
      let c = Math.floor(sx / TILE);
      const r = Math.floor((sy - PAD) / TILE);
      if (r < 0 || r >= ROWS) return true;
      if (c < 0) c += COLS;
      if (c >= COLS) c -= COLS;
      const v = grid[r][c];
      if (v === "wall") return true;
      if (v === "gate" && !allowGate) return true;
    }
    return false;
  }

  function nearCenter(b: Body) {
    const { c, r } = pixelToTile(b.x, b.y);
    const tc = tileCenter(c, r);
    // keep tight so a single step can leave the zone (was snapping every frame)
    return Math.hypot(b.x - tc.x, b.y - tc.y) < Math.max(1.5, TILE * 0.08);
  }

  function snapToCenter(b: Body) {
    const { c, r } = pixelToTile(b.x, b.y);
    const tc = tileCenter(c, r);
    b.x = tc.x;
    b.y = tc.y;
  }

  function canMoveFrom(b: Body, d: Dir, allowGate: boolean) {
    const { c, r } = pixelToTile(b.x, b.y);
    return !blocked(c + d.x, r + d.y, allowGate);
  }

  function resetActors() {
    const p = tileCenter(base.pacC, base.pacR);
    pac = { x: p.x, y: p.y, dir: LEFT, next: LEFT };
    const homes = [
      { c: 9, r: 9, color: "#ff0000", dir: LEFT },
      { c: 8, r: 9, color: "#ffb8ff", dir: RIGHT },
      { c: 10, r: 9, color: "#00ffff", dir: LEFT },
      { c: 9, r: 8, color: "#ffb852", dir: UP },
    ];
    ghosts = homes.map((h) => {
      const t = tileCenter(h.c, h.r);
      return {
        x: t.x,
        y: t.y,
        dir: h.dir,
        next: h.dir,
        color: h.color,
        mode: "chase" as const,
        homeX: t.x,
        homeY: t.y,
      };
    });
  }

  function layoutGame() {
    const maxW = Math.min(window.innerWidth - 16, 760);
    const maxH = Math.min(window.innerHeight - 24, 840);
    TILE = Math.max(14, Math.floor(Math.min(maxW / COLS, (maxH - PAD) / ROWS)));
    const w = TILE * COLS;
    const h = TILE * ROWS + PAD;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function startGame() {
    if (mode === "game") return;
    mode = "game";
    window.clearTimeout(failSafe);
    cancelAnimationFrame(cinemaRaf);
    sfx.resume();
    sfx.start();
    grid = cloneGrid(base.grid);
    remaining = countPellets(grid);
    score = 0;
    lives = 3;
    powerUntil = 0;
    invulnUntil = 0;
    deadUntil = 0;
    won = false;
    chompCool = 0;
    want = LEFT;
    layoutGame();
    resetActors();
    lastTs = performance.now();
    grabFocus();
    gameRaf = requestAnimationFrame(gameFrame);
  }

  function moveBody(b: Body, speedPx: number, dt: number, allowGate: boolean) {
    // reverse anytime
    if (b.next.x === -b.dir.x && b.next.y === -b.dir.y) {
      b.dir = { ...b.next };
    }

    const wantTurn = b.next.x !== b.dir.x || b.next.y !== b.dir.y;

    // only snap at centers when turning or when blocked — never every frame
    // (old bug: snap every frame cancelled all movement)
    if (nearCenter(b)) {
      if (wantTurn && canMoveFrom(b, b.next, allowGate)) {
        snapToCenter(b);
        b.dir = { ...b.next };
      } else if (!canMoveFrom(b, b.dir, allowGate)) {
        snapToCenter(b);
        // try queued as last resort
        if (canMoveFrom(b, b.next, allowGate)) {
          b.dir = { ...b.next };
        } else {
          return;
        }
      }
    }

    // at least ~2px so we clear the center zone even on high refresh rates
    const step = Math.max(2, speedPx * dt);
    let nx = b.x + b.dir.x * step;
    let ny = b.y + b.dir.y * step;

    // tunnel wrap
    const totalW = TILE * COLS;
    if (nx < 0) nx += totalW;
    if (nx >= totalW) nx -= totalW;

    if (!hitsWall(nx, ny, allowGate)) {
      b.x = nx;
      b.y = ny;
      // lock to lane on free axis
      if (b.dir.x !== 0) {
        const { r } = pixelToTile(b.x, b.y);
        b.y = PAD + r * TILE + TILE / 2;
      } else if (b.dir.y !== 0) {
        const { c } = pixelToTile(b.x, b.y);
        b.x = c * TILE + TILE / 2;
      }
    } else {
      // ran into a wall — sit on the current tile center
      snapToCenter(b);
    }
  }

  function pickGhost(g: GhostBody) {
    if (!nearCenter(g)) return;
    snapToCenter(g);

    const { c, r } = pixelToTile(g.x, g.y);
    const opts: Dir[] = [];
    for (const d of DIRS) {
      if (d.x === -g.dir.x && d.y === -g.dir.y && g.mode === "chase") continue;
      const nc = c + d.x;
      const nr = r + d.y;
      if (nr < 0 || nr >= ROWS) continue;
      let cc = nc;
      if (cc < 0) cc = COLS - 1;
      if (cc >= COLS) cc = 0;
      const v = grid[nr][cc];
      if (v === "wall") continue;
      if (v === "gate") {
        // leave house upward, or return when eaten
        if (!(d.y === -1 || g.mode === "eaten")) continue;
      }
      opts.push(d);
    }
    if (opts.length === 0) {
      g.dir = { x: -g.dir.x, y: -g.dir.y };
      g.next = g.dir;
      return;
    }

    if (g.mode === "frightened") {
      g.dir = opts[Math.floor(Math.random() * opts.length)];
      g.next = g.dir;
      return;
    }

    let tx = pac.x;
    let ty = pac.y;
    if (g.mode === "eaten") {
      tx = g.homeX;
      ty = g.homeY;
    } else if (g.color === "#00ffff") {
      tx = pac.x + pac.dir.x * TILE * 2;
      ty = pac.y + pac.dir.y * TILE * 2;
    } else if (g.color === "#ffb852") {
      tx = pac.x - TILE * 3;
    } else if (g.color === "#ffb8ff") {
      ty = pac.y - TILE * 2;
    }

    let best = opts[0];
    let bestD = Infinity;
    for (const d of opts) {
      const px = g.x + d.x * TILE;
      const py = g.y + d.y * TILE;
      const dist = (px - tx) ** 2 + (py - ty) ** 2;
      if (dist < bestD) {
        bestD = dist;
        best = d;
      }
    }
    g.dir = best;
    g.next = best;
  }

  function killPac(now: number) {
    if (now < invulnUntil) return;
    sfx.death();
    lives -= 1;
    deadUntil = now + 700;
    invulnUntil = now + 1400;
    if (lives <= 0) {
      window.setTimeout(finish, 1100);
      return;
    }
    resetActors();
    for (const g of ghosts) g.mode = "chase";
    powerUntil = 0;
  }

  function gameFrame(now: number) {
    if (mode !== "game" || finished) return;
    let dt = (now - lastTs) / 1000;
    lastTs = now;
    if (!Number.isFinite(dt) || dt <= 0) dt = 1 / 60;
    if (dt > 0.05) dt = 0.05;
    mouth += dt * 12;

    if (!won && lives > 0 && now > deadUntil) {
      if (want) pac.next = want;

      // ~7 tiles/sec
      moveBody(pac, TILE * 7, dt, false);

      // eat pellets at tile under pac
      const { c, r } = pixelToTile(pac.x, pac.y);
      if (r >= 0 && r < ROWS && nearCenter(pac)) {
        const v = grid[r][c < 0 ? c + COLS : c >= COLS ? c - COLS : c];
        const cc = ((c % COLS) + COLS) % COLS;
        if (grid[r][cc] === "pellet") {
          grid[r][cc] = "empty";
          score += 10;
          remaining -= 1;
          if (now > chompCool) {
            sfx.chomp();
            chompCool = now + 85;
          }
        } else if (grid[r][cc] === "power") {
          grid[r][cc] = "empty";
          score += 50;
          remaining -= 1;
          powerUntil = now + 6500;
          sfx.power();
          for (const g of ghosts) if (g.mode !== "eaten") g.mode = "frightened";
        }
        void v;
      }

      if (remaining <= 0) {
        won = true;
        sfx.win();
        window.setTimeout(finish, 1400);
      }

      if (now >= powerUntil) {
        for (const g of ghosts) if (g.mode === "frightened") g.mode = "chase";
      }

      for (const g of ghosts) {
        if (g.mode === "eaten") {
          const dx = g.homeX - g.x;
          const dy = g.homeY - g.y;
          if (dx * dx + dy * dy < (TILE * 0.4) ** 2) {
            g.mode = "chase";
            g.x = g.homeX;
            g.y = g.homeY;
          }
        }
        pickGhost(g);
        const speed =
          g.mode === "frightened"
            ? TILE * 3.5
            : g.mode === "eaten"
              ? TILE * 10
              : TILE * 5.5;
        // ghosts may pass the house gate; pac may not
        moveBody(g, speed, dt, true);

        const ddx = g.x - pac.x;
        const ddy = g.y - pac.y;
        if (ddx * ddx + ddy * ddy < (TILE * 0.55) ** 2) {
          if (g.mode === "frightened") {
            g.mode = "eaten";
            score += 200;
            sfx.eatGhost();
          } else if (g.mode === "chase") {
            killPac(now);
          }
        }
      }
    }

    // draw
    const W = TILE * COLS;
    const H = TILE * ROWS + PAD;
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, W, H);

    ctx.fillStyle = "#ffcc00";
    ctx.font = `bold ${Math.max(12, Math.floor(TILE * 0.55))}px Monaco, Menlo, monospace`;
    ctx.textAlign = "left";
    ctx.fillText(`SCORE ${score}`, 8, 20);
    ctx.textAlign = "right";
    ctx.fillText("♥".repeat(Math.max(0, lives)), W - 8, 20);
    ctx.textAlign = "center";
    ctx.fillStyle = "rgba(255,255,255,0.5)";
    ctx.font = "11px Monaco, Menlo, monospace";
    ctx.fillText("arrows / wasd  ·  esc leave", W / 2, 20);

    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const v = grid[r][c];
        const x = c * TILE;
        const y = PAD + r * TILE;
        if (v === "wall") {
          ctx.fillStyle = "#2121de";
          ctx.fillRect(x + 1, y + 1, TILE - 2, TILE - 2);
        } else if (v === "gate") {
          ctx.fillStyle = "#ffb8ff";
          ctx.fillRect(x + 2, y + TILE * 0.45, TILE - 4, 2);
        } else if (v === "pellet") {
          ctx.fillStyle = "#ffb897";
          ctx.beginPath();
          ctx.arc(x + TILE / 2, y + TILE / 2, Math.max(2, TILE * 0.1), 0, Math.PI * 2);
          ctx.fill();
        } else if (v === "power") {
          ctx.fillStyle = "#ffb897";
          ctx.beginPath();
          ctx.arc(x + TILE / 2, y + TILE / 2, TILE * 0.28, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }

    const rad = TILE * 0.42;
    for (const g of ghosts) {
      if (g.mode === "eaten") {
        ctx.fillStyle = "#fff";
        ctx.beginPath();
        ctx.ellipse(g.x - 4, g.y, 3.5, 4, 0, 0, Math.PI * 2);
        ctx.ellipse(g.x + 4, g.y, 3.5, 4, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#2121de";
        ctx.beginPath();
        ctx.arc(g.x - 3, g.y, 1.6, 0, Math.PI * 2);
        ctx.arc(g.x + 5, g.y, 1.6, 0, Math.PI * 2);
        ctx.fill();
      } else {
        drawGhost(g.x, g.y, rad, g.color, g.dir, g.mode === "frightened");
      }
    }

    if (now > deadUntil || lives <= 0) {
      const open = (Math.sin(mouth) + 1) / 2;
      drawPac(pac.x, pac.y, rad, pac.dir, open);
    }

    if (won || lives <= 0) {
      ctx.fillStyle = "rgba(0,0,0,0.55)";
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = won ? "#ffcc00" : "#ff5555";
      ctx.font = `bold ${Math.max(18, TILE)}px Monaco, Menlo, monospace`;
      ctx.textAlign = "center";
      ctx.fillText(won ? "YOU WIN" : "GAME OVER", W / 2, H / 2);
      ctx.fillStyle = "#fff";
      ctx.font = "12px Monaco, Menlo, monospace";
      ctx.fillText("warping…", W / 2, H / 2 + 28);
    }

    gameRaf = requestAnimationFrame(gameFrame);
  }
}

export function consumeXSiteArrival(): XSiteDirection | null {
  return readAndClearXSiteParam();
}
