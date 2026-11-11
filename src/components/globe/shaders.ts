/**
 * GLSL for the dotted Earth. All lighting is computed in view space so the
 * shading stays fixed relative to the viewer while the globe turns.
 */

// Soft key light from the upper-left, slightly toward the camera.
const LIGHT_DIR = "normalize(vec3(-0.55, 0.6, 0.75))";

export const dotsVertex = /* glsl */ `
  attribute float aRand;
  uniform float uSize;
  uniform float uPixelRatio;
  uniform float uScale;
  varying float vFacing;
  varying float vLight;
  varying float vRand;

  void main() {
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    vec3 n = normalize(normalMatrix * position);
    vec3 viewDir = normalize(-mv.xyz);
    vFacing = dot(n, viewDir);
    vLight = clamp(dot(n, ${LIGHT_DIR}), 0.0, 1.0);
    vRand = aRand;

    float back = smoothstep(0.1, -0.2, vFacing);      // 1 on the far side
    float size = uSize * (0.8 + 0.4 * aRand) * mix(1.0, 0.65, back);
    gl_PointSize = size * uPixelRatio * uScale / -mv.z;
    gl_Position = projectionMatrix * mv;
  }
`;

export const dotsFragment = /* glsl */ `
  uniform float uOpacity;
  varying float vFacing;
  varying float vLight;
  varying float vRand;

  void main() {
    vec2 c = gl_PointCoord - 0.5;
    float d = length(c);
    if (d > 0.5) discard;
    float disc = smoothstep(0.5, 0.18, d);

    float front = smoothstep(-0.12, 0.3, vFacing);    // 0 far side, 1 near side
    float limb = smoothstep(0.0, 0.35, vFacing);      // soften toward the edge
    float shade = mix(0.38, 1.0, vLight);              // spherical shading

    float brightness = mix(0.07, 1.0, front) * mix(0.55, 1.0, limb) * shade;
    brightness *= 0.78 + 0.22 * vRand;

    vec3 color = mix(vec3(0.55), vec3(1.0), vLight * front);
    gl_FragColor = vec4(color, disc * brightness * uOpacity);
  }
`;

export const bodyVertex = /* glsl */ `
  varying vec3 vNormal;
  varying vec3 vViewDir;
  void main() {
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    vNormal = normalize(normalMatrix * normal);
    vViewDir = normalize(-mv.xyz);
    gl_Position = projectionMatrix * mv;
  }
`;

export const bodyFragment = /* glsl */ `
  uniform float uOpacity;
  varying vec3 vNormal;
  varying vec3 vViewDir;
  void main() {
    float light = clamp(dot(vNormal, ${LIGHT_DIR}), 0.0, 1.0);
    float facing = clamp(dot(vNormal, vViewDir), 0.0, 1.0);
    float rim = pow(1.0 - facing, 3.0);
    vec3 base = vec3(0.028) + vec3(0.07) * pow(light, 1.6);
    vec3 color = base + vec3(0.11) * rim * (0.35 + 0.65 * light);
    gl_FragColor = vec4(color, uOpacity);
  }
`;

export const atmosphereVertex = bodyVertex;

export const atmosphereFragment = /* glsl */ `
  uniform float uOpacity;
  varying vec3 vNormal;
  varying vec3 vViewDir;
  void main() {
    // Rendered on the back faces of a slightly larger sphere: a faint halo
    // that is strongest just outside the limb and fades outward.
    // facing is ~-0.45 at the Earth's limb and 0 at the halo's outer edge.
    float facing = dot(vNormal, vViewDir);
    float halo = pow(smoothstep(0.0, -0.45, facing), 2.6);
    float light = clamp(dot(-vNormal, ${LIGHT_DIR}) * 0.5 + 0.5, 0.0, 1.0);
    gl_FragColor = vec4(vec3(1.0), halo * 0.11 * (0.5 + 0.5 * light) * uOpacity);
  }
`;
