import { Suspense, lazy, useEffect, useMemo, useState, type FormEvent } from "react";
import { getRegionById } from "../data/regions";
import { getDailyChallenge } from "../progress/dailyChallenge";
import { getTierLabel } from "../data/tiers";
import { ZONE_LABELS } from "../data/learnZones";
import type { LearnZoneId } from "../data/learnZones";
import { BackButton } from "../components/BackButton";
import { useQuiz } from "../hooks/useQuiz";
import { countRevealableLetters } from "../utils/typeHint";
import { formatElapsed, tracksSpeed } from "../progress/speed";
import type {
  CityMeta,
  ParentQuizKind,
  Peak,
  QuizKind,
  QuizPlayMode,
  QuizResult,
  StateMeta,
} from "../types/quiz";

interface QuizScreenProps {
  stateMeta: StateMeta;
  peaks: Peak[];
  quizCities: CityMeta[];
  quizKind: QuizKind;
  playMode?: QuizPlayMode;
  regionId?: string | null;
  useNationalMap?: boolean;
  learnZoneId?: LearnZoneId | null;
  practiceParentKind?: ParentQuizKind | null;
  onComplete: (result: QuizResult) => void;
  onBack: () => void;
}

const NationalMap = lazy(async () => import("../components/NationalMap").then((m) => ({ default: m.NationalMap })));
const RegionMap = lazy(async () => import("../components/RegionMap").then((m) => ({ default: m.RegionMap })));
const StateMap = lazy(async () => import("../components/StateMap").then((m) => ({ default: m.StateMap })));

