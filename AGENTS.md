# Sushant Synapse Platform continuation

- Platform home lives at `/`; Chambers lives at `/advocate`. Preserve shared authentication, app access enforcement and SQLite preferences. Planned apps must remain clearly unavailable until implemented.
- Target users: advocates and chamber staff in India. This is one chambers workspace.
- Read `FUNCTIONALITY_LEDGER.md` and `README.md` before continuing work. Update the ledger with real implementation and verification status before ending a work session.
- Keep the SQL schema in `database/schema.sql`. Runtime persistence is `data/chambers.sqlite`; do not replace this with browser-only state or JSON files.
- Preserve existing records, document blobs, accounts, and `data/records.json` (the legacy migration source). Do not reset user data to run demonstrations or tests.
- Use isolated temporary DATA_DIR values for tests. `npm.cmd test` runs API tests; `npm.cmd run test:e2e` uses headless Chrome with Playwright.
- Keep mobile-first layouts and light/dark/system themes functional. Avoid hardcoded colours in components; use CSS tokens.
- All business writes require API validation and role enforcement. Keep hearing outcome + next date atomic and enforce payment balances server-side.
- External court sync, message delivery, hosting, client portals, and payment providers have separate statuses in the ledger. Do not represent them as connected without evidence.
