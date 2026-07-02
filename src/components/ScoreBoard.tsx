import { useEffect, useState } from "react";
import { getDailyChallenge } from "../progress/dailyChallenge";
import { getTierLabel } from "../data/tiers";
import { MasteryBadge } from "./MasteryBadge";
import { masteryBadgeLabel, nextBadgeTarget } from "../progress/mastery";
import { buildQuizKey, buildRegionQuizKey, buildNationalQuizKey, tracksProgress } from "../progress/quizKey";
import {
  recordQuizResult,
  recordDailyResult,
  recordLearnZoneResult,
  recordSpeedResult,
  saveLastSession,
  addPoints,
} from "../progress/storage";
import { recordCampaignActivity } from "../progress/streaks";
import { recordWeakCityMisses } from "../progress/weakCities";
import { pointsForQuiz, pointsForDailyQuiz, pointsForLearn } from "../progress/points";
import { formatElapsed, nextSpeedTarget, tracksSpeed } from "../progress/speed";
import { SpeedBadge } from "./SpeedBadge";
import type { ParentQuizKind, QuizKind, QuizPlayMode, QuizResult } from "../types/quiz";
import type { LearnZoneId } from "../data/learnZones";
import { ZONE_LABELS } from "../data/learnZones";
import type { QuizResultRecord, SpeedResultRecord } from "../progress/types";

interface ScoreBoardProps {
  stateId: string;
  stateName: string;
  quizKind: QuizKind;
  playMode?: QuizPlayMode;
  regionId?: string | null;
  learnZoneId?: LearnZoneId | null;
  /** When quizKind is practice, the tier/daily session being practiced. */
  practiceParentKind?: ParentQuizKind | null;
  result: QuizResult;
}

function parentLabel(kind: ParentQuizKind): string {
  if (kind === "daily") return "Daily challenge";
  return getTierLabel(kind);
}

