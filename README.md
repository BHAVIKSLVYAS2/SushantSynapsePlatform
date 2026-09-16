# Sushant Synapse Platform

## Repository structure

```text
apps/
  portal/          # Platform frontend, backend and browser tests
  advocate/        # Chambers frontend, backend, SQL and browser tests
packages/
  auth/            # Shared accounts, passwords and sessions
  app-registry/    # Available and planned apps
  database/        # Shared SQL schema and connection infrastructure
  ui/              # Shared theme preferences
server/            # Server entry point, routing and HTTP helpers
infrastructure/    # Docker, Compose and HTTPS proxy
docs/              # Architecture, deployment and functionality ledger
tests/             # Cross-app API and production tests
```

This is an npm workspace monorepo. See [code ownership and adding apps](docs/ARCHITECTURE.md). Each app owns its functionality; shared packages provide common services. All commands below run from the repository root. The apps currently share one deployment and database.


A mobile-first home for connected apps at **apps.sushantsynapse.com**. Chambers and Fund Lens are available; Projects, Finance and Knowledge are roadmap previews only.

- `/`: shared sign-in, searchable app catalogue, favourites, recent launches, profile and owner-managed team access.
- `/advocate`: the complete Chambers workspace described below, using the same account and theme.
- `/news`: owner preview of **Sushant Synapse Times**, by **Bhavik**. The layout, SQLite archives and saved-edition reader are deployed. The catalogue remains Planned and fetching is not connected yet. See the [News app status](apps/news/README.md).
- `/fund-overlap`: Fund Lens compares mutual fund equity holdings, industry exposure and unique contributions using official PPFAS disclosures. See [coverage, methodology and refresh instructions](apps/fund-overlap/README.md).
- SQLite stores accounts, app grants, preferences and Chambers records. Existing accounts receive Chambers access during migration; existing records are preserved.
- This release serves one organisation with one Chambers workspace. It does not yet provide separate customer tenants or isolated databases per app.

Run `npm.cmd start`, then open http://localhost:3000. The public platform is served through the local Windows Cloudflare Tunnel. For its operational requirements and the alternative Docker deployment, follow the [deployment guide](docs/DEPLOYMENT.md).

## Chambers advocate app
A mobile-first case and practice management application for advocates and chamber staff in India. Light, dark, and system themes. SQLite persistence, authenticated accounts, and a saved functionality ledger for continuing development.

The interface uses a consistent legal SVG icon set (scales, courthouse, advocate briefcase, gavel, certified documents and fee receipts), readable serif headings, touch-sized controls and mobile bottom-sheet forms. All icons are local assets and adapt to the selected theme.

## Start

Requires **Node.js 22.13 or newer** (tested on 22.17). The running app has no third-party dependencies.

```powershell
npm.cmd start
```

Open **http://localhost:3000**. On first use, create your owner account and chambers profile. There is no default password. Existing prototype records are migrated automatically and preserved.

`npm start` also works in shells that allow the npm script. The default server binds only to `127.0.0.1`. Mobile layouts work in any modern browser; opening the app from a physical phone requires a separately configured network deployment.

## Workflows

- **Overview:** live counts, upcoming hearings, due/overdue tasks, outstanding fees, and a recent casebook.
- **Clients:** individual/organisation profiles, contact details, linked matters and financial ledgers. Client links use IDs and survive renaming.
- **Casebook:** parties, court, judge, case number, CNR, acts/sections, opposing counsel, filing date, practice area, stage, status, assignee, and summary. Search, filters, CSV export, archive/restore, and a dossier linking all case activity.
- **Hearing diary:** month calendar, upcoming/past/all lists, hearing purpose and outcome. An outcome and next hearing save in one transaction. The next case date is derived from scheduled hearings. Calendar export uses IST and estimated one-hour event blocks.
- **Tasks:** due dates, priority, assignment, to-do/in-progress/done status, overdue and assigned-to-me filters.
- **Notes & calls:** case notes, client calls, meetings, email records, and court-order notes. These are records; the app does not send messages.
- **Documents:** upload, categorise, edit metadata, replace files, download, archive, restore. Up to 5 MB per file, stored as binary SQLite blobs behind authenticated downloads.
- **Fees & payments:** numbered professional-fee entries, partial/full payments, receipt and statement printing, void/reinstate payment, and expenses. Totals are calculated from saved payments and the server prevents overpayment. These are fee-tracking statements, not GST tax invoices.
- **Reports:** date-filtered receipts and expenses, net cash movement, current client balances, matter distribution, CSV and print output.
- **Settings:** chambers profile, account password, owner/advocate/clerk administration, backups and theme choice.
- **Activity:** the 500 most recent audit events in the app; the SQL database retains the complete log.
- **Feature ledger:** displays the repository's `docs/FUNCTIONALITY_LEDGER.md` directly in the app.

## Access roles

