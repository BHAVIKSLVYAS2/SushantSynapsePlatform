# Organisation licensing production cutover

Latest Pandit Booking usability release (2026-10-30 IST): `a41b1e0` deployed as
Worker `d7173d53-9a15-4d92-8645-3c463b58f7a7` with `--keep-vars`. Role-scoped
setup guidance, visual availability/preparation editors and conditional chat
updates preserve drafts and enforce live access checks. Full checks 581/581,
Chrome 6/6 and production dry-run pass. Live Pandit/Customer setup, conditional
updates and 48 language/theme/width layouts pass; health 200, unscoped records
409, no page errors. No migration, licence/assignment or production business-data
changes. Existing test accounts and restricted-pilot boundaries are preserved.

Latest Pandit Booking language release (2026-10-30 IST): `e8b78cd` deployed as
Worker `7ddc1071-8471-430b-aa7a-f76fa33e12fc` with `--keep-vars`. Hindi/Gujarati
interface completion, preserved drafts/user content and canonical checklist input
pass 13 focused API/language, 15 export/edge and 4 Chrome workflows. Live language
pages, sixteen theme/width layouts and translation assets pass. Health 200,
unscoped records 409; no new migration, licence/assignment or booking writes.
Broad onboarding remains gated; see `PANDIT_BOOKING_PRODUCTION.md`.

Pandit Booking restricted pilot (2026-10-30 IST): commit `5352fa1` is deployed as
Worker `309b1aba-7e7d-4db3-8c64-783761decd2a`, preserving variables and bindings
with `--keep-vars`. Only additive migration 0009 was applied. Pre/post exports
restore successfully; all existing rows and organisation checksums are retained
(one additional sign-in audit entry appeared during live activity). No app licence,
assignment, organisation bootstrap, legacy mapping or customer booking was created.
Health, page/index and unscoped-record denial checks pass. The initial English
release and subsequent language completion are distinguished in the functionality
ledger. Operator activation and remaining broad-launch gates are documented in
`PANDIT_BOOKING_PRODUCTION.md`.

Latest private-app release (2026-10-29): Chambers, Tournament Lite, BatchFee Lite
and DIGITAL SAMAJ now use organisation licence/membership/assignment checks.
Additive migrations 0007/0008 and one explicit, revision-326 legacy mapping preserved
the academy's three fee events and existing community; verified revision 327.
Worker `9132b61a-23fb-4fac-8dd3-46aa787bdc17` deployed with `--keep-vars`.
560/560 full checks, 5/5 exact-bundle D1/browser and 13 live read-only checks pass.
Pre/post exports verify 76 existing tables unchanged; new recovery verifies too.
Do not rerun the mapping or roll back to unscoped APIs. Evidence and limitations
are at the top of the functionality ledger. No commit/push in this release.

Latest matching correction (2026-10-27, no commit): Worker
`6723fe3c-eb92-4612-938d-cc2ac19d8121` fixes the generic unavailable error for
recorded-minute birth pairs. Pada-only edges calculate normally; meaningful Moon
boundaries show classification-dependent score ranges and the affected person.
All nine boundary/language combinations pass live. Full checks 554/554, focused
model/Worker checks 11/11, and existing matching browser workflows passed before
release. Deployed with --keep-vars; D1, organisation mode and rate limits preserved.
Health 200, unscoped records 409; private birth processing headers retained.
No commit/push, migration, bootstrap or production business-data writes.
Evidence: `.publish/ui-ux-audit/matching-boundary-live.log` and functionality ledger.

Latest UI/UX release (2026-10-27): User requested deployment without committing.
Worker `85bb377c-53f6-43c0-bcdd-16f550234167` publishes the verified working tree
with `--keep-vars`; HEAD remains `c17f185` and no commit/push was made. Shared
task/native-name discovery, Matching explanation/disclosure/focus improvements,
narrow Timetable steps and Arena shared materials are live. Six HTTP checks and
five read-only browser flows passed. Health 200; unscoped records 409; matching
privacy headers retained. D1, organisation mode, rate limits and variables were
preserved. No migration, bootstrap, account change or business-data write.
Evidence: `.publish/ui-ux-audit/deploy-production.log` and
`live-verification-final.log`. Full audit and local verification are recorded in
`docs/UI_UX_REVIEW_2026-10-27.md` and the functionality ledger.

