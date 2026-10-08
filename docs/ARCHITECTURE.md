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

Fund Lens public comparison routes run independently in the Cloudflare Worker. `infrastructure/cloudflare/fund-sources.mjs` reuses app-owned MFapi/Tickertape/Groww validation, bundles only the official public reference index/snapshots, and caches public verification progress at the edge. Each invocation bounds upstream requests to 36; HTTP 202 asks the browser to continue verification before computing any comparison. Cache eviction can require re-verification. Private legacy portfolio/watchlist routes still proxy to authenticated Node/SQLite. No business state is migrated.

DIGITAL SAMAJ is owned by `apps/digital-samaj`, served at `/digital-samaj` and `/api/digital-samaj`. The user explicitly selected integration with Node, shared sessions and SQLite instead of a separate Next.js/.NET/PostgreSQL service. App-scoped permission bundles, geographic/family/self grants, privacy projections, person/family/relationship repositories, review/import workflows and participant-only messaging are separate backend modules. Two additive schema files register app tables in full SQL export. Person identity is independent of login accounts; family contexts join the same person rather than duplicate it. The ten-step browser wizard autosaves drafts in SQLite. See the app README for verification, privacy and operational limits.

Cloudflare frontend deployment is owned by `infrastructure/cloudflare`. Its build exports only `server/static-assets.js`'s public allowlist plus the shared availability UI, never runtime data or backend source. A Worker route on the existing tunnel hostname serves these assets and proxies `/api/*` and `/healthz` to the unchanged Node origin. News, Certificates, Timetable Lite and the homepage can load independently; other page routes check backend health and serve `apps/portal/frontend/unavailable.html` during outages. `packages/ui/availability.js` shows mid-session connection failures without replaying writes or discarding form input. Cloudflare preview hosts intentionally have no backend connection. SQLite ownership and all API enforcement remain on the existing server.

Tournament Lite is owned by `apps/tournament-lite`, served at `/tournament-lite` and `/api/tournament-lite`. Its format/progression engine is separate from sport scoring rules. Organizer routes enforce shared app access, Owner/Advocate roles, account ownership and optimistic revisions; explicit published-token GET routes are public. App-owned SQLite snapshots and an additive migration marker are registered for full SQL export. Public responses exclude organizer contact and team rosters. No browser business-state storage or external sport service is used.

The server creates the database and app handlers. It injects the database and authentication helpers into each handler. App routes must enforce their own app access before reading or writing business data. Shared authentication receives an initialization callback from the server, so it does not import Chambers-specific settings.

`PlatformDatabase` owns identity, access, preferences, settings and audit storage. The advocate store extends it with Chambers data access, migration, backups and reporting. The server currently creates that combined store because Chambers is the first available app. New apps should use their own repositories over the shared connection; do not add their business methods to the advocate store.

Shared UI contains theme preference storage and the platform header stylesheet used across every implemented app. Headers share the platform logo, typography, spacing, home navigation and visible theme controls; private workspaces retain their app actions. Each app retains its own content styles and icons. The public homepage includes its launch cards in HTML before JavaScript loads; `/signin` provides optional account entry. Portal and News asset URLs are release-versioned and HTML is served with no-store caching.

`packages/ui/theme.js` owns the shared light/dark toggle markup, accessible pressed state, device preference persistence and cross-tab synchronization. App theme handlers still apply their own root/body theme attributes. New visitors and legacy system preferences follow the device setting until the toggle saves an explicit light/dark choice; blocked storage falls back to in-memory preference. Shared header CSS owns the sun/moon control, including keyboard focus and reduced-motion styling.

Fund Lens performs comparisons entirely in the browser. Its JSON artifacts are public reference data, not workspace business state. News also has an independent Cloudflare source-metadata route, with shared parsing/templates in `apps/news/frontend/engine.js`. During backend outages the browser generates temporary tab-only editions; no browser business-state persistence or SQLite replacement is introduced. The Worker tries Indian Express archives and falls back to fixed BBC News public feeds, validating IST dates and bounding requests, response sizes, cache lifetimes and per-location rate limits. Shared archives remain unavailable until the backend returns. Reference reads and News published edition/status/archive reads are explicitly routed before the shared login gate. Fund Lens portfolio/watchlist routes still require a session and app access; News generation is public and validated, while operational preview routes require owner access. Shared per-date leases, cooldowns and persisted request budgets bound generation. Chambers and platform preferences remain protected.

