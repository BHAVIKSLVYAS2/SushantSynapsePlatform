# One SQL database, separate app schemas

The Node backend supports SQL Server 2022+ / Azure SQL Database through `DATABASE_PROVIDER=sqlserver`. Existing SQLite mode remains the default until an explicit, verified cutover. Public routes, shared authentication and application permissions are retained. Browser-only apps do not acquire business tables. Satire Arena now uses the same connection under `satire`; its existing live D1 votes require the separate import below before routing is switched.

| Schema | Owner |
|---|---|
| platform | Shared accounts, sessions, app access, preferences, settings and platform audit |
| chambers | Advocate records, documents and reporting views |
| batchfee | Academy workspace, command history and staff |
| samaj | Communities, people, families, reviews, grants, messaging, files and events |
| tournament | Organizer-owned events and public tokens |
| news | Editions, stories, fetch leases and budgets |
| fundlens | Retained private portfolios and transactions |
| satire | All three Satire Arena ballot generations and deduplicated scoreboard view |

All eight schemas are in the database selected by `SQLSERVER_DATABASE`. Tables retain their existing app prefixes within their schema for straightforward identity/data mapping. Cross-schema foreign keys refer to platform users. App schemas define ownership and migrations; API validation and app/role/privacy enforcement still define user access. This remains one workspace, not tenant-isolated SaaS.

## Satire Arena D1 cutover

1. Run `npm.cmd run db:sqlserver:init` on the existing shared SQL target to add the new app migration. Existing app migration files have not been rewritten.
2. Pause Arena writes during the final export. Export the explicitly named D1 database into an administrator-owned SQL dump, e.g. `npx.cmd wrangler d1 export sushant-synapse-satire-arena --remote --output arena-final.sql --config infrastructure/cloudflare/wrangler.jsonc --env production`. Retain D1 and an off-device copy; no D1 deletion is part of this change.
3. Run `npm.cmd run db:sqlserver:import-arena -- --source arena-final.sql` (an Arena-only `.sqlite` snapshot also works). This importer requires empty `satire` ballot tables, preserves all three generations and identities, verifies contents, and leaves populated platform/other app tables alone. Invalid imports roll back. Import only your trusted administrative dump, not a public upload.
4. Set the Node host's `ARENA_COOKIE_SECRET` to the exact existing Cloudflare signing secret through protected environment settings. Never commit, print or rotate it during cutover; rotation prevents browsers from exporting/removing their previous ballots.
5. Start the configured SQL backend and verify current/prior counts, a retained browser identity, one vote change, private export and removal. Then change production `ARENA_STORAGE` from its safe pre-cutover value `d1` to `sqlserver`, publish that Worker and switch the origin as planned. The public page remains static on Cloudflare, while voting, scoreboard and private history then require the Node/SQL origin. Preview never proxies to production.

The D1 binding and `ARENA_STORAGE=d1` branch remain available for controlled pre-cutover releases. Once SQL accepts ballots, reconcile new SQL writes before rollback; reverting to D1 alone would lose those changes. The SQL-capable code has been deployed to the existing Node/Cloudflare host in compatibility mode. Live D1 export/import, Azure SQL activation and original signing-secret transfer have not been performed. The Worker retains its 30/minute managed IP write limit. Node additionally uses a bounded process-local 120/minute socket-IP limit (shared by requests behind a proxy); this is conservative and requires review before scaling across instances.

## Configuration and cutover

1. Provision ONE Azure SQL database, and a separate migration identity with schema-alter privileges. Keep the app identity limited to the required table reads/writes. The app reads its migration ledger at startup but does not need to create schemas during normal production startup.
2. Set `SQLSERVER_SERVER`, `SQLSERVER_DATABASE` and `SQLSERVER_AUTH=managed-identity`. Optionally set `AZURE_CLIENT_ID` for a user-assigned identity. The driver uses Azure's default credential chain; grant the identity database access and verify the host's identity/network/firewall configuration. SQL authentication is an alternative using `SQLSERVER_AUTH=sql`, `SQLSERVER_USER` and `SQLSERVER_PASSWORD` in protected environment settings. Production always uses encrypted connections and verifies the server certificate. Do not expose database credentials to browser code.
3. Run `npm run db:sqlserver:init` with migration privileges. App-owned native SQL files are under each database directory's `sqlserver/001-schema.sql`; platform migration checksums detect modifications to applied scripts. Do not regenerate an applied initial migration. Add ordered subsequent migrations for schema changes.
4. Take a consistent full SQLite snapshot and retain the original database, blobs and `records.json`. For final cutover, freeze writes on the original Node host and use its final consistent snapshot. Initialize an EMPTY SQL target and run `npm run db:sqlserver:import -- --source <snapshot.sqlite>`. Source SQLite is opened read-only under one read transaction. The importer checks integrity/foreign keys, refuses unknown tables or nonempty target tables, transfers all registered app tables/accounts/blobs and verifies counts/content hashes before committing. All foreign keys/check constraints are re-enabled and checked before commit. SQL schema-migration metadata is retained; source active sessions are deliberately not migrated, so users sign in again. Legacy migration flags, IDs, settings, grants and record insertion order are preserved. The import transaction is rolled back if verification fails.
5. Set `DATABASE_PROVIDER=sqlserver`, `SQLSERVER_AUTO_MIGRATE=0` and start `server/index.js` with the normal HTTPS `PUBLIC_ORIGIN`, protected `SETUP_TOKEN` and a writable `DATA_DIR` for non-authoritative cache/snapshot files. Verify sign-in, access, hearings, concurrent payments, private file downloads and recovery on the destination before switching the production origin.
6. Keep one active writer during cutover. Once SQL accepts writes, rollback requires reconciling the newest SQL data before restoring the old host; do not silently switch to stale SQLite. No migration command deletes or rewrites the source database/legacy file.