| Role | Practice records | Billing | Accounts, settings, backups |
|---|---|---|---|
| Owner | Read/write | Read/write | Manage |
| Advocate | Read/write | Read/write | Read profile; change own password |
| Clerk | Read/write | Read only | Read profile; change own password |

All active users can see all records in this one chambers workspace. Owners cannot deactivate or demote their own account. An owner can set a new password for a team member. Password changes invalidate that user's existing sessions. Sessions expire after 12 hours. Passwords use salted scrypt hashes, sessions use HttpOnly/SameSite cookies, and API writes enforce same-origin access, validation, and optimistic version checks.

## SQL database and recovery

- **Schema sources:** [Chambers SQL](apps/advocate/database/schema.sql) and [shared platform SQL](packages/database/schema.sql).
- **Live database:** `data/chambers.sqlite`, plus SQLite WAL/SHM files while running. These are not committed to source control.
- **Business records:** a typed records table with validated JSON payloads, indexed references and SQL views. Accounts, sessions, document blobs, audit events, and settings have separate tables. Business references are enforced by the API; SQL views support direct reporting.
- **Legacy file:** `data/records.json` is imported once. It remains unchanged as a migration source.
- **Daily snapshots:** before the first business-record write each day, a JSON snapshot is saved in `data/backups/daily-YYYY-MM-DD.json`. No retention deletion runs automatically.

In **Settings → Backups & recovery**:

1. **Download backup** creates JSON containing all business records, files, and the chambers profile. It excludes accounts and passwords.
2. **Restore a backup** validates the complete JSON before replacement. It preserves existing accounts and audit history, saves a pre-restore snapshot, and changes record versions to reject stale edits. Unknown staff assignments are cleared. Import limit: 90 MB in the interface.
3. **Download SQL database** exports a full SQL script containing schema, records, files, accounts/password hashes, profile, and audit history. Live sessions are excluded. Treat this export as private database material. It is for a **new, empty SQLite database**, not the JSON restore form.

With the SQLite CLI installed, a full SQL export can be recovered with:

```sh
sqlite3 recovered.sqlite ".read chambers-database-YYYY-MM-DD.sql"
```

Only import a trusted export: SQL scripts execute database commands. Validate the new database with `PRAGMA integrity_check;`. Stop the app before replacing its database and retain the previous database as a recovery copy. For a filesystem backup of a running app, include the WAL; prefer the app's consistent exports. The database and snapshot files are not encrypted at rest; the app does not claim hosted-production security.

Example read-only SQL reports:

```sql
SELECT title, court, status FROM cases WHERE archived = 0;
SELECT invoice_number, amount, paid, balance FROM invoice_balances;
```

## Tests

```powershell
npm.cmd test
npm.cmd ci
npm.cmd run test:e2e
```

API integration tests run with built-in Node tooling and isolated temporary databases. Browser tests use Playwright with installed Google Chrome (`channel: 'chrome'` in `playwright.config.js`). They cover mobile setup and daily workflows, desktop search/reporting/team administration, themes, layouts, printing, and recovery controls. No real workspace records are modified by tests. Screenshots and traces are written to `test-results/`.

## Project map and continuation

| File | Purpose |
|---|---|
| `docs/FUNCTIONALITY_LEDGER.md` | Implementation status, evidence, next steps and external dependencies |
| `AGENTS.md` | Rules for continuing development and preserving data |
| `server/index.js` | Server composition and routing; app handlers own business logic |
| `apps/advocate/backend/schema.js` | Shared field definitions and server validation |
| `apps/advocate/backend/store.js` | SQLite access, migration, snapshots, calculated state |
| `apps/advocate/database/schema.sql` and `packages/database/schema.sql` | Tables, indexes and reporting views |
| `apps/advocate/frontend/app.js` | UI, forms, navigation, calendar, printing and CSV/calendar exports |
| `apps/advocate/frontend/style.css` | Mobile-first layouts and theme tokens |
| `tests/` | Cross-app API and production configuration checks |
| `apps/*/tests/` | Browser workflows owned by each app |

Read the ledger first when resuming. A feature is only marked verified when the recorded test evidence supports it. `PORT` and `DATA_DIR` can override local defaults. `PORT=0` selects an available test port. Production uses `PUBLIC_ORIGIN`, secure cookies and a required `SETUP_TOKEN`; see `docs/DEPLOYMENT.md`.

## External scope

Live eCourts synchronization, automated email/SMS/WhatsApp delivery, hosted deployment, managed encrypted off-device backups, client portals, e-signatures and payment gateways are not connected. No automatic limitation-date or GST computation is performed. The web manifest provides app metadata; no service worker caches confidential records and no offline-editing capability is claimed.

Research references used for the original workflow design:

- [Official eCourts services](https://ecommitteesci.gov.in/service/ecourts-services-portal/) — CNR, case status, cause lists, orders and judgments.
- [Clio case management](https://www.clio.com/features/case-management/) — matter, task, document, client and fee workflows.
