import { geoContains } from "d3-geo";
import type { Feature, MultiPolygon, Polygon } from "geojson";

export function isPointInCity(
  lng: number,
  lat: number,
  feature: Feature<Polygon | MultiPolygon>,
): boolean {
  return geoContains(feature, [lng, lat]);
}
