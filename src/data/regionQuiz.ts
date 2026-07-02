import { getRegionById } from "./regions";
import { getStateBundle } from "./states";
import { getCitiesForTier } from "./tiers";
import { buildQuizKey } from "../progress/quizKey";
import { getMasteryBadge } from "../progress/storage";
import type { CityMeta } from "../types/quiz";

export interface RegionQuizCity extends CityMeta {
  stateId: string;
  stateName: string;
}

/** Major cities from each started state in the region (for mixed regional quiz). */
export function getRegionQuizCities(regionId: string): RegionQuizCity[] {
  const region = getRegionById(regionId);
  if (!region) return [];

  const cities: RegionQuizCity[] = [];
  for (const usps of region.states) {
    const bundle = getStateBundle(usps);
    if (!bundle) continue;

    const started =
      getMasteryBadge(buildQuizKey(usps, "major")) !== "none" ||
      getMasteryBadge(buildQuizKey(usps, "full")) !== "none";
    if (!started) continue;

    for (const city of getCitiesForTier(bundle.meta, "major")) {
      cities.push({
        ...city,
        stateId: usps,
        stateName: bundle.meta.name,
      });
    }
  }
  return cities;
}