Latest everyday Kundli release (2026-10-25): Worker
76651b55-6e09-41ca-88ca-f972935bf07c. Reading-first en/hi/gu life topics and
computed Dasha-period themes precede grouped charts/timing/advanced tools. Native
menus, human-readable review, keyboard focus and compact saved-input library
refine the mobile flow. Interpretations are labelled traditional/editorial;
numeric kernels, saved-input schema and APIs are unchanged. Four model checks,
26 browser workflows, 20 production-export checks and 2 live checks pass.
Deployment preserved variables/D1/organisation bindings with --keep-vars.
Health 200; unscoped records 409. No schema or production record changes.

Latest compact launcher release (2026-10-25): Worker
17621f48-e12f-4324-bb00-dfa7fcc5579f. Public/workspace cards share a compact
88px icon/name presentation with 3/4/5/6 responsive columns. Existing metadata,
ordering, access enforcement, routes, header and dock remain. Live verification
passed across 320/360/390/430/600/768/900/1024px, light/dark, shared languages,
search and app launch. Deployed with --keep-vars and preserved organisation/D1
bindings. Health 200; unscoped records 409. No schema or production data writes.

Latest RITVAYAM browser-saved inputs release (2026-10-25): Worker
b9652d40-1890-41af-aa10-2804b1d7f992. Explicit Save Kundli retains validated
birth inputs and optional name in browser storage only; reports are recalculated.
Kundli birthplace is one searchable city/state combobox. All 19 exported-page
checks and live Gujarati save/reload/reopen/recalculate/delete pass, without
birth-data API requests. Deployed with --keep-vars and preserved D1/organisation
bindings. Health 200, unscoped records 409; no schema or production data writes.

Latest RITVAYAM mobile date/time release (2026-10-25): Worker
1f4c6450-934d-4338-ba44-02401b1473dc. Shared direct day/month/year and
12-hour AM/PM controls now serve Kundli, matching and Time Machine. Deployed
with --keep-vars, preserving organisation/D1 bindings. Live mobile Gujarati,
distinct-record swap/clear and exploration action synchronization passed.
Health remains 200; unscoped /api/records remains 409. No production data writes.

Latest RITVAYAM/global interface release (2026-10-25): main implementation
da601fb, signed-out home coverage 451abdd and production organisation-gate
follow-up c41ba11. Final Worker 6f6bbfdf-53f6-44c7-88ba-3f81ed436898 deployed
with --keep-vars. Astrology branding/home mark and gochar-8 familiar readings are
live. One shared English/Hindi/Gujarati menu, 1,000 authored interface entries,
retained preference precedence, all-header script delivery and Gujarati calendar
replace the earlier partial implementation. The beta modal hosts the same menu.
Private records, outputs, source articles and uncatalogued legal/domain prose are
not claimed automatically translated. No translation service or birth submission.
Production-only Chambers organisation entry is translated and verified through
an isolated organisation-mode fixture (1/1), preserving account input.
Focused Node 26/26, final Vedic export Chrome 18/18, platform Chrome 21/21 and
public-tool workflows 10/10 pass; targeted follow-ups include data preservation,
Gujarati calendar and the real organisation gate. Initial live release passed
5 reading scenarios and 2 cross-tab/input scenarios. Final live navigation audit
passes all 28 routes plus reload/Back/stale-link checks (1 cumulative scenario).
Healthz, Chambers and Rashifal pages 200; unscoped /api/records 409. Vedic privacy
headers, production variables, organisation mode, D1 and rate limits preserved;
no migrations or production business-data writes. Evidence: functionality ledger,
docs/INTERFACE_LANGUAGE_AUDIT.md and .publish/ritvayam-final-navigation-live.

