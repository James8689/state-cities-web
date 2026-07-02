import { PLAYABLE_TIERS } from "../data/tiers";
import { STATES } from "../data/states";
import { buildQuizKey, buildNationalQuizKey } from "./quizKey";
import { getBestScore, getMasteryBadge } from "./storage";
import type { QuizPlayMode } from "../types/quiz";

/** States at bronze+ required to unlock the national Top 100 challenge. */
export const NATIONAL_QUIZ_UNLOCK_STATES = 30;

export interface NationalProgressSummary {
  statesAtBronze: number;
  unlockTarget: number;
  unlocked: boolean;
  best: number | null;
  badge: ReturnType<typeof getMasteryBadge>;
}

export function countStatesAtBronze(): number {
  let count = 0;
  for (const bundle of STATES) {
    let atBronze = false;
    for (const tier of PLAYABLE_TIERS) {
      if (getMasteryBadge(buildQuizKey(bundle.meta.id, tier.id)) !== "none") {
        atBronze = true;
        break;
      }
    }
    if (atBronze) count += 1;
  }
  return count;
}

export function isNationalQuizUnlocked(): boolean {
  return countStatesAtBronze() >= NATIONAL_QUIZ_UNLOCK_STATES;
}

export function getNationalProgress(playMode: QuizPlayMode = "tap"): NationalProgressSummary {
  const statesAtBronze = countStatesAtBronze();
  const key = buildNationalQuizKey(playMode);
  return {
    statesAtBronze,
    unlockTarget: NATIONAL_QUIZ_UNLOCK_STATES,
    unlocked: statesAtBronze >= NATIONAL_QUIZ_UNLOCK_STATES,
    best: getBestScore(key),
    badge: getMasteryBadge(key),
  };
}
