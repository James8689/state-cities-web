import { useMemo } from "react";
import { getRegionById, REGIONS } from "../data/regions";
import { BackButton } from "../components/BackButton";
import { getLearnRegionStates, getLearnHomeStateId } from "../progress/learnProgress";
import { getStateBundle } from "../data/states";

interface LearnRegionScreenProps {
  regionId: string;
  suggestedStateId: string | null;
  onSelectState: (usps: string) => void;
  onSelectRegion: (regionId: string) => void;
  onBack: () => void;
}

export function LearnRegionScreen({
  regionId,
  suggestedStateId,
  onSelectState,
  onSelectRegion,
  onBack,
}: LearnRegionScreenProps) {
  const region = getRegionById(regionId);
  const states = useMemo(
    () => getLearnRegionStates(regionId, suggestedStateId),
    [regionId, suggestedStateId],
  );

  const homeId = getLearnHomeStateId();
  const homeName = homeId ? getStateBundle(homeId)?.meta.name : null;

  return (
    <div className="screen learn-screen">
      <nav className="screen-nav" aria-label="Navigation">
        <BackButton onClick={onBack} label="Back to home" />
      </nav>

      <div className="learn-body">
        <header className="learn-header">
          <h1>Learn — {region?.name ?? "Region"}</h1>
          <p className="learn-subtitle">
            {homeName
              ? `You've mastered ${homeName}. Pick your next state to learn.`
              : "Pick a state to learn next."}
          </p>
        </header>

        <div className="region-picker" role="tablist" aria-label="Regions">
          {REGIONS.map((r) => (
            <button
              key={r.id}
              type="button"
              role="tab"
              aria-selected={r.id === regionId}
              className={`region-picker-tab${r.id === regionId ? " region-picker-tab--active" : ""}`}
              onClick={() => onSelectRegion(r.id)}
            >
              {r.shortName}
            </button>
          ))}
        </div>

        <ul className="state-list state-list--flat">
          {states.map((row) => (
            <li key={row.stateId}>
              <button
                type="button"
                className={`state-list-item state-list-item--available${row.suggested ? " state-list-item--suggested" : ""}`}
                onClick={() => onSelectState(row.stateId)}
              >
                <span className="state-list-name">
                  {row.stateName}
                  {row.suggested && (
                    <span className="state-list-suggested-tag">Suggested next</span>
                  )}
                </span>
                <span className="state-list-meta">
                  {row.mastered ? "Mastered" : "Learn"}
                </span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
