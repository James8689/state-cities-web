import type { SpeedBadge as SpeedBadgeType } from "../types/quiz";
import { BadgeArt } from "./BadgeArt";
import type { BadgeAssetId } from "../data/badgeAssets";
import { speedBadgeLabel } from "../progress/speed";

const BADGE_TO_ASSET: Record<Exclude<SpeedBadgeType, "none">, BadgeAssetId> = {
  "quick-draw": "speed:quick-draw",
  "speed-run": "speed:speed-run",
  lightning: "speed:lightning",
};

interface SpeedBadgeProps {
  badge: SpeedBadgeType;
  size?: "sm" | "md";
}

export function SpeedBadge({ badge, size = "md" }: SpeedBadgeProps) {
  if (badge === "none") return null;

  const label = speedBadgeLabel(badge);
  const artSize = size === "sm" ? "sm" : "md";

  return (
    <span className={`speed-badge speed-badge--${badge} speed-badge--${size}`}>
      <BadgeArt id={BADGE_TO_ASSET[badge]} size={artSize} alt={label ?? badge} />
      <span className="speed-badge-label">{label}</span>
    </span>
  );
}
