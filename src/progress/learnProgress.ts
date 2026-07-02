import { getRegionById, getRegionForState, REGIONS } from "../data/regions";
import { getStateBundle } from "../data/states";
import type { LearnZoneId } from "../data/learnZones";
import { getFocusRegionId } from "./regionProgress";
import { getTierProgress } from "./stateSummary";
import { getHomeStateId, loadProgress } from "./storage";

/**
 * Where the Learn card should send the player:
 *  - "state":  they haven't mastered the target state yet → open that state.
 *  - "region": they've mastered the target state → open a region list and
 *              recommend the next state (in their home region, or a new region).
 */
export type LearnNavLevel = "state" | "region";

export interface LearnNavigation {
  level: LearnNavLevel;
  /** The region to show when level === "region". */
  regionId: string;
  /** The state to open ("state") or to highlight as recommended ("region"). */
  stateId: string;
  suggestedStateId: string | null;
  suggestedRegionId: string | null;
}

export function buildLearnZoneKey(stateId: string, zoneId: LearnZoneId): string {
  return `${stateId.toUpperCase()}:learn:${zoneId}`;
}

export function getLearnZoneBest(stateId: string, zoneId: LearnZoneId): number | null {
  const key = buildLearnZoneKey(stateId, zoneId);
  const score = loadProgress().learnZoneBests?.[key];
  return score === undefined ? null : score;
}

export function isLearnZoneCompleted(stateId: string, zoneId: LearnZoneId): boolean {
  const list = loadProgress().learnZonesCompleted?.[stateId.toUpperCase()] ?? [];
  return list.includes(zoneId);
}

/** "Mastered" = Gold on the Full-state quiz (the whole state learned). */
export function isStateMastered(stateId: string): boolean {
  if (!getStateBundle(stateId)) return false;
  return getTierProgress(stateId, "full").badge === "gold";
}

export function isRegionMastered(regionId: string): boolean {
  const region = getRegionById(regionId);
  if (!region) return false;
  const playable = region.states.filter((usps) => getStateBundle(usps));
  if (playable.length === 0) return false;
  return playable.every((usps) => isStateMastered(usps));
}

/** The player's explicitly chosen home state — never inferred from last played. */
export function getLearnHomeStateId(): string | null {
  const stored = getHomeStateId();
  if (!stored || !getStateBundle(stored)) return null;
  return stored;
}

/** First not-yet-mastered state in a region (the one to recommend learning next). */
function recommendStateInRegion(regionId: string, excludeStateId?: string): string | null {
  const region = getRegionById(regionId);
  if (!region) return null;
  for (const usps of region.states) {
    if (!getStateBundle(usps)) continue;
    if (usps === excludeStateId) continue;
    if (!isStateMastered(usps)) return usps;
  }
  // Everything mastered (or only the excluded one left) → first other playable state.
  for (const usps of region.states) {
    if (!getStateBundle(usps)) continue;
    if (usps === excludeStateId) continue;
    return usps;
  }
  return null;
}

/** Next region (after the given one) that still has states left to master. */
function nextRegionToLearn(afterRegionId: string): string | null {
  const startIdx = REGIONS.findIndex((r) => r.id === afterRegionId);
  for (let i = 1; i <= REGIONS.length; i++) {
    const region = REGIONS[(startIdx + i) % REGIONS.length];
    if (!region) continue;
    if (!isRegionMastered(region.id)) return region.id;
  }
  return null;
}

/**
 * Decide where the Learn card goes, following the player's progression:
 *   home state not mastered → that state
 *   home state mastered, home region not → recommend another state in that region
 *   home state + region mastered → a new region, recommend a state within it
 */
export function resolveLearnNavigation(): LearnNavigation {
  const home = getLearnHomeStateId() ?? "OR";
  const homeRegionId = getRegionForState(home)?.id ?? getFocusRegionId();

  if (!isStateMastered(home)) {
    return {
      level: "state",
      regionId: homeRegionId,
      stateId: home,
      suggestedStateId: null,
      suggestedRegionId: null,
    };
  }

  if (!isRegionMastered(homeRegionId)) {
    const suggested = recommendStateInRegion(homeRegionId, home);
    return {
      level: "region",
      regionId: homeRegionId,
      stateId: suggested ?? home,
      suggestedStateId: suggested,
      suggestedRegionId: null,
    };
  }

  const nextRegionId = nextRegionToLearn(homeRegionId) ?? homeRegionId;
  const suggested = recommendStateInRegion(nextRegionId);
  return {
    level: "region",
    regionId: nextRegionId,
    stateId: suggested ?? home,
    suggestedStateId: suggested,
    suggestedRegionId: nextRegionId,
  };
}

