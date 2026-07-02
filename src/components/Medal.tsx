import { useId } from "react";
import type { MasteryBadge } from "../types/quiz";

export type MedalTier = Exclude<MasteryBadge, "none">;

interface MedalProps {
  tier: MedalTier;
  size?: number;
  locked?: boolean;
  className?: string;
  alt?: string;
}

const TIER_PALETTE: Record<
  MedalTier,
  { rim: string; face: string; shine: string; star: string }
> = {
  bronze: { rim: "#9A5B1E", face: "#CD7F32", shine: "#E8A54B", star: "#FFF4E6" },
  silver: { rim: "#6B7280", face: "#A8B0BC", shine: "#D8DEE6", star: "#F9FAFB" },
  gold: { rim: "#B8860B", face: "#E8B84A", shine: "#F5D76E", star: "#FFFBEB" },
};

export function Medal({ tier, size = 40, locked = false, className = "", alt }: MedalProps) {
  const colors = TIER_PALETTE[tier];
  const gradId = useId();
  const label = alt ?? `${tier} medal${locked ? " (locked)" : ""}`;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      role="img"
      aria-label={label}
      className={`medal-icon${locked ? " medal-icon--locked" : ""} ${className}`.trim()}
    >
      <defs>
        <radialGradient id={gradId} cx="38%" cy="32%" r="68%">
          <stop offset="0%" stopColor={colors.shine} />
          <stop offset="100%" stopColor={colors.face} />
        </radialGradient>
      </defs>
      <circle cx="32" cy="32" r="30" fill={colors.rim} opacity={locked ? 0.45 : 1} />
      <circle cx="32" cy="32" r="26" fill={`url(#${gradId})`} opacity={locked ? 0.4 : 1} />
      <circle
        cx="32"
        cy="32"
        r="22"
        fill="none"
        stroke="rgba(255,255,255,0.35)"
        strokeWidth="1.5"
        opacity={locked ? 0.35 : 1}
      />
      <path
        d="M32 18 L34.8 26.2 L43.6 26.2 L36.4 31.2 L39.2 39.4 L32 34.4 L24.8 39.4 L27.6 31.2 L20.4 26.2 L29.2 26.2 Z"
        fill={colors.star}
        opacity={locked ? 0.35 : 0.95}
      />
      {locked && (
        <>
          <circle cx="32" cy="32" r="30" fill="rgba(255,255,255,0.42)" />
          <rect x="28" y="27" width="8" height="10" rx="1.5" fill="#8a7d86" />
          <path
            d="M26 27 V24 C26 20.5 28.8 18 32 18 C35.2 18 38 20.5 38 24 V27"
            fill="none"
            stroke="#8a7d86"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
        </>
      )}
    </svg>
  );
}
