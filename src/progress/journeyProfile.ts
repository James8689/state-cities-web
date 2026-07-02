import { REGIONS } from "../data/regions";
import { levelTitleToBadgeId, type BadgeAssetId } from "../data/badgeAssets";
import { PLAYABLE_TIERS } from "../data/tiers";
import { STATES } from "../data/states";
import type { MasteryBadge } from "../types/quiz";
import { buildQuizKey, buildRegionQuizKey } from "./quizKey";
import { getNextRecommendation } from "./nextRecommendation";
import {
  getLevelRoadmap,
  levelFromPoints,
  pointsToNextLevel,
  titleForLevel,
} from "./points";
import { getFocusRegionId, getRegionProgress, REGIONAL_QUIZ_UNLOCK_COUNT } from "./regionProgress";
import { getStreakSummary, getWeeklyGoalSummary, WEEKLY_QUIZ_TARGET } from "./streaks";
import {
  getNationalProgress,
} from "./nationalProgress";
import { getTopWeakCities } from "./weakCities";
import { getBestScore, getMasteryBadge, loadProgress } from "./storage";
import { getStateMasterySummary } from "./stateSummary";

export interface QuestBannerData {
  level: number;
  title: string;
  points: number;
  levelProgress: {
    current: number;
    needed: number;
    remaining: number;
    nextLevel: number;
    nextTitle: string;
  } | null;
  nextReward: {
    badgeId: BadgeAssetId;
    title: string;
  } | null;
  focusRegion: {
    regionId: string;
    name: string;
    shortName: string;
    segmentsFilled: number;
    segmentCount: number;
  } | null;
}

export interface HubProgressSummary {
  level: number;
  title: string;
  points: number;
  levelProgress: {
    current: number;
    needed: number;
    remaining: number;
    nextLevel: number;
  } | null;
  statesStarted: number;
  badgesEarned: number;
  badgesTotal: number;
  focusRegion: {
    shortName: string;
    tiersMastered: number;
    tiersTotal: number;
  } | null;
  streak: { current: number; playedToday: boolean };
  weeklyGoal: { completed: number; target: number; met: boolean };
}

const QUEST_REGION_SEGMENTS = 5;

export interface StateBadgeEntry {
  usps: string;
  name: string;
  highestBadge: MasteryBadge;
  fullyMastered: boolean;
  tiersMastered: number;
  tierCount: number;
}

export interface RegionBadgeEntry {
  regionId: string;
  name: string;
  shortName: string;
  tiersMastered: number;
  tiersTotal: number;
  statesAtBronze: number;
  regionalQuizUnlocked: boolean;
  /** Best tier badge earned anywhere in the region. */
  peakBadge: MasteryBadge;
}

export interface JourneyGoal {
  id: string;
  label: string;
  detail: string;
  progress?: { current: number; total: number };
}

export interface JourneyHighlight {
  label: string;
  detail: string;
  badge?: MasteryBadge;
}

export interface JourneyProfile {
  points: number;
  level: number;
  title: string;
  questBanner: QuestBannerData;
  levelProgress: { current: number; needed: number; nextTitle: string } | null;
  levels: ReturnType<typeof getLevelRoadmap>;
  states: StateBadgeEntry[];
  regions: RegionBadgeEntry[];
  accuracy: { bronze: number; silver: number; gold: number; total: number };
  goals: JourneyGoal[];
  highlights: JourneyHighlight[];
  dailyCompletedCount: number;
}

const BADGE_RANK: Record<MasteryBadge, number> = {
  none: 0,
  bronze: 1,
  silver: 2,
  gold: 3,
};

function peakBadgeInRegion(regionId: string): MasteryBadge {
  const region = getRegionProgress(regionId);
  if (!region) return "none";

  let peak: MasteryBadge = "none";
  for (const state of region.states) {
    for (const tier of PLAYABLE_TIERS) {
      const badge = getMasteryBadge(buildQuizKey(state.usps, tier.id));
      if (BADGE_RANK[badge] > BADGE_RANK[peak]) peak = badge;
    }
  }
  return peak;
}

