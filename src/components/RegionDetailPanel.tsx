import { REGIONS } from "../data/regions";
import { StateSummaryBadge } from "./StateSummaryBadge";
import { RegionMiniMap } from "./RegionMiniMap";
import { RegionalQuizTeaser } from "./RegionalQuizTeaser";
import { getRegionProgress } from "../progress/regionProgress";
import type { QuizPlayMode } from "../types/quiz";
import { getStateMasterySummary } from "../progress/stateSummary";

interface RegionDetailPanelProps {
  regionId: string;
  onSelectRegion: (regionId: string) => void;
  onSelectState: (usps: string) => void;
  onStartRegionQuiz: (regionId: string, mode?: QuizPlayMode) => void;
}

export function RegionDetailPanel({
  regionId,
  onSelectRegion,
  onSelectState,
  onStartRegionQuiz,
}: RegionDetailPanelProps) {
  const progress = getRegionProgress(regionId);
  if (!progress) return null;

  const tierPct =
    progress.tiersTotal > 0
      ? Math.round((progress.tiersMastered / progress.tiersTotal) * 100)
      : 0;

  return (
    <div className="region-detail-panel">
      <header className="region-detail-header">
        <h2 className="region-detail-title">{progress.regionName}</h2>
        <p className="region-detail-subtitle">
          {progress.statesTouched}/{progress.statesTotal} states started · {progress.tiersMastered}/
          {progress.tiersTotal} tier badges
        </p>
      </header>

      <div className="region-picker region-picker--detail" role="tablist" aria-label="Regions">
        {REGIONS.map((region) => (
          <button
            key={region.id}
            type="button"
            role="tab"
            aria-selected={region.id === regionId}
            className={`region-picker-tab${region.id === regionId ? " region-picker-tab--active" : ""}`}
            onClick={() => onSelectRegion(region.id)}
          >
            {region.shortName}
          </button>
        ))}
      </div>

      <div className="region-detail-overview">
        <RegionMiniMap progress={progress} size="md" />
        <div
          className="region-detail-progress-bar"
          role="progressbar"
          aria-valuenow={tierPct}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`${progress.tiersMastered} of ${progress.tiersTotal} tier badges`}
        >
          <div className="region-detail-progress-fill" style={{ width: `${tierPct}%` }} />
        </div>
      </div>

      <RegionalQuizTeaser
        regionId={regionId}
        onPlay={(mode) => onStartRegionQuiz(regionId, mode)}
      />

      <ul className="state-list state-list--flat">
        {progress.states.map((state) => {
          const mastery = getStateMasterySummary(state.usps);
          return (
          <li key={state.usps}>
            <button
              type="button"
              className={`state-list-item state-list-item--available${state.suggested ? " state-list-item--suggested" : ""}`}
              onClick={() => onSelectState(state.usps)}
            >
              <span className="state-list-name">
                {state.name}
                {state.suggested && (
                  <span className="state-list-suggested-tag">Suggested next</span>
                )}
              </span>
              <span className="state-list-meta">
                {mastery.tiersMastered > 0 && <StateSummaryBadge summary={mastery} size="sm" />}
                <span className="state-list-badge state-list-badge--ready">
                  {state.tiersMastered > 0
                    ? `${state.tiersMastered}/${state.tierCount} tiers`
                    : "Not started"}
                </span>
              </span>
            </button>
          </li>
          );
        })}
      </ul>
    </div>
  );
}
