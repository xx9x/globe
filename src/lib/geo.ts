import { Vector3 } from "three";

/**
 * Converts latitude/longitude (degrees) to a point on a sphere.
 * Convention: +Y is north; a camera on +Z looks at longitude -90° (the Americas);
 * longitude increases toward the viewer's right (east), so the map is not mirrored.
 */
export function latLonToVector3(lat: number, lon: number, radius = 1, target = new Vector3()) {
  const phi = ((90 - lat) * Math.PI) / 180;
  const theta = ((lon + 180) * Math.PI) / 180;
  return target.set(
    -radius * Math.sin(phi) * Math.cos(theta),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.sin(theta),
  );
}

/** Writes lat/lon pairs (Int16, ×100) into a flat xyz Float32Array on a sphere. */
export function decodeLandDots(buffer: ArrayBuffer, radius = 1) {
  const raw = new Int16Array(buffer);
  const count = raw.length / 2;
  const positions = new Float32Array(count * 3);
  const random = new Float32Array(count);
  const v = new Vector3();
  for (let i = 0; i < count; i++) {
    latLonToVector3(raw[i * 2] / 100, raw[i * 2 + 1] / 100, radius, v);
    positions[i * 3] = v.x;
    positions[i * 3 + 1] = v.y;
    positions[i * 3 + 2] = v.z;
    // Deterministic pseudo-random per dot for subtle size/brightness variation.
    const s = Math.sin(i * 12.9898) * 43758.5453;
    random[i] = s - Math.floor(s);
  }
  return { positions, random, count };
}
