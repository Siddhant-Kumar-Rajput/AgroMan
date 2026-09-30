# Phase 1 implementation status

The Phase 1 live foundation is deployed. This is not yet a claim of agronomic production readiness.

## Live and verified

- Mobile-first PWA: `https://agroman-siddhant-rajput.web.app`.
- Cloudflare API: `https://agroman-api.agroman.workers.dev`.
- Firebase Anonymous Authentication enabled and returning valid ID tokens.
- Worker verification rejects unauthenticated requests and accepts valid Firebase tokens.
- APAC D1 database created with quotas, request state, conversations, diagnosis receipts, reports, translation cache, district context and boundaries.
- Six real district context rows and boundaries imported from Earth Engine for 15 September 2026.
- Context is explicitly district-scale: OpenLandMap modeled surface pH, CHIRPS preceding-30-day rainfall and SMAP preceding-30-day surface moisture.
- Gemini secret stored encrypted in Cloudflare; no key is committed locally.
- `gemini-3.5-flash-lite` selected after a live compatibility test; authenticated advisory returned 200 with a valid response.
- Public mobile-browser test confirmed the connected-services build and a live advisory response with no console errors.
- Read aloud prefers a browser-native voice, uses Sarvam Bulbul v3 for natural
  speech in ten Indian languages plus English, and retains an on-device eSpeak
  fallback for outages, quota exhaustion and additional languages.
- A public mobile-browser smoke test verified a Hindi Sarvam response, decoded
  31-second audio and no eSpeak fallback request.

## Local verification

- Frontend, legacy safety backend and Cloudflare Worker compile.
- Nine domain tests pass.
- Eleven Playwright flows pass across desktop and mobile in explicitly isolated
  demonstration-test mode; the duplicated mobile speech-engine download check
  is intentionally skipped.
- Wrangler deployment dry-run and D1 migrations pass.

## Remaining release hardening

- Configure Firebase App Check/reCAPTCHA for the production hostname, observe metrics, then enforce it in the Worker.
- Validate every claimed translation and speech-input language with native
  speakers. Neural speech currently covers only Sarvam's declared ten Indian
  languages plus English; device/eSpeak fallback quality varies elsewhere.
- Review agronomic recommendations against authoritative crop evidence before field use.
- Replace deprecated GAUL 2015 boundary sourcing with a verified current boundary source before long-term operation.
- Add current weather and source-freshness policy.
- Expand beyond the six-district pilot if the hackathon scope requires it.
- Complete accessibility, install/offline checks and the judge demo recording.

The dashboard, mandi prices and continuous camera remain optional/deferred Phase 1 items. Phase 2 profiles, OTP login, crop history, insurance and export-demand features remain out of scope.
