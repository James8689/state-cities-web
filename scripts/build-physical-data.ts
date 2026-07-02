import { writeFileSync, mkdirSync, readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { feature } from "topojson-client";
import booleanIntersects from "@turf/boolean-intersects";
import bboxClip from "@turf/bbox-clip";
import bbox from "@turf/bbox";
import simplify from "@turf/simplify";
import type { Feature, FeatureCollection, Polygon, MultiPolygon } from "geojson";
import { STATE_CONFIGS } from "../src/data/states/registry";
import type { StateConfig } from "../src/types/quiz";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");

const NE = "https://raw.githubusercontent.com/martynafford/natural-earth-geojson/master/10m/physical";
const RIVERS_URL = `${NE}/ne_10m_rivers_lake_centerlines.json`;
const LAKES_URL = `${NE}/ne_10m_lakes.json`;

async function fetchJson(url: string, label: string): Promise<FeatureCollection> {
  const res = await fetch(url, { signal: AbortSignal.timeout(60_000) });
  if (!res.ok) throw new Error(`${label} failed: ${res.status}`);
  const data = (await res.json()) as FeatureCollection;
  console.log(`  ${label}: ${data.features.length} features`);
  return data;
}

function hasCoords(f: Feature): boolean {
  const g = f.geometry as { coordinates?: unknown[] } | null;
  return !!g && Array.isArray(g.coordinates) && g.coordinates.length > 0;
}

function buildWater(
  cfg: StateConfig,
  allStates: FeatureCollection,
  rivers: FeatureCollection,
  lakes: FeatureCollection,
) {
  const state = allStates.features.find((f) => f.id === cfg.fips) as
    | Feature<Polygon | MultiPolygon>
    | undefined;
  if (!state) throw new Error(`${cfg.name} (FIPS ${cfg.fips}) not found`);

  // Clip box = state bbox padded slightly so border rivers aren't chopped hard.
  const [minX, minY, maxX, maxY] = bbox(state);
  const pad = 0.3;
  const clipBox: [number, number, number, number] = [minX - pad, minY - pad, maxX + pad, maxY + pad];

  const keptRivers: Feature[] = [];
  for (const f of rivers.features) {
    try {
      if (!booleanIntersects(f, state)) continue;
      const clipped = bboxClip(f as Feature<any>, clipBox) as Feature;
      if (hasCoords(clipped)) keptRivers.push({ ...clipped, properties: { kind: "river" } });
    } catch {
      /* skip malformed */
    }
  }

  const keptLakes: Feature[] = [];
  for (const f of lakes.features) {
    try {
      if (!booleanIntersects(f, state)) continue;
      const clipped = bboxClip(f as Feature<any>, clipBox) as Feature;
      if (hasCoords(clipped)) {
        const small = simplify(clipped, { tolerance: 0.002, highQuality: false });
        keptLakes.push({ ...small, properties: { kind: "lake" } });
      }
    } catch {
      /* skip malformed */
    }
  }

  const water: FeatureCollection = {
    type: "FeatureCollection",
    features: [...keptLakes, ...keptRivers],
  };

  const mapsDir = join(root, "public", "maps");
  mkdirSync(mapsDir, { recursive: true });
  writeFileSync(join(mapsDir, `${cfg.slug}-water.geojson`), JSON.stringify(water));
  console.log(`${cfg.usps}: ${keptRivers.length} river segments, ${keptLakes.length} lakes`);
}

async function main() {
  const keys = process.argv.slice(2).map((k) => k.toUpperCase());
  const targets = keys.length
    ? STATE_CONFIGS.filter((c) => keys.includes(c.usps))
    : STATE_CONFIGS;
  if (targets.length === 0) throw new Error(`No matching states for: ${keys.join(", ")}`);

  const statesTopo = JSON.parse(
    readFileSync(join(root, "node_modules/us-atlas/states-10m.json"), "utf8"),
  );
  const allStates = feature(statesTopo, statesTopo.objects.states) as FeatureCollection;

  console.log("Fetching Natural Earth physical data...");
  const [rivers, lakes] = await Promise.all([
    fetchJson(RIVERS_URL, "rivers"),
    fetchJson(LAKES_URL, "lakes"),
  ]);

  for (const cfg of targets) {
    buildWater(cfg, allStates, rivers, lakes);
  }
  console.log(`Done: ${targets.length} state(s).`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
