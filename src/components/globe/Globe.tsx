"use client";

import dynamic from "next/dynamic";
import { Component, useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { preload } from "react-dom";
import { ChevronLeft, ChevronRight, Minus, Plus, RotateCcw } from "lucide-react";
import { formatNumber, type GlobeLocation } from "@/lib/demo-data";
import { useInView, usePrefersReducedMotion, useWebGLSupport } from "@/lib/hooks";
import type { GlobeApi } from "./GlobeScene";
import StaticGlobe from "./StaticGlobe";
import { LAND_DOTS_URL, loadLandDots } from "@/lib/land-dots";

const importCanvas = () => import("./GlobeCanvas");
const GlobeCanvas = dynamic(importCanvas, { ssr: false });

class SceneBoundary extends Component<{ fallback: ReactNode; children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}

export type GlobeProps = {
  locations: GlobeLocation[];
  /** e.g. "users protected" or "sample events" */
  valueLabel: string;
  defaultView?: { lat: number; lon: number; distance: number };
  /** Accessible description of what the globe shows. */
  label: string;
  className?: string;
  controlsClassName?: string;
  /** Shift the globe upward by a fraction of its canvas height. */
  offsetY?: number;
};

const DEFAULT_VIEW = { lat: 24, lon: -76, distance: 1 };

export default function Globe({
  locations,
  valueLabel,
  defaultView = DEFAULT_VIEW,
  label,
  className = "relative",
  controlsClassName = "bottom-6 right-6",
  offsetY = 0,
}: GlobeProps) {
  // Start fetching the dot data with the HTML, and the 3D code as soon as we hydrate,
  // instead of waiting for the WebGL check to finish.
  preload(LAND_DOTS_URL, { as: "fetch", crossOrigin: "anonymous" });
  useEffect(() => {
    importCanvas();
    loadLandDots().catch(() => {});
  }, []);
  const webgl = useWebGLSupport();
  const reducedMotion = usePrefersReducedMotion();
  const container = useRef<HTMLDivElement>(null);
  const inView = useInView(container, "120px");
  const apiRef = useRef<GlobeApi | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [zoomEnabled, setZoomEnabled] = useState(false);

  const view = useMemo(() => defaultView, [defaultView.lat, defaultView.lon, defaultView.distance]); // eslint-disable-line react-hooks/exhaustive-deps
  const selected = locations.find((l) => l.id === selectedId) ?? null;

  const select = useCallback(
    (id: string | null) => {
      setSelectedId(id);
      const loc = locations.find((l) => l.id === id);
      if (loc) apiRef.current?.flyTo(loc.lat, loc.lon);
    },
    [locations],
  );

  const step = (dir: 1 | -1) => {
    const i = locations.findIndex((l) => l.id === selectedId);
    const next = i === -1 ? (dir === 1 ? 0 : locations.length - 1) : (i + dir + locations.length) % locations.length;
    select(locations[next].id);
  };

  const onStatus = useCallback((s: "ready" | "error") => setStatus(s), []);

  const renderTooltip = useCallback(
    (loc: GlobeLocation) => (
      <div className="rounded-xl border border-line bg-[#0c0c0c]/90 px-3.5 py-2.5 shadow-[0_10px_40px_rgba(0,0,0,0.6)] backdrop-blur-md">
        <p className="whitespace-nowrap text-[13px] font-semibold tracking-[-0.01em] text-fg">
          {loc.city}, {loc.country}
        </p>
        <p className="mt-0.5 whitespace-nowrap text-xs text-muted">
          {formatNumber(loc.value)} {valueLabel}
        </p>
        <p className="mt-1.5 text-[10px] font-medium uppercase tracking-[0.12em] text-subtle">Demo data</p>
      </div>
    ),
    [valueLabel],
  );

  const showStatic = webgl === "unsupported" || status === "error";

  return (
    <div
      ref={container}
      className={className}
      onPointerDown={() => setZoomEnabled(true)}
      onPointerLeave={() => setZoomEnabled(false)}
    >
      {/* Soft radial glow behind the Earth */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(closest-side at 50% 50%, rgba(255,255,255,0.075), rgba(255,255,255,0.025) 55%, transparent 100%)",
        }}
      />

      <div role="img" aria-label={label} className="absolute inset-0">
        {showStatic ? (
          <StaticGlobe lat0={view.lat} lon0={view.lon} />
        ) : webgl === "supported" ? (
          <SceneBoundary fallback={<StaticGlobe lat0={view.lat} lon0={view.lon} />}>
            <GlobeCanvas
              active={inView}
              locations={locations}
              selectedId={selectedId}
              onSelect={select}
              renderTooltip={renderTooltip}
              apiRef={apiRef}
              reducedMotion={reducedMotion}
              zoomEnabled={zoomEnabled}
              defaultView={view}
              onStatus={onStatus}
              offsetY={offsetY}
            />
          </SceneBoundary>
        ) : null}
      </div>

      {status === "loading" && !showStatic && (
        <div className="pointer-events-none absolute inset-0 grid place-items-center" aria-live="polite">
          <div className="flex flex-col items-center gap-4">
            <div className="size-10 animate-spin rounded-full border border-line border-t-fg/70" />
            <span className="text-xs tracking-wide text-muted">Loading globe…</span>
          </div>
        </div>
      )}

      {showStatic && (
        <p className="absolute inset-x-0 bottom-4 text-center text-xs text-subtle">
          Interactive 3D view unavailable on this device — showing a static globe.
        </p>
      )}

      {/* Screen-reader announcement for the selected location */}
      <p className="sr-only" aria-live="polite">
        {selected
          ? `${selected.city}, ${selected.country}: ${formatNumber(selected.value)} ${valueLabel}. Demonstration data.`
          : ""}
      </p>

      {!showStatic && status === "ready" && (
        <div
          className={`absolute z-40 flex items-center gap-1.5 animate-fade ${controlsClassName}`}
          role="toolbar"
          aria-label="Globe controls"
        >
          <ControlButton label="Previous location" onClick={() => step(-1)}>
            <ChevronLeft className="size-4" />
          </ControlButton>
          <ControlButton label="Next location" onClick={() => step(1)}>
            <ChevronRight className="size-4" />
          </ControlButton>
          <span className="mx-1 h-4 w-px bg-line" aria-hidden="true" />
          <ControlButton label="Zoom out" onClick={() => apiRef.current?.zoomBy(1.18)}>
            <Minus className="size-4" />
          </ControlButton>
          <ControlButton label="Zoom in" onClick={() => apiRef.current?.zoomBy(0.85)}>
            <Plus className="size-4" />
          </ControlButton>
          <ControlButton
            label="Reset view"
            onClick={() => {
              setSelectedId(null);
              apiRef.current?.reset();
            }}
          >
            <RotateCcw className="size-3.5" />
          </ControlButton>
        </div>
      )}
    </div>
  );
}

function ControlButton({ label, onClick, children }: { label: string; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className="grid size-9 place-items-center rounded-full border border-line/80 bg-[#0d0d0d]/70 text-muted backdrop-blur transition-colors duration-200 hover:border-[#444] hover:bg-hover hover:text-fg active:scale-95"
    >
      {children}
    </button>
  );
}
