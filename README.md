# Sushant Synapse Platform

Satire Arena's live entry is now a lightweight chooser at `/satire-arena`;
Politicians and News Anchors have separate voting routes. The chooser loads
neither voting/portrait assets nor score polling. See the functionality ledger
for verification and deployment status.

Satire Arena now has a deployed, live-verified News Anchors lineup with six
recognisable fictional spoofs, the same voting and detail pages, and navigation
across politics and television. Its framing now includes public life and pop
culture; Actors is marked Coming next. Existing political ballots are preserved.
See the [functionality ledger](docs/FUNCTIONALITY_LEDGER.md) for verification and
deployment status.

The platform's shared beta notice explains experimental/AI-assisted content and
third-party limitations, with explicit WhatsApp reporting. The English/Hindi
first-visit acknowledgement is remembered only on this browser; review/forget
controls remain available. It does not waive rights or replace licence review.
See [Beta notice details](docs/BETA_NOTICE.md) and the functionality ledger for
implementation and release status.

`/feedback` is the community ideas board: search, suggest features, vote and discuss
without signing in. Browser voting and administrator moderation use shared SQL
persistence. See [Feedback details](apps/feedback/README.md) and the functionality
ledger for current verification and deployment status.

Android APK wrapper source, build instructions, offline handling and website-versus-APK
update guidance are maintained in [apps/android-wrapper](apps/android-wrapper/README.md).

The app catalogue lists implemented tools and workspaces only.

Unified app discovery is live (2026-10-19): guests and signed-in accounts share
one catalogue and home layout, with account-specific workspace access, favourites
and recent apps. The registry generates static no-JavaScript cards and the shared
navigation bundle. Server permissions and stored preferences are preserved; see
the [functionality ledger](docs/FUNCTIONALITY_LEDGER.md) for verification.

The homepage uses one inline search followed by the Explore apps grid. Featured
apps have a small badge on their card; there is no separate Featured section.
Filters, favourites, recent apps and static no-JavaScript cards remain available.
See the functionality ledger for verification and deployment status.

Organisation/licensing is live on Cloudflare D1 (2026-10-17), with Super Admin,
Master Admin, scoped Chambers access and the minimal client portal. Existing data
was retained. See the [production cutover](docs/ORGANISATION_PRODUCTION_CUTOVER.md)
for verification and current boundaries, and the
[continuation plan](docs/ORGANISATION_LICENSING_PLAN.md) to resume implementation.

Deployed copy cleanup (2026-10-16): shorter public-tool introductions and homepage
cards, contextual help and removal of unconfigured ad previews are implemented.
Workflows, privacy facts and source labels remain; see the ledger for testing.
Source commit `5b57fcc` is live; eight production mobile pages passed read-only checks.

Deployed and live-verified loading improvements (2026-10-16): responsive News
images, duplicate stylesheet and initial-auth request removal, and anonymous-home
DOM reuse. Measurements and remaining priorities are
in `docs/PERFORMANCE_REVIEW_2026-10-16.md`.

Deployed and live-verified (2026-10-16): Confessions uses scratch-first cards
with accessible reveal, vertical phone scrolling and feed-edge handoff to the
page. The shared header displays the full Sushant Synapse Platform name,
including on mobile. See the ledger for release and verification details.

Small export credits (2026-10-16): QR PNGs, team cards/copied teams, Ritual
Assist material lists/guide shares, copied bill settlements and wheel shares
carry Sushant Synapse branding. QR codes retain their unmodified payload and
quiet zone. Paid branding removal is deferred; see the ledger for release status.

Deployed and live-verified (2026-10-16): One-Minute Chaos joins
Take a Break with a 60-second touch/keyboard chai-catching game, meeting
obstacles, alarms, calmer pace, pause and result sharing. Confessions now
uses a heart-in-a-speech-bubble icon. See the ledger for verification.

Deployed and live-verified (2026-10-16): Confessions uses compact chat bubbles and shares new
CAPTCHA-checked posts directly with everyone across browsers. Older pending
submissions stay private. Confessions, QR Maker and Photo Resize now have
relevant speech, QR and image-resize icons. Release details are in the ledger.

