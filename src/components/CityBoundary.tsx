import { Geography } from "react-simple-maps";
import type { CityHighlight } from "../types/quiz";
import { MAP_COLORS } from "../utils/mapTheme";

interface CityBoundaryProps {
  geo: {
    rsmKey: string;
    properties: Record<string, unknown>;
    geometry: GeoJSON.Geometry;
  };
  highlight: CityHighlight;
}

export function CityBoundary({ geo, highlight }: CityBoundaryProps) {
  let fill: string = MAP_COLORS.cityFill;
  let stroke: string = MAP_COLORS.cityStroke;
  let strokeWidth: number = MAP_COLORS.cityStrokeWidth;

  if (highlight === "correct") {
    fill = MAP_COLORS.correct;
    stroke = MAP_COLORS.feedbackStroke;
    strokeWidth = 2;
  } else if (highlight === "hint") {
    fill = MAP_COLORS.hint;
    stroke = MAP_COLORS.feedbackStroke;
    strokeWidth = 2;
  } else if (highlight === "wrong") {
    fill = MAP_COLORS.wrong;
    stroke = MAP_COLORS.feedbackStroke;
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