## SQL ownership

News owns additive migrations under `apps/news/database`, registering editions, stories, run snapshots and budgets for SQL export. `repository.js` validates and atomically stores immutable daily editions. `fetch-service.js` persists source snapshots, leases and attempt budgets, supports historical IST cutoffs and rejects future dates. `archive-provider.js` reads bounded fixed-host Indian Express daily archives and article metadata, verifies publication dates and balances/deduplicates topics including entertainment. `publication.js` creates short credited excerpts and locally templated fictional comic dialogue. Legacy PIB editions/adapters remain preserved. Any visitor can generate a present or past edition through the validated fetch endpoint; any visitor can read saved editions. No arbitrary content publication endpoint or automatic scheduler exists.

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

## Timetable Lite ownership

`apps/timetable-lite/frontend` owns the public `/timetable-lite` planner. `engine.js` provides pure validation, bounded scheduling and atomic move/swap checks; `worker.js` keeps generation off the UI thread; `export.js` owns PDF, PNG, ZIP and print output. The user explicitly approved device-local storage for this app on 2026-09-27. Validated JSON imports/exports provide manual backup. No timetable API or database migration is installed; existing SQLite-backed apps retain their persistence and authorization boundaries.

## BatchFee Lite ownership

`apps/batchfee-lite` owns the private `/batchfee-lite` academy app and `/api/batchfee-lite` routes. `backend/engine.js` validates commands and deterministically generates fee obligations and payment allocations in integer paise. `backend/routes.js` persists the workspace snapshot and append-only command history in app-prefixed SQLite tables, with immediate transactions, optimistic revisions and idempotent request IDs. The additive version-1 schema is registered in full SQL exports. JSON app backups replay validated commands and cannot replace conflicting or newer history. Financial state stays in SQLite; browser storage holds theme preference only.

V1 is owner-only, represented by `ownerOnly` catalogue metadata and enforced by shared app access plus the app handler. One academy shares the existing platform deployment; this is not multi-tenant SaaS. Optional staff assignment and offline synchronization are deferred. No changes to Chambers records, schemas, legacy migration source or persistence path are required. The app has no runtime npm dependencies.

## Certificate app ownership

`apps/certificates/frontend` owns the public `/certificates` page. `app.js` manages transient form and image state; `renderer.js` defines template geometry and bounded text fitting; `export.js` writes a single A4 PDF and downloads. Both image formats and print reuse that renderer. No backend handler, schema or certificate persistence is needed. The user explicitly approved device/browser storage for reusable organisations on 2026-09-27. App-owned, validated localStorage stores up to 10 organisation names, reduced-size logos and positions on explicit save; recipient details and signatures remain transient. Future account-synced branding, history or verification must introduce app-owned authenticated routes and additive migrations rather than storing recipient data in shared preferences.

## Daily Spark ownership

apps/daily-spark/frontend owns /daily-spark. engine.mjs supplies versioned deterministic IST puzzles, arithmetic and a bounded four-number solver. app.js owns transient tab state, hints and explicit sharing. No backend, schema, persistence or external provider is used. Shared theme preferences are the only browser persistence. Static assets are allowlisted and both page routes bypass origin health checks in Cloudflare. Shared daily links preserve the v1 puzzle seed by date.

## Decision Wheel ownership

apps/decision-wheel/frontend owns /decision-wheel. engine.mjs validates bounded unique options, uses rejection-sampled browser cryptographic randomness and calculates exact pointer landing angles. app.js owns SVG rendering, animation locks, transient recent picks, winner removal and explicit result sharing. No backend routes, schema or persistent game/business state are introduced. Shared theme preferences are the only stored browser data. Both public page routes bypass Cloudflare origin health checks and all assets are explicitly allowlisted.
