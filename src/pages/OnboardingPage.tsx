import { useAppContext } from "../contexts/AppContext";
import { OnboardingScreen } from "../screens/OnboardingScreen";

export function OnboardingPage() {
  const { completeOnboarding } = useAppContext();

  return (
    <div className="onboarding-page-wrapper">
      <OnboardingScreen onComplete={completeOnboarding} />
    </div>
  );
}