Latest everyday Rashifal release (2026-10-25): implementation 29c8455, Worker
4b4188f7-99b9-4bcb-a6a1-933c5e646ab5 deployed with --keep-vars. Gochar-7 adds
the user's twelve light/dark sign illustrations and plain-language house-theme
suggestions in en/hi/gu. Technical evidence remains in one expandable section.
Suggestions are original editorial interpretation, not validated personal
life-event predictions. Numerical engine and shared settings unchanged.
Focused Node 14/14, final outlook recheck 3/3, preview scenarios 5/5 and final
production-export Chrome 18/18 pass. Focused live Chrome 5/5 passes; healthz/page
and sampled theme illustrations return 200, with correct image/webp type.
Private-page CSP/no-referrer retained; unscoped /api/records 409. Production
variables, organisation mode, D1 and rate limits preserved; no migrations or
business-data writes. Scope: docs/vedic/RASHIFAL_EVERYDAY_UX.md. Evidence:
.publish/rashifal-everyday-live.

Latest shared settings release (2026-10-25): implementation 0d854d1, Worker
446a7be4-105c-4f3e-863b-3b12c32877a4 deployed with --keep-vars. The existing
shared header owns interface language and theme globally. Generic language
adapters replace Vedic's separate menu/preference observers; legacy preferences
migrate, cross-tab changes synchronize and birth inputs survive translation.
Unsupported translations retain the preferred language with an English fallback.
Portal's redundant theme startup/media writes are removed. Readable Rashifal
predictions and calculations remain. Shared platform Chrome 7/7, Vedic export
Chrome 16/16, migration 1/1 and focused Node 9/9 pass. Live Vedic Chrome 17/17
and cross-app/tab settings 1/1 pass. Healthz/page 200; private-page CSP and
no-referrer retained; unscoped /api/records 409. Existing production variables,
organisation mode, D1 and rate limits preserved; no migrations or business writes.
Evidence: .publish/global-settings-live-vedic and
.publish/global-settings-live-cross-app.

Latest Rashifal timing release (2026-10-25): implementation 1f86c5e, Worker
c2577285-ce70-4113-9bfb-a99830bf81bb, deployed with --keep-vars. Gochar-5 adds
calculated IST sign/screen-edge changes with per-Rashi before/after rules and
blockers. Browser Worker keeps the UI responsive; blocked Workers use the same
private local calculation. Root convergence is not certified physical accuracy;
disputed rules and unresolved contacts remain explicit. Contract:
docs/vedic/TRANSIT_TIMELINE.md. Focused Node 26/26, local Chrome 5/5, final
production-export Chrome 15/15 and live Chrome 15/15 pass. Healthz/page/worker
200; privacy headers retained; unscoped /api/records 409. Existing production
variables, organisation mode, D1 and rate limits preserved; no migrations or
business-data writes. Evidence: functionality ledger and
.publish/rashifal-timeline-live.

Latest Vedic reading/header release (2026-10-25): implementation b7adca9,
Worker 1bfc1d22-e30f-4bed-ae21-1e51dd507c1c deployed with --keep-vars. All four
screens use the shared platform header and one settings menu/control per type.
Rashifal gochar-4 replaces duplicated topic text with a calculated summary and
nine unique graha observations. Numerical engine and private tab-only processing
remain; shared chrome skips account/visitor requests on these pages.
Focused Node 21/21, local reading Chrome 5/5, existing shared header Chrome 6/6,
final production-export Chrome 13/13 and live Chrome 13/13 pass. Healthz/pages
200; unscoped /api/records 409. Existing variables, organisation mode, D1 and rate
limits preserved; no migrations/business writes. Evidence: functionality ledger
and .publish/vedic-unified-live. Exact change timing and independent traditional,
astronomy/source and translation acceptance remain pending.

Latest homepage update (2026-10-25): f7452fd removes the duplicate small
Rashifal tile while preserving its calculated full-width card and app access.
Worker 1f361d63-8c91-4853-8766-9b3ec1b1bcf9 deployed with --keep-vars;
organisation mode, existing variables and D1 bindings preserved. Catalogue
checks 3/3, homepage Chrome 6/6, production-export Chrome 2/2 and live Chrome
2/2 pass. No migrations or business-data writes. Vedic content/calculation audit:
docs/vedic/CALCULATION_AND_CONTENT_AUDIT.md; its fix sequence remains proposed.

