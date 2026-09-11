import { useEffect, useRef } from "react";

/** A canvas adaptation of ThreeUI's Predictive Arc background. */
export default function PredictiveArc() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const context = canvas.getContext("2d", { alpha: false });
    if (!context) return;

    let frameId = 0;
    let width = 1;
    let height = 1;
    let time = 0;
    let lastFrameTime = 0;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const frameInterval = 1000 / 30;

    const resize = () => {
      const bounds = canvas.getBoundingClientRect();
      width = Math.max(1, bounds.width);
      height = Math.max(1, bounds.height);
      // This is intentionally a pixel effect, so a 1x canvas is both faithful
      // to the aesthetic and much cheaper on high-density displays.
      const pixelRatio = 1;
      canvas.width = Math.round(width * pixelRatio);
      canvas.height = Math.round(height * pixelRatio);
      context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    };

    const draw = () => {
      context.fillStyle = "#050508";
      context.fillRect(0, 0, width, height);
      time += 0.015;

      const centerX = width / 2;
      const archPeakY = height * 0.28;
      const archWidth = width * 1.5;
      const archHeight = height * 0.7;
      const spacing = width < 640 ? 9 : 8;

      context.globalCompositeOperation = "lighter";
      for (let x = 0; x < width; x += spacing) {
        const normalizedX = (x - centerX) / (archWidth / 2);
        const curveY = archPeakY + normalizedX ** 2 * archHeight;

        for (let y = 0; y < height; y += spacing) {
          const thickness = 140 + (1 - Math.abs(normalizedX)) * 80;
          const distance = Math.abs(y - curveY);
          if (distance >= thickness) continue;

          let intensity = 1 - distance / thickness;
          intensity =
            intensity * 0.7 +
            Math.sin(x * 0.015 + time) *
              Math.cos(y * 0.02 + time) *
              0.3 *
              intensity;
          intensity *= Math.max(0, 1 - Math.abs(normalizedX) ** 2.5);
          if (intensity <= 0.035) continue;

          let red = 60 * intensity + 100 * intensity ** 3;
          let green = 20 * intensity + 60 * intensity ** 4;
          let blue = 120 * intensity + 135 * intensity ** 2;
          if (intensity > 0.7) {
            const boost = (intensity - 0.7) * 3.3;
            red += 150 * boost;
            green += 150 * boost;
            blue += 150 * boost;
          }

          context.fillStyle = `rgb(${Math.min(255, red)}, ${Math.min(255, green)}, ${Math.min(255, blue)})`;
          const dotSize = 5 * intensity;
          context.fillRect(x, y, dotSize, dotSize);
        }
      }
      context.globalCompositeOperation = "source-over";
    };

    const scheduleFrame = () => {
      if (!reducedMotion.matches && !document.hidden) {
        frameId = requestAnimationFrame(renderFrame);
      }
    };

    const renderFrame = (now: number) => {
      if (now - lastFrameTime >= frameInterval) {
        draw();
        lastFrameTime = now;
      }
      scheduleFrame();
    };

    const observer = new ResizeObserver(resize);
    observer.observe(canvas);
    resize();
    draw();
    scheduleFrame();

    const handleMotionPreference = () => {
      cancelAnimationFrame(frameId);
      draw();
      lastFrameTime = 0;
      scheduleFrame();
    };

    const handleVisibilityChange = () => {
      cancelAnimationFrame(frameId);
      lastFrameTime = 0;
      if (!document.hidden) {
        draw();
        scheduleFrame();
      }
    };

    reducedMotion.addEventListener("change", handleMotionPreference);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      cancelAnimationFrame(frameId);
      observer.disconnect();
      reducedMotion.removeEventListener("change", handleMotionPreference);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      tabIndex={-1}
      className="fixed inset-0 z-0 h-full w-full"
    />
  );
}
