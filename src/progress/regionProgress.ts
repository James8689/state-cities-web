import { REGIONS, getRegionById, getRegionForState } from "../data/regions";
import { PLAYABLE_TIERS } from "../data/tiers";
import { getStateBundle } from "../data/states";
import type { MasteryBadge, QuizPlayMode } from "../types/quiz";
import { buildQuizKey, buildRegionQuizKey } from "./quizKey";
import { getSuggestedNextStudyState } from "./progressGuidance";
import { getBestScore, getMasteryBadge, loadProgress } from "./storage";
import { getStateMasterySummary } from "./stateSummary";

/** States at bronze+ in a region required before regional quiz (Phase 4). */
export const REGIONAL_QUIZ_UNLOCK_COUNT = 3;

export function getFocusRegionId(): string {
  const data = loadProgress();
  if (data.focusRegionId && getRegionById(data.focusRegionId)) {
    return data.focusRegionId;
  }
  if (data.lastSession) {
    const region = getRegionForState(data.lastSession.stateId);
    if (region) return region.id;
  }
  return REGIONS[0]!.id;
}

export interface RegionStateProgress {
  usps: string;
  name: string;
  tiersMastered: number;
  tierCount: number;
  highestBadge: MasteryBadge;
  fullyMastered: boolean;
  touched: boolean;
  suggested: boolean;
}

export interface RegionProgressSummary {
  regionId: string;
  regionName: string;
  shortName: string;
  statesTotal: number;
  statesTouched: number;
  tiersMastered: number;
  tiersTotal: number;
  statesAtBronze: number;
  regionalQuizUnlock: number;
  regionalQuizUnlocked: boolean;
  suggestedStateId: string | null;
  states: RegionStateProgress[];
}

export function getRegionProgress(regionId: string): RegionProgressSummary | null {
  const region = getRegionById(regionId);
  if (!region) return null;

  const suggestedGlobal = getSuggestedNextStudyState();
  const suggestedInRegion =
    suggestedGlobal && getRegionForState(suggestedGlobal)?.id === regionId
      ? suggestedGlobal
      : null;

  let tiersMastered = 0;
  let tiersTotal = 0;
  let statesTouched = 0;
  let statesAtBronze = 0;
  const states: RegionStateProgress[] = [];

  for (const usps of region.states) {
    const bundle = getStateBundle(usps);
    if (!bundle) continue;

    const mastery = getStateMasterySummary(usps);
    let touched = false;

    for (const tier of PLAYABLE_TIERS) {
      tiersTotal += 1;
      const key = buildQuizKey(usps, tier.id);
      if (getMasteryBadge(key) !== "none") tiersMastered += 1;
      if (getBestScore(key) !== null) touched = true;
    }

    if (touched) statesTouched += 1;
    if (mastery.highestBadge !== "none") statesAtBronze += 1;

    states.push({
      usps,
      name: bundle.meta.name,
      tiersMastered: mastery.tiersMastered,
      tierCount: mastery.tierCount,
      highestBadge: mastery.highestBadge,
      fullyMastered: mastery.fullyMastered,
      touched,
      suggested: usps === suggestedInRegion,
    });
  }

  return {
    regionId: region.id,
    regionName: region.name,
    shortName: region.shortName,
    statesTotal: states.length,
    statesTouched,
    tiersMastered,
    tiersTotal,
    statesAtBronze,
    regionalQuizUnlock: REGIONAL_QUIZ_UNLOCK_COUNT,
    regionalQuizUnlocked: statesAtBronze >= REGIONAL_QUIZ_UNLOCK_COUNT,
    suggestedStateId: suggestedInRegion,
    states,
  };
}

export function getFocusRegionProgress(): RegionProgressSummary {
  return getRegionProgress(getFocusRegionId())!;
}

export function getRegionQuizProgress(regionId: string, playMode: QuizPlayMode = "tap") {
  const key = buildRegionQuizKey(regionId, playMode);
  return {
    best: getBestScore(key),
    badge: getMasteryBadge(key),
  };
}
