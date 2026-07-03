import { useNavigate } from "react-router-dom";
import { getRegionById } from "../data/regions";
import { useAppContext } from "../contexts/AppContext";
import { ResultsScreen } from "../screens/ResultsScreen";

export function ResultsPage() {
  const nav = useNavigate();
  const ctx = useAppContext();

  const { activeState, quizKind, playMode, quizRegionId, activeLearnZoneId, practiceParentKind, result, handlePlayAgain, handleRetryMissed, continueJourney, goBackToLearnOrState, goToHub } = ctx;

  if (!result || (!activeState && !quizRegionId && quizKind !== "national")) {
    nav("/", { replace: true });
    return null;
  }

  const stateName =
    quizKind === "national"
      ? "United States"
      : quizRegionId
        ? (getRegionById(quizRegionId)?.name ?? "Region")
        : (activeState?.meta.name ?? "");

  return (
    <ResultsScreen
      stateId={activeState?.meta.id ?? ""}
      stateName={stateName}
      quizKind={quizKind}
      playMode={playMode}
      regionId={quizRegionId}
      learnZoneId={activeLearnZoneId}
      practiceParentKind={practiceParentKind}
      result={result}
      onPlayAgain={handlePlayAgain}
      onRetryMissed={handleRetryMissed}
      onContinueJourney={continueJourney}
      onBackToState={goBackToLearnOrState}
      onBackToHub={goToHub}
    />
  );
}