Latest Rashifal calculation release (2026-10-25): implementation bf0dd07, Worker
b99e74dc-db70-481d-b5cf-967c8746e1cc, deployed with --keep-vars. Replaces four
generic groups with nine-graha, three-hourly Moon-sign house/Vedha calculations.
All twelve signs are live-tested; Chrome 6/6 and health/privacy/private-API checks
pass. Full Node/API regression 536/536; 17 local/production browser scenarios pass.
Unresolved rules are withheld and independent traditional/translation acceptance
remains pending. Source/sampling limits: docs/vedic/RASHIFAL_CALCULATION.md.
Existing production variables, organisation mode, D1/rate limits retained; no
migrations, business writes or new birth storage. Evidence:
.publish/rashifal-calculation-live and the functionality ledger.

Latest homepage release (2026-10-25): implementation e01b344, Worker
8b0c67f7-f075-4561-9e04-4895015b15a0. Rashifal & Kundli calendar feature replaces
the redundant Daily Satire teaser; legacy daily URLs redirect to the Arena entry.
Final live Chrome 2/2 and HTTP 6/6 pass, including calendar/fallback/navigation,
health, sitemap cleanup and unscoped private-API denial. Variables, organisation
mode, D1 and rate limits retained with --keep-vars; no migrations/business writes.
Calendar convention, privacy and preserved editorial scope: docs/vedic/HOME_CALENDAR.md.

Latest Rashifal UX release (2026-10-25): implementation fd4dafa, Worker
43dc1af9-cafd-4438-9131-66874a8d127b, deployed with --keep-vars. Final live
Chrome 5/5 passes, covering the four Vedic screens and Rashifal mobile languages,
themes, layouts and privacy. Health/page 200 and unscoped /api/records 409.
Production variables, D1/organisation bindings and rate limits preserved; no
migrations or business writes. Competitive review and bounded design decisions:
docs/vedic/RASHIFAL_UX_RESEARCH.md. Full verification is in the functionality ledger.

Rashifal UI release (2026-10-25): commit 93222c8, Worker
ab72a6b9-dbcd-4fde-b063-02bb303b3a00, deployed at the user's request and live
read-only Chrome smoke 1/1 passed. Existing production variables, organisation
mode, rate limits and D1 bindings retained with --keep-vars; no migrations or
business writes. Subsequent research-led UX verification/release is tracked in
FUNCTIONALITY_LEDGER.md and docs/vedic/RASHIFAL_UX_RESEARCH.md.

Latest production release (2026-10-25): public Vedic verification preview,
implementation 46c81a6 plus no-transform privacy correction 420572b, Worker
0ad599ab-aaa6-4ff4-8a71-a5c15bfa8e70. User explicitly authorised production testing.
One catalogue card and four browser-only screens are live at /rashifal-kundli.
Final live browser 4/4 and settled HTTP 28/28 pass; no hosting beacon injection,
protected API boundary retained and assets match the build. Existing variables,
organisation mode, D1 bindings and rate limits preserved. No migrations, bootstrap
or business-data writes. Source/traditional/editorial acceptance remains open.
Evidence and continuation: docs/vedic/PROGRESS.md. Previous releases below are
historical; their Vedic-404 status is superseded by this authorised preview.

Latest production release (2026-10-25): Vedic internal implementation and Ritual
shared-engine integration commit b933ef2, Worker
fff881cb-1375-41d7-b769-abd63726751f. Organisation-enabled production dry run and
deployment passed with --keep-vars. Live home/health/Ritual return 200; engine
bytes match the build, unscoped records remain 409 and Vedic remains 404.
No migrations, bootstrap or business-data writes. Vedic public availability
remains blocked by source/review/hosting acceptance and missing public integration.
Evidence: .publish/vedic-production-deploy.log and vedic-production-live.json.
Earlier releases below are historical.

