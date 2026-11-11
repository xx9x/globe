"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState, type MutableRefObject } from "react";
import { useFrame, useThree, type ThreeEvent } from "@react-three/fiber";
import { Html, OrbitControls } from "@react-three/drei";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import {
  AdditiveBlending,
  BackSide,
  BufferAttribute,
  BufferGeometry,
  Group,
  Mesh,
  MeshBasicMaterial,
  Quaternion,
  ShaderMaterial,
  Vector3,
} from "three";
import { decodeLandDots, latLonToVector3 } from "@/lib/geo";
import { loadLandDots } from "@/lib/land-dots";
import type { GlobeLocation } from "@/lib/demo-data";
import {
  atmosphereFragment,
  atmosphereVertex,
  bodyFragment,
  bodyVertex,
  dotsFragment,
  dotsVertex,
} from "./shaders";

export type GlobeApi = {
  flyTo: (lat: number, lon: number) => void;
  zoomBy: (factor: number) => void;
  reset: () => void;
};

export type GlobeSceneProps = {
  /** distance is a multiplier of the auto-fit camera distance (1 = fit to canvas). */
  locations: GlobeLocation[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  renderTooltip: (loc: GlobeLocation) => React.ReactNode;
  apiRef: MutableRefObject<GlobeApi | null>;
  reducedMotion: boolean;
  zoomEnabled: boolean;
  defaultView: { lat: number; lon: number; distance: number };
  onStatus: (status: "ready" | "error") => void;
  onInteract?: () => void;
  /** Shift the globe up (positive) as a fraction of the canvas height. */
  offsetY?: number;
};

/* ------------------------------------------------------------------ */
/* Data                                                                */
/* ------------------------------------------------------------------ */

function useLandDots(onStatus: GlobeSceneProps["onStatus"]) {
  const [buffer, setBuffer] = useState<ArrayBuffer | null>(null);
  useEffect(() => {
    let alive = true;
    loadLandDots()
      .then((b) => alive && setBuffer(b))
      .catch(() => alive && onStatus("error"));
    return () => {
      alive = false;
    };
  }, [onStatus]);
  return buffer;
}

/* ------------------------------------------------------------------ */
/* Earth                                                               */
/* ------------------------------------------------------------------ */

function Earth({ buffer, reducedMotion }: { buffer: ArrayBuffer; reducedMotion: boolean }) {
  const group = useRef<Group>(null);
  const size = useThree((s) => s.size);
  const dpr = useThree((s) => s.viewport.dpr);
  const intro = useRef(reducedMotion ? 1 : 0);

  const geometry = useMemo(() => {
    const { positions, random } = decodeLandDots(buffer, 1);
    const g = new BufferGeometry();
    g.setAttribute("position", new BufferAttribute(positions, 3));
    g.setAttribute("aRand", new BufferAttribute(random, 1));
    g.computeBoundingSphere();
    return g;
  }, [buffer]);

  const dotsMaterial = useMemo(
    () =>
      new ShaderMaterial({
        vertexShader: dotsVertex,
        fragmentShader: dotsFragment,
        transparent: true,
        depthWrite: false,
        uniforms: {
          uSize: { value: 6.2 },
          uPixelRatio: { value: 1 },
          uScale: { value: 1 },
          uOpacity: { value: 0 },
        },
      }),
    [],
  );

  const bodyMaterial = useMemo(
    () =>
      new ShaderMaterial({
        vertexShader: bodyVertex,
        fragmentShader: bodyFragment,
        transparent: true,
        depthWrite: false,
        uniforms: { uOpacity: { value: 0 } },
      }),
    [],
  );

  const atmosphereMaterial = useMemo(
    () =>
      new ShaderMaterial({
        vertexShader: atmosphereVertex,
        fragmentShader: atmosphereFragment,
        transparent: true,
        depthWrite: false,
        side: BackSide,
        blending: AdditiveBlending,
        uniforms: { uOpacity: { value: 0 } },
      }),
    [],
  );

  useEffect(
    () => () => {
      geometry.dispose();
      dotsMaterial.dispose();
      bodyMaterial.dispose();
      atmosphereMaterial.dispose();
    },
    [geometry, dotsMaterial, bodyMaterial, atmosphereMaterial],
  );

  useFrame((_, delta) => {
    // Keep dot size proportional to the canvas so the globe reads the same at any size.
    dotsMaterial.uniforms.uPixelRatio.value = dpr;
    dotsMaterial.uniforms.uScale.value = Math.min(Math.max(size.height / 820, 0.55), 1.35);

    if (intro.current < 1) intro.current = Math.min(1, intro.current + delta / 1.1);
    const t = 1 - Math.pow(1 - intro.current, 3);
    dotsMaterial.uniforms.uOpacity.value = t;
    bodyMaterial.uniforms.uOpacity.value = t;
    atmosphereMaterial.uniforms.uOpacity.value = t;
    group.current?.scale.setScalar(0.94 + 0.06 * t);
  });

  return (
    <group ref={group}>
      <mesh renderOrder={-1} scale={1.14} material={atmosphereMaterial}>
        <sphereGeometry args={[1, 64, 64]} />
      </mesh>
      <mesh renderOrder={0} material={bodyMaterial}>
        <sphereGeometry args={[0.996, 96, 96]} />
      </mesh>
      <points renderOrder={1} geometry={geometry} material={dotsMaterial} />
    </group>
  );
}

/* ------------------------------------------------------------------ */
/* Markers                                                             */
/* ------------------------------------------------------------------ */

const noRaycast = () => {};
const tmp = new Vector3();
const camDir = new Vector3();

function Marker({
  loc,
  active,
  selected,
  onHover,
  onSelect,
  reducedMotion,
  tooltip,
  phase,
}: {
  loc: GlobeLocation;
  active: boolean;
  selected: boolean;
  onHover: (id: string | null) => void;
  onSelect: (id: string) => void;
  reducedMotion: boolean;
  tooltip: React.ReactNode;
  phase: number;
}) {
  const group = useRef<Group>(null);
  const dot = useRef<Mesh>(null);
  const halo = useRef<Mesh>(null);
  const ring = useRef<Mesh>(null);
  const hit = useRef<Mesh>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const visibleRef = useRef(true);
  const camera = useThree((s) => s.camera);

  const position = useMemo(() => latLonToVector3(loc.lat, loc.lon, 1.006), [loc.lat, loc.lon]);

  useLayoutEffect(() => {
    // Orient the marker so its local +Z points away from the Earth's center.
    group.current?.lookAt(position.clone().multiplyScalar(2));
  }, [position]);

  useFrame(({ clock }) => {
    if (!group.current) return;
    group.current.getWorldPosition(tmp).normalize();
    camDir.copy(camera.position).normalize();
    const facing = tmp.dot(camDir);
    const fade = Math.min(Math.max((facing - 0.12) / 0.2, 0), 1);
    const visible = fade > 0.02;

    if (visible !== visibleRef.current) {
      visibleRef.current = visible;
      if (hit.current) hit.current.raycast = visible ? Mesh.prototype.raycast : noRaycast;
      if (!visible) onHover(null);
    }
    group.current.visible = visible;

    const emphasis = active || selected ? 1 : 0;
    const s = 1 + emphasis * 0.35;
    dot.current?.scale.setScalar(s);
    (dot.current!.material as MeshBasicMaterial).opacity = fade;
    (halo.current!.material as MeshBasicMaterial).opacity = fade * (0.1 + emphasis * 0.12);

    if (ring.current) {
      const t = reducedMotion ? 0.35 : ((clock.elapsedTime * 0.55 + phase) % 1);
      ring.current.scale.setScalar(1 + t * 2.2 * s);
      (ring.current.material as MeshBasicMaterial).opacity = fade * (1 - t) * 0.55;
    }
    if (tooltipRef.current) tooltipRef.current.style.opacity = String(fade);
  });

  const stop = (e: ThreeEvent<PointerEvent | MouseEvent>) => e.stopPropagation();

  return (
    <group ref={group} position={position}>
      <mesh
        ref={hit}
        onPointerOver={(e) => {
          stop(e);
          onHover(loc.id);
        }}
        onPointerOut={() => onHover(null)}
        onClick={(e) => {
          stop(e);
          onSelect(loc.id);
        }}
      >
        <circleGeometry args={[0.045, 16]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>
      <mesh ref={halo} position-z={0.0005}>
        <circleGeometry args={[0.019, 24]} />
        <meshBasicMaterial color="#ffffff" transparent depthWrite={false} />
      </mesh>
      <mesh ref={ring} position-z={0.001}>
        <ringGeometry args={[0.0125, 0.0155, 40]} />
        <meshBasicMaterial color="#ffffff" transparent depthWrite={false} />
      </mesh>
      <mesh ref={dot} position-z={0.0015}>
        <circleGeometry args={[0.0095, 24]} />
        <meshBasicMaterial color="#ffffff" transparent depthWrite={false} />
      </mesh>
      {(active || selected) && (
        <Html zIndexRange={[30, 20]} style={{ pointerEvents: "none" }}>
          <div ref={tooltipRef} className="-translate-x-1/2 -translate-y-[calc(100%+18px)] transition-opacity">
            {tooltip}
          </div>
        </Html>
      )}
    </group>
  );
}

/* ------------------------------------------------------------------ */
/* Camera rig: orbit controls, auto-rotation, fly-to and reset         */
/* ------------------------------------------------------------------ */

const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const HALF_FOV_TAN = Math.tan((35 / 2) * (Math.PI / 180));

/**
 * Camera distance at which the globe's diameter fills `k` of the canvas's
 * shorter side. Keeps proportions consistent from phones to wide desktops.
 */
function fitDistance(aspect: number, k = 0.8) {
  const t = HALF_FOV_TAN * Math.min(1, aspect);
  return Math.sqrt(1 + 1 / (k * t) ** 2);
}

function CameraRig({
  apiRef,
  defaultView,
  reducedMotion,
  zoomEnabled,
  paused,
  onInteract,
  offsetY = 0,
}: Pick<GlobeSceneProps, "apiRef" | "defaultView" | "reducedMotion" | "zoomEnabled" | "onInteract" | "offsetY"> & {
  paused: boolean;
}) {
  const controls = useRef<OrbitControlsImpl>(null);
  const camera = useThree((s) => s.camera);
  const clock = useThree((s) => s.clock);
  const size = useThree((s) => s.size);
  const aspect = size.width / Math.max(1, size.height);
  const fit = fitDistance(aspect);
  const minDistance = Math.max(1.35, fit * 0.55);
  const maxDistance = fit * 1.6;
  const interacting = useRef(false);
  const idleUntil = useRef(0);
  const anim = useRef<{
    from: Vector3;
    q: Quaternion;
    fromDist: number;
    toDist: number;
    t: number;
    duration: number;
  } | null>(null);

  useEffect(() => {
    const go = (dir: Vector3, dist: number) => {
      const d = Math.min(Math.max(dist, minDistance), maxDistance);
      const from = camera.position.clone().normalize();
      const to = dir.clone().normalize();
      if (reducedMotion) {
        camera.position.copy(to.multiplyScalar(d));
        camera.lookAt(0, 0, 0);
        controls.current?.update();
        return;
      }
      anim.current = {
        from,
        q: new Quaternion().setFromUnitVectors(from, to),
        fromDist: camera.position.length(),
        toDist: d,
        t: 0,
        duration: 1.4,
      };
    };
    const viewDir = (lat: number, lon: number) => latLonToVector3(lat, lon, 1);
    apiRef.current = {
      flyTo: (lat, lon) => go(viewDir(Math.max(Math.min(lat, 60), -60), lon), camera.position.length()),
      zoomBy: (factor) => go(camera.position.clone(), camera.position.length() * factor),
      reset: () => go(viewDir(defaultView.lat, defaultView.lon), fit * defaultView.distance),
    };
    return () => {
      apiRef.current = null;
    };
  }, [apiRef, camera, defaultView, reducedMotion, fit, minDistance, maxDistance]);

  useLayoutEffect(() => {
    const cam = camera as import("three").PerspectiveCamera;
    if (offsetY) cam.setViewOffset(size.width, size.height, 0, offsetY * size.height, size.width, size.height);
    else cam.clearViewOffset();
    cam.updateProjectionMatrix();
  }, [camera, size.width, size.height, offsetY]);

  // Re-fit the camera whenever the canvas changes shape (keeps the view direction).
  useLayoutEffect(() => {
    anim.current = null;
    camera.position.setLength(fit * defaultView.distance);
    camera.lookAt(0, 0, 0);
    controls.current?.update();
  }, [camera, fit, defaultView.distance]);

  useFrame((state, delta) => {
    const a = anim.current;
    if (a) {
      a.t = Math.min(1, a.t + delta / a.duration);
      const e = ease(a.t);
      const q = new Quaternion().slerp(a.q, e);
      const dir = a.from.clone().applyQuaternion(q);
      camera.position.copy(dir.multiplyScalar(a.fromDist + (a.toDist - a.fromDist) * e));
      camera.lookAt(0, 0, 0);
      if (a.t >= 1) {
        anim.current = null;
        idleUntil.current = state.clock.elapsedTime + 1.5;
      }
    }
    if (controls.current) {
      controls.current.autoRotate =
        !reducedMotion &&
        !paused &&
        !interacting.current &&
        !anim.current &&
        state.clock.elapsedTime > idleUntil.current;
    }
  });

  return (
    <OrbitControls
      ref={controls}
      makeDefault
      enablePan={false}
      enableZoom={zoomEnabled}
      enableDamping
      dampingFactor={0.065}
      rotateSpeed={0.45}
      zoomSpeed={0.55}
      autoRotateSpeed={0.32}
      minDistance={minDistance}
      maxDistance={maxDistance}
      minPolarAngle={0.35}
      maxPolarAngle={Math.PI - 0.35}
      onStart={() => {
        interacting.current = true;
        anim.current = null;
        onInteract?.();
      }}
      onEnd={() => {
        interacting.current = false;
        // Resume the idle rotation a moment after the user lets go.
        idleUntil.current = clock.elapsedTime + 2.5;
      }}
    />
  );
}

/* ------------------------------------------------------------------ */
/* Scene                                                               */
/* ------------------------------------------------------------------ */

export default function GlobeScene(props: GlobeSceneProps) {
  const { locations, selectedId, onSelect, renderTooltip, reducedMotion, onStatus } = props;
  const buffer = useLandDots(onStatus);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const gl = useThree((s) => s.gl);

  useEffect(() => {
    if (buffer) onStatus("ready");
  }, [buffer, onStatus]);

  useEffect(() => {
    gl.domElement.style.cursor = hoveredId ? "pointer" : "grab";
  }, [gl, hoveredId]);

  return (
    <>
      <CameraRig
        apiRef={props.apiRef}
        defaultView={props.defaultView}
        reducedMotion={reducedMotion}
        zoomEnabled={props.zoomEnabled}
        paused={selectedId !== null || hoveredId !== null}
        onInteract={props.onInteract}
        offsetY={props.offsetY}
      />
      {buffer && (
        <group>
          <Earth buffer={buffer} reducedMotion={reducedMotion} />
          {locations.map((loc, i) => (
            <Marker
              key={loc.id}
              loc={loc}
              phase={(i * 0.37) % 1}
              active={hoveredId === loc.id}
              selected={selectedId === loc.id}
              onHover={setHoveredId}
              onSelect={(id) => onSelect(id === selectedId ? null : id)}
              reducedMotion={reducedMotion}
              tooltip={renderTooltip(loc)}
            />
          ))}
        </group>
      )}
    </>
  );
}
