/**
 * Central registry for badge / icon artwork.
 * Add PNG/SVG files under public/badges/ and register them here.
 */
export type BadgeAssetId =
  | "ui:compass"
  | "ui:star"
  | "level:explorer"
  | "level:scout"
  | "level:traveler"
  | "level:pathfinder"
  | "level:cartographer"
  | "level:navigator"
  | "level:veteran"
  | "level:map-master"
  | "mastery:bronze"
  | "mastery:silver"
  | "mastery:gold"
  | "speed:quick-draw"
  | "speed:speed-run"
  | "speed:lightning";

export interface BadgeAssetDefinition {
  id: BadgeAssetId;
  /** Path under public/ — resolved via publicAssetUrl at runtime. */
  file: string;
  label: string;
  /** Shown when the image file is missing or not yet created. */
  fallback: string;
}

export const BADGE_ASSETS: Record<BadgeAssetId, BadgeAssetDefinition> = {
  "ui:compass": {
    id: "ui:compass",
    file: "badges/ui/compass.svg",
    label: "Compass",
    fallback: "🧭",
  },
  "ui:star": {
    id: "ui:star",
    file: "badges/ui/star.svg",
    label: "Star",
    fallback: "⭐",
  },
  "level:explorer": {
    id: "level:explorer",
    file: "badges/levels/explorer.svg",
    label: "Explorer",
    fallback: "🌱",
  },
  "level:scout": {
    id: "level:scout",
    file: "badges/levels/scout.svg",
    label: "Scout",
    fallback: "🔭",
  },
  "level:traveler": {
    id: "level:traveler",
    file: "badges/levels/traveler.svg",
    label: "Traveler",
    fallback: "🎒",
  },
  "level:pathfinder": {
    id: "level:pathfinder",
    file: "badges/levels/pathfinder.svg",
    label: "Pathfinder",
    fallback: "🧭",
  },
  "level:cartographer": {
    id: "level:cartographer",
    file: "badges/levels/cartographer.svg",
    label: "Cartographer",
    fallback: "🗺",
  },
  "level:navigator": {
    id: "level:navigator",
    file: "badges/levels/navigator.svg",
    label: "Navigator",
    fallback: "⛵",
  },
  "level:veteran": {
    id: "level:veteran",
    file: "badges/levels/veteran.svg",
    label: "Veteran",
    fallback: "🎖",
  },
  "level:map-master": {
    id: "level:map-master",
    file: "badges/levels/map-master.svg",
    label: "Map Master",
    fallback: "👑",
  },
  "mastery:bronze": {
    id: "mastery:bronze",
    file: "badges/mastery/bronze.svg",
    label: "Bronze",
    fallback: "🥉",
  },
  "mastery:silver": {
    id: "mastery:silver",
    file: "badges/mastery/silver.svg",
    label: "Silver",
    fallback: "🥈",
  },
  "mastery:gold": {
    id: "mastery:gold",
    file: "badges/mastery/gold.svg",
    label: "Gold",
    fallback: "🥇",
  },
  "speed:quick-draw": {
    id: "speed:quick-draw",
    file: "badges/speed/quick-draw.svg",
    label: "Quick draw",
    fallback: "⏱",
  },
  "speed:speed-run": {
    id: "speed:speed-run",
    file: "badges/speed/speed-run.svg",
    label: "Speed run",
    fallback: "⚡",
  },
  "speed:lightning": {
    id: "speed:lightning",
    file: "badges/speed/lightning.svg",
    label: "Lightning map",
    fallback: "🌩",
  },
};

const LEVEL_TITLE_TO_BADGE: Record<string, BadgeAssetId> = {
  Explorer: "level:explorer",
  Scout: "level:scout",
  Traveler: "level:traveler",
  Pathfinder: "level:pathfinder",
  Cartographer: "level:cartographer",
  Navigator: "level:navigator",
  Veteran: "level:veteran",
  "Map Master": "level:map-master",
};

export function levelTitleToBadgeId(title: string): BadgeAssetId {
  return LEVEL_TITLE_TO_BADGE[title] ?? "level:explorer";
}

export function masteryToBadgeId(tier: "bronze" | "silver" | "gold"): BadgeAssetId {
  return `mastery:${tier}`;
}

export function getBadgeAsset(id: BadgeAssetId): BadgeAssetDefinition {
  return BADGE_ASSETS[id];
}
