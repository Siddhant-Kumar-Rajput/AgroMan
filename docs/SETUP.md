# AgroMan activation checklist

Most setup is handled from the repository or deployment CLI. You do **not** need to run every command in this file yourself.

## What you must do manually

Only account-owner actions or secret entry require you:

1. **Enable anonymous authentication**
   - Firebase Console → `smart-venue-orchestrator` → Build → Authentication → Get started/Sign-in method → Anonymous → Enable → Save.
   - Phone/OTP authentication is intentionally outside Phase 1.
2. **Enter the Gemini key privately when requested**
   - Do not paste it into chat or Git.
   - After explicitly authorizing the upload, enter it into the hidden terminal prompt opened for:
     `npx wrangler secret put GEMINI_API_KEY --config worker/wrangler.jsonc`

That is all that blocks the first live API deployment.

## Already completed

- Firebase project and web app linked.
- Firebase Hosting site created: `https://agroman-siddhant-rajput.web.app`.
- Cloudflare CLI authorized on this device.
- Cloudflare D1 database `agroman` created in APAC.
- D1 schema applied successfully.
- Worker configuration contains the real D1 ID and the AgroMan Hosting origin.
- Firebase public web configuration saved only in ignored local configuration.
- Builds, domain tests and mobile/desktop browser tests pass.

## What Codex/development automation handles

After the two manual items above, Codex can run these steps:

1. Store the Gemini key in Cloudflare's encrypted Worker secret store.
2. Deploy `agroman-api` to the account's `agroman.workers.dev` subdomain.
3. Put the resulting API address into ignored local configuration.
4. Build and deploy the PWA to `agroman-siddhant-rajput.web.app`.
5. Run live authentication, API, image, consent and aggregate-report smoke tests.
6. Commit and push configuration changes without secrets.

## Later release work—not required for the first hackathon deployment

### App Check

App Check is intentionally optional during staging. After the hosted application works, register the web app with reCAPTCHA, observe its metrics, set `REQUIRE_APP_CHECK` to `true`, and redeploy the Worker. Codex can guide or perform the configuration while you approve account changes.

### Earth Engine data

Earth Engine registration is complete. The repository includes a script that exports real district observations into a reviewable D1 SQL file:

```sh
python -m pip install -r scripts/requirements.txt
python scripts/import_context.py --project smart-venue-orchestrator --date YYYY-MM-DD
```

Codex can run this. You only need to approve the selected observation date and review the resulting sources/values before they become live. The script refuses to invent missing values. Modeled soil is regional context, not a farm laboratory measurement.

### Purchased custom domain

No purchased domain is required for the hackathon. The chosen Firebase address already contains AgroMan:

`https://agroman-siddhant-rajput.web.app`

If a purchased `.com` or `.in` domain is added later, DNS verification at the domain registrar is the one unavoidable manual action.

## Safety rules

- Keep `VITE_API_MODE=demo` until the complete live smoke test passes.
- Never put Gemini keys, Cloudflare tokens, passwords or OTPs in source control or chat.
- Never silently substitute synthetic data in live mode.
- Images, audio and raw GPS coordinates must not be persisted or logged.
- Phase 2 profiles, OTP login, crop history, insurance and export-demand features remain out of scope.
