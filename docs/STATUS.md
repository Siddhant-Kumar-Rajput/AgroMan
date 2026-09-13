# Phase 1 implementation status

This is the first implementation milestone, not a claim that the hackathon submission is complete.

## Implemented locally

- Mobile and desktop PWA interface using the requested taste skill.
- Advisor text/image interaction with explicit demo mode.
- Three IndexedDB conversations and eighteen-turn limit; demo/live storage separated.
- Image compression, consent dialog, metadata-only demonstration reporting.
- Spatial/time/confidence clustering and in-app nearby banner.
- Aggregate authority view and JSON download.
- Cloud API code for anonymous auth, App Check, rate limits, Gemini, Google speech, translation, BigQuery context, GPS boundary matching and consented report writes.
- Firestore rules, indexes/TTL declarations, CI and an operator-run Earth Engine importer.

## Requires the user's Cloud project

- Configure Firebase web app, App Check domains and anonymous auth.
- Set the Gemini secret and verify the configured model's availability/quota.
- Grant minimal runtime permissions and import real district context/boundaries.
- Deploy and validate backend APIs, speech, translations and reports on HTTPS.

## Remaining submission work

- Expand and verify the six-district pilot registry as needed across Punjab, Uttar Pradesh and Maharashtra.
- Validate agronomic recommendations against an authoritative crop evidence library; this version uses guarded prompts and regional inputs rather than a curated scoring engine.
- Validate text across all 23 locales and complete translation of dynamic data/error strings. Provider support for every requested locale is not assumed.
- Confirm speech locale/model compatibility, audio length behavior and field-device recording support.
- Add current weather and per-source freshness checks; current importer covers historical rainfall, soil moisture and modeled pH only.
- Replace the labeled schematic with a geographic basemap if desired; the list view already presents aggregates.
- Validate server rules, idempotency, quota and receipt handling using a configured emulator/staging project.
- Finish release accessibility, offline/PWA installation checks and the judge demo recording.

Optional Phase 1 dashboard, mandi prices and continuous live camera remain deferred. Phase 2 is out of scope.
