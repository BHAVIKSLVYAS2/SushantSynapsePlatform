# Code and cloud architecture review — 2026-10-11

## Conclusion and scope

Keep the modular monolith: Cloudflare serves public frontend assets and selected stateless/public-source APIs; Azure hosts the Node business API; one Azure SQL Database holds app-owned schemas. This matches the current ownership model. A frontend framework rewrite or separate service/database for every app is unnecessary.

The frontend/backend boundaries are a useful foundation, but the SQL compatibility bridge is a transitional implementation, not evidence of scalable Azure readiness. This review reads source and runs the isolated compatibility suite. It does not inspect production records, benchmark concurrency, verify Azure identity/networking, provision hosting or migrate data. Existing SQLite recovery sources and legacy records must remain intact.

## Findings, in priority order

| Priority | Evidence | Issue and recommended action |
|---|---|---|
| High | `packages/database/sqlserver.js`, `call()` | `Atomics.wait()` blocks the main Node thread for each network database operation, potentially 45 seconds. The worker moves I/O but does not free the caller. Introduce asynchronous app repositories and explicit transaction objects incrementally; benchmark mixed sign-in/read/write traffic before claiming capacity. |
| High | `packages/database/index.js`, `requestContext()`; `sqlserver-worker.js`, `begin()`; `server/index.js` | Every SQL Server `/api/` request queues locally, begins SERIALIZABLE and acquires the same exclusive application lock. Public reads, authentication and calendar requests also enter this path. Slow upstream News/Fund requests can retain the lock across awaits. Independent apps block one another and additional instances share the database bottleneck. Use short business transactions around protected reads/writes; retain payment, numbering, revision and permission correctness during the refactor. Do not simply remove the lock. |
| High | `server/index.js`, `/healthz` and catch block | Health always returns 200 without a database probe; runtime SQL failure can coexist with a healthy frontend signal. Unclassified failures default to 400 and expose raw error messages, which can also bypass the Worker's 5xx outage handling. Separate liveness/readiness, bound readiness probes, log internal failures and return generic 500/503 responses while preserving explicit validation/authentication statuses. |
| High before Azure cutover | `infrastructure/cloudflare/worker.mjs`, `wrangler.jsonc`; `server/index.js` Host/Origin checks | Worker subrequests currently retain the existing public hostname/tunnel origin. There is no Azure origin configuration in this path. Directly rewriting URLs to an Azure hostname conflicts with current API Host validation unless routing/trusted proxy handling is designed together. Retain the browser's single public origin and secure the Azure origin against bypass; verify cookies, Origin/Host enforcement, redirects, preview isolation and non-replayed writes end to end. |
| Medium | `apps/advocate/backend/store.js`, `state()`; `routes.js`, payment validation | Full state loads all record kinds and repeatedly scans hearings per case and payments per invoice. Work and payload grow with the entire workspace. Add indexed filtered/paginated repositories and database summaries, retaining server balance validation. Linear maps can reduce repeated scans as an interim step. No current latency is measured. |
| Medium | `apps/advocate/backend/routes.js`, invoice number generation | `invoice count + 1` couples numbering to retained records and has no dedicated number allocation contract. Current SQL serialization protects concurrent requests but is costly; replace it with a transaction-safe sequence/counter and explicit uniqueness before narrowing locks. Preserve historical numbers. |
| Medium | `apps/batchfee-lite/backend/routes.js`, `events().find()` | Command idempotency loads and parses the full history; the workspace is one JSON snapshot. Persist/index request IDs with uniqueness and compare command payloads through targeted queries. Keep command append and snapshot/revision update atomic. Normalize further only when measured growth warrants it. |
| Medium | `packages/database/catalog.js`, `sqlserver-dialect.js`, native SQL migrations | Runtime metadata is parsed from SQLite DDL using regex; repository SQL is translated with a bounded custom dialect, while native SQL Server DDL is separately maintained. New SQL syntax can break translation or diverge across providers. Keep SQLite schema/recovery compatibility, add explicit migration parity checks, and progressively use native parameterized SQL in app repositories rather than extending a general SQL parser. |
| Medium | `server/index.js`; `apps/advocate/backend/store.js` | Composition injects the Chambers-derived `Store` into all apps, and constructing it creates Chambers defaults/migration state. Extract platform composition from the Chambers repository over the same connection; keep shared identity/settings/audit owned by packages and business methods owned by apps. |
| Medium | `packages/auth/index.js` | Password hashing uses `scryptSync`; login failures use a process-local Map. Password verification blocks the event loop and failure budgets do not coordinate across instances. Use bounded async hashing without changing existing hash format, plus shared/edge abuse controls and tests for deployment/restart behavior. |
| Medium | Frontend `app.js` files in Chambers, DIGITAL SAMAJ and BatchFee | Large densely formatted files mix request handling, mutable state, navigation, forms, tables and exports. Chambers is about 57 KB/231 lines, Samaj 57 KB/136 lines and BatchFee 42 KB/76 lines. Split by workflow and format source; preserve theme tokens, accessibility, mobile layout and business handlers. Size alone is not a runtime defect. |
| Medium | `README.md`, `docs/ARCHITECTURE.md`, previous review documents | Current and historical paragraphs disagree about SQLite/SQL Server and Arena D1 ownership. Current Worker has no D1 binding and proxies Arena to Node; historical live-status claims require separate deployment evidence. Put the current provider/deployment contract first and explicitly label superseded history. Code default remains SQLite unless configured otherwise. |

