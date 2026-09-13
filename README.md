# AgroMan

Phase 1 agricultural advisory PWA. React + TypeScript, Firebase functions, Gemini, Google speech/translation, BigQuery and Earth Engine.

## Run locally

Use Node 22 LTS (the Cloud Functions runtime), then:

```sh
npm ci
npm run dev
```

Open http://127.0.0.1:5173. The default is **clearly labeled demonstration mode**. No credentials are needed. Responses and outbreak seeds are synthetic, and images are not analyzed in this mode.

```sh
npm run check
npx playwright install chromium
npm run test:e2e
```

## Current capability

- Responsive welcome, advisor, community and authority screens; reduced-motion support.
- Three conversations saved locally in IndexedDB; eighteen questions per thread.
- Text/image chat flow, JPEG compression, metadata-only opt-in contribution.
- Distinct-installation outbreak clustering with confidence, time, district and distance checks.
- JSON authority summaries with explicit synthetic/live provenance.
- Protected backend adapters for Gemini, Google STT/TTS, Translation and BigQuery.
- Server-side anonymous authentication, App Check, quotas and diagnosis receipts.
- PWA shell and cached local conversations; new advice needs network access.

## Activation requirements and known limits

Read [docs/SETUP.md](docs/SETUP.md) for the exact manual account steps and deployment commands.

No cloud project, credentials or production dataset was supplied during implementation. Live APIs, billing, Firestore rules and Earth Engine imports must be verified against your project before release. The model name is configurable, not an availability guarantee.

The pilot registry currently contains **six districts**: Ludhiana, Amritsar, Lucknow, Varanasi, Pune and Nashik. This is representative coverage of the three agreed states, not full-state coverage. Expanding the registry and verifying district boundary aliases is remaining data work.

All 22 scheduled Indian languages plus English are selectable. Cloud Translation supplies and caches UI translations in live mode. Demo mode explicitly shows English when a translated catalog is unavailable. Provider coverage, fonts, translated names, error copy and linguistic accuracy need validation before claiming all-language support. Voice support is checked against Google voices and unsupported cases are explicit.

The community visualization is a labeled schematic, not a Leaflet basemap. Raw reports/installation identifiers are never returned to the browser in live mode. Confidence is an uncalibrated AI score, not diagnostic probability; outbreaks are unverified signals.

No current-weather integration, curated crop evidence library, NDVI dashboard, Agmarknet nudge or live camera stream is included yet. No Phase 2 identity or farm records are included.

## Repository layout

`src/` frontend; `shared/` validation and outbreak rules; `functions/` protected cloud API; `scripts/` explicit data imports; `tests/` domain checks; `e2e/` browser tests.

The user-requested `gpt-tasteskill` guided the visual treatment (Outfit typography, cinematic image, dense feature grid and GSAP motion). Operational screens keep compact, accessible controls.

## Git workflow

Work on `codex/*` branches. Commit coherent tested increments, push branches for backup and review, then merge a pull request into `main`. Do not put secrets or generated build output in Git. CI validates the web build, backend build, domain tests and browser flows. Deployment is separate and manual.
