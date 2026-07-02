import type { ParentQuizKind, QuizKind, QuizPlayMode } from "../types/quiz";

type TrackedTierKind = Exclude<
  QuizKind,
  "custom" | "daily" | "learn" | "practice" | "regional" | "national"
>;

/** Stable progress key: `{USPS}:{kind}` or `{USPS}:{kind}:type` for type mode. */
export function buildQuizKey(
  stateId: string,
  kind: TrackedTierKind,
  playMode: QuizPlayMode = "tap",
): string {
  const base = `${stateId.toUpperCase()}:${kind}`;
  return playMode === "type" ? `${base}:type` : base;
}

export function buildRegionQuizKey(regionId: string, playMode: QuizPlayMode = "tap"): string {
  const base = `region:${regionId}`;
  return playMode === "type" ? `${base}:type` : base;
}

export function buildNationalQuizKey(playMode: QuizPlayMode = "tap"): string {
  const base = "national:top100";
  return playMode === "type" ? `${base}:type` : base;
}

export function tracksProgress(
  kind: QuizKind,
): kind is TrackedTierKind | "regional" | "national" {
  return kind === "major" || kind === "full" || kind === "regional" || kind === "national";
}

export function isParentQuizKind(kind: QuizKind): kind is ParentQuizKind {
  return kind === "major" || kind === "full" || kind === "daily";
}
