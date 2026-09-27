# Code ownership and adding apps

This is an npm workspace monorepo. Apps have separate source directories and share one Node server, account system and SQLite connection. No bundler or runtime npm dependencies are required.

```text
apps/
  portal/
    frontend/          Platform home, catalogue, account screens
    backend/routes.js  Favourites, recent launches and app access
    tests/             Portal browser workflows
  advocate/
    frontend/          Chambers screens, legal icons and styles
    backend/           Business routes, validation, store and settings
    database/schema.sql
    tests/             Chambers browser workflows
  fund-overlap/
    frontend/          Fund Lens UI and pure browser comparison engine
    backend/           Public reference routes, national providers and cache
    ingestion/         Official PPFAS refresh and national saved-portfolio refresh
    data/              Public, versioned reference snapshots and small fund index
    tests/             Chrome workflows and official spreadsheet parser fixtures
packages/
  auth/                Sessions, passwords, profiles and staff accounts
  app-registry/        Catalogue entries and available app paths
  database/            SQL connection, shared schema and transactions
  ui/                  Shared browser theme preferences
server/                Composition, HTTP checks and static asset allowlist
infrastructure/        Docker image, Compose and HTTPS proxy
docs/                  Architecture, deployment and functionality ledger
tests/                 Cross-app API and production configuration tests
```

## Dependency boundaries

The server creates the database and app handlers. It injects the database and authentication helpers into each handler. App routes must enforce their own app access before reading or writing business data. Shared authentication receives an initialization callback from the server, so it does not import Chambers-specific settings.

`PlatformDatabase` owns identity, access, preferences, settings and audit storage. The advocate store extends it with Chambers data access, migration, backups and reporting. The server currently creates that combined store because Chambers is the first available app. New apps should use their own repositories over the shared connection; do not add their business methods to the advocate store.

Shared UI contains theme preference storage and the shared platform/News header stylesheet. Each app retains its own content styles and icons. The public homepage includes its launch cards in HTML before JavaScript loads; `/signin` provides optional account entry. Portal and News asset URLs are release-versioned and HTML is served with no-store caching.

Fund Lens performs comparisons entirely in the browser. Its JSON artifacts are public reference data, not workspace business state. Reference reads and News published edition/status/archive reads are explicitly routed before the shared login gate. Fund Lens portfolio/watchlist routes still require a session and app access; News generation is public and validated, while operational preview routes require owner access. Shared per-date leases, cooldowns and persisted request budgets bound generation. Chambers and platform preferences remain protected.

## SQL ownership

News owns additive migrations under `apps/news/database`, registering editions, stories, run snapshots and budgets for SQL export. `repository.js` validates and atomically stores immutable daily editions. `fetch-service.js` persists source snapshots, leases and attempt budgets. `pib-provider.js` fetches bounded fixed-host public releases with verified publication dates; `publication.js` creates source excerpts and locally templated fictional satire. Any visitor can publish the shared daily edition through the validated fetch endpoint; any visitor can read saved editions. No arbitrary content publication endpoint or automatic scheduler exists.

The retired personal portfolio interface is no longer loaded or served. Its backend and data remain for compatibility and preservation. Personal Fund Lens portfolios use app-owned `fund_lens_portfolios` and `fund_lens_transactions`, created by the additive `apps/fund-overlap/database/001-portfolio.sql` migration and tracked in `fund_lens_migrations`. `registerAppSchema` registers the schema and export-table list on the shared database; the composition-created Fund Lens handler initializes it before serving requests. Full SQL exports include the new schema and rows. Chambers JSON backups retain their Chambers-only scope. App routes derive ownership from the session, validate edits/imports and enforce optimistic revisions. No portfolio details enter the shared Chambers activity feed. Account-private API access does not prevent an administrator from accessing the full database/SQL backup.

The retired analytics/watchlist interface is no longer loaded or served. Fund Lens watchlists are account preferences stored under `fundLensWatchlists` in the existing SQLite `platform_preferences` row. App-owned validated routes enforce access and derive the owner from the authenticated session. Up to 10 lists of four exact scheme codes are supported. NAV history is public reference data cached separately; hypothetical investment amounts stay in browser memory. `analytics-engine.js` holds pure return/exposure/SIP calculations and `analytics-ui.js` owns their interface.

`packages/database/schema.sql` contains shared tables. `apps/advocate/database/schema.sql` contains Chambers tables and reporting views. Both are applied when opening the database, and both are included in the full SQL export. Existing names, IDs, rows, documents and the `data/chambers.sqlite` path are preserved.

These files are idempotent baseline schemas for version 2, not a general incremental migration framework. Future schema changes should add ordered, tracked migration files in the owning database directory and test upgrading an existing database. Future apps should use app-prefixed tables to avoid collisions. This is still one organisation, not tenant-isolated SaaS.

## Add another app

1. Create `apps/<app-id>/` with `frontend/`, `backend/`, `database/` when needed, `tests/` and a private `@synapse/<app-id>` package manifest.
2. Implement its handler with explicit app-access and role checks. Register it in `server/index.js` under `/api/<app-id>/`. Existing Chambers `/api/*` routes are retained for compatibility.
3. Add its public page and assets to `server/static-assets.js`; the server never serves arbitrary repository paths.
4. Register its catalogue entry in `packages/app-registry/index.js`. Keep the status Planned until its implementation is usable and verified.
5. Add isolated tests and update `docs/FUNCTIONALITY_LEDGER.md`. Keep business data and secrets out of Git.

## Commands from the repository root

```sh
npm ci
npm start
npm test
npm run test:e2e
npm run test:advocate
npm run test:portal
```

`server.js` is a compatibility launcher. The canonical entry point is `server/index.js`. Deployment still uses a single image and persistent database volume; see `DEPLOYMENT.md`.

National fund discovery uses MFapi; holdings use Tickertape with exact-family Groww fallback. Public reference versions live in DATA_DIR/fund-overlap-cache, never in Chambers business tables. SHA-256 version checks and atomic pointer publication preserve last-good data. Provider outages are explicitly marked; catalogue coverage and holdings coverage are separate.

## Certificate app ownership

`apps/certificates/frontend` owns the public `/certificates` page. `app.js` manages transient form and image state; `renderer.js` defines template geometry and bounded text fitting; `export.js` writes a single A4 PDF and downloads. Both image formats and print reuse that renderer. No backend handler, schema or certificate persistence is needed. The user explicitly approved device/browser storage for reusable organisations on 2026-09-27. App-owned, validated localStorage stores up to 10 organisation names, reduced-size logos and positions on explicit save; recipient details and signatures remain transient. Future account-synced branding, history or verification must introduce app-owned authenticated routes and additive migrations rather than storing recipient data in shared preferences.
