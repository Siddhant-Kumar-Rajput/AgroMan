# AgroMan

Phase 1 agricultural advisory PWA. The mobile-first frontend uses React and TypeScript, Firebase Anonymous Authentication and Hosting. Its protected API runs on Cloudflare Workers with D1, Workers AI and Gemini. Earth Engine supplies operator-reviewed regional context exports.

## Run locally

Use Node 22 LTS, then:

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

For the live API, create ignored `worker/.dev.vars` from `worker/.dev.vars.example`, apply the local D1 migrations, and run the Worker in a second terminal:

```sh
npm run db:local -w worker
npm run dev -w worker
```

## Current capability

- Responsive welcome, advisor, community and authority screens; reduced-motion support.
- Three conversations saved locally in IndexedDB; eighteen questions per thread.
- Text/image chat flow, JPEG compression and metadata-only opt-in reporting.
- Distinct-installation outbreak clustering with confidence, time, district and distance checks.
- JSON authority summaries with explicit synthetic/live provenance.
- Protected Worker routes for Gemini, speech recognition, translation, D1 context and reports.
- Firebase anonymous ID-token verification, optional App Check, quotas and diagnosis receipts.
- Browser-native speech first, Sarvam Bulbul v3 neural speech for ten Indian
  languages plus English, and an on-device eSpeak fallback.
- PWA shell and cached local conversations; new advice needs network access.

## Activation requirements and known limits

Read [docs/SETUP.md](docs/SETUP.md) for the completed activation record and remaining release hardening.

The live Phase 1 path is deployed at `https://agroman-siddhant-rajput.web.app`: Firebase Anonymous Auth, the Cloudflare Worker/D1 API, six reviewed Earth Engine district records and Gemini advisory requests have passed live smoke tests. App Check remains deliberately disabled during staging and is a release-hardening task.

The pilot registry currently contains **six districts**: Ludhiana, Amritsar, Lucknow, Varanasi, Pune and Nashik. This is representative coverage of three states, not full-state coverage. Expanding the registry and verifying district boundary aliases remains data work.

All 22 scheduled Indian languages plus English are selectable. Live UI translation uses the Cloudflare AI4Bharat IndicTrans2 model where supported; English remains the honest fallback. Fonts, translated names, errors and linguistic accuracy must be reviewed by speakers before claiming full support. Speech input uses Whisper. Speech output prefers a device voice, then Sarvam Bulbul v3 for Hindi, Bengali, Tamil, Telugu, Gujarati, Kannada, Malayalam, Marathi, Punjabi and Odia, with eSpeak as the offline/quota fallback. Other languages still depend on a compatible device or eSpeak voice and must not be described as neural coverage.

The community visualization is a labeled schematic, not a geographic basemap. Raw reports and installation identifiers are never returned to the browser in live mode. Confidence is an uncalibrated AI score, not diagnostic certainty; outbreak clusters are unverified signals.

No current-weather integration, curated crop evidence library, NDVI dashboard, Agmarknet nudge or live camera stream is included yet. No Phase 2 identity or farm records are included.

## Repository layout

`src/` frontend; `shared/` validation and outbreak rules; `worker/` active protected API and D1 schema; `scripts/` explicit Earth Engine export; `tests/` domain checks; `e2e/` browser tests. `functions/` is retained legacy code and is not part of the Firebase deployment configuration.

The user-requested `gpt-tasteskill` guided the visual treatment. Operational screens keep farmer usability, clear hierarchy and reduced-motion accessibility ahead of decoration.

## Git workflow

Work on `codex/*` branches. Commit coherent tested increments, push branches for backup and review, then merge a pull request into `main`. Do not put secrets or generated build output in Git. Deployment is separate from source commits.