Confessions posting has a server-verified, single-use maths
CAPTCHA with a five-minute expiry. It needs no external widget or personal
details and keeps the existing rate limits/review flow. This protection is tested
locally and deployed with the chat refinement; see the ledger for verification.

Deployed and live-verified (2026-10-16): `/confessions` adds a shared scratch-card stream
with no name/sign-in requested, phone/mouse/tap reveals, posting, reports and
seven-day expiry. Data stays in the platform SQL database. Header/footer/desktop
ad placements and five-reveal rewarded batches are prepared but disabled pending
real unit IDs and explicit page-only ad security approval. See the functionality
ledger and `apps/confessions/README.md` for release and activation details.

Bill Splitter now opens with a simple equal split: bill amount, names and who
paid. Trips, multiple payments and unequal shares sit under More options; example
data is opt-in. This simplification is deployed and live-verified on 2026-10-16;
all existing advanced calculations remain available.

Deployed and live-verified (2026-10-16): Photo Resize target-size
presets and before/after comparisons, Wi-Fi QR codes, Team Mixer manual swaps
with undo/rule enforcement, fullscreen Decision Wheel and Focus, and News text
sizes/reader layout. Eighteen affected Chrome workflows pass. See the ledger
for verification scope and release status.

Local refinement: Bill Splitter now supports percentages, relative shares and
multi-expense trips. Ritual Assist adds browser-local quantities and arranger
names to standard/extra items, including print and text exports. These additions
are committed, deployed and live-verified on 2026-10-16, including guided Bill
Splitter stages/settlement cards and Ritual Assist compact details, filters and
checklist-only print preview. Release details are in the ledger.

New local tools are implemented at `/qr-maker`, `/photo-resize` and
`/bill-splitter`: static QR PNGs, target-size JPEGs, and equal/individual bill
settlements. All work without sign-in and process inputs on the device. Focus
adds task backup/import and removal undo; Decision Wheel adds removal undo;
Team Mixer adds previous-mix restoration and maximum team size. Ritual Assist
supports browser-local extra checklist items in print/copy/download and optional
checkmark retention. These quick wins are committed, deployed and live-verified
on 2026-10-16. Verification and release details are in the ledger.

Daily Satire includes a clearly labelled, read-only sample edition with seven
original English/Hindi examples so article/category/sharing features can be
explored while the saved editorial library is empty. It preserves the current
13-character Arena, captions and votes. See the ledger for release status.

The public homepage adds a compact illustrated welcome and a real daily Make 24
feature, with mobile stacking, English/Hindi copy and reduced-motion support.
Tool cards/search and private-workspace links remain directly accessible. This
refresh and the Lights Out replacement are deployed and live-verified on 2026-10-16;
verification and final release status are recorded in the functionality ledger.

Satire Arena 2 adds compact labelled reaction cards, shareable character pages,
an owner editorial desk at `/satire-arena/editor`, scheduled Daily Satire at
`/satire-arena/daily`, and genuine retained-ballot history at
`/satire-arena/results`. Editorial data stays in the existing SQL settings store;
no schema migration is required. Aggregate action analytics is optional and off
by default; Arena advertising remains off. The upgrade was deployed and live
verified on 2026-10-16. See [operations and limits](docs/SATIRE_ARENA_2.md) and the functionality
ledger for verification and release status.

**Focus** at `/focus` combines an adjustable timer (15/25/50-minute presets or custom 5–120 minutes) with browser-saved task cards. Drag between High/Normal/Low priorities or reorder within a group; keyboard and touch controls are also available. Estimates, completion, editing and unfinished-task carry-forward remain included. No sign-in is needed. Tasks stay in this browser profile and do not sync across devices; clearing browser data removes them. The card/timer refinements are deployed and live-verified; evidence is recorded in the functionality ledger.

