# Chambers functionality ledger

Last updated: **2026-09-18**. Chambers target: **advocates and chamber staff in India**. Fund Lens provides Indian mutual fund equity comparison within the same platform.

## Resume instructions

1. Read this file, `AGENTS.md`, and `README.md` before changing the app.
2. Inspect current files. Run `npm.cmd test` for the baseline; `npm.cmd run test:e2e` verifies browser workflows when Chrome and development dependencies are available.
3. Preserve `data/chambers.sqlite`, its WAL/SHM files, and `data/records.json`. Do not reset the workspace or create demo accounts in the user's database for testing.
4. Keep the SQL schema in `apps/advocate/database/schema.sql` and `packages/database/schema.sql`. Schema and SQL exports are an explicit user requirement.
5. Continue a specific pending item or new user request. Update this ledger with implementation, test evidence and unresolved issues before ending the session.
6. The runtime server is started with `npm.cmd start` at http://localhost:3000. First-run owner setup is intentionally left for the user; no default credentials exist.

## Current checkpoint

**News GitHub push verified (2026-09-18):** `origin/main` matched `8b318a988aab165492305b70151c782fddb45677` after the authorized non-force push. This publishes the News foundation/archives and fetch-preview implementation commits. Earlier unrelated Fund Lens changes remain uncommitted locally. Production verification and provider limitations are recorded below.

**News fetch commit verification (2026-09-18):** Exact staged News-only checkout passed all 26 Node tests and all three News Chrome workflows. Full working tree previously passed 52 Node tests and 15 Chrome workflows. Fetch-preview screenshot reviewed. Final live provider retry returned 429; no provider success or generated newspaper is claimed. Push is authorized; unrelated Fund Lens working-tree changes remain excluded.

**News stage 3 deployed; provider availability pending (2026-09-18):** Added key-free GDELT source fetching, ten-story unpublished previews, SQLite reuse across reload/restart, duplicate/source diversity filtering and explicit observation-time provenance. Owner-only POST fetch validates input before external requests. Persisted leases, a one-minute global cooldown, five attempts per edition and twenty requests per UTC day bound retries; original cutoff/date survive midnight and interruption. No automatic fetch, generated briefs, satire or preview publication. **52 Node tests and all 15 Chrome workflows passed** before deployment. Production restart on 2026-09-16 followed backup `data/backups/pre-news-fetch-20260916-233954.sqlite`. Resumed verification on 2026-09-18: public home/Chambers/Fund Lens/News/health return 200, News assets match local hashes, anonymous status/archive requests return 401. SQLite integrity is `ok`; only the expected news_migrations row changed, news_fetch_budget was added, all business tables are unchanged and all News content/run/budget tables remain empty. Live provider checks returned rate limiting, timeout and invalid article lists, so real ten-story delivery is not claimed. Catalogue remains Planned. Next: verify live provider availability and implement stage 4 generation; preserve observation-time provenance rather than inventing publication dates.

**News commit verification (2026-09-16):** Exported the staged News-only snapshot into an ignored isolated checkout. Its complete 23-test Node suite and both News Chrome workflows passed independently of unrelated Fund Lens files. The deployed full working tree previously passed 49 Node tests and 14 Chrome workflows. Commit scope includes News, catalogue/route integration and required shared database schema/export support; earlier Fund Lens changes remain in the working tree. No Git push requested or performed.

**News stage 2 deployed (2026-09-16):** User-authorized production restart applied News migration 1 after consistent backup `data/backups/pre-news-archives-20260916-232213.sqlite`. SQLite integrity is `ok`; every pre-existing table's full row-content hash matches the backup. New editions/stories/runs tables are empty; no demo data created. HTTPS home, Chambers, Fund Lens, health and News return 200; News HTML/JS/CSS match workspace hashes; anonymous status/archive endpoints return 401. Prior validation: 49 Node tests and 14 Chrome workflows. News app and required shared schema/export support are being committed separately from earlier unrelated Fund Lens working-tree changes. Fetch/generation remain disabled; next is provider integration.

