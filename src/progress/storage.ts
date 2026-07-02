import { badgeForAccuracy, upgradeBadge } from "./mastery";
import { speedBadgeForRun, upgradeSpeedBadge } from "./speed";
import type { MasteryBadge, SpeedBadge } from "../types/quiz";
import type {
  LastSession,
  LearnZoneId,
  PlayerProgress,
  PlayerProgressV1,
  PlayerProgressV2,
  PlayerProgressV3,
  PlayerProgressV4,
  QuizResultRecord,
  SpeedResultRecord,
} from "./types";
import { getRegionForState } from "../data/regions";

const STORAGE_KEY = "state-cities-progress";
const LEGACY_OREGON_BEST = "state-cities-oregon-best-pct";

function emptyProgress(): PlayerProgressV4 {
  return {
    version: 4,
    bestScores: {},
    mastery: {},
    speedBadges: {},
    bestTimes: {},
    points: 0,
    lastSession: null,
    focusRegionId: null,
    dailyBests: {},
    learnZonesCompleted: {},
    learnZoneBests: {},
    learnZoneIdsByState: {},
    homeStateId: null,
    streakCurrent: 0,
    streakLastDate: null,
    weeklyWeekKey: null,
    weeklyQuizzes: 0,
    weakCities: {},
  };
}

function migrateV3(data: PlayerProgressV3): PlayerProgressV4 {
  return {
    ...data,
    version: 4,
    speedBadges: {},
    bestTimes: {},
  };
}

function migrateLegacyBest(data: PlayerProgressV4): PlayerProgressV4 {
  const legacy = localStorage.getItem(LEGACY_OREGON_BEST);
  if (!legacy) return data;

  const key = "OR:full";
  if (data.bestScores[key] === undefined) {
    const pct = Number(legacy);
    if (!Number.isNaN(pct) && pct > 0) {
      data.bestScores[key] = pct;
      data.mastery[key] = badgeForAccuracy(pct);
    }
  }
  localStorage.removeItem(LEGACY_OREGON_BEST);
  return data;
}

function migrateV1(data: PlayerProgressV1): PlayerProgressV4 {
  const v2: PlayerProgressV2 = {
    version: 2,
    bestScores: { ...data.bestScores },
    mastery: {},
  };
  for (const [key, pct] of Object.entries(v2.bestScores)) {
    v2.mastery[key] = badgeForAccuracy(pct);
  }
  return migrateV2(v2);
}

function migrateV2(data: PlayerProgressV2): PlayerProgressV4 {
  return migrateV3({
    version: 3,
    bestScores: { ...data.bestScores },
    mastery: { ...data.mastery },
    points: 0,
    lastSession: null,
    focusRegionId: null,
    dailyBests: {},
    learnZonesCompleted: {},
    learnZoneBests: {},
    learnZoneIdsByState: {},
    homeStateId: null,
    streakCurrent: 0,
    streakLastDate: null,
    weeklyWeekKey: null,
    weeklyQuizzes: 0,
    weakCities: {},
  });
}

function normalizeProgress(
  parsed: PlayerProgressV1 | PlayerProgressV2 | PlayerProgressV3 | PlayerProgressV4,
): PlayerProgressV4 {
  if (parsed.version === 4 && typeof parsed.bestScores === "object") {
    return migrateLegacyBest({
      version: 4,
      bestScores: parsed.bestScores ?? {},
      mastery: parsed.mastery ?? {},
      speedBadges: parsed.speedBadges ?? {},
      bestTimes: parsed.bestTimes ?? {},
      points: parsed.points ?? 0,
      lastSession: parsed.lastSession ?? null,
      focusRegionId: parsed.focusRegionId ?? null,
      dailyBests: parsed.dailyBests ?? {},
      learnZonesCompleted: parsed.learnZonesCompleted ?? {},
      learnZoneBests: parsed.learnZoneBests ?? {},
      learnZoneIdsByState: parsed.learnZoneIdsByState ?? {},
      homeStateId: parsed.homeStateId ?? null,
      streakCurrent: parsed.streakCurrent ?? 0,
      streakLastDate: parsed.streakLastDate ?? null,
      weeklyWeekKey: parsed.weeklyWeekKey ?? null,
      weeklyQuizzes: parsed.weeklyQuizzes ?? 0,
      weakCities: parsed.weakCities ?? {},
    });
  }
  if (parsed.version === 3 && typeof parsed.bestScores === "object") {
    return migrateLegacyBest(
      migrateV3({
        version: 3,
        bestScores: parsed.bestScores ?? {},
        mastery: parsed.mastery ?? {},
        points: parsed.points ?? 0,
        lastSession: parsed.lastSession ?? null,
        focusRegionId: parsed.focusRegionId ?? null,
        dailyBests: parsed.dailyBests ?? {},
        learnZonesCompleted: parsed.learnZonesCompleted ?? {},
        learnZoneBests: parsed.learnZoneBests ?? {},
        learnZoneIdsByState: parsed.learnZoneIdsByState ?? {},
        homeStateId: parsed.homeStateId ?? null,
        streakCurrent: parsed.streakCurrent ?? 0,
        streakLastDate: parsed.streakLastDate ?? null,
        weeklyWeekKey: parsed.weeklyWeekKey ?? null,
        weeklyQuizzes: parsed.weeklyQuizzes ?? 0,
        weakCities: parsed.weakCities ?? {},
      }),
    );
  }
  if (parsed.version === 2 && typeof parsed.bestScores === "object") {
    return migrateV2(parsed);
  }
  if (parsed.version === 1 && typeof parsed.bestScores === "object") {
    return migrateV1(parsed);
  }
  return migrateLegacyBest(emptyProgress());
}

