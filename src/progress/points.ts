import type { MasteryBadge, QuizResult } from "../types/quiz";
import type { QuizResultRecord } from "./types";

const LEVEL_THRESHOLDS = [0, 100, 250, 500, 900, 1400, 2000, 2800];

const LEVEL_TITLES = [
  "Explorer",
  "Scout",
  "Traveler",
  "Pathfinder",
  "Cartographer",
  "Navigator",
  "Veteran",
  "Map Master",
];

/** Flavor text for each level — titles are shown on hub and journey. */
export const LEVEL_PERKS = [
  "Begin your cross-country map journey.",
  "Your title updates on the hub.",
  "Track progress across more regions.",
  "Unlock deeper campaign goals.",
  "Recognition as a serious cartographer.",
  "Steer through harder regional targets.",
  "Veteran status on your badge wall.",
  "Maximum rank — true map mastery.",
];

export function getLevelRoadmap(points: number) {
  const currentLevel = levelFromPoints(points);
  return LEVEL_TITLES.map((title, index) => {
    const level = index + 1;
    const pointsRequired = LEVEL_THRESHOLDS[index] ?? 0;
    return {
      level,
      title,
      pointsRequired,
      perk: LEVEL_PERKS[index] ?? "",
      unlocked: points >= pointsRequired,
      current: level === currentLevel,
    };
  });
}

export function pointsForQuiz(result: QuizResult, record: QuizResultRecord | null): number {
  let pts = 10 + result.total * 2;
  if (record?.isNewBest) pts += 5;
  if (record?.badgeUpgraded && record.newBadge !== "none") {
    const bonus: Record<Exclude<MasteryBadge, "none">, number> = {
      bronze: 15,
      silver: 25,
      gold: 40,
    };
    pts += bonus[record.newBadge];
  }
  return pts;
}

export function pointsForDailyQuiz(
  result: QuizResult,
  opts: { firstCompletion: boolean; isNewBest: boolean },
): number {
  let pts = 15 + result.total * 2;
  if (opts.firstCompletion) pts += 25;
  if (opts.isNewBest && !opts.firstCompletion) pts += 10;
  return pts;
}

export function pointsForLearn(
  result: QuizResult,
  opts: { firstCompletion: boolean; isNewBest: boolean },
): number {
  let pts = 5 + result.total;
  if (opts.firstCompletion) pts += 8;
  if (opts.isNewBest && !opts.firstCompletion) pts += 3;
  return pts;
}

export function levelFromPoints(points: number): number {
  let level = 1;
  for (let i = 1; i < LEVEL_THRESHOLDS.length; i++) {
    if (points >= LEVEL_THRESHOLDS[i]) level = i + 1;
    else break;
  }
  return level;
}

export function titleForLevel(level: number): string {
  return LEVEL_TITLES[Math.min(level - 1, LEVEL_TITLES.length - 1)] ?? "Explorer";
}

export function pointsToNextLevel(points: number): { current: number; needed: number } | null {
  const level = levelFromPoints(points);
  if (level >= LEVEL_THRESHOLDS.length) return null;
  const floor = LEVEL_THRESHOLDS[level - 1] ?? 0;
  const ceiling = LEVEL_THRESHOLDS[level];
  return { current: points - floor, needed: ceiling - floor };
}
