# Chambers functionality ledger

Last updated: **2026-09-06**. Target: **advocates and chamber staff in India**.

## Resume instructions

1. Read this file, `AGENTS.md`, and `README.md` before changing the app.
2. Inspect current files. Run `npm.cmd test` for the baseline; `npm.cmd run test:e2e` verifies browser workflows when Chrome and development dependencies are available.
3. Preserve `data/chambers.sqlite`, its WAL/SHM files, and `data/records.json`. Do not reset the workspace or create demo accounts in the user's database for testing.
4. Keep the SQL schema in `apps/advocate/database/schema.sql` and `packages/database/schema.sql`. Schema and SQL exports are an explicit user requirement.
5. Continue a specific pending item or new user request. Update this ledger with implementation, test evidence and unresolved issues before ending the session.
6. The runtime server is started with `npm.cmd start` at http://localhost:3000. First-run owner setup is intentionally left for the user; no default credentials exist.

## Current checkpoint

**Monorepo reorganisation verified (2026-09-06):** app frontends, backend handlers and browser tests now live under `apps/portal` and `apps/advocate`. Shared auth, database, catalogue and theme storage live under `packages/`. SQL ownership is split without changing stored tables or data. Infrastructure and documentation have dedicated folders. All 15 API/configuration tests and all 4 browser suites pass. App-specific test commands discover the expected suites. Repository: BHAVIKSLVYAS2/SushantSynapsePlatform, branch main. The local server runs from server/index.js; deployment remains pending.

**Platform expansion verified (2026-09-06).** Sushant Synapse Platform lives at `/`; Chambers lives at `/advocate`. Shared sign-in/profile, app catalogue, search, favourites, recent launches, themes and owner-managed access are implemented. Existing SQLite records are preserved. Published to `BHAVIKSLVYAS2/SushantSynapsePlatform` on `main` (implementation commit `6c01f96`). HTTPS hosting and DNS have not been deployed.

| ID | Platform functionality | Status | Evidence / boundary |
|---|---|---|---|
| P01 | Mobile-first platform home and app catalogue | Verified | Browser search, 320/768/1440px overflow checks, mobile dark and desktop light screenshots reviewed |
| P02 | Shared authentication, profile and theme | Verified | Setup/login, Chambers launch without another login, profile update, persisted themes; account-switch regression fixed |
| P03 | Favourites and recent apps in SQL | Verified | API and browser save/list/launch; SQL export includes preferences and app grants |
| P04 | Owner-managed team and app access | Verified | Staff grant/revoke and direct API/file denial; owner-only administration |
| P05 | Chambers app and existing data migration | Verified | 13 API tests and 3 existing Chambers browser suites pass; platform browser suite also passes |
| P06 | Production configuration | Configuration tested | Additional production test passes: public origin, setup token, Secure cookie; Docker/Caddy files provided, containers not run locally |
| P07 | GitHub repository publication | Verified | Pushed main to BHAVIKSLVYAS2/SushantSynapsePlatform; databases, secrets and local test artifacts excluded |
| P08 | apps.sushantsynapse.com deployment | External dependency | Follow DEPLOYMENT.md; needs host, DNS and deployment secret; public URL not verified |
| P09 | Projects, Finance and Knowledge apps | Future scope | Catalogue previews only, clearly marked Planned with no launch routes |
| P10 | Multi-tenant organisation isolation | Future scope | Current platform serves one organisation and one Chambers workspace |
| P11 | npm workspace monorepo and app ownership | Verified | apps/portal and apps/advocate own frontend/backend/tests; shared packages, split SQL, server composition, infrastructure and architecture guide; 15 API/configuration tests and 4 browser suites pass |

Latest platform evidence: **14 API/configuration tests passed across the API and production runs; all 4 browser suites passed after fixes.** Historical checkpoints below describe the earlier Chambers release.

**UI refinement complete (2026-09-06):** legal SVG icons, scales branding, clearer mobile typography, touch controls and bottom-sheet forms are implemented and visually reviewed. All 12 API tests and all 3 browser suites pass. Reopened dialogs reset to the top; a browser assertion guards the mobile menu's initial position.

**Local application scope implemented and verified.** The upgraded server is running, and the original 4 cases, 4 clients, 3 tasks and 2 fee records were preserved. Four hearings represent the original diary plus migrated case dates. The legacy paid invoice became one payment record. SQLite `PRAGMA integrity_check` returned `ok`. The user has not yet created the owner account in the actual workspace.

