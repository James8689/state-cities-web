export interface MapPalette {
  water: string;
  waterGrid: string;
  waterGridSize: number;
  land: string;
  landStroke: string;
  landStrokeWidth: number;
  river: string;
  lakeFill: string;
  lakeStroke: string;
  mountain: string;
  mountainSnow: string;
  cityFill: string;
  cityStroke: string;
  cityStrokeWidth: number;
  correct: string;
  wrong: string;
  hint: string;
  feedbackStroke: string;
  markerFill: string;
  markerStroke: string;
}

export type MapThemeId = "classic" | "midnight" | "paper";

export interface MapThemeDefinition {
  id: MapThemeId;
  label: string;
  description: string;
  /** Minimum player level to earn this theme (0 = default at start). */
  unlockLevel: number;
  palette: MapPalette;
}

export const MAP_THEMES: Record<MapThemeId, MapThemeDefinition> = {
  classic: {
    id: "classic",
    label: "Classic teal",
    description: "The default map look.",
    unlockLevel: 1,
    palette: {
      water: "#4f949f",
      waterGrid: "rgba(255, 255, 255, 0.14)",
      waterGridSize: 28,
      land: "#46a05b",
      landStroke: "#34864a",
      landStrokeWidth: 1.25,
      river: "#6ea9c9",
      lakeFill: "#8ec4d6",
      lakeStroke: "#6ea9c9",
      mountain: "#7a6a4f",
      mountainSnow: "#f4f7f8",
      cityFill: "#54a868",
      cityStroke: "#2f7a43",
      cityStrokeWidth: 1,
      correct: "#16a34a",
      wrong: "#ef4444",
      hint: "#2563eb",
      feedbackStroke: "#ffffff",
      markerFill: "#ffffff",
      markerStroke: "#234b2c",
    },
  },
  midnight: {
    id: "midnight",
    label: "Midnight",
    description: "Deep blues for late-night map runs.",
    unlockLevel: 2,
    palette: {
      water: "#1a3a4a",
      waterGrid: "rgba(255, 255, 255, 0.08)",
      waterGridSize: 28,
      land: "#2d6b4a",
      landStroke: "#1f4d36",
      landStrokeWidth: 1.25,
      river: "#3d7a9e",
      lakeFill: "#4a8fb0",
      lakeStroke: "#3d7a9e",
      mountain: "#5c5040",
      mountainSnow: "#c8d4dc",
      cityFill: "#3d8f5c",
      cityStroke: "#1f5c38",
      cityStrokeWidth: 1,
      correct: "#22c55e",
      wrong: "#f87171",
      hint: "#60a5fa",
      feedbackStroke: "#ffffff",
      markerFill: "#f8fafc",
      markerStroke: "#0f172a",
    },
  },
  paper: {
    id: "paper",
    label: "Paper atlas",
    description: "Muted parchment tones.",
    unlockLevel: 3,
    palette: {
      water: "#9cb4c4",
      waterGrid: "rgba(255, 255, 255, 0.35)",
      waterGridSize: 28,
      land: "#8faa6e",
      landStroke: "#6d8a52",
      landStrokeWidth: 1.25,
      river: "#7aa3b8",
      lakeFill: "#a8c6d4",
      lakeStroke: "#7aa3b8",
      mountain: "#8a7a62",
      mountainSnow: "#f5f0e6",
      cityFill: "#7fa862",
      cityStroke: "#4f6e3a",
      cityStrokeWidth: 1,
      correct: "#15803d",
      wrong: "#dc2626",
      hint: "#1d4ed8",
      feedbackStroke: "#ffffff",
      markerFill: "#fffef8",
      markerStroke: "#3d4a32",
    },
  },
};

export const DEFAULT_MAP_THEME: MapThemeId = "classic";

export function getMapThemeDefinition(id: MapThemeId): MapThemeDefinition {
  return MAP_THEMES[id] ?? MAP_THEMES.classic;
}

export function themesUnlockedAtLevel(level: number): MapThemeId[] {
  return (Object.values(MAP_THEMES) as MapThemeDefinition[])
    .filter((theme) => level >= theme.unlockLevel)
    .map((theme) => theme.id);
}