## Duplication

- Exact source duplicate: `apps/certificates/frontend/export.js` and `apps/moment-studio/frontend/certificate-export.js`. The static allowlist serves Moment Studio for both modern and legacy URLs. Treat the old certificate tree as a compatibility cleanup candidate, after checking imports, workspace scripts and tests; preserve legacy URL aliases.
- Portal home markup exists in static `apps/portal/frontend/index.html` and `publicHome()` in `platform.js`. This supports no-JavaScript discovery but creates drift risk. Generate both from one app-owned catalogue/template at build time, or hydrate the static markup. Verify signed-out destinations and accessibility in both modes.
- Frontend JSON request/error handling is repeated in portal, support, Arena, portfolios and other apps, with differing timeout/204/error behavior. Introduce a small shared request primitive, leaving app-specific 401/navigation behavior with the app. Never auto-retry business writes.
- Blob download/object-URL lifecycle helpers repeat across certificates, Studio, portfolio exports and calendar. A small shared helper is appropriate if equivalent behavior is established; renderer/export engines remain app-owned.
- Page routes/aliases, offline-independent classifications and availability copy are maintained across the static allowlist and Worker. Generate deployment metadata from an explicit shared route manifest with reviewed backend requirements. A page loading independently does not imply its API works offline.

The file hash scan found one exact duplicate pair in the examined source trees. This is not a full semantic clone analysis. Generated bundles, vendored astronomy/QR code, translations, static guide content, tests, fixtures and release artifacts must not be classified as application complexity merely by byte size. Small app-specific validators and engines should not be merged solely because their shapes resemble one another.

## One database with schemas

The catalog already declares `platform`, `chambers`, `batchfee`, `samaj`, `tournament`, `news`, `fundlens` and `satire` in one connection/database. Keep this arrangement: schemas establish ownership, not separate database deployments or automatic authorization. Shared sessions, roles/app grants, preferences and audits remain centralized; every API must still enforce its app's access rules. Public browser tools need no new business persistence.

Use ordered immutable app-owned native migrations and a separately privileged migration identity. Runtime identity should receive only necessary operations. Do not flatten all tables into `dbo`, put every method in the Chambers store, run production with schema-owner privileges, or treat browser storage as the business database. Existing SQLite DDL and `data/records.json` remain recovery/test sources. Schema files in both shared and Chambers ownership remain preserved.

## Cloudflare + Azure deployment contract

```text
Browser -> apps.sushantsynapse.com / Cloudflare Worker + allowlisted assets
        -> same-origin /api/* -> secured Azure Node origin
                              -> one Azure SQL Database / eight app schemas
```

Azure App Service with the existing Linux Node container is a reasonable initial host. Start with one instance while the synchronous adapter/request transaction model remains. Existing container support and managed-identity configuration are useful starting points, not verified Azure deployment. Microsoft documents App Service managed identity database access: https://learn.microsoft.com/en-us/azure/app-service/tutorial-connect-msi-azure-database . Cloudflare documents origin resolution and its Host restrictions: https://developers.cloudflare.com/workers/runtime-apis/request/ . Choose routing with those constraints and the application's explicit public-origin checks in mind.

Before production cutover:

1. Establish staging Azure hosting, SQL identity grants, verified TLS and secured origin routing. Keep production preview hosts unable to write to the real database.
2. Run SQL integration in a dedicated empty staging database: accounts/hash verification, Unicode, all schemas, file byte hashes, balance rules, hearing atomicity, optimistic revisions, Arena identities and backup restoration. Standard `npm test` deliberately forces SQLite and does not establish Azure SQL compatibility.
3. Measure concurrency and failure behavior, including an upstream timeout alongside a Chambers write. Resolve transaction duration/readiness/error issues or document tested small-workspace limits before release.
4. Inventory filesystem writes such as reference caches, backup artifacts and startup/recovery state. Provide the required persistent Azure mount or suitable artifact storage; do not assume a container writable layer is durable. Keep existing private blobs in SQL initially unless a separately verified migration is justified.
5. Verify a consistent complete backup and restore. Retain original records/blobs and reconciliation evidence; freeze writes for final import and perform one-writer cutover with a rollback plan. Do not reset data to demonstrate deployment.
6. Verify frontend assets, sign-in/session revocation, private/public routes, outage screens, rate limits and theme/mobile workflows on the final route. Record Azure resource/release evidence before labeling hosting connected.

## Verification

Two fresh `npm.cmd test` runs finish with 173 passes and 11 failures out of 184. All 11 failures are Cloudflare shared setup-hook failures: EPERM unlinking `infrastructure/cloudflare/dist/ads.txt` during the export build, before assertions execute. Do not report this as a fully passing suite or as 11 confirmed application defects. The build/test harness writes into a shared fixed export directory; allow isolated temporary export output to avoid permission/collision coupling. No permission change or removal of existing export assets was attempted. The captured diagnostic log is `.code-review-tests.log` (ignored local artifact).

Source review includes composition, shared database/auth, ownership catalog/native migrations, representative app stores/routes, static allowlist, Cloudflare Worker/configuration, Docker/Compose and earlier migration/deployment reviews. No application implementation changed. Fresh isolated API compatibility suite result is recorded in the functionality ledger. SQL Server/Azure integration, browser suite and live cloud checks are outside this review's executed verification.
