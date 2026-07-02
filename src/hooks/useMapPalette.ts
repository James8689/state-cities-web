import { getMapTheme } from "../progress/storage";
import { getMapPalette, type MapPalette } from "../utils/mapTheme";

export function useMapPalette(): MapPalette {
  return getMapPalette(getMapTheme());
}