export interface LearnHubSummary {
  stateId: string;
  stateName: string;
  regionName: string;
  level: LearnNavLevel;
  needsHomeState: boolean;
  /** e.g. "Learn · California" */
  label: string;
  /** e.g. "2 of 5 areas done" */
  headline: string;
  areasCompleted: number;
  areasTotal: number;
  showAreaProgress: boolean;
  cta: string;
}

function getKnownLearnZoneIds(stateId: string): LearnZoneId[] | null {
  const ids = loadProgress().learnZoneIdsByState?.[stateId.toUpperCase()];
  return ids && ids.length > 0 ? ids : null;
}

function learnAreaCounts(stateId: string): { completed: number; total: number } {
  const knownIds = getKnownLearnZoneIds(stateId);
  const completedList = loadProgress().learnZonesCompleted?.[stateId.toUpperCase()] ?? [];
  if (knownIds && knownIds.length > 0) {
    const completed = knownIds.filter((id) => completedList.includes(id)).length;
    return { completed, total: knownIds.length };
  }
  return { completed: completedList.length, total: 0 };
}

/** True when the player hasn't explicitly chosen a home state yet. */
export function learnNeedsHomeState(): boolean {
  return !getLearnHomeStateId();
}

export function getLearnHubSummary(): LearnHubSummary {
  if (learnNeedsHomeState()) {
    return {
      stateId: "",
      stateName: "",
      regionName: "",
      level: "state",
      needsHomeState: true,
      label: "Learn",
      headline: "Choose your home state",
      areasCompleted: 0,
      areasTotal: 0,
      showAreaProgress: false,
      cta: "Pick state",
    };
  }

  const nav = resolveLearnNavigation();
  const region = getRegionById(nav.regionId);
  const target = getStateBundle(nav.stateId);

  if (nav.level === "state") {
    const areas = learnAreaCounts(nav.stateId);
    const stateName = target?.meta.name ?? "your state";
    let headline: string;
    if (areas.total > 0) {
      headline = `${areas.completed} of ${areas.total} areas done`;
    } else if (areas.completed > 0) {
      headline = `${areas.completed} area${areas.completed === 1 ? "" : "s"} tried`;
    } else {
      headline = "Explore by map area";
    }
    return {
      stateId: nav.stateId,
      stateName,
      regionName: region?.shortName ?? "",
      level: nav.level,
      needsHomeState: false,
      label: `Learn · ${stateName}`,
      headline,
      areasCompleted: areas.completed,
      areasTotal: areas.total,
      showAreaProgress: areas.total > 0,
      cta: "Pick area",
    };
  }

  const stateName = target?.meta.name ?? "";
  const regionLabel = region?.shortName ?? "Region";
  return {
    stateId: nav.stateId,
    stateName,
    regionName: regionLabel,
    level: nav.level,
    needsHomeState: false,
    label: `Learn · ${regionLabel}`,
    headline: stateName ? `Next: ${stateName}` : "Pick your next state",
    areasCompleted: 0,
    areasTotal: 0,
    showAreaProgress: false,
    cta: "Pick state",
  };
}

/** States in a region with learn/mastery context, recommended one first. */
export interface LearnRegionState {
  stateId: string;
  stateName: string;
  mastered: boolean;
  suggested: boolean;
}

export function getLearnRegionStates(
  regionId: string,
  suggestedStateId: string | null,
): LearnRegionState[] {
  const region = getRegionById(regionId);
  if (!region) return [];

  const rows: LearnRegionState[] = [];
  for (const usps of region.states) {
    const bundle = getStateBundle(usps);
    if (!bundle) continue;
    rows.push({
      stateId: bundle.meta.id,
      stateName: bundle.meta.name,
      mastered: isStateMastered(usps),
      suggested: usps === suggestedStateId,
    });
  }

  rows.sort((a, b) => {
    if (a.suggested !== b.suggested) return a.suggested ? -1 : 1;
    if (a.mastered !== b.mastered) return a.mastered ? 1 : -1;
    return a.stateName.localeCompare(b.stateName);
  });

  return rows;
}

export function getSuggestedStateForRegion(regionId: string): string | null {
  return recommendStateInRegion(regionId);
}
