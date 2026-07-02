import type { HubProgressSummary } from "../progress/journeyProfile";

interface HubProgressCardProps {
  data: HubProgressSummary;
  onClick: () => void;
}

const RING_R = 28;
const RING_C = 2 * Math.PI * RING_R;

function LevelRing({ level, pct }: { level: number; pct: number }) {
  const offset = RING_C * (1 - pct / 100);

  return (
    <svg className="hub-progress-ring" viewBox="0 0 72 72" aria-hidden>
      <circle className="hub-progress-ring-track" cx="36" cy="36" r={RING_R} fill="none" />
      <circle
        className="hub-progress-ring-fill"
        cx="36"
        cy="36"
        r={RING_R}
        fill="none"
        strokeDasharray={RING_C}
        strokeDashoffset={offset}
        transform="rotate(-90 36 36)"
      />
      <text className="hub-progress-ring-lv" x="36" y="29" textAnchor="middle">
        LV
      </text>
      <text className="hub-progress-ring-num" x="36" y="47" textAnchor="middle">
        {level}
      </text>
    </svg>
  );
}

export function HubProgressCard({ data, onClick }: HubProgressCardProps) {
  const barPct = data.levelProgress
    ? Math.min(100, (data.levelProgress.current / data.levelProgress.needed) * 100)
    : 100;

  return (
    <button type="button" className="hub-progress-card" onClick={onClick}>
      <header className="hub-progress-card-header">
        <span className="hub-progress-card-label">Your progress</span>
        <span className="hub-progress-card-cta">View all ›</span>
      </header>

      <div className="hub-progress-card-main">
        <LevelRing level={data.level} pct={barPct} />
        <div className="hub-progress-card-identity">
          <p className="hub-progress-card-points">
            <span className="hub-progress-card-points-num">{data.points}</span>
            <span className="hub-progress-card-points-unit"> pts</span>
          </p>
          <p className="hub-progress-card-rank">
            {data.title} · Rank {data.level}
          </p>
        </div>
      </div>

      {data.levelProgress ? (
        <div className="hub-progress-card-level">
          <div className="hub-progress-card-level-row">
            <span>Next: Level {data.levelProgress.nextLevel}</span>
            <span>{data.levelProgress.remaining} pts to go</span>
          </div>
          <div
            className="hub-progress-card-bar"
            role="progressbar"
            aria-valuenow={Math.round(barPct)}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`Progress to level ${data.levelProgress.nextLevel}`}
          >
            <div className="hub-progress-card-bar-fill" style={{ width: `${barPct}%` }} />
          </div>
        </div>
      ) : (
        <p className="hub-progress-card-maxed">Maximum rank reached</p>
      )}

      <div className="hub-progress-card-stats">
        <div className="hub-progress-stat">
          <span className="hub-progress-stat-value">{data.statesStarted}</span>
          <span className="hub-progress-stat-label">states</span>
        </div>
        <div className="hub-progress-stat">
          <span className="hub-progress-stat-value">
            <span className="hub-progress-stat-earned">{data.badgesEarned}</span>
            <span className="hub-progress-stat-total">/{data.badgesTotal}</span>
          </span>
          <span className="hub-progress-stat-label">badges</span>
        </div>
        {data.focusRegion ? (
          <div className="hub-progress-stat hub-progress-stat--region">
            <span className="hub-progress-stat-value">{data.focusRegion.shortName}</span>
            <span className="hub-progress-stat-label">
              {data.focusRegion.tiersMastered}/{data.focusRegion.tiersTotal} tiers
            </span>
          </div>
        ) : (
          <div className="hub-progress-stat">
            <span className="hub-progress-stat-value">—</span>
            <span className="hub-progress-stat-label">region</span>
          </div>
        )}
      </div>
    </button>
  );
}
