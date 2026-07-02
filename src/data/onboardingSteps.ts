export type OnboardingIllustrationId = "tap" | "type" | "unlock";

export interface OnboardingTutorialStep {
  id: OnboardingIllustrationId;
  eyebrow: string;
  title: string;
  body: string;
  tip: string;
  imageAlt: string;
}

export const ONBOARDING_TUTORIAL_STEPS: OnboardingTutorialStep[] = [
  {
    id: "tap",
    eyebrow: "How to play",
    title: "Tap the city on the map",
    body: "We name a city — you tap the nearest dot on the California map.",
    tip: "Example: find Los Angeles · pinch to zoom · hints after two misses",
    imageAlt: "California map with Los Angeles highlighted and a tap on the nearest dot",
  },
  {
    id: "type",
    eyebrow: "Type mode",
    title: "Spell it instead",
    body: "Use the Type button on any tier. Los Angeles stays highlighted while you type.",
    tip: "Spelling is forgiving — letter hints unlock if you're stuck",
    imageAlt: "Type mode with highlighted city and name entry",
  },
  {
    id: "unlock",
    eyebrow: "Your progress",
    title: "Earn badges as you improve",
    body: "Scores stay on this device. No account needed.",
    tip: "Mastery at 70 / 85 / 100% · speed badges on perfect fast runs",
    imageAlt: "Bronze silver and gold medals plus journey rewards",
  },
];

export const ONBOARDING_STEP_COUNT = ONBOARDING_TUTORIAL_STEPS.length + 1;