Latest verification: **12 API integration tests passed; 3 Chrome browser suites passed.** No known failing tests. Screenshots were inspected for desktop light and mobile dark themes. Mobile light is also captured. The narrow-layout test detected and resolved a 320px header overflow. Modal controls now have explicit accessible labels.

For the earlier Chambers release, local implementation was complete. Further work should follow the user's next requested feature or the explicitly separated external scope below. Do not represent external integrations as operational.

## Status definitions

- **Verified**: implemented with relevant API/browser evidence listed below; not a claim that every possible input has been tested.
- **External dependency**: needs a provider, account, hosting or deployment choice; not connected.
- **Future scope**: a separate product extension outside the implemented single-chambers app.

## Functionality status

| ID | Functionality | Status | Evidence / practical boundary |
|---|---|---|---|
| F01 | Mobile-first navigation, cards, forms and dialogs | Verified | Chrome workflows at 390px/1440px; all main pages checked for overflow at 320px/768px |
| F02 | Light, dark and system themes | Verified | Stored theme survives reload; emulated system preference changes update the theme |
| F03 | Owner setup, login, logout and password changes | Verified | Scrypt passwords, HttpOnly sessions, setup lock, session revocation and login tests |
| F04 | Owner / Advocate / Clerk staff management | Verified | Clerk financial-write denial, owner self-protection, deactivation/revocation; staff creation in browser |
| F05 | SQLite database and legacy migration | Verified | Runtime uses SQLite; legacy IDs, documents, payments and dates preserved; restart tests |
| F06 | Client profiles, stable links and financial detail | Verified | Browser client creation; rename/reference tests; case and fee links use client IDs |
| F07 | Casebook, CNR, parties, courts, stages, assignments | Verified | Case creation and dossier in browser; CNR uniqueness, invalid references/dates/stages, conflict tests |
| F08 | Hearing calendar, outcomes, adjournment and next date | Verified | Outcome + next hearing atomic; failed next-date validation rolls back; browser adjournment workflow |
| F09 | Tasks, deadlines, assignment and completion | Verified | API/browser create and complete; overdue/Mine filters and in-app reminders implemented |
| F10 | Notes and communication history | Verified | Browser create/read/archive/restore; API note CRUD; records only, no outbound messaging |
| F11 | Documents, categories, file replacement and download | Verified | Binary SQLite file table; exact authenticated download test; browser upload/download; 5 MB limit |
| F12 | Invoices, partial/full payments, void/reinstate | Verified | Server balances, no overpayment, no invoice reduction below payments; browser partial payment |
| F13 | Expenses and client financial ledgers | Verified | Expense API/browser entry; case/client financial views; income less expenses report |
| F14 | Overview, global search and case filters | Verified | Browser search by CNR and global search; statistics calculated from saved state |
| F15 | Reports, CSV, fee statement and receipt printing | Verified | Browser CSV download and print statement content; date filters and receipt print implemented |
| F16 | Chambers profile and account settings | Verified | Saved settings endpoint and profile form; team settings browser workflow; password-change API tests |
| F17 | Audit activity | Verified | Actor/action/time recorded for mutations and auth/export events; restore event checked; latest 500 shown |
| F18 | JSON backup, validated restore and snapshots | Verified | Invalid restore preserves state; file/account preservation; browser JSON restore; daily and pre-restore files |
| F19 | Archive and restore | Verified | Browser note archive/restore; payments void/reinstate API; linked history retained |
| F20 | Persistent ledger and continuation instructions | Verified | This file plus AGENTS.md; ledger API and app page; browser confirms ledger content |
| F21 | API regression suite | Verified | `npm.cmd test` — 12 passing tests using isolated databases |
| F22 | Real-browser workflows and responsive verification | Verified | `npm.cmd run test:e2e` — 3 passing suites; no page errors in primary mobile/desktop flows |
| F23 | Versioned SQL schema and full SQL export | Verified | `apps/advocate/database/schema.sql` and `packages/database/schema.sql`; owner SQL download; import into empty SQLite restores records/accounts/files/views; integrity check passes |
| F24 | Calendar file export | Verified | Browser download verifies IST-to-UTC start time and valid UTC timestamp; one-hour duration is an estimate, not a court-supplied duration |
| F25 | Legal visual identity and refined mobile UI | Verified | Scales/courthouse/briefcase/gavel/certified-document icons; readable type, mobile bottom sheets, accessible theme picker and touch navigation; screenshots reviewed and 3 browser suites pass |

