import { useEffect, useMemo, useRef, useState } from "react";
import { ComposableMap, Geographies, Geography, ZoomableGroup } from "react-simple-maps";
import { feature } from "topojson-client";
import { geoCentroid, geoPath } from "d3-geo";
import type { FeatureCollection } from "geojson";
import type { GeometryObject, Topology } from "topojson-specification";
import { CityBoundary } from "./CityBoundary";
import type { CityHighlight, Peak, StateMeta } from "../types/quiz";
import { useContainerSize } from "../hooks/useContainerSize";
import { useFollowTargetCity } from "../hooks/useFollowTargetCity";
import { createStateProjection, getStateCenter } from "../utils/geo";
import { publicAssetUrl } from "../utils/publicAssetUrl";
import { useMapPalette } from "../hooks/useMapPalette";
import { MAP_OPACITY } from "../utils/mapTheme";

interface StateMapProps {
  stateMeta: StateMeta;
  peaks: Peak[];
  /** When set, only these cities render and accept taps. */
  activeCityIds: Set<string>;
  targetCityId: string | null;
  solvedIds: Set<string>;
  wrongFlashId: string | null;
  correctFlashId: string | null;
  showHint: boolean;
  onCityTap: (cityId: string | null) => void;
  /** Type mode: map is view-only; target dot stays highlighted. */
  disableTap?: boolean;
  alwaysHighlightTarget?: boolean;
}

interface MapData {
  state: FeatureCollection;
  cities: FeatureCollection;
  water: FeatureCollection | null;
}

interface CityMarker {
  id: string;
  name: string;
  coordinates: [number, number];
}

const DOT_RADIUS = 4.5;
const DOT_STROKE = 1.5;
const PEAK_SIZE = 5.5;

// Minimum on-screen gap between dot centers; dots closer than this are nudged
// apart so they never touch (relative layout is preserved).
const SEPARATION_PX = 14;
const DECLUSTER_ITERATIONS = 90;

interface DotPt {
  id: string;
  name: string;
  x: number;
  y: number;
}

