import { getDailyStatus, getDailyAttemptsRemaining, canPlayDailyToday } from "../progress/dailyChallenge";

interface DailyChallengeCardProps {
  onPlay: () => void;
  variant?: "hub" | "panel";
}

export function DailyChallengeCard({ onPlay, variant = "panel" }: DailyChallengeCardProps) {
  const { challenge, best, completed } = getDailyStatus();
  const attemptsLeft = getDailyAttemptsRemaining();
  const canPlay = canPlayDailyToday();

  if (variant === "hub") {
    return (
      <button
        type="button"
        className={`hub-card hub-card--action hub-daily-card${!canPlay ? " hub-daily-card--disabled" : ""}`}
        onClick={onPlay}
        disabled={!canPlay}
        aria-label={`Today's daily challenge: ${challenge.label}`}
      >
        <span className="hub-daily-icon" aria-hidden>
          {completed ? "✓" : "☀️"}
        </span>
        <div className="hub-daily-main">
          <p className="hub-card-label">Daily challenge</p>
          <p className="hub-card-title">{challenge.label}</p>
          <p className="hub-card-desc">{challenge.subtitle}</p>
          {best !== null && (
            <p className="hub-card-desc hub-card-desc--accent">Best today: {best}%</p>
          )}
          {attemptsLeft > 0 && attemptsLeft < 2 && (
            <p className="hub-card-desc hub-card-desc--accent">
              {attemptsLeft} try left today
            </p>
          )}
        </div>
        <span className="hub-daily-pill">
          {!canPlay ? "Done" : completed ? "Again ›" : "Play ›"}
        </span>
      </button>
    );
  }

  return (
    <section className="daily-challenge-card" aria-label="Today's daily challenge">
      <div className="daily-challenge-head">
        <div>
          <p className="daily-challenge-label">Today&apos;s challenge</p>
          <p className="daily-challenge-title">{challenge.label}</p>
          <p className="daily-challenge-desc">{challenge.subtitle}</p>
        </div>
        {completed && (
          <span className="daily-challenge-done" aria-label="Completed today">
            ✓
          </span>
        )}
      </div>
      {best !== null && <p className="daily-challenge-best">Best today: {best}%</p>}
      <button type="button" className="btn-primary daily-challenge-play" onClick={onPlay}>
        {completed ? "Play again" : "Play daily challenge"}
      </button>
      <p className="daily-challenge-note">A new regional focus unlocks each UTC day.</p>
    </section>
  );
}
