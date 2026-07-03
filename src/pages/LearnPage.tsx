import { useParams, useNavigate } from "react-router-dom";
import { useAppContext } from "../contexts/AppContext";
import { getStateBundle } from "../data/states";
import { LearnScreen } from "../screens/LearnScreen";

export function LearnPage() {
  const { stateSlug } = useParams<{ stateSlug: string }>();
  const nav = useNavigate();
  const { goBack, startLearn, learnStateId } = useAppContext();

  const stateId = stateSlug?.toUpperCase() ?? learnStateId ?? "";

  if (!stateId) {
    nav("/states", { replace: true });
    return null;
  }

  return (
    <LearnScreen
      stateId={stateId}
      onBack={goBack}
      onStartZone={(stateMeta, zoneId, cities) => {
        const bundle = getStateBundle(stateMeta.id);
        if (bundle) startLearn(bundle, zoneId, cities);
      }}
    />
  );
}