**News stage 2 complete locally (2026-09-16):** Added additive tracked News SQLite schema (`news_editions`, ordered `news_stories`, `news_runs`, `news_migrations`) and full SQL export registration. App repository validates dates/URLs/news-window/completeness, saves ten stories plus linked satire atomically and returns existing editions without overwriting them. Protected owner-preview list/detail APIs support date archives with 30-date pagination. Reader supports saved date URLs, date gaps, previous/next/latest among loaded dates, older archive pages, safe source links, text-only rendering, print/PDF and stale-response suppression. **49 Node tests and all 14 Chrome workflows passed** in isolated DATA_DIR values. Tests cover rollback on a mid-save database failure, duplicate immutability, migration preservation, restart, SQL restore, access denial and populated reader navigation. Desktop light/mobile dark screenshots reviewed; syntax/diff checks passed. Test editions exist only in temporary databases. No production restart or migration performed; frontend capability detection supports the deployed stage 1 backend. News remains Planned and Fetch remains disabled. Next: stage 3, free news provider integration; generation/scheduler remain pending.

**News stage 1 deployed (2026-09-16):** User-authorized owner preview is live at `https://apps.sushantsynapse.com/news`. Production Node restarted through its verified existing launcher after consistent backup `data/backups/pre-news-preview-20260916-230612.sqlite` (integrity `ok`). Public HTTPS home, Chambers, Fund Lens, health and News return 200; News HTML/JS/CSS hashes match workspace files; anonymous News status returns 401. Post-restart SQLite integrity is `ok` and full row-content hashes of every table match the backup. Prior verification remains 47 Node tests and 13 Chrome workflows; no application code changed during deployment. Catalogue remains Planned; owner preview requires existing sign-in. Fetch, stored editions and scheduling remain unimplemented. Next is stage 2, SQLite editions and archives.

**News stage 1 complete locally (2026-09-16):** Added `apps/news` with Sushant Synapse Times masthead, Bhavik byline, mobile newspaper layout, satire/archive empty states, shared light/dark/system preferences and print CSS. `/news` is an owner preview; `/api/news/status` enforces authentication, app access and owner role while the catalogue remains Planned without a launch action. Fetch/date controls are disabled; no provider, SQLite edition storage or automation is claimed. **47 Node tests and all 13 Chrome workflows passed** using isolated DATA_DIR values. News coverage includes 401/403 denial, unavailable launch/fetch routes, disabled controls, 320/390/768/1440px layout, theme persistence/system changes and print visibility. Desktop light and mobile dark screenshots reviewed; syntax and diff checks passed. No production data changes, server restart or deployment performed. Next: stage 2, SQLite editions and archive APIs. See [NEWS_APP_PLAN.md](NEWS_APP_PLAN.md) and [News README](../apps/news/README.md).

**News plan refinement (2026-09-16):** Confirmed masthead **Sushant Synapse Times** and author **Bhavik**. Initial release will use a manual Fetch button, persist each completed edition in SQLite and return stored content on repeat visits/fetches without news or AI calls. Date archives remain in scope; 05:00 IST automation moves after the manual release. Updated [NEWS_APP_PLAN.md](NEWS_APP_PLAN.md), including concurrent-fetch protection and resumable failed generation. Documentation only; no implementation or runtime changes, and tests not rerun.

**News app planning (2026-09-16):** Proposed Sushant Synapse Times at `/news`: ten stories, one labelled satire, generation starting daily at 05:00 IST and SQLite date archives. See [NEWS_APP_PLAN.md](NEWS_APP_PLAN.md) for the six sequential stages, free-provider candidates and host availability constraints. Planning/documentation only; no app code, schema, credentials, schedule or deployment changed. Provider documentation reviewed; live authenticated integration and content-use suitability not verified. Tests not rerun for this documentation-only session. Next step is stage 1 when requested.

**Fund Lens implemented and deployed (2026-09-07):** `/fund-overlap` is available in the platform catalogue with shared sign-in, themes and owner-managed access. Browser-side comparison supports 2–8 distinct schemes, weighted equity/NAV overlap, pair matrix, repeated/all-common/unique holdings, top-ten intersection, industry exposure, unique contribution, temporary exclusions, share fragments, CSV and print. The initial library contains five PPFAS equity/hybrid schemes with official **31 July 2026** snapshots. Coverage and excluded assets are explicit; no personal portfolio data is collected or saved. See `docs/FUND_OVERLAP_PLAN.md` and `apps/fund-overlap/README.md`.

**Release evidence:** 21 API/calculation tests, 5 Python ingestion tests and all 6 Chrome browser tests pass. Live source refresh returned no changes and retained the existing index. Source fixtures verify exact equity counts/weights and source-failure preservation. Browser checks include 320/768/1440px widths, shared platform launch, both weight bases, filters, simulation, sharing, CSV, print and all themes. Desktop light and mobile dark screenshots reviewed. Public HTTPS returns 200 for Fund Lens, its scripts, platform home, Chambers and health; unauthenticated fund data returns 401. A consistent pre-release SQLite backup passed integrity check; all table counts matched after deployment (18 business records, 1 account, no document blobs; other tables unchanged).

