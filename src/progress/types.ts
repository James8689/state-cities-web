import type { MasteryBadge, QuizKind } from "../types/quiz";
import type { SpeedBadge } from "../types/quiz";
import type { CityMeta } from "../types/quiz";
import type { TierId } from "../data/tiers";

export interface PlayerProgressV1 {
  version: 1;
  bestScores: Record<string, number>;
}

export interface PlayerProgressV2 {
  version: 2;
  bestScores: Record<string, number>;
  mastery: Record<string, MasteryBadge>;
}

export interface LastSession {
  stateId: string;
  kind: QuizKind;
  missedCityIds: string[];
  completedAt: string;
}

export interface PlayerProgressV3 {
  version: 3;
  bestScores: Record<string, number>;
  mastery: Record<string, MasteryBadge>;
  points: number;
  lastSession: LastSession | null;
  /** Region the campaign is steering the player through. */
  focusRegionId: string | null;
  /** Best accuracy per UTC date key (`YYYY-MM-DD`) for the daily regional challenge. */
  dailyBests: Record<string, number>;
  /** Completed learn area ids per state, e.g. OR -> ["north", "central"]. */
  learnZonesCompleted?: Record<string, LearnZoneId[]>;
  /** Best accuracy per learn area key, e.g. OR:learn:north -> 85. */
  learnZoneBests?: Record<string, number>;
  /** Known learn area ids per state (cached when zones are loaded). */
  learnZoneIdsByState?: Record<string, LearnZoneId[]>;
  /** The state the player chose to learn first (their home base). */
  homeStateId?: string | null;
  /** Consecutive UTC days with at least one counted quiz completed. */
  streakCurrent?: number;
  /** Last UTC date key (`YYYY-MM-DD`) that extended the streak. */
  streakLastDate?: string | null;
  /** ISO week key for weekly quiz goal tracking. */
  weeklyWeekKey?: string | null;
  /** Quizzes completed this week toward the weekly goal. */
  weeklyQuizzes?: number;
  /** cityId → times the player needed a hint or missed. */
  weakCities?: Record<string, number>;
}

export interface PlayerProgressV4 extends Omit<PlayerProgressV3, "version"> {
  version: 4;
  /** Best speed tier earned per quiz key (100% runs only). */
  speedBadges: Record<string, SpeedBadge>;
  /** Fastest 100% run per quiz key (milliseconds). */
  bestTimes: Record<string, number>;
}

export type LearnZoneId = "north" | "south" | "east" | "west" | "central";

export type PlayerProgress = PlayerProgressV4;

export interface QuizSession {
  stateId: string;
  kind: QuizKind;
  cities: CityMeta[];
}

export interface QuizResultRecord {
  best: number;
  isNewBest: boolean;
  previousBest: number | null;
  previousBadge: MasteryBadge;
  newBadge: MasteryBadge;
  badgeUpgraded: boolean;
}

export interface SpeedResultRecord {
  earnedThisRun: SpeedBadge;
  previousSpeedBadge: SpeedBadge;
  newSpeedBadge: SpeedBadge;
  speedBadgeUpgraded: boolean;
  bestTimeMs: number | null;
  previousBestTimeMs: number | null;
  isNewBestTime: boolean;
}

export type RecommendationAction =
  | {
      type: "start_tier";
      stateId: string;
      stateName: string;
      tierId: TierId;
      label: string;
      reason: string;
    }
  | {
      type: "practice_missed";
      stateId: string;
      stateName: string;
      kind: QuizKind;
      cities: CityMeta[];
      label: string;
      reason: string;
    }
  | { type: "pick_start" };
