import { PLAYABLE_TIERS } from "../data/tiers";
import { buildQuizKey } from "./quizKey";
import { getBestScore, getBestTime, getMasteryBadge, getSpeedBadge } from "./storage";
import type { MasteryBadge } from "../types/quiz";

export interface StateMasterySummary {
  tiersMastered: number;
  tierCount: number;
  highestBadge: MasteryBadge;
  /** Both Major and Full tiers at 100% (gold). */
  fullyMastered: boolean;
}

const BADGE_RANK: Record<MasteryBadge, number> = {
  none: 0,
  bronze: 1,
  silver: 2,
  gold: 3,
};

/** Negative if `a` should appear before `b` when sorting most-mastered first. */
export function compareStatesByMasteryDesc(aId: string, bId: string): number {
  const aM = getStateMasterySummary(aId);
  const bM = getStateMasterySummary(bId);
  if (aM.fullyMastered !== bM.fullyMastered) {
    return Number(bM.fullyMastered) - Number(aM.fullyMastered);
  }
  if (aM.tiersMastered !== bM.tiersMastered) {
    return bM.tiersMastered - aM.tiersMastered;
  }
  if (BADGE_RANK[aM.highestBadge] !== BADGE_RANK[bM.highestBadge]) {
    return BADGE_RANK[bM.highestBadge] - BADGE_RANK[aM.highestBadge];
  }
  return 0;
}

export function badgeRank(badge: MasteryBadge): number {
  return BADGE_RANK[badge];
}

/** Both Major and Full tiers at 100% accuracy. */
export function isStateFullyMastered(stateId: string): boolean {
  return PLAYABLE_TIERS.every(
    (tier) => getMasteryBadge(buildQuizKey(stateId, tier.id)) === "gold",
  );
}

export function getStateMasterySummary(stateId: string): StateMasterySummary {
  let tiersMastered = 0;
  let highestBadge: MasteryBadge = "none";

  for (const tier of PLAYABLE_TIERS) {
    const key = buildQuizKey(stateId, tier.id);
    const badge = getMasteryBadge(key);
    if (badge !== "none") tiersMastered += 1;
    if (BADGE_RANK[badge] > BADGE_RANK[highestBadge]) highestBadge = badge;
  }

  return {
    tiersMastered,
    tierCount: PLAYABLE_TIERS.length,
    highestBadge,
    fullyMastered: isStateFullyMastered(stateId),
  };
}

export function getTierProgress(stateId: string, tierId: "major" | "full", playMode: "tap" | "type" = "tap") {
  const key = buildQuizKey(stateId, tierId, playMode);
  return {
    best: getBestScore(key),
    badge: getMasteryBadge(key),
    speedBadge: getSpeedBadge(key),
    bestTimeMs: getBestTime(key),
  };
}
