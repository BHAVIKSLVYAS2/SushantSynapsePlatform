# Platform scan and database choice — 2026-10-10

> Historical review from 2026-10-10. Statements describe that review checkpoint, not current deployment status. Production now runs the implemented apps on Cloudflare Workers Free and D1, with a separate Focus workspace. See [the functionality ledger](FUNCTIONALITY_LEDGER.md) for current implementation and verification. This document does not authorize Azure provisioning or a database replacement.

Status: source-level review only. No runtime database inspected, application code changed, tests executed, cloud resources provisioned or data migrated. Existing pending edits remain untouched. Recommendations are not measured performance defects or verified cloud compatibility.

## Decision

SQL Server can replace SQLite or PostgreSQL for this platform. For Azure-managed production, Azure SQL Database is a sensible SQL Server-family target; a full SQL Server VM or Managed Instance is not justified by any dependency found in this scan. It requires database/repository/transaction migration, not a configuration switch.

The choice follows the deployment priority:

- Minimum change today: retain SQLite and one persistent Node host.
- Cloudflare-first cost target: evaluate Workers + D1 + private R2 incrementally. D1 is SQLite-based, but its asynchronous API, size limits and transaction model are different from the current local driver.
- Microsoft/Azure preference: Node on App Service + Azure SQL Database, using a narrowly scoped database identity and connection pooling. Azure SQL has a free offer, but application hosting and networking are separate and the database compute allowance can be exhausted.
- Portable server database: PostgreSQL is a good alternative, with JSONB and relational features; it is not necessary if the operator prefers Microsoft tools and Azure SQL.

Do not migrate twice just to follow a presumed SQLite -> PostgreSQL -> SQL Server progression. Pick the intended platform, prototype the difficult paths, then migrate once after verification.

## App-by-app findings

| Area | Current ownership and storage | Suggested improvement / migration concern |
|---|---|---|
| Portal, accounts and support settings | Shared auth, sessions, app access, preferences, settings and audit in SQLite; public pages on Cloudflare | Extract shared identity/settings repositories; preserve role checks, password hashes/session invalidation and same-origin rules |
| Chambers | Generic records(kind,id,data JSON), views/expression indexes, document BLOBs; state() loads every record kind and computes next dates/balances in JS | Paginated/filterable queries, targeted summaries, first-class reference/amount/version columns where useful; retain flexible fields without rewriting every record at once |
| BatchFee | One workspace JSON snapshot plus append-only command history and staff roles | Indexed request-ID lookup instead of reading/parsing all events per duplicate check; explicit idempotency key constraint and atomic command+snapshot update; measure snapshot growth before normalization |
| Tournament Lite | One JSON snapshot per tournament, ownership/public token and revision | Keep public/private response projections; use conditional revision update; normalize match data only if measured growth/concurrent scoring demands it |
| DIGITAL SAMAJ | Relational people/families/relationships/grants/reviews/messages plus JSON, photos/attachment BLOBs | Preserve geographic/family/self permissions and visibility projections; paginate directories/messages; port recursive relationship checks and unusual expression indexes carefully |
| News | Persisted editions/stories, leases, fetch snapshots and request budgets; independent edge source/fallback flows | Keep atomic lease/budget claims and immutable publication; separate public reads from owner operations; preserve source/date attribution and explicit provider failures |
| Fund Lens | Public comparison in browser/edge; retained private portfolio APIs in SQLite; Node reference cache uses filesystem reads/writes/atomic rename | Preserve retained private data despite retired UI; separate public reference cache from private records; use object storage/cache only for appropriate artifacts |
| Ritual Assist | Public guides on edge; stateless calendar in Node worker_threads with local rate budget and 20-second timeout | Database migration does not solve runtime compatibility; benchmark calculation on intended runtime and replace process-local rate/concurrency controls if distributed |
| Satire Arena | Existing Cloudflare Worker + separate D1, browser identities and atomic batch vote operations | Keep independent unless a specific consolidation benefit warrants migration; not shared platform login verification |
| Timetable Lite | Explicitly approved device-local setup and JSON export | No forced cloud/database migration; optional account sync is a new feature |
| Moment Studio | Transient artwork and approved browser-saved reusable branding | No recipient/photo database needed for current functionality |
| Take a Break, Daily Spark, Decision Wheel, Pocket Pause, Team Mixer | Public browser/transient tools and static assets | Keep API-free where possible; do not add database traffic to games/tools without a product need |
| Projects, Finance, Knowledge | Planned registry entries | Remain unavailable until implemented and verified |

