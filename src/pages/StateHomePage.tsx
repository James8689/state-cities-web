import { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAppContext } from "../contexts/AppContext";
import { getStateBundle } from "../data/states";
import { StateDetailScreen } from "../screens/StateDetailScreen";

export function StateHomePage() {
  const { stateSlug } = useParams<{ stateSlug: string }>();
  const nav = useNavigate();
  const ctx = useAppContext();

  useEffect(() => {
    if (!stateSlug) return;
    const usps = stateSlug.toUpperCase();
    if (!ctx.activeState || ctx.activeState.meta.id !== usps) {
      const bundle = getStateBundle(usps);
      if (!bundle) {
        nav("/states", { replace: true });
        return;
      }
      ctx.handleSelectState(usps);
    }
  }, [stateSlug]);

  if (!ctx.activeState) return null;

  return (
    <StateDetailScreen
      stateMeta={ctx.activeState.meta}
      backLabel="Back to states"
      onStartTier={ctx.handleStartTier}
      onPracticeMissed={ctx.handlePracticeMissed}
      onCreateCustom={() => nav(`/states/${stateSlug}/custom`)}
      onLearn={ctx.openLearnForActiveState}
      highlightLearn={ctx.highlightStateLearn}
      onBack={ctx.goBack}
    />
  );
}
