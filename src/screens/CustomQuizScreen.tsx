import { useMemo, useState } from "react";
import { BackButton } from "../components/BackButton";
import type { CityMeta, StateMeta } from "../types/quiz";

interface CustomQuizScreenProps {
  stateMeta: StateMeta;
  onBack: () => void;
  onPlay: (cities: CityMeta[]) => void;
}

export function CustomQuizScreen({ stateMeta, onBack, onPlay }: CustomQuizScreenProps) {
  const sortedCities = useMemo(
    () => [...stateMeta.cities].sort((a, b) => a.name.localeCompare(b.name)),
    [stateMeta.cities],
  );

  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set());

  const selectedCount = selectedIds.size;

  function toggleCity(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function selectAll() {
    setSelectedIds(new Set(sortedCities.map((c) => c.id)));
  }

  function deselectAll() {
    setSelectedIds(new Set());
  }

  function handlePlay() {
    const cities = sortedCities.filter((c) => selectedIds.has(c.id));
    if (cities.length > 0) onPlay(cities);
  }

  return (
    <div className="screen custom-quiz-screen">
      <nav className="screen-nav" aria-label="Navigation">
        <BackButton onClick={onBack} label="Back to state home" />
      </nav>

      <header className="custom-quiz-header">
        <h1>Custom quiz</h1>
        <p className="custom-quiz-subtitle">
          Choose cities in {stateMeta.name}
          {selectedCount > 0 && ` · ${selectedCount} selected`}
        </p>
        <div className="custom-quiz-toolbar">
          <button type="button" className="btn-text" onClick={selectAll}>
            Select all
          </button>
          <span className="custom-quiz-toolbar-sep" aria-hidden="true">
            ·
          </span>
          <button type="button" className="btn-text" onClick={deselectAll}>
            Deselect all
          </button>
        </div>
      </header>

      <ul className="city-select-list" role="listbox" aria-label="Cities" aria-multiselectable="true">
        {sortedCities.map((city) => {
          const selected = selectedIds.has(city.id);
          return (
            <li key={city.id}>
              <button
                type="button"
                role="option"
                aria-selected={selected}
                className={`city-select-item${selected ? " city-select-item--selected" : ""}`}
                onClick={() => toggleCity(city.id)}
              >
                <span className={`city-select-dot${selected ? " city-select-dot--on" : ""}`} aria-hidden="true" />
                <span className="city-select-name">{city.name}</span>
              </button>
            </li>
          );
        })}
      </ul>

      <footer className="custom-quiz-footer">
        <button
          type="button"
          className="btn-primary"
          disabled={selectedCount === 0}
          onClick={handlePlay}
        >
          Play custom quiz
        </button>
      </footer>
    </div>
  );
}
