export type Screen =
  | "onboarding"
  | "hub"
  | "select"
  | "journey"
  | "stateHome"
  | "learn"
  | "learnRegion"
  | "customSelect"
  | "quiz"
  | "results";

/** How the player answers: tap the map or type the city name. */
export type QuizPlayMode = "tap" | "type";

/** Tracked tier quiz, daily challenge, custom subset, learn area, practice, regional mix, or national Top 100. */
export type QuizKind = "major" | "full" | "custom" | "daily" | "learn" | "practice" | "regional" | "national";

/** Quiz kind that practice sessions can belong to without updating its score. */
export type ParentQuizKind = "major" | "full" | "daily";

export type MasteryBadge = "none" | "bronze" | "silver" | "gold";

/** Speed tier earned at 100% accuracy within time thresholds (tap + type tiers). */
export type SpeedBadge = "none" | "quick-draw" | "speed-run" | "lightning";

export interface CityMeta {
  id: string;
  geoid: string;
  name: string;
  population: number;
  tier: 1 | 2;
}

export interface StateMeta {
  id: string;
  name: string;
  capital: string;
  mapFiles: { state: string; cities: string; water?: string };
  cities: CityMeta[];
}

export type CityHighlight = "default" | "hint" | "correct" | "wrong";

export interface Peak {
  name: string;
  range: string;
  coordinates: [number, number];
}

/** Build-time + render config for one state. Lives in the state registry. */
export interface StateCityConfig {
  /** Exact Census TIGER BASENAME — used only to fetch geometry. */
  basename: string;
  /** Optional display override; otherwise the build script derives a common name. */
  name?: string;
  tier: 1 | 2;
}

export interface StateConfig {
  usps: string; // two-letter code, e.g. "OR"
  fips: string; // Census FIPS, e.g. "41"
  name: string; // e.g. "Oregon"
  capital: string; // city id slug of the capital
  slug: string; // file slug for generated map data, e.g. "oregon"
  cities: StateCityConfig[]; // curated quiz cities (fetched from Census)
  peaks: Peak[]; // curated mountain glyphs for context
}

/** App-side bundle: generated metadata + render-only peaks. */
export interface StateBundle {
  meta: StateMeta;
  peaks: Peak[];
}

export interface QuizResult {
  score: number;
  total: number;
  points: number;
  firstTry: number;
  missed: CityMeta[];
  /** Wall-clock time from quiz start to finish (ms). */
  elapsedMs: number;
}
