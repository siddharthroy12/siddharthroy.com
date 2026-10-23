import { useEffect, useRef } from "react";
import { playBlip } from "@/utils/sound";

const SPACING = 9;
const DOT_SIZE = 2;
const CURSOR_RADIUS = 120;
const CURSOR_FORCE = 52;
const RIPPLE_SPEED = 220;
const RIPPLE_WIDTH = 34;
const RIPPLE_LIFE = 1.7;
const RIPPLE_FORCE = 24;
const SPRING = 6.4;
const DAMPING = 0.85;
const BASE_ALPHA = 0.48;
const INK = "115, 115, 115";

type Dot = {
  ox: number;
  oy: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  glow: number;
};

type Ripple = { x: number; y: number; time: number };

type Props = { className?: string };

/**
 * A field of dots that react to the pointer: nearby dots brighten and are
 * pushed away on a spring, and a click sends a ripple through the grid.
 */
export default function InteractiveDots({ className }: Props) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const wrapper = wrapperRef.current;
    const canvas = canvasRef.current;
    if (!wrapper || !canvas) return;
    const context = canvas.getContext("2d");
    if (!context) return;

    const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    const dots: Dot[] = [];
    const ripples: Ripple[] = [];
    const pointer = { x: -9999, y: -9999, inside: false };
    let width = 0;
    let height = 0;
    let frameId = 0;
    let lastTime = 0;
    let clock = 0;
    let visible = true;

    // pre-render one sprite per brightness level so the hot loop only blits
    const sprites = Array.from({ length: 20 }, (_, i) => {
      const sprite = document.createElement("canvas");
      sprite.width = 32;
      sprite.height = 32;
      const c = sprite.getContext("2d");
      if (c) {
        c.fillStyle = `rgba(${INK}, ${0.3 + (i / 19) * 0.7})`;
        c.beginPath();
        c.arc(16, 16, 16, 0, Math.PI * 2);
        c.fill();
      }
      return sprite;
    });

    const draw = (dt: number) => {
      context.clearRect(0, 0, width, height);
      const decay = DAMPING ** (60 * dt);
      const ease = 1 - decay;

      for (let i = ripples.length - 1; i >= 0; i -= 1) {
        ripples[i].time += dt;
        if (ripples[i].time > RIPPLE_LIFE) ripples.splice(i, 1);
      }

      for (const dot of dots) {
        let fx = 0;
        let fy = 0;
        let glow = 0;

        if (pointer.inside) {
          const dx = dot.ox - pointer.x;
          const dy = dot.oy - pointer.y;
          const d2 = dx * dx + dy * dy;
          if (d2 < CURSOR_RADIUS * CURSOR_RADIUS) {
            const d = Math.sqrt(d2) || 1;
            const t = 1 - d / CURSOR_RADIUS;
            const push = t * t * CURSOR_FORCE;
            fx += (dx / d) * push;
            fy += (dy / d) * push;
            glow = t;
          }
        }

        for (const ripple of ripples) {
          const dx = dot.ox - ripple.x;
          const dy = dot.oy - ripple.y;
          const d = Math.sqrt(dx * dx + dy * dy) || 1;
          const band = Math.abs(d - RIPPLE_SPEED * ripple.time);
          if (band < RIPPLE_WIDTH) {
            const strength =
              (1 - band / RIPPLE_WIDTH) * (1 - ripple.time / RIPPLE_LIFE);
            glow = Math.max(glow, strength);
            fx += (dx / d) * strength * RIPPLE_FORCE;
            fy += (dy / d) * strength * RIPPLE_FORCE;
          }
        }

        fx += (dot.ox - dot.x) * SPRING;
        fy += (dot.oy - dot.y) * SPRING;
        dot.vx = (dot.vx + fx * dt) * decay;
        dot.vy = (dot.vy + fy * dt) * decay;
        dot.x += dot.vx * dt * 60;
        dot.y += dot.vy * dt * 60;
        dot.glow += (glow - dot.glow) * ease;

        const shimmer =
          (Math.sin(clock * 0.8 + dot.ox * 0.015 + dot.oy * 0.02) + 1) * 0.04;
        const level = Math.min(1, dot.glow + shimmer);
        context.globalAlpha = Math.min(
          1,
          BASE_ALPHA + shimmer + dot.glow * 0.5,
        );
        context.drawImage(
          sprites[Math.floor(level * 19)],
          dot.x - DOT_SIZE / 2,
          dot.y - DOT_SIZE / 2,
          DOT_SIZE,
          DOT_SIZE,
        );
      }
      context.globalAlpha = 1;
    };

    const layout = () => {
      const bounds = wrapper.getBoundingClientRect();
      width = bounds.width;
      height = bounds.height;
      canvas.width = Math.max(1, Math.round(width * pixelRatio));
      canvas.height = Math.max(1, Math.round(height * pixelRatio));
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);

      dots.length = 0;
      const cols = Math.floor(width / SPACING);
      const rows = Math.floor(height / SPACING);
      const offsetX = (width - (cols - 1) * SPACING) / 2;
      const offsetY = (height - (rows - 1) * SPACING) / 2;
      for (let r = 0; r < rows; r += 1) {
        for (let c = 0; c < cols; c += 1) {
          const x = offsetX + c * SPACING;
          const y = offsetY + r * SPACING;
          dots.push({ ox: x, oy: y, x, y, vx: 0, vy: 0, glow: 0 });
        }
      }
      if (reducedMotion) draw(0);
    };

    const frame = (now: number) => {
      frameId = requestAnimationFrame(frame);
      if (!lastTime) lastTime = now;
      const dt = Math.min(0.05, Math.max(0, (now - lastTime) / 1000));
      lastTime = now;
      if (!visible || document.hidden || dt === 0) return;
      clock += dt;
      draw(dt);
    };

    const setPointer = (clientX: number, clientY: number) => {
      const bounds = canvas.getBoundingClientRect();
      pointer.x = clientX - bounds.left;
      pointer.y = clientY - bounds.top;
      pointer.inside = true;
    };
    const onMove = (e: PointerEvent) => setPointer(e.clientX, e.clientY);
    const onDown = (e: PointerEvent) => {
      setPointer(e.clientX, e.clientY);
      ripples.push({ x: pointer.x, y: pointer.y, time: 0 });
      if (ripples.length > 8) ripples.splice(0, ripples.length - 8);
      playBlip();
    };
    const onLeave = () => {
      pointer.inside = false;
      pointer.x = -9999;
      pointer.y = -9999;
    };

    layout();
    const resizeObserver = new ResizeObserver(layout);
    resizeObserver.observe(wrapper);
    const intersectionObserver = new IntersectionObserver(([entry]) => {
      visible = entry?.isIntersecting ?? true;
    });
    intersectionObserver.observe(wrapper);

    if (!reducedMotion) {
      wrapper.addEventListener("pointermove", onMove, { passive: true });
      wrapper.addEventListener("pointerdown", onDown);
      wrapper.addEventListener("pointerleave", onLeave);
      wrapper.addEventListener("pointercancel", onLeave);
      frameId = requestAnimationFrame(frame);
    }

    return () => {
      cancelAnimationFrame(frameId);
      resizeObserver.disconnect();
      intersectionObserver.disconnect();
      wrapper.removeEventListener("pointermove", onMove);
      wrapper.removeEventListener("pointerdown", onDown);
      wrapper.removeEventListener("pointerleave", onLeave);
      wrapper.removeEventListener("pointercancel", onLeave);
    };
  }, []);

  return (
    <div ref={wrapperRef} className={className} aria-hidden="true">
      <canvas ref={canvasRef} className="block h-full w-full" />
    </div>
  );
}
