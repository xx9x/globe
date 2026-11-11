"use client";

import dynamic from "next/dynamic";
import { Component, useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { useInView, usePrefersReducedMotion, useWebGLSupport } from "@/lib/hooks";

const SolarSystem = dynamic(() => import("./SolarSystem"), { ssr: false });
const MarsLanding = dynamic(() => import("./MarsLanding"), { ssr: false });
const MoonRepair = dynamic(() => import("./MoonRepair"), { ssr: false });

class Quiet extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? null : this.props.children;
  }
}

/**
 * Decorative dotted WebGL background. Loads only once the section is near the
 * viewport, pauses rendering when offscreen, and renders nothing without WebGL.
 * `fade` is a CSS mask so the scene dissolves into the page background.
 */
export function SceneBackground({
  scene,
  className = "",
  fade,
}: {
  scene: "solar-system" | "mars-landing" | "moon-repair";
  className?: string;
  fade: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const webgl = useWebGLSupport();
  const reducedMotion = usePrefersReducedMotion();
  const inView = useInView(ref, "200px");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (inView) setMounted(true);
  }, [inView]);

  const style: CSSProperties = { maskImage: fade, WebkitMaskImage: fade };
  const Scene = { "solar-system": SolarSystem, "mars-landing": MarsLanding, "moon-repair": MoonRepair }[scene];

  return (
    <div ref={ref} aria-hidden="true" className={`pointer-events-none absolute ${className}`} style={style}>
      {webgl === "supported" && mounted && (
        <Quiet>
          <Scene active={inView} reducedMotion={reducedMotion} />
        </Quiet>
      )}
    </div>
  );
}
