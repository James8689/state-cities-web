import { STATES } from "./states";
import type { CityMeta } from "../types/quiz";

export const NATIONAL_QUIZ_SIZE = 100;

export interface NationalQuizCity extends CityMeta {
  stateId: string;
  stateName: string;
}

let cachedTop100: NationalQuizCity[] | null = null;

/** Top 100 US cities by population from curated state city lists. */
export function getNationalQuizCities(): NationalQuizCity[] {
  if (cachedTop100) return cachedTop100;

  const all: NationalQuizCity[] = [];
  for (const bundle of STATES) {
    for (const city of bundle.meta.cities) {
      all.push({
        ...city,
        stateId: bundle.meta.id,
        stateName: bundle.meta.name,
      });
    }
  }

  cachedTop100 = all
    .sort((a, b) => b.population - a.population)
    .slice(0, NATIONAL_QUIZ_SIZE);

  return cachedTop100;
}

export function findCityStateId(cityId: string): string | null {
  for (const bundle of STATES) {
    if (bundle.meta.cities.some((c) => c.id === cityId)) {
      return bundle.meta.id;
    }
  }
  return null;
}

export function citiesSpanMultipleStates(cities: CityMeta[]): boolean {
  const states = new Set<string>();
  for (const city of cities) {
    const usps = findCityStateId(city.id);
    if (usps) states.add(usps);
    if (states.size > 1) return true;
  }
  return false;
}

export function enrichCitiesWithState(cities: CityMeta[]): NationalQuizCity[] {
  return cities.map((city) => {
    for (const bundle of STATES) {
      const match = bundle.meta.cities.find((c) => c.id === city.id);
      if (match) {
        return {
          ...match,
          stateId: bundle.meta.id,
          stateName: bundle.meta.name,
        };
      }
    }
    return { ...city, stateId: "", stateName: "" };
  });
}
