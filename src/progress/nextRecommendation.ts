import { getRegionById, REGIONS } from "../data/regions";
import { getTierLabel, PLAYABLE_TIERS, type TierId } from "../data/tiers";
import { STATES, getStateBundle } from "../data/states";
import { buildQuizKey, isParentQuizKind } from "./quizKey";
import { getFocusRegionId } from "./regionProgress";
import { getBestScore, getMasteryBadge, hasAnyProgress, loadProgress } from "./storage";
import { getTierProgress } from "./stateSummary";
import type { RecommendationAction } from "./types";

function tierNeedsWork(stateId: string, tierId: TierId): boolean {
  const { best, badge } = getTierProgress(stateId, tierId);
  if (best === null) return true;
  if (badge === "gold") return false;
  return true;
}

function nextTierInState(stateId: string): TierId | null {
  if (tierNeedsWork(stateId, "major")) return "major";
  if (tierNeedsWork(stateId, "full")) return "full";
  return null;
}

function findNextStateInRegion(regionId: string, afterStateId?: string): string | null {
  const region = getRegionById(regionId);
  if (!region) return null;

  const ordered = region.states.filter((usps) => getStateBundle(usps));
  const startIdx =
    afterStateId !== undefined ? Math.max(0, ordered.indexOf(afterStateId) + 1) : 0;

  for (let i = startIdx; i < ordered.length; i++) {
    if (nextTierInState(ordered[i])) return ordered[i];
  }
  for (const usps of ordered) {
    if (nextTierInState(usps)) return usps;
  }
  return null;
}

function resolveFocusRegion(): string {
  return getFocusRegionId();
}

function buildTierRecommendation(
  stateId: string,
  tierId: TierId,
): Extract<RecommendationAction, { type: "start_tier" }> {
  const bundle = getStateBundle(stateId)!;
  const { best, badge } = getTierProgress(stateId, tierId);
  const tierLabel = getTierLabel(tierId);

  let reason: string;
  if (best === null) {
    reason = `Start with ${tierLabel.toLowerCase()}`;
  } else if (badge === "none") {
    reason = `${best}% best — reach 70% for Bronze`;
  } else if (badge === "bronze") {
    reason = `${best}% best — push for Silver (85%)`;
  } else if (badge === "silver") {
    reason = `${best}% best — aim for Gold (100%)`;
  } else {
    reason = `${tierLabel} at Gold — explore more states`;
  }

  return {
    type: "start_tier",
    stateId,
    stateName: bundle.meta.name,
    tierId,
    label: `${bundle.meta.name} · ${tierLabel}`,
    reason,
  };
}

export function getNextRecommendation(options?: {
  skipPractice?: boolean;
}): RecommendationAction {
  if (!hasAnyProgress()) {
    return { type: "pick_start" };
  }

  const data = loadProgress();
  const last = data.lastSession;

  if (
    !options?.skipPractice &&
    last &&
    last.missedCityIds.length > 0 &&
    isParentQuizKind(last.kind)
  ) {
    const bundle = getStateBundle(last.stateId);
    if (bundle) {
      const cities = last.missedCityIds
        .map((id) => bundle.meta.cities.find((c) => c.id === id))
        .filter((c): c is NonNullable<typeof c> => c !== undefined);
      if (cities.length > 0) {
        return {
          type: "practice_missed",
          stateId: last.stateId,
          stateName: bundle.meta.name,
          kind: last.kind,
          cities,
          label: `Practice ${cities.length} missed ${cities.length === 1 ? "city" : "cities"}`,
          reason: `From your last quiz in ${bundle.meta.name}`,
        };
      }
    }
  }

  if (last && last.kind !== "custom") {
    const tierDone = nextTierInState(last.stateId);
    if (tierDone) {
      return buildTierRecommendation(last.stateId, tierDone);
    }
  }

  const regionId = resolveFocusRegion();
  const nextState = findNextStateInRegion(regionId, last?.stateId);
  if (nextState) {
    const tier = nextTierInState(nextState)!;
    const rec = buildTierRecommendation(nextState, tier);
    const region = getRegionById(regionId);
    return {
      ...rec,
      reason: `${region?.name ?? "Region"} · ${rec.reason}`,
    };
  }

  for (const region of REGIONS) {
    const stateId = findNextStateInRegion(region.id);
    if (stateId) {
      const tier = nextTierInState(stateId)!;
      const rec = buildTierRecommendation(stateId, tier);
      return {
        ...rec,
        reason: `${region.name} · ${rec.reason}`,
      };
    }
  }

  if (last && (last.kind === "major" || last.kind === "full")) {
    return buildTierRecommendation(last.stateId, last.kind);
  }

  return { type: "pick_start" };
}

export function getCampaignStats() {
  const data = loadProgress();
  let tiersMastered = 0;
  let tiersTotal = 0;
  const statesTouched = new Set<string>();

  for (const bundle of STATES) {
    for (const tier of PLAYABLE_TIERS) {
      tiersTotal += 1;
      const key = buildQuizKey(bundle.meta.id, tier.id);
      if (getBestScore(key) !== null) statesTouched.add(bundle.meta.id);
      if (getMasteryBadge(key) !== "none") tiersMastered += 1;
    }
  }

  const focusRegion = getRegionById(resolveFocusRegion());
  let regionTiersMastered = 0;
  let regionTiersTotal = 0;
  if (focusRegion) {
    for (const usps of focusRegion.states) {
      for (const tier of PLAYABLE_TIERS) {
        regionTiersTotal += 1;
        if (getMasteryBadge(buildQuizKey(usps, tier.id)) !== "none") {
          regionTiersMastered += 1;
        }
      }
    }
  }

  return {
    points: data.points,
    tiersMastered,
    tiersTotal,
    statesTouched: statesTouched.size,
    focusRegion,
    regionTiersMastered,
    regionTiersTotal,
  };
}

export function pickRandomStateUsps(): string {
  const pool = STATES.map((s) => s.meta.id);
  return pool[Math.floor(Math.random() * pool.length)]!;
}

export { getDailyRegionId, getDailyRegionLabel } from "./dailyChallenge";
