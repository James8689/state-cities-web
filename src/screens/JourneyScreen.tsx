import { useEffect, useRef, useState } from "react";
import { BackButton } from "../components/BackButton";
import { BadgeProgressSheet } from "../components/BadgeProgressSheet";
import { Medal } from "../components/Medal";
import { MasteryBadge } from "../components/MasteryBadge";
import { NationalQuizTeaser } from "../components/NationalQuizTeaser";
import {
  displayTierForState,
  getBadgeProgressDetail,
  getStateWallEntries,
  type BadgeProgressDetail,
} from "../progress/badgeWall";
import { getJourneyProfile, type JourneyGoal } from "../progress/journeyProfile";
import { getStreakSummary, getWeeklyGoalSummary } from "../progress/streaks";
import { getTopWeakCities } from "../progress/weakCities";
import { getNextRecommendation } from "../progress/nextRecommendation";
import { MASTERY_THRESHOLDS } from "../progress/mastery";
import { REGIONAL_QUIZ_UNLOCK_COUNT } from "../progress/regionProgress";
import type { QuizPlayMode } from "../types/quiz";

interface JourneyScreenProps {
  onBack: () => void;
  onContinueRecommendation: () => void;
  onBrowseRegion: (regionId: string) => void;
  onPlayState: (usps: string) => void;
  onStartRegionQuiz: (regionId: string, mode?: QuizPlayMode) => void;
  onStartNationalQuiz: (mode?: QuizPlayMode) => void;
  onPracticeWeakCities: () => void;
}

function wallMedalTier(peakBadge: string): "bronze" | "silver" | "gold" {
  if (peakBadge === "gold") return "gold";
  if (peakBadge === "silver") return "silver";
  return "bronze";
}

function goalIsActionable(goal: JourneyGoal): boolean {
  return (
    goal.id === "continue" ||
    goal.id.startsWith("region-") ||
    goal.id.startsWith("play-region-") ||
    goal.id === "play-national" ||
    goal.id === "weak-practice"
  );
}

function handleGoalClick(
  goal: JourneyGoal,
  handlers: Pick<
    JourneyScreenProps,
    | "onContinueRecommendation"
    | "onBrowseRegion"
    | "onStartRegionQuiz"
    | "onStartNationalQuiz"
    | "onPracticeWeakCities"
  >,
) {
  if (goal.id === "continue") {
    handlers.onContinueRecommendation();
    return;
  }
  if (goal.id === "play-national") {
    handlers.onStartNationalQuiz();
    return;
  }
  if (goal.id === "weak-practice") {
    handlers.onPracticeWeakCities();
    return;
  }
  if (goal.id.startsWith("play-region-")) {
    handlers.onStartRegionQuiz(goal.id.slice("play-region-".length));
    return;
  }
  if (goal.id.startsWith("region-")) {
    handlers.onBrowseRegion(goal.id.slice("region-".length));
  }
}

