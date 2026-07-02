import type { MasteryBadge as MasteryBadgeType } from "../types/quiz";

const LABELS: Record<Exclude<MasteryBadgeType, "none">, string> = {
  bronze: "Bronze",
  silver: "Silver",
  gold: "Gold",
};

interface MasteryBadgeProps {
  badge: MasteryBadgeType;
  size?: "sm" | "md";
  showStar?: boolean;
}

export function MasteryBadge({ badge, size = "md", showStar = false }: MasteryBadgeProps) {
  if (badge === "none") return null;

  return (
    <span className={`mastery-badge mastery-badge--${badge} mastery-badge--${size}`}>
      {showStar && <span className="mastery-badge-star" aria-hidden>★ </span>}
      {LABELS[badge]}
    </span>
  );
}
