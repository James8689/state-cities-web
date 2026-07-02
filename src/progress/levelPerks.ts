import { levelTitleToBadgeId } from "../data/badgeAssets";
import type { MapThemeId } from "../data/mapThemes";
import { MAP_THEMES } from "../data/mapThemes";
import { levelFromPoints, titleForLevel } from "./points";
import { getPoints, loadProgress } from "./storage";

export type { LevelUpEvent } from "./types";

export interface LevelPerkInfo {
  level: number;
  title: string;
  headline: string;
  detail: string;
  badgeId: ReturnType<typeof levelTitleToBadgeId>;
}

const LEVEL_PERK_COPY: Record<number, { headline: string; detail: string }> = {
  1: {
    headline: "Welcome aboard",
    detail: "Your cross-country map journey begins.",
  },
  2: {
    headline: "Midnight map theme unlocked",
    detail: "Switch map colors in Journey.",
  },
  3: {
    headline: "Paper atlas theme unlocked",
    detail: "Another look for your quizzes.",
  },
  4: {
    headline: "Sharper instincts",
    detail: "Map hints appear after one miss instead of two.",
  },
  5: {
    headline: "Speed runner",
    detail: "Perfect runs now chase Quick draw, Speed run, and Lightning badges.",
  },
  6: {
    headline: "Second daily try",
    detail: "Play today's daily challenge twice — best score counts.",
  },
  7: {
    headline: "Veteran frame",
    detail: "Your progress card gets a gold veteran border.",
  },
  8: {
    headline: "Map Master",
    detail: "Maximum rank — you've earned true map mastery.",
  },
};

export function getPlayerLevel(): number {
  return levelFromPoints(getPoints());
}

export function getLevelPerkInfo(level: number): LevelPerkInfo {
  const title = titleForLevel(level);
  const copy = LEVEL_PERK_COPY[level] ?? {
    headline: "Level up!",
    detail: LEVEL_PERK_COPY[1]?.detail ?? "",
  };
  return {
    level,
    title,
    headline: copy.headline,
    detail: copy.detail,
    badgeId: levelTitleToBadgeId(title),
  };
}

/** Perks newly earned when jumping from previousLevel → newLevel. */
export function getPerksUnlockedBetween(previousLevel: number, newLevel: number): LevelPerkInfo[] {
  const perks: LevelPerkInfo[] = [];
  for (let level = previousLevel + 1; level <= newLevel; level++) {
    perks.push(getLevelPerkInfo(level));
  }
  return perks;
}

/** Tap-map hints show after this many misses on the current city. */
export function tapHintMissThreshold(level = getPlayerLevel()): number {
  return level >= 4 ? 1 : 2;
}

export function maxDailyAttempts(level = getPlayerLevel()): number {
  return level >= 6 ? 2 : 1;
}

export function hasVeteranFrame(level = getPlayerLevel()): boolean {
  return level >= 7;
}

export function isMapMaster(level = getPlayerLevel()): boolean {
  return level >= 8;
}

export function isThemeUnlocked(themeId: MapThemeId, level = getPlayerLevel()): boolean {
  const progress = loadProgress();
  if (progress.unlockedThemes.includes(themeId)) return true;
  const theme = MAP_THEMES[themeId];
  return theme ? level >= theme.unlockLevel : false;
}
