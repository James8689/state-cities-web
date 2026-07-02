import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { CityMeta, QuizResult } from "../types/quiz";
import { matchesCityName } from "../utils/cityNameMatch";
import { hapticCorrect, hapticIncorrect } from "../utils/haptics";
import { buildTypeHintDisplay, countRevealableLetters } from "../utils/typeHint";
import { tapHintMissThreshold } from "../progress/levelPerks";

function shuffle<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

const CORRECT_FEEDBACK_MS = 950;

export function useQuiz(cities: CityMeta[]) {
  const [queue, setQueue] = useState(() => shuffle(cities));
  const [index, setIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [misses, setMisses] = useState(0);
  const [missedCities, setMissedCities] = useState<CityMeta[]>([]);
  const [finished, setFinished] = useState(false);
  const [solvedIds, setSolvedIds] = useState<Set<string>>(() => new Set());
  const [wrongFlashId, setWrongFlashId] = useState<string | null>(null);
  const [correctFlashId, setCorrectFlashId] = useState<string | null>(null);
  const [feedbackFlash, setFeedbackFlash] = useState<"correct" | "wrong" | null>(null);
  // Partial-credit accuracy: each city is worth 1 point, each wrong guess costs
  // half (1st try = 1.0, one miss = 0.5, two misses / hint = 0.0).
  const [points, setPoints] = useState(0);
  const [firstTry, setFirstTry] = useState(0);
  const [forcedHint, setForcedHint] = useState(false);
  const [typeLettersRevealed, setTypeLettersRevealed] = useState(0);
  const [typeWrongFlash, setTypeWrongFlash] = useState(false);
  const inputLockedRef = useRef(false);
  const startTimeRef = useRef(Date.now());
  const [elapsedMs, setElapsedMs] = useState(0);

  const current = queue[index] ?? null;
  const total = queue.length;

  const hintMissThreshold = tapHintMissThreshold();
  const showHint = misses >= hintMissThreshold || forcedHint;

  useEffect(() => {
    if (finished) {
      setElapsedMs(Date.now() - startTimeRef.current);
      return;
    }
    const id = window.setInterval(() => {
      setElapsedMs(Date.now() - startTimeRef.current);
    }, 200);
    return () => window.clearInterval(id);
  }, [finished]);

  const advance = useCallback(() => {
    inputLockedRef.current = false;
    setMisses(0);
    setForcedHint(false);
    setTypeLettersRevealed(0);
    setCorrectFlashId(null);
    if (index + 1 >= queue.length) {
      setFinished(true);
    } else {
      setIndex((i) => i + 1);
    }
  }, [index, queue.length]);

  const pulseFeedback = useCallback((kind: "correct" | "wrong") => {
    setFeedbackFlash(kind);
    window.setTimeout(() => setFeedbackFlash((curr) => (curr === kind ? null : curr)), 550);
  }, []);

  const answer = useCallback(
    (cityId: string | null) => {
      if (!current || finished || inputLockedRef.current) return;

      // Taps on empty map / water / mountains are ignored — not a guess.
      if (!cityId) return;

      // Already-found cities are not targets — treat as no tap.
      if (solvedIds.has(cityId)) return;

      const isCorrect = cityId === current.id;

      if (isCorrect) {
        inputLockedRef.current = true;
        hapticCorrect();
        setWrongFlashId(null);
        setCorrectFlashId(current.id);
        pulseFeedback("correct");
        setSolvedIds((prev) => {
          const next = new Set(prev);
          next.add(current.id);
          return next;
        });
        setPoints((p) => p + Math.max(0, 1 - 0.5 * misses));
        if (misses === 0) setFirstTry((f) => f + 1);
        setScore((s) => s + 1);
        window.setTimeout(advance, CORRECT_FEEDBACK_MS);
        return;
      }

      hapticIncorrect();
      setMisses((m) => m + 1);
      pulseFeedback("wrong");
      setWrongFlashId(cityId);
      window.setTimeout(
        () => setWrongFlashId((curr) => (curr === cityId ? null : curr)),
        1800,
      );
    },
    [advance, current, finished, misses, pulseFeedback, solvedIds],
  );

  const submitName = useCallback(
    (text: string) => {
      if (!current || finished || inputLockedRef.current) return false;

      const trimmed = text.trim();
      if (!trimmed) return false;

      if (matchesCityName(trimmed, current.name)) {
        answer(current.id);
        return true;
      }

      hapticIncorrect();
      setMisses((m) => m + 1);
      pulseFeedback("wrong");
      setTypeWrongFlash(true);
      window.setTimeout(() => setTypeWrongFlash(false), 600);
      return false;
    },
    [answer, current, finished, pulseFeedback],
  );

  const result: QuizResult = useMemo(
    () => ({ score, total, points, firstTry, missed: missedCities, elapsedMs }),
    [missedCities, score, total, points, firstTry, elapsedMs],
  );

  const recordMissIfNeeded = useCallback(() => {
    if (!current) return;
    setMissedCities((prev) => (prev.some((c) => c.id === current.id) ? prev : [...prev, current]));
  }, [current]);

  const revealHint = useCallback(
    (typeMode = false) => {
      if (!current || finished || inputLockedRef.current) return;

      if (typeMode) {
        const totalLetters = countRevealableLetters(current.name);
        if (totalLetters === 0 || typeLettersRevealed >= totalLetters) return;

        const next = typeLettersRevealed + 1;
        setTypeLettersRevealed(next);
        setForcedHint(true);

        if (next >= totalLetters) {
          inputLockedRef.current = true;
          recordMissIfNeeded();
          window.setTimeout(advance, CORRECT_FEEDBACK_MS);
        }
        return;
      }

      if (showHint) return;
      setForcedHint(true);
    },
    [advance, current, finished, recordMissIfNeeded, showHint, typeLettersRevealed],
  );

  const typeHintDisplay = current
    ? buildTypeHintDisplay(current.name, typeLettersRevealed)
    : "";

  // Skip the current city: counts as missed (no points), move on.
  const skip = useCallback(() => {
    if (!current || finished || inputLockedRef.current) return;
    inputLockedRef.current = true;
    setWrongFlashId(null);
    recordMissIfNeeded();
    advance();
  }, [advance, current, finished, recordMissIfNeeded]);

  const reset = useCallback(() => {
    inputLockedRef.current = false;
    startTimeRef.current = Date.now();
    setElapsedMs(0);
    setQueue(shuffle(cities));
    setIndex(0);
    setScore(0);
    setMisses(0);
    setMissedCities([]);
    setFinished(false);
    setSolvedIds(new Set());
    setWrongFlashId(null);
    setCorrectFlashId(null);
    setFeedbackFlash(null);
    setPoints(0);
    setFirstTry(0);
    setForcedHint(false);
    setTypeLettersRevealed(0);
    setTypeWrongFlash(false);
  }, [cities]);

  return {
    current,
    index,
    total,
    score,
    showHint,
    solvedIds,
    wrongFlashId,
    correctFlashId,
    feedbackFlash,
    finished,
    result,
    elapsedMs,
    answer,
    submitName,
    typeWrongFlash,
    typeLettersRevealed,
    typeHintDisplay,
    recordMissIfNeeded,
    revealHint,
    skip,
    reset,
  };
}
