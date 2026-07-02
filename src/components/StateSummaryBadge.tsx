import type { StateMasterySummary } from "../progress/stateSummary";

interface StateSummaryBadgeProps {
  summary: StateMasterySummary;
  size?: "sm" | "md";
}

/** State-level status for browse lists — not the per-tier Bronze/Silver/Gold medals. */
export function StateSummaryBadge({ summary, size = "sm" }: StateSummaryBadgeProps) {
  if (summary.fullyMastered) {
    return (
      <span className={`mastery-badge mastery-badge--mastered mastery-badge--${size}`}>
        Mastered
      </span>
    );
  }

  if (summary.tiersMastered > 0) {
    return (
      <span className={`mastery-badge mastery-badge--started mastery-badge--${size}`}>
        In progress
      </span>
    );
  }

  return null;
}
