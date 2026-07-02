import type { RegionProgressSummary } from "../progress/regionProgress";

interface RegionMiniMapProps {
  progress: RegionProgressSummary;
  size?: "sm" | "md";
}

function chipClass(
  fullyMastered: boolean,
  tiersMastered: number,
  suggested: boolean,
): string {
  if (suggested) return "region-chip region-chip--suggested";
  if (fullyMastered) return "region-chip region-chip--gold";
  if (tiersMastered > 0) return "region-chip region-chip--bronze";
  return "region-chip region-chip--none";
}

export function RegionMiniMap({ progress, size = "sm" }: RegionMiniMapProps) {
  return (
    <div
      className={`region-mini-map region-mini-map--${size}`}
      role="img"
      aria-label={`${progress.regionName} progress map`}
    >
      {progress.states.map((state) => (
        <span
          key={state.usps}
          className={chipClass(state.fullyMastered, state.tiersMastered, state.suggested)}
          title={state.name}
        >
          {state.usps}
        </span>
      ))}
    </div>
  );
}
