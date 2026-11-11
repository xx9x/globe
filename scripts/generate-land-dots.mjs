/**
 * Generates the land-dot dataset used by the 3D globe.
 *
 * Source: Natural Earth 1:50m land polygons (public domain), via the
 * `world-atlas` package. We sample an equal-area grid of latitude rows
 * (fewer dots near the poles) and keep only points that fall on land.
 *
 * Output: public/data/land-dots.bin
 *   Int16Array of interleaved [lat * 100, lon * 100] pairs.
 *
 * Run with: npm run generate:globe
 */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";
import { feature } from "topojson-client";
import { geoBounds, geoContains } from "d3-geo";

const require = createRequire(import.meta.url);
const here = dirname(fileURLToPath(import.meta.url));
const out = resolve(here, "../public/data/land-dots.bin");

// Angular spacing between dots, in degrees. Smaller = denser globe.
const STEP = 0.72;

const topology = JSON.parse(
  readFileSync(require.resolve("world-atlas/land-50m.json"), "utf8"),
);
const land = feature(topology, topology.objects.land);

// Split the MultiPolygon into individual polygons with bounding boxes so we
// only run the (expensive) spherical containment test where it can matter.
const polygons = [];
for (const f of land.features) {
  const geom = f.geometry;
  const parts = geom.type === "Polygon" ? [geom.coordinates] : geom.coordinates;
  for (const coordinates of parts) {
    const poly = { type: "Polygon", coordinates };
    const [[minLon, minLat], [maxLon, maxLat]] = geoBounds(poly);
    polygons.push({ poly, minLon, minLat, maxLon, maxLat });
  }
}

function inBounds(p, lon, lat) {
  if (lat < p.minLat || lat > p.maxLat) return false;
  // Bounds that cross the antimeridian have minLon > maxLon.
  if (p.minLon <= p.maxLon) return lon >= p.minLon && lon <= p.maxLon;
  return lon >= p.minLon || lon <= p.maxLon;
}

function isLand(lon, lat) {
  for (const p of polygons) {
    if (inBounds(p, lon, lat) && geoContains(p.poly, [lon, lat])) return true;
  }
  return false;
}

const dots = [];
const rows = Math.round(180 / STEP);
for (let r = 0; r <= rows; r++) {
  const lat = -90 + r * STEP;
  const circumference = Math.cos((lat * Math.PI) / 180);
  const count = Math.max(1, Math.round((360 / STEP) * circumference));
  const offset = (r % 2) * 0.5; // stagger rows for a softer pattern
  for (let i = 0; i < count; i++) {
    const lon = -180 + ((i + offset) / count) * 360;
    if (isLand(lon, lat)) dots.push(Math.round(lat * 100), Math.round(lon * 100));
  }
}

mkdirSync(dirname(out), { recursive: true });
writeFileSync(out, Buffer.from(new Int16Array(dots).buffer));
console.log(`Wrote ${dots.length / 2} land dots to ${out}`);
