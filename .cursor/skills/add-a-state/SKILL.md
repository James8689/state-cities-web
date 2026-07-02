---
name: add-a-state
description: Curate or regenerate a US state's quiz data (cities, peaks, map/water files). Use when editing src/data/states/registry.ts, fixing Census basename mismatches, tuning city lists, or rebuilding generated map data. All 50 states are already onboarded; this skill covers edits and the rare new registration.
---

# Add or Edit a State

Change one state's quiz data end-to-end. The app is state-agnostic; only the
registry + generated files matter. Read `.cursor/rules/state-quiz-invariants.mdc`
first — do not violate those invariants.

**All 50 states are already in the repo** (registry, JSON, maps, water, and
`index.ts` imports). Most tasks are edits + rebuild, not greenfield onboarding.

## Checklist (edit existing state)

```
- [ ] 1. Edit the StateConfig in src/data/states/registry.ts
- [ ] 2. Regenerate map data:  npm run build:data -- XX
- [ ] 3. Regenerate water:     npm run build:physical -- XX
- [ ] 4. Verify:               npm run diagnose -- XX  &&  npm run build
- [ ] 5. Eyeball in the app (npm run dev): projection, dot spacing, peaks
```

## Checklist (brand-new state — rare)

Same as above, plus register the generated JSON in `src/data/states/index.ts`
(static import + `META_BY_USPS` entry).

## Step 1 — Registry entry

Each state lives in `STATE_CONFIGS` in `src/data/states/registry.ts`:

```ts
{
  usps: "WA",          // two-letter code
  fips: "53",          // Census FIPS (look up the state's code)
  name: "Washington",
  capital: "olympia-wa", // city id slug = `${citySlug}-${usps.toLowerCase()}`
  slug: "washington",  // file slug for generated data
  cities: [
    { basename: "Seattle", tier: 1 },
    { basename: "Spokane", tier: 1 },
    // ...curate ~15-25 cities. basename must match the Census BASENAME exactly.
  ],
  peaks: [
    { name: "Mt Rainier", range: "Cascades", coordinates: [-121.7603, 46.8523] },
    // ...a handful of representative peaks across the state's ranges.
  ],
}
```

City selection: include all tier-1 hubs plus notable tier-2 towns. `basename` must
match the Census TIGER BASENAME exactly (even if ugly — e.g. consolidated
government names). The build script derives the friendly quiz label (`Augusta`,
`Boise`, etc.); add optional `name` on a city to override. Set `capital` to the
generated city id slug (`augusta-ga`, `boise-id`) after your first build.

Current city counts: 16–20 per state (most have 20).

## Step 2-3 — Generate data

```bash
npm run build:data -- WA      # state outline + cities → public/maps + src/data/states/washington.json
npm run build:physical -- WA  # rivers + lakes → public/maps/washington-water.geojson
```

If a city prints missing, its `basename` likely doesn't match Census exactly —
fix it in the registry and rerun. (Run with no arg to build every state.)

## Step 4 — Register the JSON (new states only)

JSON imports must be static for Vite. In `src/data/states/index.ts`:

```ts
import washingtonMeta from "./washington.json";
// ...
const META_BY_USPS: Record<string, StateMeta> = {
  // ...
  WA: washingtonMeta as StateMeta,
};
```

Skip this step when editing an existing state — its import is already present.

## Step 5 — Verify

```bash
npm run diagnose -- WA   # checks files exist, city count, projection in viewport
npm run build            # tsc + vite, must be clean
```

## Step 6 — Eyeball

`npm run dev`, switch to the state, and check: the state fills the frame, dots
are separated and tappable, the wrong-name label reads well, and the peaks sit
on the right ranges. Tune `peaks` coordinates as needed; spacing/look knobs live
in `StateMap.tsx` (`SEPARATION_PX`) and `mapTheme.ts`.
