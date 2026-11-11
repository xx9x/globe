"use client";

import { useEffect, useRef } from "react";

/**
 * Fallback for devices without WebGL (or if the 3D scene fails):
 * an orthographic projection of the same land-dot data drawn on a 2D canvas.
 */
export default function StaticGlobe({ lat0 = 22, lon0 = -78 }: { lat0?: number; lon0?: number }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    let cancelled = false;

    const draw = (raw: Int16Array | null) => {
      const ctx = canvas.getContext("2d");
      if (!ctx || cancelled) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const { width, height } = canvas.getBoundingClientRect();
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.scale(dpr, dpr);
      const r = Math.min(width, height) * 0.42;
      const cx = width / 2;
      const cy = height / 2;

      const body = ctx.createRadialGradient(cx - r * 0.35, cy - r * 0.4, r * 0.1, cx, cy, r);
      body.addColorStop(0, "#1a1a1a");
      body.addColorStop(1, "#090909");
      ctx.fillStyle = body;
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "rgba(255,255,255,0.08)";
      ctx.stroke();
      if (!raw) return;

      const toRad = Math.PI / 180;
      const sinP0 = Math.sin(lat0 * toRad);
      const cosP0 = Math.cos(lat0 * toRad);
      for (let i = 0; i < raw.length; i += 2) {
        const lat = (raw[i] / 100) * toRad;
        const dLon = (raw[i + 1] / 100 - lon0) * toRad;
        const cosc = sinP0 * Math.sin(lat) + cosP0 * Math.cos(lat) * Math.cos(dLon);
        if (cosc <= 0) continue;
        const x = Math.cos(lat) * Math.sin(dLon);
        const y = cosP0 * Math.sin(lat) - sinP0 * Math.cos(lat) * Math.cos(dLon);
        const light = Math.max(0, -x * 0.5 + y * 0.55 + cosc * 0.7);
        ctx.fillStyle = `rgba(255,255,255,${(0.25 + 0.65 * Math.min(light, 1)) * Math.min(1, cosc * 2.5)})`;
        ctx.beginPath();
        ctx.arc(cx + x * r, cy - y * r, 1.05, 0, Math.PI * 2);
        ctx.fill();
      }
    };

    fetch("/data/land-dots.bin")
      .then((res) => (res.ok ? res.arrayBuffer() : Promise.reject()))
      .then((buf) => draw(new Int16Array(buf)))
      .catch(() => draw(null));

    return () => {
      cancelled = true;
    };
  }, [lat0, lon0]);

  return <canvas ref={ref} className="h-full w-full" aria-hidden="true" />;
}
