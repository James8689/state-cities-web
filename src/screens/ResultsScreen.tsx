import { useState } from "react";
import { getNextRecommendation } from "../progress/nextRecommendation";
import { LevelUpModal } from "../components/LevelUpModal";
import { ScoreBoard } from "../components/ScoreBoard";
import type { LearnZoneId } from "../data/learnZones";
import type { ParentQuizKind, QuizKind, QuizPlayMode, QuizResult } from "../types/quiz";
import type { LevelUpEvent } from "../progress/types";

interface ResultsScreenProps {
  stateId: string;
  stateName: string;
  quizKind: QuizKind;
  playMode?: QuizPlayMode;
  regionId?: string | null;
  learnZoneId?: LearnZoneId | null;
  practiceParentKind?: ParentQuizKind | null;
  result: QuizResult;
  onPlayAgain: () => void;
  onRetryMissed: () => void;
  onContinueJourney: () => void;
  onBackToState: () => void;
  onBackToHub: () => void;
}

export function ResultsScreen({
  stateId,
  stateName,
  quizKind,
  playMode = "tap",
  regionId = null,
  learnZoneId,
  practiceParentKind,
  result,
  onPlayAgain,
  onRetryMissed,
  onContinueJourney,
  onBackToState,
  onBackToHub,
}: ResultsScreenProps) {
  const [levelUp, setLevelUp] = useState<LevelUpEvent | null>(null);
  const hasMissed = result.missed.length > 0;
  const nextStep = getNextRecommendation({ skipPractice: true });
  const showContinue =
    nextStep.type === "start_tier" || nextStep.type === "practice_missed";

  return (
    <div className="screen results-screen">
      <ScoreBoard
        stateId={stateId}
        stateName={stateName}
        quizKind={quizKind}
        playMode={playMode}
        regionId={regionId}
        learnZoneId={learnZoneId}
        practiceParentKind={practiceParentKind}
        result={result}
        onLevelUp={setLevelUp}
      />
      {levelUp && <LevelUpModal event={levelUp} onDismiss={() => setLevelUp(null)} />}
      <div className="results-actions">
        {showContinue && (
          <button type="button" className="btn-primary" onClick={onContinueJourney}>
            {nextStep.type === "start_tier"
              ? `Continue: ${nextStep.label}`
              : nextStep.label}
          </button>
        )}
        <button type="button" className={showContinue ? "btn-secondary" : "btn-primary"} onClick={onPlayAgain}>
          Play again
        </button>
        {hasMissed && quizKind !== "practice" && (
          <button type="button" className="btn-secondary" onClick={onRetryMissed}>
            Practice missed cities ({result.missed.length})
          </button>
        )}
        {hasMissed && quizKind === "practice" && (
          <button type="button" className="btn-secondary" onClick={onRetryMissed}>
            Practice again ({result.missed.length} still missed)
          </button>
        )}
        <button type="button" className="btn-secondary" onClick={onBackToHub}>
          Home
        </button>
        {quizKind !== "daily" && quizKind !== "regional" && quizKind !== "national" && (
          <button type="button" className="btn-secondary btn-ghost" onClick={onBackToState}>
            {quizKind === "learn" ? "Back to learn areas" : `Back to ${stateName}`}
          </button>
        )}
        {quizKind === "regional" && (
          <button type="button" className="btn-secondary btn-ghost" onClick={onBackToState}>
            Back to explore
          </button>
        )}
        {quizKind === "national" && (
          <button type="button" className="btn-secondary btn-ghost" onClick={onBackToState}>
            Back to journey
          </button>
        )}
      </div>
    </div>
  );
}