## External integrations and future scope

| ID | Functionality | Status | Required next step |
|---|---|---|---|
| X01 | Live eCourts synchronization | External dependency | Choose and verify a court-data provider/access route; official eCourts link and manual tracking currently work |
| X02 | Email, SMS and WhatsApp delivery | External dependency | Choose provider and message authorization rules; in-app reminders and communication records work |
| X03 | Hosted access from phones / multiple computers | External dependency | Choose hosting, HTTPS and network/access requirements; server currently permits localhost only |
| X04 | Encrypted off-device backups and retention | External dependency | Choose storage/key management and retention; current snapshots are local and unencrypted |
| X05 | Client portal | Future scope | Separate client identities, permissions and document-sharing model |
| X06 | E-signatures and payment gateway | External dependency | Choose providers; current receipts/payment records are manually maintained |
| X07 | Multi-tenant SaaS | Future scope | Tenant isolation and operational model; current app is one chambers workspace |
| X08 | Offline editing and background push notifications | Future scope | Synchronization/conflict strategy; no service worker caches confidential data |
| X09 | Automated tax / limitation-period calculation | Future scope | Explicit jurisdictional/rule validation; no such automated claims are made |

## Verification log

- 2026-09-06 — UI refinement: **12 API tests passed; 3 browser suites passed (40.3 seconds)**. Screens cover 320px/390px/768px/1440px layouts, both themes and system preference. Inspected setup, hearing form and legal-icon navigation screenshots. Fixed retained dialog scroll and verified Overview is in the viewport whenever the menu reopens.

- 2026-09-06 — `npm.cmd test`: **12 passed**. Covers setup/auth, role restrictions, conflict detection, dates/CNR, stable links, hearing transactions, notes/tasks/expenses, payment integrity, exact file bytes, backup restore, SQL import/export, legacy migration and process restart.
- 2026-09-06 — `npm.cmd run test:e2e`: **3 passed** (31.4 seconds on latest run). Chrome at 390px and 1440px for daily workflows; 320px and 768px overflow checks across all main pages; system theme, notes archive, expense entry, print content, backup recovery and calendar export.
- 2026-09-06 — SQL export loaded into a new in-memory SQLite database. Account/record/file counts and invoice balances match; sessions absent; `integrity_check = ok`.
- 2026-09-06 — Actual migrated workspace: 4 cases, 4 clients, 4 hearings, 3 tasks, 2 invoices, 1 payment; `integrity_check = ok`; owner setup still required.
- Screenshots: `test-results/mobile-dark.png`, `test-results/mobile-light.png`, `test-results/desktop-light.png`. Test output is ignored by source control and regenerated on subsequent browser runs.
- Additional UI screenshots: `test-results/mobile-setup.png`, `test-results/mobile-hearing-form.png`, `test-results/mobile-navigation.png`.

## Architecture and recovery notes

- Runtime: Node 22.13+, built-in HTTP/crypto/SQLite. Playwright is development-only. Node 22.17 emits the SQLite experimental-feature warning.
- `server/index.js`: routing and composition; `packages/auth`: shared identity; app `backend/routes.js`: business handlers.
- `apps/advocate/backend/schema.js`: shared form metadata and validation; `apps/advocate/backend/store.js`: persistence, migration and derived state.
- `apps/advocate/database/schema.sql` and `packages/database/schema.sql`: versioned SQL tables, indexes and reporting views. Business records have validated JSON payloads inside SQL; business references are API-enforced. Sessions have a SQL foreign key.
- `apps/advocate/frontend/app.js` / `apps/advocate/frontend/style.css`: UI and themes. No external font/network dependency.
- JSON backups omit user credentials and retain existing users on restore. Full SQL exports include account password hashes and audit history, omit sessions, and must be imported into a new database. See README recovery instructions.
- Concurrent editors must reload stale records. Backups change record versions so stale browser forms cannot overwrite restored records.
- Archived parents retain linked history. New records cannot be linked to archived parents. Cases with linked invoices cannot be reassigned to another client.
- Every active staff member can read every record in the chambers. Clerk billing is read-only; this is not per-case access control.
- Account recovery: a different active owner can reset a team member's password. There is no email-based password recovery or default owner password.
- Snapshot retention is manual. Import limit is 90 MB in the browser. The application loads metadata into memory; very large practices will need paging and storage/backup scaling.
- Git CLI was unavailable in this environment; no commit or repository status claim is made.