export function StateMap({
  stateMeta,
  peaks: peakConfig,
  activeCityIds,
  targetCityId,
  solvedIds,
  wrongFlashId,
  correctFlashId,
  showHint,
  onCityTap,
  disableTap = false,
  alwaysHighlightTarget = false,
}: StateMapProps) {
  const { ref, width, height } = useContainerSize();
  const MAP_COLORS = useMapPalette();
  const [data, setData] = useState<MapData | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const geoCenter = useMemo(
    () => (data ? getStateCenter(data.state) : null),
    [data],
  );
  // ZoomableGroup is controlled: both center and zoom must stay in sync with
  // onMoveEnd or any parent re-render snaps the view back to geoCenter.
  const [view, setView] = useState<{ center: [number, number]; zoom: number } | null>(null);
  const center = view?.center ?? geoCenter ?? ([-120.5, 44.1] as [number, number]);
  const zoom = view?.zoom ?? 1;
  // Wraps all map content inside the zoom transform; used to convert a screen
  // tap into projected coordinates for nearest-dot selection.
  const layerRef = useRef<SVGGElement | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const [stateRes, citiesRes] = await Promise.all([
          fetch(publicAssetUrl(stateMeta.mapFiles.state)),
          fetch(publicAssetUrl(stateMeta.mapFiles.cities)),
        ]);

        if (!stateRes.ok) throw new Error(`State map HTTP ${stateRes.status}`);
        if (!citiesRes.ok) throw new Error(`Cities map HTTP ${citiesRes.status}`);

        const stateTopo = (await stateRes.json()) as Topology<{ state: GeometryObject }>;
        const citiesGeo = (await citiesRes.json()) as FeatureCollection;

        if (!stateTopo?.objects?.state) throw new Error("State TopoJSON missing objects.state");
        if (!citiesGeo?.features?.length) throw new Error("Cities GeoJSON has no features");

        // Water is optional context; failure should not break the map.
        let waterGeo: FeatureCollection | null = null;
        if (stateMeta.mapFiles.water) {
          try {
            const waterRes = await fetch(publicAssetUrl(stateMeta.mapFiles.water));
            if (waterRes.ok) waterGeo = (await waterRes.json()) as FeatureCollection;
          } catch {
            waterGeo = null;
          }
        }

        if (cancelled) return;

        setData({
          state: feature(stateTopo, stateTopo.objects.state) as FeatureCollection,
          cities: citiesGeo,
          water: waterGeo,
        });
        setLoadError(null);
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        console.error("[StateMap] load failed:", msg);
        if (!cancelled) setLoadError(msg);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [stateMeta.mapFiles.cities, stateMeta.mapFiles.state, stateMeta.mapFiles.water]);

  useEffect(() => {
    if (geoCenter) setView({ center: geoCenter, zoom: 1 });
  }, [geoCenter]);

  const projection = useMemo(() => {
    if (!data || width <= 0 || height <= 0) return null;
    return createStateProjection(width, height, data.state);
  }, [data, width, height]);

  const markers = useMemo<CityMarker[]>(() => {
    if (!data) return [];
    return data.cities.features
      .filter((f) => activeCityIds.has(String(f.properties?.id ?? "")))
      .map((f) => ({
        id: String(f.properties?.id ?? ""),
        name: String(f.properties?.name ?? ""),
        coordinates: geoCentroid(f) as [number, number],
      }));
  }, [data, activeCityIds]);

  useFollowTargetCity(alwaysHighlightTarget, targetCityId, markers, setView);

  const peaks = useMemo(() => {
    if (!projection) return [];
    return peakConfig
      .map((p) => {
        const xy = projection(p.coordinates);
        return xy ? { name: p.name, x: xy[0], y: xy[1] } : null;
      })
      .filter((p): p is { name: string; x: number; y: number } => p !== null);
  }, [projection, peakConfig]);

  // Projected state outline, used to clip terrain layers to the state shape.
  const statePathD = useMemo(() => {
    if (!projection || !data) return null;
    return geoPath(projection)(data.state) ?? null;
  }, [projection, data]);

  // City dot positions in projected coordinates, declustered so no two dots
  // touch. Recomputed per zoom so the spacing is constant on screen: lots of
  // separation when zoomed out, none once the geography already spreads them.
  const dotPts = useMemo<DotPt[]>(() => {
    if (!projection) return [];
    const pts: DotPt[] = [];
    for (const m of markers) {
      const xy = projection(m.coordinates);
      if (xy) pts.push({ id: m.id, name: m.name, x: xy[0], y: xy[1] });
    }

    const sep = SEPARATION_PX / zoom;
    for (let it = 0; it < DECLUSTER_ITERATIONS; it++) {
      let moved = false;
      for (let i = 0; i < pts.length; i++) {
        for (let j = i + 1; j < pts.length; j++) {
          let dx = pts[j].x - pts[i].x;
          let dy = pts[j].y - pts[i].y;
          let d = Math.hypot(dx, dy);
          if (d === 0) {
            // Exactly coincident: nudge deterministically so they can split.
            dx = 0.01;
            dy = 0.01;
            d = Math.hypot(dx, dy);
          }
          if (d < sep) {
            const push = (sep - d) / 2;
            const ux = dx / d;
            const uy = dy / d;
            pts[i].x -= ux * push;
            pts[i].y -= uy * push;
            pts[j].x += ux * push;
            pts[j].y += uy * push;
            moved = true;
          }
        }
      }
      if (!moved) break;
    }

    return pts;
  }, [markers, projection, zoom]);

  if (loadError) {
    return (
      <div className="map-container map-error" ref={ref}>
        <p>Map failed to load</p>
        <code>{loadError}</code>
        <p className="map-error-hint">Run <code>npm run diagnose</code> and check DevTools Console.</p>
      </div>
    );
  }

  const dotR = DOT_RADIUS / zoom;
  const dotStroke = DOT_STROKE / zoom;
  const peakS = PEAK_SIZE / zoom;
  const riverW = 1.2 / zoom;
  const lakeStrokeW = 0.5 / zoom;

  const wrongDot = wrongFlashId ? dotPts.find((p) => p.id === wrongFlashId) ?? null : null;
  const correctDot = correctFlashId ? dotPts.find((p) => p.id === correctFlashId) ?? null : null;

  function cityState(id: string): CityHighlight {
    if (solvedIds.has(id)) return "correct";
    if (id === wrongFlashId) return "wrong";
    if ((showHint || alwaysHighlightTarget) && id === targetCityId) return "hint";
    return "default";
  }

  function markerFill(state: CityHighlight): string {
    if (state === "correct") return MAP_COLORS.correct;
    if (state === "wrong") return MAP_COLORS.wrong;
    if (state === "hint") return MAP_COLORS.hint;
    return MAP_COLORS.markerFill;
  }

  // Select the city dot nearest to the tap. This delineates adjacent cities
  // (e.g. Eugene vs Springfield) deterministically by distance, instead of
  // letting overlapping hit areas fight over the tap.
  function handleMapTap(e: React.MouseEvent<SVGSVGElement>) {
    if (disableTap) return;
    const layer = layerRef.current;
    if (!layer || dotPts.length === 0) return;
    const ctm = layer.getScreenCTM();
    if (!ctm) return;

    const local = new DOMPoint(e.clientX, e.clientY).matrixTransform(ctm.inverse());

    let bestId: string | null = null;
    let bestDistSq = Infinity;
    for (const p of dotPts) {
      const dx = p.x - local.x;
      const dy = p.y - local.y;
      const distSq = dx * dx + dy * dy;
      if (distSq < bestDistSq) {
        bestDistSq = distSq;
        bestId = p.id;
      }
    }

    // ~80px on-screen tolerance (projected units shrink as you zoom in).
    const tolerance = 80 / zoom;
    if (bestDistSq > tolerance * tolerance) {
      onCityTap(null);
      return;
    }
    // Nearest dot is already found — ignore taps on solved cities.
    if (bestId && solvedIds.has(bestId)) {
      onCityTap(null);
      return;
    }
    onCityTap(bestId);
  }

  return (
    <div className="map-container" ref={ref}>
      {!data || !projection ? (
        <div className="map-loading">Loading map...</div>
      ) : (
        <ComposableMap
          projection={projection}
          width={width}
          height={height}
          onClick={handleMapTap}
          style={{ width: "100%", height: "100%", display: "block", background: MAP_COLORS.water }}
        >
          <defs>
            <pattern
              id="water-grid"
              width={MAP_COLORS.waterGridSize}
              height={MAP_COLORS.waterGridSize}
              patternUnits="userSpaceOnUse"
            >
              <rect
                width={MAP_COLORS.waterGridSize}
                height={MAP_COLORS.waterGridSize}
                fill={MAP_COLORS.water}
              />
              <path
                d={`M ${MAP_COLORS.waterGridSize} 0 H 0 V ${MAP_COLORS.waterGridSize}`}
                fill="none"
                stroke={MAP_COLORS.waterGrid}
                strokeWidth={1}
              />
            </pattern>
          </defs>
          <ZoomableGroup
            center={center}
            zoom={zoom}
            minZoom={1}
            maxZoom={12}
            onMoveEnd={(pos) => setView({ center: pos.coordinates, zoom: pos.zoom })}
          >
            <g ref={layerRef}>
            {/* Gridded water pans/zooms with the map (same transform as state). */}
            <rect
              x={-width * 2}
              y={-height * 2}
              width={width * 5}
              height={height * 5}
              fill="url(#water-grid)"
              pointerEvents="none"
            />
            <Geographies geography={stateMeta.mapFiles.state}>
              {({ geographies }) =>
                geographies.map((geo) => (
                  <Geography
                    key={geo.rsmKey}
                    geography={geo}
                    style={{
                      default: {
                        fill: MAP_COLORS.land,
                        stroke: MAP_COLORS.landStroke,
                        strokeWidth: MAP_COLORS.landStrokeWidth,
                      },
                      hover: { fill: MAP_COLORS.land, stroke: MAP_COLORS.landStroke },
                      pressed: { fill: MAP_COLORS.land },
                    }}
                  />
                ))
              }
            </Geographies>

            {/* Clip terrain context to the state outline so nothing spills past the border. */}
            {statePathD && (
              <defs>
                <clipPath id="state-clip">
                  <path d={statePathD} />
                </clipPath>
              </defs>
            )}

            {/* Subtle physical context: water + mountains (non-interactive, clipped to state) */}
            <g clipPath={statePathD ? "url(#state-clip)" : undefined}>
              {data.water && (
                <Geographies geography={data.water}>
                  {({ geographies }) =>
                    geographies.map((geo) => {
                      const kind = String(geo.properties?.kind ?? "");
                      const isLake = kind === "lake";
                      return (
                        <Geography
                          key={geo.rsmKey}
                          geography={geo}
                          style={{
                            default: {
                              fill: isLake ? MAP_COLORS.lakeFill : "none",
                              fillOpacity: isLake ? MAP_OPACITY.lake : 0,
                              stroke: isLake ? MAP_COLORS.lakeStroke : MAP_COLORS.river,
                              strokeWidth: isLake ? lakeStrokeW : riverW,
                              strokeOpacity: isLake ? MAP_OPACITY.lake : MAP_OPACITY.river,
                              pointerEvents: "none",
                            },
                            hover: { pointerEvents: "none" },
                            pressed: {},
                          }}
                        />
                      );
                    })
                  }
                </Geographies>
              )}

              <g pointerEvents="none" opacity={MAP_OPACITY.mountain}>
                {peaks.map((p) => (
                  <g key={p.name}>
                    <path
                      d={`M ${p.x},${p.y - peakS} L ${p.x + peakS * 0.85},${p.y + peakS * 0.65} L ${p.x - peakS * 0.85},${p.y + peakS * 0.65} Z`}
                      fill={MAP_COLORS.mountain}
                    />
                    <path
                      d={`M ${p.x},${p.y - peakS} L ${p.x + peakS * 0.36},${p.y - peakS * 0.3} L ${p.x - peakS * 0.36},${p.y - peakS * 0.3} Z`}
                      fill={MAP_COLORS.mountainSnow}
                    />
                  </g>
                ))}
              </g>
            </g>

            <Geographies geography={stateMeta.mapFiles.cities}>
              {({ geographies }) =>
                geographies
                  .filter((geo) => activeCityIds.has(String(geo.properties?.id ?? "")))
                  .map((geo) => {
                  const cityId = String(geo.properties?.id ?? "");
                  const state = cityState(cityId);

                  return <CityBoundary key={geo.rsmKey} geo={geo} highlight={state} palette={MAP_COLORS} />;
                })
              }
            </Geographies>

            {/* Declustered city dots (selected via nearest-dot tap). */}
            <g pointerEvents="none">
              {dotPts.map((p) => {
                const state = cityState(p.id);
                const isWrong = state === "wrong";
                const isHint = state === "hint";
                const isCorrectFlash = p.id === correctFlashId;
                const emphasized = state !== "default";
                return (
                  <g key={p.id} transform={`translate(${p.x}, ${p.y})`}>
                    {isHint && (
                      <circle
                        className="marker-hint-ping"
                        r={dotR * 1.25}
                        fill="none"
                        stroke={MAP_COLORS.hint}
                        strokeWidth={dotStroke}
                      />
                    )}
                    {isCorrectFlash && (
                      <circle
                        className="marker-correct-ping"
                        r={dotR * 1.25}
                        fill="none"
                        stroke={MAP_COLORS.correct}
                        strokeWidth={dotStroke}
                      />
                    )}
                    <circle
                      className={
                        isWrong
                          ? "marker-dot--wrong"
                          : isCorrectFlash
                            ? "marker-dot--correct"
                            : isHint
                              ? "marker-dot--hint"
                              : undefined
                      }
                      r={emphasized ? dotR * 1.25 : dotR}
                      fill={markerFill(state)}
                      stroke={emphasized ? MAP_COLORS.feedbackStroke : MAP_COLORS.markerStroke}
                      strokeWidth={dotStroke}
                    />
                  </g>
                );
              })}
            </g>

            {/* Name the wrong city the player tapped, so misses teach. */}
            {wrongDot && (
              <g pointerEvents="none" transform={`translate(${wrongDot.x}, ${wrongDot.y})`}>
                <text
                  textAnchor="middle"
                  y={-(dotR * 1.25 + 5 / zoom)}
                  style={{
                    fontSize: 13 / zoom,
                    fontWeight: 700,
                    fill: "#ffffff",
                    stroke: MAP_COLORS.wrong,
                    strokeWidth: 4 / zoom,
                    strokeLinejoin: "round",
                    paintOrder: "stroke",
                  }}
                >
                  {wrongDot.name}
                </text>
              </g>
            )}

            {correctDot && (
              <g pointerEvents="none" transform={`translate(${correctDot.x}, ${correctDot.y})`}>
                <text
                  className="marker-correct-label"
                  textAnchor="middle"
                  y={-(dotR * 1.25 + 5 / zoom)}
                  style={{
                    fontSize: 14 / zoom,
                    fontWeight: 700,
                    fill: "#ffffff",
                    stroke: MAP_COLORS.correct,
                    strokeWidth: 4.5 / zoom,
                    strokeLinejoin: "round",
                    paintOrder: "stroke",
                  }}
                >
                  {correctDot.name}
                </text>
              </g>
            )}
            </g>
          </ZoomableGroup>
        </ComposableMap>
      )}
    </div>
  );
}
