import { geoCentroid } from "d3-geo";
import type { Feature, FeatureCollection, Geometry } from "geojson";
import type { CityMeta, StateMeta } from "../types/quiz";
import { publicAssetUrl } from "../utils/publicAssetUrl";

export type LearnZoneId = "north" | "south" | "east" | "west" | "central";

export interface LearnZone {
  id: LearnZoneId;
  label: string;
  cities: CityMeta[];
}

export interface LearnZoneSummary extends LearnZone {
  completed: boolean;
  best: number | null;
}

export const ZONE_LABELS: Record<LearnZoneId, string> = {
  north: "North",
  south: "South",
  east: "East",
  west: "West",
  central: "Central",
};

const ZONE_ORDER: LearnZoneId[] = ["north", "west", "central", "east", "south"];

const centroidCache = new Map<string, Map<string, [number, number]>>();

function featureCentroid(geometry: Geometry): [number, number] | null {
  try {
    const c = geoCentroid({ type: "Feature", properties: {}, geometry } as Feature);
    if (!Number.isFinite(c[0]) || !Number.isFinite(c[1])) return null;
    return [c[0], c[1]];
  } catch {
    return null;
  }
}

export async function loadCityCentroids(stateMeta: StateMeta): Promise<Map<string, [number, number]>> {
  const cached = centroidCache.get(stateMeta.id);
  if (cached) return cached;

  const res = await fetch(publicAssetUrl(stateMeta.mapFiles.cities.replace(/^\//, "")));
  if (!res.ok) throw new Error(`Failed to load cities for ${stateMeta.name}`);

  const geo = (await res.json()) as FeatureCollection;
  const map = new Map<string, [number, number]>();

  for (const f of geo.features) {
    const id = String(f.properties?.id ?? "");
    if (!id || !f.geometry) continue;
    const c = featureCentroid(f.geometry);
    if (c) map.set(id, c);
  }

  centroidCache.set(stateMeta.id, map);
  return map;
}

function classifyZone(lon: number, lat: number, midLon: number, midLat: number, lonSpan: number, latSpan: number): LearnZoneId {
  const nLon = lonSpan > 0 ? (lon - (midLon - lonSpan / 2)) / lonSpan : 0.5;
  const nLat = latSpan > 0 ? (lat - (midLat - latSpan / 2)) / latSpan : 0.5;
  const dist = Math.hypot(nLon - 0.5, nLat - 0.5);

  if (dist < 0.22) return "central";

  const dLat = nLat - 0.5;
  const dLon = nLon - 0.5;
  if (Math.abs(dLat) >= Math.abs(dLon)) {
    return dLat > 0 ? "north" : "south";
  }
  return dLon > 0 ? "east" : "west";
}

/** Split a state's cities into ~5 compass areas for bite-sized learning. */
export function buildLearnZones(
  cities: CityMeta[],
  centroids: Map<string, [number, number]>,
): LearnZone[] {
  const located: { city: CityMeta; lon: number; lat: number }[] = [];

  for (const city of cities) {
    const c = centroids.get(city.id);
    if (c) located.push({ city, lon: c[0], lat: c[1] });
  }

  if (located.length === 0) {
    return [{ id: "central", label: ZONE_LABELS.central, cities: [...cities] }];
  }

  let minLon = Infinity;
  let maxLon = -Infinity;
  let minLat = Infinity;
  let maxLat = -Infinity;

  for (const p of located) {
    minLon = Math.min(minLon, p.lon);
    maxLon = Math.max(maxLon, p.lon);
    minLat = Math.min(minLat, p.lat);
    maxLat = Math.max(maxLat, p.lat);
  }

  const lonSpan = Math.max(maxLon - minLon, 0.01);
  const latSpan = Math.max(maxLat - minLat, 0.01);
  const midLon = (minLon + maxLon) / 2;
  const midLat = (minLat + maxLat) / 2;

  const buckets = new Map<LearnZoneId, CityMeta[]>();
  for (const id of ZONE_ORDER) buckets.set(id, []);

  for (const p of located) {
    const zone = classifyZone(p.lon, p.lat, midLon, midLat, lonSpan, latSpan);
    buckets.get(zone)!.push(p.city);
  }

  const unplaced = cities.filter((c) => !located.some((p) => p.city.id === c.id));
  if (unplaced.length > 0) {
    buckets.get("central")!.push(...unplaced);
  }

  const zones: LearnZone[] = [];
  for (const id of ZONE_ORDER) {
    const group = buckets.get(id)!;
    if (group.length === 0) continue;
    zones.push({ id, label: ZONE_LABELS[id], cities: group });
  }

  if (zones.length === 1) return zones;

  // Merge tiny zones (<2 cities) into the nearest neighbor by compass order.
  const merged = [...zones];
  for (let pass = 0; pass < 3; pass++) {
    const tiny = merged.find((z) => z.cities.length < 2);
    if (!tiny || merged.length <= 2) break;
    const idx = merged.indexOf(tiny);
    const target = merged[idx === 0 ? 1 : idx - 1];
    target.cities.push(...tiny.cities);
    merged.splice(idx, 1);
  }

  return merged.sort(
    (a, b) => ZONE_ORDER.indexOf(a.id) - ZONE_ORDER.indexOf(b.id),
  );
}

export async function loadLearnZonesForState(stateMeta: StateMeta): Promise<LearnZone[]> {
  const centroids = await loadCityCentroids(stateMeta);
  return buildLearnZones(stateMeta.cities, centroids);
}

export function learnZoneLabel(zone: LearnZone, stateName: string): string {
  return `${zone.label} ${stateName}`;
}