Live on 2026-10-17 at `https://apps.sushantsynapse.com`.
Current production release (2026-10-19): Tournament organisation integration
`e461ec3`, initially Worker `2a26cf1a-9fb2-4207-8d94-66a46348f1d4`. Scoped
Tournament APIs, account launch, licences and staff assignments are live. D1
migration 0006 and a guarded, offline-verified patch preserve four tournaments
and restore their existing organiser to the current organisation. The four
ownership links are additive; original event bytes, accounts and Chambers data
compare exactly before/after. No legacy Chambers mapping or bootstrap repeated.
Full checks pass 360/360, 25 browser regressions plus final focused checks pass;
live guest/fixture browser checks and private recovery verification are recorded
in the functionality ledger. Existing production variables/bindings preserved.
Setup: `docs/TOURNAMENT_ORGANISATION_SETUP.md`. Invitation/hierarchy redesign is
deferred. Final documentation republish identifier is recorded in
`.publish/tournament-documentation-deploy.log`.
Current production release (2026-10-19): beta notice implementation `57fdffc`,
initially Worker `084a3680-7727-4cb4-b41b-d5073a9a5f37`, with a shared footer
note, first-visit English/Hindi acknowledgement and explicit WhatsApp reporting.
Acknowledgement is a browser preference, not an authority/consent audit or legal
waiver. Full API/build checks pass 359/359; 62 browser workflows are covered
across runs/reruns. Live read-only checks pass six fresh-entry routes, 20 pages,
160 layouts, asset parity, readable legal/no-JavaScript pages and protected APIs,
without page errors or business writes. Existing D1/auth bindings, organisation
mode, variables and rate limits retained; no migrations, recovery operations or
APK changes. Evidence: `.publish/beta-production-deploy.log`,
`.publish/beta-live.json` and the functionality ledger. This documentation is
included in a follow-up republish of the same implementation; the final runtime
identifier is recorded in `.publish/beta-documentation-deploy.log`.
Prior production release (2026-10-19): loading improvements through `decfd31`,
initially deployed as Worker `d3b6cdd9-281a-46d8-bf3c-dfc14f117013`. Public
asset dependency fingerprints, app-specific premium CSS, export minification and
retired News/artwork cleanup are live. All 358 API/build checks and 51 browser
workflows covered across runs/reruns; live read-only verification passes 20 pages,
160 responsive layouts, 86 asset matches, cache reuse, module execution and
private/hidden boundaries, without page errors or production browser writes.
Existing D1/auth bindings, variables, organisation mode and rate limits retained;
no migrations or business-data changes. Release documentation is included in a
follow-up republish of the same implementation. Final runtime identifier is
recorded in `.publish/loading-documentation-deploy.log`; initial deployment and
live evidence are `.publish/loading-production-deploy.log` and
`.publish/loading-live.json`. See the functionality ledger.
Prior production Worker: `edfd733f-decb-497d-ba3a-44ee039791f2` (2026-10-19),
republishing committed Feedback source/documentation `b97d0b3` at the user's
request. Variables, D1 binding, organisation mode and rate limits preserved;
no migrations or stored-data changes. See the functionality ledger and
`.publish/feedback-latest-deploy.log`.
Prior production Worker: `03da1fe6-ee86-4ad3-9fe0-82c0a7368813` (2026-10-19),
from public Feedback `c1615d7`, pushed to main. Public search, browser votes,
requests/comments and administrator moderation use existing D1 settings;
organisation mode requires current platform Super Admin for moderation. No schema
migration or private business-data changes. All 356 API checks covered across
runs/rerun, 3 Feedback Chrome and 11 shared catalogue/shell Chrome checks pass.
Live read-only checks pass page/API/cookie/navigation, eight responsive theme
layouts and private/hidden API boundaries, without page errors or live writes.
Production variables/bindings preserved. See functionality ledger for evidence.
Prior production Worker: `3dea7884-350e-4178-be4c-479ab7344291` (2026-10-19),
from Android download fix and verification `63a41ab`, pushed to main. Updated
ledger published; native download correction ships separately in signed APK
1.0.1/code 2. Real certificate logo/signature uploads and PDF/PNG bridge exports
pass live read-only Chrome verification with no page errors. All 349 API and
eleven Studio workflows covered across runs/reruns, plus isolated wrapper workflow,
bridge and 26 Java policy checks. No Android device/emulator available; native
picker/Save as and installation remain unverified. Production bindings/variables
preserved; no migrations or stored-data writes. See functionality ledger.
Prior production Worker: `e8d4e107-d65f-4758-a577-3836bb9bc470` (2026-10-19),
from wrapper source/review `221b8e2`; updated ledger published and read-only
availability/access checks passed. APK remained separate from website deployment.
Prior production Worker: `da790fe8-2d64-43cd-a1e1-d74f93ad4940` (2026-10-19),
from heading wording `0ccf0cf`, pushed to main. Static/dynamic “Explore apps”
heading and versioned discovery/language assets verified live in HTTP/Chrome,
with no browser errors or forwarded writes. Production variables and bindings
preserved; no migration or stored-data changes. See the functionality ledger.
Prior production Worker: `5d87a97e-4c2f-41a4-b7aa-e6eacd2af446` (2026-10-19),
from catalogue cleanup `0ee925c`, pushed to GitHub main. Unimplemented Projects,
Finance and Knowledge placeholders removed. All 349 Node/API checks and fourteen
portal Chrome workflows pass across runs/reruns. Live read-only asset/catalogue/
finder checks and eight responsive theme layouts pass without browser errors.
Production variables and D1/auth bindings retained; no migration or data changes.
Evidence: `.publish/catalogue-cleanup-live.json` and the functionality ledger.
Prior production Worker: `296a2388-796f-4043-b83f-32305a98bec0` (2026-10-19),
from shared browser helpers `b5f93c8`, including static caching `4b76320`.
Shared download/ZIP/CRC32/HTML escaping preserves app-specific timing, ZIP flags
and scoped access behavior. Full Node/API checks pass 349/349, selected Chrome
workflows 18/18, plus 28 production-style local layouts. Live read-only checks
pass eight helper asset matches, sixteen responsive layouts, shared module
execution, immutable asset headers, uncached private/API/error responses and
Chambers bootstrap ordering, with no browser errors or missing versioned assets.
Visitor write attempts are blocked; no production account was used. Existing
D1/auth bindings and variables retained; no migration or stored-data changes.
Evidence: `.publish/shared-helpers-live.json` and the functionality ledger.
Prior production Worker: `deafd24e-522f-4d8a-9fd2-e5740334a9e1` (2026-10-19),
from homepage CSS/duplicate-helper cleanup `de4cb81`. Home CSS is 12.60% smaller
before compression. Live read-only checks pass five asset matches, fourteen
public cards, eight theme/width layouts, simulated account navigation and public
cross-app navigation with no browser errors or attempted preference/launch writes.
Account/Chambers entry pages respond successfully. Production bindings/variables
preserved; no database migration or account/data changes. Evidence:
`.publish/css-cleanup-live.json` and the functionality ledger.
Prior production Worker: `75ad93ab-a3aa-4320-aeb8-899f9a6a1a84` (2026-10-19),
from Pocket Pause removal `5b42252`. App code, tests, package, static routes and
discovery links removed; Take a Break retains seven activities. Live read-only
checks confirm six retired URLs return 404, updated home/hub/Focus/showcase and
no page errors. Production bindings/variables retained; no migration or account
data changes. See the ledger for local verification and historical boundaries.
Prior production Worker: `bd1e2fed-1ab6-4786-afb2-a94f052bb8a9` (2026-10-19),
from Arena portrait crop correction `40dddcf`. Four five-row character sheets
now show one portrait in default and reaction states. All thirteen profiles pass
104 local theme/width layouts plus 26 live layouts and deployed CSS parity.
Focused API checks pass 16/16. Production bindings and variables retained;
no migration or stored data changes.
Prior production Worker: `98fd8b58-65ed-4d5e-8539-58080b91bf8e` (2026-10-19),
from unified app discovery `5f045e3`. Guests and signed-in accounts share one
registry, card renderer and home/search/navigation catalogue. Account capabilities
and server permissions remain separate; existing favourites/history are preserved.
Portal/navigation/performance browser checks pass 28/28, supplementary catalogue
checks 4/4. Live read-only checks confirm fourteen guest cards, matching simulated
account cards through intercepted GET responses, eight responsive theme layouts,
three asset matches and cross-app navigation, without page errors or writes.
No production account was used for this check. D1/auth bindings and variables
retained, no data migration. Evidence: `.publish/unified-live.json`.
Prior production Worker: `3d854686-6eae-40f5-8971-272840e0aa18` (2026-10-18),
from character detail pages `e64db20`. All thirteen profiles are live with
biographies, signature lines, existing editorial overrides and annual reactions.
Focused API/editorial tests pass 16/16 and browser editorial workflows 6/6.
Live read-only checks pass all thirteen canonical pages, two asset matches and
104 responsive light/dark layouts with no page errors or vote writes. Annual
reset remains 1 January 2027 at 00:00 IST. D1/auth bindings and variables retained;
no migration or stored record changes. Evidence: `.publish/character-live.json`.
Prior production Worker: `7af0cd10-bc25-4469-89bf-a062224eb08a`,
from annual Arena voting `62e1d11`. Resets occur only on 1 January at 00:00 IST;
legacy daily records are retained and latest yearly choices counted once per
browser/character. API/editorial tests pass 16/16 and browser workflows 24/24
across the main run and corrected assertion rerun. Live read-only checks confirm
the next reset (1 January 2027 IST), thirteen characters, eight responsive theme
layouts, no page errors and no vote writes. D1/auth bindings and variables retained.
Prior production Worker: `1ee88a67-edb8-4dcc-973e-016e4e6b28d3`,
from news-only Newsroom removal `78e8288`. All 11 isolated News browser workflows
pass; read-only live mobile checks show ten stories without chai-break satire,
comic controls, comic requests or page errors. Historical payloads are retained.
Prior production Worker: `2306a539-b078-4811-ad96-cc9ff8cc1226`,
from Newsroom topic correction `a1497d0`, including redesign `dab4bbc` and typography
`433d0af`. Prior Newsroom Worker: `6f302969-d1fd-4701-9def-9ca374c119a5`.
The compact source-credited feed and edition search are live. Wheel release `da9fc3d`
is included; its Worker was `d861d9fc-5303-4d99-b537-7a8d200e067f`.
Playful Arena source `1efe455` is included; its prior Worker was
`d339655d-0737-48b4-83ba-7ac4b88fb631`.
Homepage footer source `b107547` is included; prior Worker
`6715853d-f1d4-4754-b377-7947f169368a` consolidated that footer and visitor count.
Arena/theme source `62c9c6f` is included. Organisation/D1/auth bindings are preserved.
Prior Arena startup Worker: `5608233f-22d5-43b5-834a-aadbc49d0f35`;
committed-source republish: `f8c5684e-9d22-4710-8e67-bbea9b13e170`.
Prior Arena mobile/sound Worker: `2d0e4bf5-bb05-4d2c-a71d-26c0b4ee5bbf`.
Prior performance Worker: `3e2f2830-a42d-4a0e-adc9-cc7672c5eda3`,
from performance release `536b143` plus loading-meter correction `e883c29`.
This frontend release preserves the organisation/D1 cutover and bindings; see
`PERFORMANCE_REVIEW_2026-10-18.md` for live verification and remaining targets.
The verified organisation-source republish was Worker
`71146d50-e086-48d3-b29d-87c72bf193f6`, implementation `dcb843b`.
The original cutover Worker was
`24ee36a4-2ce2-4f9c-be2c-6c25c95ada0a`; subsequent source reconciliation preserved
its data and runtime behaviour. Fresh 339/339 checks and live verification passed.

