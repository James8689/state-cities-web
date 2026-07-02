import { useEffect, type Dispatch, type SetStateAction } from "react";

interface CityMarker {
  id: string;
  coordinates: [number, number];
}

interface MapView {
  center: [number, number];
  zoom: number;
}

/** In type mode, pan the map so the highlighted target city stays centered. */
export function useFollowTargetCity(
  alwaysHighlightTarget: boolean,
  targetCityId: string | null,
  markers: CityMarker[],
  setView: Dispatch<SetStateAction<MapView | null>>,
) {
  useEffect(() => {
    if (!alwaysHighlightTarget || !targetCityId) return;

    const marker = markers.find((m) => m.id === targetCityId);
    if (!marker) return;

    setView((prev) => ({
      center: marker.coordinates,
      zoom: prev?.zoom ?? 1,
    }));
  }, [alwaysHighlightTarget, targetCityId, markers, setView]);
}
