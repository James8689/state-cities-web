import { REGIONS } from "../data/regions";
import { DailyChallengeCard } from "../components/DailyChallengeCard";
import { HubProgressCard } from "../components/HubProgressCard";
import {
  getNextRecommendation,
  pickRandomStateUsps,
} from "../progress/nextRecommendation";
import { getHubProgressSummary } from "../progress/journeyProfile";
import { getFocusRegionId, getRegionProgress } from "../progress/regionProgress";
import type { RecommendationAction } from "../progress/types";

interface CampaignHubScreenProps {
  onContinue: (action: RecommendationAction) => void;
  onBrowseStates: () => void;
  onOpenJourney: () => void;
  onRandomState: (usps: string) => void;
  onStartDaily: () => void;
}

function exploreRegionalHint(regionId: string): string | null {
  const progress = getRegionProgress(regionId);
  if (!progress) return null;
  if (progress.regionalQuizUnlocked) {
    return `${progress.shortName} regional quiz ready`;
  }
  if (progress.statesAtBronze > 0) {
    return `Regional quiz · ${progress.statesAtBronze}/${progress.regionalQuizUnlock} states in ${progress.shortName}`;
  }
  return null;
}

function continueCta(action: RecommendationAction): string {
  if (action.type === "pick_start") return "Choose a state";
  return `Open ${action.stateName}`;
}

export function CampaignHubScreen({
  onContinue,
  onBrowseStates,
  onOpenJourney,
  onRandomState,
  onStartDaily,
}: CampaignHubScreenProps) {
  const recommendation = getNextRecommendation();
  const hubProgress = getHubProgressSummary();
  const regionalHint = exploreRegionalHint(getFocusRegionId());

  return (
    <div className="screen campaign-hub-screen">
      <header className="campaign-hub-header">
        <h1>State Cities</h1>
        <p className="campaign-hub-tagline">Conquer the map, region by region</p>
      </header>

      <div className="campaign-hub-body">
        {recommendation.type === "pick_start" ? (
          <section className="hub-hero hub-hero--start">
            <div className="hub-hero-content">
              <p className="hub-hero-eyebrow">Start your journey</p>
              <h2 className="hub-hero-title">Pick a region and master its cities</h2>
              <p className="hub-hero-reason">
                Work through the country in chunks — Northeast, Midwest, West Coast, and more.
              </p>
              <div className="hub-hero-actions">
                <button type="button" className="btn-primary" onClick={onBrowseStates}>
                  Choose a state
                </button>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => onRandomState(pickRandomStateUsps())}
                >
                  Random state
                </button>
              </div>
            </div>
          </section>
        ) : (
          <section className="hub-hero">
            <div className="hub-hero-content">
              <p className="hub-hero-eyebrow">Continue</p>
              <h2 className="hub-hero-title">{recommendation.label}</h2>
              <p className="hub-hero-reason">{recommendation.reason}</p>
              <button
                type="button"
                className="btn-primary hub-hero-cta"
                onClick={() => onContinue(recommendation)}
              >
                {continueCta(recommendation)}
              </button>
            </div>
          </section>
        )}

        <DailyChallengeCard variant="hub" onPlay={onStartDaily} />

        <button
          type="button"
          className="hub-card hub-card--action hub-explore-card"
          onClick={onBrowseStates}
        >
          <span className="hub-explore-icon" aria-hidden>
            🗺
          </span>
          <div className="hub-explore-main">
            <p className="hub-card-label">Explore</p>
            <p className="hub-card-title">View the country</p>
            <p className="hub-card-desc">{REGIONS.length} regions · 50 states</p>
            {regionalHint && (
              <p className="hub-card-desc hub-card-desc--accent">{regionalHint}</p>
            )}
          </div>
          <span className="hub-explore-pill">Browse ›</span>
        </button>

        <HubProgressCard data={hubProgress} onClick={onOpenJourney} />

        <section className="hub-store-placeholder" aria-label="Store">
          <p className="hub-store-label">Store</p>
          <p className="hub-store-desc">Unlock boosts and extras — coming later</p>
        </section>
      </div>

      <footer className="campaign-hub-footer">
        <a className="state-select-footer-link" href="./privacy.html">
          Privacy Policy
        </a>
      </footer>
    </div>
  );
}