**Refresh boundary:** the scheduled GitHub Actions workflow generates a validated downloadable data artifact; its remote execution and automatic delivery to this Windows host are not verified or configured. Local `refresh:funds` works against official sources. No other AMCs, debt comparison, return/NAV performance analytics, derivative netting or personalized advice is claimed. The computer must remain running for the public deployment; Windows automatic startup remains unconfigured.

**Platform logo updated (2026-09-06):** supplied Sushant Synapse PNG artwork replaces the platform placeholder in sign-in/header branding, the home illustration, favicon, touch icon and 192/512px manifest icons. All four supplied variants are preserved byte-for-byte in apps/portal/frontend. Portal browser suite passes; desktop light and mobile dark screenshots reviewed. Chambers retains its legal app icon.

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
| P08 | apps.sushantsynapse.com deployment | Verified, local host | HTTPS home, Chambers, health and auth-status routes return 200 through Cloudflare Tunnel on 2026-09-06; runs on this Windows computer, automatic startup not configured |
| P09 | Projects, Finance and Knowledge apps | Future scope | Catalogue previews only, clearly marked Planned with no launch routes |
| P10 | Multi-tenant organisation isolation | Future scope | Current platform serves one organisation and one Chambers workspace |
| P11 | npm workspace monorepo and app ownership | Verified | apps/portal and apps/advocate own frontend/backend/tests; shared packages, split SQL, server composition, infrastructure and architecture guide; 15 API/configuration tests and 4 browser suites pass |
| P12 | Fund Lens mutual fund equity overlap analyzer | Verified / deployed | Five real PPFAS snapshots; browser comparisons, industry view, provenance, simulator and exports; app access enforced before cached responses; 21 Node tests, 5 ingestion tests, 6 browser tests |
| P13 | Fund holdings refresh | Local refresh verified; workflow supplied | Official index/XLSX adapter, ISIN and percentage validation, source hashes, immutable versions, atomic index and last-good-data retention; automatic Windows delivery remains unconfigured |

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

- 2026-09-07 — Fund Lens release: `npm.cmd test` **21 passed**; Python source-adapter suite **5 passed**; `npm.cmd run test:e2e` **6 passed (1 minute)**. The final malformed-ISIN/unlisted-section guard was followed by another passing ingestion run. Online refresh independently succeeded without fixture inputs. Screenshots: `test-results/fund-lens-mobile-dark.png`, `test-results/fund-lens-desktop-light.png`.
- 2026-09-07 — Deployed on the existing Cloudflare Tunnel after a consistent SQLite backup at `data/backups/pre-fund-lens-20260907-065652.sqlite`. HTTPS `/fund-overlap`, its JS, `/`, `/advocate`, `/healthz` return 200; anonymous `/api/fund-overlap/fund-index.json` returns 401. Local port 3000 also verified. SQLite integrity returned `ok`, and all table counts matched the pre-deployment values. No demo accounts or business records were created in the live workspace.

- 2026-09-06 — After the user added the DNS record, `https://apps.sushantsynapse.com` resolved through Cloudflare and returned HTTP 200 for `/`, `/advocate`, `/healthz` and `/api/auth/status`. Page titles identify the platform and Chambers; health is `ok`. Public deployment is live through the local tunnel. The computer and both processes must stay running; automatic startup remains unconfigured.

- 2026-09-06 — Confirmed the existing `https://sushantsynapse.com` landing page returns HTTP 200 (title: Sushant Synapse — Intelligent Solutions). `apps.sushantsynapse.com` still returns DNS name does not exist. The main domain was not changed; its working route does not establish a route for the new subdomain.

- 2026-09-06 — Local tunnel deployment prepared for `apps.sushantsynapse.com`: production app healthy on loopback port 3001 with existing SQLite data; dedicated Cloudflare tunnel connected with four connections; ingress validation passes; all 15 API/configuration tests pass. Public DNS/HTTPS remains pending domain access. An incorrectly suffixed DNS record created under the saved certificate's other zone was removed. Automatic startup awaits explicit approval after automatic review rejected scheduled-task registration. No claim of public deployment yet.

- 2026-09-06 — Local app launched from `server/index.js` using the existing workspace database. HTTP checks returned 200 for `/` and `/advocate` at port 3000. Startup required execution outside the sandbox after SQLite reported a read-only database; no application code changed and regression suites were not rerun for this launch.

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
