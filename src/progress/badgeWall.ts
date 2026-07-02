import { PLAYABLE_TIERS, type TierId } from "../data/tiers";
import { STATES } from "../data/states";
import { buildQuizKey } from "./quizKey";
import { getBestScore, getMasteryBadge } from "./storage";
import { getStateMasterySummary } from "./stateSummary";
import { MASTERY_THRESHOLDS, masteryBadgeLabel, nextBadgeTarget } from "./mastery";
import type { MasteryBadge } from "../types/quiz";

const BADGE_RANK: Record<MasteryBadge, number> = {
  none: 0,
  bronze: 1,
  silver: 2,
  gold: 3,
};

export interface EarnedBadgeEntry {
  stateId: string;
  stateName: string;
  tierId: TierId;
  tierLabel: string;
  badge: Exclude<MasteryBadge, "none">;
  best: number | null;
}

export interface StateWallEntry {
  stateId: string;
  stateName: string;
  peakBadge: MasteryBadge;
  primaryTierId: TierId;
}

export interface TierLadderRow {
  badge: Exclude<MasteryBadge, "none">;
  minPct: number;
  earned: boolean;
  hint: string;
}

export interface BadgeProgressDetail {
  stateId: string;
  stateName: string;
  tierId: TierId;
  tierLabel: string;
  currentBadge: MasteryBadge;
  best: number | null;
  ladder: TierLadderRow[];
  chaseLabel: string | null;
}

export function getEarnedBadgeEntries(): EarnedBadgeEntry[] {
  const entries: EarnedBadgeEntry[] = [];

  for (const bundle of STATES) {
    for (const tier of PLAYABLE_TIERS) {
      const badge = getMasteryBadge(buildQuizKey(bundle.meta.id, tier.id));
      if (badge === "none") continue;
      entries.push({
        stateId: bundle.meta.id,
        stateName: bundle.meta.name,
        tierId: tier.id,
        tierLabel: tier.label,
        badge,
        best: getBestScore(buildQuizKey(bundle.meta.id, tier.id)),
      });
    }
  }

  return entries.sort((a, b) => {
    const rankDiff = BADGE_RANK[b.badge] - BADGE_RANK[a.badge];
    if (rankDiff !== 0) return rankDiff;
    return a.stateName.localeCompare(b.stateName);
  });
}

export function getRecentBadgeEntries(limit = 8): EarnedBadgeEntry[] {
  return getEarnedBadgeEntries().slice(0, limit);
}

export function getStateWallEntries(): StateWallEntry[] {
  return STATES.map((bundle) => {
    const mastery = getStateMasterySummary(bundle.meta.id);
    let primaryTierId: TierId = "major";
    let peakRank = 0;

    for (const tier of PLAYABLE_TIERS) {
      const badge = getMasteryBadge(buildQuizKey(bundle.meta.id, tier.id));
      const rank = BADGE_RANK[badge];
      if (rank > peakRank) {
        peakRank = rank;
        primaryTierId = tier.id;
      }
    }

    return {
      stateId: bundle.meta.id,
      stateName: bundle.meta.name,
      peakBadge: mastery.highestBadge,
      primaryTierId,
    };
  });
}

function ladderHint(current: MasteryBadge, minPct: number, best: number | null): string {
  if (current === "gold") return "Earned ✓";
  const target = nextBadgeTarget(current);
  if (!target) return "Earned ✓";
  if (best === null) return `Score ${minPct}%+`;
  const remaining = Math.max(0, target.minPct - best);
  if (remaining <= 0) return "Earned ✓";
  return `${remaining}% to go`;
}

export function getBadgeProgressDetail(stateId: string, tierId: TierId): BadgeProgressDetail | null {
  const bundle = STATES.find((s) => s.meta.id === stateId);
  const tier = PLAYABLE_TIERS.find((t) => t.id === tierId);
  if (!bundle || !tier) return null;

  const key = buildQuizKey(stateId, tierId);
  const currentBadge = getMasteryBadge(key);
  const best = getBestScore(key);

  const ladder: TierLadderRow[] = MASTERY_THRESHOLDS.map(({ badge, minPct }) => {
    const earned = BADGE_RANK[currentBadge] >= BADGE_RANK[badge];
    return {
      badge,
      minPct,
      earned,
      hint: earned ? "Earned ✓" : ladderHint(currentBadge, minPct, best),
    };
  });

  let chaseLabel: string | null = null;
  const next = nextBadgeTarget(currentBadge);
  if (next && next.badge === "gold") chaseLabel = "Chase Gold →";
  else if (next && next.badge === "silver") chaseLabel = "Chase Silver →";
  else if (next && next.badge === "bronze") chaseLabel = "Earn Bronze →";

  return {
    stateId,
    stateName: bundle.meta.name,
    tierId,
    tierLabel: tier.label,
    currentBadge,
    best,
    ladder,
    chaseLabel,
  };
}

export function detailHeaderLabel(detail: BadgeProgressDetail): string {
  if (detail.currentBadge === "none") return "Not started";
  return `${masteryBadgeLabel(detail.currentBadge)} earned`;
}

export function displayTierForState(stateId: string, tierId?: TierId): TierId {
  if (tierId) return tierId;
  return getStateWallEntries().find((s) => s.stateId === stateId)?.primaryTierId ?? "major";
}
