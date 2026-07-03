import { useAppContext } from "../contexts/AppContext";
import { LearnRegionScreen } from "../screens/LearnRegionScreen";

export function LearnRegionPage() {
  const { learnRegionId, learnRegionSuggested, openLearnAreas, selectLearnRegion, goBack } = useAppContext();

  return (
    <LearnRegionScreen
      regionId={learnRegionId}
      suggestedStateId={learnRegionSuggested}
      onSelectState={openLearnAreas}
      onSelectRegion={selectLearnRegion}
      onBack={goBack}
    />
  );
}
