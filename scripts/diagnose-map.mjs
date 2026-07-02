/**
 * Run: npm run diagnose            (all built states)
 *      npm run diagnose -- OR      (one state by USPS code)
 *
 * Validates that generated map data projects correctly (no browser needed).
 * Reads the generated metadata JSON, so it stays in sync as states are added.
 */
import { readFileSync, existsSync, readdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { feature } from "topojson-client";
import { geoAlbers, geoPath, geoBounds, geoCentroid } from "d3-geo";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const statesDir = join(root, "src/data/states");
const mapsDir = join(root, "public/maps");

const W = 400;
const H = 600;

let failed = false;
const ok = (msg) => console.log("OK  ", msg);
const bad = (msg) => {
  console.log("FAIL", msg);
  failed = true;
};

function buildProjection(state) {
  const f = state.features[0];
  const [cLon, cLat] = geoCentroid(f);
  const [[, s], [, n]] = geoBounds(f);
  const span = Math.max(n - s, 0.5);
  const p = geoAlbers()
    .rotate([-cLon, 0])
    .center([0, cLat])
    .parallels([s + span / 6, n - span / 6]);
  p.fitExtent(
    [
      [4, 4],
      [W - 4, H - 4],
    ],
    state,
  );
  return p;
}

function firstPoint(path, f) {
  const d = path(f);
  if (!d) return null;
  const m = d.match(/^M([\d.-]+),([\d.-]+)/);
  return m ? [+m[1], +m[2]] : null;
}

function diagnoseState(metaFile) {
  const meta = JSON.parse(readFileSync(join(statesDir, metaFile), "utf8"));
  console.log(`\n--- ${meta.name} (${meta.id}) ---`);

  const statePath = join(root, "public", meta.mapFiles.state.replace(/^\//, ""));
  const citiesPath = join(root, "public", meta.mapFiles.cities.replace(/^\//, ""));

  if (!existsSync(statePath)) return bad(`Missing ${meta.mapFiles.state}`);
  ok(`State file exists (${(readFileSync(statePath).length / 1024).toFixed(1)} KB)`);
  if (!existsSync(citiesPath)) return bad(`Missing ${meta.mapFiles.cities}`);
  ok(`Cities file exists (${(readFileSync(citiesPath).length / 1024).toFixed(1)} KB)`);

  if (meta.mapFiles.water) {
    const waterPath = join(root, "public", meta.mapFiles.water.replace(/^\//, ""));
    if (existsSync(waterPath)) ok("Water file exists");
    else console.log("WARN ", `No water file at ${meta.mapFiles.water} (optional)`);
  }

  const stateTopo = JSON.parse(readFileSync(statePath, "utf8"));
  const state = feature(stateTopo, stateTopo.objects.state);
  const cities = JSON.parse(readFileSync(citiesPath, "utf8"));

  const expected = meta.cities.length;
  if (cities.type !== "FeatureCollection" || cities.features.length !== expected) {
    bad(`Expected ${expected} city features, got ${cities.features?.length ?? 0}`);
  } else {
    ok(`${expected} city features in GeoJSON`);
  }

  const path = geoPath(buildProjection(state));
  const statePt = firstPoint(path, state.features[0]);
  if (!statePt) bad("State does not produce an SVG path");
  else ok(`State renders at pixel (${statePt[0].toFixed(1)}, ${statePt[1].toFixed(1)})`);

  let cityOk = 0;
  for (const f of cities.features) {
    const pt = firstPoint(path, f);
    if (pt && pt[0] >= -10 && pt[0] <= W + 10 && pt[1] >= -10 && pt[1] <= H + 10) cityOk++;
  }
  if (cityOk === cities.features.length) ok(`All ${cityOk} cities project inside the viewport`);
  else bad(`Only ${cityOk}/${cities.features.length} cities project inside the viewport`);
}

console.log("\n=== State Cities Map Diagnostics ===");

if (!existsSync(statesDir)) {
  bad(`No states directory at ${statesDir}`);
} else {
  const arg = process.argv[2]?.toUpperCase();
  const metaFiles = readdirSync(statesDir).filter((f) => f.endsWith(".json"));
  const selected = metaFiles.filter((f) => {
    if (!arg) return true;
    const meta = JSON.parse(readFileSync(join(statesDir, f), "utf8"));
    return meta.id === arg;
  });

  if (selected.length === 0) bad(`No built state matches "${arg ?? ""}"`);
  else for (const f of selected) diagnoseState(f);
}

// Surface stray legacy artifacts that break rendering.
if (existsSync(join(mapsDir, "oregon-cities.topojson"))) {
  bad("Legacy oregon-cities.topojson present — delete it and hard-refresh");
}

console.log(failed ? "\nRESULT: FAIL\n" : "\nRESULT: PASS (data layer OK)\n");
process.exit(failed ? 1 : 0);
