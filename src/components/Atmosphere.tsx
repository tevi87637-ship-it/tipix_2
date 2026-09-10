import { useEffect, useRef, useState } from "react";
import "./Atmosphere.css";

/** Lightweight depth field; independent of WebGL, with no student data. */
export default function Atmosphere() {
  const canvas = useRef<HTMLCanvasElement>(null);
  const [paused, setPaused] = useState(false);
  useEffect(() => {
    const el = canvas.current;
    const ctx = el?.getContext("2d");
    if (!el || !ctx) return;
    const preference = matchMedia("(prefers-reduced-motion: reduce)");
    let frame = 0,
      width = 1,
      height = 1,
      clock = 0,
      previous = 0;
    let pointerX = 0,
      pointerY = 0,
      smoothX = 0,
      smoothY = 0;
    const dots = Array.from({ length: 72 }, (_, i) => ({
      x: (i * 0.61803398875) % 1,
      y: (((Math.sin(i * 127.1 + 311.7) * 43758.5453) % 1) + 1) % 1,
      depth: 0.25 + ((i * 0.173) % 0.75),
      phase: i * 2.39996,
    }));
    const resize = () => {
      width = el.clientWidth;
      height = el.clientHeight;
      const dpr = Math.min(devicePixelRatio || 1, 1.5);
      el.width = width * dpr;
      el.height = height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    const draw = (now: number) => {
      const moving = !paused && !preference.matches && !document.hidden;
      if (moving && previous) clock += Math.min(now - previous, 40) / 1000;
      previous = now;
      smoothX += ((moving ? pointerX : 0) - smoothX) * 0.035;
      smoothY += ((moving ? pointerY : 0) - smoothY) * 0.035;
      ctx.clearRect(0, 0, width, height);
      dots.slice(0, width < 600 ? 38 : 72).forEach((dot) => {
        const x =
          dot.x * width +
          Math.sin(clock * 0.12 + dot.phase) * 16 +
          smoothX * dot.depth;
        const y =
          ((((dot.y * height - clock * (3 + dot.depth * 6)) % height) +
            height) %
            height) +
          smoothY * dot.depth;
        const alpha =
          0.25 + 0.35 * (0.5 + 0.5 * Math.sin(clock * 0.6 + dot.phase));
        ctx.fillStyle = `rgba(183,201,255,${alpha})`;
        ctx.shadowColor = "#819eff";
        ctx.shadowBlur = 8 * dot.depth;
        ctx.beginPath();
        ctx.arc(x, y, 0.7 + dot.depth * 1.4, 0, Math.PI * 2);
        ctx.fill();
      });
      if (moving) frame = requestAnimationFrame(draw);
    };
    const restart = () => {
      cancelAnimationFrame(frame);
      previous = 0;
      frame = requestAnimationFrame(draw);
    };
    const move = (event: PointerEvent) => {
      if (event.pointerType !== "mouse") return;
      pointerX = (event.clientX / innerWidth - 0.5) * 30;
      pointerY = (event.clientY / innerHeight - 0.5) * 20;
    };
    const observer = new ResizeObserver(() => {
      resize();
      restart();
    });
    observer.observe(el);
    window.addEventListener("pointermove", move, { passive: true });
    document.addEventListener("visibilitychange", restart);
    preference.addEventListener("change", restart);
    resize();
    restart();
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener("pointermove", move);
      document.removeEventListener("visibilitychange", restart);
      preference.removeEventListener("change", restart);
    };
  }, [paused]);
  return (
    <>
      <div
        className={`t-atmosphere ${paused ? "is-paused" : ""}`}
        aria-hidden="true"
      >
        <div className="t-light-beam" />
        <div className="t-light-haze" />
        <canvas ref={canvas} />
        <div className="t-circuit t-circuit-left" />
        <div className="t-circuit t-circuit-right" />
      </div>
      <button
        className="t-motion-control"
        type="button"
        aria-pressed={paused}
        onClick={() => setPaused(!paused)}
      >
        {paused ? "Resume ambience" : "Pause ambience"}
      </button>
    </>
  );
}
