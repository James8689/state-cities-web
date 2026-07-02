import { getRegionById, getRegionForState } from "../data/regions";
import { STATES, getStateBundle } from "../data/states";
import type { StateBundle } from "../types/quiz";
import { loadProgress } from "./storage";
import {
  badgeRank,
  compareStatesByMasteryDesc,
  getStateMasterySummary,
} from "./stateSummary";

/** Least mastered among states with any progress (tiersMastered > 0). */
export function findWeakestStartedState(): string | null {
  let anchor: { id: string; tiers: number; badge: number } | null = null;

  for (const bundle of STATES) {
    const mastery = getStateMasterySummary(bundle.meta.id);
    if (mastery.tiersMastered === 0) continue;

    const rank = badgeRank(mastery.highestBadge);
    if (
      !anchor ||
      mastery.tiersMastered < anchor.tiers ||
      (mastery.tiersMastered === anchor.tiers && rank < anchor.badge)
    ) {
      anchor = { id: bundle.meta.id, tiers: mastery.tiersMastered, badge: rank };
    }
  }

  return anchor?.id ?? null;
}

function firstUnmasteredAfterInRegion(regionId: string, afterStateId: string): string | null {
  const region = getRegionById(regionId);
  if (!region) return null;

  const ordered = region.states.filter((usps) => getStateBundle(usps));
  const anchorIdx = ordered.indexOf(afterStateId);
  if (anchorIdx === -1) return null;

  for (let i = anchorIdx + 1; i < ordered.length; i++) {
    if (getStateMasterySummary(ordered[i]!).tiersMastered === 0) return ordered[i]!;
  }
  for (let i = 0; i < anchorIdx; i++) {
    if (getStateMasterySummary(ordered[i]!).tiersMastered === 0) return ordered[i]!;
  }
  return null;
}

function firstUnmasteredInRegion(regionId: string): string | null {
  const region = getRegionById(regionId);
  if (!region) return null;

  for (const usps of region.states) {
    if (!getStateBundle(usps)) continue;
    if (getStateMasterySummary(usps).tiersMastered === 0) return usps;
  }
  return null;
}

function resolveGuidanceRegion(anchorId: string | null): string {
  if (anchorId) {
    const region = getRegionForState(anchorId);
    if (region) return region.id;
  }
  const data = loadProgress();
  if (data.focusRegionId && getRegionById(data.focusRegionId)) {
    return data.focusRegionId;
  }
  if (data.lastSession) {
    const region = getRegionForState(data.lastSession.stateId);
    if (region) return region.id;
  }
  return "northeast";
}

/**
 * Among completely unmastered states, the one to study next: first unstarted
 * state in regional order after the player's weakest in-progress state.
 */
export function getSuggestedNextStudyState(): string | null {
  const anchor = findWeakestStartedState();
  const regionId = resolveGuidanceRegion(anchor);

  if (anchor) {
    const next = firstUnmasteredAfterInRegion(regionId, anchor);
    if (next) return next;
  }

  return firstUnmasteredInRegion(regionId);
}

export interface ProgressSortedStates {
  states: StateBundle[];
  suggestedStateId: string | null;
}

/** Most mastered first; unmastered tail puts the suggested next study state on top. */
export function sortStatesByProgress(): ProgressSortedStates {
  const suggestedStateId = getSuggestedNextStudyState();

  const states = [...STATES].sort((a, b) => {
    const masteryCmp = compareStatesByMasteryDesc(a.meta.id, b.meta.id);
    if (masteryCmp !== 0) return masteryCmp;

    const aM = getStateMasterySummary(a.meta.id);
    const bM = getStateMasterySummary(b.meta.id);

    if (aM.tiersMastered === 0 && bM.tiersMastered === 0 && suggestedStateId) {
      if (a.meta.id === suggestedStateId) return -1;
      if (b.meta.id === suggestedStateId) return 1;
    }

    return a.meta.name.localeCompare(b.meta.name);
  });

  return { states, suggestedStateId };
}
