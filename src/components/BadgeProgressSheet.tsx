import { useEffect, useRef } from "react";
import { Medal } from "./Medal";
import { detailHeaderLabel, type BadgeProgressDetail } from "../progress/badgeWall";
import type { MasteryBadge } from "../types/quiz";

interface BadgeProgressSheetProps {
  detail: BadgeProgressDetail | null;
  onClose: () => void;
  onPlay?: (stateId: string) => void;
}

function heroTier(badge: MasteryBadge): "bronze" | "silver" | "gold" {
  if (badge === "gold") return "gold";
  if (badge === "silver") return "silver";
  if (badge === "bronze") return "bronze";
  return "bronze";
}

export function BadgeProgressSheet({ detail, onClose, onPlay }: BadgeProgressSheetProps) {
  const sheetRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!detail) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [detail, onClose]);

  if (!detail) return null;

  const hero = heroTier(detail.currentBadge);
  const lockedHero = detail.currentBadge === "none";

  return (
    <div className="badge-sheet-backdrop" onClick={onClose} role="presentation">
      <div
        ref={sheetRef}
        className="badge-sheet"
        role="dialog"
        aria-modal="true"
        aria-labelledby="badge-sheet-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="badge-sheet-crown">
          <p className="badge-sheet-eyebrow">{detail.stateName}</p>
          <h2 id="badge-sheet-title" className="badge-sheet-title">
            {detailHeaderLabel(detail)}
          </h2>
        </div>

        <div className="badge-sheet-medal-wrap">
          <div className="badge-sheet-medal-ring">
            <Medal tier={hero} size={72} locked={lockedHero} />
          </div>
        </div>

        <div className="badge-sheet-body">
          <div className="badge-sheet-score">
            {detail.best !== null ? (
              <>
                <span className="badge-sheet-score-value">{detail.best}%</span>
                <span className="badge-sheet-score-label">best</span>
              </>
            ) : (
              <span className="badge-sheet-score-empty">No score yet</span>
            )}
            <p className="badge-sheet-score-meta">{detail.tierLabel}</p>
          </div>

          <ul className="badge-sheet-ladder">
            {detail.ladder.map((row) => {
              const earned = row.earned;
              const locked = !earned && detail.currentBadge === "none";
              return (
                <li
                  key={row.badge}
                  className={`badge-sheet-ladder-row${earned ? " badge-sheet-ladder-row--earned" : ""}${!earned && !locked ? " badge-sheet-ladder-row--next" : ""}`}
                >
                  <Medal tier={row.badge} size={34} locked={!earned} />
                  <div className="badge-sheet-ladder-main">
                    <span className="badge-sheet-ladder-label">
                      {row.badge[0].toUpperCase()}
                      {row.badge.slice(1)}
                    </span>
                    <span className="badge-sheet-ladder-threshold">Score {row.minPct}%+</span>
                  </div>
                  <span
                    className={`badge-sheet-ladder-hint${earned ? " badge-sheet-ladder-hint--earned" : " badge-sheet-ladder-hint--todo"}`}
                  >
                    {row.hint}
                  </span>
                </li>
              );
            })}
          </ul>

          {onPlay && (
            <button
              type="button"
              className="badge-sheet-play"
              onClick={() => onPlay(detail.stateId)}
            >
              {detail.chaseLabel ?? `Play ${detail.stateName} →`}
            </button>
          )}

          <button type="button" className="badge-sheet-close" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
