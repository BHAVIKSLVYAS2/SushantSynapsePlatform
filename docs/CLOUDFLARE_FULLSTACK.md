# Cloudflare backend migration

**Current choice (2026-10-11):** The user requires free-limit hard stops without paid overages and selected reduced features. Use [the separate free deployment profile](CLOUDFLARE_FREE_DEPLOYMENT.md). The complete Paid/R2 migration below is retained as implementation documentation; it is not authorized for deployment under that billing requirement.

The new target is static frontend assets + a Cloudflare Worker API + D1 SQL data + a **private R2 bucket** for documents, Samaj photos and message attachments. D1 uses SQLite SQL; it is a SQL database, not a NoSQL database. The frontend keeps its existing URLs and API contracts.

The implementation is separate from the existing frontend-only Worker. **No cloud database/bucket has been created, no live records have been migrated, and production still uses its existing Node/SQL Server backend.** Use a separate staging hostname and resources first. This backend needs Workers Paid for the password/calendar CPU work and larger atomic workflows; deployment is not an account upgrade command.

## Code and ownership

- `server/edge-index.mjs` composes the asynchronous API. `server/index.js` remains the Node composition entry; `server.js` remains its compatibility launcher.
- Each implemented app owns its `backend/edge.mjs` entry (Fund Lens uses `edge-private.mjs`). Existing validation/engines remain app-owned. Public static tools retain their existing frontends.
- `packages/database/d1.mjs` provides per-request D1 sessions and a guarded atomic batch. A shared revision check prevents two requests from both passing a balance, permission or stale-record check and then overwriting each other. A conflict returns 409 and requires a reload; requests are not silently retried.
- Samaj's `edge-*.cjs` modules adapt its established workflows to asynchronous SQL. `d1-staged.mjs` supplies read-your-writes while collecting the complete request into one atomic batch. Permissions see staged family memberships. Update both Node and edge app handlers when changing these workflows; the shared Samaj scenario suite verifies parity.
- `packages/storage/r2.mjs` stores immutable private objects. D1 stores their metadata and SHA-256 hashes in `edge_objects`; downloads still require the app's existing access checks. Files are not public bucket URLs.
- `d1-migrations/0001-platform.sql` retains the registered app tables, constraints, views and append-only Samaj audit. Blob columns are nullable only in this D1 schema; actual bytes move to R2. Existing `packages/database/schema.sql`, `apps/advocate/database/schema.sql`, SQLite/SQL Server runtime and recovery sources remain intact.
- News uses durable D1 fetch leases/budgets and atomic publication. Calendar calculation uses the Workers runtime and a bundled PIN directory, with no filesystem reads or persisted death details. External provider availability still requires remote verification.
- The existing public Fund comparison handlers remain at the edge. Private portfolios/watchlists move to D1. Satire Arena binds its existing edge ballot handler to the platform D1 database.

## 1. Verify locally

Run from the repository root in PowerShell:

```powershell
# Install dependencies in a clean checkout, separate from a running Node backend.
npm.cmd ci
npm.cmd test
npm.cmd run test:cloudflare
Copy-Item infrastructure/cloudflare/.dev.vars.example infrastructure/cloudflare/.dev.vars
npm.cmd run db:d1:local
npm.cmd run dev:cloudflare
```

Replace the two example secrets in `.dev.vars` before setup. Open **http://127.0.0.1:8787** (the configured origin). D1/R2 development storage is local; these commands do not touch `data/chambers.sqlite`, `data/records.json`, SQL Server, or production Cloudflare resources. Local storage persists under Wrangler's ignored state directory. The integration tests use disposable storage and headless Chrome.

`npm.cmd run build:cloudflare` bundles without deploying. Fullstack and frontend-only builds share the generated asset directory: run them sequentially. Normal frontend-only builds do not include the internal ledger asset.

## 2. Create separate cloud staging resources

With an authenticated Cloudflare account, create these resources manually:

```powershell
npx.cmd wrangler d1 create synapse-platform-staging
npx.cmd wrangler r2 bucket create synapse-private-staging
```

Set the returned D1 UUID in `infrastructure/cloudflare/wrangler.fullstack.jsonc`. Set `PUBLIC_ORIGIN` to the exact staging HTTPS origin, with no trailing slash. Confirm the R2 bucket has **no public access/custom domain**. Keep the existing production Worker config untouched.

```powershell
npx.cmd wrangler d1 migrations apply synapse-platform-staging --config infrastructure/cloudflare/wrangler.fullstack.jsonc --remote
```

The initial migration is already checked in. `build-d1.cjs` generated it before deployment; **do not regenerate an applied migration**. Future schema changes need a new numbered D1 migration and an updated reviewed catalogue.

## 3. Export the authoritative source

The current authoritative source is SQL Server LocalDB. Load its documented `SQLSERVER_*` environment settings from [SQL Server setup](SQLSERVER_MIGRATION.md), then:

```powershell
npm.cmd run db:cloudflare:transfer -- export --sqlserver --output data/backups/cloudflare-staging-bundle
npm.cmd run db:cloudflare:transfer -- validate --bundle data/backups/cloudflare-staging-bundle
```