## Current state

- `/account`, `/admin`, `/super-admin`, organisation/platform audit and the minimal
  client portal now run on Cloudflare Workers/D1. `/signin` opens My account.
- `superadmin@sushantsynapse.com` is the explicitly selected Super Admin. Its
  credential is salted/hashed; the supplied temporary password is not recorded here.
  Change it through My account. Its global compatibility role is Clerk and it has
  no Chambers assignment or organisation membership.
- The existing single active Chambers Owner remains the primary Master Admin of
  the retained workspace. All four existing memberships/app roles were preserved.
- All twenty existing records are retained and explicitly owned by that workspace.
  No reset was required. There are five accounts in total after adding Super Admin.
- The retained workspace preserves its existing Chambers access with a perpetual
  Active licence, 25 staff seats and no client portal seats. Newly provisioned
  organisations receive the limits and validity dates selected by Super Admin.
- Other private applications are unavailable in organisation mode until they have
  their own tenant integration. Public applications remain separate and available.
- Browser SQL export, scoped backup/restore and snapshot screens are unavailable
  on D1. Use the verified offline D1 recovery tool; no overwrite/import web route
  was added. Additional client hearings/files/finances remain unreleased.

## Implementation boundary

`packages/database/organisation-repository-d1.mjs` and
`organisation-administration-d1.mjs` implement asynchronous governance services
using the same policy and immutable schema as native SQLite. The existing staged
SQL adapter accepts an explicit table catalog. Organisation writes retain order,
read their staged changes, and flush once through the shared D1 revision guard.
Foreign keys are deferred within that atomic batch. Validation or stale revisions
leave no partial identity, membership, licence or audit changes.

