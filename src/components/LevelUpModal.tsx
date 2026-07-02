import { useEffect } from "react";
import { BadgeArt } from "./BadgeArt";
import { getPerksUnlockedBetween } from "../progress/levelPerks";
import type { LevelUpEvent } from "../progress/types";
import { hapticCorrect } from "../utils/haptics";

interface LevelUpModalProps {
  event: LevelUpEvent;
  onDismiss: () => void;
}

export function LevelUpModal({ event, onDismiss }: LevelUpModalProps) {
  const perks = getPerksUnlockedBetween(event.previousLevel, event.newLevel);
  const primary = perks[perks.length - 1] ?? perks[0];

  useEffect(() => {
    if (primary) hapticCorrect();
  }, [primary]);

  if (!primary) return null;

  return (
    <div className="level-up-overlay" role="dialog" aria-modal="true" aria-labelledby="level-up-title">
      <div className="level-up-card">
        <p className="level-up-eyebrow">Level up!</p>
        <div className="level-up-badge-wrap">
          <BadgeArt id={primary.badgeId} size="lg" alt="" />
        </div>
        <h2 id="level-up-title" className="level-up-title">
          Level {event.newLevel} · {primary.title}
        </h2>
        <p className="level-up-headline">{primary.headline}</p>
        <p className="level-up-detail">{primary.detail}</p>
        {perks.length > 1 && (
          <ul className="level-up-stack">
            {perks.slice(0, -1).map((perk) => (
              <li key={perk.level}>
                Lv {perk.level}: {perk.headline}
              </li>
            ))}
          </ul>
        )}
        <button type="button" className="btn-primary level-up-cta" onClick={onDismiss}>
          Nice!
        </button>
      </div>
    </div>
  );
}
