import { useMemo, useState } from "react";
import { getRegionById, getRegionForState, REGIONS } from "../data/regions";
import { getStateBundle } from "../data/states";
import { pickRandomStateUsps } from "../progress/nextRecommendation";
import { setHomeStateId } from "../progress/storage";

interface OnboardingScreenProps {
  onComplete: (stateId: string) => void;
}

export function OnboardingScreen({ onComplete }: OnboardingScreenProps) {
  const [regionId, setRegionId] = useState(REGIONS[0]!.id);

  const states = useMemo(() => {
    const region = getRegionById(regionId);
    if (!region) return [];
    return region.states
      .map((usps) => getStateBundle(usps))
      .filter((b): b is NonNullable<typeof b> => !!b)
      .sort((a, b) => a.meta.name.localeCompare(b.meta.name));
  }, [regionId]);

  const pickState = (usps: string) => {
    setHomeStateId(usps, { force: true });
    onComplete(usps);
  };

  return (
    <div className="screen onboarding-screen">
      <header className="onboarding-header">
        <p className="onboarding-eyebrow">Welcome to State Cities</p>
        <h1>Pick your home state</h1>
        <p className="onboarding-subtitle">
          This is where your Learn path starts — master it by map area, then explore
          your region.
        </p>
        <p className="onboarding-note">Progress stays on this device. No account needed.</p>
      </header>

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

      <div className="onboarding-footer">
        <button
          type="button"
          className="btn-secondary onboarding-random"
          onClick={() => pickState(pickRandomStateUsps())}
        >
          Surprise me — random state
        </button>
      </div>
    </div>
  );
}
