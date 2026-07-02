import { getDateKey } from "./dailyChallenge";
import { loadProgress, saveProgress } from "./storage";
import type { QuizKind } from "../types/quiz";

/** Quizzes that count toward play streak and weekly goal. */
export const WEEKLY_QUIZ_TARGET = 3;

const COUNTABLE_KINDS = new Set<QuizKind>(["major", "full", "daily", "regional", "national"]);

export function countsTowardCampaignActivity(kind: QuizKind): boolean {
  return COUNTABLE_KINDS.has(kind);
}

/** UTC ISO week key, e.g. `2026-W26` (Monday-based week). */
export function getWeekKey(date = new Date()): string {
  const utc = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const day = utc.getUTCDay() || 7;
  utc.setUTCDate(utc.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(utc.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((utc.getTime() - yearStart.getTime()) / 86_400_000 + 1) / 7);
  return `${utc.getUTCFullYear()}-W${String(week).padStart(2, "0")}`;
}

function dayBefore(dateKey: string): string {
  const [y, m, d] = dateKey.split("-").map(Number);
  const dt = new Date(Date.UTC(y!, m! - 1, d!));
  dt.setUTCDate(dt.getUTCDate() - 1);
  return dt.toISOString().slice(0, 10);
}

export interface CampaignActivityResult {
  streak: number;
  streakExtended: boolean;
  playedTodayBefore: boolean;
  weeklyQuizzes: number;
  weeklyTarget: number;
  weeklyGoalMet: boolean;
}

export function recordCampaignActivity(
  kind: QuizKind,
  date = new Date(),
): CampaignActivityResult | null {
  if (!countsTowardCampaignActivity(kind)) return null;

  const data = loadProgress();
  const today = getDateKey(date);
  const weekKey = getWeekKey(date);
  const playedTodayBefore = data.streakLastDate === today;

  let streak = data.streakCurrent ?? 0;
  if (!playedTodayBefore) {
    if (data.streakLastDate === dayBefore(today)) {
      streak += 1;
    } else {
      streak = 1;
    }
    data.streakLastDate = today;
    data.streakCurrent = streak;
  }

  if (data.weeklyWeekKey !== weekKey) {
    data.weeklyWeekKey = weekKey;
    data.weeklyQuizzes = 0;
  }
  data.weeklyQuizzes = (data.weeklyQuizzes ?? 0) + 1;

  saveProgress(data);

  const weeklyQuizzes = data.weeklyQuizzes;
  return {
    streak,
    streakExtended: !playedTodayBefore,
    playedTodayBefore,
    weeklyQuizzes,
    weeklyTarget: WEEKLY_QUIZ_TARGET,
    weeklyGoalMet: weeklyQuizzes >= WEEKLY_QUIZ_TARGET,
  };
}

export interface StreakSummary {
  current: number;
  playedToday: boolean;
  lastDate: string | null;
}

export interface WeeklyGoalSummary {
  weekKey: string;
  completed: number;
  target: number;
  met: boolean;
}

export function getStreakSummary(date = new Date()): StreakSummary {
  const data = loadProgress();
  const today = getDateKey(date);
  const lastDate = data.streakLastDate ?? null;
  let current = data.streakCurrent ?? 0;

  if (lastDate && lastDate !== today && lastDate !== dayBefore(today)) {
    current = 0;
  }

  return {
    current,
    playedToday: lastDate === today,
    lastDate,
  };
}

export function getWeeklyGoalSummary(date = new Date()): WeeklyGoalSummary {
  const data = loadProgress();
  const weekKey = getWeekKey(date);
  const completed =
    data.weeklyWeekKey === weekKey ? (data.weeklyQuizzes ?? 0) : 0;

  return {
    weekKey,
    completed,
    target: WEEKLY_QUIZ_TARGET,
    met: completed >= WEEKLY_QUIZ_TARGET,
  };
}