function buildGoals(
  points: number,
  level: number,
  accuracy: JourneyProfile["accuracy"],
  regions: RegionBadgeEntry[],
): JourneyGoal[] {
  const goals: JourneyGoal[] = [];
  const levelProgress = pointsToNextLevel(points);

  if (levelProgress) {
    goals.push({
      id: "next-level",
      label: `Reach Lv ${level + 1}`,
      detail: `${levelProgress.needed - levelProgress.current} pts to ${titleForLevel(level + 1)}`,
      progress: { current: levelProgress.current, total: levelProgress.needed },
    });
  }

  const next = getNextRecommendation({ skipPractice: true });
  if (next.type === "start_tier") {
    goals.push({
      id: "continue",
      label: next.label,
      detail: next.reason,
    });
  }

  const focusRegion = regions.find((r) => !r.regionalQuizUnlocked && r.statesAtBronze > 0);
  const lockedRegion = regions.find((r) => !r.regionalQuizUnlocked && r.statesAtBronze === 0);
  const targetRegion = focusRegion ?? lockedRegion;
  if (targetRegion) {
    goals.push({
      id: `region-${targetRegion.regionId}`,
      label: `Unlock ${targetRegion.name} quiz`,
      detail: `${targetRegion.statesAtBronze}/${REGIONAL_QUIZ_UNLOCK_COUNT} states at Bronze+`,
      progress: {
        current: targetRegion.statesAtBronze,
        total: REGIONAL_QUIZ_UNLOCK_COUNT,
      },
    });
  }

  const focusId = getFocusRegionId();
  const focusUnlocked = regions.find(
    (r) => r.regionId === focusId && r.regionalQuizUnlocked,
  );
  if (focusUnlocked) {
    const rqKey = buildRegionQuizKey(focusId);
    const rqBadge = getMasteryBadge(rqKey);
    if (rqBadge !== "gold") {
      const best = getBestScore(rqKey);
      goals.push({
        id: `play-region-${focusId}`,
        label: `${focusUnlocked.shortName} regional quiz`,
        detail:
          best === null
            ? "Mixed major cities on one map"
            : `${best}% best — push for Gold (100%)`,
      });
    }
  }

  const national = getNationalProgress();
  if (!national.unlocked) {
    goals.push({
      id: "national-unlock",
      label: "Unlock national Top 100",
      detail: `${national.statesAtBronze}/${national.unlockTarget} states at Bronze+`,
      progress: {
        current: national.statesAtBronze,
        total: national.unlockTarget,
      },
    });
  } else if (national.badge !== "gold") {
    goals.push({
      id: "play-national",
      label: "National Top 100",
      detail:
        national.best === null
          ? "Boss quiz on the full US map"
          : `${national.best}% best — aim for Gold (100%)`,
    });
  }

  const weak = getTopWeakCities(1);
  if (weak.length > 0) {
    const top = getTopWeakCities(3);
    goals.push({
      id: "weak-practice",
      label: "Practice tough cities",
      detail: top.map((c) => c.name).join(", "),
    });
  }

  if (accuracy.gold < accuracy.total) {
    goals.push({
      id: "gold-tiers",
      label: "Gold tier badges",
      detail: `${accuracy.gold}/${accuracy.total} tiers at 100% accuracy`,
      progress: { current: accuracy.gold, total: accuracy.total },
    });
  }

  const weekly = getWeeklyGoalSummary();
  if (!weekly.met) {
    goals.push({
      id: "weekly-quizzes",
      label: "Weekly goal",
      detail: `Complete ${WEEKLY_QUIZ_TARGET} quizzes this week (Major, Full, Daily, Regional, or National)`,
      progress: { current: weekly.completed, total: weekly.target },
    });
  }

  return goals.slice(0, 6);
}

function buildHighlights(
  states: StateBadgeEntry[],
  regions: RegionBadgeEntry[],
  dailyCompletedCount: number,
  level: number,
): JourneyHighlight[] {
  const highlights: JourneyHighlight[] = [];

  const goldStates = states.filter((s) => s.fullyMastered);
  if (goldStates.length > 0) {
    highlights.push({
      label: `${goldStates.length} state${goldStates.length === 1 ? "" : "s"} mastered`,
      detail: goldStates
        .slice(0, 3)
        .map((s) => s.name)
        .join(", ") + (goldStates.length > 3 ? ` +${goldStates.length - 3} more` : ""),
      badge: "gold",
    });
  }

  const unlockedRegions = regions.filter((r) => r.regionalQuizUnlocked);
  if (unlockedRegions.length > 0) {
    highlights.push({
      label: `${unlockedRegions.length} regional quiz${unlockedRegions.length === 1 ? "" : "es"} unlocked`,
      detail: unlockedRegions.map((r) => r.shortName).join(", "),
      badge: "bronze",
    });
  }

  if (dailyCompletedCount > 0) {
    highlights.push({
      label: `${dailyCompletedCount} daily challenge${dailyCompletedCount === 1 ? "" : "s"} completed`,
      detail: "Keep your regional daily streak going",
    });
  }

  highlights.push({
    label: `Level ${level} · ${titleForLevel(level)}`,
    detail: "Your current campaign rank",
  });

  return highlights.slice(0, 4);
}