## Evidence from implementation

Inspected docs/ARCHITECTURE.md, README.md, current ledger, app registry, server/index.js, shared database/auth code, owning schemas and representative routes/repositories. A scoped rg search for sql.prepare, sql.exec and store.transaction found 277 textual matches across 20 backend/shared JavaScript files (excluding frontend, tests and seed files); this is coupling evidence, not a count of unique SQL queries.

- packages/database/index.js uses DatabaseSync, PRAGMA journal_mode=WAL and synchronous BEGIN IMMEDIATE/COMMIT/ROLLBACK callbacks.
- Authentication runs scryptSync, directly queries sessions and maintains login-failure state in a process-local Map. Before distributing instances, choose a shared abuse-control design; test password-hash compatibility and CPU cost on Workers rather than assuming a crypto API import proves suitability.
- apps/advocate/backend/store.js uses ORDER BY rowid, ON CONFLICT and SQLite-specific SQL export literals. state() walks all hearings for each case and all payments for each invoice. This is a growth concern, not evidence of current slow responses.
- apps/advocate/backend/routes.js validates record versions and balances before the synchronous transaction. That is compatible with the current single-process synchronous path but must not be preserved as an unprotected read-then-write sequence across network awaits/multiple instances. Revalidate protected state within the destination transaction.
- Chambers invoice numbers are derived from record count. A distributed database migration needs atomic numbering and uniqueness, not concurrent count+1 assignment.
- BatchFee events() reads the full command history, and the workspace is stored in one JSON row. A growing single row also needs a D1 2 MB row-limit assessment even after moving files to R2.
- DIGITAL SAMAJ schemas include json_extract expression indexes, a DEFERRABLE INITIALLY DEFERRED reference and min/max canonical pair indexing. Relationship cycle validation uses WITH RECURSIVE. These must be explicitly translated/verified for SQL Server.
- Files are stored in Chambers files, Samaj photos and message attachments. Chambers accepts 5 MiB files, larger than D1's 2,000,000-byte row/BLOB limit. Samaj files require the same inventory; don't assume all files live in the Chambers table.
- Current JSON snapshots are Chambers-focused and filesystem-based; full SQLite SQL export includes registered app data/accounts but excludes live sessions. A SQL Server migration needs independent complete recovery/export design.

## SQL Server migration details

| Current pattern | SQL Server/Azure SQL approach |
|---|---|
| Synchronous prepare().get/all/run and ? placeholders | Async pooled driver, named/typed parameters, app-owned repositories and explicit transaction-bound requests |
| PRAGMA and SQLite file opening | Service connection/authentication; ordered SQL Server migrations |
| TEXT, INTEGER booleans, BLOB | Sized Unicode text/JSON representation, BIT where appropriate, VARBINARY(MAX) or external object metadata; preserve integer monetary units |
| AUTOINCREMENT | Identity or sequences; preserve existing IDs during import |
| ON CONFLICT / INSERT OR IGNORE / INSERT OR REPLACE | Explicit transaction-safe insert/update semantics with uniqueness and conflict handling; don't blindly substitute MERGE |
| json_valid / json_extract | ISJSON / JSON_VALUE / JSON_QUERY where suitable; use typed computed/materialized columns for indexed references and consider target-version features |
| rowid ordering | Explicit created timestamp plus stable identifier/order field; preserve intentional record ordering |
| LIMIT | TOP or OFFSET/FETCH with deterministic ORDER BY |
| Recursive CTE syntax | T-SQL recursive CTE and bounded recursion; preserve cycle rejection |
| Deferred reference and expression/partial indexes | Redesign write order/reference enforcement, computed canonical keys and supported filtered indexes; assess NULL and collation differences |
| SQLite export/import script | SQL Server/Azure SQL-appropriate backup/export plus object-storage manifest and tested recovery |

SQL Server has transactions, JSON support and Node connectivity. Existing financial correctness relies on API rules and transaction boundaries, not on the name of the database. Preserve version rejection with conditional UPDATE ... WHERE revision/version=@expected, inspect affected rows, and lock/revalidate invoice balances or use an equivalent serializable strategy before payment writes. Test concurrent payments, numbering, relationship creation/merge and News budget claims. Retry only operations designed to be idempotent.

