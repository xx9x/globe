/**
 * Shared building blocks for the dotted background scenes, so the solar
 * system and the Mars landing read as the same family as the globe:
 * soft round white dots, view-dependent shading, dimmed far sides.
 */
import { BufferAttribute, BufferGeometry, ShaderMaterial, Vector3 } from "three";

const vertex = /* glsl */ `
  attribute float aSize;
  attribute float aBright;
  uniform float uPixelRatio;
  uniform float uScale;
  uniform float uOpacity;
  uniform float uSphere;     // 1 = points lie on a sphere centered at the object origin
  uniform float uLightMode;  // 0 none, 1 directional (uLight = direction), 2 point (uLight = position)
  uniform vec3 uLight;
  uniform float uNight;      // brightness kept on the unlit side
  uniform float uLimb;       // 1 = dim points toward the limb / far side
  varying float vAlpha;
  varying float vShade;

  void main() {
    vec4 world = modelMatrix * vec4(position, 1.0);
    vec4 mv = viewMatrix * world;
    float shade = 1.0;
    float front = 1.0;
    if (uSphere > 0.5) {
      vec3 center = (modelMatrix * vec4(0.0, 0.0, 0.0, 1.0)).xyz;
      vec3 n = normalize(world.xyz - center);
      float facing = dot(n, normalize(cameraPosition - world.xyz));
      front = smoothstep(-0.12, 0.3, facing) * mix(0.55, 1.0, smoothstep(0.0, 0.35, facing));
      front = mix(1.0, max(front, 0.06), uLimb);
      if (uLightMode > 0.5) {
        vec3 L = uLightMode > 1.5 ? normalize(uLight - world.xyz) : normalize(uLight);
        shade = clamp(dot(n, L), 0.0, 1.0);
      }
    }
    vShade = shade;
    vAlpha = aBright * front * mix(uNight, 1.0, shade) * uOpacity;
    gl_PointSize = aSize * uPixelRatio * uScale / -mv.z;
    gl_Position = projectionMatrix * mv;
  }
`;

const fragment = /* glsl */ `
  varying float vAlpha;
  varying float vShade;
  void main() {
    float d = length(gl_PointCoord - 0.5);
    if (d > 0.5) discard;
    float disc = smoothstep(0.5, 0.18, d);
    gl_FragColor = vec4(mix(vec3(0.6), vec3(1.0), vShade), disc * vAlpha);
  }
`;

export type DotMaterialOptions = {
  sphere?: boolean;
  lightMode?: 0 | 1 | 2;
  light?: Vector3;
  night?: number;
  opacity?: number;
  limb?: boolean;
};

export function createDotMaterial({ sphere = false, lightMode = 0, light, night = 0.12, opacity = 1, limb = true }: DotMaterialOptions = {}) {
  return new ShaderMaterial({
    vertexShader: vertex,
    fragmentShader: fragment,
    transparent: true,
    depthWrite: false,
    uniforms: {
      uPixelRatio: { value: 1 },
      uScale: { value: 1 },
      uOpacity: { value: opacity },
      uSphere: { value: sphere ? 1 : 0 },
      uLightMode: { value: lightMode },
      uLight: { value: light ?? new Vector3(0, 1, 0) },
      uNight: { value: night },
      uLimb: { value: limb ? 1 : 0 },
    },
  });
}

/** Keeps point sizes proportional to the canvas height on every material. */
export function syncDotUniforms(materials: ShaderMaterial[], dpr: number, height: number) {
  const scale = Math.min(Math.max(height / 900, 0.55), 1.4);
  for (const m of materials) {
    m.uniforms.uPixelRatio.value = dpr;
    m.uniforms.uScale.value = scale;
  }
}

export function makeGeometry(
  positions: Float32Array,
  size: number | ((i: number) => number),
  bright: number | ((i: number) => number),
) {
  const n = positions.length / 3;
  const s = new Float32Array(n);
  const b = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    s[i] = typeof size === "number" ? size : size(i);
    b[i] = typeof bright === "number" ? bright : bright(i);
  }
  const g = new BufferGeometry();
  g.setAttribute("position", new BufferAttribute(positions, 3));
  g.setAttribute("aSize", new BufferAttribute(s, 1));
  g.setAttribute("aBright", new BufferAttribute(b, 1));
  return g;
}

