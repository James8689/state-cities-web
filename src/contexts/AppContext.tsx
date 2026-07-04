import { createContext, useCallback, useContext, useRef, useState } from "react";
import { getCitiesForTier, type TierId } from "../data/tiers";
import { getStateBundle } from "../data/states";
import type { LearnZoneId } from "../data/learnZones";
import { getRegionQuizCities } from "../data/regionQuiz";
import { getNationalQuizCities, citiesSpanMultipleStates, findCityStateId } from "../data/nationalQuiz";
import { isNationalQuizUnlocked } from "../progress/nationalProgress";
import { weakCitiesToPractice } from "../progress/weakCities";
import { canPlayDailyToday, getDailyChallenge } from "../progress/dailyChallenge";
import {
  getSuggestedStateForRegion,
  learnNeedsHomeState,
} from "../progress/learnProgress";
import { setHomeStateId } from "../progress/storage";
import { getNextRecommendation } from "../progress/nextRecommendation";
import { isParentQuizKind } from "../progress/quizKey";
import {
  createDefaultExploreView,
  type ExploreViewState,
} from "../navigation/exploreView";
import type { RecommendationAction } from "../progress/types";
import type { CityMeta, ParentQuizKind, QuizKind, QuizPlayMode, QuizResult, StateBundle } from "../types/quiz";
import { useNavigate } from "react-router-dom";

export interface AppContextValue {
  activeState: StateBundle | null;
  quizCities: CityMeta[];
  quizKind: QuizKind;
  playMode: QuizPlayMode;
  quizRegionId: string | null;
  quizUseNationalMap: boolean;
  practiceParentKind: ParentQuizKind | null;
  result: QuizResult | null;
  exploreView: ExploreViewState;
  learnStateId: string | null;
  activeLearnZoneId: LearnZoneId | null;
  highlightStateLearn: boolean;
  learnRegionId: string;
  learnRegionSuggested: string | null;
  quizKey: number;
  needsOnboarding: boolean;

  patchExploreView: (patch: Partial<ExploreViewState>) => void;
  startQuiz: (bundle: StateBundle, kind: QuizKind, cities: CityMeta[], mode?: QuizPlayMode) => void;
  startRegionQuiz: (regionId: string, mode?: QuizPlayMode) => void;
  startDailyQuiz: (returnTo?: string) => void;
  startNationalQuiz: (mode?: QuizPlayMode) => void;
  startCrossStatePractice: (cities: CityMeta[]) => void;
  startWeakCityPractice: () => void;
  startPractice: (bundle: StateBundle, parentKind: ParentQuizKind, cities: CityMeta[]) => void;
  startLearn: (bundle: StateBundle, zoneId: LearnZoneId, cities: CityMeta[]) => void;
  handleSelectState: (usps: string) => void;
  handleComplete: (quizResult: QuizResult) => void;
  openContinueDestination: (action: RecommendationAction) => void;
  handleStartTier: (tierId: TierId, mode?: QuizPlayMode) => void;
  handlePlayAgain: () => void;
  handleRetryMissed: () => void;
  goToHub: () => void;
  goToSelect: () => void;
  goToJourney: () => void;
  browseRegion: (regionId: string) => void;
  openStateFromHub: (usps: string) => void;
  startDailyFromHub: () => void;
  completeOnboarding: (usps: string) => void;
  openLearnAreas: (usps: string) => void;
  selectLearnRegion: (regionId: string) => void;
  openLearnForActiveState: () => void;
  handlePracticeMissed: (action: Extract<RecommendationAction, { type: "practice_missed" }>) => void;
  handleQuizBack: () => void;
  goBackToLearnOrState: () => void;
  continueJourney: () => void;
  goBack: () => void;
}

const AppContext = createContext<AppContextValue | null>(null);

