"use client";

import { useEffect, useMemo, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { BufferAttribute, Group, ShaderMaterial, Vector3 } from "three";
import {
  circlePoints,
  crateredCap,
  createDotMaterial,
  makeGeometry,
  rng,
  smoothstep,
  starPoints,
  syncDotUniforms,
} from "./dots";

/* ------------------------------------------------------------------ */
/* Geometry                                                            */
/* ------------------------------------------------------------------ */

const MARS_R = 18;
const MARS_CENTER = new Vector3(0, -MARS_R, 0);
const SUN_DIR = new Vector3(-0.55, 0.75, -0.35).normalize();

/** Ground height of the Mars sphere at (x, z). */
const groundY = (x: number, z: number) => Math.sqrt(MARS_R * MARS_R - x * x - z * z) - MARS_R;

/** A cap of Mars with craters (sparser floors, brighter rims) and noisy albedo. */
const buildMars = () =>
  crateredCap({ radius: MARS_R, count: 40000, halfAngle: 0.78, craters: 30, craterSize: [0.025, 0.09], seed: 21 });

/** Dotted lander: body, top deck, nozzle, four legs with pads, solar panels, antenna. */
function buildLander() {
  const pts: number[] = [];
  const br: number[] = [];
  const add = (x: number, y: number, z: number, b = 1) => {
    pts.push(x, y, z);
    br.push(b);
  };
  const ring = (r: number, y: number, spacing: number, b = 1) => {
    const n = Math.max(8, Math.round((Math.PI * 2 * r) / spacing));
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2;
      add(Math.cos(a) * r, y, Math.sin(a) * r, b);
    }
  };
  const line = (a: Vector3, b: Vector3, spacing: number, br0 = 1) => {
    const n = Math.max(2, Math.round(a.distanceTo(b) / spacing));
    for (let i = 0; i <= n; i++) {
      const p = a.clone().lerp(b, i / n);
      add(p.x, p.y, p.z, br0);
    }
  };
  const S = 0.022;
  // Body: truncated cone
  for (let j = 0; j <= 12; j++) {
    const t = j / 12;
    ring(0.26 - 0.11 * t, t * 0.32, S, 0.75 + 0.25 * t);
  }
  // Top deck and bottom
  for (let r = 0.03; r <= 0.15; r += S) ring(r, 0.32, S, 0.9);
  for (let r = 0.05; r <= 0.26; r += S * 1.4) ring(r, 0, S * 1.3, 0.5);
  // Nozzle
  for (let j = 0; j <= 4; j++) ring(0.05 + 0.04 * (j / 4), -0.025 * j, S, 0.7);
  // Legs + pads
  for (let k = 0; k < 4; k++) {
    const a = Math.PI / 4 + (k * Math.PI) / 2;
    const c = Math.cos(a);
    const s = Math.sin(a);
    line(new Vector3(c * 0.2, 0.08, s * 0.2), new Vector3(c * 0.44, -0.2, s * 0.44), S * 0.9);
    line(new Vector3(c * 0.25, -0.0, s * 0.25), new Vector3(c * 0.4, -0.15, s * 0.4), S * 0.9, 0.6);
    for (let r = 0.015; r <= 0.06; r += S) {
      const n = Math.round((Math.PI * 2 * r) / S);
      for (let i = 0; i < n; i++) {
        const b = (i / n) * Math.PI * 2;
        add(c * 0.44 + Math.cos(b) * r, -0.2, s * 0.44 + Math.sin(b) * r, 0.9);
      }
    }
  }
  // Solar panels on both sides
  for (const side of [-1, 1]) {
    for (let x = 0.3; x <= 0.72; x += S) {
      for (let z = -0.11; z <= 0.11; z += S) add(side * x, 0.2, z, Math.abs(z) > 0.1 || x > 0.71 ? 1 : 0.55);
    }
    line(new Vector3(side * 0.2, 0.2, 0), new Vector3(side * 0.3, 0.2, 0), S);
  }
  // Antenna mast and dish
  line(new Vector3(0, 0.32, 0), new Vector3(0, 0.5, 0), S);
  ring(0.06, 0.52, S * 0.8);
  ring(0.03, 0.5, S * 0.8);

  return makeGeometry(new Float32Array(pts), 12, (i) => br[i]);
}

/* ------------------------------------------------------------------ */
/* Exhaust + dust particles                                            */
/* ------------------------------------------------------------------ */

const MAX_PARTICLES = 700;

type Particles = {
  pos: Float32Array;
  vel: Float32Array;
  age: Float32Array;
  life: Float32Array;
  dust: Uint8Array;
  next: number;
};

