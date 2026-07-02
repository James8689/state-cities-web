import { writeFileSync, mkdirSync, readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import * as topojson from "topojson-server";
import { feature } from "topojson-client";
const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const OREGON_CITIES = [
    { basename: "Portland", tier: 1 },
    { basename: "Salem", tier: 1 },
    { basename: "Eugene", tier: 1 },
    { basename: "Gresham", tier: 1 },
    { basename: "Hillsboro", tier: 1 },
    { basename: "Beaverton", tier: 1 },
    { basename: "Bend", tier: 1 },
    { basename: "Medford", tier: 1 },
    { basename: "Springfield", tier: 1 },
    { basename: "Corvallis", tier: 1 },
    { basename: "Albany", tier: 1 },
    { basename: "Tigard", tier: 1 },
    { basename: "Grants Pass", tier: 1 },
    { basename: "Oregon City", tier: 1 },
    { basename: "Ashland", tier: 2 },
    { basename: "Astoria", tier: 2 },
    { basename: "Hood River", tier: 2 },
    { basename: "Newport", tier: 2 },
    { basename: "Pendleton", tier: 2 },
];
const PLACE_NAMES = OREGON_CITIES.map((c) => `'${c.basename.replace(/'/g, "''")}'`).join(",");
const PLACES_URL = "https://tigerweb.geo.census.gov/arcgis/rest/services/TIGERweb/tigerWMS_Census2020/MapServer/26/query?" +
    new URLSearchParams({
        where: `STATE='41' AND BASENAME IN (${PLACE_NAMES})`,
        outFields: "GEOID,BASENAME,POP100,NAME",
        outSR: "4326",
        f: "geojson",
        returnGeometry: "true",
    }).toString();
function slugify(name) {
    return `${name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")}-or`;
}
function toTopo(collection, objectName) {
    return topojson.topology({ [objectName]: collection });
}
async function main() {
    const mapsDir = join(root, "public", "maps");
    const dataDir = join(root, "src", "data", "states");
    mkdirSync(mapsDir, { recursive: true });
    mkdirSync(dataDir, { recursive: true });
    console.log("Loading Oregon state from us-atlas...");
    const statesTopo = JSON.parse(readFileSync(join(root, "node_modules/us-atlas/states-10m.json"), "utf8"));
    const allStates = feature(statesTopo, statesTopo.objects.states);
    const oregonState = allStates.features.find((f) => f.id === "41");
    if (!oregonState)
        throw new Error("Oregon not found in us-atlas");
    const stateGeo = { type: "FeatureCollection", features: [oregonState] };
    console.log("Fetching Oregon city boundaries...");
    const res = await fetch(PLACES_URL, { signal: AbortSignal.timeout(120_000) });
    if (!res.ok)
        throw new Error(`Places fetch failed: ${res.status}`);
    const placesGeo = (await res.json());
    if (!placesGeo.features?.length)
        throw new Error("No city features returned");
    const tierByName = new Map(OREGON_CITIES.map((c) => [c.basename, c.tier]));
    const cityFeatures = placesGeo.features.map((f) => {
        const basename = String(f.properties?.BASENAME ?? "");
        return {
            ...f,
            type: "Feature",
            properties: {
                id: slugify(basename),
                geoid: String(f.properties?.GEOID ?? ""),
                name: basename,
                population: Number(f.properties?.POP100 ?? 0),
                tier: tierByName.get(basename) ?? 1,
            },
        };
    });
    if (cityFeatures.length !== OREGON_CITIES.length) {
        const found = new Set(cityFeatures.map((f) => f.properties.name));
        const missing = OREGON_CITIES.filter((c) => !found.has(c.basename)).map((c) => c.basename);
        if (missing.length)
            throw new Error(`Missing cities: ${missing.join(", ")}`);
    }
    cityFeatures.sort((a, b) => a.properties.name.localeCompare(b.properties.name));
    const citiesCollection = { type: "FeatureCollection", features: cityFeatures };
    writeFileSync(join(mapsDir, "oregon-state.topojson"), JSON.stringify(toTopo(stateGeo, "state")));
    writeFileSync(join(mapsDir, "oregon-cities.topojson"), JSON.stringify(toTopo(citiesCollection, "cities")));
    const metadata = {
        id: "OR",
        name: "Oregon",
        capital: "salem-or",
        mapFiles: { state: "/maps/oregon-state.topojson", cities: "/maps/oregon-cities.topojson" },
        cities: cityFeatures.map((f) => ({ ...f.properties })),
    };
    writeFileSync(join(dataDir, "oregon.json"), JSON.stringify(metadata, null, 2));
    console.log(`Done: ${cityFeatures.length} cities`);
}
main().catch((err) => { console.error(err); process.exit(1); });
