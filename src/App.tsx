import { useCallback, useRef, useState } from "react";
import { getCitiesForTier, type TierId } from "./data/tiers";
import { getStateBundle } from "./data/states";
import type { LearnZoneId } from "./data/learnZones";
import { getRegionQuizCities } from "./data/regionQuiz";
import { getNationalQuizCities, citiesSpanMultipleStates, findCityStateId } from "./data/nationalQuiz";
import { isNationalQuizUnlocked } from "./progress/nationalProgress";
import { weakCitiesToPractice } from "./progress/weakCities";
import { getDailyChallenge } from "./progress/dailyChallenge";
import { getRegionById } from "./data/regions";
import {
  getSuggestedStateForRegion,
  learnNeedsHomeState,
} from "./progress/learnProgress";
import { setHomeStateId } from "./progress/storage";
import { getNextRecommendation } from "./progress/nextRecommendation";
import { CampaignHubScreen } from "./screens/CampaignHubScreen";
import { CustomQuizScreen } from "./screens/CustomQuizScreen";
import { LearnScreen } from "./screens/LearnScreen";
import { LearnRegionScreen } from "./screens/LearnRegionScreen";
import { QuizScreen } from "./screens/QuizScreen";
import { JourneyScreen } from "./screens/JourneyScreen";
import { ResultsScreen } from "./screens/ResultsScreen";
import { StateDetailScreen } from "./screens/StateDetailScreen";
import { StateSelectScreen } from "./screens/StateSelectScreen";
import { OnboardingScreen } from "./screens/OnboardingScreen";
import type { RecommendationAction } from "./progress/types";
import type { CityMeta, ParentQuizKind, QuizKind, QuizPlayMode, QuizResult, Screen, StateBundle } from "./types/quiz";
import { isParentQuizKind } from "./progress/quizKey";
import {
  backLabelForScreen,
  createDefaultExploreView,
  type ExploreViewState,
} from "./navigation/exploreView";

