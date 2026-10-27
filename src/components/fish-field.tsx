import { useEffect, useRef } from "react";
import { playBlip } from "@/utils/sound";

const FRAME_MS = 1000 / 30;
const SPINE_POINTS = 20;

const CURSOR_RADIUS = 170;

const FOOD_LIFE = 8;
const FOOD_SINK = 8;
const FOOD_SEEK_RANGE = 380;
const MAX_FOOD = 8;
const MAX_RIPPLES = 6;

/** Fish are hidden behind the text column so they never hurt legibility. */
const COLUMN_DIM = 0;
const COLUMN_RAMP = 24;
/** When the side gutters are narrower than this, fish cannot stay out of the
    column, so they live in the empty bands instead. */
const NARROW_GUTTER = 120;
const NARROW_DIM = 0;
/** The empty bands show fish across the whole row, fading out this many px
    beyond their top and bottom edges rather than cutting off sharply. */
const BAND_FEATHER = 36;
/** Extra canvas height beyond the page, so expanding a section does not resize it. */
const CANVAS_HEADROOM = 700;

const TAIL_RATIO = 0.42;

/** Glyphs for a fish body, light to dense, plus outline and water glyphs. */
const RAMP = "t%SX8@#";
const OUTLINE = "-|/\\";
const EXTRA = ".:o*+'";
const GLYPHS = RAMP + OUTLINE + EXTRA;
/** Grey levels a glyph can be drawn in. */
const TONES = [60, 85, 110, 135, 160, 185, 210, 235];
const TILE = "rgb(232,232,236)";

type Species = { cells: number; cruise: number; brightness: number };

/** Body length in grid cells (tail excluded), calm cruising speed in px/s, brightness. */
const SPECIES: readonly Species[] = [
  { cells: 12, cruise: 40, brightness: 0.85 },
  { cells: 16, cruise: 32, brightness: 0.92 },
  { cells: 22, cruise: 26, brightness: 1 },
];

type Point = { x: number; y: number };
/** A koi-style marking: where along the body, how long, how wide, how far off-centre. */
type Patch = {
  s: number;
  len: number;
  wide: number;
  off: number;
  bright: boolean;
};

type Fish = {
  /** Spawn order; also the id written into the layer, and the first fish live in the bands. */
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
  /** +1 when swimming rightward, -1 leftward; eases so fins roll over. */
  roll: number;
  /** 0 to 1, raised when startled or chasing food. */
  burst: number;
  patches: Patch[];
  /** Head first; each point follows the one before it. */
  spine: Point[];
};

type Food = { x: number; y: number; age: number };
type Bite = { x: number; y: number; born: number };
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

const hash = (a: number, b: number, c: number) => {
  let h = (a * 374761393 + b * 668265263 + c * 2147483647) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return (h ^ (h >>> 16)) >>> 0;
};

