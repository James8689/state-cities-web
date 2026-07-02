import { writeFileSync, mkdirSync, readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import * as topojson from "topojson-server";
import { feature } from "topojson-client";
import simplify from "@turf/simplify";
import rewind from "@turf/rewind";
import type { Feature, FeatureCollection, MultiPolygon, Polygon } from "geojson";
import { STATE_CONFIGS } from "../src/data/states/registry";
import type { StateConfig } from "../src/types/quiz";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");

function citySlug(name: string, usps: string): string {
  return `${name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")}-${usps.toLowerCase()}`;
}

/** Census BASENAME → name shown in the quiz. Registry `basename` stays exact for TIGER. */
function friendlyPlaceName(basename: string, override?: string): string {
  if (override) return override;

  let n = basename
    .replace(/\s+consolidated government \(balance\)$/i, "")
    .replace(/\s+unified government \(balance\)$/i, "")
    .replace(/\s+city \(balance\)$/i, "")
    .replace(/\s+metro government \(balance\)$/i, "")
    .replace(/\s+metropolitan government \(balance\)$/i, "")
    .replace(/-Silver Bow \(balance\)$/i, "");

  if (n.includes("/")) n = n.split("/")[0].trim();

  const hyphenCounty = n.match(/^([^-]+)-(?:.+ County|Deer Lodge County)$/i);
  if (hyphenCounty) n = hyphenCounty[1].trim();

  const hyphenFayette = n.match(/^(.+)-Fayette$/i);
  if (hyphenFayette) n = hyphenFayette[1].trim();

  const hyphenDavidson = n.match(/^(.+)-Davidson$/i);
  if (hyphenDavidson) n = hyphenDavidson[1].trim();

  const slang: Record<string, string> = {
    "Boise City": "Boise",
    "Urban Honolulu": "Honolulu",
  };
  return slang[basename] ?? n;
}

async function fetchLayer(cfg: StateConfig, layer: 26 | 28): Promise<FeatureCollection> {
  const res = await fetch(placesUrl(cfg, layer), { signal: AbortSignal.timeout(120_000) });
  if (!res.ok) throw new Error(`${cfg.usps} places fetch failed (layer ${layer}): ${res.status}`);
  return (await res.json()) as FeatureCollection;
}

function placesUrl(cfg: StateConfig, layer: 26 | 28): string {
  const names = cfg.cities.map((c) => `'${c.basename.replace(/'/g, "''")}'`).join(",");
  return (
    `https://tigerweb.geo.census.gov/arcgis/rest/services/TIGERweb/tigerWMS_Census2020/MapServer/${layer}/query?` +
    new URLSearchParams({
      where: `STATE='${cfg.fips}' AND BASENAME IN (${names})`,
      outFields: "GEOID,BASENAME,POP100,NAME",
      outSR: "4326",
      f: "geojson",
      returnGeometry: "true",
    }).toString()
  );
}

async function fetchPlaces(cfg: StateConfig): Promise<FeatureCollection> {
  let placesGeo = await fetchLayer(cfg, 26);

  // Hawaii has no incorporated places in TIGER; CDPs live on layer 28.
  if (placesGeo.features.length === 0) {
    return fetchLayer(cfg, 28);
  }

  const found = new Set(placesGeo.features.map((f) => String(f.properties?.BASENAME ?? "")));
  const missing = cfg.cities.filter((c) => !found.has(c.basename));
  if (missing.length > 0) {
    const cdpGeo = await fetchLayer({ ...cfg, cities: missing }, 28);
    placesGeo = {
      type: "FeatureCollection",
      features: [...placesGeo.features, ...cdpGeo.features],
    };
  }

  return placesGeo;
}

async function buildState(cfg: StateConfig, allStates: FeatureCollection) {
  const mapsDir = join(root, "public", "maps");
  const dataDir = join(root, "src", "data", "states");
  mkdirSync(mapsDir, { recursive: true });
  mkdirSync(dataDir, { recursive: true });

  const stateFeature = allStates.features.find((f) => f.id === cfg.fips);
  if (!stateFeature) throw new Error(`${cfg.name} (FIPS ${cfg.fips}) not found in us-atlas`);
  const stateGeo: FeatureCollection = { type: "FeatureCollection", features: [stateFeature] };

  const placesGeo = await fetchPlaces(cfg);

  const tierByName = new Map(cfg.cities.map((c) => [c.basename, c.tier]));
  const nameByBasename = new Map(
    cfg.cities.filter((c) => c.name).map((c) => [c.basename, c.name!]),
  );

  const cityFeatures = placesGeo.features.map((f) => {
    const basename = String(f.properties?.BASENAME ?? "");
    const displayName = friendlyPlaceName(basename, nameByBasename.get(basename));
    // Census/ArcGIS GeoJSON winds exterior rings clockwise. d3-geo (spherical)
    // needs RFC 7946 counterclockwise exterior rings, or it treats each polygon
    // as the whole globe minus the city. reverse:true enforces that.
    const wound = rewind(f as Feature<Polygon | MultiPolygon>, { reverse: true });
    const simplified = simplify(wound, { tolerance: 0.0008, highQuality: true });
    return {
      ...simplified,
      properties: {
        id: citySlug(displayName, cfg.usps),
        geoid: String(f.properties?.GEOID ?? ""),
        name: displayName,
        population: Number(f.properties?.POP100 ?? 0),
        tier: tierByName.get(basename) ?? 1,
      },
    };
  });

  cityFeatures.sort((a, b) => String(a.properties.name).localeCompare(String(b.properties.name)));
  const citiesCollection: FeatureCollection = { type: "FeatureCollection", features: cityFeatures };

  writeFileSync(
    join(mapsDir, `${cfg.slug}-state.topojson`),
    JSON.stringify(topojson.topology({ state: stateGeo })),
  );
  writeFileSync(join(mapsDir, `${cfg.slug}-cities.geojson`), JSON.stringify(citiesCollection));

  const metadata = {
    id: cfg.usps,
    name: cfg.name,
    capital: cfg.capital,
    mapFiles: {
      state: `/maps/${cfg.slug}-state.topojson`,
      cities: `/maps/${cfg.slug}-cities.geojson`,
      water: `/maps/${cfg.slug}-water.geojson`,
    },
    cities: cityFeatures.map((f) => ({ ...f.properties })),
  };

  writeFileSync(join(dataDir, `${cfg.slug}.json`), JSON.stringify(metadata, null, 2));
  console.log(`${cfg.usps}: ${cityFeatures.length} cities (rewound to RFC 7946)`);
}

async function main() {
  const keys = process.argv.slice(2).map((k) => k.toUpperCase());
  const targets = keys.length
    ? STATE_CONFIGS.filter((c) => keys.includes(c.usps))
    : STATE_CONFIGS;

  if (targets.length === 0) {
    throw new Error(`No matching states for: ${keys.join(", ")}`);
  }

  const statesTopo = JSON.parse(
    readFileSync(join(root, "node_modules/us-atlas/states-10m.json"), "utf8"),
  );
  const allStates = feature(statesTopo, statesTopo.objects.states) as FeatureCollection;

  for (const cfg of targets) {
    await buildState(cfg, allStates);
  }
  console.log(`Done: ${targets.length} state(s).`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
