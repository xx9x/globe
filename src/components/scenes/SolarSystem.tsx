"use client";

import { useEffect, useMemo, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { AdditiveBlending, CanvasTexture, Group, ShaderMaterial, Vector3 } from "three";
import {
  annulusPoints,
  circlePoints,
  createDotMaterial,
  fibonacciSphere,
  makeGeometry,
  rng,
  starPoints,
  syncDotUniforms,
} from "./dots";

type Planet = { name: string; orbit: number; size: number; period: number; phase: number; ring?: boolean; moon?: boolean };

// Distances and sizes are compressed for legibility; relative order and feel are kept.
const PLANETS: Planet[] = [
  { name: "Mercury", orbit: 1.65, size: 0.085, period: 9, phase: 0.4 },
  { name: "Venus", orbit: 2.2, size: 0.14, period: 15, phase: 2.1 },
  { name: "Earth", orbit: 2.85, size: 0.15, period: 22, phase: 4.0, moon: true },
  { name: "Mars", orbit: 3.45, size: 0.11, period: 33, phase: 5.3 },
  { name: "Jupiter", orbit: 4.9, size: 0.4, period: 70, phase: 1.2 },
  { name: "Saturn", orbit: 6.2, size: 0.33, period: 105, phase: 3.3, ring: true },
  { name: "Uranus", orbit: 7.3, size: 0.22, period: 150, phase: 0.2 },
  { name: "Neptune", orbit: 8.25, size: 0.21, period: 200, phase: 2.7 },
];

const SPEED = 0.35;
const SUN = new Vector3(0, 0, 0);

function glowTexture() {
  const c = document.createElement("canvas");
  c.width = c.height = 128;
  const ctx = c.getContext("2d")!;
  const g = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
  g.addColorStop(0, "rgba(255,255,255,0.9)");
  g.addColorStop(0.25, "rgba(255,255,255,0.25)");
  g.addColorStop(0.6, "rgba(255,255,255,0.05)");
  g.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 128, 128);
  return new CanvasTexture(c);
}

function System({ reducedMotion }: { reducedMotion: boolean }) {
  const size = useThree((s) => s.size);
  const dpr = useThree((s) => s.viewport.dpr);
  const planetGroups = useRef<(Group | null)[]>([]);
  const moon = useRef<Group>(null);
  const intro = useRef(reducedMotion ? 1 : 0);

  const built = useMemo(() => {
    const rand = rng(11);
    const materials: ShaderMaterial[] = [];
    const mat = (o: Parameters<typeof createDotMaterial>[0]) => {
      const m = createDotMaterial(o);
      materials.push(m);
      return m;
    };

    const sunMat = mat({ sphere: true, lightMode: 0 });
    const planetMat = mat({ sphere: true, lightMode: 2, light: SUN, night: 0.1 });
    const flatMat = mat({});

    const sunCount = 7000;
    const sun = makeGeometry(fibonacciSphere(sunCount, 0.72), () => 24 + rand() * 8, () => 0.75 + rand() * 0.25);

    const planets = PLANETS.map((p) => {
      const n = Math.max(240, Math.round((4 * Math.PI * p.size * p.size) / 0.00045));
      return makeGeometry(fibonacciSphere(n, p.size), 19, () => 0.8 + rand() * 0.2);
    });

    const orbits = PLANETS.map((p) => makeGeometry(circlePoints(p.orbit, 0.075), 20, 0.42));
    const belt = makeGeometry(annulusPoints(1800, 3.85, 4.3, 0.12, 5), () => 11 + rand() * 10, () => 0.2 + rand() * 0.4);
    const saturnRing = makeGeometry(annulusPoints(1600, 0.46, 0.72, 0.01, 9), 14, () => 0.3 + rand() * 0.4);
    const moonGeo = makeGeometry(fibonacciSphere(120, 0.045), 14, 0.9);
    const stars = makeGeometry(starPoints(700, 40), () => 14 + rand() * 18, () => 0.08 + rand() * 0.3);

    return { materials, sunMat, planetMat, flatMat, sun, planets, orbits, belt, saturnRing, moonGeo, stars };
  }, []);

  const glow = useMemo(() => glowTexture(), []);

  useEffect(
    () => () => {
      built.materials.forEach((m) => m.dispose());
      [built.sun, built.belt, built.saturnRing, built.moonGeo, built.stars, ...built.planets, ...built.orbits].forEach((g) =>
        g.dispose(),
      );
      glow.dispose();
    },
    [built, glow],
  );

  useFrame(({ clock }, delta) => {
    syncDotUniforms(built.materials, dpr, size.height);
    if (intro.current < 1) intro.current = Math.min(1, intro.current + delta / 2);
    const fade = 1 - Math.pow(1 - intro.current, 3);
    built.materials.forEach((m) => (m.uniforms.uOpacity.value = fade));

    const t = reducedMotion ? 0 : clock.elapsedTime * SPEED;
    PLANETS.forEach((p, i) => {
      const g = planetGroups.current[i];
      if (!g) return;
      const a = p.phase + (t * Math.PI * 2) / p.period;
      g.position.set(Math.cos(a) * p.orbit, 0, -Math.sin(a) * p.orbit);
    });
    if (moon.current) {
      const a = t * 2.4;
      moon.current.position.set(Math.cos(a) * 0.3, 0, Math.sin(a) * 0.3);
    }
  });

  return (
    <group rotation={[0, 0, 0.12]}>
      <points geometry={built.stars} material={built.flatMat} />
      <sprite scale={4.6}>
        <spriteMaterial map={glow} transparent depthWrite={false} blending={AdditiveBlending} opacity={0.5} />
      </sprite>
      <points geometry={built.sun} material={built.sunMat} />
      {built.orbits.map((g, i) => (
        <points key={PLANETS[i].name} geometry={g} material={built.flatMat} />
      ))}
      <points geometry={built.belt} material={built.flatMat} />
      {PLANETS.map((p, i) => (
        <group key={p.name} ref={(el) => void (planetGroups.current[i] = el)}>
          <points geometry={built.planets[i]} material={built.planetMat} />
          {p.ring && (
            <group rotation={[0.45, 0, 0.2]}>
              <points geometry={built.saturnRing} material={built.flatMat} />
            </group>
          )}
          {p.moon && (
            <group ref={moon}>
              <points geometry={built.moonGeo} material={built.planetMat} />
            </group>
          )}
        </group>
      ))}
    </group>
  );
}

export default function SolarSystemCanvas({ active, reducedMotion }: { active: boolean; reducedMotion: boolean }) {
  return (
    <Canvas
      dpr={[1, 1.5]}
      frameloop={active ? "always" : "never"}
      camera={{ fov: 38, near: 0.1, far: 200, position: [0, 6.0, 13.6] }}
      gl={{ antialias: true, alpha: true, powerPreference: "low-power" }}
      onCreated={({ gl, camera }) => {
        gl.setClearColor(0x000000, 0);
        camera.lookAt(0, -0.8, 0);
      }}
      style={{ pointerEvents: "none" }}
    >
      <System reducedMotion={reducedMotion} />
    </Canvas>
  );
}
