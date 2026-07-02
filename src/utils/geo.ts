import { geoAlbers, geoBounds, geoCentroid, type GeoProjection } from "d3-geo";
import type { FeatureCollection } from "geojson";

const PADDING = 4;

/**
 * Builds an Albers projection tuned to a single state, derived entirely from
 * the state's own geometry so it works for any of the 50 states without manual
 * tuning:
 *  - rotate puts the central meridian at the state's centroid longitude
 *  - center sets the latitude of focus to the centroid
 *  - standard parallels are placed at 1/6 and 5/6 of the latitude span
 *  - fitExtent scales/translates it to fill the container
 */
export function createStateProjection(
  width: number,
  height: number,
  stateGeo: FeatureCollection,
): GeoProjection {
  const feature = stateGeo.features[0];
  const [centerLon, centerLat] = feature ? geoCentroid(feature) : [-120.5, 44.1];

  let south = centerLat - 2;
  let north = centerLat + 2;
  if (feature) {
    const [[, s], [, n]] = geoBounds(feature);
    south = s;
    north = n;
  }
  const span = Math.max(north - south, 0.5);

  const projection = geoAlbers()
    .rotate([-centerLon, 0])
    .center([0, centerLat])
    .parallels([south + span / 6, north - span / 6]);

  projection.fitExtent(
    [
      [PADDING, PADDING],
      [width - PADDING, height - PADDING],
    ],
    stateGeo,
  );

  return projection;
}

/** Multi-state bounds — for regional quiz maps. */
export function createRegionProjection(
  width: number,
  height: number,
  regionGeo: FeatureCollection,
): GeoProjection {
  if (regionGeo.features.length === 0) {
    return createStateProjection(width, height, regionGeo);
  }

  const [[west, south], [east, north]] = geoBounds(regionGeo);
  const centerLon = (west + east) / 2;
  const centerLat = (south + north) / 2;
  const span = Math.max(north - south, 0.5);

  const projection = geoAlbers()
    .rotate([-centerLon, 0])
    .center([0, centerLat])
    .parallels([south + span / 6, north - span / 6]);

  projection.fitExtent(
    [
      [PADDING, PADDING],
      [width - PADDING, height - PADDING],
    ],
    regionGeo,
  );

  return projection;
}

export function getRegionCenter(regionGeo: FeatureCollection): [number, number] {
  if (regionGeo.features.length === 0) return [-98, 39];
  const c = geoCentroid(regionGeo);
  return [c[0], c[1]];
}

export function getStateCenter(stateGeo: FeatureCollection): [number, number] {
  const stateFeature = stateGeo.features[0];
  if (!stateFeature) return [-120.5, 44.1];
  const c = geoCentroid(stateFeature);
  return [c[0], c[1]];
}
