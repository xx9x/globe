/**
 * DEMONSTRATION DATA ONLY.
 * These figures are fictional and aggregated to the city level. They do not
 * represent real Globe users, and no individual locations or personal
 * information are stored or displayed.
 */
export type GlobeLocation = {
  id: string;
  city: string;
  country: string;
  lat: number;
  lon: number;
  value: number;
};

export const DEMO_LOCATIONS: GlobeLocation[] = [
  { id: "nyc", city: "New York", country: "United States", lat: 40.71, lon: -74.01, value: 1245 },
  { id: "sfo", city: "San Francisco", country: "United States", lat: 37.77, lon: -122.42, value: 986 },
  { id: "tor", city: "Toronto", country: "Canada", lat: 43.65, lon: -79.38, value: 512 },
  { id: "mex", city: "Mexico City", country: "Mexico", lat: 19.43, lon: -99.13, value: 431 },
  { id: "sao", city: "São Paulo", country: "Brazil", lat: -23.55, lon: -46.63, value: 874 },
  { id: "bue", city: "Buenos Aires", country: "Argentina", lat: -34.6, lon: -58.38, value: 297 },
  { id: "lon", city: "London", country: "United Kingdom", lat: 51.51, lon: -0.13, value: 1102 },
  { id: "ber", city: "Berlin", country: "Germany", lat: 52.52, lon: 13.4, value: 668 },
  { id: "lag", city: "Lagos", country: "Nigeria", lat: 6.52, lon: 3.38, value: 341 },
  { id: "nbo", city: "Nairobi", country: "Kenya", lat: -1.29, lon: 36.82, value: 218 },
  { id: "dxb", city: "Dubai", country: "United Arab Emirates", lat: 25.2, lon: 55.27, value: 529 },
  { id: "bom", city: "Mumbai", country: "India", lat: 19.08, lon: 72.88, value: 793 },
  { id: "sin", city: "Singapore", country: "Singapore", lat: 1.35, lon: 103.82, value: 615 },
  { id: "tyo", city: "Tokyo", country: "Japan", lat: 35.68, lon: 139.69, value: 957 },
  { id: "syd", city: "Sydney", country: "Australia", lat: -33.87, lon: 151.21, value: 488 },
];

export const DEMO_TOTAL_PROTECTED = DEMO_LOCATIONS.reduce((sum, l) => sum + l.value, 0);

/** Sample, aggregated regional event counts for the demo dashboard globe. */
export const DEMO_ACTIVITY: GlobeLocation[] = DEMO_LOCATIONS.map((l, i) => ({
  ...l,
  value: [42, 31, 12, 9, 27, 6, 38, 19, 8, 4, 14, 22, 17, 29, 11][i] ?? 5,
}));

export const formatNumber = (n: number) => new Intl.NumberFormat("en-US").format(n);