export function getHubProgressSummary(): HubProgressSummary {
  const progress = loadProgress();
  const points = progress.points ?? 0;
  const level = levelFromPoints(points);
  const title = titleForLevel(level);
  const rawProgress = pointsToNextLevel(points);

  const levelProgress = rawProgress
    ? {
        current: rawProgress.current,
        needed: rawProgress.needed,
        remaining: rawProgress.needed - rawProgress.current,
        nextLevel: level + 1,
      }
    : null;

  let statesStarted = 0;
  let badgesEarned = 0;
  const badgesTotal = STATES.length * PLAYABLE_TIERS.length;

  for (const bundle of STATES) {
    const mastery = getStateMasterySummary(bundle.meta.id);
    if (mastery.tiersMastered > 0) statesStarted += 1;
    for (const tier of PLAYABLE_TIERS) {
      if (getMasteryBadge(buildQuizKey(bundle.meta.id, tier.id)) !== "none") {
        badgesEarned += 1;
      }
    }
  }

  const focus = getRegionProgress(getFocusRegionId());
  const streak = getStreakSummary();
  const weeklyGoal = getWeeklyGoalSummary();

  return {
    level,
    title,
    points,
    levelProgress,
    statesStarted,
    badgesEarned,
    badgesTotal,
    focusRegion: focus
      ? {
          shortName: focus.shortName,
          tiersMastered: focus.tiersMastered,
          tiersTotal: focus.tiersTotal,
        }
      : null,
    streak: { current: streak.current, playedToday: streak.playedToday },
    weeklyGoal: {
      completed: weeklyGoal.completed,
      target: weeklyGoal.target,
      met: weeklyGoal.met,
    },
  };
}

export function getQuestBannerData(): QuestBannerData {
  const progress = loadProgress();
  const points = progress.points ?? 0;
  const level = levelFromPoints(points);
  return buildQuestBanner(points, level, titleForLevel(level), pointsToNextLevel(points));
}

function buildQuestBanner(
  points: number,
  level: number,
  title: string,
  rawProgress: ReturnType<typeof pointsToNextLevel>,
): QuestBannerData {
  const levelProgress = rawProgress
    ? {
        current: rawProgress.current,
        needed: rawProgress.needed,
        remaining: rawProgress.needed - rawProgress.current,
        nextLevel: level + 1,
        nextTitle: titleForLevel(level + 1),
      }
    : null;

  const focus = getRegionProgress(getFocusRegionId());
  const segmentsFilled = focus
    ? Math.min(
        QUEST_REGION_SEGMENTS,
        Math.round((focus.tiersMastered / Math.max(focus.tiersTotal, 1)) * QUEST_REGION_SEGMENTS),
      )
    : 0;

  return {
    level,
    title,
    points,
    levelProgress,
    nextReward: levelProgress
      ? {
          badgeId: levelTitleToBadgeId(levelProgress.nextTitle),
          title: `${levelProgress.nextTitle} badge · at Level ${levelProgress.nextLevel}`,
        }
      : null,
    focusRegion: focus
      ? {
          regionId: focus.regionId,
          name: focus.regionName,
          shortName: focus.shortName.toUpperCase(),
          segmentsFilled,
          segmentCount: QUEST_REGION_SEGMENTS,
        }
      : null,
  };
}

export function getJourneyProfile(): JourneyProfile {
  const data = loadProgress();
  const points = data.points;
  const level = levelFromPoints(points);
  const rawProgress = pointsToNextLevel(points);

  const states: StateBadgeEntry[] = STATES.map((bundle) => {
    const mastery = getStateMasterySummary(bundle.meta.id);
    return {
      usps: bundle.meta.id,
      name: bundle.meta.name,
      highestBadge: mastery.highestBadge,
      fullyMastered: mastery.fullyMastered,
      tiersMastered: mastery.tiersMastered,
      tierCount: mastery.tierCount,
    };
  });

  const regions: RegionBadgeEntry[] = REGIONS.map((region) => {
    const progress = getRegionProgress(region.id)!;
    return {
      regionId: region.id,
      name: region.name,
      shortName: region.shortName,
      tiersMastered: progress.tiersMastered,
      tiersTotal: progress.tiersTotal,
      statesAtBronze: progress.statesAtBronze,
      regionalQuizUnlocked: progress.regionalQuizUnlocked,
      peakBadge: peakBadgeInRegion(region.id),
    };
  });

  let bronze = 0;
  let silver = 0;
  let gold = 0;
  let total = 0;

  for (const bundle of STATES) {
    for (const tier of PLAYABLE_TIERS) {
      total += 1;
      const badge = getMasteryBadge(buildQuizKey(bundle.meta.id, tier.id));
      if (badge === "bronze") bronze += 1;
      if (badge === "silver") silver += 1;
      if (badge === "gold") gold += 1;
    }
  }

  const dailyCompletedCount = Object.keys(data.dailyBests).length;

  const levelProgress = rawProgress
    ? {
        ...rawProgress,
        nextTitle: titleForLevel(level + 1),
      }
    : null;

  const accuracy = { bronze, silver, gold, total };

  return {
    points,
    level,
    title: titleForLevel(level),
    questBanner: buildQuestBanner(points, level, titleForLevel(level), rawProgress),
    levelProgress,
    levels: getLevelRoadmap(points),
    states,
    regions,
    accuracy,
    goals: buildGoals(points, level, accuracy, regions),
    highlights: buildHighlights(states, regions, dailyCompletedCount, level),
    dailyCompletedCount,
  };
}

export function stateWallLabel(entry: StateBadgeEntry): string {
  if (entry.fullyMastered) return `${entry.usps} · Mastered`;
  if (entry.tiersMastered > 0) return `${entry.usps} · In progress`;
  return entry.usps;
}
