# Manual setup and live activation

AgroMan uses Firebase for the web app, anonymous identity and hosting. Cloudflare provides the Worker API, D1 database, speech recognition and Indic translation. Gemini provides advisory and image analysis. This avoids the paid Google Speech, Text-to-Speech, Translation, Functions and Secret Manager services.

Never paste API keys, passwords, OTPs or access tokens into chat or commit them to Git.

## 1. Firebase console

Project: `smart-venue-orchestrator`.

1. Open **Build → Authentication → Sign-in method** and enable **Anonymous**. Phone/OTP is not part of Phase 1.
2. Keep the registered web app named **AgroMan Web**.
3. App Check can wait until the production hostname is working. Later, register the web app with reCAPTCHA, add the exact production domains, test metrics, then change `REQUIRE_APP_CHECK` to `true` in `worker/wrangler.jsonc` and redeploy.
4. Billing is not required for Firebase Hosting's no-cost allowance or Firebase Authentication used here. Review current quotas before launch.

The ignored `.env.local` holds only Firebase's public web configuration and the API URL. Vite-prefixed values are browser-visible; never place the Gemini key there. Keep `VITE_API_MODE=demo` until the live smoke test succeeds.

## 2. Cloudflare authorization and D1

The device does not need to remain connected after deployment. Use one of these local authorization methods:

- Interactive: `npx wrangler login`
- Automation: set a narrowly scoped `CLOUDFLARE_API_TOKEN` in your local shell or deployment provider; do not commit it.

Then create and configure D1:

```sh
npx wrangler whoami
npx wrangler d1 create agroman --location=apac
```

Copy the returned database ID into `worker/wrangler.jsonc`, replacing the all-zero placeholder. Apply the schema:

```sh
npx wrangler d1 migrations apply agroman --remote --config worker/wrangler.jsonc
```

## 3. Gemini secret

The same Gemini API key can call the enabled Gemini models; a different key per Gemini feature is unnecessary. Separate development and production keys are still recommended for rotation and quota visibility.

Enter it directly into Wrangler's hidden prompt:

```sh
npx wrangler secret put GEMINI_API_KEY --config worker/wrangler.jsonc
```

The source contains no Gemini key. Cloudflare encrypts the Worker secret. Confirm the model identifier in `worker/wrangler.jsonc` exists for the key before deployment.

## 4. Earth Engine context export

Earth Engine registration is reported complete. Install the operator script dependency, authenticate Earth Engine if prompted, and create a reviewable D1 SQL file:

```sh
python -m pip install -r scripts/requirements.txt
python scripts/import_context.py --project smart-venue-orchestrator --date YYYY-MM-DD
```

Use a historical date with complete observations; the default is 14 days ago. The script reads OpenLandMap modeled pH, CHIRPS rainfall, SMAP moisture and GAUL boundaries. It stops rather than inventing unavailable values. Modeled soil is a regional baseline, not a laboratory farm measurement.

Review the generated file, then apply it explicitly:

```sh
npx wrangler d1 execute agroman --remote --file scripts/generated/context-YYYY-MM-DD.sql --config worker/wrangler.jsonc
```

Generated data is ignored by Git. Verify licensing, district aliases, dates, units and boundary alignment before enabling live location lookup.

## 5. Deploy and test the API

```sh
npm run check
npm run test:e2e
npx wrangler deploy --config worker/wrangler.jsonc
```

Record the resulting `https://...workers.dev` URL. Put it in ignored `.env.local` as `VITE_API_BASE_URL`, switch `VITE_API_MODE=live`, rebuild, and perform this live smoke test:

anonymous sign-in → location/context → Gemini text reply → photo uncertainty result → consent → metadata-only report → aggregate outbreak view.

Also test translation and microphone behavior on each target device/language. Browser/device voices determine text-to-speech coverage. Ensure images, audio, raw coordinates, prompts and response bodies do not appear in application logs.

## 6. Firebase Hosting

Build and deploy only Hosting; `firebase.json` intentionally does not deploy Cloud Functions:

```sh
npm run build
firebase deploy --only hosting --project smart-venue-orchestrator
```

Test the generated `web.app` hostname first. After it works, Firebase Console → Hosting → **Add custom domain**. The complete owned domain is still needed; `agroman.....` is not actionable. Firebase will show the exact DNS TXT/A records to add at the registrar and will provision HTTPS after verification.

Add both the Firebase hostname and final custom domain to:

- Firebase Authentication → Settings → Authorized domains.
- App Check's allowed domains when App Check is activated.
- `ALLOWED_ORIGINS` in `worker/wrangler.jsonc`, followed by a Worker redeploy.

## Release gates

- Do not switch out of demonstration mode until Worker, D1, auth, origin restrictions and real context all pass staging tests.
- Verify Cloudflare and Gemini quotas; rate limits reduce exposure but are not a global spending cap.
- Have agronomic recommendations reviewed against authoritative evidence before field use.
- Anonymous installation identity reduces casual duplicate reports but does not prove distinct farmers.
- Phase 2 profiles, OTP login, crop history, insurance and export-demand features remain out of scope.
