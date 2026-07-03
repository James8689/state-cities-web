import { createBrowserRouter, Navigate, Outlet } from "react-router-dom";
import { AppProvider } from "./contexts/AppContext";
import { AppLayout } from "./layouts/AppLayout";
import { HubPage } from "./pages/HubPage";
import { StatesPage } from "./pages/StatesPage";
import { StateHomePage } from "./pages/StateHomePage";
import { LearnPage } from "./pages/LearnPage";
import { LearnRegionPage } from "./pages/LearnRegionPage";
import { CustomSelectPage } from "./pages/CustomSelectPage";
import { QuizPage } from "./pages/QuizPage";
import { ResultsPage } from "./pages/ResultsPage";
import { JourneyPage } from "./pages/JourneyPage";
import { OnboardingPage } from "./pages/OnboardingPage";

function RootProvider() {
  return (
    <AppProvider>
      <Outlet />
    </AppProvider>
  );
}

export const router = createBrowserRouter([
  {
    element: <RootProvider />,
    children: [
      {
        path: "/welcome",
        element: <OnboardingPage />,
      },
      {
        path: "/",
        element: <AppLayout />,
        children: [
          { index: true, element: <HubPage /> },
          { path: "states", element: <StatesPage /> },
          { path: "states/:stateSlug", element: <StateHomePage /> },
          { path: "states/:stateSlug/learn", element: <LearnPage /> },
          { path: "states/:stateSlug/custom", element: <CustomSelectPage /> },
          { path: "journey", element: <JourneyPage /> },
          { path: "learn/region", element: <LearnRegionPage /> },
          { path: "quiz", element: <QuizPage /> },
          { path: "results", element: <ResultsPage /> },
          { path: "*", element: <Navigate to="/" replace /> },
        ],
      },
    ],
  },
]);
