import { useEffect, useRef } from "react";
import { playBlip } from "@/utils/sound";

/**
 * Spacing of the dot grid in CSS pixels. Fish are drawn as smooth shapes at
 * one pixel per cell and then read back as a halftone, so a smaller cell means
 * a more detailed fish.
 */
const CELL = 5;
const FRAME_MS = 1000 / 30;
/** How fast lit dots fade, per second. Higher means shorter trails. */
const FADE_RATE = 9;
const SPINE_POINTS = 18;

const CURSOR_RADIUS = 170;
const HALO_RADIUS = 70;

const FOOD_LIFE = 8;
const FOOD_SINK = 8;
const FOOD_SEEK_RANGE = 380;
const MAX_FOOD = 8;
const MAX_RIPPLES = 6;

/** Fish are hidden behind the text column so they never hurt legibility. */
const COLUMN_DIM = 0;
const COLUMN_RAMP = 24;
/** The empty bands show fish across the whole row, fading out this many px
    beyond their top and bottom edges rather than cutting off sharply. */
const BAND_FEATHER = 36;
/** When the side gutters are narrower than this, fish cannot stay out of the
    column, so they live in the empty bands instead. */
const NARROW_GUTTER = 120;
const NARROW_DIM = 0;

type Species = { length: number; cruise: number; brightness: number };

/** Body length in px (tail excluded), calm cruising speed in px/s, brightness. */
const SPECIES: readonly Species[] = [
  { length: 70, cruise: 40, brightness: 0.85 },
  { length: 100, cruise: 32, brightness: 0.92 },
  { length: 140, cruise: 26, brightness: 1 },
];

type Point = { x: number; y: number };
/** A koi-style marking: where along the body, how long, how wide, how far off-centre. */
type Patch = { s: number; len: number; wide: number; off: number };

type Fish = {
  /** Spawn order; the first fish live in the empty bands around the text. */
  slot: number;
  x: number;
  y: number;
  heading: number;
  speed: number;
  /** Tail-beat phase, in radians. */
  phase: number;
  seed: number;
  length: number;
  cruise: number;
  brightness: number;
  /** 0 to 1, raised when startled or chasing food. */
  burst: number;
  patches: Patch[];
  /** Head first; each point follows the one before it. */
  spine: Point[];
};

type Food = { x: number; y: number; age: number };
type Ripple = {
  x: number;
  y: number;
  t: number;
  speed: number;
  life: number;
  width: number;
  strength: number;
};
type Box = { left: number; right: number; top: number; bottom: number };
type Boxes = { column: Box | null; clear: Box[] };

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

const angleDiff = (a: number, b: number) =>
  Math.atan2(Math.sin(a - b), Math.cos(a - b));

const INTERACTIVE =
  'a, button, input, textarea, select, label, summary, [role="button"], [data-no-fish]';

/** Half-width of the body along its length: 0 at the snout, round, then tapering. */
const bodyProfile = (s: number) =>
  s < 0.3
    ? Math.sqrt(Math.max(0, 1 - ((0.3 - s) / 0.3) ** 2))
    : 0.1 + 0.9 * (1 - (s - 0.3) / 0.7) ** 0.85;

const edgeOf = (distance: number, room: number) =>
  clamp(1 - distance / room, 0, 1);

/**
 * A page-wide invisible dot grid with koi-like fish swimming through it,
 * seen from above. Each fish is drawn as a real shape, then sampled onto the
 * grid so only the dots it covers light up, fading into a short trail. They
 * school loosely with their own kind, shy away from the cursor, and chase food
 * dropped by a click.
 *
 * Mark the text column with `data-fish-avoid` to hide the fish behind it, and
 * empty framed bands with `data-fish-clear` to show them at full strength.
 */
