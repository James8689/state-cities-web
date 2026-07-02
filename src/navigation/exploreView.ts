import { getFocusRegionId } from "../progress/regionProgress";

export type ExploreSortMode = "region" | "alphabetical" | "progress";

export interface ExploreViewState {
  sortMode: ExploreSortMode;
  regionId: string;
  scrollTop: number;
}

export function createDefaultExploreView(): ExploreViewState {
  return {
    sortMode: "region",
    regionId: getFocusRegionId(),
    scrollTop: 0,
  };
}

export function backLabelForScreen(screen: string): string {
  switch (screen) {
    case "hub":
      return "Back to home";
    case "journey":
      return "Back to journey";
    case "select":
      return "Back to states";
    case "stateHome":
      return "Back to state";
    case "learn":
      return "Back to learn";
    case "learnRegion":
      return "Back to regions";
    default:
      return "Back";
  }
}
