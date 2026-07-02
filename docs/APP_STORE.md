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
| Privacy policy (static page) | `public/privacy.html` |
| Security headers (static hosts) | `public/_headers` (Cloudflare Pages / compatible CDNs) |
| Capacitor config | `capacitor.config.ts` — app id `com.statecities.app` |
| Native projects | `ios/`, `android/` — version **1.0** |
| Capacitor-safe asset URLs | `src/utils/publicAssetUrl.ts` + `vite` `base: './'` |
| Monetization | **Disabled** for v1 (`src/config/appFlags.ts`) — no store UI |

## Privacy posture (for App Store Connect)

- **No server-side collection** today
- **No accounts, analytics, or ads** in current build
- **localStorage** for progression (scores, badges, speed, points/levels, streaks, map theme)
- **Service worker** caches map GeoJSON for offline play
- Support: `support@statecities.app` in `public/privacy.html`

## Commands

```bash
npm run dev              # web dev
npm run build            # production web bundle → dist/
npm run icons            # regenerate PNGs from icon-source.svg
npm run cap:sync         # build + copy dist/ into ios/ and android/
npm run cap:ios          # open Xcode (requires macOS)
npm run cap:android      # open Android Studio
```

## Pre-submission checklist

- [ ] Confirm `support@statecities.app` is a real inbox (or update `privacy.html`)
- [ ] Apple Developer Program account ($99/yr)
- [ ] macOS + Xcode: build iOS, run in Simulator, then TestFlight
- [ ] Android Studio: build AAB for Play Console (optional parallel track)
- [ ] App Store screenshots from current UI (hub, quiz, results, journey)
- [ ] 1024×1024 icon uploaded to App Store Connect (`public/icon-1024.png`)
- [ ] Privacy nutrition labels: “Data Not Collected” or local-only gameplay data
- [ ] Device smoke test: map load, tap, zoom, type mode, offline after first launch
- [ ] `monetizationEnabled: false` and `adsEnabled: false` in release build
- [ ] Deploy web build to hosting if shipping PWA alongside native (`dist/`)

## v1.1 (after launch)

- In-app purchases via RevenueCat + Capacitor plugin
- Re-enable store UI behind `monetizationEnabled`
- First SKU: non-consumable ad-free