export function useAppContext(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useAppContext must be used within AppProvider");
  return ctx;
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const nav = useNavigate();

  const [activeState, setActiveState] = useState<StateBundle | null>(null);
  const [quizCities, setQuizCities] = useState<CityMeta[]>([]);
  const [quizKind, setQuizKind] = useState<QuizKind>("full");
  const [playMode, setPlayMode] = useState<QuizPlayMode>("tap");
  const [quizRegionId, setQuizRegionId] = useState<string | null>(null);
  const [practiceParentKind, setPracticeParentKind] = useState<ParentQuizKind | null>(null);
  const [result, setResult] = useState<QuizResult | null>(null);
  const [exploreView, setExploreView] = useState<ExploreViewState>(createDefaultExploreView);
  const [learnStateId, setLearnStateId] = useState<string | null>(null);
  const [activeLearnZoneId, setActiveLearnZoneId] = useState<LearnZoneId | null>(null);
  const [highlightStateLearn, setHighlightStateLearn] = useState(false);
  const [learnRegionId, setLearnRegionId] = useState<string>(() => createDefaultExploreView().regionId);
  const [learnRegionSuggested, setLearnRegionSuggested] = useState<string | null>(null);
  const [quizReturnTo, setQuizReturnTo] = useState<string>("/");
  const [quizUseNationalMap, setQuizUseNationalMap] = useState(false);
  const quizKeyRef = useRef(0);
  const [quizKey, setQuizKey] = useState(0);
  const [needsOnboarding] = useState(() => learnNeedsHomeState());

  const patchExploreView = useCallback((patch: Partial<ExploreViewState>) => {
    setExploreView((prev) => ({ ...prev, ...patch }));
  }, []);

  const startQuiz = useCallback(
    (bundle: StateBundle, kind: QuizKind, cities: CityMeta[], mode: QuizPlayMode = "tap") => {
      if (cities.length === 0) return;
      setQuizRegionId(null);
      setQuizUseNationalMap(false);
      setPracticeParentKind(null);
      setPlayMode(mode);
      setActiveState(bundle);
      quizKeyRef.current += 1;
      setQuizKey(quizKeyRef.current);
      setQuizCities(cities);
      setQuizKind(kind);
      setResult(null);
      nav("/quiz");
    },
    [nav],
  );

  const startRegionQuiz = useCallback((regionId: string, mode: QuizPlayMode = "tap") => {
    const cities = getRegionQuizCities(regionId);
    if (cities.length === 0) return;
    const anchor = getStateBundle(cities[0]!.stateId);
    if (!anchor) return;

    setQuizRegionId(regionId);
    setQuizUseNationalMap(false);
    setPracticeParentKind(null);
    setPlayMode(mode);
    setActiveState(anchor);
    quizKeyRef.current += 1;
    setQuizKey(quizKeyRef.current);
    setQuizCities(cities);
    setQuizKind("regional");
    setResult(null);
    nav("/quiz");
  }, [nav]);

  const startDailyQuiz = useCallback((returnTo: string = "/") => {
    if (!canPlayDailyToday()) return;
    const challenge = getDailyChallenge();
    const bundle = getStateBundle(challenge.stateId);
    if (!bundle) return;

    setQuizReturnTo(returnTo);
    setQuizRegionId(null);
    setQuizUseNationalMap(false);
    setPracticeParentKind(null);
    setPlayMode("tap");
    setActiveState(bundle);
    quizKeyRef.current += 1;
    setQuizKey(quizKeyRef.current);
    setQuizCities(challenge.cities);
    setQuizKind("daily");
    setResult(null);
    nav("/quiz");
  }, [nav]);

  const startNationalQuiz = useCallback((mode: QuizPlayMode = "tap") => {
    if (!isNationalQuizUnlocked()) return;
    const cities = getNationalQuizCities();
    if (cities.length === 0) return;
    const anchor = getStateBundle(cities[0]!.stateId);
    if (!anchor) return;

    setQuizRegionId(null);
    setQuizUseNationalMap(true);
    setPracticeParentKind(null);
    setPlayMode(mode);
    setActiveState(anchor);
    quizKeyRef.current += 1;
    setQuizKey(quizKeyRef.current);
    setQuizCities(cities);
    setQuizKind("national");
    setResult(null);
    nav("/quiz");
  }, [nav]);

  const startCrossStatePractice = useCallback((cities: CityMeta[]) => {
    if (cities.length === 0) return;
    const usps = findCityStateId(cities[0]!.id);
    const bundle = usps ? getStateBundle(usps) : null;
    if (!bundle) return;

    setQuizRegionId(null);
    setQuizUseNationalMap(citiesSpanMultipleStates(cities));
    setPracticeParentKind(null);
    setActiveState(bundle);
    quizKeyRef.current += 1;
    setQuizKey(quizKeyRef.current);
    setQuizCities(cities);
    setQuizKind("practice");
    setResult(null);
    nav("/quiz");
  }, [nav]);

  const startWeakCityPractice = useCallback(() => {
    const cities = weakCitiesToPractice(8);
    if (cities.length === 0) return;
    startCrossStatePractice(cities);
  }, [startCrossStatePractice]);

  const startPractice = useCallback(
    (bundle: StateBundle, parentKind: ParentQuizKind, cities: CityMeta[]) => {
      if (cities.length === 0) return;
      setQuizUseNationalMap(citiesSpanMultipleStates(cities));
      setPracticeParentKind(parentKind);
      setActiveState(bundle);
      quizKeyRef.current += 1;
      setQuizKey(quizKeyRef.current);
      setQuizCities(cities);
      setQuizKind("practice");
      setResult(null);
      nav("/quiz");
    },
    [nav],
  );

  const startLearn = useCallback(
    (bundle: StateBundle, zoneId: LearnZoneId, cities: CityMeta[]) => {
      if (cities.length === 0) return;
      setPracticeParentKind(null);
      setQuizUseNationalMap(false);
      setLearnStateId(bundle.meta.id);
      setActiveLearnZoneId(zoneId);
      setActiveState(bundle);
      quizKeyRef.current += 1;
      setQuizKey(quizKeyRef.current);
      setQuizCities(cities);
      setQuizKind("learn");
      setResult(null);
      nav("/quiz");
    },
    [nav],
  );

  const handleSelectState = useCallback(
    (usps: string) => {
      const bundle = getStateBundle(usps);
      if (!bundle) return;
      setHomeStateId(usps);
      setActiveState(bundle);
      setHighlightStateLearn(false);
      nav(`/states/${usps.toLowerCase()}`);
    },
    [nav],
  );

  const handleComplete = useCallback((quizResult: QuizResult) => {
    setResult(quizResult);
    nav("/results", { replace: true });
  }, [nav]);

  const openContinueDestination = useCallback((action: RecommendationAction) => {
    if (action.type === "pick_start") {
      nav("/states");
      return;
    }
    const bundle = getStateBundle(action.stateId);
    if (!bundle) return;
    setActiveState(bundle);
    setHighlightStateLearn(false);
    nav(`/states/${action.stateId.toLowerCase()}`);
  }, [nav]);

  const handleStartTier = useCallback(
    (tierId: TierId, mode: QuizPlayMode = "tap") => {
      if (!activeState) return;
      startQuiz(activeState, tierId, getCitiesForTier(activeState.meta, tierId), mode);
    },
    [activeState, startQuiz],
  );

  const handlePlayAgain = useCallback(() => {
    if (quizCities.length === 0) return;
    if (quizKind === "national") {
      startNationalQuiz(playMode);
      return;
    }
    if (quizKind === "regional" && quizRegionId) {
      startRegionQuiz(quizRegionId, playMode);
      return;
    }
    if (!activeState) return;
    if (quizKind === "daily") {
      startDailyQuiz(quizReturnTo);
      return;
    }
    if (quizKind === "practice" && practiceParentKind) {
      startPractice(activeState, practiceParentKind, quizCities);
      return;
    }
    if (quizKind === "learn" && activeLearnZoneId) {
      startLearn(activeState, activeLearnZoneId, quizCities);
      return;
    }
    if (quizKind === "major" || quizKind === "full") {
      startQuiz(activeState, quizKind, quizCities, playMode);
      return;
    }
    startQuiz(activeState, quizKind, quizCities);
  }, [
    activeState, quizCities, quizKind, quizRegionId, playMode,
    practiceParentKind, activeLearnZoneId, startQuiz, startRegionQuiz,
    startNationalQuiz, startPractice, startLearn, startDailyQuiz, quizReturnTo,
  ]);

  const handleRetryMissed = useCallback(() => {
    if (!result || result.missed.length === 0) return;
    if (quizKind === "national" || quizKind === "regional") {
      startCrossStatePractice(result.missed);
      return;
    }
    if (!activeState) return;
    const parentKind =
      quizKind === "practice"
        ? practiceParentKind
        : isParentQuizKind(quizKind)
          ? quizKind
          : null;
    if (!parentKind) return;
    startPractice(activeState, parentKind, result.missed);
  }, [activeState, result, quizKind, practiceParentKind, startPractice, startCrossStatePractice]);

  const goToHub = useCallback(() => {
    setResult(null);
    setQuizCities([]);
    setHighlightStateLearn(false);
    nav("/");
  }, [nav]);

  const goToSelect = useCallback(() => {
    nav("/states");
  }, [nav]);

  const goToJourney = useCallback(() => {
    nav("/journey");
  }, [nav]);

  const browseRegion = useCallback(
    (regionId: string) => {
      setExploreView((prev) => ({
        ...prev,
        sortMode: "region",
        regionId,
        scrollTop: 0,
      }));
      nav("/states");
    },
    [nav],
  );

  const openStateFromHub = useCallback(
    (usps: string) => {
      handleSelectState(usps);
    },
    [handleSelectState],
  );

  const startDailyFromHub = useCallback(() => {
    if (!canPlayDailyToday()) return;
    startDailyQuiz("/");
  }, [startDailyQuiz]);

  const completeOnboarding = useCallback(
    (usps: string) => {
      const bundle = getStateBundle(usps);
      if (!bundle) return;
      setHomeStateId(usps, { force: true });
      setActiveState(bundle);
      setHighlightStateLearn(true);
      nav(`/states/${usps.toLowerCase()}`, { replace: true });
    },
    [nav],
  );

  const openLearnAreas = useCallback(
    (usps: string) => {
      const bundle = getStateBundle(usps);
      if (!bundle) return;
      setActiveState(bundle);
      setLearnStateId(usps);
      nav(`/states/${usps.toLowerCase()}/learn`);
    },
    [nav],
  );

  const selectLearnRegion = useCallback((regionId: string) => {
    setLearnRegionId(regionId);
    setLearnRegionSuggested(getSuggestedStateForRegion(regionId));
  }, []);

  const openLearnForActiveState = useCallback(() => {
    if (!activeState) return;
    openLearnAreas(activeState.meta.id);
  }, [activeState, openLearnAreas]);

  const handlePracticeMissed = useCallback(
    (action: Extract<RecommendationAction, { type: "practice_missed" }>) => {
      const bundle = getStateBundle(action.stateId);
      if (!bundle || !isParentQuizKind(action.kind)) return;
      startPractice(bundle, action.kind, action.cities);
    },
    [startPractice],
  );

  const goBack = useCallback(() => {
    nav(-1);
  }, [nav]);

  const handleQuizBack = useCallback(() => {
    if (quizKind === "daily") {
      nav(quizReturnTo, { replace: true });
      return;
    }
    nav(-1);
  }, [quizKind, quizReturnTo, nav]);

  const goBackToLearnOrState = useCallback(() => {
    if (quizKind === "daily") {
      nav(quizReturnTo, { replace: true });
      return;
    }
    nav(-1);
  }, [quizKind, quizReturnTo, nav]);

  const continueJourney = useCallback(() => {
    openContinueDestination(getNextRecommendation({ skipPractice: true }));
  }, [openContinueDestination]);

  const value: AppContextValue = {
    activeState,
    quizCities,
    quizKind,
    playMode,
    quizRegionId,
    quizUseNationalMap,
    practiceParentKind,
    result,
    exploreView,
    learnStateId,
    activeLearnZoneId,
    highlightStateLearn,
    learnRegionId,
    learnRegionSuggested,
    quizKey,
    needsOnboarding,

    patchExploreView,
    startQuiz,
    startRegionQuiz,
    startDailyQuiz,
    startNationalQuiz,
    startCrossStatePractice,
    startWeakCityPractice,
    startPractice,
    startLearn,
    handleSelectState,
    handleComplete,
    openContinueDestination,
    handleStartTier,
    handlePlayAgain,
    handleRetryMissed,
    goToHub,
    goToSelect,
    goToJourney,
    browseRegion,
    openStateFromHub,
    startDailyFromHub,
    completeOnboarding,
    openLearnAreas,
    selectLearnRegion,
    openLearnForActiveState,
    handlePracticeMissed,
    handleQuizBack,
    goBackToLearnOrState,
    continueJourney,
    goBack,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}
