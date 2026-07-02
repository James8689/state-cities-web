/** Layered map palette: water -> state -> terrain -> cities -> markers.
 * Muted, flat tones inspired by Seterra for a cleaner, less juvenile look. */
export const MAP_COLORS = {
  water: "#4f949f",
  waterGrid: "rgba(255, 255, 255, 0.14)",
  waterGridSize: 28,
  land: "#46a05b",
  landStroke: "#34864a",
  landStrokeWidth: 1.25,
  // subtle physical context
  river: "#6ea9c9",
  lakeFill: "#8ec4d6",
  lakeStroke: "#6ea9c9",
  mountain: "#7a6a4f",
  mountainSnow: "#f4f7f8",
  // city polygons
  cityFill: "#54a868",
  cityStroke: "#2f7a43",
  cityStrokeWidth: 1,
  // feedback states (shared by polygons + dots)
  correct: "#16a34a",
  wrong: "#ef4444",
  hint: "#2563eb",
  feedbackStroke: "#ffffff",
  // markers (dots)
  markerFill: "#ffffff",
  markerStroke: "#234b2c",
} as const;

export const MAP_OPACITY = {
  river: 0.5,
  lake: 0.6,
  mountain: 0.35,
} as const;
