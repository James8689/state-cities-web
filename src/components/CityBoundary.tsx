import { Geography } from "react-simple-maps";
import type { CityHighlight } from "../types/quiz";
import type { MapPalette } from "../data/mapThemes";
import { MAP_COLORS as DEFAULT_PALETTE } from "../utils/mapTheme";

interface CityBoundaryProps {
  geo: {
    rsmKey: string;
    properties: Record<string, unknown>;
    geometry: GeoJSON.Geometry;
  };
  highlight: CityHighlight;
  palette?: MapPalette;
}

export function CityBoundary({ geo, highlight, palette = DEFAULT_PALETTE }: CityBoundaryProps) {
  let fill: string = palette.cityFill;
  let stroke: string = palette.cityStroke;
  let strokeWidth: number = palette.cityStrokeWidth;

  if (highlight === "correct") {
    fill = palette.correct;
    stroke = palette.feedbackStroke;
    strokeWidth = 2;
  } else if (highlight === "hint") {
    fill = palette.hint;
    stroke = palette.feedbackStroke;
    strokeWidth = 2;
  } else if (highlight === "wrong") {
    fill = palette.wrong;
    stroke = palette.feedbackStroke;
    strokeWidth = 2;
  }

  return (
    <Geography
      geography={geo}
      style={{
        default: { fill, stroke, strokeWidth, pointerEvents: "none" },
        hover: { fill, stroke, strokeWidth, pointerEvents: "none" },
        pressed: { fill, pointerEvents: "none" },
      }}
    />
  );
}