export function loadProgress(): PlayerProgress {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return migrateLegacyBest(emptyProgress());

    const parsed = JSON.parse(raw) as PlayerProgressV1 | PlayerProgressV2 | PlayerProgressV3 | PlayerProgressV4;
    return normalizeProgress(parsed);
  } catch {
    return migrateLegacyBest(emptyProgress());
  }
}

export function saveProgress(data: PlayerProgress): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function getBestScore(quizKey: string): number | null {
  const score = loadProgress().bestScores[quizKey];
  return score === undefined ? null : score;
}

export function getMasteryBadge(quizKey: string): MasteryBadge {
  return loadProgress().mastery[quizKey] ?? "none";
}

export function getSpeedBadge(quizKey: string): SpeedBadge {
  return loadProgress().speedBadges[quizKey] ?? "none";
}

export function getBestTime(quizKey: string): number | null {
  const ms = loadProgress().bestTimes[quizKey];
  return ms === undefined ? null : ms;
}

export function getPoints(): number {
  return loadProgress().points;
}

export function addPoints(amount: number): number {
  const data = loadProgress();
  data.points += amount;
  saveProgress(data);
  return data.points;
}

export function saveLastSession(session: LastSession): void {
  const data = loadProgress();
  data.lastSession = session;
  const region = getRegionForState(session.stateId);
  if (region) data.focusRegionId = region.id;
  saveProgress(data);
}

/** Updates best score and mastery for a tracked tier quiz (major / full). */
export function recordQuizResult(quizKey: string, pct: number): QuizResultRecord {
  const data = loadProgress();
  const previousBest = data.bestScores[quizKey] ?? null;
  const best = previousBest === null ? pct : Math.max(previousBest, pct);
  const isNewBest = previousBest === null ? pct > 0 : pct > previousBest;

  data.bestScores[quizKey] = best;

  const previousBadge = data.mastery[quizKey] ?? "none";
  const newBadge = upgradeBadge(previousBadge, badgeForAccuracy(best));
  const badgeUpgraded = newBadge !== previousBadge;
  data.mastery[quizKey] = newBadge;

  saveProgress(data);

  return {
    best,
    isNewBest,
    previousBest,
    previousBadge,
    newBadge,
    badgeUpgraded,
  };
}

