"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { BufferAttribute, BufferGeometry, Group, Object3D, Vector3 } from "three";
import { decodeLandDots } from "@/lib/geo";
import {
  DotBuilder,
  crateredCap,
  createDotMaterial,
  fibonacciSphere,
  makeGeometry,
  rng,
  smoothstep,
  starPoints,
  syncDotUniforms,
} from "./dots";

/* ------------------------------------------------------------------ */
/* World layout                                                        */
/* ------------------------------------------------------------------ */

const MOON_R = 14;
const MOON_CENTER = new Vector3(0, -MOON_R, 0);
const SUN_DIR = new Vector3(0.6, 0.65, 0.45).normalize();
const groundY = (x: number, z: number) => Math.sqrt(MOON_R * MOON_R - x * x - z * z) - MOON_R;

const ROCKET = new Vector3(1.35, 0, -0.4);
ROCKET.y = groundY(ROCKET.x, ROCKET.z);
/** Direction from the rocket's axis to the open service panel (toward the viewer's left). */
const PANEL_DIR = new Vector3(-0.93, 0, 0.36).normalize();
const PANEL_ANGLE = Math.atan2(PANEL_DIR.z, PANEL_DIR.x);
const BODY_R = 0.38;
const PANEL_Y = [1.05, 1.55] as const;
const PANEL_HALF = 0.46; // half-width of the opening, radians

/** Where the astronaut stands: out from the panel and a little toward the viewer. */
const TOWARD_VIEWER = new Vector3(PANEL_DIR.z, 0, -PANEL_DIR.x).multiplyScalar(-1);
const WORK_POS = ROCKET.clone().addScaledVector(PANEL_DIR, BODY_R + 0.42).addScaledVector(TOWARD_VIEWER, 0.42);
const PANEL_CENTER = ROCKET.clone().addScaledVector(PANEL_DIR, BODY_R);
const WORK_HEADING = Math.atan2(PANEL_CENTER.x - WORK_POS.x, PANEL_CENTER.z - WORK_POS.z);
const START_POS = WORK_POS.clone().add(new Vector3(-3.6, 0, 1.4));
const S = 0.019; // dot spacing for models

/* ------------------------------------------------------------------ */
/* Models                                                              */
/* ------------------------------------------------------------------ */

function buildRocket() {
  const d = new DotBuilder();
  const inPanel = (a: number, y: number) => {
    let da = Math.atan2(Math.sin(a - PANEL_ANGLE), Math.cos(a - PANEL_ANGLE));
    da = Math.abs(da);
    return da < PANEL_HALF && y > PANEL_Y[0] && y < PANEL_Y[1];
  };
  // Hull with a rectangular service opening
  for (let y = 0.35; y <= 2.6; y += S * 1.1) {
    const n = Math.round((Math.PI * 2 * BODY_R) / S);
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2;
      if (inPanel(a, y)) continue;
      const edge = Math.abs(Math.atan2(Math.sin(a - PANEL_ANGLE), Math.cos(a - PANEL_ANGLE))) < PANEL_HALF + 0.05 &&
        y > PANEL_Y[0] - 0.03 && y < PANEL_Y[1] + 0.03;
      const seam = Math.abs(y - 1.6) < 0.012 || Math.abs(y - 0.6) < 0.012;
      d.add(Math.cos(a) * BODY_R, y, Math.sin(a) * BODY_R, edge || seam ? 1 : 0.72);
    }
  }
  // Nose cone
  for (let y = 2.6; y <= 3.45; y += S) {
    const t = (y - 2.6) / 0.85;
    const r = BODY_R * Math.sqrt(Math.max(0, 1 - t * t * 0.98));
    d.ring(r, y, S, 0.8);
  }
  // Porthole facing the panel side
  for (let k = 0; k < 2; k++) {
    const r = 0.09 - k * 0.04;
    const n = Math.round((Math.PI * 2 * r) / (S * 0.8));
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2;
      const t = new Vector3(-PANEL_DIR.z, 0, PANEL_DIR.x);
      const p = PANEL_DIR.clone()
        .multiplyScalar(BODY_R + 0.01)
        .addScaledVector(t, Math.cos(a) * r)
        .add(new Vector3(0, 2.15 + Math.sin(a) * r, 0));
      d.add(p.x, p.y, p.z, 1);
    }
  }
  // Engine bell
  for (let y = 0.1; y <= 0.35; y += S) d.ring(0.24 - ((y - 0.1) / 0.25) * 0.1, y, S, 0.6);
  // Fins and legs
  for (let k = 0; k < 4; k++) {
    const a = PANEL_ANGLE + Math.PI / 4 + (k * Math.PI) / 2;
    const c = Math.cos(a);
    const s = Math.sin(a);
    for (let y = 0.4; y <= 1.0; y += S) {
      const out = BODY_R + (1 - (y - 0.4) / 0.6) * 0.26;
      for (let r = BODY_R; r <= out; r += S) d.add(c * r, y, s * r, y < 0.42 || r > out - S ? 1 : 0.55);
    }
    d.line(new Vector3(c * BODY_R, 0.55, s * BODY_R), new Vector3(c * 0.82, 0.02, s * 0.82), S);
    d.ring(0.06, 0.02, S, 0.9, c * 0.82, s * 0.82);
  }
  // Wiring visible inside the opening
  const tangent = new Vector3(-PANEL_DIR.z, 0, PANEL_DIR.x);
  for (let w = 0; w < 6; w++) {
    const off = -0.13 + w * 0.052;
    const base = PANEL_DIR.clone().multiplyScalar(BODY_R - 0.07).addScaledVector(tangent, off);
    d.line(base.clone().setY(PANEL_Y[0] + 0.03), base.clone().setY(PANEL_Y[1] - 0.03).addScaledVector(tangent, 0.03), S * 0.8, 0.85);
  }
  return d.geometry(10);
}

