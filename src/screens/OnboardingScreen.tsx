import { useMemo, useState } from "react";
import { ONBOARDING_ILLUSTRATIONS } from "../components/onboarding/OnboardingIllustrations";
import { ONBOARDING_STEP_COUNT, ONBOARDING_TUTORIAL_STEPS } from "../data/onboardingSteps";
import { getRegionById, getRegionForState, REGIONS } from "../data/regions";
import { getStateBundle } from "../data/states";
import { pickRandomStateUsps } from "../progress/nextRecommendation";
import { setHomeStateId } from "../progress/storage";

interface OnboardingScreenProps {
  onComplete: (stateId: string) => void;
}

export function OnboardingScreen({ onComplete }: OnboardingScreenProps) {
  const [step, setStep] = useState(0);
  const [regionId, setRegionId] = useState(REGIONS[0]!.id);
  const isHomeStep = step >= ONBOARDING_TUTORIAL_STEPS.length;
  const tutorial = !isHomeStep ? ONBOARDING_TUTORIAL_STEPS[step] : null;
  const Illustration = tutorial ? ONBOARDING_ILLUSTRATIONS[tutorial.id] : null;

  const states = useMemo(() => {
    const region = getRegionById(regionId);
    if (!region) return [];
    return region.states
      .map((usps) => getStateBundle(usps))
      .filter((b): b is NonNullable<typeof b> => !!b)
      .sort((a, b) => a.meta.name.localeCompare(b.meta.name));
  }, [regionId]);

  const activeRegion = getRegionById(regionId);

  const pickState = (usps: string) => {
    setHomeStateId(usps, { force: true });
    onComplete(usps);
  };

  const goNext = () => {
    if (step < ONBOARDING_STEP_COUNT - 1) setStep((s) => s + 1);
  };

  const goBack = () => {
    if (step > 0) setStep((s) => s - 1);
  };

  if (isHomeStep) {
    return (
      <div className="screen onboarding-screen">
        <header className="onboarding-header">
          <div className="onboarding-progress" aria-label={`Step ${step + 1} of ${ONBOARDING_STEP_COUNT}`}>
            {Array.from({ length: ONBOARDING_STEP_COUNT }, (_, i) => (
              <span
                key={i}
                className={`onboarding-progress-dot${i === step ? " onboarding-progress-dot--active" : ""}${i < step ? " onboarding-progress-dot--done" : ""}`}
              />
            ))}
          </div>
          <p className="onboarding-eyebrow">Almost there</p>
          <h1>Pick your home state</h1>
          <p className="onboarding-subtitle">
            Choose your region first, then tap your state. This is where your Learn path
            starts.
          </p>
          <p className="onboarding-note">Progress stays on this device. No account needed.</p>
        </header>

        <section className="onboarding-region-section" aria-label="Choose region">
          <div className="onboarding-region-heading">
            <p className="onboarding-region-label">1 · Choose your region</p>
          </div>
          <div className="onboarding-region-scroll-wrap">
            <div className="region-picker onboarding-region-picker" role="tablist" aria-label="Regions">
              {REGIONS.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  role="tab"
                  aria-selected={r.id === regionId}
                  className={`region-picker-tab${r.id === regionId ? " region-picker-tab--active" : ""}`}
                  onClick={() => setRegionId(r.id)}
                >
                  {r.shortName}
                </button>
              ))}
            </div>
          </div>
        </section>

        <div className="onboarding-state-section-header">
          <p className="onboarding-state-section-label">2 · Pick your state</p>
          <p className="onboarding-state-section-meta">
            {activeRegion?.name ?? "Region"} · {states.length}{" "}
            {states.length === 1 ? "state" : "states"}
          </p>
        </div>

        <ul className="state-list state-list--flat onboarding-state-list">
          {states.map((bundle) => (
            <li key={bundle.meta.id}>
              <button
                type="button"
                className="state-list-item state-list-item--available"
                onClick={() => pickState(bundle.meta.id)}
              >
                <span className="state-list-name">{bundle.meta.name}</span>
                <span className="state-list-meta">
                  {getRegionForState(bundle.meta.id)?.shortName ?? ""} ·{" "}
                  {bundle.meta.cities.length} cities
                </span>
              </button>
            </li>
          ))}
        </ul>

        <div className="onboarding-footer onboarding-footer--split">
          <button type="button" className="btn-secondary onboarding-back" onClick={goBack}>
            Back
          </button>
          <button
            type="button"
            className="btn-secondary onboarding-random"
            onClick={() => pickState(pickRandomStateUsps())}
          >
            Surprise me
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="screen onboarding-screen onboarding-screen--tutorial">
      <div className="onboarding-tutorial-body">
        <div className="onboarding-progress" aria-label={`Step ${step + 1} of ${ONBOARDING_STEP_COUNT}`}>
          {Array.from({ length: ONBOARDING_STEP_COUNT }, (_, i) => (
            <span
              key={i}
              className={`onboarding-progress-dot${i === step ? " onboarding-progress-dot--active" : ""}${i < step ? " onboarding-progress-dot--done" : ""}`}
            />
          ))}
        </div>

        <header className="onboarding-tutorial-copy">
          <p className="onboarding-eyebrow">{tutorial!.eyebrow}</p>
          <h1>{tutorial!.title}</h1>
          <p className="onboarding-subtitle">{tutorial!.body}</p>
        </header>

        <figure className="onboarding-figure" aria-label={tutorial!.imageAlt}>
          {Illustration ? <Illustration /> : null}
        </figure>

        <p className="onboarding-tip">{tutorial!.tip}</p>
      </div>

      <footer
        className={`onboarding-footer${step > 0 ? " onboarding-footer--split" : " onboarding-footer--solo"}`}
      >
        {step > 0 ? (
          <button type="button" className="btn-secondary onboarding-back" onClick={goBack}>
            Back
          </button>
        ) : null}
        <button type="button" className="btn-primary onboarding-next" onClick={goNext}>
          {step === ONBOARDING_TUTORIAL_STEPS.length - 1 ? "Pick home state" : "Next"}
        </button>
      </footer>
    </div>
  );
}
