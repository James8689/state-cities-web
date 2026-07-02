import type { MasteryBadge } from "../types/quiz";

const RANK: Record<MasteryBadge, number> = {
  none: 0,
  bronze: 1,
  silver: 2,
  gold: 3,
};

export function badgeForAccuracy(pct: number): MasteryBadge {
  if (pct >= 100) return "gold";
  if (pct >= 85) return "silver";
  if (pct >= 70) return "bronze";
  return "none";
}

export function upgradeBadge(current: MasteryBadge, earned: MasteryBadge): MasteryBadge {
  return RANK[earned] > RANK[current] ? earned : current;
}

export const MASTERY_THRESHOLDS: { badge: Exclude<MasteryBadge, "none">; minPct: number }[] = [
  { badge: "bronze", minPct: 70 },
  { badge: "silver", minPct: 85 },
  { badge: "gold", minPct: 100 },
];

export function masteryBadgeLabel(badge: MasteryBadge): string | null {
  if (badge === "none") return null;
  const labels: Record<Exclude<MasteryBadge, "none">, string> = {
    bronze: "Bronze",
    silver: "Silver",
    gold: "Gold",
  };
  return labels[badge];
}

export function nextBadgeTarget(current: MasteryBadge): { badge: MasteryBadge; minPct: number } | null {
  if (current === "gold") return null;
  if (current === "none") return { badge: "bronze", minPct: 70 };
  if (current === "bronze") return { badge: "silver", minPct: 85 };
  return { badge: "gold", minPct: 100 };
}
