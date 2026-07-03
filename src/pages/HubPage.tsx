import { Navigate } from "react-router-dom";
import { useAppContext } from "../contexts/AppContext";
import { CampaignHubScreen } from "../screens/CampaignHubScreen";

export function HubPage() {
  const { needsOnboarding, openContinueDestination, goToSelect, goToJourney, handleSelectState, startDailyFromHub } = useAppContext();

  if (needsOnboarding) {
    return <Navigate to="/welcome" replace />;
  }

  return (
    <CampaignHubScreen
      onContinue={openContinueDestination}
      onBrowseStates={goToSelect}
      onOpenJourney={goToJourney}
      onRandomState={handleSelectState}
      onStartDaily={startDailyFromHub}
    />
  );
}