The selected [free Cloudflare deployment profile](docs/CLOUDFLARE_FREE_DEPLOYMENT.md) is deployed at **https://apps.sushantsynapse.com** with existing email/password accounts, Chambers on D1, private documents up to 1 MB each / 100 MB total, and hard application limits. DIGITAL SAMAJ, BatchFee, Tournament, saved News, private Fund workflows and the ritual calendar are enabled on the same Free D1 backend. Workers Free is owner-confirmed. The cloud backend runs without the laptop. No OTP, verified email ownership or Access allow-list is required. Deployment and verification evidence are recorded in the functionality ledger.

A Cloudflare-native backend is prepared for **Workers + D1 + private R2**, with local integration tests and verified migration/recovery tooling. It uses a separate staging Worker configuration; the current production Node/SQL Server backend remains in place. Start with [the Cloudflare migration guide](docs/CLOUDFLARE_FULLSTACK.md) and `npm.cmd run test:cloudflare`.

Current URLs: certificates at `/moment-studio`, greeting/remembrance cards at `/moment-studio/cards`, and Garland or Roast at `/satire-arena`. The old `/certificates`, `/celebration-studio` and `/arena` URLs/assets are removed and live-verified as 404 on 2026-10-11. Occasion links use `/moment-studio/cards?occasion=...`. Saved favourites/history retain app-ID migration mappings.

All served apps use one persistent platform header with searchable app switching, theme and account controls. The account entry shows Sign in when signed out and up to two name initials when signed in, linking to the profile; it reads the existing session without retaining identity in browser storage. App actions and navigation sit inside that frame. Home provides uniform launcher cards, public/private access labels and app search; Chambers uses a compact practice overview. Saved light/dark/system themes remain shared, including Moment Studio. App-specific content, printable records and exported artwork retain their owning layouts.

The retained local backend uses **one SQL Server LocalDB database, `SushantSynapsePlatform`, with eight separate schemas**, including Satire Arena's `satire`. Local flow remains UI → Node API → SQL Server. Production now uses Cloudflare Workers → D1 directly, with no forwarding of private APIs to the laptop. SQL Server, SQLite recovery files and legacy JSON remain preserved; cloud writes do not synchronize back to the old source. See [SQL Server setup and recovery](docs/SQLSERVER_MIGRATION.md).

WhatsApp contact is available through `/contact`, `/support` and `/sponsor`. Submitting a form opens WhatsApp with combined details; visitors review the draft and press Send. Shared navigation and homepage links expose Support Us and Watch demos. Forms are not saved by the platform; payment settings remain separate.

Ritual Assist provides 15 bilingual guides, expanded Havan materials, Antyeshti considerations and day 10–12 checklists. Its Shraddha & Barsi Calendar requires date, IST time and Indian PIN code; stateless backend calculation returns first-year observances and the current year plus next ten years. Calendar reminders export individual resolved dates to an ICS file. A selectable bilingual preparation pack includes ceremony materials, checks, responsibilities and print/PDF or text export. Family-specific and uncertain dates require confirmation. See [scope](apps/ritual-assist/README.md).

Public [privacy/data-use information](/privacy), [usage responsibilities](/terms), [contact status](/contact) and [third-party notices](/legal/third-party-notices) are linked across every app. Operator/contact details and some rights/retention workflows remain pending; these pages do not claim legal clearance. The internal audit and source register are in `docs/COPYRIGHT_LEGAL_AUDIT_2026-10-10.md` and `docs/LEGAL_SOURCE_REGISTER.md`.