On Windows use `npm.cmd` in place of `npm` when needed. Provisioning, managed identity setup, Azure deployment and live-data cutover are separate from local implementation and have not been performed by this change.

## Current local deployment

Database: `.\SQLEXPRESS / SushantSynapsePlatform`, Windows integrated authentication. Eight schemas: `platform`, `chambers`, `batchfee`, `samaj`, `tournament`, `news`, `fundlens`, `satire`. Provision or verify the local structure with `powershell -ExecutionPolicy Bypass -File infrastructure/provision-local-sql.ps1`; this creates only a missing database and applies checksum-tracked migrations, preserving existing records.

Protected runtime settings live in ignored `data/local-host.json`. App database definitions remain under each app's `database/sqlserver/`; shared definitions are under `packages/database/sqlserver/`. SQL Server manages its MDF/LDF files; do not copy live database files into source control. Full native recovery exports are under `data/backups/` and must remain private.

The verified SQLite import retained 280 rows and all document/account contents; sessions expire at cutover. Satire identities and active votes restart locally under the user's authorized reset. Old D1 votes were exported privately before disconnecting its binding. Remote D1 deletion was blocked by automatic approval review; the unused resource requires manual removal. No Cloudflare proxy secret is needed: cookie signing occurs in Node. The frontend communicates exclusively through the API.

## Transaction and runtime behavior

This first implementation deliberately retains the existing synchronous repository API. The pure-JavaScript SQL Server driver runs on a dedicated worker with bounded shared-memory responses and typed parameters. Network operations still block each calling API handler; this is not a fully asynchronous repository refactor.

SQL-backed API requests are queued per Node instance and run within SERIALIZABLE transactions with a database application lock. Validation, permission checks and business writes therefore share the same transaction across instances; existing synchronous nested business callbacks join that request transaction. Responses are buffered until commit, so an unsuccessful transaction cannot return a successful payment response. This is conservative for financial correctness, but serializes even reads and can hold the lock during body parsing/provider calls. Start with one Node instance; benchmark before scaling. A later asynchronous app-owned repository conversion should narrow lock scope and separate external work from database transactions. Request bodies retain existing bounds and HTTP request timeout is 60 seconds.

The bounded SQL dialect adapter supports the existing repository query vocabulary: schema-qualified objects, positional parameters, LIMIT/TOP, rowid/explicit insertion order, conflict updates, ignore/replacement inserts and the ancestry CTE. It does not accept arbitrary SQLite extensions. Identifiers come from the registered ownership catalogue; user values remain typed driver parameters. SQL Server schemas use Unicode text, binary blobs, computed reference keys, uniqueness and foreign keys. Existing Fund Lens REAL values remain FLOAT(53) to preserve current JavaScript/SQLite double values; BatchFee paise and Chambers JSON money rules are unchanged.

App-owned documents/photos/attachments remain in their SQL tables in this change, preserving all existing upload/download behavior. Blob Storage migration is a separate feature; no Blob account or delivery integration is claimed.

## Recovery and verification

Owner full SQL export in SQL Server mode produces a native T-SQL recovery script for a NEW empty database, including accounts, all app tables, documents, migration checksums and reporting objects, but excluding live sessions. Chambers JSON backups remain Chambers-only. Local daily JSON snapshots remain unencrypted and do not substitute for managed off-device full-platform recovery. Configure Azure SQL backup/PITR policies and verify restoration before production migration.

Run `npm.cmd test` and `npm.cmd run test:e2e` for compatibility workflows. Focused ownership/dialect/configuration tests are in `tests/sqlserver.test.js`. `powershell -File infrastructure/test-sqlserver.ps1` creates a uniquely named local SQL Express test database, migrates only generated fixture data and cleans only its owned test database. It requires Windows integrated authentication, SQL Server 2022+ and ODBC Driver 18. The optional Windows runtime `msnodesqlv8` driver runs in a main-thread sidecar because native ODBC does not share the production worker lifecycle. Local Windows production uses the native ODBC sidecar; Azure production uses the pure-JavaScript driver.

Source SQLite schemas under `packages/database/schema.sql` and `apps/advocate/database/schema.sql` are retained for compatibility, source migration and existing-data preservation. They are not the Azure SQL schemas. Keep app schemas in app directories and shared storage/runtime code in packages/database.

Local Windows hosting: set SQLSERVER_LOCAL_INSTANCE=1 with SQLSERVER_AUTH=integrated and SQLSERVER_SERVER=.\SQLEXPRESS. This explicitly permits the local certificate in production; remote/Azure connections still require verified certificates. msnodesqlv8 is an optional runtime dependency. infrastructure/start-tunnel-host.ps1 reads protected data/local-host.json when present; keep that file private and outside source control.
