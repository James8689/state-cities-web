import { useState } from "react";
import { MAP_THEMES, type MapThemeId } from "../data/mapThemes";
import { isThemeUnlocked, getPlayerLevel } from "../progress/levelPerks";
import { getMapTheme, setMapTheme } from "../progress/storage";

export function MapThemePicker() {
  const level = getPlayerLevel();
  const [activeTheme, setActiveTheme] = useState<MapThemeId>(getMapTheme());

  const handleSelectTheme = (themeId: MapThemeId) => {
    if (!isThemeUnlocked(themeId, level)) return;
    if (setMapTheme(themeId)) {
      setActiveTheme(themeId);
    }
  };

  return (
    <ul className="map-theme-list">
      {(Object.keys(MAP_THEMES) as MapThemeId[]).map((themeId) => {
        const theme = MAP_THEMES[themeId];
        const unlocked = isThemeUnlocked(themeId, level);
        const active = activeTheme === themeId;
        return (
          <li key={themeId}>
            <button
              type="button"
              className={`map-theme-card${unlocked ? "" : " map-theme-card--locked"}${active ? " map-theme-card--active" : ""}`}
              onClick={() => handleSelectTheme(themeId)}
              disabled={!unlocked}
            >
              <span
                className="map-theme-swatch"
                style={{
                  background: `linear-gradient(135deg, ${theme.palette.water} 40%, ${theme.palette.land} 40%)`,
                }}
                aria-hidden
              />
              <span className="map-theme-main">
                <span className="map-theme-label">{theme.label}</span>
                <span className="map-theme-desc">
                  {unlocked ? theme.description : `Unlocks at Level ${theme.unlockLevel}`}
                </span>
              </span>
              <span className="map-theme-status">
                {active ? "Active" : unlocked ? "Use" : "Locked"}
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
