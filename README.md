# State Cities

A mobile-first geography quiz. Learn the major cities of a US state by tapping
them on an interactive map. Built to scale to all 50 states from a single config.

## Current progress

**Shipped**

- Full quiz loop: shuffle cities → tap to answer → results with accuracy % and best score
- Interactive map: pinch/scroll zoom, city boundary outlines, declustered dots, nearest-dot tap selection
- Feedback: correct cities stay green; wrong tap blinks red and shows the city name; blue hint pulse after two misses
- Scoring: 1 point per city, −0.5 per wrong guess (floored at 0); accuracy = points / total
- Terrain context: rivers/lakes + mountain peaks, clipped to the state border
- Haptic feedback on correct/incorrect (where the device supports it)
- PWA: app icon, manifest, service worker (offline after first load)
- Config-driven data pipeline: `registry.ts` + parameterized build scripts + generic projection
- Per-state best scores for full quizzes (`src/progress/` + results screen)
- State tiers: Major (top 10) + Full state, with Bronze/Silver/Gold mastery badges
- Campaign hub (default screen): Continue, points, browse-by-region, pick or random start
- State picker: all 50 states playable (16–20 curated cities each)
- Custom quiz: pick a subset of cities before starting
- Back navigation from quiz, custom select, and state start screens to the picker

**All 50 states are built** — registry entries, generated map/water files, and JSON
metadata are committed. City counts vary by state (16–20); most states have 20.

**Not done yet**

- Permanent web hosting — deploy `dist/` to Vercel/Netlify when ready to share (static app, no extra config needed)
- App Store submission — Capacitor scaffold is in place; TestFlight/listing waits on final UI (see `docs/APP_STORE.md`)
- County quizzes — mentioned as a future idea, not started

**Sharing on a phone (temporary link)**

```bash
npm run build
npm run preview -- --host --port 4173
npx cloudflared tunnel --url http://localhost:4173
```

Cloudflare prints an HTTPS URL you can text to anyone (works off your Wi-Fi). The link dies when your laptop sleeps or the processes stop. **Note:** Cloudflare WARP (VPN) blocks the tunnel unless you run `warp-cli disconnect` first. `vite.config.ts` already sets `allowedHosts: true` so tunnel hostnames are accepted.

For a permanent link, deploy the `dist/` folder to Vercel or Netlify Drop.

## Run locally

```bash
npm install
npm run dev          # http://localhost:5173
```

Generated map data is committed, so the app runs without re-fetching Census or
Natural Earth sources. To change a state's cities or regenerate maps, see
"Editing state data" below.

## Controls

- **Tap** near a city to answer (snaps to the nearest dot)
- **Drag** to pan, **scroll / pinch** to zoom

## How it works

The app is **state-agnostic**; everything per-state is data:

- `src/data/states/registry.ts` — source of truth: each state's FIPS, curated
  cities (with tiers), and peaks.
- `scripts/build-state-data.ts` — fetches the state outline (us-atlas) and city
  polygons (Census TIGER), rewinds + simplifies them, and writes
  `public/maps/<slug>-*.{topojson,geojson}` plus `src/data/states/<slug>.json`.
- `scripts/build-physical-data.ts` — clips Natural Earth rivers/lakes to the
  state → `public/maps/<slug>-water.geojson`.
- `src/data/states/index.ts` — pairs generated metadata with peaks for the app.
- `src/components/StateMap.tsx` — projection, declustered dots, nearest-dot
  selection, feedback, terrain. `src/utils/geo.ts` derives the projection per
  state from its geometry.

Invariants that must stay consistent live in
`.cursor/rules/state-quiz-invariants.mdc`.

## Editing state data

To change a state's city list, peaks, or regenerate its maps after a registry
edit, see the `add-a-state` skill (`.cursor/skills/add-a-state/SKILL.md`). Short version:

```bash
# 1. edit the StateConfig in src/data/states/registry.ts, then:
npm run build:data -- WA
npm run build:physical -- WA
npm run diagnose -- WA
npm run build
```

All 50 states are already registered in `src/data/states/index.ts`; you only
need a new import/entry there when onboarding a state that is not yet in the repo.

## Scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` / `build` / `preview` | Vite dev / production build / preview |
| `npm run lint` | oxlint |
| `npm run build:data -- XX` | Generate outline + city data (omit `XX` for all) |
| `npm run build:physical -- XX` | Generate rivers/lakes (omit `XX` for all) |
| `npm run diagnose -- XX` | Validate generated data projects correctly |
| `npm run icons` | Regenerate PNG app icons from `public/icon-source.svg` |
| `npm run cap:sync` | Production build + sync into `ios/` and `android/` |
| `npm run cap:ios` / `cap:android` | Open native IDE (Xcode / Android Studio) |

## App Store / native shells

The game is a web app wrapped with **Capacitor** for future iOS and Android store
submission. Native projects live in `ios/` and `android/`. See **`docs/APP_STORE.md`**
for what's done, commands, and the pre-submission checklist.

## Tech

Vite + React + TypeScript · react-simple-maps + d3-geo · Census TIGER &
Natural Earth data · PWA-ready static maps.