Migration must preserve Hindi/English Unicode, dates/IST behavior, IDs, password hashes, app grants, private files, revision history, audits and legacy data. Stage data mapping in a restricted environment; compare source/destination per-table counts and content/blob hashes from a consistent snapshot. Keep original SQLite/schema/records.json until verified cutover and recovery. Existing schema files remain intact during this analysis.

## SQL Server options and the free-cost question

1. Azure SQL Database: managed SQL Server-family PaaS and recommended Microsoft cloud option. Microsoft currently offers up to 10 General Purpose databases per subscription, each with 100,000 vCore-seconds/month, 32 GB data and 32 GB backup storage. This is a database allowance only. On exhausting it, choose pause until next month or paid overage. Open connections can prevent normal auto-pause and consume allowance; 100,000 vCore-seconds is about 27.8 one-vCore hours, not 730 hours of free always-on operation and not a direct measurement of application traffic. Confirm offer/region availability in the user's subscription. In the capped mode, documented PITR retention is seven days. Don't split the transactional platform across ten databases merely to multiply allowances.
2. SQL Server Express 2025: free entry-level software with a 50 GB relational database limit and CPU/memory restrictions. Hosting, patching and off-device backups still need resources. Express removes licence cost, not laptop dependence or cloud-host charges. Older Express versions have different limits; verify deployed version. Developer editions are for development/test, not production.
3. Paid full SQL Server VM or Azure SQL Managed Instance: no instance-level feature dependency found that warrants this complexity/cost now. Do not choose them simply because their names include SQL Server.

A Cloudflare frontend can remain with Azure SQL, but neither the existing Worker nor the Node backend can use it unchanged. Keep access through a trusted server-side API; verify runtime, driver, identity, network and latency compatibility before claiming a Cloudflare-only backend supports the SQL Server route. Never expose database credentials to browsers.

## Priorities before selecting a migration

1. Introduce app-owned asynchronous repositories and explicit transactional service boundaries. Support the chosen destination, not every database through a large generic abstraction.
2. Replace unbounded reads/history scans with indexed queries and pagination; add atomic idempotency/numbering/revision primitives.
3. Define private object storage: validate content/limits, enforce authenticated downloads, upload immutable objects before attaching references, and implement safe orphan cleanup. Object upload and SQL commit are not one atomic transaction; test failure/retry behavior and preserve previous blobs.
4. Implement complete backups with restoration and private file-manifest verification. Add disk/database growth, query usage, latency and budget alerts.
5. Prototype the hardest destination workflows in an isolated DATA_DIR/test database: shared sign-in/hash verification, concurrent fee writes, Samaj merge/cycle checks, calendar CPU and backup restoration. Free-tier suitability remains unverified until these pass.
6. Only then implement staged migration, run relevant API/Chrome tests and concurrent correctness tests, take a final consistent snapshot under write freeze and perform a single-writer cutover with rollback reconciliation.

Recommendation for the user's current zero-cost priority: continue the existing edge-hosted public apps and assess D1/R2 for a small isolated workflow first. If Microsoft SQL is a preference and a paid Node host is acceptable, choose Azure SQL Database rather than PostgreSQL; there is no requirement here that forces PostgreSQL. No evidence from this source review alone justifies an immediate destructive replacement of working SQLite.

## Official references checked

- Azure SQL free offer: https://learn.microsoft.com/en-us/azure/azure-sql/database/free-offer?view=azuresql
- SQL Server 2025 editions/features: https://learn.microsoft.com/en-us/sql/sql-server/editions-and-components-of-sql-server-2025?view=sql-server-ver17
- Node SQL Server driver: https://learn.microsoft.com/en-us/sql/connect/node-js/node-js-driver-for-sql-server/
- D1 limits: https://developers.cloudflare.com/d1/platform/limits/
- D1 API: https://developers.cloudflare.com/d1/worker-api/d1-database/
- Workers Node compatibility: https://developers.cloudflare.com/workers/runtime-apis/nodejs/
- PostgreSQL JSON: https://www.postgresql.org/docs/current/datatype-json.html
