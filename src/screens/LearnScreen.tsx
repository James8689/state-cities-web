import { useEffect, useState } from "react";
import {
  learnZoneLabel,
  loadLearnZonesForState,
  type LearnZoneSummary,
  type LearnZoneId,
} from "../data/learnZones";
import { getStateBundle } from "../data/states";
import { BackButton } from "../components/BackButton";
import { rememberLearnZoneIds } from "../progress/storage";
import { getLearnZoneBest, isLearnZoneCompleted } from "../progress/learnProgress";
import type { CityMeta, StateMeta } from "../types/quiz";

interface LearnScreenProps {
  stateId: string;
  onBack: () => void;
  onStartZone: (stateMeta: StateMeta, zoneId: LearnZoneId, cities: CityMeta[]) => void;
}

export function LearnScreen({ stateId, onBack, onStartZone }: LearnScreenProps) {
  const bundle = getStateBundle(stateId);
  const [zones, setZones] = useState<LearnZoneSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!bundle) {
      setZones([]);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    loadLearnZonesForState(bundle.meta)
      .then((raw) => {
        if (cancelled) return;
        rememberLearnZoneIds(bundle.meta.id, raw.map((z) => z.id));
        setZones(
          raw.map((zone) => ({
            ...zone,
            completed: isLearnZoneCompleted(bundle.meta.id, zone.id),
            best: getLearnZoneBest(bundle.meta.id, zone.id),
          })),
        );
      })
      .catch(() => {
        if (!cancelled) setError("Could not load map areas. Try again.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [bundle]);

  if (!bundle) {
    return (
      <div className="screen learn-screen">
        <nav className="screen-nav" aria-label="Navigation">
          <BackButton onClick={onBack} label="Back" />
        </nav>
        <div className="learn-body">
          <p className="learn-empty">Pick a state to start learning.</p>
        </div>
      </div>
    );
  }

  const newCount = zones.filter((z) => !z.completed).length;

  return (
    <div className="screen learn-screen">
      <nav className="screen-nav" aria-label="Navigation">
        <BackButton onClick={onBack} label={`Back to ${bundle.meta.name}`} />
      </nav>

      <div className="learn-body">
        <header className="learn-header">
          <h1>Learn {bundle.meta.name}</h1>
          <p className="learn-subtitle">
            Study a few cities at a time — each state is split into compass areas.
          </p>
        </header>

        <section className="learn-zones-section">
          <div className="learn-zones-head">
            <h2 className="learn-zones-title">Map areas</h2>
            {!loading && zones.length > 0 && (
              <p className="learn-zones-meta">
                {newCount > 0
                  ? `${newCount} new area${newCount === 1 ? "" : "s"}`
                  : "All areas tried"}
              </p>
            )}
          </div>

          {loading && <p className="learn-loading">Loading areas…</p>}
          {error && <p className="learn-error">{error}</p>}

          {!loading && !error && (
            <ul className="learn-zone-list">
              {zones.map((zone) => (
                <li key={zone.id}>
                  <button
                    type="button"
                    className={`learn-zone-card${zone.completed ? "" : " learn-zone-card--new"}`}
                    onClick={() => onStartZone(bundle.meta, zone.id, zone.cities)}
                  >
                    <div className="learn-zone-card-main">
                      <span className="learn-zone-card-label">{zone.label}</span>
                      <span className="learn-zone-card-name">
                        {learnZoneLabel(zone, bundle.meta.name)}
                      </span>
                      <span className="learn-zone-card-desc">
                        {zone.cities.length} {zone.cities.length === 1 ? "city" : "cities"}
                      </span>
                    </div>
                    <div className="learn-zone-card-meta">
                      {!zone.completed ? (
                        <span className="learn-zone-tag learn-zone-tag--new">New</span>
                      ) : zone.best !== null ? (
                        <span className="learn-zone-tag">Best {zone.best}%</span>
                      ) : (
                        <span className="learn-zone-tag">Done</span>
                      )}
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
