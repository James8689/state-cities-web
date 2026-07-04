import { useAppContext } from "../contexts/AppContext";
import { CampaignHubScreen } from "../screens/CampaignHubScreen";

export function HubPage() {
  const { openContinueDestination, goToSelect, goToJourney, handleSelectState, startDailyFromHub } = useAppContext();

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
