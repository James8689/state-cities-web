import { MasteryBadge } from "./MasteryBadge";
import {
  getRegionProgress,
  getRegionQuizProgress,
  type RegionProgressSummary,
} from "../progress/regionProgress";
import type { QuizPlayMode } from "../types/quiz";

interface RegionalQuizTeaserProps {
  regionId: string;
  onPlay: (mode: QuizPlayMode) => void;
}

function UnlockHint({ progress }: { progress: RegionProgressSummary }) {
  return (
    <p className="region-quiz-teaser-hint">
      <span className="region-quiz-teaser-hint-icon" aria-hidden>
        ⓘ
      </span>
      Earn Bronze (70%+ on Major or Full) in {progress.regionalQuizUnlock} states in{" "}
      {progress.regionName} to unlock a mixed-map regional quiz.
    </p>
  );
}

export function RegionalQuizTeaser({ regionId, onPlay }: RegionalQuizTeaserProps) {
  const progress = getRegionProgress(regionId);
  if (!progress) return null;

  const tapProgress = getRegionQuizProgress(regionId, "tap");

  return (
    <section
      className={`region-quiz-teaser${progress.regionalQuizUnlocked ? " region-quiz-teaser--unlocked" : ""}`}
      aria-label={`${progress.regionName} regional quiz`}
    >
      <div className="region-quiz-teaser-head">
        <div className="region-quiz-teaser-head-text">
          <p className="region-quiz-teaser-label">Regional challenge</p>
          <p className="region-quiz-teaser-title">{progress.regionName}</p>
          <p className="region-quiz-teaser-desc">
            {progress.regionalQuizUnlocked
              ? "Major cities from started states — one mixed map"
              : "Mixed major cities across the region on a single map"}
          </p>
        </div>
        {!progress.regionalQuizUnlocked && (
          <span className="region-quiz-teaser-lock-badge" aria-hidden>
            🔒
          </span>
        )}
      </div>

      {progress.regionalQuizUnlocked && tapProgress.best !== null && (
        <div className="region-quiz-teaser-meta">
          {tapProgress.badge !== "none" && <MasteryBadge badge={tapProgress.badge} size="sm" />}
          <span className="region-quiz-teaser-best">Best {tapProgress.best}%</span>
        </div>
      )}

      {!progress.regionalQuizUnlocked && (
        <div className="region-quiz-teaser-progress">
          <div className="region-quiz-teaser-progress-row">
            <span>Unlock progress</span>
            <span>
              {progress.statesAtBronze}/{progress.regionalQuizUnlock} states at Bronze+
            </span>
          </div>
          <div
            className="region-quiz-teaser-segments"
            role="progressbar"
            aria-valuenow={progress.statesAtBronze}
            aria-valuemin={0}
            aria-valuemax={progress.regionalQuizUnlock}
            aria-label={`${progress.statesAtBronze} of ${progress.regionalQuizUnlock} states at Bronze for regional quiz`}
          >
            {Array.from({ length: progress.regionalQuizUnlock }, (_, i) => (
              <span
                key={i}
                className={`region-quiz-teaser-segment${i < progress.statesAtBronze ? " region-quiz-teaser-segment--done" : ""}`}
              />
            ))}
          </div>
        </div>
      )}

      {progress.regionalQuizUnlocked ? (
        <div className="region-quiz-teaser-modes">
          <button
            type="button"
            className="tier-mode-btn tier-mode-btn--tap region-quiz-teaser-mode"
            onClick={() => onPlay("tap")}
          >
            Tap quiz
          </button>
          <button
            type="button"
            className="tier-mode-btn tier-mode-btn--type region-quiz-teaser-mode"
            onClick={() => onPlay("type")}
          >
            Type quiz
          </button>
        </div>
      ) : (
        <>
          <button
            type="button"
            className="region-quiz-teaser-play region-quiz-teaser-play--locked"
            disabled
            aria-disabled="true"
          >
            <span className="region-quiz-teaser-play-icon" aria-hidden>
              🔒
            </span>
            Regional quiz locked
          </button>
          <UnlockHint progress={progress} />
        </>
      )}
    </section>
  );
}
