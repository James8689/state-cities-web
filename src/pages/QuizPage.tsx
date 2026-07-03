import { useNavigate } from "react-router-dom";
import { useAppContext } from "../contexts/AppContext";
import { QuizScreen } from "../screens/QuizScreen";

export function QuizPage() {
  const nav = useNavigate();
  const ctx = useAppContext();

  const { activeState, quizCities, quizKind, playMode, quizRegionId, quizUseNationalMap, activeLearnZoneId, practiceParentKind, quizKey, handleComplete, handleQuizBack } = ctx;

  if (quizCities.length === 0 || (!activeState && !quizRegionId && quizKind !== "national")) {
    nav("/", { replace: true });
    return null;
  }

  return (
    <QuizScreen
      key={quizKey}
      stateMeta={activeState?.meta ?? { id: "", name: "", capital: "", mapFiles: { state: "", cities: "" }, cities: [] }}
      peaks={activeState?.peaks ?? []}
      quizCities={quizCities}
      quizKind={quizKind}
      playMode={playMode}
      regionId={quizRegionId}
      useNationalMap={quizUseNationalMap}
      learnZoneId={activeLearnZoneId}
      practiceParentKind={practiceParentKind}
      onComplete={handleComplete}
      onBack={handleQuizBack}
    />
  );
}
