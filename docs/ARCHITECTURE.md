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
    backend/routes.js  Read-only authenticated reference-data serving
    ingestion/         Official PPFAS XLSX source adapter and atomic publication
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

Shared UI currently contains theme preference storage. Each app retains its own styles and icons. Promote actual reused controls to `packages/ui` as needed; do not copy app-specific styles into shared packages merely to fill the folder.

Fund Lens performs comparisons entirely in the browser. Its JSON artifacts are audited public reference data, not workspace business state, and need no SQL tables. It uses the shared SQLite identity, app grants and launch preferences. Its data routes enforce access before returning any bytes or conditional 304; private revalidation preserves access control. The supplied standalone plan's no-login/public-CDN assumptions were adapted to these existing platform conventions.

## SQL ownership

News owns `apps/news/database/001-editions.sql`, an additive migration tracked in `news_migrations`. The composition-created handler registers `news_editions`, `news_stories` and `news_runs` with the shared database for full SQL exports. `apps/news/backend/repository.js` validates and atomically stores immutable daily editions; business methods do not enter the advocate store. During the Planned preview, reads require owner access and no publication HTTP endpoint exists. The generation pipeline and job leases remain a later step.

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