`apps/advocate/backend/organisation-edge.mjs` derives the app role from live org
membership, assignment and licence. Its repository scopes records, staff, profile,
activity and file ownership. The existing business engine still validates money,
references and atomic hearing updates. Super Admin governance does not bypass
those business access checks. Legacy/global private APIs are denied in org mode.

The production configuration enables `ORGANISATIONS_ENABLED=true`; this is separate
from the guarded temporary Node preview flag. Organisation assets are packaged
behind the flag and their internal storage URLs return 404. All admin reads use
no-store responses. Distributed administration limits are separate from login.

## Cutover and recovery evidence

The user explicitly approved the full sensitive production export to the ignored
local path `.publish/organisation-precutover-20261017.sql` after automatic approval
review required specific destination/payload approval. It was verified offline:
54 table digests, no documents present, and no sessions in the recovery output.
The recovery tool now also preserves organisation schema/checksums, authorities,
licences, memberships, ownership, client grants and audit when those tables exist.

The offline planner and `prepare-organisation-cutover.cjs` require an unmigrated
recovery copy, an explicit retained Owner (or explicit selection of the sole Owner),
and credentials through stdin. They refuse account/patch overwrite, retain existing
credentials, and verify the patch on a second restored database. The private SQL
patch contains only a salted hash, not the supplied raw password.

