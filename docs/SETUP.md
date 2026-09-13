# Manual setup and live activation

## What you provide

- GitHub repository is already connected as `origin`.
- Google Cloud/Firebase **project ID**, chosen region, and Firebase public web configuration.
- Your own browser login for Firebase and Google Cloud.
- Confirmation of Earth Engine eligibility/registration and billing setup.

Do not paste API keys, passwords, service-account keys, OTPs or access tokens into chat. No service-account JSON key is needed: use Application Default Credentials locally and the deployed runtime identity in Cloud Functions.

## Account actions

1. Create a Google Cloud project and attach Firebase to that same project.
2. Link billing (Blaze is required for deploying functions). Set budget alerts. Alerts do not cap charges. Limit API quotas and review the function's `maxInstances: 2` setting.
3. Create Firestore in Mumbai (`asia-south1`). Choose deliberately: database location is not casually changeable. Enable Anonymous Authentication.
4. Register a Firebase Web App and App Check with reCAPTCHA v3 for your deployment hostname. Never allow arbitrary domains. Keep production App Check verification enabled.
5. Enable Cloud Functions, Cloud Run, Cloud Build, Artifact Registry, Secret Manager, BigQuery, Earth Engine, Cloud Translation, Cloud Speech-to-Text and Cloud Text-to-Speech APIs.
6. Register/verify the project for eligible noncommercial Earth Engine use.
7. Create a Gemini API key in AI Studio and select an actually available Flash model for your project.
8. Give the runtime identity minimum access: Firestore data access, BigQuery Job User and read access to the context/boundary dataset, Secret Manager access to the Gemini secret, and the relevant speech/translation permissions. Do not grant project Owner to runtime identities.

## Local configuration

The Google Cloud CLI and Firebase CLI are installed on this computer. Sign in yourself:

```sh
firebase login
gcloud auth login
gcloud auth application-default login
gcloud config set project YOUR_PROJECT
firebase use --add
firebase functions:secrets:set GEMINI_API_KEY
```

Create ignored `.env.local` using `.env.example`. Set `VITE_API_MODE=live` only when services and data are ready. Copy your public Firebase web values and reCAPTCHA **site** key there. Vite-prefixed variables are public: never put Gemini secrets into them.

Create ignored `functions/.env.YOUR_PROJECT` using `functions/.env.example`. Set the model identifier, `CONTEXT_TABLE` and `BOUNDARY_TABLE`. `GEMINI_API_KEY` stays in Secret Manager. Do not enable optional paid model features inadvertently.

## Real data import

```sh
python -m pip install -r scripts/requirements.txt
python scripts/import_context.py --project YOUR_PROJECT --dataset agroman --date YYYY-MM-DD
```

Use a historical date with complete observations; the script defaults to 14 days ago. The operator-run script reads real Earth Engine sources, appends context into BigQuery and replaces the explicitly named district-boundary table. It stops when any boundary does not resolve uniquely. Check GAUL district names/age and data licenses before using outside the prototype. The modeled pH dataset is a baseline, not a current measurement. Keep every metric's date/resolution visible.

The current registry is six pilot districts. Review returned statistics and boundary alignment before exposing live GPS. No invented or fallback numeric values are imported. Run imports again to refresh observations; this first version has no automatic schedule.

## Validate and deploy

```sh
npm run check
npm run test:e2e
firebase deploy --only firestore,functions,hosting
```

Deploy only after credentials, IAM, data and quotas are reviewed. Test on the deployed HTTPS hostname; browser GPS/microphone and production App Check depend on a valid origin. Configure Firestore TTL policies using the checked-in field overrides and verify them in the console; TTL deletion is asynchronous.

Live smoke test: anonymous sign-in → App Check → GPS boundary resolution → BigQuery context → Gemini text reply → photo uncertainty result → consent → metadata report → aggregate view. Repeat voice and translation checks for each claimed language. Ensure no image, audio, raw coordinates, prompts or response bodies appear in application logs. Provider processing/retention terms apply separately from this application's storage policy.

## Release gaps

- Live tests await your project credentials; do not claim provider integrations are verified yet.
- Expand district coverage and validate agronomic evidence before field use.
- Verify all scheduled-language translations and supported speech locales.
- Finish a real geographic basemap, curated crop rules, weather integration and browser accessibility review.
- Anonymous IDs deter ordinary duplicates but are not proof of distinct farmers; clearing app data can create a new identity.
- Budget alerts, application counters and function instance limits reduce cost exposure but are not a global hard billing cap.