export function QuizScreen({
  stateMeta,
  peaks,
  quizCities,
  quizKind,
  playMode = "tap",
  regionId = null,
  useNationalMap = false,
  learnZoneId,
  practiceParentKind,
  onComplete,
  onBack,
}: QuizScreenProps) {
  const activeCityIds = useMemo(() => new Set(quizCities.map((c) => c.id)), [quizCities]);
  const quiz = useQuiz(quizCities);
  const daily = quizKind === "daily" ? getDailyChallenge() : null;
  const isTypeMode = playMode === "type";
  const isRegional = quizKind === "regional" && regionId;
  const isNational = quizKind === "national" || useNationalMap;
  const [typedName, setTypedName] = useState("");
  const showTimer = tracksSpeed(quizKind);

  useEffect(() => {
    if (quiz.finished) {
      onComplete(quiz.result);
    }
  }, [quiz.finished, quiz.result, onComplete]);

  useEffect(() => {
    setTypedName("");
  }, [quiz.index]);

  const handleTap = (cityId: string | null) => {
    if (!quiz.current || isTypeMode) return;

    const neededHint = quiz.showHint;
    quiz.answer(cityId);

    if (cityId === quiz.current.id && neededHint) {
      quiz.recordMissIfNeeded();
    }
  };

  const handleSubmitType = (e?: FormEvent) => {
    e?.preventDefault();
    if (!quiz.current || !typedName.trim()) return;

    const neededHint = quiz.showHint || quiz.typeLettersRevealed > 0;
    const ok = quiz.submitName(typedName);
    if (ok) {
      if (neededHint) quiz.recordMissIfNeeded();
      setTypedName("");
    }
  };

  const typeHintLettersTotal = quiz.current ? countRevealableLetters(quiz.current.name) : 0;
  const typeHintMaxed = quiz.typeLettersRevealed >= typeHintLettersTotal && typeHintLettersTotal > 0;

  const regionName = regionId ? getRegionById(regionId)?.name : null;

  const headerLabel =
    quizKind === "learn" && learnZoneId
      ? `Learn · ${ZONE_LABELS[learnZoneId]}`
      : quizKind === "practice" && practiceParentKind
        ? `Practice · ${practiceParentKind === "daily" ? "Daily" : getTierLabel(practiceParentKind)}`
        : quizKind === "daily" && daily
          ? `Daily · ${daily.label}`
          : quizKind === "regional" && regionName
            ? `Regional · ${regionName}`
            : quizKind === "national"
              ? `National · Top 100${isTypeMode ? " · Type" : ""}`
              : quizKind === "major" || quizKind === "full"
              ? `${getTierLabel(quizKind)}${isTypeMode ? " · Type" : ""}`
              : "";

  const mapProps = {
    activeCityIds,
    targetCityId: quiz.current?.id ?? null,
    solvedIds: quiz.solvedIds,
    wrongFlashId: quiz.wrongFlashId,
    correctFlashId: quiz.correctFlashId,
    showHint: quiz.showHint,
    disableTap: isTypeMode,
    alwaysHighlightTarget: isTypeMode,
    onCityTap: handleTap,
  };

  return (
    <div className="screen quiz-screen">
      <div className="quiz-map-stack">
        <header className="quiz-topcard">
        <div className="quiz-nav">
          <BackButton onClick={onBack} label="Leave quiz" variant="dark" />
          {headerLabel && <p className="quiz-nav-title">{headerLabel}</p>}
          <button
            type="button"
            className="quiz-icon-btn"
            onClick={() => {
              quiz.reset();
              setTypedName("");
            }}
            aria-label="Restart quiz"
          >
            <svg width="18" height="18" viewBox="0 0 20 20" fill="none" aria-hidden="true">
              <path
                d="M15.5 6.5A6 6 0 1 0 16 10"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
              <path
                d="M16 3.5V7H12.5"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>

        <div className="quiz-progress-row">
          <div
            className="quiz-segments"
            role="progressbar"
            aria-valuenow={quiz.score}
            aria-valuemin={0}
            aria-valuemax={quiz.total}
            aria-label="Cities found"
          >
            {Array.from({ length: quiz.total }, (_, i) => (
              <span
                key={i}
                className={`quiz-segment${i < quiz.score ? " quiz-segment--on" : ""}${i === quiz.index ? " quiz-segment--active" : ""}`}
              />
            ))}
          </div>
          <span className="quiz-correct-pill">
            <svg width="13" height="13" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path
                d="M3.5 8.5L6.5 11.5L12.5 4.5"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            {quiz.score} correct
          </span>
          {showTimer && (
            <span className="quiz-timer-pill" aria-live="polite">
              {formatElapsed(quiz.elapsedMs)}
            </span>
          )}
        </div>

        {isTypeMode ? (
          <div className="quiz-find-row">
            <span className="quiz-find-label">Type</span>
            <span
              className={`quiz-find-pill quiz-find-pill--type${quiz.typeLettersRevealed > 0 ? " quiz-find-pill--type-hint" : ""}`}
            >
              {quiz.typeLettersRevealed > 0
                ? quiz.typeHintDisplay
                : "Name the highlighted city"}
            </span>
          </div>
        ) : (
          <div className="quiz-find-row">
            <span className="quiz-find-label">Find</span>
            <span
              className={`quiz-find-pill${quiz.feedbackFlash === "correct" ? " quiz-find-pill--success" : ""}`}
            >
              {quiz.current?.name ?? "…"}
            </span>
          </div>
        )}
        </header>

        <div
          className={`map-area${quiz.feedbackFlash ? ` map-area--flash-${quiz.feedbackFlash}` : ""}`}
        >
          <Suspense fallback={<div className="map-loading">Loading map...</div>}>
            {isNational ? (
              <NationalMap {...mapProps} />
            ) : isRegional && regionId ? (
              <RegionMap regionId={regionId} {...mapProps} />
            ) : (
              <StateMap stateMeta={stateMeta} peaks={peaks} {...mapProps} />
            )}
          </Suspense>
          <div className="map-compass" aria-hidden="true">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M12 3L15 12L12 10.5L9 12L12 3Z" fill="#e5533c" />
              <path d="M12 21L9 12L12 13.5L15 12L12 21Z" fill="#ffffff" fillOpacity="0.85" />
            </svg>
            <span className="map-compass-n">N</span>
          </div>
          <p className="zoom-hint">Pinch to zoom · drag to pan</p>
        </div>
      </div>

      <div className="quiz-controls">
          {isTypeMode ? (
            <form
              className={`quiz-type-form${quiz.typeWrongFlash ? " quiz-type-form--wrong" : ""}`}
              onSubmit={handleSubmitType}
            >
              <input
                type="text"
                className="quiz-type-input"
                value={typedName}
                onChange={(e) => setTypedName(e.target.value)}
                placeholder="Enter city name"
                autoComplete="off"
                autoCapitalize="words"
                spellCheck={false}
                aria-label="City name"
                disabled={!quiz.current}
              />
              <button type="submit" className="quiz-type-submit" disabled={!quiz.current || !typedName.trim()}>
                Check
              </button>
            </form>
          ) : null}

          <div className="quiz-actions">
            <button
              type="button"
              className="quiz-action-btn"
              onClick={() => quiz.revealHint(isTypeMode)}
              disabled={!quiz.current || (isTypeMode ? typeHintMaxed : quiz.showHint)}
            >
              <span className="quiz-action-icon" aria-hidden="true">
                💡
              </span>
              Hint
            </button>
            <button type="button" className="quiz-action-btn" onClick={quiz.skip} disabled={!quiz.current}>
              Skip
              <span className="quiz-action-chevron" aria-hidden="true">
                ›
              </span>
            </button>
          </div>
        </div>
    </div>
  );
}