The maintenance Worker paused writes. Production revision 72 matched the snapshot;
additive migration `0005-organisations.sql` and the prepared mapping were applied.
Verification found five users, twenty records/ownership entries, one Super Admin,
one org and four memberships/assignments; no foreign-key errors; revision 73.
Maintenance was then removed. One final publish hit a transient network failure;
the same tested release was retried successfully. No data was deleted.

Private recovery artifacts and logs stay ignored under `.publish/`; none are in
the frontend asset allowlist. This is a locally verified recovery copy, not a claim
of configured encrypted/off-device backup, retention or recovery-time guarantees.

## Verification

- 339/339 clean full Node/API checks, including synthetic D1/Chrome workflows.
- Exact Wrangler bundle D1/Chrome acceptance passed before cutover.
- Offline cutover/recovery/credential-safe patch tests passed.
- Live Super Admin sign-in, governance/audit, own-account navigation, legacy and
  Chambers access denials, internal-asset 404 and cross-origin rejection passed.
- Live public home and health check passed; 320/390/768/1440px light/dark layouts
  passed with no page errors. Live verification created no business records.

Evidence: `.publish/organisation-production-tests-clean.log`,
`.publish/organisation-release-bundle-tests.log`,
`.publish/organisation-cutover-final.log`,
`.publish/organisation-production-cutover-verification.json`,
`.publish/organisation-production-deploy-retry.log`,
`.publish/organisation-live-verification.json`.

Committed-source republish evidence: `.publish/organisation-commit-tests.log`,
`.publish/organisation-source-deploy.log`, `.publish/organisation-source-live-check.log`.

## Further releases

Do not roll back to the global single-workspace API after additional organisations
start creating records: it would expose tenant data. Any post-activation rollback
must retain tenant-aware routing or remain in maintenance. Keep the current D1
binding, migration history and recovery artifacts. Extend recovery verification
for later schema changes; do not infer that SQL Server is tenant-ready from this
D1 deployment. Other private app adapters, client expansion and scoped D1 recovery
screens remain separate increments.
