import { useEffect, useMemo, useRef, useState } from "react";
import { ComposableMap, Geographies, Geography, ZoomableGroup } from "react-simple-maps";
import { feature } from "topojson-client";
import { geoCentroid } from "d3-geo";
import type { Feature, FeatureCollection } from "geojson";
import type { GeometryObject, Topology } from "topojson-specification";
import { STATES } from "../data/states";
import type { CityHighlight } from "../types/quiz";
import { useContainerSize } from "../hooks/useContainerSize";
import { useFollowTargetCity } from "../hooks/useFollowTargetCity";
import { createRegionProjection, getRegionCenter } from "../utils/geo";
import { publicAssetUrl } from "../utils/publicAssetUrl";
import { MAP_COLORS } from "../utils/mapTheme";

interface NationalMapProps {
  activeCityIds: Set<string>;
  targetCityId: string | null;
  solvedIds: Set<string>;
  wrongFlashId: string | null;
  correctFlashId: string | null;
  showHint: boolean;
  onCityTap: (cityId: string | null) => void;
  disableTap?: boolean;
  alwaysHighlightTarget?: boolean;
}

interface NationalMapData {
  states: FeatureCollection;
  stateSources: { usps: string; topoUrl: string }[];
  cities: FeatureCollection;
}

interface DotPt {
  id: string;
  name: string;
  x: number;
  y: number;
}

const DOT_RADIUS = 4.5;
const DOT_STROKE = 1.5;
const SEPARATION_PX = 14;
const DECLUSTER_ITERATIONS = 90;

export function NationalMap({
  activeCityIds,
  targetCityId,
  solvedIds,
  wrongFlashId,
  correctFlashId,
  showHint,
  onCityTap,
  disableTap = false,
  alwaysHighlightTarget = false,
}: NationalMapProps) {
  const { ref, width, height } = useContainerSize();
  const [data, setData] = useState<NationalMapData | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const activeKey = useMemo(() => [...activeCityIds].sort().join(","), [activeCityIds]);
  const geoCenter = useMemo(
    () => (data ? getRegionCenter(data.states) : null),
    [data],
  );
  const [view, setView] = useState<{ center: [number, number]; zoom: number } | null>(null);
  const center = view?.center ?? geoCenter ?? ([-98, 39] as [number, number]);
  const zoom = view?.zoom ?? 1;
  const layerRef = useRef<SVGGElement | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const stateFeatures: Feature[] = [];
        const cityFeatures: Feature[] = [];
        const stateSources: NationalMapData["stateSources"] = [];

        await Promise.all(
          STATES.map(async (bundle) => {
            const hasActive = bundle.meta.cities.some((c) => activeCityIds.has(c.id));
            const fetches: Promise<Response>[] = [
              fetch(publicAssetUrl(bundle.meta.mapFiles.state)),
            ];
            if (hasActive) {
              fetches.push(fetch(publicAssetUrl(bundle.meta.mapFiles.cities)));
            }

            const results = await Promise.all(fetches);
            const stateRes = results[0]!;
            if (!stateRes.ok) return;

            const stateTopo = (await stateRes.json()) as Topology<{ state: GeometryObject }>;
            if (!stateTopo?.objects?.state) return;

            const stateFc = feature(stateTopo, stateTopo.objects.state) as FeatureCollection;
            stateFeatures.push(...stateFc.features);
            stateSources.push({ usps: bundle.meta.id, topoUrl: bundle.meta.mapFiles.state });

            if (hasActive && results[1]?.ok) {
              const citiesGeo = (await results[1].json()) as FeatureCollection;
              for (const f of citiesGeo.features) {
                const id = String(f.properties?.id ?? "");
                if (activeCityIds.has(id)) cityFeatures.push(f);
              }
            }
          }),
        );

        if (cancelled) return;
        if (stateFeatures.length === 0) throw new Error("No state maps loaded");

        setData({
          states: { type: "FeatureCollection", features: stateFeatures },
          stateSources,
          cities: { type: "FeatureCollection", features: cityFeatures },
        });
        setLoadError(null);
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        if (!cancelled) setLoadError(msg);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [activeKey, activeCityIds]);

  useEffect(() => {
    if (geoCenter) setView({ center: geoCenter, zoom: 1 });
  }, [geoCenter]);

  const projection = useMemo(() => {
    if (!data || width <= 0 || height <= 0) return null;
    return createRegionProjection(width, height, data.states);
  }, [data, width, height]);

  const markers = useMemo(() => {
    if (!data) return [];
    return data.cities.features.map((f) => ({
      id: String(f.properties?.id ?? ""),
      name: String(f.properties?.name ?? ""),
      coordinates: geoCentroid(f) as [number, number],
    }));
  }, [data]);

  useFollowTargetCity(alwaysHighlightTarget, targetCityId, markers, setView);

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
        <p>National map failed to load</p>
        <code>{loadError}</code>
      </div>
    );
  }

  const dotR = DOT_RADIUS / zoom;
  const dotStroke = DOT_STROKE / zoom;
  const correctDot = correctFlashId ? dotPts.find((p) => p.id === correctFlashId) : null;

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

    const tolerance = 80 / zoom;
    if (bestDistSq > tolerance * tolerance) {
      onCityTap(null);
      return;
    }
    if (bestId && solvedIds.has(bestId)) {
      onCityTap(null);
      return;
    }
    onCityTap(bestId);
  }

  return (
    <div className="map-container" ref={ref}>
      {!data || !projection ? (
        <div className="map-loading">Loading national map...</div>
      ) : (
        <ComposableMap
          projection={projection}
          width={width}
          height={height}
          onClick={handleMapTap}
          style={{ width: "100%", height: "100%", display: "block", background: MAP_COLORS.water }}
        >
          <ZoomableGroup
            center={center}
            zoom={zoom}
            minZoom={1}
            maxZoom={12}
            onMoveEnd={(pos) => setView({ center: pos.coordinates, zoom: pos.zoom })}
          >
            <g ref={layerRef}>
              {data.stateSources.map(({ usps, topoUrl }) => (
                <Geographies key={usps} geography={publicAssetUrl(topoUrl)}>
                  {({ geographies }) =>
                    geographies.map((geo) => (
                      <Geography
                        key={geo.rsmKey}
                        geography={geo}
                        style={{
                          default: {
                            fill: MAP_COLORS.land,
                            stroke: MAP_COLORS.landStroke,
                            strokeWidth: MAP_COLORS.landStrokeWidth / zoom,
                          },
                          hover: { fill: MAP_COLORS.land, stroke: MAP_COLORS.landStroke },
                          pressed: { fill: MAP_COLORS.land },
                        }}
                      />
                    ))
                  }
                </Geographies>
              ))}

              {dotPts.map((p) => {
                const state = cityState(p.id);
                return (
                  <circle
                    key={p.id}
                    cx={p.x}
                    cy={p.y}
                    r={dotR}
                    fill={markerFill(state)}
                    stroke="#fff"
                    strokeWidth={dotStroke}
                    pointerEvents="none"
                    className={state === "hint" ? "map-dot map-dot--hint" : "map-dot"}
                  />
                );
              })}

              {correctDot && (
                <circle
                  cx={correctDot.x}
                  cy={correctDot.y}
                  r={dotR * 2.2}
                  fill="none"
                  stroke={MAP_COLORS.correct}
                  strokeWidth={dotStroke * 1.5}
                  pointerEvents="none"
                  className="map-dot-flash"
                />
              )}
            </g>
          </ZoomableGroup>
        </ComposableMap>
      )}
    </div>
  );
}
