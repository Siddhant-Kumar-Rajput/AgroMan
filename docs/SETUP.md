# AgroMan activation and operations

Most setup is automated. The first live deployment is complete; this file records what was done and what still needs a project-owner decision.

## Completed

- Firebase project/web app linked and Anonymous Authentication enabled.
- Firebase Hosting deployed at `https://agroman-siddhant-rajput.web.app`.
- Cloudflare authenticated on this device.
- Worker deployed at `https://agroman-api.agroman.workers.dev`.
- Gemini key stored as Cloudflare encrypted secret `GEMINI_API_KEY`.
- APAC D1 database `agroman` created and migrated.
- Six Earth Engine context/boundary rows dated 15 September 2026 reviewed and imported.
- Live Firebase token, context and Gemini advisory smoke tests passed.

No purchased domain is required for the hackathon. The Firebase URL already contains AgroMan.

## Manual work still required later

Only account/security decisions require the project owner:

1. Approve and configure Firebase App Check/reCAPTCHA after reviewing staging behavior.
2. Perform DNS verification only if a purchased `.com` or `.in` domain is added.
3. Approve expanded districts, refreshed observation dates and agronomic release evidence.

## Routine developer operations

Validate locally:

```sh
npm ci
npm run check
npm run test:e2e
```

Browser tests force `VITE_API_MODE=demo` through `.env.test`, so tests never consume live AI/data quotas. The ignored `.env.local` selects live mode for production builds.

Deploy the Worker and Hosting:

```sh
npx wrangler deploy --config worker/wrangler.jsonc
npm run build
firebase deploy --only hosting --project smart-venue-orchestrator
```

Refresh Earth Engine context:

```sh
python scripts/import_context.py --project smart-venue-orchestrator --date YYYY-MM-DD
npx wrangler d1 execute agroman --remote --file scripts/generated/context-YYYY-MM-DD.sql --config worker/wrangler.jsonc
```

Review every generated SQL file before import. The exporter refuses missing source observations rather than inventing values. Modeled soil is regional context, not a farm laboratory measurement.

## Secrets and privacy

- Never put Gemini keys, Cloudflare tokens, passwords or OTPs in source control or chat.
- Never silently substitute synthetic data in live mode.
- Images, audio and raw GPS coordinates must not be persisted or logged.
- Rotate the Gemini key in Cloudflare **Workers & Pages → agroman-api → Settings → Variables and Secrets**.
- Keep App Check optional only during staging; enforce it before broader public use.
