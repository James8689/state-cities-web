# State Cities

A mobile-first geography quiz. Learn the major cities of US states by tapping
them on an interactive map. All 50 states, daily challenges, regional and national quizzes.

## Shipped (v1.0)

- **Campaign hub**: Continue, daily challenge, explore by region, progress card
- **50 states**: Major + Full tiers, tap and type modes, custom quizzes, learn mode
- **Progression**: Points, 8 levels with perks, map themes, streaks, weekly goals
- **Badges**: Bronze/Silver/Gold mastery, speed tiers, regional + national quizzes
- **Journey screen**: Goals, badge walls, level path, map theme picker
- **PWA**: manifest, icons, service worker (offline maps after first load)
- **Native shells**: Capacitor iOS + Android (`npm run cap:sync`)

## Run locally

```bash
npm install
npm run dev          # http://localhost:5173
```

Generated map data is committed — no Census fetch needed for normal dev.

## Build & deploy

```bash
npm run build        # → dist/
npm run preview      # local production preview
npm run cap:sync     # build + sync to ios/ and android/
```

Deploy `dist/` to any static host (Vercel, Netlify, Cloudflare Pages). Security
headers for Cloudflare Pages live in `public/_headers`.

**Temporary share link** (dev machine):

```bash
npm run build && npm run preview -- --host --port 4173
npx cloudflared tunnel --url http://localhost:4173
```

Cloudflare WARP blocks the tunnel unless you run `warp-cli disconnect` first.

## App Store

Capacitor wraps the web app for iOS/Android submission. See **`docs/APP_STORE.md`**
for the pre-submission checklist. Monetization is deferred to v1.1.

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

## Architecture

State-agnostic app + generated per-state data. See `AGENTS.md` and
`.cursor/rules/state-quiz-invariants.mdc` for invariants. To edit state lists,
see `.cursor/skills/add-a-state/SKILL.md`.

## Tech

Vite + React + TypeScript · react-simple-maps + d3-geo · Census TIGER &
Natural Earth data · PWA-ready static maps.
