# AgroMan working conventions

- Implement Phase 1 only. Do not create farmer profiles, OTP login, crop histories, insurance records or export-demand features.
- Use the user-requested gpt-tasteskill for frontend development. Source: https://github.com/Leonxlnx/taste-skill/tree/main/skills/gpt-tasteskill . Installed on this workstation at `C:/Users/srajput/.codex/skills/gpt-tasteskill/SKILL.md`; read it before design work. Keep farmer usability and reduced-motion accessibility ahead of decorative effects.
- Use `codex/*` branches. Preserve existing work and secrets. Review and test coherent changes before committing.
- `npm run check` builds frontend/backend and runs domain tests. `npm run test:e2e` runs desktop/mobile browser tests.
- Default development mode is explicitly labeled synthetic demonstration mode. Never silently fall back to synthetic data in live mode.
- No photos or raw GPS in persistent application storage/logs. Reports require consent and server-authorized diagnoses. Expose aggregate outbreak signals only.
- Do not call AI confidence diagnostic certainty or label modeled soil as a farm laboratory measurement.
- All user-facing copy belongs in the localization catalog. Confirm actual provider language coverage before claiming support.
- Cloud deployment and data imports require the user's configured project. Never invent credentials, IDs, measurements or successful validation.