function makeParticles(): Particles {
  const life = new Float32Array(MAX_PARTICLES);
  const age = new Float32Array(MAX_PARTICLES).fill(1);
  life.fill(1);
  return {
    pos: new Float32Array(MAX_PARTICLES * 3),
    vel: new Float32Array(MAX_PARTICLES * 3),
    age,
    life,
    dust: new Uint8Array(MAX_PARTICLES),
    next: 0,
  };
}

/* ------------------------------------------------------------------ */
/* Scene                                                               */
/* ------------------------------------------------------------------ */

// One landing cycle, in seconds.
const DESCENT = 9;
const CYCLE = 17;
const START_HEIGHT = 5.2;

const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);

function Landing({ reducedMotion }: { reducedMotion: boolean }) {
  const size = useThree((s) => s.size);
  const dpr = useThree((s) => s.viewport.dpr);
  const viewport = useThree((s) => s.viewport);
  const lander = useRef<Group>(null);
  const pad = useRef<Group>(null);
  const intro = useRef(reducedMotion ? 1 : 0);
  const particles = useRef(makeParticles());
  const rand = useMemo(() => rng(99), []);

  const built = useMemo(() => {
    const marsMat = createDotMaterial({ sphere: true, lightMode: 1, light: SUN_DIR, night: 0.35, limb: false });
    const landerMat = createDotMaterial({});
    const flatMat = createDotMaterial({});
    const fxMat = createDotMaterial({});
    const padMat = createDotMaterial({});
    const r = rng(5);
    const fx = makeGeometry(new Float32Array(MAX_PARTICLES * 3), 9, 0);
    return {
      materials: [marsMat, landerMat, flatMat, fxMat, padMat],
      marsMat,
      landerMat,
      flatMat,
      fxMat,
      padMat,
      mars: buildMars(),
      lander: buildLander(),
      pad: makeGeometry(circlePoints(0.75, 0.06), 11, 0.5),
      fx,
      stars: makeGeometry(starPoints(600, 60, 8), () => 14 + r() * 20, () => 0.1 + r() * 0.35),
    };
  }, []);

  useEffect(
    () => () => {
      built.materials.forEach((m) => m.dispose());
      [built.mars, built.lander, built.pad, built.fx, built.stars].forEach((g) => g.dispose());
    },
    [built],
  );

  // Pull the camera back on narrow (portrait) canvases so the lander keeps its scale.
  const camera = useThree((s) => s.camera);
  useEffect(() => {
    const back = viewport.aspect < 1 ? 10 / Math.pow(Math.max(viewport.aspect, 0.5), 0.6) : 10;
    camera.position.set(0, 3.4 + (back - 10) * 0.12, back);
    camera.lookAt(0, 1.3, 0);
  }, [camera, viewport.aspect]);

  // Land in the left third on wide canvases, centered on narrow ones.
  const landingX = viewport.aspect > 1.1 ? -Math.min(viewport.width * 0.24, 3.4) : 0;
  const landingZ = 0.6;
  const ground = groundY(landingX, landingZ);

  useFrame(({ clock }, delta) => {
    const dt = Math.min(delta, 1 / 30);
    syncDotUniforms(built.materials, dpr, size.height);
    if (intro.current < 1) intro.current = Math.min(1, intro.current + dt / 2);
    const fade = 1 - Math.pow(1 - intro.current, 3);
    built.marsMat.uniforms.uOpacity.value = fade * 0.62;
    built.flatMat.uniforms.uOpacity.value = fade;

    const t = reducedMotion ? DESCENT + 2 : clock.elapsedTime % CYCLE;
    const s = Math.min(t / DESCENT, 1);
    const e = easeOut(s);
    const landed = t >= DESCENT;

    // Lander pose: decelerating descent, drifting onto the pad, leveling out.
    const height = START_HEIGHT * (1 - e);
    const drift = (1 - e) * 1.1;
    const lx = landingX + drift;
    const ly = ground + 0.2 + height;
    if (lander.current) {
      lander.current.position.set(lx, ly, landingZ);
      lander.current.rotation.set(0.25, 0.6 + (1 - e) * 0.4, -(1 - e) * 0.16);
    }
    const appear = smoothstep(0, 1.2, t);
    const vanish = 1 - smoothstep(CYCLE - 1.6, CYCLE - 0.2, t);
    built.landerMat.uniforms.uOpacity.value = fade * (reducedMotion ? 1 : appear * vanish);

    // Landing pad marker brightens on touchdown, then settles.
    const sinceTouch = t - DESCENT;
    const padGlow = landed ? 0.35 + 0.65 * Math.exp(-sinceTouch * 0.9) : 0.25 + 0.1 * Math.sin(t * 3);
    built.padMat.uniforms.uOpacity.value = fade * padGlow * (reducedMotion ? 1 : vanish);
    if (pad.current) {
      pad.current.position.set(landingX, ground + 0.005, landingZ);
      const pulse = landed && !reducedMotion ? 1 + Math.min(sinceTouch, 1.2) * 0.25 : 1;
      pad.current.scale.setScalar(pulse);
    }

    // Exhaust: stronger near the end of the descent (hover burn), cut on touchdown.
    const p = particles.current;
    const thrust = reducedMotion || landed ? 0 : (0.35 + 0.65 * s) * appear;
    const emit = Math.round(thrust * 900 * dt);
    const nozzle = new Vector3(0, -0.12, 0);
    if (lander.current) lander.current.localToWorld(nozzle);
    for (let k = 0; k < emit; k++) {
      const i = p.next;
      p.next = (p.next + 1) % MAX_PARTICLES;
      p.pos[i * 3] = nozzle.x + (rand() - 0.5) * 0.06;
      p.pos[i * 3 + 1] = nozzle.y;
      p.pos[i * 3 + 2] = nozzle.z + (rand() - 0.5) * 0.06;
      p.vel[i * 3] = (rand() - 0.5) * 0.7;
      p.vel[i * 3 + 1] = -2.4 - rand() * 1.6;
      p.vel[i * 3 + 2] = (rand() - 0.5) * 0.7;
      p.age[i] = 0;
      p.life[i] = 0.35 + rand() * 0.35;
      p.dust[i] = 0;
    }

    const posAttr = built.fx.getAttribute("position") as BufferAttribute;
    const brightAttr = built.fx.getAttribute("aBright") as BufferAttribute;
    const sizeAttr = built.fx.getAttribute("aSize") as BufferAttribute;
    for (let i = 0; i < MAX_PARTICLES; i++) {
      if (p.age[i] >= p.life[i]) {
        brightAttr.array[i] = 0;
        continue;
      }
      p.age[i] += dt;
      const ix = i * 3;
      p.pos[ix] += p.vel[ix] * dt;
      p.pos[ix + 1] += p.vel[ix + 1] * dt;
      p.pos[ix + 2] += p.vel[ix + 2] * dt;
      // Exhaust hitting the ground turns into dust blown outward.
      const g = groundY(p.pos[ix], p.pos[ix + 2]) + 0.02;
      if (!p.dust[i] && p.pos[ix + 1] < g) {
        p.dust[i] = 1;
        p.pos[ix + 1] = g;
        const dx = p.pos[ix] - lx || rand() - 0.5;
        const dz = p.pos[ix + 2] - landingZ || rand() - 0.5;
        const len = Math.hypot(dx, dz) || 1;
        const sp = 1.2 + rand() * 1.8;
        p.vel[ix] = (dx / len) * sp;
        p.vel[ix + 1] = 0.15 + rand() * 0.35;
        p.vel[ix + 2] = (dz / len) * sp;
        p.age[i] = 0;
        p.life[i] = 0.8 + rand() * 0.9;
      }
      if (p.dust[i]) {
        p.vel[ix] *= 1 - 1.6 * dt;
        p.vel[ix + 2] *= 1 - 1.6 * dt;
        p.vel[ix + 1] -= 0.4 * dt;
      }
      const k = p.age[i] / p.life[i];
      brightAttr.array[i] = (p.dust[i] ? 0.55 : 1) * (1 - k * k) * fade;
      sizeAttr.array[i] = p.dust[i] ? 13 + k * 10 : 20 - k * 9;
      posAttr.array[ix] = p.pos[ix];
      posAttr.array[ix + 1] = p.pos[ix + 1];
      posAttr.array[ix + 2] = p.pos[ix + 2];
    }
    posAttr.needsUpdate = true;
    brightAttr.needsUpdate = true;
    sizeAttr.needsUpdate = true;
  });

  return (
    <>
      <points geometry={built.stars} material={built.flatMat} />
      <points geometry={built.mars} material={built.marsMat} position={MARS_CENTER} />
      <group ref={pad}>
        <points geometry={built.pad} material={built.padMat} />
      </group>
      <group ref={lander} scale={1.15}>
        <points geometry={built.lander} material={built.landerMat} />
      </group>
      <points geometry={built.fx} material={built.fxMat} frustumCulled={false} />
    </>
  );
}

export default function MarsLandingCanvas({ active, reducedMotion }: { active: boolean; reducedMotion: boolean }) {
  return (
    <Canvas
      dpr={[1, 1.5]}
      frameloop={active ? "always" : "never"}
      camera={{ fov: 40, near: 0.1, far: 200, position: [0, 3.4, 10] }}
      gl={{ antialias: true, alpha: true, powerPreference: "low-power" }}
      onCreated={({ gl, camera }) => {
        gl.setClearColor(0x000000, 0);
        camera.lookAt(0, 1.3, 0);
      }}
      style={{ pointerEvents: "none" }}
    >
      <Landing reducedMotion={reducedMotion} />
    </Canvas>
  );
}