export function JourneyScreen({
  onBack,
  onContinueRecommendation,
  onBrowseRegion,
  onPlayState,
  onStartRegionQuiz,
  onStartNationalQuiz,
  onPracticeWeakCities,
}: JourneyScreenProps) {
  const profile = getJourneyProfile();
  const stateWall = getStateWallEntries();
  const [sheetDetail, setSheetDetail] = useState<BadgeProgressDetail | null>(null);
  const streak = getStreakSummary();
  const weekly = getWeeklyGoalSummary();
  const weakCities = getTopWeakCities(6);
  const goalsRef = useRef<HTMLElement>(null);
  const nextStep = getNextRecommendation({ skipPractice: true });

  useEffect(() => {
    goalsRef.current?.scrollIntoView({ block: "start" });
  }, []);

  return (
    <div className="screen journey-screen">
      <nav className="screen-nav" aria-label="Navigation">
        <BackButton onClick={onBack} label="Back to home" />
      </nav>

      <div className="journey-body">
        <section className="journey-section journey-section--campaign">
          <h2 className="journey-section-title">Streak & weekly goal</h2>
          <div className="journey-campaign-row">
            <div className="journey-campaign-card">
              <span className="journey-campaign-icon" aria-hidden>
                🔥
              </span>
              <p className="journey-campaign-value">
                {streak.current > 0 ? streak.current : 0}
              </p>
              <p className="journey-campaign-label">Day streak</p>
              <p className="journey-campaign-detail">
                {streak.playedToday
                  ? "You're on the board today — nice!"
                  : streak.current > 0
                    ? "Play today to keep it alive"
                    : "Finish a quiz to start a streak"}
              </p>
            </div>
            <div
              className={`journey-campaign-card${weekly.met ? " journey-campaign-card--done" : ""}`}
            >
              <span className="journey-campaign-icon" aria-hidden>
                {weekly.met ? "✓" : "🎯"}
              </span>
              <p className="journey-campaign-value">
                {weekly.completed}/{weekly.target}
              </p>
              <p className="journey-campaign-label">This week</p>
              <p className="journey-campaign-detail">
                {weekly.met
                  ? "Weekly goal done!"
                  : "Major, Full, Daily, or Regional quizzes count"}
              </p>
            </div>
          </div>
        </section>

        <section ref={goalsRef} id="journey-goals" className="journey-section">
          <h2 className="journey-section-title">Active goals</h2>
          {profile.goals.length > 0 ? (
            <ul className="journey-goals">
              {profile.goals.map((goal) => {
                const actionable = goalIsActionable(goal);
                return (
                  <li key={goal.id} className="journey-goal">
                    {actionable ? (
                      <button
                        type="button"
                        className="journey-goal-btn"
                        onClick={() =>
                          handleGoalClick(goal, {
                            onContinueRecommendation,
                            onBrowseRegion,
                            onStartRegionQuiz,
                            onStartNationalQuiz,
                            onPracticeWeakCities,
                          })
                        }
                      >
                        <div className="journey-goal-main">
                          <span className="journey-goal-label">{goal.label}</span>
                          <span className="journey-goal-detail">{goal.detail}</span>
                        </div>
                        {goal.progress && (
                          <span className="journey-goal-progress">
                            {goal.progress.current}/{goal.progress.total}
                          </span>
                        )}
                        <span className="journey-goal-chevron" aria-hidden>
                          ›
                        </span>
                      </button>
                    ) : (
                      <>
                        <div className="journey-goal-main">
                          <span className="journey-goal-label">{goal.label}</span>
                          <span className="journey-goal-detail">{goal.detail}</span>
                        </div>
                        {goal.progress && (
                          <span className="journey-goal-progress">
                            {goal.progress.current}/{goal.progress.total}
                          </span>
                        )}
                      </>
                    )}
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="journey-empty">Play a state quiz to set your first goals.</p>
          )}
          {nextStep.type === "start_tier" && (
            <button
              type="button"
              className="journey-quick-continue"
              onClick={onContinueRecommendation}
            >
              Open {nextStep.stateName} ›
            </button>
          )}
        </section>

        {weakCities.length > 0 && (
          <section className="journey-section">
            <h2 className="journey-section-title">Tough cities</h2>
            <p className="journey-section-desc">
              Cities you&apos;ve needed hints on most often — practice them on the map.
            </p>
            <ul className="journey-weak-list">
              {weakCities.map((city) => (
                <li key={city.cityId} className="journey-weak-item">
                  <span className="journey-weak-name">{city.name}</span>
                  <span className="journey-weak-meta">
                    {city.stateName} · {city.missCount}× struggled
                  </span>
                </li>
              ))}
            </ul>
            <button type="button" className="btn-secondary journey-weak-practice" onClick={onPracticeWeakCities}>
              Practice tough cities
            </button>
          </section>
        )}

        <NationalQuizTeaser onPlay={(mode) => onStartNationalQuiz(mode)} />

        <section className="journey-section">
          <h2 className="journey-section-title">Level path</h2>
          <p className="journey-section-desc">
            Earn points from quizzes, daily challenges, and new badges. Each level updates your
            title on the hub.
          </p>
          <ol className="journey-levels">
            {profile.levels.map((entry) => (
              <li
                key={entry.level}
                className={`journey-level${entry.current ? " journey-level--current" : ""}${entry.unlocked ? " journey-level--unlocked" : ""}`}
              >
                <div className="journey-level-marker">{entry.level}</div>
                <div className="journey-level-main">
                  <span className="journey-level-title">{entry.title}</span>
                  <span className="journey-level-perk">{entry.perk}</span>
                </div>
                <span className="journey-level-pts">{entry.pointsRequired} pts</span>
              </li>
            ))}
          </ol>
        </section>

        <section className="journey-section">
          <h2 className="journey-section-title">Accuracy badges</h2>
          <p className="journey-section-desc">
            Earn Bronze at 70%+, Silver at 85%+, Gold at 100% on Major or Full state tiers.
          </p>
          <div className="journey-accuracy-row">
            {MASTERY_THRESHOLDS.map(({ badge, minPct }) => (
              <div key={badge} className={`journey-accuracy-stat journey-accuracy-stat--${badge}`}>
                <MasteryBadge badge={badge} />
                <span className="journey-accuracy-count">
                  {profile.accuracy[badge]}/{profile.accuracy.total}
                </span>
                <span className="journey-accuracy-threshold">{minPct}%+</span>
              </div>
            ))}
          </div>
        </section>

        <section className="journey-section">
          <h2 className="journey-section-title">State badge wall</h2>
          <p className="journey-section-desc">
            {profile.states.filter((s) => s.fullyMastered).length} mastered ·{" "}
            {profile.states.filter((s) => s.tiersMastered > 0 && !s.fullyMastered).length} in
            progress
          </p>
          <div className="badge-wall badge-wall--states badge-wall--medals">
            {stateWall.map((state) => {
              const hasBadge = state.peakBadge !== "none";
              const tier = wallMedalTier(hasBadge ? state.peakBadge : "bronze");
              return (
                <button
                  key={state.stateId}
                  type="button"
                  className={`badge-wall-medal-cell${hasBadge ? "" : " badge-wall-medal-cell--empty"}`}
                  title={state.stateName}
                  onClick={() =>
                    setSheetDetail(
                      getBadgeProgressDetail(
                        state.stateId,
                        displayTierForState(state.stateId, state.primaryTierId),
                      ),
                    )
                  }
                >
                  <Medal tier={tier} size={34} locked={!hasBadge} />
                  <span className="badge-wall-medal-code">{state.stateId}</span>
                </button>
              );
            })}
          </div>
        </section>

        <BadgeProgressSheet
          detail={sheetDetail}
          onClose={() => setSheetDetail(null)}
          onPlay={(stateId) => {
            setSheetDetail(null);
            onPlayState(stateId);
          }}
        />

        <section id="journey-regions" className="journey-section">
          <h2 className="journey-section-title">Region badge wall</h2>
          <p className="journey-section-desc">
            Master states in each region to unlock regional quizzes.
          </p>
          <div className="badge-wall badge-wall--regions">
            {profile.regions.map((region) => (
              <div
                key={region.regionId}
                className={`badge-wall-region${region.regionalQuizUnlocked ? " badge-wall-region--unlocked" : ""}`}
              >
                <div className="badge-wall-region-head">
                  <span className="badge-wall-region-name">{region.shortName}</span>
                  {region.peakBadge !== "none" && <MasteryBadge badge={region.peakBadge} size="sm" />}
                </div>
                <span className="badge-wall-region-progress">
                  {region.tiersMastered}/{region.tiersTotal} tiers
                </span>
                {region.regionalQuizUnlocked ? (
                  <button
                    type="button"
                    className="badge-wall-region-play"
                    onClick={() => onStartRegionQuiz(region.regionId)}
                  >
                    Play regional quiz
                  </button>
                ) : (
                  <button
                    type="button"
                    className="badge-wall-region-tag"
                    onClick={() => onBrowseRegion(region.regionId)}
                  >
                    {region.statesAtBronze}/{REGIONAL_QUIZ_UNLOCK_COUNT} states for quiz ›
                  </button>
                )}
              </div>
            ))}
          </div>
        </section>

        <section className="journey-section journey-section--soon">
          <h2 className="journey-section-title">Speed badges</h2>
          <p className="journey-section-desc">
            Timed mode is coming soon — race the clock for extra badges on each tier.
          </p>
          <div className="journey-soon-badges">
            {["Quick draw", "Speed run", "Lightning map"].map((label) => (
              <div key={label} className="journey-soon-badge">
                <span className="journey-soon-icon" aria-hidden>
                  ⏱
                </span>
                <span>{label}</span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
