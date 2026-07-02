import { REGIONS, getRegionById } from "../data/regions";
import { getCitiesForTier } from "../data/tiers";
import { getStateBundle } from "../data/states";
import type { CityMeta } from "../types/quiz";
import { getDailyAttempts, getDailyBest } from "./storage";
import { getPlayerLevel, maxDailyAttempts } from "./levelPerks";

export interface DailyChallenge {
  dateKey: string;
  regionId: string;
  regionName: string;
  stateId: string;
  stateName: string;
  cities: CityMeta[];
  label: string;
  subtitle: string;
}

/** UTC calendar day index — same seed worldwide for a given UTC date. */
export function getDailySeed(date = new Date()): number {
  return Math.floor(date.getTime() / 86_400_000);
}

export function getDateKey(date = new Date()): string {
  return date.toISOString().slice(0, 10);
}

export function getDailyRegionId(date = new Date()): string {
  return REGIONS[getDailySeed(date) % REGIONS.length]!.id;
}

export function getDailyRegionLabel(date = new Date()): string {
  return getRegionById(getDailyRegionId(date))?.name ?? "United States";
}

export function buildDailyQuizKey(dateKey = getDateKey()): string {
  return `daily:${dateKey}`;
}

export function getDailyChallenge(date = new Date()): DailyChallenge {
  const dateKey = getDateKey(date);
  const seed = getDailySeed(date);
  const region = getRegionById(getDailyRegionId(date))!;
  const states = region.states.filter((usps) => getStateBundle(usps));
  const stateId = states[(seed + region.states.length) % states.length]!;
  const bundle = getStateBundle(stateId)!;
  const cities = getCitiesForTier(bundle.meta, "major");

  return {
    dateKey,
    regionId: region.id,
    regionName: region.name,
    stateId,
    stateName: bundle.meta.name,
    cities,
    label: `${region.name} · ${bundle.meta.name}`,
    subtitle: `Major cities · ${cities.length} cities`,
  };
}

export function getDailyStatus(date = new Date()) {
  const challenge = getDailyChallenge(date);
  const best = getDailyBest(challenge.dateKey);
  return {
    challenge,
    best,
    completed: best !== null,
  };
}

export function hasCompletedDailyToday(date = new Date()): boolean {
  return getDailyBest(getDateKey(date)) !== null;
}

export function getDailyAttemptsUsed(date = new Date()): number {
  return getDailyAttempts(getDateKey(date));
}

export function getDailyAttemptsRemaining(date = new Date()): number {
  const dateKey = getDateKey(date);
  const used = getDailyAttempts(dateKey);
  const max = maxDailyAttempts(getPlayerLevel());
  return Math.max(0, max - used);
}

export function canPlayDailyToday(date = new Date()): boolean {
  return getDailyAttemptsRemaining(date) > 0;
}
