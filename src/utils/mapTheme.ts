import { MAP_THEMES } from "../data/mapThemes";
import type { MapPalette } from "../data/mapThemes";

export type { MapPalette } from "../data/mapThemes";

export const MAP_OPACITY = {
  river: 0.5,
  lake: 0.6,
  mountain: 0.35,
} as const;

/** Default classic palette — prefer getMapPalette() for themed maps. */
export const MAP_COLORS: MapPalette = MAP_THEMES.classic.palette;

export function getMapPalette(themeId: keyof typeof MAP_THEMES = "classic"): MapPalette {
  return MAP_THEMES[themeId]?.palette ?? MAP_COLORS;
}
