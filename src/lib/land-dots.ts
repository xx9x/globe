/** Shared, cached loader for the globe's land-dot dataset (91 KB binary). */
export const LAND_DOTS_URL = "/data/land-dots.bin";

let landDotsPromise: Promise<ArrayBuffer> | null = null;

export function loadLandDots() {
  landDotsPromise ??= fetch(LAND_DOTS_URL).then((r) => {
    if (!r.ok) throw new Error(`Failed to load globe data (${r.status})`);
    return r.arrayBuffer();
  });
  landDotsPromise.catch(() => (landDotsPromise = null));
  return landDotsPromise;
}
