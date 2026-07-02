import { MasteryBadge } from "./MasteryBadge";
import { NATIONAL_QUIZ_SIZE } from "../data/nationalQuiz";
import {
  getNationalProgress,
  NATIONAL_QUIZ_UNLOCK_STATES,
} from "../progress/nationalProgress";
import type { QuizPlayMode } from "../types/quiz";

interface NationalQuizTeaserProps {
  onPlay: (mode: QuizPlayMode) => void;
}

export function NationalQuizTeaser({ onPlay }: NationalQuizTeaserProps) {
  const progress = getNationalProgress();

  return (
    <section
      className={`national-quiz-teaser${progress.unlocked ? " national-quiz-teaser--unlocked" : ""}`}
      aria-label="National Top 100 challenge"
    >
      <div className="national-quiz-teaser-head">
        <div className="national-quiz-teaser-head-text">
          <p className="national-quiz-teaser-label">National challenge</p>
          <p className="national-quiz-teaser-title">Top {NATIONAL_QUIZ_SIZE} cities</p>
          <p className="national-quiz-teaser-desc">
            {progress.unlocked
              ? "Largest cities in America on one US map"
              : `The ${NATIONAL_QUIZ_SIZE} biggest US cities on a single map`}
          </p>
        </div>
        {!progress.unlocked && (
          <span className="national-quiz-teaser-lock-badge" aria-hidden>
            🔒
          </span>
        )}
      </div>

      {progress.unlocked && progress.best !== null && (
        <div className="national-quiz-teaser-meta">
          {progress.badge !== "none" && <MasteryBadge badge={progress.badge} size="sm" />}
          <span className="national-quiz-teaser-best">Best {progress.best}%</span>
        </div>
      )}

      {!progress.unlocked && (
        <div className="national-quiz-teaser-progress">
          <div className="national-quiz-teaser-progress-row">
            <span>Unlock progress</span>
            <span>
              {progress.statesAtBronze}/{progress.unlockTarget} states at Bronze+
            </span>
          </div>
          <div
            className="national-quiz-teaser-segments"
            role="progressbar"
            aria-valuenow={progress.statesAtBronze}
            aria-valuemin={0}
            aria-valuemax={progress.unlockTarget}
            aria-label={`${progress.statesAtBronze} of ${progress.unlockTarget} states at Bronze for national quiz`}
          >
            {Array.from({ length: 10 }, (_, i) => {
              const filled =
                i < Math.round((progress.statesAtBronze / progress.unlockTarget) * 10);
              return (
                <span
                  key={i}
                  className={`national-quiz-teaser-segment${filled ? " national-quiz-teaser-segment--done" : ""}`}
                />
              );
            })}
          </div>
          <p className="national-quiz-teaser-hint">
            Earn Bronze (70%+ on Major or Full) in {NATIONAL_QUIZ_UNLOCK_STATES} states to unlock
            the national boss quiz.
          </p>
        </div>
      )}

      {progress.unlocked ? (
        <div className="national-quiz-teaser-modes">
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
        <button
          type="button"
          className="region-quiz-teaser-play region-quiz-teaser-play--locked"
          disabled
          aria-disabled="true"
        >
          <span className="region-quiz-teaser-play-icon" aria-hidden>
            🔒
          </span>
          National quiz locked
        </button>
      )}
    </section>
  );
}
