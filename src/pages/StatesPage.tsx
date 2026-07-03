import { useAppContext } from "../contexts/AppContext";
import { StateSelectScreen } from "../screens/StateSelectScreen";

export function StatesPage() {
  const { exploreView, patchExploreView, handleSelectState, startRegionQuiz, goBack } = useAppContext();

  return (
    <StateSelectScreen
      viewState={exploreView}
      onViewStateChange={patchExploreView}
      backLabel="Back to home"
      onSelectState={handleSelectState}
      onStartRegionQuiz={startRegionQuiz}
      onBack={goBack}
    />
  );
}