export function ScoreBoard({
  stateId,
  stateName,
  quizKind,
  playMode = "tap",
  regionId = null,
  learnZoneId,
  practiceParentKind,
  result,
}: ScoreBoardProps) {
  const pct = Math.round((result.points / result.total) * 100);
  const [record, setRecord] = useState<QuizResultRecord | null>(null);
  const [speedRecord, setSpeedRecord] = useState<SpeedResultRecord | null>(null);
  const [dailyBest, setDailyBest] = useState<number | null>(null);
  const [dailyNewBest, setDailyNewBest] = useState(false);
  const [learnBest, setLearnBest] = useState<number | null>(null);
  const [learnNewBest, setLearnNewBest] = useState(false);
  const [learnFirstArea, setLearnFirstArea] = useState(false);
  const [activity, setActivity] = useState<ReturnType<typeof recordCampaignActivity>>(null);
  const tracks = tracksProgress(quizKind);

  useEffect(() => {
    if (quizKind === "practice") {
      if (practiceParentKind) {
        saveLastSession({
          stateId,
          kind: practiceParentKind,
          missedCityIds: result.missed.map((c) => c.id),
          completedAt: new Date().toISOString(),
        });
      }
      recordWeakCityMisses(result.missed);
      setRecord(null);
      setSpeedRecord(null);
      setDailyBest(null);
      setDailyNewBest(false);
      setLearnBest(null);
      setLearnNewBest(false);
      setLearnFirstArea(false);
      setActivity(null);
      return;
    }

    if (quizKind === "learn" && learnZoneId) {
      const learnRecord = recordLearnZoneResult(stateId, learnZoneId, pct);
      addPoints(
        pointsForLearn(result, {
          firstCompletion: learnRecord.firstCompletion,
          isNewBest: learnRecord.isNewBest,
        }),
      );
      saveLastSession({
        stateId,
        kind: quizKind,
        missedCityIds: result.missed.map((c) => c.id),
        completedAt: new Date().toISOString(),
      });
      setLearnBest(learnRecord.best);
      setLearnNewBest(learnRecord.isNewBest);
      setLearnFirstArea(learnRecord.firstCompletion);
      setRecord(null);
      setSpeedRecord(null);
      setDailyBest(null);
      setDailyNewBest(false);
      setActivity(null);
      recordWeakCityMisses(result.missed);
      return;
    }

    if (quizKind === "daily") {
      const challenge = getDailyChallenge();
      const dailyRecord = recordDailyResult(challenge.dateKey, pct);
      addPoints(
        pointsForDailyQuiz(result, {
          firstCompletion: dailyRecord.firstCompletion,
          isNewBest: dailyRecord.isNewBest,
        }),
      );
      saveLastSession({
        stateId,
        kind: quizKind,
        missedCityIds: result.missed.map((c) => c.id),
        completedAt: new Date().toISOString(),
      });
      setDailyBest(dailyRecord.best);
      setDailyNewBest(dailyRecord.isNewBest);
      setRecord(null);
      setSpeedRecord(null);
      setActivity(recordCampaignActivity("daily"));
      recordWeakCityMisses(result.missed);
      return;
    }

    if (!tracks) {
      setRecord(null);
      setSpeedRecord(null);
      recordWeakCityMisses(result.missed);
      return;
    }

    const progressKey =
      quizKind === "national"
        ? buildNationalQuizKey(playMode)
        : quizKind === "regional" && regionId
          ? buildRegionQuizKey(regionId, playMode)
          : buildQuizKey(stateId, quizKind as "major" | "full", playMode);

    const resultRecord = recordQuizResult(progressKey, pct);
    const speed =
      tracksSpeed(quizKind) && result.elapsedMs > 0
        ? recordSpeedResult(progressKey, result.total, result.elapsedMs, pct)
        : null;
    addPoints(pointsForQuiz(result, resultRecord));
    saveLastSession({
      stateId: quizKind === "regional" ? stateId || regionId || "" : quizKind === "national" ? "US" : stateId,
      kind: quizKind,
      missedCityIds: result.missed.map((c) => c.id),
      completedAt: new Date().toISOString(),
    });
    recordWeakCityMisses(result.missed);
    setRecord(resultRecord);
    setSpeedRecord(speed);
    setActivity(recordCampaignActivity(quizKind));
  }, [stateId, quizKind, playMode, regionId, learnZoneId, practiceParentKind, pct, tracks, result]);

  const daily = quizKind === "daily" ? getDailyChallenge() : null;
  const showSpeed = tracks && tracksSpeed(quizKind);
  const nextSpeed =
    speedRecord && showSpeed ? nextSpeedTarget(result.total, speedRecord.newSpeedBadge) : null;

  const tierLabel =
    quizKind === "national"
      ? `Top 100 national${playMode === "type" ? " · Type" : ""}`
      : quizKind === "regional"
      ? `Regional quiz${playMode === "type" ? " · Type" : ""}`
      : tracks && (quizKind === "major" || quizKind === "full")
        ? `${getTierLabel(quizKind)}${playMode === "type" ? " · Type" : ""}`
        : null;
  const nextTarget = record && tracks ? nextBadgeTarget(record.newBadge) : null;

  return (
    <div className="results">
      <h2>
        {quizKind === "practice"
          ? "Practice complete"
          : quizKind === "daily"
            ? "Daily challenge complete"
            : quizKind === "learn"
              ? "Area complete"
              : `${stateName} complete`}
      </h2>
      <p className="results-subtitle">
        {quizKind === "practice" && practiceParentKind
          ? `${parentLabel(practiceParentKind)} · ${result.total} missed ${result.total === 1 ? "city" : "cities"}`
          : quizKind === "daily" && daily
            ? `${daily.label} · ${daily.subtitle}`
            : quizKind === "learn" && learnZoneId
              ? `${ZONE_LABELS[learnZoneId]} ${stateName} · ${result.total} cities`
              : tracks
                ? tierLabel
                : quizKind === "custom"
                  ? `Custom quiz · ${result.total} cities`
                  : `Learn · ${result.total} cities`}
      </p>
      <p className="results-score">{pct}%</p>

      {quizKind === "practice" && (
        <p className="results-best results-best--note">
          Practice doesn&apos;t change your tier or daily best scores.
        </p>
      )}

      {quizKind === "learn" && learnFirstArea && (
        <p className="results-new-best">New area explored!</p>
      )}

      {quizKind === "learn" && learnNewBest && !learnFirstArea && (
        <p className="results-new-best">New best for this area!</p>
      )}

      {quizKind === "daily" && dailyNewBest && (
        <p className="results-new-best">New daily best!</p>
      )}

      {activity?.streakExtended && activity.streak > 1 && (
        <p className="results-streak">
          🔥 {activity.streak}-day play streak!
        </p>
      )}

      {activity?.streakExtended && activity.streak === 1 && (
        <p className="results-streak">Day 1 — keep your streak going tomorrow!</p>
      )}

      {activity && !activity.weeklyGoalMet && (
        <p className="results-weekly">
          Weekly goal: {activity.weeklyQuizzes}/{activity.weeklyTarget} quizzes
        </p>
      )}

      {activity?.weeklyGoalMet && activity.weeklyQuizzes === activity.weeklyTarget && (
        <p className="results-weekly results-weekly--done">Weekly goal complete!</p>
      )}

      {record?.badgeUpgraded && tracks && record.newBadge !== "none" && (
        <p className={`results-badge-earned results-badge-earned--${record.newBadge}`}>
          {record.previousBadge === "none" ? "Earned" : "Upgraded to"}{" "}
          {masteryBadgeLabel(record.newBadge)}!
        </p>
      )}

      {record?.isNewBest && tracks && !record.badgeUpgraded && (
        <p className="results-new-best">New best score!</p>
      )}

      {record && tracks && record.newBadge !== "none" && (
        <div className="results-badge-row">
          <MasteryBadge badge={record.newBadge} />
        </div>
      )}

      <p className="results-detail">
        {result.firstTry} / {result.total} on the first try
      </p>

      {quizKind === "learn" && learnBest !== null && (
        <p className="results-best">Best for this area: {learnBest}%</p>
      )}

      {quizKind === "daily" && dailyBest !== null && (
        <p className="results-best">Today&apos;s best: {dailyBest}%</p>
      )}

      {record && tracks && (
        <p className="results-best">
          Personal best: {record.best}%
          {nextTarget && (
            <>
              {" "}
              · {nextTarget.minPct}% for {masteryBadgeLabel(nextTarget.badge)}
            </>
          )}
        </p>
      )}

      {showSpeed && (
        <p className="results-time">
          Time: {formatElapsed(result.elapsedMs)}
          {speedRecord?.isNewBestTime && speedRecord.bestTimeMs !== null && (
            <span className="results-time-note"> · New best time!</span>
          )}
        </p>
      )}

      {speedRecord?.speedBadgeUpgraded && speedRecord.newSpeedBadge !== "none" && (
        <p className={`results-speed-earned results-speed-earned--${speedRecord.newSpeedBadge}`}>
          {speedRecord.previousSpeedBadge === "none" ? "Earned" : "Upgraded to"}{" "}
          {speedRecord.newSpeedBadge === "quick-draw"
            ? "Quick draw"
            : speedRecord.newSpeedBadge === "speed-run"
              ? "Speed run"
              : "Lightning"}{" "}
          speed badge!
        </p>
      )}

      {speedRecord && showSpeed && speedRecord.newSpeedBadge !== "none" && (
        <div className="results-badge-row">
          <SpeedBadge badge={speedRecord.newSpeedBadge} />
        </div>
      )}

      {showSpeed && pct === 100 && speedRecord?.earnedThisRun === "none" && nextSpeed && (
        <p className="results-best results-best--note">
          Perfect score — under {formatElapsed(nextSpeed.maxMs)} for{" "}
          {nextSpeed.badge === "quick-draw"
            ? "Quick draw"
            : nextSpeed.badge === "speed-run"
              ? "Speed run"
              : "Lightning"}
        </p>
      )}

      {showSpeed && speedRecord?.bestTimeMs != null && (
        <p className="results-best">
          Best perfect run: {formatElapsed(speedRecord.bestTimeMs)}
          {nextSpeed && speedRecord.newSpeedBadge !== "lightning" && (
            <>
              {" "}
              · {formatElapsed(nextSpeed.maxMs)} for{" "}
              {nextSpeed.badge === "quick-draw"
                ? "Quick draw"
                : nextSpeed.badge === "speed-run"
                  ? "Speed run"
                  : "Lightning"}
            </>
          )}
        </p>
      )}

      {!tracks && quizKind === "custom" && (
        <p className="results-best results-best--note">
          Best scores and badges track Major and Full state quizzes.
        </p>
      )}

      {quizKind === "learn" && (
        <p className="results-best results-best--note">
          Learn areas don&apos;t affect Major or Full tier scores — explore at your own pace.
        </p>
      )}

      {quizKind === "daily" && (
        <p className="results-best results-best--note">
          A new regional daily challenge unlocks each UTC day.
        </p>
      )}

      {result.missed.length > 0 && (
        <div className="results-missed">
          <h3>Needed a hint on</h3>
          <ul>
            {result.missed.map((c) => (
              <li key={c.id}>{c.name}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