/** Records speed tier + best time when a run finishes at 100% accuracy. */
export function recordSpeedResult(
  quizKey: string,
  cityCount: number,
  elapsedMs: number,
  accuracyPct: number,
): SpeedResultRecord {
  const data = loadProgress();
  const previousSpeedBadge = data.speedBadges[quizKey] ?? "none";
  const previousBestTimeMs = data.bestTimes[quizKey] ?? null;

  if (accuracyPct < 100) {
    return {
      earnedThisRun: "none",
      previousSpeedBadge,
      newSpeedBadge: previousSpeedBadge,
      speedBadgeUpgraded: false,
      bestTimeMs: previousBestTimeMs,
      previousBestTimeMs,
      isNewBestTime: false,
    };
  }

  const earnedThisRun = speedBadgeForRun(cityCount, elapsedMs);
  const newSpeedBadge = upgradeSpeedBadge(previousSpeedBadge, earnedThisRun);
  const speedBadgeUpgraded = newSpeedBadge !== previousSpeedBadge;

  const bestTimeMs =
    previousBestTimeMs === null ? elapsedMs : Math.min(previousBestTimeMs, elapsedMs);
  const isNewBestTime = previousBestTimeMs === null || elapsedMs < previousBestTimeMs;

  data.speedBadges[quizKey] = newSpeedBadge;
  data.bestTimes[quizKey] = bestTimeMs;
  saveProgress(data);

  return {
    earnedThisRun,
    previousSpeedBadge,
    newSpeedBadge,
    speedBadgeUpgraded,
    bestTimeMs,
    previousBestTimeMs,
    isNewBestTime,
  };
}

export function hasAnyProgress(): boolean {
  const data = loadProgress();
  return (
    Object.keys(data.bestScores).length > 0 ||
    Object.keys(data.dailyBests).length > 0 ||
    data.points > 0 ||
    data.lastSession !== null
  );
}

export function getDailyBest(dateKey: string): number | null {
  const score = loadProgress().dailyBests[dateKey];
  return score === undefined ? null : score;
}

export function recordDailyResult(dateKey: string, pct: number): {
  best: number;
  isNewBest: boolean;
  previousBest: number | null;
  firstCompletion: boolean;
} {
  const data = loadProgress();
  const previousBest = data.dailyBests[dateKey] ?? null;
  const firstCompletion = previousBest === null;
  const best = previousBest === null ? pct : Math.max(previousBest, pct);
  const isNewBest = previousBest === null ? pct > 0 : pct > previousBest;

  data.dailyBests[dateKey] = best;
  saveProgress(data);

  return { best, isNewBest, previousBest, firstCompletion };
}

export function recordLearnZoneResult(
  stateId: string,
  zoneId: LearnZoneId,
  pct: number,
): { best: number; isNewBest: boolean; firstCompletion: boolean } {
  const data = loadProgress();
  const usps = stateId.toUpperCase();
  const key = `${usps}:learn:${zoneId}`;

  if (!data.learnZonesCompleted) data.learnZonesCompleted = {};
  if (!data.learnZoneBests) data.learnZoneBests = {};
  if (!data.learnZoneIdsByState) data.learnZoneIdsByState = {};

  const completed = data.learnZonesCompleted[usps] ?? [];
  const firstCompletion = !completed.includes(zoneId);
  if (firstCompletion) {
    data.learnZonesCompleted[usps] = [...completed, zoneId];
  }

  const knownIds = data.learnZoneIdsByState[usps] ?? [];
  if (!knownIds.includes(zoneId)) {
    data.learnZoneIdsByState[usps] = [...knownIds, zoneId];
  }

  const previousBest = data.learnZoneBests[key] ?? null;
  const best = previousBest === null ? pct : Math.max(previousBest, pct);
  const isNewBest = previousBest === null ? pct > 0 : pct > previousBest;
  data.learnZoneBests[key] = best;

  saveProgress(data);
  return { best, isNewBest, firstCompletion };
}

export function getHomeStateId(): string | null {
  return loadProgress().homeStateId ?? null;
}

/** Record the player's chosen home state. By default only sets it once (first pick). */
export function setHomeStateId(stateId: string, { force = false }: { force?: boolean } = {}): void {
  const data = loadProgress();
  if (!force && data.homeStateId) return;
  const usps = stateId.toUpperCase();
  data.homeStateId = usps;
  const region = getRegionForState(usps);
  if (region) data.focusRegionId = region.id;
  saveProgress(data);
}

/** Persist zone ids after loading a state's map areas (no network on next navigation). */
export function rememberLearnZoneIds(stateId: string, zoneIds: LearnZoneId[]): void {
  if (zoneIds.length === 0) return;
  const usps = stateId.toUpperCase();
  const data = loadProgress();
  const existing = data.learnZoneIdsByState?.[usps] ?? [];
  const merged = [...new Set([...existing, ...zoneIds])];
  if (
    existing.length === merged.length &&
    merged.every((id) => existing.includes(id))
  ) {
    return;
  }
  if (!data.learnZoneIdsByState) data.learnZoneIdsByState = {};
  data.learnZoneIdsByState[usps] = merged;
  saveProgress(data);
}