/** Deterministic PRNG so scenes look identical on every load. */
export function rng(seed = 1) {
  let t = seed >>> 0;
  return () => {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

const GOLDEN = Math.PI * (3 - Math.sqrt(5));

/** Evenly spaced points over a whole sphere. */
export function fibonacciSphere(count: number, radius: number) {
  const out = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const y = 1 - (2 * (i + 0.5)) / count;
    const r = Math.sqrt(1 - y * y);
    const phi = i * GOLDEN;
    out[i * 3] = Math.cos(phi) * r * radius;
    out[i * 3 + 1] = y * radius;
    out[i * 3 + 2] = Math.sin(phi) * r * radius;
  }
  return out;
}

/** Evenly spaced points on a spherical cap around +Y (half-angle in radians). */
export function fibonacciCap(count: number, radius: number, halfAngle: number) {
  const out = new Float32Array(count * 3);
  const minY = Math.cos(halfAngle);
  for (let i = 0; i < count; i++) {
    const y = 1 - ((1 - minY) * (i + 0.5)) / count;
    const r = Math.sqrt(1 - y * y);
    const phi = i * GOLDEN;
    out[i * 3] = Math.cos(phi) * r * radius;
    out[i * 3 + 1] = y * radius;
    out[i * 3 + 2] = Math.sin(phi) * r * radius;
  }
  return out;
}

/** Dotted circle in the XZ plane. */
export function circlePoints(radius: number, spacing: number) {
  const count = Math.max(12, Math.round((Math.PI * 2 * radius) / spacing));
  const out = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const a = (i / count) * Math.PI * 2;
    out[i * 3] = Math.cos(a) * radius;
    out[i * 3 + 2] = Math.sin(a) * radius;
  }
  return out;
}

/** Random points in a flat XZ annulus (area-uniform), with optional vertical jitter. */
export function annulusPoints(count: number, inner: number, outer: number, jitterY = 0, seed = 7) {
  const rand = rng(seed);
  const out = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const r = Math.sqrt(inner * inner + rand() * (outer * outer - inner * inner));
    const a = rand() * Math.PI * 2;
    out[i * 3] = Math.cos(a) * r;
    out[i * 3 + 1] = (rand() - 0.5) * jitterY;
    out[i * 3 + 2] = Math.sin(a) * r;
  }
  return out;
}

/** Faint, distant star field on a large shell. */
export function starPoints(count: number, radius: number, seed = 3) {
  const rand = rng(seed);
  const out = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const y = rand() * 2 - 1;
    const r = Math.sqrt(1 - y * y);
    const a = rand() * Math.PI * 2;
    const d = radius * (0.85 + rand() * 0.3);
    out[i * 3] = Math.cos(a) * r * d;
    out[i * 3 + 1] = y * d;
    out[i * 3 + 2] = Math.sin(a) * r * d;
  }
  return out;
}

export const smoothstep = (a: number, b: number, x: number) => {
  const t = Math.min(Math.max((x - a) / (b - a), 0), 1);
  return t * t * (3 - 2 * t);
};

/**
 * A dotted spherical cap (around +Y) with craters — sparse, dark floors and
 * bright rims — plus soft albedo variation. Used for planetary surfaces.
 */