/** Which line glyph runs along a direction. */
const orient = (tx: number, ty: number) => {
  const m = Math.hypot(tx, ty) || 1;
  if (Math.abs(ty) < 0.38 * m) return "-";
  if (Math.abs(tx) < 0.38 * m) return "|";
  return tx * ty > 0 ? "\\" : "/";
};

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
 * A page-wide pond of ASCII koi. The page is a grid of character cells; each
 * fish is drawn as a smooth shape, then read back cell by cell: the inside
 * becomes shaded square tiles topped with density glyphs, the fins and edges
 * become line glyphs, and the water gets a wake of dots and dashes. Fish stay
 * out of the text column, cross it only in the empty bands, shy away from the
 * cursor, and chase food dropped by a click.
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

    // one pixel per grid cell; the fish are drawn here and read back as cells
    const layer = document.createElement("canvas");
    const lctx = layer.getContext("2d", { willReadFrequently: true });
    if (!lctx) return;

    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);

    let width = 0;
    let height = 0;
    // the allocated canvas is taller than the page by a margin, so small height
    // changes (a project expanding) never reallocate it or clear the drawing
    let allocWidth = 0;
    let allocHeight = 0;
    // size of one character cell, in CSS px
    let cw = 10;
    let ch = 12;
    let cols = 0;
    let rows = 0;
    let energy = new Float32Array(0);
    let energyTmp = new Float32Array(0);
    let covered = new Uint8Array(0);

    const fish: Fish[] = [];
    const foods: Food[] = [];
    const bites: Bite[] = [];
    const ripples: Ripple[] = [];
    let eyeCells: number[] = [];
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

    // each glyph pre-rendered in each grey, so drawing one is a plain blit
    let atlas: Record<string, HTMLCanvasElement[]> = {};
    const buildAtlas = () => {
      const next: Record<string, HTMLCanvasElement[]> = {};
      const w = Math.max(1, Math.round(cw * pixelRatio));
      const h = Math.max(1, Math.round(ch * pixelRatio));
      for (const glyph of GLYPHS) {
        next[glyph] = TONES.map((tone) => {
          const sprite = document.createElement("canvas");
          sprite.width = w;
          sprite.height = h;
          const c = sprite.getContext("2d");
          if (c) {
            c.font = `700 ${Math.round(ch * 0.72 * pixelRatio)}px Mononoki, ui-monospace, Menlo, monospace`;
            c.textAlign = "center";
            c.textBaseline = "middle";
            c.fillStyle = `rgb(${tone}, ${tone}, ${Math.min(255, tone + 6)})`;
            c.fillText(glyph, w / 2, h / 2 + pixelRatio);
          }
          return sprite;
        });
      }
      atlas = next;
    };

    const drawGlyph = (
      glyph: string,
      tone: number,
      alpha: number,
      col: number,
      row: number,
    ) => {
      const sprite = atlas[glyph]?.[clamp(tone, 0, TONES.length - 1)];
      if (!sprite || alpha <= 0.01) return;
      ctx.globalAlpha = alpha;
      ctx.drawImage(sprite, col * cw, row * ch, cw, ch);
    };

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

      const length = species.cells * cw;
      const heading = Math.random() * Math.PI * 2;
      const gap = length / (SPINE_POINTS - 1);
      return {
        slot: index,
        x,
        y,
        heading,
        speed: species.cruise,
        phase: Math.random() * Math.PI * 2,
        seed: Math.random() * Math.PI * 2,
        length,
        cruise: species.cruise,
        brightness: species.brightness,
        roll: Math.cos(heading) >= 0 ? 1 : -1,
        burst: 0,
        patches: Array.from({ length: 4 }, (_, i) => ({
          s: 0.16 + i * 0.18 + Math.random() * 0.08,
          len: 0.06 + Math.random() * 0.06,
          wide: 0.5 + Math.random() * 0.4,
          off: (Math.random() - 0.5) * 0.7,
          bright: Math.random() < 0.55,
        })),
        spine: Array.from({ length: SPINE_POINTS }, (_, i) => ({
          x: x - Math.cos(heading) * gap * i,
          y: y - Math.sin(heading) * gap * i,
        })),
      };
    };

    const targetCount = () =>
      width < 900
        ? 4
        : // sized by the side gutters, since the text column stays clear
          clamp(Math.round(((width - 656) * height) / 240000), 4, 8);

    const cellAt = (x: number, y: number) => {
      const col = Math.floor(x / cw);
      const row = Math.floor(y / ch);
      return col < 0 || row < 0 || col >= cols || row >= rows
        ? -1
        : row * cols + col;
    };

    /** Disturb the water around a point; it shows as dots and dashes. */
    const disturb = (x: number, y: number, amount: number) => {
      const i = cellAt(x, y);
      if (i >= 0) energy[i] = Math.min(1.5, energy[i] + amount);
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
          if (sameKind && d < 300) {
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
          dx += (ax / n) * cruise * 0.4 + ((cx / n - f.x) / 300) * cruise * 0.5;
          dy += (ay / n) * cruise * 0.4 + ((cy / n - f.y) / 300) * cruise * 0.5;
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
          if (d < cw * 3) {
            foods.splice(foods.indexOf(nearest), 1);
            bites.push({ x: nearest.x, y: nearest.y, born: clock });
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

        // limited turn rate gives smooth arcs instead of sharp pivots; a fish
        // cannot turn tighter than about two thirds of its own length
        const wanted = Math.atan2(dy, dx);
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
        const facing = Math.cos(f.heading) >= 0 ? 1 : -1;
        f.roll += (facing - f.roll) * Math.min(1, dt * 7);

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

        // the tail stirs the water, leaving a wake behind
        for (let i = SPINE_POINTS - 4; i < SPINE_POINTS; i += 1) {
          disturb(f.spine[i].x, f.spine[i].y, 0.05 + 0.0015 * f.speed);
        }
      }
    };

    /**
     * Draws one koi, seen from above, onto the one-pixel-per-cell layer. The
     * colour channels carry meaning for the read-back: red is how bright a
     * body cell is, green marks fins, and blue says which fish it belongs to.
     */
    const drawFish = (f: Fish) => {
      const L = f.length;
      const H = L * 0.15;
      const N = f.spine.length;
      const idB = f.slot * 20;
      const body = (shade: number) =>
        `rgb(${Math.round(clamp(shade * f.brightness, 0, 1) * 255)},0,${idB})`;
      const fin = `rgb(0,255,${idB})`;

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
      const tailLen = L * TAIL_RATIO;
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
      lctx.fillStyle = fin;
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
        const tipP = out(tipJ, side, tipJ.w + H * 0.5 + flick);
        const b0 = out(base, side, base.w * 0.8);
        const b1 = out(rear, side, rear.w * 0.85);
        lctx.fillStyle = fin;
        lctx.beginPath();
        lctx.moveTo(b0.x, b0.y);
        lctx.lineTo(tipP.x, tipP.y);
        lctx.lineTo(b1.x, b1.y);
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
      shade.addColorStop(0, body(0.5));
      shade.addColorStop(0.5, body(0.82));
      shade.addColorStop(1, body(0.5));
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
        const tipP = out(tipJ, side, tipJ.w + H * 0.9 + flutter);
        const rear = out(back, side, back.w * 0.9);
        lctx.fillStyle = fin;
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

      // koi markings: bright and dark patches, only where there is body
      lctx.globalCompositeOperation = "source-atop";
      for (const patch of f.patches) {
        const j = at(patch.s);
        const centre = out(j, 1, j.w * patch.off);
        lctx.fillStyle = patch.bright ? body(1.1) : body(0.2);
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
      lctx.globalCompositeOperation = "source-over";

      // two eyes, remembered as cells so they can be drawn as an "o" later
      const eyeJ = at(0.11);
      for (const side of [1, -1]) {
        const eye = out(eyeJ, side, eyeJ.w * 0.62);
        const i = cellAt(eye.x, eye.y);
        if (i >= 0) eyeCells.push(i);
      }
    };

    const render = ({ column, clear }: Boxes, dt: number) => {
      // draw every fish into the one-pixel-per-cell layer, then read it back
      lctx.setTransform(1, 0, 0, 1, 0, 0);
      lctx.clearRect(0, 0, cols, rows);
      lctx.setTransform(1 / cw, 0, 0, 1 / ch, 0, 0);
      eyeCells = [];
      for (const f of fish) drawFish(f);
      const px = lctx.getImageData(0, 0, cols, rows).data;

      // the wake spreads out and fades
      const keep = Math.exp(-1.1 * dt);
      for (let r = 0; r < rows; r += 1) {
        for (let c = 0; c < cols; c += 1) {
          const i = r * cols + c;
          const here = energy[i];
          const left = c > 0 ? energy[i - 1] : here;
          const right = c < cols - 1 ? energy[i + 1] : here;
          const up = r > 0 ? energy[i - cols] : here;
          const down = r < rows - 1 ? energy[i + cols] : here;
          energyTmp[i] = (4 * here + left + right + up + down) * 0.125 * keep;
        }
      }
      [energy, energyTmp] = [energyTmp, energy];

      ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
      ctx.clearRect(0, 0, allocWidth, allocHeight);
      covered.fill(0);

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

      const alphaAt = (c: number, r: number) =>
        c < 0 || r < 0 || c >= cols || r >= rows
          ? 0
          : px[(r * cols + c) * 4 + 3] / 255;
      const tile = (col: number, row: number, alpha: number) => {
        if (alpha <= 0.01) return;
        ctx.globalAlpha = alpha;
        ctx.fillStyle = TILE;
        ctx.fillRect(col * cw + 1, row * ch + 1, cw - 1, ch - 1);
      };
      const toneFor = (gray: number) =>
        clamp(
          Math.round((gray / 235) * (TONES.length - 1)),
          0,
          TONES.length - 1,
        );

      for (let row = 0; row < rows; row += 1) {
        for (let col = 0; col < cols; col += 1) {
          const i = row * cols + col;
          const p = i * 4;
          const a = px[p + 3];
          const x = col * cw + cw / 2;
          const y = row * ch + ch / 2;

          if (a < 24) {
            // open water: only the wake shows
            const e = energy[i];
            if (e >= 0.22) {
              const factor = factorAt(x, y);
              drawGlyph(
                e > 0.5 ? "-" : ".",
                6,
                0.35 * Math.min(1, (e - 0.22) * 1.4) * factor,
                col,
                row,
              );
            }
            continue;
          }

          covered[i] = 1;
          const factor = factorAt(x, y);
          if (factor <= 0.01) continue;

          const a01 = a / 255;
          const red = px[p];
          const green = px[p + 1];
          const owner = fish[Math.round(px[p + 2] / 20)];
          const lx = owner ? Math.floor((x - owner.x) / cw) : col;
          const ly = owner ? Math.floor((y - owner.y) / ch) : row;
          const h = hash(lx, ly, owner ? owner.slot : 0);

          if (green > 150 && green > red) {
            // fins: a faint tile with a line glyph along the edge
            tile(col, row, 0.1 * a01 * factor);
            const gx = (alphaAt(col + 1, row) - alphaAt(col - 1, row)) / cw;
            const gy = (alphaAt(col, row + 1) - alphaAt(col, row - 1)) / ch;
            const glyph = Math.hypot(gx, gy) < 0.002 ? "." : orient(-gy, gx);
            drawGlyph(glyph, 6, 0.6 * a01 * factor, col, row);
            continue;
          }

          const shade = red / 255;
          const tileAlpha = 0.1 + 0.8 * Math.min(1, shade * 1.1);
          const twinkle =
            hash(h, Math.floor(clock * 1.4), 7) % 100 < 3 ? 0.55 : 1;

          if (a01 >= 0.62) {
            // inside the body: a shaded tile with a density glyph on top
            tile(col, row, tileAlpha * twinkle * factor);
            const glyph =
              RAMP[clamp(Math.round((1 - shade) * 4) + ((h >>> 4) % 3), 0, 6)];
            drawGlyph(glyph, toneFor(232 * tileAlpha * 0.42), factor, col, row);
          } else {
            // the edge of the body: a thinner tile, now and then a dot
            tile(col, row, tileAlpha * a01 * 0.55 * factor);
            if (h % 3 === 0 && a01 > 0.3) {
              drawGlyph(
                ".",
                toneFor(232 * tileAlpha * 0.5),
                factor * 0.8,
                col,
                row,
              );
            }
          }
        }
      }

      // eyes: a dark cell with a pale "o"
      for (const i of eyeCells) {
        if (!covered[i]) continue;
        const col = i % cols;
        const row = Math.floor(i / cols);
        const factor = factorAt(col * cw + cw / 2, row * ch + ch / 2);
        if (factor <= 0.01) continue;
        ctx.globalAlpha = 0.9 * factor;
        ctx.fillStyle = "#09090b";
        ctx.fillRect(col * cw + 1, row * ch + 1, cw - 1, ch - 1);
        drawGlyph("o", 7, factor, col, row);
      }

      // ripples: a ring of line glyphs followed by a ring of dots
      for (const r of ripples) {
        const fade = Math.max(0, 1 - r.t / r.life) ** 1.5 * r.strength;
        for (let ring = 0; ring < 2; ring += 1) {
          const radius =
            52 *
            Math.max(0, r.t - 0.45 * ring) *
            (0.7 + 0.5 * r.strength) *
            (r.speed / 90);
          if (radius < 2) continue;
          const reach = radius + cw;
          const c0 = Math.max(0, Math.floor((r.x - reach) / cw));
          const c1 = Math.min(cols - 1, Math.floor((r.x + reach) / cw));
          const r0 = Math.max(0, Math.floor((r.y - reach) / ch));
          const r1 = Math.min(rows - 1, Math.floor((r.y + reach) / ch));
          for (let rr = r0; rr <= r1; rr += 1) {
            for (let cc = c0; cc <= c1; cc += 1) {
              if (covered[rr * cols + cc]) continue;
              const dx = cc * cw + cw / 2 - r.x;
              const dy = rr * ch + ch / 2 - r.y;
              if (Math.abs(Math.hypot(dx, dy) - radius) > cw * 0.6) continue;
              const factor = factorAt(cc * cw + cw / 2, rr * ch + ch / 2);
              drawGlyph(
                ring === 1 ? "." : orient(-dy, dx),
                6,
                fade * (ring === 0 ? 0.55 : 0.3) * factor,
                cc,
                rr,
              );
            }
          }
        }
      }

      // food, and the little burst when a fish takes it
      for (const food of foods) {
        const i = cellAt(food.x, food.y);
        if (i < 0 || covered[i]) continue;
        const pulse = 0.8 + 0.2 * Math.sin(clock * 6 + food.x);
        const factor = factorAt(food.x, food.y);
        drawGlyph("o", 7, pulse * factor, i % cols, Math.floor(i / cols));
      }
      for (let i = bites.length - 1; i >= 0; i -= 1) {
        const age = (clock - bites[i].born) / 0.45;
        if (age >= 1) {
          bites.splice(i, 1);
          continue;
        }
        const cell = cellAt(bites[i].x, bites[i].y);
        if (cell < 0) continue;
        const glyph = age < 0.35 ? "*" : age < 0.7 ? "+" : ".";
        drawGlyph(
          glyph,
          7,
          (1 - age * age) * factorAt(bites[i].x, bites[i].y),
          cell % cols,
          Math.floor(cell / cols),
        );
      }
      ctx.globalAlpha = 1;
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

      // the cursor stirs the water too
      if (pointer.active) {
        disturb(pointer.x, pointer.y, 0.34);
        for (const [ox, oy] of [
          [cw, 0],
          [-cw, 0],
          [0, ch],
          [0, -ch],
        ]) {
          disturb(pointer.x + ox, pointer.y + oy, 0.14);
        }
      }

      render(boxes, dt);
    };

    const layout = () => {
      // the canvas covers the whole page, so it scrolls with the content
      const host = canvas.parentElement;
      const rect = host?.getBoundingClientRect();
      width = Math.max(1, Math.round(rect?.width ?? window.innerWidth));
      height = Math.max(1, Math.round(rect?.height ?? window.innerHeight));

      // cells grow a little on wide screens, like characters in a terminal
      const nextCw = clamp(Math.round(window.innerWidth / 125), 8, 11);
      const cellsChanged = nextCw !== cw || nextCw + 2 !== ch;
      cw = nextCw;
      ch = nextCw + 2;

      // reallocating clears the canvas, so only do it when the page is wider
      // than the canvas, or taller than the room we left
      if (width !== allocWidth || height > allocHeight || cellsChanged) {
        allocWidth = width;
        allocHeight = height + CANVAS_HEADROOM;
        canvas.width = Math.max(1, Math.round(allocWidth * pixelRatio));
        canvas.height = Math.max(1, Math.round(allocHeight * pixelRatio));
        canvas.style.width = `${allocWidth}px`;
        canvas.style.height = `${allocHeight}px`;
        ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);

        cols = Math.ceil(allocWidth / cw);
        rows = Math.ceil(allocHeight / ch);
        layer.width = cols;
        layer.height = rows;
        energy = new Float32Array(cols * rows);
        energyTmp = new Float32Array(cols * rows);
        covered = new Uint8Array(cols * rows);
        buildAtlas();

        // fish are sized in cells, so resize any that already exist
        for (const f of fish) {
          const species = SPECIES[f.slot % SPECIES.length];
          f.length = species.cells * cw;
        }
      }

      // only add or remove fish when the target clearly changes, so a small
      // height change never makes a fish pop in or vanish
      const wanted = targetCount();
      if (fish.length === 0) {
        while (fish.length < wanted) fish.push(spawnFish(fish.length));
      } else if (wanted > fish.length + 1) {
        while (fish.length < wanted - 1) fish.push(spawnFish(fish.length));
      } else if (wanted < fish.length - 1) {
        fish.length = wanted + 1;
      }

      if (reducedMotion) render(readBoxes(), 0);
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
    // the glyph atlas needs the real font, which may still be loading
    void document.fonts?.ready.then(() => {
      buildAtlas();
      if (reducedMotion) render(readBoxes(), 0);
    });
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
      className="pointer-events-none absolute inset-0 z-0 overflow-hidden"
      style={{ animation: "fish-fade-in 2s ease-out both" }}
    >
      <canvas ref={canvasRef} className="absolute top-0 left-0" />
    </div>
  );
}
