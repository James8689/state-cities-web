import type { SpeedBadge } from "../types/quiz";

const SPEED_RANK: Record<SpeedBadge, number> = {
  none: 0,
  "quick-draw": 1,
  "speed-run": 2,
  lightning: 3,
};

/** Max average seconds per city (wall clock) to earn each speed tier at 100%. */
export const SPEED_SEC_PER_CITY: Record<Exclude<SpeedBadge, "none">, number> = {
  "quick-draw": 5,
  "speed-run": 4,
  lightning: 3,
};

export function speedBadgeLabel(badge: SpeedBadge): string | null {
  if (badge === "none") return null;
  const labels: Record<Exclude<SpeedBadge, "none">, string> = {
    "quick-draw": "Quick draw",
    "speed-run": "Speed run",
    lightning: "Lightning",
  };
  return labels[badge];
}

export function upgradeSpeedBadge(current: SpeedBadge, earned: SpeedBadge): SpeedBadge {
  return SPEED_RANK[earned] > SPEED_RANK[current] ? earned : current;
}

/** Which speed tier this run qualifies for (100% runs only). */
export function speedBadgeForRun(cityCount: number, elapsedMs: number): SpeedBadge {
  if (cityCount <= 0 || elapsedMs <= 0) return "none";
  const secPerCity = elapsedMs / 1000 / cityCount;
  if (secPerCity <= SPEED_SEC_PER_CITY.lightning) return "lightning";
  if (secPerCity <= SPEED_SEC_PER_CITY["speed-run"]) return "speed-run";
  if (secPerCity <= SPEED_SEC_PER_CITY["quick-draw"]) return "quick-draw";
  return "none";
}

export function formatElapsed(ms: number): string {
  const totalSec = Math.max(0, Math.floor(ms / 1000));
  const min = Math.floor(totalSec / 60);
  const sec = totalSec % 60;
  if (min > 0) return `${min}:${sec.toString().padStart(2, "0")}`;
  return `${sec}s`;
}

export function nextSpeedTarget(
  cityCount: number,
  current: SpeedBadge,
): { badge: SpeedBadge; maxMs: number } | null {
  if (cityCount <= 0) return null;
  const order: Exclude<SpeedBadge, "none">[] = ["quick-draw", "speed-run", "lightning"];
  for (const badge of order) {
    if (SPEED_RANK[badge] > SPEED_RANK[current]) {
      return { badge, maxMs: SPEED_SEC_PER_CITY[badge] * cityCount * 1000 };
    }
  }
  return null;
}

export function tracksSpeed(quizKind: string): boolean {
  return quizKind === "major" || quizKind === "full" || quizKind === "regional" || quizKind === "national";
}
