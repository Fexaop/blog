/**
 * Pac-Man cross-site transition (blog).
 *
 * One continuous maze from the start (same sprites everywhere).
 * Intro = autoplay scene. Space = take over + show full HUD.
 * Esc / Enter = navigate away.
 */

import {
  withXSiteParam,
  readAndClearXSiteParam,
  type XSiteDirection,
} from "@/lib/site";

const INTRO_MS = 3200;

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
type Phase = "intro" | "play";

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
      /* */
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
      beep(chompHi ? 620 : 480, 0.04, "triangle", 0.045);
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

  // outer frame that holds canvas + optional UI chrome
  const frame = document.createElement("div");
  frame.style.cssText =
    "position:relative;display:flex;flex-direction:column;align-items:stretch;border:3px solid #2121de;border-radius:8px;background:#000;box-shadow:0 0 0 2px #1919a6,0 0 40px rgba(33,33,222,0.35);overflow:hidden;max-width:calc(100vw - 16px)";

  const canvas = document.createElement("canvas");
  canvas.tabIndex = 0;
  canvas.style.cssText = "outline:none;display:block;max-width:100%";

  // HUD components — hidden during intro, revealed on Space
  const hud = document.createElement("div");
  hud.style.cssText =
    "display:none;align-items:center;justify-content:space-between;gap:12px;padding:8px 12px;background:#0a0a14;border-top:2px solid #2121de;font-family:Monaco,Menlo,monospace;color:#ffcc00;font-size:12px";
  const hudScore = document.createElement("span");
  hudScore.textContent = "SCORE 0";
  const hudLives = document.createElement("span");
  hudLives.textContent = "♥♥♥";
  const hudHint = document.createElement("span");
  hudHint.style.color = "rgba(255,255,255,0.55)";
  hudHint.textContent = "arrows / wasd";
  hud.append(hudScore, hudHint, hudLives);

  const banner = document.createElement("div");
  banner.style.cssText =
    "display:flex;align-items:center;justify-content:center;gap:10px;padding:6px 12px;background:#0a0a14;border-bottom:2px solid #2121de;font-family:Monaco,Menlo,monospace;font-size:11px;color:#ffcc00";
  banner.innerHTML =
    direction === "to-portfolio"
      ? "<span>→ portfolio</span><span style='color:rgba(255,255,255,0.5)'>·</span><span style='color:#fff'>space take over</span><span style='color:rgba(255,255,255,0.5)'>·</span><span style='color:rgba(255,255,255,0.55)'>esc skip</span>"
      : "<span>→ blog</span><span style='color:rgba(255,255,255,0.5)'>·</span><span style='color:#fff'>space take over</span><span style='color:rgba(255,255,255,0.5)'>·</span><span style='color:rgba(255,255,255,0.55)'>esc skip</span>";

  frame.append(banner, canvas, hud);
  overlay.appendChild(frame);
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
  sfx.resume();

  let finished = false;
  let phase: Phase = "intro";
  let raf = 0;
  let introTimer = 0;
  let focusTimer = 0;
  let want: Dir | null = null;

  const finish = () => {
    if (finished) return;
    finished = true;
    window.clearTimeout(introTimer);
    window.clearInterval(focusTimer);
    cancelAnimationFrame(raf);
    document.removeEventListener("keydown", onKeyDown, true);
    window.location.replace(withXSiteParam(url, direction));
  };

  const enterPlay = () => {
    if (phase === "play" || finished) return;
    phase = "play";
    window.clearTimeout(introTimer);
    sfx.resume();
    sfx.start();
    hud.style.display = "flex";
    banner.innerHTML =
      "<span style='color:#ffcc00'>YOUR MOVE</span><span style='color:rgba(255,255,255,0.5)'>·</span><span style='color:rgba(255,255,255,0.55)'>esc leave</span>";
    grabFocus();
  };

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
    }
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
    }
    return null;
  };

  const onKeyDown = (e: KeyboardEvent) => {
    if (e.code === "Space" || e.key === " ") {
      e.preventDefault();
      e.stopPropagation();
      enterPlay();
      return;
    }
    if (e.key === "Escape" || e.key === "Enter") {
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
      pac.next = d;
      // pressing a direction during intro also takes over
      if (phase === "intro") enterPlay();
    }
  };

  document.addEventListener("keydown", onKeyDown, true);
  focusTimer = window.setInterval(() => {
    if (!finished && document.activeElement !== canvas) grabFocus();
  }, 300);

  // auto-leave after intro if player never takes over
  introTimer = window.setTimeout(() => {
    if (phase === "intro" && !finished) finish();
  }, INTRO_MS);

  // —— shared draw (one icon set for whole scene) ——
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
    // flash white near end of fright
    const flash =
      frightened && powerUntil - performance.now() < 1800
        ? Math.floor(performance.now() / 120) % 2 === 0
        : false;
    ctx.fillStyle = frightened ? (flash ? "#fff" : "#2121ff") : color;
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
    ctx.fillStyle = frightened && !flash ? "#fff" : "#fff";
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

  function drawEyesOnly(x: number, y: number) {
    ctx.fillStyle = "#fff";
    ctx.beginPath();
    ctx.ellipse(x - 4, y, 3.5, 4, 0, 0, Math.PI * 2);
    ctx.ellipse(x + 4, y, 3.5, 4, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#2121de";
    ctx.beginPath();
    ctx.arc(x - 3, y, 1.6, 0, Math.PI * 2);
    ctx.arc(x + 5, y, 1.6, 0, Math.PI * 2);
    ctx.fill();
  }

  // —— game state (always running) ——
  const base = parseMaze();
  const grid = cloneGrid(base.grid);
  let TILE = 20;
  const PAD = 8; // tight canvas; HUD lives in HTML chrome
  let score = 0;
  let lives = 3;
  let remaining = countPellets(grid);
  let powerUntil = 0;
  let invulnUntil = 0;
  let deadUntil = 0;
  let won = false;
  let mouth = 0;
  let lastTs = performance.now();
  let chompCool = 0;

  type Body = { x: number; y: number; dir: Dir; next: Dir };
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

  function hitsWall(px: number, py: number, allowGate: boolean) {
    const rad = TILE * 0.32;
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

  function openDirs(
    c: number,
    r: number,
    allowGate: boolean,
    forbid?: Dir,
  ): Dir[] {
    const opts: Dir[] = [];
    for (const d of DIRS) {
      if (forbid && d.x === forbid.x && d.y === forbid.y) continue;
      if (!blocked(c + d.x, r + d.y, allowGate)) opts.push(d);
    }
    return opts;
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

  function layout() {
    const maxW = Math.min(window.innerWidth - 24, 720);
    const maxH = Math.min(window.innerHeight - 100, 780);
    TILE = Math.max(12, Math.floor(Math.min(maxW / COLS, (maxH - PAD) / ROWS)));
    const w = TILE * COLS;
    const h = TILE * ROWS + PAD * 2;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  layout();
  resetActors();

  function moveBody(b: Body, speedPx: number, dt: number, allowGate: boolean) {
    if (b.next.x === -b.dir.x && b.next.y === -b.dir.y) {
      b.dir = { ...b.next };
    }

    const wantTurn = b.next.x !== b.dir.x || b.next.y !== b.dir.y;
    if (nearCenter(b)) {
      if (wantTurn && canMoveFrom(b, b.next, allowGate)) {
        snapToCenter(b);
        b.dir = { ...b.next };
      } else if (!canMoveFrom(b, b.dir, allowGate)) {
        snapToCenter(b);
        if (canMoveFrom(b, b.next, allowGate)) {
          b.dir = { ...b.next };
        } else {
          // pick any open direction so nobody freezes
          const { c, r } = pixelToTile(b.x, b.y);
          const opts = openDirs(c, r, allowGate);
          if (opts.length === 0) return;
          b.dir = opts[Math.floor(Math.random() * opts.length)];
          b.next = b.dir;
        }
      }
    }

    const step = Math.max(2, speedPx * dt);
    let nx = b.x + b.dir.x * step;
    const ny = b.y + b.dir.y * step;
    const totalW = TILE * COLS;
    if (nx < 0) nx += totalW;
    if (nx >= totalW) nx -= totalW;

    if (!hitsWall(nx, ny, allowGate)) {
      b.x = nx;
      b.y = ny;
      if (b.dir.x !== 0) {
        const { r } = pixelToTile(b.x, b.y);
        b.y = PAD + r * TILE + TILE / 2;
      } else {
        const { c } = pixelToTile(b.x, b.y);
        b.x = c * TILE + TILE / 2;
      }
    } else {
      snapToCenter(b);
    }
  }

  /** demo AI for intro — keep chomping, prefer pellets */
  function autopilotPac() {
    if (!nearCenter(pac)) return;
    snapToCenter(pac);
    const { c, r } = pixelToTile(pac.x, pac.y);
    const opts = openDirs(c, r, false, { x: -pac.dir.x, y: -pac.dir.y });
    const all = opts.length ? opts : openDirs(c, r, false);
    if (all.length === 0) return;

    // prefer tile with pellet/power
    let best = all[0];
    let bestScore = -1;
    for (const d of all) {
      let nc = c + d.x;
      const nr = r + d.y;
      if (nc < 0) nc = COLS - 1;
      if (nc >= COLS) nc = 0;
      if (nr < 0 || nr >= ROWS) continue;
      const cell = grid[nr][nc];
      let s = 0;
      if (cell === "power") s = 3;
      else if (cell === "pellet") s = 2;
      else s = 1;
      // slight bias to keep current dir for smoother intro
      if (d.x === pac.dir.x && d.y === pac.dir.y) s += 0.5;
      if (s > bestScore) {
        bestScore = s;
        best = d;
      }
    }
    pac.next = best;
    pac.dir = best;
  }

  function pickGhost(g: GhostBody) {
    if (!nearCenter(g)) return;
    snapToCenter(g);
    const { c, r } = pixelToTile(g.x, g.y);

    const opts: Dir[] = [];
    for (const d of DIRS) {
      // allow reverse when frightened / eaten so they never trap themselves
      if (
        d.x === -g.dir.x &&
        d.y === -g.dir.y &&
        g.mode === "chase"
      ) {
        continue;
      }
      const nc = c + d.x;
      const nr = r + d.y;
      if (nr < 0 || nr >= ROWS) continue;
      let cc = nc;
      if (cc < 0) cc = COLS - 1;
      if (cc >= COLS) cc = 0;
      const v = grid[nr][cc];
      if (v === "wall") continue;
      if (v === "gate") {
        // out of house (up) or return when eaten
        if (!(d.y === -1 || g.mode === "eaten")) continue;
      }
      opts.push(d);
    }

    // always have a fallback including reverse
    if (opts.length === 0) {
      const any = openDirs(c, r, true);
      if (any.length === 0) return;
      g.dir = any[0];
      g.next = g.dir;
      return;
    }

    if (g.mode === "frightened") {
      // keep moving: prefer continuing, random among options
      const cont = opts.find((d) => d.x === g.dir.x && d.y === g.dir.y);
      g.dir = cont ?? opts[Math.floor(Math.random() * opts.length)];
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
    if (phase === "intro") {
      // during intro just bounce — don't end the handoff
      resetActors();
      return;
    }
    sfx.death();
    lives -= 1;
    deadUntil = now + 700;
    invulnUntil = now + 1400;
    hudLives.textContent = "♥".repeat(Math.max(0, lives));
    if (lives <= 0) {
      window.setTimeout(finish, 1100);
      return;
    }
    resetActors();
    for (const g of ghosts) g.mode = "chase";
    powerUntil = 0;
  }

  function tick(now: number) {
    if (finished) return;
    let dt = (now - lastTs) / 1000;
    lastTs = now;
    if (!Number.isFinite(dt) || dt <= 0) dt = 1 / 60;
    if (dt > 0.05) dt = 0.05;
    mouth += dt * 12;

    if (!won && lives > 0 && now > deadUntil) {
      if (phase === "intro") {
        autopilotPac();
      } else if (want) {
        pac.next = want;
      }

      moveBody(pac, TILE * (phase === "intro" ? 6 : 7), dt, false);

      // pellets
      const { c, r } = pixelToTile(pac.x, pac.y);
      if (r >= 0 && r < ROWS && nearCenter(pac)) {
        const cc = ((c % COLS) + COLS) % COLS;
        if (grid[r][cc] === "pellet") {
          grid[r][cc] = "empty";
          score += 10;
          remaining -= 1;
          if (now > chompCool) {
            if (phase === "play") sfx.chomp();
            chompCool = now + 85;
          }
        } else if (grid[r][cc] === "power") {
          grid[r][cc] = "empty";
          score += 50;
          remaining -= 1;
          powerUntil = now + 6500;
          if (phase === "play") sfx.power();
          for (const g of ghosts) {
            if (g.mode !== "eaten") {
              g.mode = "frightened";
              // reverse on fright (classic)
              g.dir = { x: -g.dir.x, y: -g.dir.y };
              g.next = g.dir;
            }
          }
        }
        if (phase === "play") hudScore.textContent = `SCORE ${score}`;
      }

      if (remaining <= 0 && phase === "play") {
        won = true;
        sfx.win();
        window.setTimeout(finish, 1400);
      }

      // end fright — ghosts keep moving in chase
      if (powerUntil > 0 && now >= powerUntil) {
        powerUntil = 0;
        for (const g of ghosts) {
          if (g.mode === "frightened") g.mode = "chase";
        }
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
            ? TILE * 4.2
            : g.mode === "eaten"
              ? TILE * 10
              : TILE * 5.5;
        // always allow gate for ghosts so house exit works + no freeze
        moveBody(g, speed, dt, true);

        const ddx = g.x - pac.x;
        const ddy = g.y - pac.y;
        if (ddx * ddx + ddy * ddy < (TILE * 0.55) ** 2) {
          if (g.mode === "frightened") {
            g.mode = "eaten";
            score += 200;
            if (phase === "play") {
              sfx.eatGhost();
              hudScore.textContent = `SCORE ${score}`;
            }
          } else if (g.mode === "chase") {
            killPac(now);
          }
        }
      }
    }

    // —— draw maze (same icons as “outside”) ——
    const W = TILE * COLS;
    const H = TILE * ROWS + PAD * 2;
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, W, H);

    // inner corridor stroke like arcade cabinet
    ctx.strokeStyle = "#1919a6";
    ctx.lineWidth = 2;
    ctx.strokeRect(2, PAD - 2, W - 4, TILE * ROWS + 4);

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
          ctx.arc(
            x + TILE / 2,
            y + TILE / 2,
            Math.max(2, TILE * 0.1),
            0,
            Math.PI * 2,
          );
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
      if (g.mode === "eaten") drawEyesOnly(g.x, g.y);
      else drawGhost(g.x, g.y, rad, g.color, g.dir, g.mode === "frightened");
    }

    if (now > deadUntil || lives <= 0 || phase === "intro") {
      const open = (Math.sin(mouth) + 1) / 2;
      drawPac(pac.x, pac.y, rad, pac.dir, open);
    }

    if (phase === "intro") {
      // soft vignette label on canvas
      ctx.fillStyle = "rgba(0,0,0,0.35)";
      ctx.fillRect(0, H - 22, W, 22);
      ctx.fillStyle = "#ffcc00";
      ctx.font = "11px Monaco, Menlo, monospace";
      ctx.textAlign = "center";
      ctx.fillText("playing…  space = take over", W / 2, H - 7);
    }

    if (won || (lives <= 0 && phase === "play")) {
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

    raf = requestAnimationFrame(tick);
  }

  raf = requestAnimationFrame(tick);
}

export function consumeXSiteArrival(): XSiteDirection | null {
  return readAndClearXSiteParam();
}