/** The service door, modeled flat; it's hinged open in the scene. */
function buildDoor() {
  const d = new DotBuilder();
  const width = 2 * PANEL_HALF * BODY_R;
  for (let u = 0; u <= width; u += S)
    for (let v = 0; v <= PANEL_Y[1] - PANEL_Y[0]; v += S) {
      const edge = u < S || u > width - S || v < S || v > PANEL_Y[1] - PANEL_Y[0] - S;
      d.add(u, v, 0, edge ? 1 : 0.65);
    }
  return d.geometry(10);
}

type Rig = {
  core: BufferGeometry;
  upperArm: BufferGeometry;
  forearm: BufferGeometry;
  thigh: BufferGeometry;
  shin: BufferGeometry;
  tool: BufferGeometry;
};

/** Astronaut parts, each modeled hanging from its joint at the origin (-Y). */
function buildAstronaut(): Rig {
  const core = new DotBuilder();
  core.ellipsoid(new Vector3(0, 0.62, 0), 0.17, 0.21, 0.13, S, 0.85);
  core.box(new Vector3(0, 0.66, -0.17), 0.26, 0.32, 0.1, S, 0.7);
  // Chest control box
  core.box(new Vector3(0, 0.62, 0.14), 0.12, 0.07, 0.03, S * 0.8, 1);
  // Helmet with a darker visor facing +Z and a bright rim
  core.ellipsoid(new Vector3(0, 0.93, 0.01), 0.135, 0.135, 0.135, S * 0.9, (n) => {
    const visor = n.z > 0.35 && n.y > -0.45 && n.y < 0.55;
    const rim = n.z > 0.25 && n.z < 0.42 && n.y > -0.5 && n.y < 0.6;
    if (rim) return 1;
    if (visor) return n.y > 0.25 && n.x < -0.1 ? 0.9 : 0.22; // a glint
    return 0.95;
  });
  core.ring(0.1, 0.8, S, 0.8);

  const limb = (len: number, r0: number, r1: number) => {
    const b = new DotBuilder();
    for (let y = 0; y <= len; y += S) b.ring(r0 + ((r1 - r0) * y) / len, -y, S, 0.8);
    return b;
  };
  const upperArm = limb(0.2, 0.05, 0.045);
  const forearm = limb(0.19, 0.045, 0.04);
  forearm.ellipsoid(new Vector3(0, -0.22, 0.01), 0.05, 0.045, 0.05, S, 1);
  const thigh = limb(0.22, 0.07, 0.06);
  const shin = limb(0.19, 0.06, 0.055);
  shin.box(new Vector3(0, -0.22, 0.03), 0.11, 0.07, 0.17, S, 1);
  const tool = new DotBuilder();
  tool.line(new Vector3(0, -0.22, 0.02), new Vector3(0, -0.24, 0.2), S * 0.7, 1);
  tool.ring(0.018, -0.24, S * 0.5, 1, 0, 0.2);

  return {
    core: core.geometry(9),
    upperArm: upperArm.geometry(9),
    forearm: forearm.geometry(9),
    thigh: thigh.geometry(9),
    shin: shin.geometry(9),
    tool: tool.geometry(9),
  };
}

