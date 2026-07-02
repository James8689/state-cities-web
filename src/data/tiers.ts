import type { CityMeta, StateMeta } from "../types/quiz";

/** Playable difficulty tiers (Phase 2b adds expanded / deep). */
export type TierId = "major" | "full";

export interface TierDefinition {
  id: TierId;
  label: string;
  description: string;
}

export const PLAYABLE_TIERS: TierDefinition[] = [
  {
    id: "major",
    label: "Major cities",
    description: "Top 10 by population",
  },
  {
    id: "full",
    label: "Full state",
    description: "All curated cities",
  },
];

const MAJOR_CITY_COUNT = 10;

/** Cities included in a tier quiz. Major = top N by population. */
export function getCitiesForTier(state: StateMeta, tierId: TierId): CityMeta[] {
  if (tierId === "full") return state.cities;
  return [...state.cities]
    .sort((a, b) => b.population - a.population)
    .slice(0, MAJOR_CITY_COUNT);
}

export function getTierLabel(tierId: TierId): string {
  return PLAYABLE_TIERS.find((t) => t.id === tierId)?.label ?? tierId;
}
