# App Store readiness

State Cities is a **Vite + React web app** wrapped for native stores with **Capacitor**.
You cannot submit a PWA directly to the App Store; the `ios/` and `android/` folders are
the native shells that load the built `dist/` bundle.

## Done in the repo

| Item | Location |
| --- | --- |
| App icons (192, 512, 1024, apple-touch) | `public/icon-*.png` — regenerate with `npm run icons` |
| Icon source art | `public/icon-source.svg` |
| PWA manifest (relative paths) | `public/manifest.json` |
| Privacy policy (static page) | `public/privacy.html` — linked from state picker |
| Capacitor config | `capacitor.config.ts` — app id `com.statecities.app` |
| Native projects | `ios/`, `android/` |
| Capacitor-safe asset URLs | `src/utils/publicAssetUrl.ts` + `vite` `base: './'` |

## Privacy posture (for App Store Connect)

- **No server-side collection** today
- **No accounts, analytics, or ads** in current build
- **localStorage** for per-state best scores on full quizzes (`src/progress/`); custom quizzes not tracked yet
- **Service worker** caches map GeoJSON for offline play
- Update `public/privacy.html` support email before submission

## Commands

```bash
npm run dev              # web dev
npm run build            # production web bundle → dist/
npm run icons            # regenerate PNGs from icon-source.svg
npm run cap:sync         # build + copy dist/ into ios/ and android/
npm run cap:ios          # open Xcode (requires macOS)
npm run cap:android      # open Android Studio
```

## Pre-submission checklist (later)

- [ ] Replace placeholder support email in `privacy.html`
- [ ] Apple Developer Program account ($99/yr)
- [ ] macOS + Xcode: build iOS, run in Simulator, then TestFlight
- [ ] Android Studio: build APK/AAB for Play Console (optional parallel track)
- [ ] App Store screenshots from **final** UI (after mastery/progression ships)
- [ ] 1024×1024 icon uploaded to App Store Connect (`public/icon-1024.png`)
- [ ] Privacy nutrition labels: “Data Not Collected” or local-only gameplay data
- [ ] Device smoke test: map load, tap, zoom, offline after first launch
- [ ] Decide on service worker in native WebView (keep or disable — both work)

## Timing

Capacitor is scaffolded now so architecture stays compatible. **TestFlight and store
listing should wait** until Phase 2–3 UI is stable (see `PRODUCT_BLUEPRINT.md`).