function App() {
  const [screen, setScreen] = useState<Screen>(() =>
    learnNeedsHomeState() ? "onboarding" : "hub",
  );
  const [hubKey, setHubKey] = useState(0);
  const [activeState, setActiveState] = useState<StateBundle | null>(null);
  const [quizCities, setQuizCities] = useState<CityMeta[]>([]);
  const [quizKind, setQuizKind] = useState<QuizKind>("full");
  const [playMode, setPlayMode] = useState<QuizPlayMode>("tap");
  const [quizRegionId, setQuizRegionId] = useState<string | null>(null);
  const [practiceParentKind, setPracticeParentKind] = useState<ParentQuizKind | null>(null);
  const [result, setResult] = useState<QuizResult | null>(null);
  const [navStack, setNavStack] = useState<Screen[]>([]);
  const [exploreView, setExploreView] = useState<ExploreViewState>(createDefaultExploreView);
  const [learnStateId, setLearnStateId] = useState<string | null>(null);
  const [activeLearnZoneId, setActiveLearnZoneId] = useState<LearnZoneId | null>(null);
  const [highlightStateLearn, setHighlightStateLearn] = useState(false);
  const [learnRegionId, setLearnRegionId] = useState<string>(() => createDefaultExploreView().regionId);
  const [learnRegionSuggested, setLearnRegionSuggested] = useState<string | null>(null);
  const [quizReturnTo, setQuizReturnTo] = useState<Screen>("hub");
  const [quizUseNationalMap, setQuizUseNationalMap] = useState(false);
  const quizKey = useRef(0);
  const screenRef = useRef(screen);
  screenRef.current = screen;

  const patchExploreView = useCallback((patch: Partial<ExploreViewState>) => {
    setExploreView((prev) => ({ ...prev, ...patch }));
  }, []);

  const navigate = useCallback((to: Screen, options?: { replace?: boolean }) => {
    const from = screenRef.current;
    if (!options?.replace && from !== to) {
      setNavStack((stack) => [...stack, from]);
    }
    setScreen(to);
  }, []);

  const goBack = useCallback(() => {
    setNavStack((stack) => {
      if (stack.length === 0) {
        setScreen("hub");
        return stack;
      }
      const prev = stack[stack.length - 1]!;
      setScreen(prev);
      return stack.slice(0, -1);
    });
  }, []);

  const previousScreen = navStack[navStack.length - 1] ?? "hub";

  const startQuiz = useCallback(
    (bundle: StateBundle, kind: QuizKind, cities: CityMeta[], mode: QuizPlayMode = "tap") => {
      if (cities.length === 0) return;
      setQuizRegionId(null);
      setQuizUseNationalMap(false);
      setPracticeParentKind(null);
      setPlayMode(mode);
      setActiveState(bundle);
      quizKey.current += 1;
      setQuizCities(cities);
      setQuizKind(kind);
      setResult(null);
      navigate("quiz");
    },
    [navigate],
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
    quizKey.current += 1;
    setQuizCities(cities);
    setQuizKind("regional");
    setResult(null);
    navigate("quiz");
  }, [navigate]);

  const startDailyQuiz = useCallback((returnTo: Screen = "hub") => {
    const challenge = getDailyChallenge();
    const bundle = getStateBundle(challenge.stateId);
    if (!bundle) return;

    setQuizReturnTo(returnTo);
    setQuizRegionId(null);
    setQuizUseNationalMap(false);
    setPracticeParentKind(null);
    setPlayMode("tap");
    setActiveState(bundle);
    quizKey.current += 1;
    setQuizCities(challenge.cities);
    setQuizKind("daily");
    setResult(null);
    navigate("quiz");
  }, [navigate]);

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
    quizKey.current += 1;
    setQuizCities(cities);
    setQuizKind("national");
    setResult(null);
    navigate("quiz");
  }, [navigate]);

  const startCrossStatePractice = useCallback((cities: CityMeta[]) => {
    if (cities.length === 0) return;
    const usps = findCityStateId(cities[0]!.id);
    const bundle = usps ? getStateBundle(usps) : null;
    if (!bundle) return;

    setQuizRegionId(null);
    setQuizUseNationalMap(citiesSpanMultipleStates(cities));
    setPracticeParentKind(null);
    setActiveState(bundle);
    quizKey.current += 1;
    setQuizCities(cities);
    setQuizKind("practice");
    setResult(null);
    navigate("quiz");
  }, [navigate]);

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
      quizKey.current += 1;
      setQuizCities(cities);
      setQuizKind("practice");
      setResult(null);
      navigate("quiz");
    },
    [navigate],
  );

  const handleSelectState = useCallback(
    (usps: string) => {
      const bundle = getStateBundle(usps);
      if (!bundle) return;
      setHomeStateId(usps);
      setActiveState(bundle);
      setHighlightStateLearn(false);
      navigate("stateHome");
    },
    [navigate],
  );

  const handleComplete = useCallback((quizResult: QuizResult) => {
    setResult(quizResult);
    navigate("results", { replace: true });
  }, [navigate]);

  const openContinueDestination = useCallback((action: RecommendationAction) => {
    if (action.type === "pick_start") {
      navigate("select");
      return;
    }
    const bundle = getStateBundle(action.stateId);
    if (!bundle) return;
    setActiveState(bundle);
    setHighlightStateLearn(false);
    navigate("stateHome");
  }, [navigate]);

  const handleStartTier = useCallback(
    (tierId: TierId, mode: QuizPlayMode = "tap") => {
      if (!activeState) return;
      startQuiz(activeState, tierId, getCitiesForTier(activeState.meta, tierId), mode);
    },
    [activeState, startQuiz],
  );

  const startLearn = useCallback(
    (bundle: StateBundle, zoneId: LearnZoneId, cities: CityMeta[]) => {
      if (cities.length === 0) return;
      setPracticeParentKind(null);
      setQuizUseNationalMap(false);
      setLearnStateId(bundle.meta.id);
      setActiveLearnZoneId(zoneId);
      setActiveState(bundle);
      quizKey.current += 1;
      setQuizCities(cities);
      setQuizKind("learn");
      setResult(null);
      navigate("quiz");
    },
    [navigate],
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
    activeState,
    quizCities,
    quizKind,
    quizRegionId,
    playMode,
    practiceParentKind,
    activeLearnZoneId,
    startQuiz,
    startRegionQuiz,
    startNationalQuiz,
    startPractice,
    startLearn,
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
    setNavStack([]);
    setHubKey((k) => k + 1);
    setScreen("hub");
    setResult(null);
    setQuizCities([]);
    setHighlightStateLearn(false);
  }, []);

  const goToSelect = useCallback(() => {
    navigate("select");
  }, [navigate]);

  const browseRegion = useCallback(
    (regionId: string) => {
      setExploreView((prev) => ({
        ...prev,
        sortMode: "region",
        regionId,
        scrollTop: 0,
      }));
      navigate("select");
    },
    [navigate],
  );

  const openStateFromHub = useCallback(
    (usps: string) => {
      handleSelectState(usps);
    },
    [handleSelectState],
  );

  const goToJourney = useCallback(() => {
    navigate("journey");
  }, [navigate]);

  const completeOnboarding = useCallback(
    (usps: string) => {
      const bundle = getStateBundle(usps);
      if (!bundle) return;
      setHomeStateId(usps, { force: true });
      setActiveState(bundle);
      setHighlightStateLearn(true);
      setHubKey((k) => k + 1);
      navigate("stateHome", { replace: true });
    },
    [navigate],
  );

  const openLearnAreas = useCallback(
    (usps: string) => {
      const bundle = getStateBundle(usps);
      if (!bundle) return;
      setActiveState(bundle);
      setLearnStateId(usps);
      navigate("learn");
    },
    [navigate],
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

  const handleQuizBack = useCallback(() => {
    if (quizKind === "daily") {
      setNavStack((stack) => stack.slice(0, -1));
      setScreen(quizReturnTo);
      return;
    }
    goBack();
  }, [quizKind, quizReturnTo, goBack]);

  const goBackToLearnOrState = useCallback(() => {
    if (quizKind === "daily") {
      setNavStack((stack) => stack.slice(0, -1));
      setScreen(quizReturnTo);
      return;
    }
    goBack();
  }, [quizKind, quizReturnTo, goBack]);

  const continueJourney = useCallback(() => {
    openContinueDestination(getNextRecommendation({ skipPractice: true }));
  }, [openContinueDestination]);

  return (
    <div className="app-shell">
      {screen === "onboarding" && (
        <OnboardingScreen onComplete={completeOnboarding} />
      )}
      {screen === "hub" && (
        <CampaignHubScreen
          key={hubKey}
          onContinue={openContinueDestination}
          onBrowseStates={goToSelect}
          onOpenJourney={goToJourney}
          onRandomState={handleSelectState}
          onStartDaily={() => startDailyQuiz("hub")}
        />
      )}
      {screen === "learn" && (
        <LearnScreen
          stateId={learnStateId ?? activeState?.meta.id ?? ""}
          onBack={goBack}
          onStartZone={(stateMeta, zoneId, cities) => {
            const bundle = getStateBundle(stateMeta.id);
            if (bundle) startLearn(bundle, zoneId, cities);
          }}
        />
      )}
      {screen === "learnRegion" && (
        <LearnRegionScreen
          regionId={learnRegionId}
          suggestedStateId={learnRegionSuggested}
          onSelectState={openLearnAreas}
          onSelectRegion={selectLearnRegion}
          onBack={goBack}
        />
      )}
      {screen === "journey" && (
        <JourneyScreen
          onBack={goBack}
          onContinueRecommendation={continueJourney}
          onBrowseRegion={browseRegion}
          onPlayState={(usps) => openStateFromHub(usps)}
          onStartRegionQuiz={startRegionQuiz}
          onStartNationalQuiz={startNationalQuiz}
          onPracticeWeakCities={startWeakCityPractice}
        />
      )}
      {screen === "select" && (
        <StateSelectScreen
          viewState={exploreView}
          onViewStateChange={patchExploreView}
          backLabel={backLabelForScreen(previousScreen)}
          onSelectState={handleSelectState}
          onStartRegionQuiz={startRegionQuiz}
          onBack={goBack}
        />
      )}
      {screen === "stateHome" && activeState && (
        <StateDetailScreen
          key={activeState.meta.id}
          stateMeta={activeState.meta}
          backLabel={backLabelForScreen(previousScreen)}
          onStartTier={handleStartTier}
          onPracticeMissed={handlePracticeMissed}
          onCreateCustom={() => navigate("customSelect")}
          onLearn={openLearnForActiveState}
          highlightLearn={highlightStateLearn}
          onBack={goBack}
        />
      )}
      {screen === "customSelect" && activeState && (
        <CustomQuizScreen
          stateMeta={activeState.meta}
          onBack={goBack}
          onPlay={(cities) => startQuiz(activeState, "custom", cities)}
        />
      )}
      {screen === "quiz" && quizCities.length > 0 && (activeState || quizRegionId || quizKind === "national") && (
        <QuizScreen
          key={quizKey.current}
          stateMeta={activeState?.meta ?? { id: "", name: "", capital: "", mapFiles: { state: "", cities: "" }, cities: [] }}
          peaks={activeState?.peaks ?? []}
          quizCities={quizCities}
          quizKind={quizKind}
          playMode={playMode}
          regionId={quizRegionId}
          useNationalMap={quizUseNationalMap}
          learnZoneId={activeLearnZoneId}
          practiceParentKind={practiceParentKind}
          onComplete={handleComplete}
          onBack={handleQuizBack}
        />
      )}
      {screen === "results" && result && (activeState || quizRegionId || quizKind === "national") && (
        <ResultsScreen
          stateId={activeState?.meta.id ?? ""}
          stateName={
            quizKind === "national"
              ? "United States"
              : quizRegionId
                ? (getRegionById(quizRegionId)?.name ?? "Region")
                : (activeState?.meta.name ?? "")
          }
          quizKind={quizKind}
          playMode={playMode}
          regionId={quizRegionId}
          learnZoneId={activeLearnZoneId}
          practiceParentKind={practiceParentKind}
          result={result}
          onPlayAgain={handlePlayAgain}
          onRetryMissed={handleRetryMissed}
          onContinueJourney={continueJourney}
          onBackToState={goBackToLearnOrState}
          onBackToHub={goToHub}
        />
      )}
    </div>
  );
}

export default App;