The exporter verifies the existing SQL Server migrations and reads within the platform's serializable transaction/write lock. It does not initialize, reset, or change the source. It requires the existing SQL Server driver on the source machine.

For an explicitly selected SQLite recovery snapshot instead:

```powershell
npm.cmd run db:cloudflare:transfer -- export --sqlite C:\secure-backups\chambers.sqlite --output data/backups/cloudflare-recovery-bundle
```

Do not substitute an older SQLite recovery file for the current SQL Server data. Unknown source tables/schema differences fail validation. Empty/missing app initialization tables receive the current static role/migration defaults, recorded in `initializedTables`; existing business rows and nonempty permission tables are preserved.

Bundles contain account password hashes and confidential records/files. Store them in restricted backup storage, outside public assets and source control. `manifest.json` records row checksums, file checksums and source type; `blobs/` stores the exact bytes. Accounts, app access, preferences, IDs, audit and Chambers insertion order are preserved. Sessions deliberately expire at cutover. Oversized rows fail before target import; large valid Unicode fields are assembled in bounded SQL statements.

## 4. Import and verify before binding a Worker

Use a **new, schema-initialized, unbound target**. No setup account should have been created there.

```powershell
npm.cmd run db:cloudflare:transfer -- import --bundle data/backups/cloudflare-staging-bundle --database synapse-platform-staging --bucket synapse-private-staging --remote --unbound-target
```

The command validates the bundle, rejects targets with existing application writes, uploads immutable R2 objects, imports D1 rows with deferred foreign-key checks, then compares all registered table checksums and downloaded R2 byte hashes. It prints `verified: true` only after these checks succeed. It regenerates SQL from the verified manifest rather than trusting an edited SQL sidecar.

Bulk import is an **offline operation**, not a cross-service transaction. If interrupted, keep the source intact, investigate, and use a fresh target rather than resetting/replacing existing data. Do not deploy/bind the Worker until verification passes. R2 and D1 cannot share one transaction; failed app uploads can leave unreferenced immutable objects. Retain these for recovery; automatic deletion/garbage collection is not implemented.

An isolated local rehearsal is supported with `--local --persist-to <new-test-directory>` on the migration, import and export commands. Use the same directory for D1 and R2. The default `db:d1:local` script uses the ordinary local development directory instead.

## 5. Add secrets and deploy staging

```powershell
npx.cmd wrangler secret put ARENA_COOKIE_SECRET --config infrastructure/cloudflare/wrangler.fullstack.jsonc
npx.cmd wrangler secret put SETUP_TOKEN --config infrastructure/cloudflare/wrangler.fullstack.jsonc
npx.cmd wrangler deploy --config infrastructure/cloudflare/wrangler.fullstack.jsonc
```

Use separate long random staging secrets. At production cutover, preserve the existing production `ARENA_COOKIE_SECRET` so existing ballot cookies/voter hashes remain usable; back it up separately from the data bundle. `SETUP_TOKEN` is needed only for a genuinely empty workspace; imported accounts sign in with their existing passwords. The staging Worker name has no production route configured. Inspect `/healthz`, sign in, and verify real staging provider behavior, rate limits, calendar CPU usage, file downloads, role revocation, payment conflicts and backup recovery. Confirm request/row/storage usage before cutover.

## 6. Cut over after staging acceptance

Freeze writes on the old backend, produce a final source bundle, import and verify it into **fresh production D1/R2 resources**, and deploy the reviewed Worker configuration for the production HTTPS origin. Keep the previous backend, SQL database, SQLite recovery sources, old Worker version and bundle intact. Switch the production route only after validation. Everyone signs in again because sessions are not migrated.

Do not permit writes to both backends. A rollback after new cloud writes requires reconciling those writes first; simply routing back would discard the newly entered records.

## Backup and recovery after cutover

Set `MAINTENANCE_MODE` to `"true"` in the deployed fullstack configuration and deploy that setting to freeze workspace APIs while taking a full backup. Preserve the configuration/secrets and D1 migration files separately.

```powershell
npm.cmd run db:cloudflare:transfer -- export --d1 --database synapse-platform-staging --bucket synapse-private-staging --remote --frozen-source --output data/backups/cloudflare-full-backup
npm.cmd run db:cloudflare:transfer -- validate --bundle data/backups/cloudflare-full-backup
```

Restore this bundle to new schema-initialized D1/R2 resources using the same import/verification procedure, then bind a Worker. Return `MAINTENANCE_MODE` to `"false"` after the backup. D1-only SQL exports are insufficient because the private bytes live in R2. The Chambers JSON backup API remains available for bounded app-only exports/restores; `/api/backup.sql` explains the new recovery requirement.

Operational bounds: 950 business statements per atomic request; 100 parameters per statement; bounded JSON/file bodies and a 1.5 MB text-value guard. Large Samaj imports/restores must be split or use the offline staging migration. Shared revision conflicts favor correctness over simultaneous write throughput for this single workspace. Production scale, remote restore rehearsal and provider connectivity are not yet verified.
