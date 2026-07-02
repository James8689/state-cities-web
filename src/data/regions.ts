/**
 * US regions for chunked campaign progression. Every state appears exactly once.
 */
export interface Region {
  id: string;
  name: string;
  shortName: string;
  states: string[];
}

export const REGIONS: Region[] = [
  {
    id: "northeast",
    name: "Northeast",
    shortName: "Northeast",
    states: ["CT", "DE", "MA", "MD", "ME", "NH", "NJ", "NY", "PA", "RI", "VT"],
  },
  {
    id: "southeast",
    name: "Southeast",
    shortName: "Southeast",
    states: ["AL", "AR", "FL", "GA", "KY", "LA", "MS", "NC", "SC", "TN", "VA", "WV"],
  },
  {
    id: "midwest",
    name: "Midwest",
    shortName: "Midwest",
    states: ["IL", "IN", "IA", "KS", "MI", "MN", "MO", "NE", "ND", "OH", "SD", "WI"],
  },
  {
    id: "southwest",
    name: "Southwest",
    shortName: "Southwest",
    states: ["AZ", "NM", "OK", "TX"],
  },
  {
    id: "mountain-west",
    name: "Mountain West",
    shortName: "Mountains",
    states: ["CO", "ID", "MT", "NV", "UT", "WY"],
  },
  {
    id: "west-coast",
    name: "West Coast",
    shortName: "West Coast",
    states: ["CA", "OR", "WA"],
  },
  {
    id: "pacific",
    name: "Pacific",
    shortName: "Pacific",
    states: ["AK", "HI"],
  },
];

const REGION_BY_STATE = new Map<string, Region>();
for (const region of REGIONS) {
  for (const usps of region.states) {
    REGION_BY_STATE.set(usps, region);
  }
}

export function getRegionForState(usps: string): Region | undefined {
  return REGION_BY_STATE.get(usps.toUpperCase());
}

export function getRegionById(id: string): Region | undefined {
  return REGIONS.find((r) => r.id === id);
}
