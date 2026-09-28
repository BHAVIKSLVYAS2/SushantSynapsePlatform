# Sushant Synapse Platform

## Repository structure

**Tournament Lite** is available locally at `/tournament-lite`: six sports, four formats, bulk player/team entry, automatic fixtures and BYEs, scoring, standings, brackets, public sharing and downloadable winner cards. Organizers sign in with existing platform accounts; players and public viewers need no accounts. Tournament state persists in SQLite. See [Tournament Lite usage and rules](apps/tournament-lite/README.md).

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


A mobile-first home for connected apps at **apps.sushantsynapse.com**. Chambers, Fund Lens and News are available; Projects, Finance and Knowledge are roadmap previews only.

- `/`: public Fund Lens and News launch cards, with optional sign-in for the searchable account catalogue, favourites, recent launches, profile and owner-managed team access.
- `/advocate`: the complete Chambers workspace described below, using the same account and theme.
- `/news` (no login required): **Sushant Synapse Times**, by **Bhavik**. Shared daily newspaper generated on request by any visitor with ten recent India public-affairs releases, credited excerpts, fictional satire and SQLite date archives. Saved editions reopen without fetching. See [News usage and source scope](apps/news/README.md). Automatic 05:00 publication remains deferred.
- `/fund-overlap` (no login required): Fund Lens compares mutual fund equity holdings, industry exposure and unique contributions using national MFapi discovery, Tickertape/Groww holdings and official PPFAS reference snapshots. See [coverage, methodology and refresh instructions](apps/fund-overlap/README.md).
- SQLite stores accounts, app grants, preferences and Chambers records. Existing accounts receive Chambers access during migration; existing records are preserved.
- Fund Lens focuses on holdings overlap, industries and what-if comparisons. Personal portfolio entry/import, watchlists and investment calculators have been removed from the interface. Existing private SQLite records remain preserved and protected.
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

## BatchFee Lite

`/batchfee-lite` is a private, mobile-first tuition/coaching fee tracker for the platform owner. Set up an academy, create batches and students, track recurring fees, record partial/advance payments, print receipts, prepare WhatsApp drafts, review family dues, track expenses and export simple reports. Student CSV imports and validated, history-preserving backups are included. Shared authentication and SQLite persistence protect records; leaving students retain their financial history.

Monthly/quarterly fees catch up on opening the app; per-class/custom fees are entered manually. Joining months are charged in full. New batch enrolments on an existing student and frequency changes take effect next month. WhatsApp opens drafts for manual sending, PDF output uses browser print, and Excel import uses UTF-8 CSV. Optional staff access, offline editing, online collections and automated delivery are not enabled. See [BatchFee Lite rules and usage](apps/batchfee-lite/README.md). [Open BatchFee Lite](https://apps.sushantsynapse.com/batchfee-lite); sign in with the platform owner account.

## Timetable Lite

`/timetable-lite` is a public weekly timetable planner for schools and coaching institutes. Configure working days, periods and breaks, classes, subjects, teacher availability and weekly allocations. Generation checks teacher/class clashes, weekly totals, daily limits and consecutive lessons. Class views support validated moves, swaps and undo; teacher and master views show the wider schedule.

Timetable Lite uses device-local browser storage, explicitly approved for this app. Export JSON backups to retain a copy; clearing browser storage removes the saved setup. Imports are validated before replacement. There is no account sync or timetable backend, and Chambers continues to use SQLite. PDF, PNG, multi-image ZIP and print exports support class and teacher schedules. Holidays annotate recurring lessons rather than rescheduling them. Bounded generation can reach its search limit without proving that a schedule is impossible.

Run `npx.cmd playwright test apps/timetable-lite/tests` for its browser workflows; solver checks are included in `npm.cmd test`.

Open **Help, browser storage & sample document** in the timetable app for setup instructions, a downloadable text guide and a downloadable, importable sample JSON containing two classes and 20 generated lessons. Sample downloads leave your current work untouched. Saved classes, periods, breaks and all setup/timetable data survive reload in the same browser profile/site; unsubmitted forms, view selections and undo history do not. Setup changes clear generated lessons for regeneration. Browser cleanup can remove local data, so keep JSON backups. Use one editing tab at a time: separate tabs do not merge changes.

## Appreciation Certificate Generator

`/certificates` is a public, login-free app with seven distinct formal appreciation types and ten lighthearted personal awards. Seven designs include Classic, Minimal, Community, Aurora, Confetti, Sweetheart and Comic. Fun awards suggest matching designs until you choose your own. Formal designs offer five accents; playful designs use dedicated palettes. Live preview, optional logos/signatures and local A4 landscape PDF/PNG/print output are available. Recipient details and signatures stay in tab memory; refreshing clears them. You can explicitly save up to 10 organisation names, logos and logo positions in this browser, reuse or delete them, and restore the last selected organisation on reload. Clearing browser site data removes saved organisations; they are visible to anyone using that browser profile and do not sync between devices. Theme preference also uses local storage. No certificate upload or storage endpoint exists.

Lossless PNG defaults to 7016 × 4961 pixels (600 DPI), with a smaller 3508 × 2480 (300 DPI) option; both embed print-density metadata. PDF and print use 300 DPI. PDF embeds a high-quality raster image to preserve the browser-rendered fonts and layout; its text is not selectable. Print uses A4 landscape with zero CSS margins; printer hardware margins and print-dialog settings can affect physical output. Uploaded PNG/JPEG/WebP images are limited to 5 MB and 24 megapixels, then resized locally to at most 1600 pixels. Uploaded-image sharpness depends on source quality; saved organisation logos are smaller copies. References are optional, unverified identifiers. No accounts, history, bulk tools, verification, premium upgrades or delivery integrations are implemented.
