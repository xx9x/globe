"use client";

import { useEffect, useState, useSyncExternalStore } from "react";

const REDUCED = "(prefers-reduced-motion: reduce)";

export function usePrefersReducedMotion() {
  return useSyncExternalStore(
    (cb) => {
      const mq = window.matchMedia(REDUCED);
      mq.addEventListener("change", cb);
      return () => mq.removeEventListener("change", cb);
    },
    () => window.matchMedia(REDUCED).matches,
    () => false,
  );
}

export type WebGLStatus = "checking" | "supported" | "unsupported";

export function useWebGLSupport(): WebGLStatus {
  const [status, setStatus] = useState<WebGLStatus>("checking");
  useEffect(() => {
    let ok = false;
    try {
      const canvas = document.createElement("canvas");
      ok = !!(canvas.getContext("webgl2") || canvas.getContext("webgl"));
    } catch {
      ok = false;
    }
    setStatus(ok ? "supported" : "unsupported");
  }, []);
  return status;
}

/** True while the element is at least partly in the viewport. */
export function useInView<T extends Element>(ref: React.RefObject<T | null>, rootMargin = "0px") {
  const [inView, setInView] = useState(true);
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), { rootMargin });
    io.observe(el);
    return () => io.disconnect();
  }, [ref, rootMargin]);
  return inView;
}
