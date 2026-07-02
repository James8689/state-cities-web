import { useEffect, useLayoutEffect, useMemo, useRef } from "react";
import { STATES } from "../data/states";
import type { StateBundle } from "../types/quiz";
import { StateSummaryBadge } from "../components/StateSummaryBadge";
import { BackButton } from "../components/BackButton";
import { RegionDetailPanel } from "../components/RegionDetailPanel";
import { getStateMasterySummary } from "../progress/stateSummary";
import { sortStatesByProgress } from "../progress/progressGuidance";
import type { ExploreSortMode, ExploreViewState } from "../navigation/exploreView";

const SORT_TABS: { id: ExploreSortMode; label: string }[] = [
  { id: "region", label: "Region" },
  { id: "alphabetical", label: "A–Z" },
  { id: "progress", label: "Progress" },
];

const SORT_SUBTITLES: Record<ExploreSortMode, string> = {
  region: "Pick a region — progress, map, and states",
  alphabetical: "All 50 states in alphabetical order",
  progress: "Most mastered first — suggested next highlighted below",
};

interface StateSelectScreenProps {
  viewState: ExploreViewState;
  onViewStateChange: (patch: Partial<ExploreViewState>) => void;
  backLabel: string;
  onSelectState: (usps: string) => void;
  onStartRegionQuiz: (regionId: string) => void;
  onBack: () => void;
}

function StateListRow({
  bundle,
  onSelectState,
  suggested,
}: {
  bundle: StateBundle;
  onSelectState: (usps: string) => void;
  suggested?: boolean;
}) {
  const mastery = getStateMasterySummary(bundle.meta.id);

  return (
    <li>
      <button
        type="button"
        className={`state-list-item state-list-item--available${suggested ? " state-list-item--suggested" : ""}`}
        onClick={() => onSelectState(bundle.meta.id)}
      >
        <span className="state-list-name">
          {bundle.meta.name}
          {suggested && <span className="state-list-suggested-tag">Suggested next</span>}
        </span>
        <span className="state-list-meta">
          {mastery.tiersMastered > 0 && <StateSummaryBadge summary={mastery} size="sm" />}
          <span className="state-list-badge state-list-badge--ready">
            {mastery.tiersMastered > 0
              ? `${mastery.tiersMastered}/${mastery.tierCount} tiers`
              : `${bundle.meta.cities.length} cities`}
          </span>
          <svg
            className="state-list-chevron"
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            aria-hidden
          >
            <path
              d="M6 4l4 4-4 4"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
      </button>
    </li>
  );
}

export function StateSelectScreen({
  viewState,
  onViewStateChange,
  backLabel,
  onSelectState,
  onStartRegionQuiz,
  onBack,
}: StateSelectScreenProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const isFirstLayoutRef = useRef(true);
  const onViewStateChangeRef = useRef(onViewStateChange);
  onViewStateChangeRef.current = onViewStateChange;
  const { sortMode, regionId } = viewState;

  const alphabeticalStates = useMemo(
    () => [...STATES].sort((a, b) => a.meta.name.localeCompare(b.meta.name)),
    [],
  );

  const progressSort = useMemo(() => sortStatesByProgress(), []);

  useLayoutEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    if (isFirstLayoutRef.current) {
      isFirstLayoutRef.current = false;
      el.scrollTop = viewState.scrollTop;
      return;
    }
  }, [viewState.scrollTop]);

  useLayoutEffect(() => {
    const el = scrollRef.current;
    if (!el || isFirstLayoutRef.current) return;
    el.scrollTop = 0;
  }, [sortMode, regionId]);

  useEffect(() => {
    const node = scrollRef.current;
    return () => {
      const top = node?.scrollTop ?? 0;
      onViewStateChangeRef.current({ scrollTop: top });
    };
  }, []);

  const handleSelectState = (usps: string) => {
    const top = scrollRef.current?.scrollTop ?? 0;
    onViewStateChange({ scrollTop: top });
    onSelectState(usps);
  };

  return (
    <div className="screen state-select-screen">
      <nav className="screen-nav" aria-label="Navigation">
        <BackButton onClick={onBack} label={backLabel} />
      </nav>
      <header className="state-select-header">
        <h1>Explore</h1>
        <p className="state-select-subtitle">{SORT_SUBTITLES[sortMode]}</p>
      </header>

      <div
        className="state-select-tabs"
        role="tablist"
        aria-label="Browse states by"
      >
        {SORT_TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            id={`state-sort-tab-${tab.id}`}
            aria-selected={sortMode === tab.id}
            aria-controls="state-select-panel"
            className={`state-select-tab${sortMode === tab.id ? " state-select-tab--active" : ""}`}
            onClick={() => {
              if (tab.id === sortMode) return;
              onViewStateChange({ sortMode: tab.id, scrollTop: 0 });
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div
        id="state-select-panel"
        ref={scrollRef}
        role="tabpanel"
        aria-labelledby={`state-sort-tab-${sortMode}`}
        className={`state-list-regions${sortMode === "region" ? " state-list-regions--region-detail" : ""}`}
      >
        {sortMode === "region" && (
          <RegionDetailPanel
            regionId={regionId}
            onSelectRegion={(id) => onViewStateChange({ regionId: id, scrollTop: 0 })}
            onSelectState={handleSelectState}
            onStartRegionQuiz={onStartRegionQuiz}
          />
        )}

        {sortMode === "alphabetical" && (
          <ul className="state-list state-list--flat">
            {alphabeticalStates.map((bundle) => (
              <StateListRow
                key={bundle.meta.id}
                bundle={bundle}
                onSelectState={handleSelectState}
              />
            ))}
          </ul>
        )}

        {sortMode === "progress" && (
          <ul className="state-list state-list--flat">
            {progressSort.states.map((bundle) => (
              <StateListRow
                key={bundle.meta.id}
                bundle={bundle}
                onSelectState={handleSelectState}
                suggested={bundle.meta.id === progressSort.suggestedStateId}
              />
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