**Support Us** at `/support` offers ₹20/₹49/₹99/₹249 UPI contributions, amount-specific QR codes, external payment links, copy fallback and sponsorship. The redesign centres Buy me a coffee with Chai, Coffee, Pani puri and Pizza choices, smaller secondary links and an expandable WhatsApp form; deployed and live-verified on 2026-10-16. Signed-in owners configure verified recipient details on the page; settings persist in SQLite. Contributions default to disabled. No recipient is configured, no payment is verified. See [support setup](docs/MONETIZATION.md#voluntary-support).

**Watch demos** at `/showcase` is a promotional HTML player with eleven looping scenes, including Decision Wheel and all four private workspaces, playback controls, full-screen display mode (`?screen=1`) with no HTML download. Sample workflows are clearly labelled; no accounts or payments are created. See [player usage](apps/portal/SHOWCASE.md).

Fund Lens comparison is deployed on Cloudflare and works without the laptop backend. See [deployment status](docs/DEPLOYMENT.md).

Quiet direct sponsorships are prepared for selected public pages: one labelled, dismissible text card outside the working controls, with no popups, autoplay, advertiser scripts or tracking pixels. Private workspaces and sensitive tools remain ad-free. `/sponsor` provides the partnership information, brief and local enquiry drafts; WhatsApp enquiry contact is configured; actual paid campaigns and payments are not connected yet. See [the earning plan and publishing guide](docs/MONETIZATION.md).

**Take a Break** at `/take-a-break` brings seven activities into one mobile-friendly hub: One-Minute Chaos, Make 24 (Daily Spark), Crack the Code, Memory Minute, Lights Out, Face-Off and Decision Wheel. The Crack the Code redesign replaces the five-digit guessing game with three distinct digits and five visible clues leading to one solution, plus a scratchpad, optional starting hint and unlimited checks. Daily challenges use IST dates, with practice rounds and explicit sharing. Free, no login, no backend dependency; progress stays in the current tab. Existing `/daily-spark` and `/decision-wheel` links continue to work. The clue-led redesign was deployed and live-verified on 2026-10-16. The Lights Out replacement for Clue Club adds three solvable boards, undo and optional hints; it was deployed and live-verified on 2026-10-16.

## Repository structure

**DIGITAL SAMAJ** is the integrated family registry at `/digital-samaj`: saved registration, verified directory, Vanshavali, private profiles/photos, bilingual print/PDF, CSV/XLSX import and member messaging. It uses the existing platform login and SQLite. The platform owner creates a Samaj and grants app roles; independent reviewers approve submissions and profile claims. See [DIGITAL SAMAJ setup and boundaries](apps/digital-samaj/README.md). Deployment verification is recorded in the functionality ledger.

**Tournament Lite** is live at [apps.sushantsynapse.com/tournament-lite](https://apps.sushantsynapse.com/tournament-lite): six sports, four formats, bulk player/team entry, automatic fixtures and BYEs, scoring, standings, brackets, public sharing and downloadable winner cards. Organizers sign in with existing platform accounts; players and public viewers need no accounts. Tournament state persists in SQLite. See [Tournament Lite usage and rules](apps/tournament-lite/README.md).

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

- `/`: six no-login collections and tools (Take a Break, Team Mixer, Moment Studio, Timetable Lite, Fund Lens and News), followed by a separate sign-in section for Chambers, Tournament Lite organizing and owner-only BatchFee Lite. Tournament results are public only through an organizer-shared link. Sign-in also opens the account catalogue, favourites, recent launches, profile and owner-managed app access.
- `/advocate`: the complete Chambers workspace described below, using the same account and theme.
- `/news` (no login required): **Sushant Synapse Times**, by **Aakanksha**. Generate present or past editions with ten dated stories across available topics, including Masala entertainment, short credited excerpts and a fictional three-panel comic. Future dates are rejected. SQLite archives reopen without fetching. Historical availability depends on source coverage. See [News usage and source scope](apps/news/README.md). Automatic 05:00 publication remains deferred.
- `/fund-overlap` (no login required): Fund Lens compares mutual fund equity holdings, industry exposure and unique contributions using national MFapi discovery, a verified official-disclosure library with dated coverage reporting, and Tickertape/Groww fallback. The official library includes 592 portfolios across 22 fund houses, dated 30 September 2026; missing and unsupported holdings remain explicit. See [product contract](docs/FUND_LENS_CORE_PRODUCT.md), [release evidence](docs/FUNCTIONALITY_LEDGER.md) and [coverage and methodology](apps/fund-overlap/README.md).
- SQLite stores accounts, app grants, preferences and Chambers records. Existing accounts receive Chambers access during migration; existing records are preserved.
- Fund Lens focuses on holdings overlap, industries and what-if comparisons. Personal portfolio entry/import, watchlists and investment calculators have been removed from the interface. Existing private SQLite records remain preserved and protected.
- This release serves one organisation with one Chambers workspace. It does not yet provide separate customer tenants or isolated databases per app.

Run `npm.cmd start`, then open http://localhost:3000. The backend uses the local Windows Cloudflare Tunnel. The Cloudflare deployment runs implemented apps directly on Workers and D1 while the laptop is off. The local runtime remains available for development and recovery. Fund Lens retrieves public third-party data on Cloudflare; internet and provider availability still apply. See the [deployment guide](docs/DEPLOYMENT.md) for release status and commands.

## Chambers advocate app
A mobile-first case and practice management application for advocates and chamber staff in India. Light, dark, and system themes. SQLite persistence, authenticated accounts, and a saved functionality ledger for continuing development.

The interface uses a consistent legal SVG icon set (scales, courthouse, advocate briefcase, gavel, certified documents and fee receipts), shared sans-serif headings, touch-sized controls and mobile bottom-sheet forms. All icons are local assets and adapt to the selected theme.

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

Live eCourts synchronization, automated email/SMS/WhatsApp delivery, always-on backend hosting, managed encrypted off-device backups, client portals, e-signatures and payment gateways are not connected. The frontend is hosted on Cloudflare; database-backed apps still use the Windows tunnel backend. No automatic limitation-date or GST computation is performed. The web manifest provides app metadata; no service worker caches confidential records and no offline-editing capability is claimed.

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

## Moment Studio certificates and awards

`/moment-studio` and `/moment-studio/certificates` are public, login-free certificate editors with seven formal appreciation types and ten personal awards. Four original A4 landscape compositions are available: **Laurel** (ceremonial ivory and engraved gold), **Nocturne** (midnight gala with a large name and award medallion), **Summit** (asymmetric professional achievement) and **Jubilee** (bold creative celebration). Type changes suggest a suitable design until you select your own. Summit supports accent changes; the other three retain their authored palettes. Live/expanded previews, optional issuer logos/signatures, direct PNG/PDF/print and a tab-local group CSV/PDF ZIP workflow remain available. The form comes first on phones.

Recipient details and signatures stay in tab memory; refreshing clears them. You may explicitly save up to ten organisation names, reduced logos and logo positions in this browser, reuse/delete them and restore the last selected organisation. Saved organisations are visible to anyone using that browser profile, disappear when site data is cleared, and do not sync between devices. No certificate upload or storage endpoint exists.

Lossless PNG offers 7016 × 4961 pixels (600 DPI) or 3508 × 2480 (300 DPI), with embedded density metadata. PDF and print use 300 DPI and A4 landscape. PDF embeds a high-quality raster image; text is not selectable. Uploaded PNG/JPEG/WebP images are limited to 5 MB and 24 megapixels and resized locally to at most 1600 pixels. Printer margins and source-image quality affect physical output. References are optional, unverified identifiers. No certificate accounts, saved history, paid upgrade or delivery provider is connected. See [Moment Studio usage](apps/moment-studio/README.md) and the ledger for separate implementation/release status.

## News during backend outages

The hosted News app can prepare temporary editions on your device while the Windows backend is unavailable. Cloudflare retrieves dated source metadata, using credited BBC News feeds when Indian Express archives are unavailable. Fresh generation still requires internet access; historical coverage depends on the sources. Temporary editions remain only in the current tab (up to 30), and Print / Save PDF keeps a copy. Reload to reconnect to shared SQLite archives. See [News details](apps/news/README.md).

## Daily Spark

Public /daily-spark is a free daily make-24 puzzle: a deterministic IST challenge, practice puzzles, undo, hints, solution reveal and spoiler-free sharing. Shared date links reopen the same puzzle. Progress is transient tab memory; there are no accounts, stored scores or leaderboard. It makes no API requests and is configured for the existing Cloudflare frontend while the laptop is off; the frontend release is live at https://apps.sushantsynapse.com/daily-spark. See apps/daily-spark/README.md.

## Decision Wheel

/decision-wheel is a free, public animated picker for lunch, tasks or names. Enter 2-30 unique options, spin, remove winners for picks without repeats and explicitly share a result. Equal-choice sampling, reduced motion and up to 20 tab-only recent picks are included. No account, API or saved lists; refresh clears your choices/history. Live at https://apps.sushantsynapse.com/decision-wheel through Cloudflare; the wheel works independently of the laptop backend. See apps/decision-wheel/README.md.

## Cards in Moment Studio

`/moment-studio/cards` creates greetings, invitations and celebration cards; `?occasion=condolence` or `?occasion=remembrance` opens the memorial section. The same warm workspace presents occasion/language, relevant details, an editable message, optional photo, preview and download. Phones start with the form; optional design, colour and square/vertical size settings stay out of the ordinary creation path. Invitations expose event details; remembrance gatherings are optional. Manually edited wording survives language/occasion/design changes; explicitly replacing a message asks first. PNG/share/copy remain local, branded and validated. No external AI, account, saved card history, upload or delivery is introduced. The retired `/celebration-studio` URL is unavailable. See [Moment Studio](apps/moment-studio/README.md).

## Team Mixer

/team-mixer randomly assigns 2-100 names to 2-20 teams with sizes differing by at most one person. Animated reveal, reduced motion, PNG team-card downloads and explicit list/card sharing are included. It balances headcounts rather than skill. Names/results stay in the current tab; refresh clears custom changes. No login, API or saved teams. Cloudflare laptop-independent serving is configured; see apps/team-mixer/README.md and the functionality ledger for release status.

Team Mixer is live at https://apps.sushantsynapse.com/team-mixer (2026-10-09); production and local verification are recorded in the functionality ledger.



## Ritual Assist

The remembrance calendar now includes the next ten Barsi/Samvatsari and ten Pitru Paksha Shraddha observances from today, including for older death dates. A bilingual table shows lunar timings and confirmation conditions; downloaded/printed plans include the future dates.

The linked `/ritual-assist/calendar` adds a Hindu Panchang remembrance planner: inclusive Chautha/days 10–12 (optional 13), tithi-based Masik, Barsi and first Pitru Paksha after Barsi. Date, IST time or confirmed tithi, Indian place and lunar month/day-counting conventions are explicit. English/Hindi results download or print, with no personal-data upload. Adhik Maas and ambiguous boundaries need confirmation. This is an approximate astronomy-based planning aid, not a certified regional Panchang; see the app README for method, verified fixtures and limits.

`/ritual-assist` is a free public Hindu preparation page with 12 English/Hindi guides for Shubh ceremonies and Ashubh mourning/remembrance. Browse suggested steps, puja materials and family-custom notes; tick arranged items, download/copy a checklist, share a guide link or Print / Save PDF. Checks remain in the tab and clear on refresh. Scoped source links and questions for a priest/elder help families confirm their own practice. No muhurat calculation, funeral deadline, booking, payment or saved personal data. See [Ritual Assist](apps/ritual-assist/README.md).

## Moment Studio

Moment Studio combines certificates, personal awards, greetings, invitations, condolences and remembrance cards in one details/preview workspace. It includes four distinct certificate compositions and simple English/Hindi card starters, with local photo support and official Sushant Synapse branding on exports. Existing saved organisation branding is preserved. The current URLs are `/moment-studio` and `/moment-studio/cards`; legacy page URLs are retired. AI services, paid watermark removal and payment providers are not connected. Current implementation and production status are recorded separately in the [functionality ledger](docs/FUNCTIONALITY_LEDGER.md).

Shared footer language: `packages/ui/language.js` remembers English/Hindi in device-local `synapse-language` storage. It translates shared navigation and public homepage copy and synchronizes existing Ritual Assist/DIGITAL SAMAJ selectors. Other app bodies and user-entered artwork/records retain their existing languages; the Hindi footer states this limitation. No external translation service or business persistence is involved.

Satire Arena at `/satire-arena` (alias `/arena`) is an independent public cloud app owned by `apps/satire-arena`. Cloudflare serves its static page and app-owned edge API before any Node proxy. Dedicated D1 SQLite stores one changeable ballot per signed browser identity/character/IST day, with shared SQL totals and private export/removal. It is browser-based informal voting, not account/person verification. Existing chambers.sqlite, account authentication, Contempt Universe records and other apps are not migrated. Preview has no production database binding. See `apps/satire-arena/README.md`.
