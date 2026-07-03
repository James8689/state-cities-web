import { useNavigate } from "react-router-dom";
import { useAppContext } from "../contexts/AppContext";
import { CustomQuizScreen } from "../screens/CustomQuizScreen";

export function CustomSelectPage() {
  const nav = useNavigate();
  const { activeState, goBack, startQuiz } = useAppContext();

  if (!activeState) {
    nav("/states", { replace: true });
    return null;
  }

  return (
    <CustomQuizScreen
      stateMeta={activeState.meta}
      onBack={goBack}
      onPlay={(cities) => startQuiz(activeState, "custom", cities)}
    />
  );
}
