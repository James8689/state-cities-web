import { useAppContext } from "../contexts/AppContext";
import { JourneyScreen } from "../screens/JourneyScreen";

export function JourneyPage() {
  const { goBack, continueJourney, browseRegion, openStateFromHub, startRegionQuiz, startNationalQuiz, startWeakCityPractice } = useAppContext();

  return (
    <JourneyScreen
      onBack={goBack}
      onContinueRecommendation={continueJourney}
      onBrowseRegion={browseRegion}
      onPlayState={openStateFromHub}
      onStartRegionQuiz={startRegionQuiz}
      onStartNationalQuiz={startNationalQuiz}
      onPracticeWeakCities={startWeakCityPractice}
    />
  );
}