export default function FishField() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // one pixel per grid cell; the fish are drawn here and read back as dots
    const layer = document.createElement("canvas");
    const lctx = layer.getContext("2d", { willReadFrequently: true });
    if (!lctx) return;

    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);

    let width = 0;
    let height = 0;
    let cols = 0;
    let rows = 0;
    let intensity = new Float32Array(0);

    const fish: Fish[] = [];
    const foods: Food[] = [];
    const ripples: Ripple[] = [];
    // pointer in page space (matches the canvas), and in viewport space
    const pointer = { x: -9999, y: -9999, active: false };
    const pointerClient = { x: -9999, y: -9999 };
    // where the canvas sits in the viewport; changes as the page scrolls
    let originX = 0;
    let originY = 0;

    let frameId = 0;
    let lastTime = 0;
    let clock = 0;
    let avoidEl: Element | null = null;

    // one sprite per brightness level so drawing a dot is a plain blit
    const sprites = Array.from({ length: 20 }, (_, i) => {
      const level = i / 19;
      const tone = Math.round(90 + 150 * level);
      const sprite = document.createElement("canvas");
      sprite.width = 32;
      sprite.height = 32;
      const c = sprite.getContext("2d");
      if (c) {
        c.fillStyle = `rgba(${tone}, ${tone}, ${Math.min(255, tone + 8)}, ${0.35 + 0.65 * level})`;
        c.beginPath();
        c.arc(16, 16, 16, 0, Math.PI * 2);
        c.fill();
      }
      return sprite;
    });

    const boxOf = (el: Element | null): Box | null => {
      if (!el) return null;
      const r = el.getBoundingClientRect();
      return {
        left: r.left - originX,
        right: r.right - originX,
        top: r.top - originY,
        bottom: r.bottom - originY,
      };
    };

    const syncOrigin = () => {
      const r = canvas.getBoundingClientRect();
      originX = r.left;
      originY = r.top;
    };

    const readBoxes = (): Boxes => {
      syncOrigin();
      if (!avoidEl || !avoidEl.isConnected) {
        avoidEl = document.querySelector("[data-fish-avoid]");
      }
      const clear = Array.from(
        document.querySelectorAll("[data-fish-clear]"),
        (el) => boxOf(el),
      )
        .filter((box): box is Box => box !== null)
        .sort((a, b) => a.top - b.top);

      // the keep-clear zone is only the text itself, between the two bands.
      // the empty strips above and below the page content are free for fish.
      let column = boxOf(avoidEl);
      if (column && clear.length >= 2) {
        column = {
          ...column,
          top: clear[0].bottom,
          bottom: clear[clear.length - 1].top,
        };
      }
      return { column, clear };
    };

    const spawnFish = (index: number): Fish => {
      const species = SPECIES[index % SPECIES.length];
      const { column, clear } = readBoxes();
      let x = Math.random() * width;
      let y = Math.random() * height;
      const roomy = column !== null && column.left >= NARROW_GUTTER;

      // start in a side gutter, not behind the text
      if (column && roomy && x > column.left - 60 && x < column.right + 60) {
        x =
          Math.random() < 0.5
            ? Math.random() * Math.max(1, column.left - 80)
            : column.right +
              80 +
              Math.random() * Math.max(1, width - column.right - 80);
      }
      // band dwellers start inside their band
      const home = clear[index % 2];
      if (home && (index < 2 || !roomy)) {
        y = home.top + (home.bottom - home.top) * (0.3 + Math.random() * 0.4);
      }

      const heading = Math.random() * Math.PI * 2;
      const gap = species.length / (SPINE_POINTS - 1);
      return {
        slot: index,
        x,
        y,
        heading,
        speed: species.cruise,
        phase: Math.random() * Math.PI * 2,
        seed: Math.random() * Math.PI * 2,
        length: species.length,
        cruise: species.cruise,
        brightness: species.brightness,
        burst: 0,
        patches: Array.from({ length: 3 }, (_, i) => ({
          s: 0.2 + i * 0.22 + Math.random() * 0.1,
          len: 0.07 + Math.random() * 0.07,
          wide: 0.45 + Math.random() * 0.4,
          off: (Math.random() - 0.5) * 0.7,
        })),
        spine: Array.from({ length: SPINE_POINTS }, (_, i) => ({
          x: x - Math.cos(heading) * gap * i,
          y: y - Math.sin(heading) * gap * i,
        })),
      };
    };

    const targetCount = () =>
      width < 900
        ? 5
        : // sized by the side gutters, since the text column stays clear
          clamp(Math.round(((width - 656) * height) / 130000), 5, 11);

    const stampCell = (col: number, row: number, value: number) => {
      if (col < 0 || row < 0 || col >= cols || row >= rows) return;
      const i = row * cols + col;
      if (value > intensity[i]) intensity[i] = value;
    };

    const stampDisc = (x: number, y: number, radius: number, value: number) => {
      const c0 = Math.floor((x - radius) / CELL);
      const c1 = Math.ceil((x + radius) / CELL);
      const r0 = Math.floor((y - radius) / CELL);
      const r1 = Math.ceil((y + radius) / CELL);
      for (let row = r0; row <= r1; row += 1) {
        for (let col = c0; col <= c1; col += 1) {
          const d = Math.hypot((col + 0.5) * CELL - x, (row + 0.5) * CELL - y);
          if (d <= radius)
            stampCell(col, row, value * (1 - (d / radius) * 0.4));
        }
      }
    };

    const stampRipple = (r: Ripple) => {
      const radius = r.speed * r.t;
      const reach = radius + r.width;
      const c0 = Math.max(0, Math.floor((r.x - reach) / CELL));
      const c1 = Math.min(cols - 1, Math.ceil((r.x + reach) / CELL));
      const r0 = Math.max(0, Math.floor((r.y - reach) / CELL));
      const r1 = Math.min(rows - 1, Math.ceil((r.y + reach) / CELL));
      const fade = 1 - r.t / r.life;
      for (let row = r0; row <= r1; row += 1) {
        for (let col = c0; col <= c1; col += 1) {
          const d = Math.hypot(
            (col + 0.5) * CELL - r.x,
            (row + 0.5) * CELL - r.y,
          );
          const band = Math.abs(d - radius);
          if (band < r.width) {
            stampCell(col, row, (1 - band / r.width) * fade * r.strength);
          }
        }
      }
    };

    const stampHalo = () => {
      const c0 = Math.max(0, Math.floor((pointer.x - HALO_RADIUS) / CELL));
      const c1 = Math.min(
        cols - 1,
        Math.ceil((pointer.x + HALO_RADIUS) / CELL),
      );
      const r0 = Math.max(0, Math.floor((pointer.y - HALO_RADIUS) / CELL));
      const r1 = Math.min(
        rows - 1,
        Math.ceil((pointer.y + HALO_RADIUS) / CELL),
      );
      for (let row = r0; row <= r1; row += 1) {
        for (let col = c0; col <= c1; col += 1) {
          const d = Math.hypot(
            (col + 0.5) * CELL - pointer.x,
            (row + 0.5) * CELL - pointer.y,
          );
          if (d < HALO_RADIUS) {
            const k = 1 - d / HALO_RADIUS;
            stampCell(col, row, k * k * 0.6);
          }
        }
      }
    };

    /** Swim: steer toward a desired heading with a limited turn rate. */
    const stepFish = (dt: number, { column, clear }: Boxes) => {
      const roomy = column !== null && column.left >= NARROW_GUTTER;

      for (const f of fish) {
        const cruise = f.cruise;
        // start from "keep going the way you are facing"
        let dx = Math.cos(f.heading) * cruise;
        let dy = Math.sin(f.heading) * cruise;

        // slow, lazy meander
        const meander =
          Math.sin(clock * 0.35 + f.seed) +
          0.6 * Math.sin(clock * 0.9 + f.seed * 2.3);
        dx += -Math.sin(f.heading) * meander * cruise * 0.3;
        dy += Math.cos(f.heading) * meander * cruise * 0.3;

        // school loosely with the same kind, and give every fish room
        let n = 0;
        let cx = 0;
        let cy = 0;
        let ax = 0;
        let ay = 0;
        for (const o of fish) {
          if (o === f) continue;
          const ox = o.x - f.x;
          const oy = o.y - f.y;
          const d = Math.hypot(ox, oy);
          const sameKind = o.length === f.length;
          if (sameKind && d < 260) {
            n += 1;
            cx += o.x;
            cy += o.y;
            ax += Math.cos(o.heading);
            ay += Math.sin(o.heading);
          }
          const sepRadius = (f.length + o.length) * (sameKind ? 0.85 : 0.7);
          if (d < sepRadius && d > 0.001) {
            const push = (1 - d / sepRadius) * cruise * 2.5;
            dx -= (ox / d) * push;
            dy -= (oy / d) * push;
          }
        }
        if (n > 0) {
          dx += (ax / n) * cruise * 0.4 + ((cx / n - f.x) / 260) * cruise * 0.5;
          dy += (ay / n) * cruise * 0.4 + ((cy / n - f.y) / 260) * cruise * 0.5;
        }

        // the first fish, or all of them on narrow screens, live in the bands
        const home = !roomy || f.slot < 2 ? clear[f.slot % 2] : undefined;

        // turn away from the screen edges before reaching them; band dwellers
        // only avoid the side edges, since their bands sit near the page ends
        const margin = f.length * 1.05;
        const edge = (distance: number) => edgeOf(distance, margin) ** 2;
        dx += edge(f.x) * cruise * 3 - edge(width - f.x) * cruise * 3;
        if (!home) {
          dy += edge(f.y) * cruise * 3 - edge(height - f.y) * cruise * 3;
        }

        // stay out of the text column, except in the empty bands around it
        if (column && roomy) {
          const pad = f.length * 0.55;
          const band = clear.find((b) => f.y > b.top - 6 && f.y < b.bottom + 6);
          // how far inside the (padded) text area the fish is, per side
          const fromLeft = f.x - (column.left - pad);
          const fromRight = column.right + pad - f.x;
          const fromTop = f.y - (column.top - pad);
          const fromBottom = column.bottom + pad - f.y;
          if (fromLeft > 0 && fromRight > 0 && fromTop > 0 && fromBottom > 0) {
            // inside the keep-out zone: leave by the nearest side
            const depth = Math.min(fromLeft, fromRight, fromTop, fromBottom);
            const push = cruise * (1.5 + (2 * depth) / pad);
            if (depth === fromLeft) dx -= push;
            else if (depth === fromRight) dx += push;
            else if (depth === fromTop) dy -= push;
            else dy += push;
          }
          if (band && f.x > column.left && f.x < column.right) {
            // inside a band: keep to it, so fish do not drift into the text
            const room = Math.min(44, (band.bottom - band.top) * 0.3);
            dy += edgeOf(f.y - band.top, room) * cruise * 3;
            dy -= edgeOf(band.bottom - f.y, room) * cruise * 3;
          }
        }

        if (home) {
          const centre = (home.top + home.bottom) / 2;
          if (centre > 0 && centre < height) {
            dy += clamp((centre - f.y) / 40, -1, 1) * cruise * 2.2;
          }
        }

        // startled by the cursor: swerve away and dash
        if (pointer.active) {
          const ox = f.x - pointer.x;
          const oy = f.y - pointer.y;
          const d = Math.hypot(ox, oy);
          if (d < CURSOR_RADIUS && d > 0.001) {
            const k = 1 - d / CURSOR_RADIUS;
            dx += (ox / d) * k * k * cruise * 6;
            dy += (oy / d) * k * k * cruise * 6;
            f.burst = Math.max(f.burst, k);
          }
        }

        // chase the nearest food
        let nearest: Food | null = null;
        let nearestD = FOOD_SEEK_RANGE;
        for (const food of foods) {
          const d = Math.hypot(food.x - f.x, food.y - f.y);
          if (d < nearestD) {
            nearestD = d;
            nearest = food;
          }
        }
        if (nearest) {
          const ox = nearest.x - f.x;
          const oy = nearest.y - f.y;
          const d = Math.hypot(ox, oy) || 1;
          dx += (ox / d) * cruise * 1.8;
          dy += (oy / d) * cruise * 1.8;
          f.burst = Math.max(f.burst, 0.3);
          if (d < CELL * 3) {
            foods.splice(foods.indexOf(nearest), 1);
            ripples.push({
              x: nearest.x,
              y: nearest.y,
              t: 0,
              speed: 90,
              life: 0.9,
              width: 20,
              strength: 0.7,
            });
          }
        }

        // limited turn rate gives smooth arcs instead of sharp pivots
        const wanted = Math.atan2(dy, dx);
        // a fish cannot turn tighter than about two thirds of its own length
        const turnRate = Math.min(
          1.5,
          (f.speed / (f.length * 0.65)) * (1 + f.burst * 0.8),
        );
        f.heading += clamp(
          angleDiff(wanted, f.heading),
          -turnRate * dt,
          turnRate * dt,
        );

        const targetSpeed =
          clamp(Math.hypot(dx, dy), cruise * 0.7, cruise * 1.4) *
          (1 + f.burst * 1.3);
        f.speed += (targetSpeed - f.speed) * Math.min(1, dt * 2);

        // fish kick and glide: speed pulses with each tail stroke
        const beatHz = 0.55 + f.speed * 0.01 + f.burst * 1.5;
        f.phase += dt * Math.PI * 2 * beatHz;
        const kick = 0.88 + 0.24 * Math.max(0, Math.sin(f.phase * 2));
        f.x += Math.cos(f.heading) * f.speed * kick * dt;
        f.y += Math.sin(f.heading) * f.speed * kick * dt;
        f.x = clamp(f.x, -60, width + 60);
        f.y = clamp(f.y, -60, height + 60);

        f.burst *= Math.exp(-dt * 1.4);

        // the body follows the head, so turns bend it into a smooth curve
        const gap = f.length / (SPINE_POINTS - 1);
        f.spine[0].x = f.x;
        f.spine[0].y = f.y;
        for (let i = 1; i < f.spine.length; i += 1) {
          const prev = f.spine[i - 1];
          const cur = f.spine[i];
          const sx = cur.x - prev.x;
          const sy = cur.y - prev.y;
          const d = Math.hypot(sx, sy) || 1;
          cur.x = prev.x + (sx / d) * gap;
          cur.y = prev.y + (sy / d) * gap;
        }
      }
    };

    /** Draws one koi, seen from above, onto the one-pixel-per-cell layer. */
    const drawFish = (f: Fish) => {
      const L = f.length;
      const H = L * 0.15;
      const N = f.spine.length;
      const white = (alpha: number) =>
        `rgba(255,255,255,${alpha * f.brightness})`;

      type Joint = Point & { nx: number; ny: number; w: number };
      const joints: Joint[] = [];
      for (let i = 0; i < N; i += 1) {
        const s = i / (N - 1);
        const a = f.spine[Math.max(0, i - 1)];
        const b = f.spine[Math.min(N - 1, i + 1)];
        let tx = b.x - a.x;
        let ty = b.y - a.y;
        const len = Math.hypot(tx, ty) || 1;
        tx /= len;
        ty /= len;
        const nx = -ty;
        const ny = tx;
        // a wave travels from head to tail, growing toward the tail
        const sway =
          L * 0.07 * (0.15 + 0.85 * s ** 1.6) * Math.sin(f.phase - 5.2 * s);
        joints.push({
          x: f.spine[i].x + nx * sway,
          y: f.spine[i].y + ny * sway,
          nx,
          ny,
          w: H * bodyProfile(s),
        });
      }
      const at = (s: number) => joints[Math.round(s * (N - 1))];
      const out = (j: Joint, side: number, distance: number): Point => ({
        x: j.x + j.nx * side * distance,
        y: j.y + j.ny * side * distance,
      });

      // caudal fin: long and flowing, trailing with a lag behind the body
      const last = joints[N - 1];
      const before = joints[N - 4];
      let tdx = last.x - before.x;
      let tdy = last.y - before.y;
      const tl = Math.hypot(tdx, tdy) || 1;
      tdx /= tl;
      tdy /= tl;
      const tnx = -tdy;
      const tny = tdx;
      const tailLen = L * 0.42;
      const spread = H * 1.2;
      const lag = f.phase - 5.2 * 1.3;
      const mid = {
        x: last.x + tdx * tailLen * 0.5 + tnx * L * 0.05 * Math.sin(lag),
        y: last.y + tdy * tailLen * 0.5 + tny * L * 0.05 * Math.sin(lag),
      };
      const tip = {
        x: last.x + tdx * tailLen + tnx * L * 0.1 * Math.sin(lag - 0.6),
        y: last.y + tdy * tailLen + tny * L * 0.1 * Math.sin(lag - 0.6),
      };
      let ux = tip.x - mid.x;
      let uy = tip.y - mid.y;
      const ul = Math.hypot(ux, uy) || 1;
      ux /= ul;
      uy /= ul;
      const vx = -uy;
      const vy = ux;
      lctx.fillStyle = white(0.6);
      lctx.beginPath();
      lctx.moveTo(last.x + tnx * H * 0.14, last.y + tny * H * 0.14);
      lctx.quadraticCurveTo(
        mid.x + vx * spread * 0.7,
        mid.y + vy * spread * 0.7,
        tip.x + vx * spread,
        tip.y + vy * spread,
      );
      lctx.quadraticCurveTo(
        tip.x + vx * spread * 0.3 - ux * tailLen * 0.1,
        tip.y + vy * spread * 0.3 - uy * tailLen * 0.1,
        tip.x - ux * tailLen * 0.24,
        tip.y - uy * tailLen * 0.24,
      );
      lctx.quadraticCurveTo(
        tip.x - vx * spread * 0.3 - ux * tailLen * 0.1,
        tip.y - vy * spread * 0.3 - uy * tailLen * 0.1,
        tip.x - vx * spread,
        tip.y - vy * spread,
      );
      lctx.quadraticCurveTo(
        mid.x - vx * spread * 0.7,
        mid.y - vy * spread * 0.7,
        last.x - tnx * H * 0.14,
        last.y - tny * H * 0.14,
      );
      lctx.closePath();
      lctx.fill();

      // pelvic fins: small, further back
      for (const side of [1, -1]) {
        const base = at(0.5);
        const rear = at(0.6);
        const tipJ = at(0.66);
        const flick = Math.sin(f.phase + (side > 0 ? 0 : Math.PI)) * H * 0.12;
        const tipP = out(tipJ, side, tipJ.w + H * 0.45 + flick);
        lctx.fillStyle = white(0.42);
        lctx.beginPath();
        lctx.moveTo(
          out(base, side, base.w * 0.8).x,
          out(base, side, base.w * 0.8).y,
        );
        lctx.lineTo(tipP.x, tipP.y);
        lctx.lineTo(
          out(rear, side, rear.w * 0.85).x,
          out(rear, side, rear.w * 0.85).y,
        );
        lctx.closePath();
        lctx.fill();
      }

      // body: lighter along the spine, darker toward the edges
      const c = at(0.35);
      const shade = lctx.createLinearGradient(
        c.x + c.nx * H,
        c.y + c.ny * H,
        c.x - c.nx * H,
        c.y - c.ny * H,
      );
      shade.addColorStop(0, white(0.55));
      shade.addColorStop(0.5, white(1));
      shade.addColorStop(1, white(0.55));
      const outline: Point[] = [
        ...joints.map((j) => out(j, 1, j.w)),
        ...joints.map((j) => out(j, -1, j.w)).reverse(),
      ];
      lctx.fillStyle = shade;
      lctx.beginPath();
      lctx.moveTo(
        (outline[0].x + outline[outline.length - 1].x) / 2,
        (outline[0].y + outline[outline.length - 1].y) / 2,
      );
      for (let i = 0; i < outline.length; i += 1) {
        const p = outline[i];
        const q = outline[(i + 1) % outline.length];
        lctx.quadraticCurveTo(p.x, p.y, (p.x + q.x) / 2, (p.y + q.y) / 2);
      }
      lctx.closePath();
      lctx.fill();

      // pectoral fins: splayed out sideways behind the head, fluttering
      for (const side of [1, -1]) {
        const base = at(0.18);
        const back = at(0.32);
        const tipJ = at(0.42);
        const flutter = Math.sin(f.phase + (side > 0 ? 0 : Math.PI)) * H * 0.2;
        const root = out(base, side, base.w * 0.8);
        const tipP = out(tipJ, side, tipJ.w + H * 0.85 + flutter);
        const rear = out(back, side, back.w * 0.9);
        lctx.fillStyle = white(0.5);
        lctx.beginPath();
        lctx.moveTo(root.x, root.y);
        lctx.quadraticCurveTo(
          (root.x + tipP.x) / 2 + base.nx * side * H * 0.3,
          (root.y + tipP.y) / 2 + base.ny * side * H * 0.3,
          tipP.x,
          tipP.y,
        );
        lctx.lineTo(rear.x, rear.y);
        lctx.closePath();
        lctx.fill();
      }

      // koi markings, as softer patches on the body
      lctx.globalCompositeOperation = "destination-out";
      lctx.fillStyle = "rgba(0,0,0,0.4)";
      for (const patch of f.patches) {
        const j = at(patch.s);
        const centre = out(j, 1, j.w * patch.off);
        lctx.beginPath();
        lctx.ellipse(
          centre.x,
          centre.y,
          L * patch.len,
          j.w * patch.wide,
          Math.atan2(-j.nx, j.ny),
          0,
          Math.PI * 2,
        );
        lctx.fill();
      }

      // two eyes, cut out of the head
      const eyeJ = at(0.11);
      lctx.fillStyle = "#000";
      for (const side of [1, -1]) {
        const eye = out(eyeJ, side, eyeJ.w * 0.62);
        lctx.beginPath();
        lctx.arc(eye.x, eye.y, Math.max(L * 0.035, 2.4), 0, Math.PI * 2);
        lctx.fill();
      }
      lctx.globalCompositeOperation = "source-over";
    };

    const render = ({ column, clear }: Boxes) => {
      ctx.clearRect(0, 0, width, height);
      const columnDim =
        column && column.left < NARROW_GUTTER ? NARROW_DIM : COLUMN_DIM;

      const factorAt = (x: number, y: number) => {
        let factor = 1;
        if (column) {
          const outside = Math.hypot(
            Math.max(column.left - x, x - column.right, 0),
            Math.max(column.top - y, y - column.bottom, 0),
          );
          factor =
            columnDim + (1 - columnDim) * clamp(outside / COLUMN_RAMP, 0, 1);
        }
        for (const box of clear) {
          // a band is a full-width row: fully visible inside, soft at its edges
          const beyond = Math.max(box.top - y, y - box.bottom, 0);
          factor = Math.max(factor, 1 - clamp(beyond / BAND_FEATHER, 0, 1));
        }
        return factor;
      };

      for (let i = 0; i < intensity.length; i += 1) {
        const value = intensity[i];
        if (value < 0.04) continue;
        const x = ((i % cols) + 0.5) * CELL;
        const y = (Math.floor(i / cols) + 0.5) * CELL;
        const factor = factorAt(x, y);
        if (factor <= 0.01) continue;
        // halftone: brighter areas get bigger dots
        const size = 0.9 + (CELL - 1.2) * Math.sqrt(Math.min(1, value));
        ctx.globalAlpha = factor;
        ctx.drawImage(
          sprites[Math.min(19, Math.floor(value * 19.99))],
          x - size / 2,
          y - size / 2,
          size,
          size,
        );
      }
      ctx.globalAlpha = 1;
    };

    /** Draw every fish, then fold what they cover into the dot intensities. */
    const sampleFish = (fade: number) => {
      lctx.setTransform(1, 0, 0, 1, 0, 0);
      lctx.clearRect(0, 0, cols, rows);
      lctx.setTransform(1 / CELL, 0, 0, 1 / CELL, 0, 0);
      for (const f of fish) drawFish(f);
      const pixels = lctx.getImageData(0, 0, cols, rows).data;
      for (let i = 0; i < intensity.length; i += 1) {
        const covered = pixels[i * 4 + 3] / 255;
        const decayed = intensity[i] * fade;
        intensity[i] = covered > decayed ? covered : decayed;
      }
    };

    const frame = (now: number) => {
      frameId = requestAnimationFrame(frame);
      if (!lastTime) lastTime = now;
      const elapsed = now - lastTime;
      if (elapsed < FRAME_MS) return;
      lastTime = now;
      if (document.hidden) return;

      const dt = Math.min(0.05, elapsed / 1000);
      clock += dt;

      for (let i = ripples.length - 1; i >= 0; i -= 1) {
        ripples[i].t += dt;
        if (ripples[i].t > ripples[i].life) ripples.splice(i, 1);
      }
      for (let i = foods.length - 1; i >= 0; i -= 1) {
        foods[i].age += dt;
        foods[i].y += FOOD_SINK * dt;
        if (foods[i].age > FOOD_LIFE || foods[i].y > height) foods.splice(i, 1);
      }

      const boxes = readBoxes();
      pointer.x = pointerClient.x - originX;
      pointer.y = pointerClient.y - originY;
      stepFish(dt, boxes);
      sampleFish(Math.exp(-dt * FADE_RATE));

      if (pointer.active) stampHalo();
      for (const r of ripples) stampRipple(r);
      for (const food of foods) {
        const pulse = 0.85 + 0.15 * Math.sin(clock * 9 + food.x);
        stampDisc(food.x, food.y, CELL * 1.6, pulse);
      }

      render(boxes);
    };

    const layout = () => {
      // the canvas covers the whole page, so it scrolls with the content
      const host = canvas.parentElement;
      const rect = host?.getBoundingClientRect();
      const nextWidth = Math.max(
        1,
        Math.round(rect?.width ?? window.innerWidth),
      );
      const nextHeight = Math.max(
        1,
        Math.round(rect?.height ?? window.innerHeight),
      );
      if (
        nextWidth === width &&
        nextHeight === height &&
        intensity.length > 0
      ) {
        return;
      }
      width = nextWidth;
      height = nextHeight;
      canvas.width = Math.max(1, Math.round(width * pixelRatio));
      canvas.height = Math.max(1, Math.round(height * pixelRatio));
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);

      cols = Math.ceil(width / CELL);
      rows = Math.ceil(height / CELL);
      layer.width = cols;
      layer.height = rows;
      intensity = new Float32Array(cols * rows);

      const wanted = targetCount();
      while (fish.length < wanted) fish.push(spawnFish(fish.length));
      fish.length = wanted;

      if (reducedMotion) {
        sampleFish(0);
        render(readBoxes());
      }
    };

    const setPointer = (e: PointerEvent) => {
      pointerClient.x = e.clientX;
      pointerClient.y = e.clientY;
      pointer.active = true;
    };
    const onMove = (e: PointerEvent) => setPointer(e);
    const onUp = (e: PointerEvent) => {
      if (e.pointerType === "touch") pointer.active = false;
    };
    const onLeave = () => {
      pointer.active = false;
    };
    const onDown = (e: PointerEvent) => {
      setPointer(e);
      // clicks on links and buttons are for the page, not the fish
      if (e.target instanceof Element && e.target.closest(INTERACTIVE)) return;
      syncOrigin();
      const px = e.clientX - originX;
      const py = e.clientY - originY;
      ripples.push({
        x: px,
        y: py,
        t: 0,
        speed: 220,
        life: 1.7,
        width: 34,
        strength: 1,
      });
      if (ripples.length > MAX_RIPPLES) ripples.splice(0, 1);
      foods.push({ x: px, y: py, age: 0 });
      if (foods.length > MAX_FOOD) foods.splice(0, 1);
      playBlip();
    };

    layout();
    // the page height changes when sections expand, so watch the host too
    const resizeObserver = new ResizeObserver(layout);
    if (canvas.parentElement) resizeObserver.observe(canvas.parentElement);

    if (!reducedMotion) {
      window.addEventListener("pointermove", onMove, { passive: true });
      window.addEventListener("pointerdown", onDown);
      window.addEventListener("pointerup", onUp);
      document.documentElement.addEventListener("pointerleave", onLeave);
      frameId = requestAnimationFrame(frame);
    }

    return () => {
      cancelAnimationFrame(frameId);
      resizeObserver.disconnect();
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointerup", onUp);
      document.documentElement.removeEventListener("pointerleave", onLeave);
    };
  }, []);

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 z-0"
      style={{ animation: "fish-fade-in 2s ease-out both" }}
    >
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />
    </div>
  );
}
