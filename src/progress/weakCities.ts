import { STATES } from "../data/states";
import type { CityMeta } from "../types/quiz";
import { loadProgress, saveProgress } from "./storage";

export interface WeakCityEntry {
  cityId: string;
  name: string;
  stateId: string;
  stateName: string;
  missCount: number;
}

export function recordWeakCityMisses(cities: CityMeta[]): void {
  if (cities.length === 0) return;
  const data = loadProgress();
  if (!data.weakCities) data.weakCities = {};

  for (const city of cities) {
    data.weakCities[city.id] = (data.weakCities[city.id] ?? 0) + 1;
  }
  saveProgress(data);
}

export function getTopWeakCities(limit = 8): WeakCityEntry[] {
  const data = loadProgress();
  const counts = data.weakCities ?? {};
  const entries: WeakCityEntry[] = [];

  for (const [cityId, missCount] of Object.entries(counts)) {
    if (missCount <= 0) continue;
    for (const bundle of STATES) {
      const city = bundle.meta.cities.find((c) => c.id === cityId);
      if (city) {
        entries.push({
          cityId,
          name: city.name,
          stateId: bundle.meta.id,
          stateName: bundle.meta.name,
          missCount,
        });
        break;
      }
    }
  }

  return entries.sort((a, b) => b.missCount - a.missCount).slice(0, limit);
}

export function weakCitiesToPractice(limit = 8): CityMeta[] {
  return getTopWeakCities(limit).map((e) => {
    const bundle = STATES.find((s) => s.meta.id === e.stateId);
    const city = bundle?.meta.cities.find((c) => c.id === e.cityId);
    return city ?? { id: e.cityId, geoid: "", name: e.name, population: 0, tier: 2 as const };
  });
}
