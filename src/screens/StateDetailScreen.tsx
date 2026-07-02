import { useMemo } from "react";
import { getCitiesForTier, PLAYABLE_TIERS, type TierId } from "../data/tiers";
import { BackButton } from "../components/BackButton";
import { MasteryBadge } from "../components/MasteryBadge";
import { SpeedBadge } from "../components/SpeedBadge";
import { formatElapsed } from "../progress/speed";
import { getNextRecommendation } from "../progress/nextRecommendation";
import { getTierProgress } from "../progress/stateSummary";
import type { RecommendationAction } from "../progress/types";
import type { QuizPlayMode, StateMeta } from "../types/quiz";

interface StateDetailScreenProps {
  stateMeta: StateMeta;
  backLabel?: string;
  onStartTier: (tierId: TierId, mode: QuizPlayMode) => void;
  onPracticeMissed?: (action: Extract<RecommendationAction, { type: "practice_missed" }>) => void;
  onCreateCustom: () => void;
  onLearn: () => void;
  highlightLearn?: boolean;
  onBack: () => void;
}

function LearnModeIcon() {
  return (
    <span className="mode-learn-icon-wrap" aria-hidden>
      <span className="mode-learn-icon-stack">
        <span className="mode-learn-icon-card mode-learn-icon-card--a" />
        <span className="mode-learn-icon-card mode-learn-icon-card--b" />
        <span className="mode-learn-icon-card mode-learn-icon-card--c" />
      </span>
    </span>
  );
}

export function StateDetailScreen({
  stateMeta,
  backLabel = "Back to states",
  onStartTier,
  onPracticeMissed,
  onCreateCustom,
  onLearn,
  highlightLearn = false,
  onBack,
}: StateDetailScreenProps) {
  const tiers = useMemo(
    () =>
      PLAYABLE_TIERS.map((tier) => {
        const cities = getCitiesForTier(stateMeta, tier.id);
        const progress = getTierProgress(stateMeta.id, tier.id);
        return { ...tier, cities, progress };
      }),
    [stateMeta],
  );

  const nextStep = getNextRecommendation({ skipPractice: true });
  const practiceStep = getNextRecommendation();
  const practiceOffer =
    practiceStep.type === "practice_missed" && practiceStep.stateId === stateMeta.id
      ? practiceStep
      : null;
  const recommendedTierId =
    nextStep.type === "start_tier" && nextStep.stateId === stateMeta.id
      ? nextStep.tierId
      : null;

  return (
    <div className="screen state-detail-screen">
      <nav className="screen-nav" aria-label="Navigation">
        <BackButton onClick={onBack} label={backLabel} />
      </nav>
      <div className="state-detail-body">
        <header className="state-detail-header">
          <h1>{stateMeta.name}</h1>
          <p className="subtitle">Choose how you want to play</p>
        </header>

        {practiceOffer && onPracticeMissed && (
          <button
            type="button"
            className="mode-practice-card"
            onClick={() => onPracticeMissed(practiceOffer)}
          >
            <span className="mode-practice-card-main">
              <span className="mode-practice-card-label">Practice missed cities</span>
              <span className="mode-practice-card-desc">
                {practiceOffer.cities.length}{" "}
                {practiceOffer.cities.length === 1 ? "city" : "cities"} from your last quiz
              </span>
            </span>
            <span className="mode-practice-card-cta" aria-hidden>
              ›
            </span>
          </button>
        )}

        <ul className="mode-tier-list">
          {tiers.map((tier) => {
            const isRecommended = recommendedTierId === tier.id;
            return (
              <li key={tier.id}>
                <article
                  className={`mode-tier-card${isRecommended ? " mode-tier-card--recommended" : ""}`}
                >
                  <div className="mode-tier-card-top">
                    <div className="mode-tier-card-main">
                      <div className="mode-tier-card-titleline">
                        <h2 className="mode-tier-card-title">{tier.label}</h2>
                        {isRecommended && (
                          <span className="mode-tier-card-rec">Recommended</span>
                        )}
                      </div>
                      <p className="mode-tier-card-desc">
                        {tier.description} · {tier.cities.length} cities
                      </p>
                    </div>
                    <div className="mode-tier-card-aside">
                      <div className="mode-tier-card-badges">
                        {tier.progress.badge !== "none" && (
                          <MasteryBadge badge={tier.progress.badge} size="sm" showStar />
                        )}
                        {tier.progress.speedBadge !== "none" && (
                          <SpeedBadge badge={tier.progress.speedBadge} size="sm" />
                        )}
                      </div>
                      {tier.progress.best !== null ? (
                        <span className="mode-tier-card-best">Best {tier.progress.best}%</span>
                      ) : (
                        <span className="mode-tier-card-status">Not played</span>
                      )}
                      {tier.progress.bestTimeMs !== null && (
                        <span className="mode-tier-card-time">
                          {formatElapsed(tier.progress.bestTimeMs)} perfect
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="mode-tier-card-actions">
                    <button
                      type="button"
                      className="mode-play-btn mode-play-btn--tap"
                      onClick={() => onStartTier(tier.id, "tap")}
                    >
                      <span className="mode-play-btn-emoji" aria-hidden>
                        👆
                      </span>
                      Tap
                    </button>
                    <button
                      type="button"
                      className="mode-play-btn mode-play-btn--type"
                      onClick={() => onStartTier(tier.id, "type")}
                    >
                      <span className="mode-play-btn-emoji" aria-hidden>
                        ⌨️
                      </span>
                      Type
                    </button>
                  </div>
                </article>
              </li>
            );
          })}
        </ul>

        <button
          type="button"
          className={`mode-learn-card${highlightLearn ? " mode-learn-card--highlight" : ""}`}
          onClick={onLearn}
        >
          <LearnModeIcon />
          <span className="mode-learn-card-main">
            <span className="mode-learn-card-label">
              Learn mode
              {highlightLearn && <span className="mode-learn-card-tag">Start here</span>}
            </span>
            <span className="mode-learn-card-desc">
              Explore cities a few at a time by map area
            </span>
          </span>
          <span className="mode-learn-card-cta" aria-hidden>
            ›
          </span>
        </button>

        <button type="button" className="mode-custom-btn" onClick={onCreateCustom}>
          + Create custom quiz
        </button>
      </div>
    </div>
  );
}
