# Agent handoff — State Cities

Mobile-first US state city geography quiz (Seterra-style). Vite + React + TS + react-simple-maps.

## Run

```bash
npm install && npm run dev
npm run build:data -- XX    # regenerate state maps (Census TIGER)
npm run build:physical -- XX
npm run diagnose -- XX
npm run build
```

## Architecture

**Centralized (fix once → all states):** `useQuiz.ts` (scoring/hints), `StateMap.tsx` (map/zoom/taps/feedback), `QuizScreen.tsx`, `CustomQuizScreen.tsx`, `src/progress/` (best scores), `index.css`, `mapTheme.ts`, `geo.ts` (projection).

**Per-state (data only):** `src/data/states/registry.ts` (cities, FIPS, peaks) → build scripts → `public/maps/*` + `src/data/states/<slug>.json` → one import in `index.ts`.

**Invariants:** `.cursor/rules/state-quiz-invariants.mdc`  
**Edit / rebuild state data:** `.cursor/skills/add-a-state/SKILL.md`

## Built states

All 50 US states — 16–20 curated cities each (~950 total). Registry, generated
JSON, map files, and `index.ts` imports are all committed. State picker shows
city count for every state; none are "Coming soon".

## App flow

`hub` → `select` / `journey` → `stateHome` → quiz (tap or type) → `results` → hub

Default screen is always the **campaign hub**. **Continue** opens **state home** (pick Learn / Tap / Type). **Daily challenge** on the hub (UTC regional rotation). **Explore** → Region tab has the **regional quiz** teaser. **Your progress** card opens **Journey** (goals, badges, level path). Learn mode is on each **state home** screen.

## Key behaviors

- Nearest-dot tap within ~80px tolerance; empty-map taps ignored (not a miss)
- `ZoomableGroup` needs `zoom={zoom}` prop synced with `onMoveEnd` or view resets
- Custom quiz passes a subset via `activeCityIds` on `StateMap`
- Scoring: 1 pt/city, −0.5 per wrong guess; hint after 2 misses (1 miss at Lv4+)
- Tiers: Major (top 10 by pop) + Full; badges at 70/85/100% best score
- **Type mode** on state tiers and regional quiz (generous spelling match)
- **Regional quiz**: mixed Major cities; unlock + play in Explore → Region or Journey
- **National Top 100**: unlock at 30 states Bronze+; full US map on Journey screen (tap + type)
- **Weak city tracking**: miss counts persist; practice tough cities from Journey
- **Daily challenge**: UTC regional rotation; primary entry on hub
- **Play streak + weekly goal**: counted quizzes update streak/weekly progress on Journey
- PWA + service worker (`public/sw.js`, cache v8); `body { position: fixed }` locks page scroll on quiz
- Share: `npm run build && npm run preview -- --host --port 4173` + cloudflared (WARP must be off)

## Known gaps

- App Store: Capacitor scaffold ready; v1 ships without IAP — checklist in `docs/APP_STORE.md`
- `DEFAULT_STATE` unused; app uses state picker
- **Leaderboards / rankings** (daily, timed, total progress rank): deferred — see `docs/PRODUCT_BLUEPRINT.md` Phase 7