export function crateredCap({
  radius,
  count,
  halfAngle,
  craters,
  craterSize,
  seed,
  albedo = [0.45, 0.3],
  size = [13, 7],
}: {
  radius: number;
  count: number;
  halfAngle: number;
  craters: number;
  craterSize: [number, number];
  seed: number;
  albedo?: [number, number];
  size?: [number, number];
}) {
  const rand = rng(seed);
  const raw = fibonacciCap(count, radius, halfAngle);
  const spacing = Math.sqrt((2 * Math.PI * radius * radius * (1 - Math.cos(halfAngle))) / count);
  // Jitter each dot along the surface to break up the regular spiral pattern.
  for (let i = 0; i < raw.length; i += 3) {
    const x = raw[i] + (rand() - 0.5) * spacing * 0.7;
    const y = raw[i + 1] + (rand() - 0.5) * spacing * 0.7;
    const z = raw[i + 2] + (rand() - 0.5) * spacing * 0.7;
    const k = radius / Math.hypot(x, y, z);
    raw[i] = x * k;
    raw[i + 1] = y * k;
    raw[i + 2] = z * k;
  }
  const holes = Array.from({ length: craters }, () => {
    const y = 1 - rand() * (1 - Math.cos(halfAngle * 0.9));
    const r = Math.sqrt(1 - y * y);
    const a = rand() * Math.PI * 2;
    return {
      dir: new Vector3(Math.cos(a) * r, y, Math.sin(a) * r),
      size: craterSize[0] + rand() * rand() * craterSize[1],
    };
  });

  const keep: number[] = [];
  const bright: number[] = [];
  const n = new Vector3();
  for (let i = 0; i < raw.length; i += 3) {
    n.set(raw[i], raw[i + 1], raw[i + 2]).normalize();
    let b = albedo[0] + albedo[1] * Math.sin(n.x * 40 + Math.sin(n.z * 27) * 2) * Math.cos(n.z * 31 + n.x * 9);
    let skip = false;
    for (const c of holes) {
      const d = Math.acos(Math.min(1, n.dot(c.dir))) / c.size;
      if (d < 0.82) {
        b *= 0.35;
        if (rand() < 0.6) skip = true;
      } else if (d < 1.12) {
        b = Math.min(1, b + 0.6 * (1 - Math.abs(d - 0.97) / 0.15));
      }
    }
    if (skip) continue;
    keep.push(raw[i], raw[i + 1], raw[i + 2]);
    bright.push(Math.max(0.15, b));
  }
  return makeGeometry(new Float32Array(keep), () => size[0] + rand() * size[1], (i) => bright[i]);
}

/** Small helper for assembling hand-built dot models. */
export class DotBuilder {
  pts: number[] = [];
  br: number[] = [];
  add(x: number, y: number, z: number, b = 1) {
    this.pts.push(x, y, z);
    this.br.push(b);
  }
  line(a: Vector3, b: Vector3, spacing: number, bright = 1) {
    const n = Math.max(1, Math.round(a.distanceTo(b) / spacing));
    for (let i = 0; i <= n; i++) {
      const p = a.clone().lerp(b, i / n);
      this.add(p.x, p.y, p.z, bright);
    }
  }
  /** Horizontal ring (XZ) at height y. */
  ring(r: number, y: number, spacing: number, bright = 1, cx = 0, cz = 0) {
    const n = Math.max(6, Math.round((Math.PI * 2 * r) / spacing));
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2;
      this.add(cx + Math.cos(a) * r, y, cz + Math.sin(a) * r, bright);
    }
  }
  /** Ellipsoid surface; `bright` may depend on the unit normal. */
  ellipsoid(
    c: Vector3,
    rx: number,
    ry: number,
    rz: number,
    spacing: number,
    bright: number | ((n: Vector3) => number) = 1,
  ) {
    const area = 4 * Math.PI * Math.pow((rx * ry + ry * rz + rx * rz) / 3, 1);
    const count = Math.max(20, Math.round(area / (spacing * spacing)));
    const unit = fibonacciSphere(count, 1);
    const n = new Vector3();
    for (let i = 0; i < count; i++) {
      n.set(unit[i * 3], unit[i * 3 + 1], unit[i * 3 + 2]);
      const b = typeof bright === "number" ? bright : bright(n);
      this.add(c.x + n.x * rx, c.y + n.y * ry, c.z + n.z * rz, b);
    }
  }
  /** Surface of an axis-aligned box. */
  box(c: Vector3, w: number, h: number, d: number, spacing: number, bright = 1) {
    const step = (len: number) => Math.max(1, Math.round(len / spacing));
    const [nx, ny, nz] = [step(w), step(h), step(d)];
    for (let i = 0; i <= nx; i++)
      for (let j = 0; j <= ny; j++)
        for (let k = 0; k <= nz; k++) {
          const onFace = i === 0 || i === nx || j === 0 || j === ny || k === 0 || k === nz;
          if (!onFace) continue;
          this.add(c.x - w / 2 + (w * i) / nx, c.y - h / 2 + (h * j) / ny, c.z - d / 2 + (d * k) / nz, bright);
        }
  }
  geometry(size: number | ((i: number) => number)) {
    return makeGeometry(new Float32Array(this.pts), size, (i) => this.br[i]);
  }
}