/* ------------------------------------------------------------------ */
/* Earth in the sky (same land-dot data as the hero globe)             */
/* ------------------------------------------------------------------ */

function useEarthGeometry() {
  const [geo, setGeo] = useState<BufferGeometry | null>(null);
  useEffect(() => {
    let alive = true;
    fetch("/data/land-dots.bin")
      .then((r) => (r.ok ? r.arrayBuffer() : Promise.reject()))
      .then((buf) => {
        if (!alive) return;
        const { positions } = decodeLandDots(buf, 1);
        // Thin the land dots for the small size; add a sparse, dim ocean.
        const land: number[] = [];
        for (let i = 0; i < positions.length; i += 9) land.push(positions[i], positions[i + 1], positions[i + 2]);
        const ocean = fibonacciSphere(1400, 1);
        const all = new Float32Array(land.length + ocean.length);
        all.set(land);
        all.set(ocean, land.length);
        const landCount = land.length / 3;
        setGeo(makeGeometry(all, 16, (i) => (i < landCount ? 1 : 0.14)));
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);
  return geo;
}

/* ------------------------------------------------------------------ */
/* Scene                                                               */
/* ------------------------------------------------------------------ */

const CYCLE = 24;
const WALK_END = 7.5;
const MAX_SPARKS = 260;
const MAX_PRINTS = 40;

function Repair({ reducedMotion }: { reducedMotion: boolean }) {
  const size = useThree((s) => s.size);
  const dpr = useThree((s) => s.viewport.dpr);
  const camera = useThree((s) => s.camera);
  const aspect = size.width / Math.max(1, size.height);

  const astro = useRef<Group>(null);
  const body = useRef<Group>(null);
  const shoulders = useRef<(Group | null)[]>([]);
  const elbows = useRef<(Group | null)[]>([]);
  const hips = useRef<(Group | null)[]>([]);
  const knees = useRef<(Group | null)[]>([]);
  const toolTip = useRef<Object3D>(null);
  const door = useRef<Group>(null);
  const earth = useRef<Group>(null);
  const intro = useRef(reducedMotion ? 1 : 0);
  const rand = useMemo(() => rng(42), []);
  const sparks = useRef({
    pos: new Float32Array(MAX_SPARKS * 3),
    vel: new Float32Array(MAX_SPARKS * 3),
    age: new Float32Array(MAX_SPARKS).fill(1),
    life: new Float32Array(MAX_SPARKS).fill(1),
    next: 0,
  });
  const prints = useRef({ count: 0, lastPhase: 0 });
  const earthGeo = useEarthGeometry();

  const built = useMemo(() => {
    const r = rng(8);
    const moonMat = createDotMaterial({ sphere: true, lightMode: 1, light: SUN_DIR, night: 0.4, limb: false });
    const modelMat = createDotMaterial({});
    const astroMat = createDotMaterial({});
    const fxMat = createDotMaterial({});
    const printMat = createDotMaterial({});
    const earthMat = createDotMaterial({ sphere: true, lightMode: 1, light: SUN_DIR, night: 0.08 });
    const starMat = createDotMaterial({});
    return {
      materials: [moonMat, modelMat, astroMat, fxMat, printMat, earthMat, starMat],
      moonMat,
      modelMat,
      astroMat,
      fxMat,
      printMat,
      earthMat,
      starMat,
      moon: crateredCap({
        radius: MOON_R,
        count: 34000,
        halfAngle: 0.85,
        craters: 42,
        craterSize: [0.02, 0.08],
        seed: 77,
        albedo: [0.5, 0.22],
      }),
      rocket: buildRocket(),
      door: buildDoor(),
      rig: buildAstronaut(),
      sparks: makeGeometry(new Float32Array(MAX_SPARKS * 3), 17, 0),
      prints: makeGeometry(new Float32Array(MAX_PRINTS * 6 * 3), 9, 0),
      stars: makeGeometry(starPoints(650, 60, 13), () => 14 + r() * 20, () => 0.1 + r() * 0.35),
    };
  }, []);

  useEffect(
    () => () => {
      built.materials.forEach((m) => m.dispose());
      [built.moon, built.rocket, built.door, built.sparks, built.prints, built.stars, ...Object.values(built.rig)].forEach((g) =>
        g.dispose(),
      );
    },
    [built],
  );
  useEffect(() => () => earthGeo?.dispose(), [earthGeo]);

  // Frame the scene; pull back on portrait canvases so nothing is cropped.
  useEffect(() => {
    const back = aspect < 1.1 ? 9.2 / Math.pow(Math.max(aspect, 0.5), 0.6) : 9.2;
    camera.position.set(-0.9, 2.1 + (back - 9.2) * 0.08, back);
    camera.lookAt(0.3, 1.05, 0);
  }, [camera, aspect]);

  const setPose = (p: {
    shoulder: [number, number, number, number];
    elbow: [number, number];
    hip: [number, number];
    knee: [number, number];
  }) => {
    shoulders.current[0]?.rotation.set(p.shoulder[0], 0, p.shoulder[1]);
    shoulders.current[1]?.rotation.set(p.shoulder[2], 0, p.shoulder[3]);
    elbows.current[0]?.rotation.set(p.elbow[0], 0, 0);
    elbows.current[1]?.rotation.set(p.elbow[1], 0, 0);
    hips.current[0]?.rotation.set(p.hip[0], 0, 0);
    hips.current[1]?.rotation.set(p.hip[1], 0, 0);
    knees.current[0]?.rotation.set(p.knee[0], 0, 0);
    knees.current[1]?.rotation.set(p.knee[1], 0, 0);
  };

  const tmp = useMemo(() => new Vector3(), []);
  const foot = useMemo(() => new Vector3(), []);

  useFrame(({ clock }, delta) => {
    const dt = Math.min(delta, 1 / 30);
    syncDotUniforms(built.materials, dpr, size.height);
    if (intro.current < 1) intro.current = Math.min(1, intro.current + dt / 2);
    const fade = 1 - Math.pow(1 - intro.current, 3);
    built.moonMat.uniforms.uOpacity.value = fade * 0.62;
    built.modelMat.uniforms.uOpacity.value = fade;
    built.starMat.uniforms.uOpacity.value = fade;
    built.earthMat.uniforms.uOpacity.value = fade;

    const t = reducedMotion ? WALK_END + 3 : clock.elapsedTime % CYCLE;
    const vanish = reducedMotion ? 1 : smoothstep(0, 1, t) * (1 - smoothstep(CYCLE - 1.4, CYCLE - 0.1, t));
    built.astroMat.uniforms.uOpacity.value = fade * vanish;
    built.printMat.uniforms.uOpacity.value = fade * vanish * 0.6;

    if (earth.current && !reducedMotion) earth.current.rotation.y += dt * 0.05;

    // The service door stays swung open on its hinge.
    if (door.current) door.current.rotation.y = -1.9;

    const a = astro.current;
    if (!a) return;
    const walking = t < WALK_END;

    if (walking) {
      // Lunar gait: long, bouncy strides with both feet briefly off the ground.
      const s = smoothstep(0, WALK_END, t) * 0.92 + (t / WALK_END) * 0.08;
      const pos = tmp.copy(START_POS).lerp(WORK_POS, Math.min(1, s));
      const phase = t * 4.2;
      const hop = Math.abs(Math.sin(phase)) * 0.09;
      a.position.set(pos.x, groundY(pos.x, pos.z) + hop, pos.z);
      a.rotation.set(0, Math.atan2(WORK_POS.x - START_POS.x, WORK_POS.z - START_POS.z), 0);
      const swing = Math.sin(phase) * 0.55;
      setPose({
        shoulder: [-swing * 0.6, 0.12, swing * 0.6, -0.12],
        elbow: [-0.35, -0.35],
        hip: [swing, -swing],
        knee: [Math.max(0, -swing) * 0.7 + 0.1, Math.max(0, swing) * 0.7 + 0.1],
      });
      if (body.current) body.current.rotation.x = 0.08;

      // Leave a footprint at each footfall.
      const step = Math.floor(phase / Math.PI);
      if (step !== prints.current.lastPhase && prints.current.count < MAX_PRINTS) {
        prints.current.lastPhase = step;
        const side = step % 2 === 0 ? 1 : -1;
        const right = new Vector3(Math.cos(a.rotation.y), 0, -Math.sin(a.rotation.y));
        foot.copy(pos).addScaledVector(right, side * 0.09);
        const arr = (built.prints.getAttribute("position") as BufferAttribute).array as Float32Array;
        const br = (built.prints.getAttribute("aBright") as BufferAttribute).array as Float32Array;
        const fwd = new Vector3(Math.sin(a.rotation.y), 0, Math.cos(a.rotation.y));
        for (let k = 0; k < 6; k++) {
          const i = (prints.current.count * 6 + k) * 3;
          const along = (k % 3) * 0.05 - 0.05;
          const across = (k < 3 ? -1 : 1) * 0.025;
          const x = foot.x + fwd.x * along + right.x * across;
          const z = foot.z + fwd.z * along + right.z * across;
          arr[i] = x;
          arr[i + 1] = groundY(x, z) + 0.004;
          arr[i + 2] = z;
          br[i / 3] = 0.8;
        }
        prints.current.count++;
        built.prints.getAttribute("position").needsUpdate = true;
        built.prints.getAttribute("aBright").needsUpdate = true;
      }
    } else {
      // Repair: facing the open panel, right hand working the tool.
      a.position.set(WORK_POS.x, groundY(WORK_POS.x, WORK_POS.z), WORK_POS.z);
      a.rotation.set(0, WORK_HEADING, 0);
      const work = reducedMotion ? 0 : Math.sin(t * 7);
      const sway = reducedMotion ? 0 : Math.sin(t * 0.9) * 0.03;
      if (body.current) body.current.rotation.x = 0.22 + sway;
      setPose({
        shoulder: [-1.75 + work * 0.08, 0.15, -1.2, -0.3],
        elbow: [-0.55 + work * 0.25, -0.75],
        hip: [-0.18, 0.12],
        knee: [0.3, 0.15],
      });

      // Sparks from the tool tip on each stroke.
      const sp = sparks.current;
      if (!reducedMotion && toolTip.current && work > 0.8 && rand() < 0.8) {
        toolTip.current.getWorldPosition(tmp);
        for (let k = 0; k < 6; k++) {
          const i = sp.next;
          sp.next = (sp.next + 1) % MAX_SPARKS;
          sp.pos.set([tmp.x, tmp.y, tmp.z], i * 3);
          sp.vel.set([PANEL_DIR.x * 0.8 + (rand() - 0.5) * 1.6, rand() * 1.4, PANEL_DIR.z * 0.8 + (rand() - 0.5) * 1.6], i * 3);
          sp.age[i] = 0;
          sp.life[i] = 0.6 + rand() * 0.9;
        }
      }
    }

    // Reset footprints at the start of each cycle.
    if (t < 0.1 && prints.current.count > 0) {
      prints.current.count = 0;
      prints.current.lastPhase = 0;
      ((built.prints.getAttribute("aBright") as BufferAttribute).array as Float32Array).fill(0);
      built.prints.getAttribute("aBright").needsUpdate = true;
    }

    // Integrate sparks under lunar gravity.
    const sp = sparks.current;
    const pos = (built.sparks.getAttribute("position") as BufferAttribute).array as Float32Array;
    const br = (built.sparks.getAttribute("aBright") as BufferAttribute).array as Float32Array;
    for (let i = 0; i < MAX_SPARKS; i++) {
      if (sp.age[i] >= sp.life[i]) {
        br[i] = 0;
        continue;
      }
      sp.age[i] += dt;
      const ix = i * 3;
      sp.vel[ix + 1] -= 1.62 * dt;
      sp.pos[ix] += sp.vel[ix] * dt;
      sp.pos[ix + 1] += sp.vel[ix + 1] * dt;
      sp.pos[ix + 2] += sp.vel[ix + 2] * dt;
      const g = groundY(sp.pos[ix], sp.pos[ix + 2]);
      if (sp.pos[ix + 1] < g) {
        sp.pos[ix + 1] = g;
        sp.vel[ix + 1] *= -0.3;
        sp.vel[ix] *= 0.5;
        sp.vel[ix + 2] *= 0.5;
      }
      pos[ix] = sp.pos[ix];
      pos[ix + 1] = sp.pos[ix + 1];
      pos[ix + 2] = sp.pos[ix + 2];
      br[i] = (1 - sp.age[i] / sp.life[i]) * fade * vanish;
    }
    built.sparks.getAttribute("position").needsUpdate = true;
    built.sparks.getAttribute("aBright").needsUpdate = true;
  });

  const { rig } = built;
  const doorHinge = useMemo(() => {
    const a = PANEL_ANGLE + PANEL_HALF;
    return new Vector3(Math.cos(a) * BODY_R, PANEL_Y[0], Math.sin(a) * BODY_R);
  }, []);
  // Closed, the door's local +X runs along the hull from the hinge back across the opening.
  const doorBase = Math.PI / 2 - (PANEL_ANGLE + PANEL_HALF);

  return (
    <>
      <points geometry={built.stars} material={built.starMat} />
      {earthGeo && (
        <group position={[-0.9, 4.0, -6]} scale={0.62} rotation={[0.35, 0, 0.2]}>
          <group ref={earth} rotation={[0, 2.2, 0]}>
            <points geometry={earthGeo} material={built.earthMat} />
          </group>
        </group>
      )}
      <points geometry={built.moon} material={built.moonMat} position={MOON_CENTER} />
      <points geometry={built.prints} material={built.printMat} frustumCulled={false} />

      <group position={ROCKET}>
        <points geometry={built.rocket} material={built.modelMat} />
        <group position={doorHinge} rotation={[0, doorBase, 0]}>
          <group ref={door}>
            <points geometry={built.door} material={built.modelMat} />
          </group>
        </group>
      </group>

      <group ref={astro} scale={1.2}>
        <group ref={body} position={[0, 0.44, 0]}>
          <group position={[0, -0.44, 0]}>
            <points geometry={rig.core} material={built.astroMat} />
            {[1, -1].map((side, i) => (
              <group key={side} ref={(el) => void (shoulders.current[i] = el)} position={[side * -0.205, 0.78, 0]}>
                <points geometry={rig.upperArm} material={built.astroMat} />
                <group ref={(el) => void (elbows.current[i] = el)} position={[0, -0.2, 0]}>
                  <points geometry={rig.forearm} material={built.astroMat} />
                  {i === 0 && (
                    <>
                      <points geometry={rig.tool} material={built.astroMat} />
                      <object3D ref={toolTip} position={[0, -0.24, 0.21]} />
                    </>
                  )}
                </group>
              </group>
            ))}
          </group>
        </group>
        {[1, -1].map((side, i) => (
          <group key={side} ref={(el) => void (hips.current[i] = el)} position={[side * -0.085, 0.44, 0]}>
            <points geometry={rig.thigh} material={built.astroMat} />
            <group ref={(el) => void (knees.current[i] = el)} position={[0, -0.22, 0]}>
              <points geometry={rig.shin} material={built.astroMat} />
            </group>
          </group>
        ))}
      </group>

      <points geometry={built.sparks} material={built.fxMat} frustumCulled={false} />
    </>
  );
}

export default function MoonRepairCanvas({ active, reducedMotion }: { active: boolean; reducedMotion: boolean }) {
  return (
    <Canvas
      dpr={[1, 1.5]}
      frameloop={active ? "always" : "never"}
      camera={{ fov: 38, near: 0.1, far: 200, position: [-0.2, 1.75, 7.6] }}
      gl={{ antialias: true, alpha: true, powerPreference: "low-power" }}
      onCreated={({ gl }) => gl.setClearColor(0x000000, 0)}
      style={{ pointerEvents: "none" }}
    >
      <Repair reducedMotion={reducedMotion} />
    </Canvas>
  );
}
