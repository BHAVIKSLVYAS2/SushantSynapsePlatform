# Code ownership and adding apps

Private organisation apps (2026-10-29): all four catalogue-private apps use the
Workers/D1 organisation boundary. BatchFee's organisation-edge.mjs owns scoped
academy/events, app roles and recovery. Samaj's organisation-edge.mjs maps each
community to an organisation and checks platform authority before delegating to
its existing privacy/grant/file/messaging handlers. Its user choices are limited
to active assigned members of that organisation. Additive app schemas feed D1
migrations 0007/0008; organisation-recovery.cjs registers their recovery extensions.
private-apps-cutover.cjs is an offline, explicit one-time legacy mapping tool.
Default Node mode retains its existing independent single-workspace behaviour.

Frontend delivery (2026-10-28, local measured pass): Vedic build.cjs owns the
ordered stylesheetFiles list and application.css. Edit the original app/shared
CSS; generated outputs include all input CSS plus scope-filter source in their
cache signature. Only positively different app scopes are removed. Bundle and
final delivery transforms emit UTF-8. build-catalogue pre-renders the existing
discovery toolbar; home-discovery hydrates it with a legacy-markup fallback.
Place-name search builds its normalized index on first lookup; getPlace stays
synchronous and unchanged. Almanac render keys must include date, place, language,
reference-city state and active interval; preserve rollover/city/language tests.
Measurement method, limits and verification: FRONTEND_PERFORMANCE_AUDIT_2026-10-28.md.

Recorded-minute matching correction (2026-10-27): packages/vedic/matching-screen.mjs
screens only the Rashi/Nakshatra factors used by the eight rules. Pada-only edges
do not block matching. Relevant edges return bounded classification possibilities
within the existing proposed angular margin, nullable changing scores and explicit
ranges; they are not certified physical/statistical bounds. The app renders the
affected person, ranges and possible factors in en/hi/gu. Exact-time, consent and
privacy gates remain. This supersedes historical whole-comparison boundary denial;
see docs/vedic/P15_EVIDENCE.md. Do not invent a single total from per-factor ranges.

UI review follow-up (2026-10-27): app-registry's appSearchText owns the shared
launcher/switcher search vocabulary, including featured Ritvayam and native names.
Rebuild navigation through build-catalogue/build-home; edit source modules rather
than generated shell/language bundles. Matching's app-owned matching-summary.mjs
and rulebook-view.mjs own presentation, disclosure and focus; numerical/admission
rules remain in packages/vedic. infrastructure/ui-ux-audit.cjs uses disposable
local fixtures; ui-ux-report.cjs builds private local evidence under .publish.
Scope, competitor sources and remaining work: UI_UX_REVIEW_2026-10-27.md.

Curio and astrology usability (2026-10-26): Curio is the platform's displayed
name/PWA title; manifest ID/routes and Sushant Synapse organisation branding stay
unchanged. Kundali, matching and Time Machine reuse birthplace-input.mjs with
optional app-specific labels; the hidden select remains the canonical place ID.
Respect these components' custom validity in language-shell.mjs. Always validate
segmented date/time before review; never accept an invalid date or guess a city.
Matching retains consent, exact-time/boundary admission and private in-memory
records. Time Machine explains its three-step flow and shows a human-readable
sky summary before optional calculation tables; it is not an event forecast.

Native reading prose (2026-10-26): kundli-reading-prose.mjs owns complete,
versioned en/hi/gu sentences shared by the view and whitelisted report export.
No raw report or birth identity belongs in the everyday prose projection.

Daily local timings (2026-10-25): packages/vedic/daily-almanac.mjs calculates
Sun/Moon civil-day upper-limb events with the pinned Astronomy Engine and the
existing UTC/TT inversion. Day/night Choghadiya use actual local solar boundaries,
published weekday sequences and half-open intervals. The app-owned reusable
daily-almanac-view.mjs serves home and Rashifal; daily-almanac.css uses shared
tokens. The existing global language control owns en/hi/gu. A selected Indian
city ID alone is stored under ritvayam.almanac-city.v1; no birth data, geolocation,
API or schema change. Default New Delhi is explicitly labelled a reference city.

Everyday Kundli (2026-10-25): app-owned kundli-reading.mjs projects admitted
report facts into a versioned interpretation model; kundli-reading-copy.mjs owns
original en/hi/gu copy and kundli-reading-view.mjs renders it. No numerical kernel,
API, account state or saved-profile schema change. Plain-language topics precede
native chart/timing/advanced disclosures, with independently withheld features,
traceable house/ruler evidence and computed Dasha boundaries. Never represent
editorial meanings as astronomical facts or guaranteed future events. Market
review, rule contract, limits and verification: docs/vedic/KUNDLI_EVERYDAY_UX.md.

Compact launcher (2026-10-25): packages/app-registry/index.js owns
renderCompactCard for public/workspace cards. build-catalogue.cjs generates
static cards and the browser registry bundle; build-home.cjs generates home CSS.
Keep metadata, featured ordering, filters and server-owned access authoritative.
Use existing SVG artwork and theme tokens. App introductions were restored at the
user's request: cards are now 140px high in 3/4 columns, with names limited to
two lines and introductions to three. Prefer homeDescription, falling back to
description/subtitle; use the shared language runtime for localized introductions.
Signed-in Edit favourites uses full-card selection targets, keeping normal
launch cards free of overlapping secondary targets. Business/API logic is unchanged.

RITVAYAM saved birth inputs (2026-10-25): at the user's explicit request,
saved-kundli.mjs owns an opt-in browser-local list under ritvayam.saved-kundli.v1.
Persist only validated birth inputs and optional name, never calculated reports.
Reopening fills the form for fresh review/calculation; Clear form clears only
the draft, Delete removes the saved profile. Malformed/denied storage fails
without overwriting it or blocking calculations. Other platform persistence,
authentication and SQLite/D1 ownership are unchanged. birthplace-input.mjs
combines Kundli place search and explicit city/state selection into one accessible
combobox, retaining the place-ID calculation contract and no network lookup.

RITVAYAM/global language follow-up (2026-10-25): edit language-runtime.js and
interface-copy.mjs; language.js is their generated delivery bundle, built through
build-home.cjs. legalHtml ensures every shared-header page loads it exactly once.
Saved preferences take priority over stale link defaults. The same three-language
menu is temporarily hosted in a blocking beta modal and restored on close.
Generic catalogued UI translation explicitly excludes app-owned Vedic results,
user content and outputs. New user-content renderers must use
data-language-preserve/translate=no; dynamic option lists are not translated by
default. Existing data, routes, app IDs, auth and persistence remain unchanged.
Audit/scope: docs/INTERFACE_LANGUAGE_AUDIT.md.

Everyday Rashifal (2026-10-25): app-owned rashifal-everyday.mjs selects original
editorial house themes from computed Moon observations, retaining multiple themes
or withholding specific advice when appropriate. Numerical engine remains in
packages/vedic. Technical evidence is disclosed below the main practical reading.
Supplied sign artwork is app-owned and explicitly public-allowlisted; it uses the
existing shared resolved theme, language and accessible sign selection controls.

Global settings (2026-10-25): packages/ui/language.js owns the one shared header
menu, canonical preference, tab synchronization, migration and legacy bridges.
Apps register SynapseLanguage.register({languages,controls,apply,legacyKeys});
apply only translates app-owned presentation. The shared service hides/synchronizes
registered native selectors, including dynamically mounted components. It keeps
a preferred language when an app must fall back to English. Vedic no longer
constructs a menu or installs preference/observer handlers. Shared SynapseTheme
alone owns resolution/persistence; portal no longer writes its own startup/media
theme state, and app theme widgets are hidden when shared chrome is present.

Readable Rashifal (2026-10-25): app-owned rashifal-outlook.mjs projects calculated
Moon classifications, physical-graha context and unambiguous timing into en/hi/gu
editorial guidance. The private result retains a factor/event trace. The primary
outlook card precedes all calculations; the existing numerical engine and Worker
remain the source of results. No new domain scores, API, persistence or classical
life-event rules. Scope and validation: docs/vedic/READABLE_OUTLOOK.md.

Rashifal timeline (2026-10-25): packages/vedic owns bounded angular root search,
station splitting, sign/screen-edge events and per-Rashi before/after rule
composition. The app owns the localized timeline and private calculation Worker;
generic cached sky events are separate from the sampled summary. Public assets
explicitly allowlist the bundled worker; stale results are ignored after edits or
clear. Shared header, privacy policy and persistence are unchanged. Numerical
search/physical accuracy limits: docs/vedic/TRANSIT_TIMELINE.md.

Vedic reading/shell integration (2026-10-25): production entries mount the
app-owned components directly, then bridge the en/hi/gu selector into the shared
platform shell. The shared synapse-language preference replaces the isolated
Vedic preference, with a fallback for previous selections. Nested language
selectors are hidden, including views mounted after calculation; only the shared
header exposes theme controls. App navigation remains app-owned with current-page
state. The shared shell recognises data-platform-privacy=local-only: account
status fetching and visitor-module loading are skipped, preserving Vedic pages'
connect-src 'none' and browser-only birth processing. Other pages retain existing
account/visitor behavior. No birth request/API or persistence is introduced.
Rashifal rule version rashifal-gochar-4 retains the numeric transit engine and
uses a calculated summary plus nine unique planetary observations; unsupported
editorial career/money/relationship/wellbeing sections are removed.

Calculation-backed Rashifal (2026-10-25) supersedes P12's four-group compositor.
packages/vedic/rashifal-transits.mjs owns nine-graha three-hourly IST samples,
Moon-sign house counting, explicit Phaladeepika 26 favourable/Vedha rules and
boundary/unresolved statuses. The app service owns bounded sky/reading caches;
the app library/view own en/hi/gu evidence text, topic navigation and observation
table. No scores, personal birth predictions, new API or persistence are inferred.
Source decisions and remaining acceptance limits: docs/vedic/RASHIFAL_CALCULATION.md.

Homepage calendar feature: portal-owned home-vedic.js lazily loads the app-owned
bundled Rashifal home-calendar.mjs near its viewport, reusing existing Panchang,
Amanta and localisation kernels. It is a geocentric instant with explicit
Chaitra-year Vikram/Amanta labels, not a location's sunrise or certified festival
calendar. The portal owns markup/style; public-assets.cjs explicitly allowlists
the bundle. No calendar API, birth persistence or shared-state replacement.
Daily Satire's duplicated collection landing/home observer is removed; legacy
daily URLs redirect to the Arena chooser. Saved editorial, category/article and
character/voting surfaces retain their original owners.

Vedic language presentation (2026-10-25): app-owned language-shell initialises the
production header after the established page entry mounts. Existing component
catalogues own translated UI; display-text/diagnostic-text/place-text format
domain terms, warnings and sourced aliases without mutating calculations. Only
language preference persists; birth input remains in memory. The shell hides
independent embedded selectors in production while local harnesses retain them.
Rashifal authored translations display as explicit drafts under editorial rule v2.
See docs/vedic/LANGUAGE_SUPPORT.md; source/review acceptance remains separate.

Vedic production verification preview (2026-10-25): user authorised public testing.
App-owned build.cjs bundles the established UI entries into ignored frontend
outputs; public-assets.cjs explicitly maps the four screens and required assets.
The shared frontend build generates them; Node serves prepared outputs and returns
503 for missing preview builds without compiling at startup. App-owned privacy.cjs applies the
same page policy in Node and both Cloudflare page handlers. No birth API/database
is introduced, no ad/availability scripts are injected into these pages, and
source/editorial/general-release gates remain open. See docs/vedic/PRODUCTION_PREVIEW.md.
Earlier local-only architecture checkpoints below are historical.

Vedic P17: Ritual imports the canonical pinned MIT engine through its legacy
compatibility module. The existing public Ritual engine URL serves that exact
source through the unchanged delivery transform; other Vedic assets remain
private/unmapped. Ritual calendar/profile policies are unchanged. packages/vedic
owns explicit profile-compatibility diagnostics and immutable release readiness;
the app owns parameter-free/no-referrer guide navigation. Preview headers are
hardened; no Vedic birth API, public route/card, storage or deployment is added.
Evidence and blockers: docs/vedic/P17_EVIDENCE.md.

Vedic P16: packages/vedic owns separate advanced-vargas, raw ashtakavarga,
Uccha-only strength and strict birth-advanced composition. App-owned advanced
view/CSS reuse the numeric chart adapter/renderer for D7/D10/D12. Old D1/D9 math
and exports are unchanged. Candidate calculation remains explicit and memory-only
in the local birth preview, with independent per-feature withholding. Complete
Shadbala is unavailable; no production mapping or new dependency. Evidence:
docs/vedic/P16_EVIDENCE.md.

Vedic P15: packages/vedic owns versioned rulebooks, pure matching/geometric
predicates and strict consent-gated birth bridges. App-owned rulebook-view/CSS
provide a separate memory-only dual-input preview (4181) and single-birth
geometric panel. No production routes, persistence or new dependencies. Rulebooks
remain internal drafts; final Yoga/Dosha assessment and marriage verdicts are
withheld. Source variants and validation: docs/vedic/P15_EVIDENCE.md.

Vedic P14 adds pure interval-sectors/sensitivity/birth-sensitivity under
packages/vedic and an app-owned sensitivity view/CSS/cancellable browser Worker.
The local birth preview serves fixed worker assets; no production mapping added.
Whole-interval candidate envelopes expose feature-specific uncertainty without
unlocking precise interval charts/Dasha. See docs/vedic/P14_EVIDENCE.md.

Vedic P13 (2026-10-24, internal Time Machine/Gochar): packages/vedic owns strict
exploration-place admission/snapshot, pure gochar sign-count/endpoint definitions
and separate birth-gochar admission. Future exploration cannot weaken birth rules.
App-owned exploration-report/time-machine-view compose optional references and
en/hi/gu memory-only UI. The component embeds below birth results, before the
P10 print/export child, and has a standalone loopback preview on port 4180.
No continuous transit/prediction rules, storage, public mapping, auth/schema or
Ritual Assist change. Package/lock 0.13.0; existing kernels unchanged. Evidence:
docs/vedic/P13_EVIDENCE.md.

Vedic P12 (2026-10-24, internal editorial draft): packages/vedic/rashifal-factors.mjs
owns IST day/Monday-week selection and nominal noon Moon factors. App-owned
rashifal-library/service/view own versioned original prompts, deterministic
selection, bounded generic caches, translation review/fallback and opt-in sign
preference. No birth-form/report or place-directory dependency. Separate loopback
preview defaults to 4179; public registry/static mappings remain unchanged.
Package/lock 0.12.0; no existing math, auth/schema or Ritual Assist changes.
Independent editorial/native-translation/source gates remain open. Evidence:
docs/vedic/P12_EVIDENCE.md.

Vedic P11 (2026-10-24, internal candidates): packages/vedic owns birth Panchang,
bounded lunar phase/Amanta month search and a separate pure sunrise-selection
rule. birth-observance.mjs composes private birth validation and offline places;
observance-rule.mjs stays independent of places. App-owned tradition-view and
naming-data own en/hi/gu presentation, a versioned editorial 108-sound table/two
sourced names, name-only copy and explicit private ICS. Profile math remains
unchanged; package/lock 0.11.0 adds these modules. No public routes, persistence,
auth/schema or Ritual Assist changes. See docs/vedic/P11_EVIDENCE.md for gates.

Vedic P10 (2026-10-24, internal export): app-owned export-report.mjs projects an
explicit whitelist into vedic-export-1, removing direct birth identity by default.
Standalone HTML and browser Print / Save as PDF use the same projection, numeric
fallback tables, chart diagrams, full Dasha cycle, warnings and source identities.
No kernel, persistence, public static mapping or API changes. The loopback harness
serves report CSS; public release gates remain open. See docs/vedic/P10_EVIDENCE.md.

Vedic P09 (2026-10-24, internal UI): apps/rashifal-kundli/frontend owns
birth entry/review, per-feature report composition, en/hi/gu labels and Dasha
presentation. Pure calculations remain in packages/vedic. Memory-only private
input is cleared on edits/reset/navigation; only shared theme preferences persist.
Loopback preview-vedic-birth.cjs defaults to 4178; it is absent from public
assets/registry. No API, schema, production or Ritual Assist change. Evidence:
docs/vedic/P09_EVIDENCE.md. The P10 export increment is described above.

Vedic P08 Vimshottari (2026-10-24, internal engine): packages/vedic/dasha.mjs
owns pure birth-balance, 120-year Mahadasha/Antardasha arithmetic and explicit
active/next-boundary queries. Its 365.25-day year is on a uniform Unix-millisecond
axis; projected date labels do not claim observed SI duration or future leap
knowledge. Pinned civil rules project local dates only within their coverage.
birth-dasha.mjs separately validates P02 input and computes the P04 birth Moon;
uncertain/near-Nakshatra-boundary inputs are withheld. Arithmetic-only imports
exclude astronomy/place data. No UI/public route, persistence, interpretation
or Ritual Assist changes. Evidence: docs/vedic/P08_EVIDENCE.md.

Vedic P07 D9/charts (2026-10-24, internal component): packages/vedic/d9.mjs
owns canonical half-open Navamsa mapping and numeric D9; birth-divisions.mjs
adds the separate birth/place and minute-division boundary screen. App-owned
apps/rashifal-kundli/frontend chart-model/view/CSS share one checked numeric
model across North fixed-house and South fixed-sign graphics, accessible house
selection and table. Existing shared tokens/theme owner are reused. The
loopback-only infrastructure/preview-vedic-charts.cjs and app dev fixtures are
development tools, absent from the public static allowlist. No platform route,
catalogue card, production export, persistence or Ritual Assist migration is
added. Source acceptance and birth-time sensitivity gates remain open.

Vedic P06 Lagna/D1 (2026-10-24, internal candidate): `sidereal-time.mjs` owns
IAU1982 GMST/modelled UT1 plus IAU1994 equinox corrections from TT. `lagna.mjs`
owns the eastern geometric horizon intersection with true obliquity and true
Lahiri subtraction. `d1.mjs` owns numeric whole-sign house occupancy; exact
ascendant degree is separate from sign-start house boundaries. The separate
`birth-chart.mjs` uses P02 admission and withholds unknown/approximate or
near-boundary minute-resolution inputs. No persistence, public integration,
graphics or Ritual Assist changes. Independent astronomical acceptance remains
open. Source attribution/report: `docs/vedic/P06_EVIDENCE.md`.

Vedic P05 Panchang (2026-10-24, internal candidate): package-owned
`panchang.mjs` handles geocentric limbs and bounded continuous transitions;
`panchang-observer.mjs` handles local upper-limb sunrise and separate civil/sunrise
Vara. `panchang-place.mjs` is the offline Indian-place admission boundary.
Direct coordinate modules exclude the place dataset from Worker bundles.
Engine TT events are inverted through the explicit civil-time model, never
reported as UTC directly from modelled-UT1 Date values. Reference tools/NOAA
screening stay development-only. Original PAC acceptance and unresolved publisher
sunrise discrepancies remain release gates. No Ritual Assist or public app
integration. Evidence: `docs/vedic/P05_EVIDENCE.md`.

Vedic P04 sidereal positions (2026-10-24, internal candidate): package-owned
`sidereal.mjs`, `ayanamsha.mjs`, `iau1976.mjs` and `angles.mjs` own consistent
IAU1976/1980 revised-Lahiri conversion, mean nodes and nominal sectors. The
separate `birth-positions.mjs` bridge validates P02 input and withholds uncertain
birth time. P03 raw vectors are reused, without mixing its native angle frame.
Pinned ERFA coefficient/reference sources and BSD notices stay package-owned;
no Swiss library, public route, private persistence or Ritual Assist change.
See `docs/vedic/P04_EVIDENCE.md`, including the pre-release P01 anchor erratum.

Vedic P03 astronomy (2026-10-24, internal candidate): package-owned
`packages/vedic/astronomy.mjs` / `astronomy-time.mjs` isolate raw geocentric
astronomy and explicit time-scale handling from normalization, using a pinned
MIT engine copy under `vendor/`. Astronomy-only imports avoid the place dataset.
JPL/ERFA fixtures and model comparisons belong to tests/development tooling,
never runtime external lookups. No Ritual Assist imports, public routes,
sidereal logic or data persistence changed. See `docs/vedic/P03_EVIDENCE.md`.

Vedic P02 normalization (2026-10-24, internal only): `packages/vedic/` owns
pure offline place search/selection, pinned bounded India civil-time rules and
birth-input normalization. It has no route, astronomy, persistence or Ritual
Assist import changes. `infrastructure/prepare-vedic-data.cjs` reproducibly
derives its public GeoNames/IANA reference JSON from retained source extracts;
runtime modules never fetch these sources. Keep approximate coordinate/source
labels and exact/approximate/unknown-time distinctions intact. See
`docs/vedic/PROGRESS.md` and package README for coverage and phase evidence.

Performance/reuse ownership (2026-10-24): `packages/ui/theme.js` initializes
`SynapseUI.observe`; consumers filter mutations to their owned roots.
`packages/ui/legal-html.cjs` owns the `synapse:legal-footer` marker, composed by
`beta-html.cjs` before serving/export so no-JavaScript footer markup is retained.
`/shared/http.mjs` maps to `packages/http/request.mjs`; callers retain app state,
authorization and presentation. Do not add shared persistent private-response caches.
Fund Lens Worker code imports only its generated runtime manifest; immutable public
partitions are loaded on demand through the asset binding. Do not restore the
monolithic reference JSON import. `apps/advocate/backend/state-summary.cjs` owns
linear read-summary aggregation; `packages/auth/organisation-scope.mjs` shares fresh
scope reads without caching authority or moving app-specific role policies.
See `docs/PERFORMANCE_REUSE_RESULTS_2026-10-24.md` for evidence and limits.

Satire loading cleanup (2026-10-24): `frontend/cast.mjs` is the canonical light
card metadata/reaction/art mapping. `personas.mjs` contains only rich scripts
and joins that metadata; the server's `catalogue.mjs` composes full profiles.
Browser controllers import the light cast through one unversioned source path;
the existing production export fingerprints it and all dependencies. Compatibility
module URLs remain available for previously cached pages.
`cards.mjs` creates the final feed card structure once into one fragment.
Generated voting HTML owns native arena navigation, headings, settings, summaries
and footer links; only the shared platform shell owns the JS header/theme controls.
`reaction-controller.mjs` owns score requests, stale-read protection, optimistic
replacement/rollback/reconciliation, polling, removal and sound/feedback hooks
for both feeds and details. Views retain their own presentation/messages.
`enhancements.js` handles lazy art, delegated sharing, once-per-day editorial
content and cancellable daily results refresh after successful score syncs.
Reaction clips (Wow, applause, Ye le, Dishoom) load only for the selected
sound-enabled interaction rather than module import. `sound.mjs` owns clip
fetch/decode deduplication, playback cancellation and synthesized fallbacks;
`feedback.mjs` shares ink/tomato face-impact choreography across feeds/details.
The stylesheet retains active responsive/print/reduced-motion rules after
removing legacy expand/burst/temporary-layout selectors and overridden declarations.

Satire reaction parity (2026-10-23): app-owned `feedback.mjs` selects all eight
expression sheets, including six-column/four-row anchor, actor and corporate
sheets. `style.css` applies their reaction crops on arena and detail pages and
keeps pending portraits hidden despite the newer base-grid overrides.
`enhancements.js` observes every card, including the first, and prepares only
near-viewport expression art with low fetch priority/async decoding. Explicit
asset URLs give JS preloading and CSS the same fingerprinted cache key.
Artwork preparation is deduplicated and capped at 3s, with retry after failure;
only decoded sheets swap faces. Shared voting entry generation retains each
arena's own high-priority base-grid preload and shared early theme/layout setup.
`character.js` uses the same prepare/save/play sequence as `app.js`.
Artwork provenance and final prompts are in `apps/satire-arena/ARTWORK.md`.

Satire applause (2026-10-23): app-owned `sound.mjs` loads the allowlisted
`applause.mp3` and decodes it in the gesture-created Web Audio context. The
normal applause effect uses a short faded recorded excerpt through the existing
limiter. A playback revision cancels deferred sound after stop/mute/new reaction;
sample failure retains optional procedural feedback. `AUDIO.md` owns provenance.
The entry chooser does not import sound. Node adds the `audio/mpeg` MIME mapping.

Satire entry artwork (2026-10-23): the comedy-ticket hero and four original
arena icons are inline, decorative SVG/CSS in app-owned `entry.html`/`entry.css`.
Theme tokens colour the four cards; responsive styling and reduced-motion
overrides stay app-owned. No icon library, image request or JavaScript was added.
Native chooser links, legacy routing and the lightweight entry boundary remain.

Fictional cast refinement (2026-10-23): app-owned `frontend/personas.mjs` owns
the eighteen anchor/actor/corporate display names, biographies, signature lines,
encores and backstage sketches. Stable IDs retain published links and ballots.
`spotlight.mjs` filters this single source for actors/corporates; the catalogue
adds anchors directly. `character-page.mjs` renders the dossier and initial joke
without JavaScript; `character.js` cycles/copies jokes without ballot writes.
App-owned character CSS handles responsive scenes, cards and theme tokens.

Actors/Corporates expansion (2026-10-23, live): app-owned `frontend/spotlight.mjs`
selects twelve fictional personas and their detail content. Shared `catalogue.mjs`
owns four-arena membership and `portraitArt` crops/sources used by both image
export paths and page metadata. `build-entry.cjs` generates News Anchors, Actors
and Corporates pages from the voting template, each with its own title/canonical
and sheet preload. Chooser entry remains independent of voting/artwork modules.
New ballots share constrained `arena_spotlight_votes`; additive app/native/D1
migrations extend the deduplicated view without altering earlier generations.
D1 migration 0008 is live; its migration boundary preserved 83 existing ballots.
Release status and validation evidence belong to the functionality ledger.

Satire entry (2026-10-23, live): app-owned `entry.html`/`entry.css` provide
the lightweight `/satire-arena` chooser without voting or artwork dependencies.
`entry.js` imports the catalogue only to route legacy character query/hash links;
it never records a vote. All four explicit arena routes load voting.
`build-entry.cjs`, called by the shared frontend build, derives the anchor HTML
from the voting template with its own canonical/title and anchor-only preload.
The generated `news-anchors.html` is retained for default Node serving too.

Satire Arena lineups (2026-10-23, live): `apps/satire-arena/frontend/catalogue.mjs`
owns arena availability and character membership. Node/Workers validation uses
that same cast. `/satire-arena/news-anchors` and `/satire-arena/politicians` reuse
the existing frontend; the controller scopes public scores/activity/shares to
the active lineup, while privacy export/removal spans the browser's full history.
App-owned `character-page.mjs` scopes related profiles and pagination. All four
lineups are active. Additive app/D1/native SQL migrations extend ballot storage and
the shared deduplicated view; keep each D1 compound SELECT below six terms.
`anchors-fast.webp` is the original generated three-by-two portrait grid.
Production uses additive D1 migration 0007, applied before the updated Worker;
all 82 existing ballots were preserved at that migration boundary.

Tournament cloud organisations: `apps/tournament-lite/backend/organisation-edge.mjs`
owns scoped APIs and policy checks; its `database/002-organisation.sql` owns the
additive ownership boundary (D1 migration 0006). The frontend discovers organisation
mode from the API, selects a workspace and honours read-only licences. Default Node
remains account-owned. D1 account/admin adapters expose Tournament licences and
assignments; other private app guards remain. See `docs/TOURNAMENT_ORGANISATION_SETUP.md`.

Beta notice (2026-10-19, live verified): `packages/ui/beta-html.cjs` owns idempotent shared
markup; `beta-notice.js`/`.css` own the English/Hindi first-visit acknowledgement,
static footer note and explicit WhatsApp draft. Node HTML composition, Cloudflare
export (including guarded admin/client pages) and generated Arena HTML use the
same injection. The notice version is a browser-only UI preference, with review,
forget, session-storage fallback and readable legal pages before acknowledging.
No API, account authority, tracking permission or server consent audit is added.
See `docs/BETA_NOTICE.md` and the functionality ledger for behavior and evidence.

Feedback: `apps/feedback/` owns the public `/feedback` board, visitor cookie,
request/comment/vote validation, moderation and responsive UI. The same service
runs through Node composition and Workers, using the existing SQLite/D1 settings
table with optimistic transaction guards and explicit capacity limits. No private
app access or schema migration. Organisation moderation is platform Super Admin
only; default Node uses Owner. Shared navigation exposes Feedback separately
from the app catalogue. See its README and functionality ledger for release status.

Android packaging: `apps/android-wrapper/` owns the native Java/WebView shell,
launcher resources, connectivity screen, Android build/signing script and update
guide. It loads the live production origin rather than bundling app code. Keep
website changes in their existing app/shared owners; wrapper changes require an
APK version increment and the same private signing key. Never commit signing
material, APK outputs or SDK paths. No new catalogue app or business API is added.

Shared browser helpers (2026-10-19): `packages/ui/download.mjs` owns temporary
download URLs with caller-selected cleanup timing; `archive.mjs` owns stored ZIP
output with explicit filename flags, using `crc32.mjs`, also reused by certificate
PNG density metadata. `text.mjs` owns HTML escaping for module-based admin/client
screens and timetable exports. All four have explicit `/shared/` static routes
and participate in versioned Cloudflare builds. App-owned export layouts, file
names, CSV validation, money units and access decisions remain app-owned. Existing
export modules keep their download exports; Local Tools retains its one-second
cleanup wrapper. See the ledger for local and production verification.

Public static caching (2026-10-19, dependency refinement live verified):
Cloudflare export uses `infrastructure/cloudflare/build-static-cache.cjs` to
fingerprint each allowlisted public asset together with its transitive
dependencies, including cycles, below `/_static/<digest>/`. Copied modules,
workers, CSS, SVG and manifests use absolute versioned references for known
root-relative and dot-relative dependencies. Page/API/external URLs are unchanged.
Unrelated asset edits leave other fingerprints stable; dependency or rewriting
code changes invalidate affected assets. The `/_static/*` header rule provides
`public, max-age=31536000, immutable`; the Worker overrides missing/error/write
responses to `no-store`, including retired digest URLs.
Original URLs retain `no-cache`; HTML, admin assets and private APIs retain their
existing policies. The fullstack Worker preserves asset validators and makes
missing versioned assets/write requests `no-store`. Chambers inserts its scoped
bootstrap before either original or versioned controller URLs. No service worker
or business-data caching is introduced. Fresh page navigations select the latest
asset fingerprints; retired versions are not retained in subsequent exports. Default
Node delivery is unchanged. See the ledger for verification and release status.

Public delivery preparation (2026-10-19): `build-delivery.cjs` filters shared
premium CSS by each public page's explicit `data-ui-app`, using the conservative
selector policy in `home-css.cjs`. Shared/mixed rules and cascade order survive;
pages without an explicit scope retain the full sheet. Generated app CSS is
Cloudflare-only. Export-only esbuild minification preserves classic-script
global names and legal comments. Guarded organisation assets stay outside this
minification pass. Availability fetch interception remains parser-blocking before
app scripts, preceding its CSS so it does not wait on that stylesheet. No
private-data caching or persistence changes. See the ledger for release evidence.

Homepage CSS cleanup (2026-10-19, live): `infrastructure/home-css.cjs` uses
build-only Lightning CSS to remove complete rules exclusively scoped to a
different `data-ui-app` from the home bundle. Shared rules, portal rules, mixed
selector lists and nested pseudo-class alternatives remain. App stylesheets
are unchanged by this filtering; the existing esbuild delivery minifier remains.
The registry exports its HTML escaping helper for the portal controller as well
as catalogue rendering. Rebuild shared/home assets with `npm.cmd run build:ui`.
See the ledger for measured payload reduction and local/live verification.

App discovery (2026-10-19): `packages/app-registry/index.js` owns code-reviewed
app names/routes, display metadata, groups and catalogue renderers. Its CommonJS
export serves backend callers; the home build embeds that source into the
generated `packages/ui/platform-shell.bundle.js`, served at the existing
`/shared/platform-shell.js` route for home/search/navigation. There is no extra
registry request during navigation. `infrastructure/build-catalogue.cjs` also
refreshes no-JavaScript cards and featured links. Signed-in home hydrates the
same cards with `/api/platform` access flags.
Keep app IDs and aliases stable for favourites and recent activity. Registry
visibility is presentation only; API and organisation/role checks remain the
server's responsibility.

Organisation production (2026-10-17): Cloudflare/D1 organisation mode is live.
Shared asynchronous governance lives in `organisation-repository-d1.mjs` and
`organisation-administration-d1.mjs`, with app-owned edge route/account/audit/client
adapters. `organisation-d1-sql.mjs` reuses the staged SQL engine with an explicit
catalog and one revision-guarded batch. Chambers' scoped edge facade owns record,
file, staff, profile and activity boundaries. `server/edge-index.mjs` composes them
and denies legacy private routes when ORGANISATIONS_ENABLED=true. Public routes
retain separate ownership; unintegrated private apps stay unavailable. Build
metadata and additive 0005 D1 migration derive from the app/shared immutable SQL.
Admin assets have flag-gated public paths; internal storage paths return 404.
Offline cutover/recovery utilities never run during request handling. See
`docs/ORGANISATION_PRODUCTION_CUTOVER.md` for verified release and rollback boundaries.

Organisation readiness (2026-10-17): `tests/organisation-readiness.test.js` exports
from a prepared fixture and starts a second guarded runtime from a restored,
new temporary SQLite database. The shared test fixture accepts recovery SQL only
for this disposable test path; no application restore endpoint or production
startup behaviour changes. `docs/ORGANISATION_READINESS.md` records verification
boundaries and activation blockers. `npm run test:organisation-readiness` runs
the organisation suites independently of production configuration.

Organisation audit viewer (2026-10-17): admin owns `backend/audit.mjs` and guarded
audit HTML/module. Repository governance authority is re-read before scoped,
parameterised keyset queries. Details are projected through known fields/actions;
private record/credential payloads are excluded and common credential-shaped reason
text masked. UI is read-only with IST labels and lifecycle revalidation. Global
null-org audit events now use a separate Super Admin-only platform query and
guarded /platform-audit page. Shared bounded pagination, separate action allowlists
and explicit recovery flag projection preserve scope boundaries. No public/cloud route/schema.

Own-account security UI (2026-10-17): guarded My account uses the existing shared
auth password endpoint and its session rotation semantics. Password fields reset
on outcomes/visibility changes; account request revisions prevent obsolete results
repopulating DOM. Expired account sessions return to inline sign-in; client pages
link back to My account. No auth/schema/provider or public route change.

Client portal screens (2026-10-17): Chambers owns guarded client-portal HTML/module.
The client read service exposes a shared eligibility scope helper so account
navigation uses the same live entitlement/link rules. Client-link UI manages
separate Client-role assignments and displays seat impact and release fields.
Client page is read-only, clears on visibility/pagehide and rejects stale responses.
No new schema, public/cloud routes, document or financial endpoints.

Client portal API (2026-10-17): Chambers owns `client-portal.mjs`, dispatched only
in guarded preview under `/api/client-portal/:org`, separately from staff routes.
It rechecks session identity, Client membership, Client-role app assignment,
licence and explicit client links in a consistent read transaction, projecting an
allowlist of client names/basic cases. The existing ClientAccessAdministration
service owns audited Client entitlement admission to the licence's separate
client-seat pool. No migration, client UI, documents or financial routes yet.

Client-link management screen (2026-10-17): Chambers owns client-access HTML/module,
served only through guarded preview assets. My account derives link-management
eligibility from primary membership and Owner entitlement; the scoped service
independently enforces it. Overview data is restricted to member/record choice
labels and link metadata. Grace is read-only; visibility/BFCache revalidate. No
client portal reads or default/cloud route are introduced.

Client access foundation (2026-10-17): Chambers owns migration 005 and
`client-access.mjs`, with guarded staff endpoints under `/api/chambers/:org`.
Link management requires primary Master Admin plus Chambers Owner, without Super
Admin record bypass. Composite foreign keys prevent cross-org record links.
Scoped JSON restore removes link authority and audits the removal; full SQL
recovery retains it. No client read endpoints/UI/entitlement activation exist yet;
stored links alone must never become a read authorisation decision.

Organisation lifecycle (2026-10-17): the shared administration service owns explicit
Active/Suspended transitions with Super Admin, version, typed scope and audit
enforcement. Guarded admin adapters render only the next allowed action. Scoped
app/admin/invitation access re-read org status, so existing sessions are blocked on
their next request. Transitions preserve data/configuration and do not extend
licence/invitation validity. Draft/PendingActivation/Closed transitions remain separate.

Organisation account navigation (2026-10-17): `/account` is preview-only and uses
the shared admin shell. `apps/admin/backend/account.mjs` returns only the session
identity's memberships and derives Chambers links using the shared entitlement
policy plus staff-role enforcement. Membership is separate from app assignment;
Super Admin grants no automatic app access. Management links preserve org scope;
the initial admin load validates it. Visibility/BFCache revalidate account metadata.
Clients have no portal destination until one is implemented. No public/cloud route.

Super Admin full recovery export (2026-10-17): guarded admin route delegates to
Store.exportSql with an internal beforeExport audit callback inside its existing
transaction. Full backup authority is explicit and separate from business API
access. Password re-entry, full-scope confirmation, reason and bounded attempts
protect the local preview download. Sessions are excluded, and restoration stays
offline into a new empty SQLite database. No cloud/default-runtime exposure.

New-primary onboarding service foundation (2026-10-17): opt-in migration 004 tracks
invitation-created identities separately from existing disabled accounts. The
repository atomically provisions an inactive identity and primary invitation, then
activates identity/member/org with recipient credentials. It creates no app grants
or global Owner authority. Guarded preview now exposes one signed-out activation
endpoint with bounded body/attempt limits, plus activation and sign-in forms on
administration entry pages. Default/cloud runtime remains unavailable; see the
organisation continuation plan for remaining work. Scoped staff/client onboarding
now lives in `organisation-administration.mjs`: invitation-only inactive identities,
separate seat pools and atomic credential/member activation. Multiple pending org
invitations share one identity; only the first activation establishes credentials.
Later invitations use signed-in acceptance. Both activation routes share one
bounded attempt bucket and remain unavailable outside the guarded preview.

Organisation/licensing programme (2026-10-17, local foundation only):
`docs/ORGANISATION_LICENSING_PLAN.md` records approved requirements and continuation
status. Runtime-neutral `packages/auth/organisation-policy.mjs` separates platform
provisioning, primary Master Admin management, private app entitlement checks and
staff/client seat admission. Opt-in SQLite persistence/provisioning lives in
`packages/database/organisation-repository.mjs`, with ordered SQL under
`packages/database/migrations`. The shared baseline schema links this extension
without applying it on startup. Caller-owned native SQLite transactions enforce
primary Master Admin membership, hashed activation invitations, audit and revision
checks. Migration `002-legacy-chambers.sql` and `legacy-chambers-mapping.mjs`
prepare explicit account selection and legacy record/file ownership without
rewriting business rows. `organisation-schema.cjs` shares the immutable migration
manifest with `organisation-recovery.cjs`; full SQLite export includes known
organisation schema/state inside one consistent transaction. JSON restore remains
single-workspace and is not organisation recovery. No provisioning/mapping routes,
live schema/data migration or business-record tenant isolation are introduced.
SQL Server/D1, scoped restore and ongoing ownership writes remain pending.
Implementation is local only; deployment is explicitly prohibited by the user.

Chambers frontend scope (2026-10-17, guarded preview): Node injects local-only
`organisation-preview.js`/CSS before the existing controller. The controller
validates organisation selection, prefixes business/download/recovery paths and
uses trusted scoped/read-only/admin capabilities. Scoped settings excludes global
team/SQL recovery. Existing-account sign-in is available on the Chambers entry.
Switching reloads the document; visibility/BFCache revalidate, and request revisions
prevent stale responses restoring content after denial. Normal runtime/cloud
behaviour is unchanged; new-account onboarding remains pending.

Chambers scoped API (2026-10-17, temporary preview only): app-owned
`organisation-routes.mjs` injects `OrganisationChambersStore` into the existing
validated business handler. Explicit `/api/chambers/<org-id>/...` paths scope every
record/file/staff/settings/audit access and atomically persist ownership. App-owned
`003-organisation-workspaces.sql` adds profile, activity and SQLite recovery
snapshots; the shared ordered manifest/export supports all three schema versions.
Scoped JSON restore cannot clear another org or overwrite its IDs; full SQL export
is denied through Chambers. Preview serializes API requests on its shared SQLite
connection and blocks legacy private API fallthrough. Default runtime/cloud and
Chambers frontend routing remain unchanged. See the app's ORGANISATION_SCOPE.md.

Administration UI/adapters (2026-10-17, temporary preview): `apps/admin` owns the
shared browser/controller/CSS, local asset allowlist and session-authenticated Node
adapter; `apps/super-admin` owns its primary entry page. Pages and API are disabled
by default and absent from public/cloud exports. ORG_ADMIN_PREVIEW=1 requires
NODE_ENV=test/development, loopback requests/binding, SQLite and an explicitly
prepared DATA_DIR resolving under the OS temp directory. No automatic schema or
account bootstrap. Server composition injects the retained native SQLite connection
only behind this guard. Real workspace/app access is not migrated or tenant-isolated.

Organisation administration services (2026-10-17, local):
`packages/database/organisation-administration.mjs` owns primary Master Admin
transfer, manual licence lifecycle/seat limits, existing-identity member invitations,
scoped member deactivation, Chambers staff assignment and safe overview metadata.
Services use immediate SQLite transactions, persisted authority, organisation/licence
revisions and audit. No account-global role/session changes, new migration, UI or
runtime route is introduced. Other app assignment roles remain app-owned/pending.

Homepage apps-first refinement (2026-10-17, local): portal static/dynamic public
markup shares a compact welcome section; `home.css` restores document scrolling
for the catalogue. Shared shell owns the relocated Make 24/Decision Wheel
suggestions in All apps. Existing public card routing, finder, filters and private
access enforcement remain unchanged. Category selection may change document
height intentionally; it no longer confines the catalogue to an inner scroller.

Break victory presentation (2026-10-17): `apps/take-a-break/frontend/celebration.mjs`
decorates genuine completion results for Code, Memory, Lights Out, Face-Off and
Chaos. It reuses Daily Spark's bounded celebration engine with optional result
selectors; Make 24 defaults remain intact. Results retain their existing scores,
sharing and replay controls. Effects clear on reset/hide/navigation and reduced
motion retains the static trophy and result. Revealed Code answers are neutral.

Platform visitors (2026-10-17, local): `apps/portal/backend/visitors.mjs` owns
the bounded visitor aggregate and public `/api/platform/visitors` endpoint, with
Node adapter `visitors.cjs`. Shared `packages/ui/visitors.mjs` records app-first
visits using one browser-local identity and renders only the root footer,
including portal re-renders. Existing settings persistence and transaction guards
remain authoritative. Counter coverage follows shared header inclusion; visitor
IDs are transiently hashed, not stored by the backend. No schema migration.

Arena optimistic UI (2026-10-17, local): `apps/satire-arena/frontend/app.js`
owns transient selected-count deltas, rollback/reconciliation, in-flight read
revisions and existing server-reset countdown/polling. The signed HttpOnly cookie
and atomic SQL ballot replacement remain authoritative; no browser vote database
is introduced. `enhancements.js` owns link sharing fallbacks and delegates toast
timing to the Arena controller. App-scoped CSS owns header context, summary depth
and responsive three-column/two-row reaction groups. No schema/API changes.

Landing discovery (2026-10-16, deployed): portal-owned `home-discovery.js` enhances
both homepage renderings with transient category filtering. Its fixed-height,
keyboard-focusable catalogue scroll region prevents filter-driven page shifts;
without JavaScript the complete native link grid remains. Native horizontal
scroll snapping owns the two featured links on phones. Homepage CSS alone adapts
the existing shared app-switcher trigger into a mobile hamburger and distinguishes
restricted workspaces; shared authentication, switcher/dialog lifecycle and app
access remain unchanged. The controller is explicitly statically allowlisted.

Public copy cleanup (2026-10-16, deployed): app-owned UI keeps task instructions
and contextual help separate. Portal static/dynamic public cards share shorter
copy; private access metadata is preserved. `packages/ui/sponsorship.js` mounts
only a configured campaign or the existing home sponsorship invitation, without
preview-only ad boxes. `packages/ui/language.js` includes new shared copy keys;
native Ritual Assist retains its own bilingual strings and checklist notes.

Loading optimisation (2026-10-16, deployed): portal and shared header reuse a
page-local initial auth promise regardless of script order. Later visibility
refreshes and portal boots fetch fresh status; authentication stays server-owned.
Anonymous portal startup retains its server-provided DOM. Shared header CSS
imports the same premium URL as the main pages. News owns responsive image
variants under `apps/news/frontend/art`, exposed by the static asset allowlist;
the original artwork stays available for larger sources and existing links.

Confessions scratch/scroll (2026-10-16, deployed): the app-owned card controller
uses horizontal touch scratch strokes and native vertical panning, without
automatic page centering. A clipped, non-scroll-container conversation shell
lets the inner feed chain to document scrolling. Own cards follow the same
covered lifecycle; keyboard/assistive reveal remains available on focus.
App-owned edge handlers hand off outward touch/wheel motion only when the feed
is at its boundary and the document can scroll. In-feed native panning and
horizontal scratch gestures remain separate; multi-touch is left to the browser.

Export branding (2026-10-16): `packages/ui/export-brand.mjs` owns the small
canvas credit reused by QR Maker and Team Mixer. QR exports reserve space
outside their original QR matrix and quiet zone. App-owned text export paths
keep their own platform credit. No payment entitlement or persistence is added;
paid branding removal is deferred until a separately implemented verified flow.

One-Minute Chaos (2026-10-16, deployed): `apps/take-a-break/frontend` owns
`chaos-engine.mjs` (seeded active-time simulation), `chaos.mjs` (DOM controls
and pause lifecycle) and `chaos.css` (responsive token-based playfield).
It is a game within the existing `daily-spark` catalogue ID, not a separate
app or persistence service. `server/static-assets.js` exposes its modules.
The Take a Break controller pauses it on navigation; visibility/pagehide also
pause it. Scoring and sharing use tab-only state, with no server writes.

Confession chat/icons (2026-10-16, deployed): new CAPTCHA-verified posts are public
immediately, while historical pending entries stay private until Owner review.
Report/Owner removal and seven-day expiry remain. The shared SQL envelope's
version is returned with listing/post responses so a stale poll cannot remove
a newer own-message card. Visible tabs poll every five seconds; separate browser
processes share the same backend, with no account or browser author ID stored.
Own bubble alignment is tab-only; own text is immediately visible, while other
messages keep scratch/tap reveal. Compact composer CAPTCHA expands on focus.
`home-art.svg` owns theme-aware speech/QR/photo-resize symbols; portal artwork
mapping, 24px paths, registry metadata and both homepage renderings use them.

Confessions quick check (2026-10-16, deployed): the app-owned `captcha.mjs` loads a
first-party addition question on composer focus or New question. The shared
service issues opaque IDs, retains at most 100 five-minute challenges in the
existing versioned SQL setting, and atomically consumes a correct answer with
posting. Incorrect attempts consume their challenge; missing/expired IDs fail
closed. D1 guarded commits/Node CAS prevent concurrent replay. Challenge issue
and posting both use the existing six/minute limiter; no IP/account data is
attached to the challenges. Old settings without challenges default to empty.
Only transient IDs/answers enter the browser form; no third-party script, new
database, schema migration or CSP change is required. This is basic spam
friction, not strong bot detection; moderation and rate limits retain ownership.

Confessions (2026-10-16, deployed): `apps/confessions` owns `/confessions`, its
scrolling scratch-card stream, composer, owner moderation and shared service.
The versioned `confessions-v1` SQL setting stores at most 300 bounded entries;
Node uses SQLite transactions/CAS and Cloudflare uses guarded D1 commits. No
schema migration or separate database is introduced. Public lists expose only
IDs/times; reveal returns approved text; pending submissions are owner-only.
Reports hide entries, and seven-day expiry is enforced on every read, with
physical pruning on subsequent successful writes. Anonymous writes have a
dedicated six/minute Cloudflare limiter and bounded in-memory Node equivalent.
Only the existing platform Owner role can review/remove. Business data never
moves to browser storage; only a non-security reveal UX ledger of IDs/allowance
uses sessionStorage. Posting identity is not attached to the stored message.

App-owned ad adapters/config prepare manual header/footer/desktop-side units and
opt-in five-reveal rewarded batches. All are disabled without real units and
page security approval. Automatic approval rejected reusing the broader homepage
Google CSP here; that attempted Node change was removed, Cloudflare was left
unchanged, and Confessions retains self-only scripts. Existing homepage ad code
and private-page policies are unchanged. See the app README for activation and
moderation constraints. Registry, static allowlist, shared switcher, finder and
both homepage renderings expose the new route.

Bill Splitter simple entry (2026-10-16): its frontend owns transient total and
stable-ID payer inputs for the default equal split. Submit maps that payment
onto participant rows for the existing integer-paise engine, without overwriting
the advanced payment fields. More options exposes existing split/trip controls;
hidden controls are disabled. No persistence, schema, authentication or API
contract changes accompany this presentation simplification.

Public-tool refinements (2026-10-16): Wi-Fi payload encoding/validation belongs
to `apps/qr-maker/frontend/wifi.mjs`; deterministic team swaps and rule checks
belong to `apps/team-mixer/frontend/swaps.mjs`. Photo Resize retains its existing
compression engine and adds transient original/comparison state in its frontend.
`packages/ui/presentation.*` provides native/fallback fullscreen for Wheel and
Focus without cloning their running DOM or moving state ownership. It restores
focus, scroll, body overflow and prior sibling inert states on exit. Scoped
shared visual refinements live in `packages/ui/tool-refinements.css`.
News' `reading-tools.*` owns tab-only reader preferences and a toolbar outside
the rerendered edition container. Its observer follows reader visibility; the
existing edition fetch/render, date logic and Light reading mode remain owned
by News' app. New static assets are explicitly allowlisted in
`server/static-assets.js`; no persistence/schema or API contract changes.

Bill/Ritual ease-of-use (2026-10-16): Bill Splitter's frontend owns stage
shortcuts, labelled example/fresh reset with replacement confirmation, one-step
transient deletion undo, live entered totals/percentage remainder, settlement
cards and a disclosure for the full copyable breakdown. Existing validated split
engines retain calculation ownership. Ritual Assist owns compact native item
details, in-memory all/needed/arranged/unassigned filters, section counts and a
native checklist-preview dialog. Preview/print includes all items independently
of screen filters, with custom items identified and saved quantities/names.
Before/after-print handlers preserve disclosure/filter state and tolerate repeated
events. Guided content, browser persistence key, calendar and SQL remain intact.

Bill/Ritual refinement (2026-10-16, local): Bill Splitter's app-owned engine adds
percentage and relative-weight allocation using integer units and BigInt
largest-remainder arithmetic with stable input-order ties. `splitExpenses`
validates 1–100 named expenses and payer indices, aggregates payments, and applies
the selected split to the combined total. Its frontend uses transient stable
participant IDs to retain payer selections during renaming, protects removal of
participants referenced by expenses, and keeps all state in the tab. No payment
connection, browser persistence or API is added.

Ritual Assist extends the existing version-one checklist key with optional
per-item `details` (quantity ≤60 characters, arranger ≤80), defaulting absent
details for older saved lists. Canonical and custom items get bilingual fields,
item-specific accessible names, print-only text and text-export notes. Details
persist independently of checkmark opt-in; reset clears only checks, and removing
an extra item also removes its details. Unreadable saved bytes retain tab-only
fallback. Static styles and cache versions remain app-owned; SQL and calendar/
preparation-pack ownership are unchanged.

Public-tool quick wins (2026-10-16): `apps/qr-maker`, `apps/photo-resize` and
`apps/bill-splitter` own three public, device-only tools. Shared presentation and
copy/download helpers live in `packages/ui/local-tools.*`; static allowlisting,
the app registry, shared switcher and both homepage renderings expose their
routes. QR Maker reuses the existing vendored QR encoder at `/support-qr.mjs`
(its existing third-party notice applies), uses standard black/white modules
and a four-module quiet zone, and adds no tracking redirect. Photo Resize owns
bounded local decoding and JPEG quality/dimension reduction; no photo leaves
the device. Bill Splitter validates amounts as integer paise and generates
settlements without a payment connection. None has backend writes or storage.

Focus owns validated merge-only JSON task backups and revision-guarded one-step
removal undo in the existing browser plan. Decision Wheel keeps removal undo
transient. Team Mixer owns an exact previous-result/settings snapshot and a
maximum-people-per-team input that feeds the existing constrained balanced
allocation engine. These do not change shared authentication or SQL persistence.

The user explicitly authorised browser-local Ritual Assist additions and
optional saved checklist progress on 2026-10-16. `checklist-state.mjs` validates
the versioned `synapse-ritual-checklists-v1` key, up to 40 custom items per guide,
and checkmark opt-in. `app.js` keeps additions separate from canonical guides,
includes them in copy/download/print, and preserves unreadable stored data while
falling back to tab-only operation. This supersedes the older tab-only checklist
description below. Calendar calculations and preparation packs retain their
existing owners and are unchanged.

Daily Satire sample edition (2026-10-16): app-owned `backend/sample-edition.mjs`
contains seven original English/Hindi examples across five categories.
`public-pages.mjs` renders a clearly labelled, noindex preview when the public
library is empty or `sample=1` is explicitly selected on content routes. Sample
article/category/canonical/share links preserve that query. Samples never enter
editorial SQL records, public APIs, schedules, sitemaps, results or character
overrides; published owner content takes precedence on normal pages. Preview-only
`sample.css` is allowlisted and loaded only on these pages. `content.js` labels
sample shares/downloads and avoids importing aggregate analytics in previews.
The current 13-character Arena assets, captions, ballot handlers and totals are
untouched. Editorial pages load the existing shared header stylesheet correctly.

Homepage welcome (2026-10-16): portal `index.html` and `publicHome()` in
`platform.js` ship matching compact illustrated welcomes and one real Make 24
daily-feature link. Original inline SVG depicts creating, playing and completing
a task using theme tokens; `home.css` owns responsive layout and bounded entrance/
hover motion with reduced-motion suppression. `packages/ui/language.js` translates
the new text. No hero image fetch, puzzle generation, analytics or provider is
added; the feature opens the existing IST daily game. Authentication, finder,
app order/access, no-JavaScript discovery and workspace navigation retain owners.

Lights Out replacement (2026-10-16): Take a Break `engine.mjs` owns immutable
orthogonal toggles, deterministic solvable boards and an optimal row-chasing
solver enumerating at most 32 first-row patterns. App-owned `app.js` owns three
levels (3×3/4×4/5×5), move/undo/restart/hint state, keyboard focus and result sharing.
Clue Club code/data/styles and its static data allowlist entry are removed; old
`game=clue` links explain and open `game=lights`. Home/catalogue copy is aligned.
Crack the Code and other daily seeds retain their owners. Progress stays transient;
no account, database, API or provider is added.

Decision Wheel finish (2026-10-16): app-owned `app.js` owns a 6.8-second continuous
cubic slowdown, last-revolution presentation, slice-crossing pointer ticks and
opt-in local Web Audio clicks. `index.html` reuses the existing platform logo in
the stationary hub; `style.css` owns the rim, glow and result motion using shared
tokens. Reduced-motion changes and hidden-page/pagehide events finish an active
spin and cancel transient pointer/confetti effects. `engine.mjs` retains unchanged
cryptographic sampling and exact landing angles; no persistence/API is added.

Support simplification (2026-10-16): portal-owned `support.html`/`support.css`
present Buy me a coffee, compact Chai/Coffee/Pani puri/Pizza choices and secondary
sharing/contact/sponsorship guidance. The existing WhatsApp form is under a native
details disclosure. `support.js` keeps amount selection visible while unconfigured,
but exposes payment links/QR only through existing validated enabled settings.
`support-engine.mjs` retains amounts and validation with refreshed treat labels.
Owner settings, payment adapters and SQL persistence retain their existing owners.

Shared header account identity (2026-10-16): `packages/ui/platform-shell.js`
reads the existing same-origin, no-store auth status to show Sign in or up to two
Unicode grapheme initials linking to the profile. Identity remains in tab memory;
no name/email is stored in browser storage. Visibility/BFCache restoration refresh
the session; portal `platform.js` emits `synapse-auth-change` after session and
profile changes so the persistent header updates without reloading. Request
revisions prevent stale auth responses from overwriting newer portal state.
Account avatar sizing/theme tokens remain in `platform-shell.css`. Shared status
reads are allowed by standalone-tool browser tests; app API traffic remains checked.

Take a Break code deduction (2026-10-16): app-owned `engine.mjs` owns an original
five-clue construction with a unique three-digit answer and seeded digit/position/
row permutations (`cv=2`). `app.js` owns exact-clue validation, manual notes,
starting hint, unlimited checks, confirmed reveal and spoiler-free sharing at
`?game=code`. This supersedes the five-digit/eight-attempt game; research and
generation limits are in `TAKE_A_BREAK_CODE_DESIGN.md`.
Existing app routes, other daily seeds, assets, shared themes and persistence
remain with their existing owners; no API or schema is introduced.

Satire Arena 2 (2026-10-16): app-owned `backend/editorial.mjs` validates the bounded
editorial library and filters publication schedules using IST. Owner-only Node
and D1 adapters persist it in the existing shared SQL settings table with revision
checks and audit. `public-pages.mjs` and `cloud-pages.mjs` render escaped public
articles, categories, characters, results and sitemaps without a framework change.
`backend/edge.mjs` retains ballot ownership and adds aggregate-only retained-ballot
history. Frontend enhancements own compact browsing, explicit share methods,
character punchlines and viewport-based artwork loading; original feedback keeps
its animation and accessibility lifecycle. `metrics.mjs` stores optional bounded
aggregate actions in SQL settings, disabled by default and with owner reporting;
it does not measure unique or returning people. `ad-policy.mjs` is eligibility
readiness only and renders no ads. Portal static and JavaScript homes share an
Arena discovery section. Existing votes, identities, accounts, schemas and app
access remain intact. See `docs/SATIRE_ARENA_2.md` for operational limits.

Fund Lens national official-data product (2026-10-12): `apps/fund-overlap/ingestion/official_sources.py` and `official-sources.json` own the fixed AMFI/AMC disclosure registry and bounded discovery; `official_parser.py` owns conservative XLS/XLSX/ZIP parsing and exact portfolio identity, date, ISIN and NAV-weight checks; `official_refresh.py` publishes immutable public snapshots with a single atomic `official-index.json` containing its coverage generation. `backend/official-library.js` and `official-reference-store.js` compose verified references and bounded coverage queries for Node and the existing Cloudflare source handler. App-owned frontend files distinguish national discovery from the verified official library and show dated coverage. Original PPFAS IDs, snapshots and authenticated legacy data remain preserved. This extends the original five-fund refresh rather than replacing business persistence. See [product contract and verification boundaries](FUND_LENS_CORE_PRODUCT.md).

Moment Studio unified creation and signature certificates (2026-10-12): `apps/moment-studio/frontend/index.html`, `card-app.js` and `cards.css` own the certificate-reference warm inspector/artboard presentation, visible task fields/card language, safe editable starters, message-only replacement confirmation and form-first phone order. Invitation fields are explicit; remembrance gatherings enter rendered details only when enabled. Certificate phone order also puts the form first. `certificate-renderer.mjs` owns four original compositions (Laurel, Nocturne, Summit, Jubilee) with independent geometry, local native ornaments, whole-grapheme fitting and the existing A4 export contract. Legacy renderer template names map to these four designs; they are not extra gallery entries. `certificate-app.js` owns type-aware default selection, manual-choice preservation, explicit Summit accents and unchanged organisation/signature/batch/export handling. Both editors retain shared light/dark/system preferences, branding, private tab content and the approved organisation storage key. No external artwork/font, AI, schema, payment or persistence provider is added. This supersedes earlier five-template and preview-first mobile descriptions below.

Make 24 celebration (2026-10-12): `apps/daily-spark/frontend/celebration.mjs` and `celebration.css` own the bounded visual effects and persistent result-card presentation shared by standalone Daily Spark and Take a Break. `play.mjs` triggers effects only for a solved puzzle and clears them on reset; hidden panes/pages and reduced-motion changes cancel animations. The existing engine and transient progress remain unchanged. Both assets are explicitly allowlisted in `server/static-assets.js`.

App visibility order (2026-10-12): Moment Studio, Take a Break, Decision Wheel and News lead public home, registry/catalogue and shared app switching. Remaining entries retain their prior relative order within each surface. Static home and `publicHome()` stay aligned; homepage CSS defers to markup order instead of historical featured-app ordering. Favourite/recent preferences and access checks are preserved.

Moment Studio simplified cards (2026-10-11): `index.html`, `cards.css` and `card-app.js` own the focused two-child form/preview workspace. Greetings and memorial routes expose separate occasion lists, occasion-aware template thumbnails, collapsible wording/personalisation and optional event inputs composed into the existing bounded details at render/export time. Manual design/palette choices survive occasion changes. The former tool dashboard, filters, favourites and command search are removed. Certificate rendering, branding and persistence retain their existing owners.

Focus owns `/focus` under `apps/focus`. By the user's explicit browser-only preference, its timer and daily tasks need no account. Task state persists in localStorage (`synapse-focus-plan-v1`), with validation, capacity limits, cross-tab refresh and safe write-failure handling. `task-model.mjs` owns optional per-lane order metadata, backwards-compatible task commands and validated priority/reorder/edit changes. `app.js` owns the priority board, pointer dragging with cancellation/autoscroll, keyboard/touch alternatives, completed/carry lists and native task editor. `focus-timer.mjs` owns 15/25/50/custom 5–120-minute preferences (`synapse-focus-duration-v1`) and transient wall-clock sessions; duration controls stay locked until reset/completion. Presentation stays app-owned and uses shared theme tokens. This exception applies only to Focus; shared authentication, preferences and other app business records remain database-backed. Existing account-scoped cloud Focus plans and their authenticated legacy API are preserved. Task validation is an app-owned frontend module reused by that legacy API. Shared registry, home discovery and app switching expose Focus.

Free cloud target (2026-10-11): `wrangler.free.jsonc` and `wrangler.free.production.jsonc` use D1 without R2, existing email/password authentication (`packages/auth/edge.mjs`), a 49-statement full-app request budget (45 in reduced mode) and atomic SQL capacity triggers. No OTP or email ownership verification is required. Optional Access authentication remains explicitly selected by `AUTH_METHOD=access`; it is not the chosen deployment mode. Chambers retains business validation, app roles and preferences. `packages/storage/d1.mjs` stores private document BLOBs with SHA-256 verification, limited to 1 MB each and 100 MB total; document bytes, metadata and audit commit atomically. `FULL_APPS=true` enables DIGITAL SAMAJ, BatchFee, Tournament, saved News, private Fund workflows and the ritual calendar. Samaj photos and message attachments share the D1 document byte cap; migration 0004 adds their private BLOB table. Staged Samaj operations use request-local projections and final atomic table batches to fit the Free query limit. Large interactive backup/restore stays disabled; verified offline D1 recovery remains available. Full recovery bundles and original runtimes remain preserved. Workers Free is owner-confirmed; deployment evidence lives in the functionality ledger. See [scope and deployment prerequisites](CLOUDFLARE_FREE_DEPLOYMENT.md).

Cloudflare fullstack adaptation (2026-10-11): `server/edge-index.mjs` composes async app-owned edge handlers, shared `packages/database/d1.mjs` guarded D1 batches, and private `packages/storage/r2.mjs` objects. Samaj stages its complete request with read-your-writes before a single commit. Static frontend/API URLs remain; available apps retain their role checks and planned apps stay unavailable. `infrastructure/cloudflare/wrangler.fullstack.jsonc` targets separate staging resources; existing Node composition, SQLite/SQL Server schemas and recovery sources are preserved. This is locally verified code, not a production cutover. See [implementation, migration and recovery](CLOUDFLARE_FULLSTACK.md); this supersedes historical statements below that Calendar/private APIs can only run through Node.

Greeting refinements (2026-10-11): Moment Studio `card-app.js` owns occasion-specific design/palette defaults; `card-renderer.mjs` owns local botanical artwork, fine rules, circular memorial photo crops and bounded message/details/sender regions. Certificate rendering remains independently owned.

URL retirement (2026-10-11): `/certificates`, `/celebration-studio`, `/arena` and their old frontend asset URLs are removed, including trailing-slash variants. Current destinations are `/moment-studio`, `/moment-studio/cards` and `/satire-arena`. Root Studio `occasion` queries no longer choose the cards page; use `/moment-studio/cards?occasion=...`. Internal navigation/tests use current destinations. Database preference app-ID mappings remain to preserve saved favourites/history. These current rules supersede legacy URL references in historical paragraphs below.

Unused implementation cleanup (2026-10-11): Moment Studio owns both legacy `/certificates/*` and `/celebration-studio/*` URLs. Their old frontend source trees are removed; retained workspace folders own compatibility browser tests and historical documentation. Celebration validation tests now import the active card renderer. Retired Fund portfolio/analytics UI modules, browser calendar worker and shared heading-decoration script are removed; private Fund APIs/core/data, backend calendar worker and compiled workbench CSS retain their owners. Historical ownership paragraphs below are superseded by this contract.

Platform continuity is owned by `packages/ui/platform-shell.js` and `platform-shell.css`, loaded last by every served HTML page (including account, legal and unavailable screens). The fixed 72px header owns platform identity, app switching, theme and account entry; legacy app headers retain local action handlers and language controls. Private desktop navigation starts below that header; app navigation remains app-owned and mobile keeps a single app bottom bar. The switcher lists implemented routes only and labels private access requirements; it does not grant access, fetch business records or persist state. Shared theme changes are forwarded to existing app listeners. Showcase display mode suppresses the shell, and print suppresses shell/dialog UI. New apps must adopt this contract and join the reviewed switcher list when implemented. Public home uses uniform launcher cards and compact introductory text; app identity belongs inside the shared frame. Runtime heading-decoration injection is no longer loaded by served pages. Studio shares the platform's initial light theme and respects saved light/dark/system preferences. Shared Hindi navigation translations belong to `language.js`.

The thirteen-character Arena catalogue, compact captions, mixed three-column/four-row and two-column/five-row portrait sheets, and right-hand reaction rails belong to app-owned screen CSS and card markup. Six small icon/count buttons retain 48px touch targets, full accessible reaction labels and hover titles. Two desktop columns give portraits more room; mobile keeps one column with the rail beside each image. New-character persistence belongs to additive app-owned SQLite/SQL Server migrations and arena_additions_votes/arena_speakers_votes; aggregate/private deletion includes all generations. The app-owned inkpot SVG lives in catalogue.mjs and is reused by controls and feedback. Voting, selected-choice badges, portrait effects, haptics and reduced-motion behavior retain their existing module owners. Shared light-mode muted-text contrast belongs to packages/ui/premium.css and its generated Tailwind bundle.

Signed-out private workspace cards are shipped in both portal static HTML and `publicHome()` in `platform.js`. Their decorative sculptures reuse `home-art.svg` symbols (community, chambers, trophy and fees); layouts and theme tokens belong to `home.css`. Both versions keep identical sign-in destinations, access requirements and public tournament-viewing guidance. Pending Ritual Assist presentation refinements use shared language buttons bridged to the existing native selector, without changing checks, calendar calculations, API validation or persistence.

Moment Studio's certificate-first entry is `/moment-studio`; `/moment-studio/cards` owns the greeting workspace and its occasion query links. The five original certificate designs and bounded A4 text/image geometry belong to `certificate-renderer.mjs`; they require no remote template library. `certificate-app.js` owns automatic/manual template selection, expanded native-dialog preview and batch tools inside the editor form. The workspace must have exactly two grid children: form and preview. App-owned screen CSS sizes the artboard independently of export DPI; print keeps A4 geometry. Existing recipient/signature privacy, approved organisation storage, donation wording and export branding remain intact.

Authenticated catalogue artwork and cards belong to `apps/portal/frontend/platform.js`; native symbols extend the existing `home-art.svg` sprite. The unused `packages/ui/workbench.js` script and its public allowlist entry are removed; platform-shell.js owns shared navigation and working headings no longer receive injected artwork. Screen-only materials, responsive cards and decorative print suppression belong to `workbench.css`, compiled through the existing Tailwind bundle. Functional icons, accessible action labels, saved themes and server-enforced app availability retain their existing owners.

Garland or Roast is the presentation name of Satire Arena; app IDs and `/satire-arena`/`/arena` routes retain their owners. Its app-owned frontend renders live/server-reset scores, transient reaction toasts, date-based spotlight, leader ribbons and local PNG sharing. Share images contain public aggregate snapshots and existing portraits/logo, excluding private selections and cookie identity. Shared screen-only group colours live in `packages/ui/workbench.css`. `feedback.mjs` retains animation/sprite/haptic lifecycle ownership unchanged; backend ballot validation, identity, privacy export/removal and SQL/D1 routing are unchanged. No weekly statistics or new persistence are implied.

Moment Studio's creative workspace layout and shortcuts belong to `apps/moment-studio/frontend/index.html`, `cards.css` and `card-app.js`. Its screen-only materials use the shared platform shell tokens; app tool layouts remain scoped in `packages/ui/workbench.css`, compiled into the existing Tailwind bundle. New Studio visitors without a platform theme preference use the shared light default; saved light/dark/system choices retain shared ownership. Native command search, category filters and transient favorites/recent tools reuse existing editor handlers and routes. Photo drops pass through the existing bounded local photo validator. No renderer, business persistence, schema or external AI integration is added.

Internal visual presentation belongs to `packages/ui/workbench.css`, compiled into the existing Tailwind `premium.bundle.css`. Static pages identify their owning app with `data-ui-app`; shared controls and app-scoped workbench, preview, guide, table, dialog and navigation treatments use the shared mint/light/dark CSS tokens. Decorative tool marks reuse the allowlisted native `home-art.svg` sprite. The layer is screen-only and does not alter canvas contents, print rules, business handlers, permissions, preferences or persistence. App-owned layouts and workflows remain in their existing modules; do not style game timing or exported artwork through this layer.

The public dashboard presentation is owned by `apps/portal/frontend/home.css` and the native vector sprite `home-art.svg`. Static HTML and `publicHome()` ship matching real tool links, a desktop shortcut rail and decorative sculptural icons. The existing finder mounts inside the public tool heading; authenticated finder behavior remains unchanged. Shared presentation tokens use mint accents, while light/dark/system preference handling, Hindi translation, app access and exports retain their existing owners. Both dashboard assets are explicitly allowlisted; no new tool, fake live metric or connected sponsor is added.

AdSense integration belongs to `packages/ui/adsense.cjs`. Only anonymous `/` responses receive publisher `ca-pub-1894051755496526`, verification meta tag and async advertising script. Any `chambers_session` cookie suppresses it, even when stale; sign-in, tools and private workspaces retain their original CSP. Node and Cloudflare render a fresh response nonce onto every homepage script, with the user-approved Google-compatible strict CSP on that response only. Cloudflare removes the static homepage asset CSP before applying the dynamic policy. `/ads.txt` exports `packages/ui/ads.txt`; root-domain discovery, AdSense approval, Auto ads/manual slot configuration and Google privacy messages require account/domain configuration and are not established by the code. No ad-unit ID or real ad impression has been verified.

WhatsApp contact is a frontend flow owned by portal forms and `packages/ui/whatsapp.js`, `whatsapp-engine.mjs` and `whatsapp.css`. Only named enquiry fields and page path enter a reviewable draft for +91 78741 66009. No automatic delivery, app-record access, platform API write or form persistence is introduced. Static navigation exposes WhatsApp, Support Us and Watch demos. Visitors send from WhatsApp; delivery/recipient registration are not verified.

Ritual Assist owns its stateless calendar backend in `apps/ritual-assist/backend`. `server/index.js` composes public `POST /api/ritual-assist/calendar`; bounded Indian/IST inputs run in worker threads without SQLite writes or retained death records. Cloudflare independently serves guides/form; calculation requires Node. App-owned content modules provide 15 bilingual guides.

Ritual calendar reminder/pack exports belong to app-owned frontend modules: `calendar-export.mjs` generates individual ICS events, `preparation-pack.mjs` prepares original guide content/text and `calendar-tools.mjs` manages transient selections, checks, responsibilities and dedicated print/PDF. No account/provider connection, saved record, schema or external message delivery is introduced. Uncertain/conditional dates remain in the pack but are excluded from reminder exports. New modules are explicitly allowlisted and exported to Cloudflare.

Public information routes `/privacy`, `/terms`, `/contact`, `/legal` and `/legal/third-party-notices` belong to the portal frontend. Their static shared footer belongs to `packages/ui/legal-footer.css`; no browser tracking, legal-form submission or storage is introduced. All pages link to them without JavaScript; Cloudflare independently serves the routes and slash aliases. Information reflects current app storage/limitations, with operator/contact details explicitly pending until supplied. See `docs/LEGAL_SOURCE_REGISTER.md` for notices and unresolved rights decisions.

This is an npm workspace monorepo. The retained local deployment shares one Node API and uses `(localdb)\MSSQLLocalDB / SushantSynapsePlatform`, with `platform`, `chambers`, `batchfee`, `samaj`, `tournament`, `news`, `fundlens` and `satire` schemas. Production uses `server/edge-index.mjs` on Cloudflare Workers and the `PLATFORM_DB` D1 binding, including Arena and private Chambers document BLOBs. Private APIs never fall through to the laptop. Cloud writes are authoritative after cutover and are not synchronized back to SQL Server. SQLite is retained for isolated compatibility tests and source recovery. See `docs/SQLSERVER_MIGRATION.md` for the preserved local runtime.

```text
apps/
  portal/
    frontend/          Platform home, catalogue, account screens
    backend/routes.js  Favourites, recent launches and app access
    tests/             Portal browser workflows
  advocate/
    frontend/          Chambers screens, legal icons and styles
    backend/           Business routes, validation, store and settings
    database/schema.sql
    tests/             Chambers browser workflows
  fund-overlap/
    frontend/          Fund Lens UI and pure browser comparison engine
    backend/           Public reference routes, national providers and cache
    ingestion/         Official PPFAS refresh and national saved-portfolio refresh
    data/              Public, versioned reference snapshots and small fund index
    tests/             Chrome workflows and official spreadsheet parser fixtures
packages/
  auth/                Sessions, passwords, profiles and staff accounts
  app-registry/        Catalogue entries and available app paths
  database/            SQL connection, shared schema and transactions
  ui/                  Shared browser theme preferences
server/                Composition, HTTP checks and static asset allowlist
infrastructure/        Docker image, Compose and HTTPS proxy
docs/                  Architecture, deployment and functionality ledger
tests/                 Cross-app API and production configuration tests
```

## Dependency boundaries

The promotional showcase belongs to `apps/portal/frontend/showcase.html`, `showcase.js` and `showcase.css`, served at `/showcase` with a screen-only query mode. It renders eleven explicitly illustrative sample scenes in native HTML/CSS; no iframe, account, ad SDK, backend request, business persistence or app execution is involved. The elapsed-time player supports pause/navigation/duration/fullscreen, respects reduced motion and pauses on hidden documents or focused scene links. HTML export has been removed; the hosted player and screen mode remain. Cloudflare serves both page routes independently; this is a promotional platform page, not another app registry entry.

Support Us belongs to `apps/portal`: `/support` is a public frontend route; `/api/support` returns active recipient details or an empty disabled configuration. `backend/support.js` composes through `server/index.js`; `/api/platform/support` GET/PUT uses the shared Owner session check, bounded JSON validation, SQLite `settings` key `platform-support` and audit transaction. No schema changes or payment records are added. SQL export includes these settings; Chambers JSON backup remains scoped to Chambers settings. The Cloudflare page loads independently, while configuration and owner changes require the existing Node origin. It fails closed during backend outages, with no cached payment destination. QR encoding uses a local MIT-licensed qrcode 1.5.4/dijkstrajs browser bundle with no CDN, advertising scripts or new runtime dependencies. Both licenses are retained in `apps/portal/SUPPORT-QR-LICENSE.txt`.

Fund Lens public comparison routes run independently in the Cloudflare Worker. `infrastructure/cloudflare/fund-sources.mjs` reuses app-owned MFapi/Tickertape/Groww validation, bundles only the official public reference index/snapshots, and caches public verification progress at the edge. Each invocation bounds upstream requests to 36; HTTP 202 asks the browser to continue verification before computing any comparison. Cache eviction can require re-verification. Private legacy portfolio/watchlist routes still proxy to authenticated Node/SQLite. No business state is migrated.

DIGITAL SAMAJ is owned by `apps/digital-samaj`, served at `/digital-samaj` and `/api/digital-samaj`. The user explicitly selected integration with Node, shared sessions and SQLite instead of a separate Next.js/.NET/PostgreSQL service. App-scoped permission bundles, geographic/family/self grants, privacy projections, person/family/relationship repositories, review/import workflows and participant-only messaging are separate backend modules. Two additive schema files register app tables in full SQL export. Person identity is independent of login accounts; family contexts join the same person rather than duplicate it. The five-section browser registration autosaves drafts and individual person photos in SQLite; legacy ten-step drafts map to the new sections without discarding their data. Person photo removal detaches the current reference and retains its blob; new group-photo controls are absent. See the app README for verification, privacy and operational limits.

Cloudflare frontend deployment is owned by `infrastructure/cloudflare`. Its build exports only `server/static-assets.js`'s public allowlist plus the shared availability UI, never runtime data or backend source. A Worker route on the existing tunnel hostname serves these assets and proxies `/api/*` and `/healthz` to the unchanged Node origin. News, Certificates, Timetable Lite and the homepage can load independently; other page routes check backend health and serve `apps/portal/frontend/unavailable.html` during outages. `packages/ui/availability.js` shows mid-session connection failures without replaying writes or discarding form input. Cloudflare preview hosts intentionally have no backend connection. SQLite ownership and all API enforcement remain on the existing server.

Tournament Lite is owned by `apps/tournament-lite`, served at `/tournament-lite` and `/api/tournament-lite`. Its format/progression engine is separate from sport scoring rules. Organizer routes enforce shared app access, Owner/Advocate roles, account ownership and optimistic revisions; explicit published-token GET routes are public. App-owned SQLite snapshots and an additive migration marker are registered for full SQL export. Public responses exclude organizer contact and team rosters. No browser business-state storage or external sport service is used.

The server creates the database and app handlers. It injects the database and authentication helpers into each handler. App routes must enforce their own app access before reading or writing business data. Shared authentication receives an initialization callback from the server, so it does not import Chambers-specific settings.

`PlatformDatabase` owns identity, access, preferences, settings and audit storage. The advocate store extends it with Chambers data access, migration, backups and reporting. The server currently creates that combined store because Chambers is the first available app. New apps should use their own repositories over the shared connection; do not add their business methods to the advocate store.

Shared UI contains theme preference storage and the platform header stylesheet used across every implemented app. Headers share the platform logo, typography, spacing, home navigation and visible theme controls; private workspaces retain their app actions. Each app retains its own content styles and icons. The public homepage includes its launch cards in HTML before JavaScript loads; `/signin` provides optional account entry. Portal and News asset URLs are release-versioned and HTML is served with no-store caching.

`packages/ui/theme.js` owns the shared light/dark toggle markup, accessible pressed state, device preference persistence and cross-tab synchronization. App theme handlers still apply their own root/body theme attributes. New visitors default to light; existing saved light/dark choices and explicit system preferences are retained. System preferences follow the device setting; blocked storage falls back to in-memory preference. Shared header CSS owns the sun/moon control, including keyboard focus and reduced-motion styling.

The shared tactile presentation belongs to `packages/ui/premium.css`, with build-time Tailwind composition in `premium.tailwind.css`. `npm run build:ui` generates the tracked, minified `premium.bundle.css`, served as `/shared/premium.css`; `npm run build:frontend` compiles it before the existing allowlisted export. Tailwind preflight is excluded to preserve app semantics and no browser compiler/CDN is used. All app pages load the visual layer after their owning styles; the unchanged legal notices page receives it through the shared header import. Screen-only tokens, glass surfaces, bento catalogues, touch feedback, hover and reduced-motion rules are shared; engines, generated canvas/SVG artwork, document exports and print styles remain app-owned.

Fund Lens performs comparisons entirely in the browser. Its JSON artifacts are public reference data, not workspace business state. News also has an independent Cloudflare source-metadata route, with shared parsing/templates in `apps/news/frontend/engine.js`. During backend outages the browser generates temporary tab-only editions; no browser business-state persistence or SQLite replacement is introduced. The Worker tries Indian Express archives and falls back to fixed BBC News public feeds, validating IST dates and bounding requests, response sizes, cache lifetimes and per-location rate limits. Shared archives remain unavailable until the backend returns. Reference reads and News published edition/status/archive reads are explicitly routed before the shared login gate. Fund Lens portfolio/watchlist routes still require a session and app access; News generation is public and validated, while operational preview routes require owner access. Shared per-date leases, cooldowns and persisted request budgets bound generation. Chambers and platform preferences remain protected.

## SQL ownership

SQL Server native migrations live in each owning `database/sqlserver` directory (shared identity under `packages/database/sqlserver`). Production repositories use schema-qualified object references; the SQLite compatibility adapter maps those registered references to existing tables without renaming or replacing user data. Ordered SQL Server migrations have immutable checksum entries in `platform.schema_migrations`. A read-only SQLite source importer requires an empty SQL target and verifies per-table contents, blobs and constraints before committing; live sessions are excluded. Production data has not been migrated merely by adding this backend.

The initial SQL backend retains synchronous repositories through a driver worker and serializes SQL-backed API requests in SERIALIZABLE transactions with an application lock; permission/business validation and mutations share the transaction, and successful responses wait for commit. This is a conservative first conversion for one workspace, not a high-throughput asynchronous database architecture. App-owned repositories and narrower asynchronous transaction boundaries are follow-up work before scaling. See the migration guide for operational limits.

Quiet sponsorship display is shared UI in `packages/ui/sponsorship*`; the portal owns `/sponsor` and its public `sponsor-config.mjs` publishing configuration. Only six explicitly allowed public locations can display reviewed paid text/link creatives. The component reads no app inputs, makes no advertiser requests and adds no tracking or business persistence. Publishing configuration contains no bookings, leads or payment data; any future campaign-management business records must use validated role-enforced APIs and SQLite. The enquiry page prepares local drafts without submitting or storing leads. Cloudflare serves the sponsorship page/assets independently; no network advertising SDK or payment service is connected. See `docs/MONETIZATION.md`.

The 2026-10-09 additions register `apps/batchfee-lite/database/002-staff.sql` and `apps/digital-samaj/database/003-events.sql` through their owning handlers. Schema text contains DDL; migration-marker inserts run separately, so full SQL exports do not insert the same marker twice. Hearing-preparation templates create ordinary case-linked Chambers tasks through validated, transactional APIs. Timetable absence plans are separate, temporary cover sheets and do not replace its explicitly device-owned weekly setup. See `docs/PLATFORM_AUDIT_IMPLEMENTATION.md` for complete scope and operational limits.

News owns additive migrations under `apps/news/database`, registering editions, stories, run snapshots and budgets for SQL export. `repository.js` validates and atomically stores immutable daily editions. `fetch-service.js` persists source snapshots, leases and attempt budgets, supports historical IST cutoffs and rejects future dates. `archive-provider.js` reads bounded fixed-host Indian Express daily archives and article metadata, verifies publication dates and balances/deduplicates topics including entertainment. `publication.js` creates short credited excerpts and locally templated fictional comic dialogue. Legacy PIB editions/adapters remain preserved. Any visitor can generate a present or past edition through the validated fetch endpoint; any visitor can read saved editions. No arbitrary content publication endpoint or automatic scheduler exists.

The retired personal portfolio interface is no longer loaded or served. Its backend and data remain for compatibility and preservation. Personal Fund Lens portfolios use app-owned `fund_lens_portfolios` and `fund_lens_transactions`, created by the additive `apps/fund-overlap/database/001-portfolio.sql` migration and tracked in `fund_lens_migrations`. `registerAppSchema` registers the schema and export-table list on the shared database; the composition-created Fund Lens handler initializes it before serving requests. Full SQL exports include the new schema and rows. Chambers JSON backups retain their Chambers-only scope. App routes derive ownership from the session, validate edits/imports and enforce optimistic revisions. No portfolio details enter the shared Chambers activity feed. Account-private API access does not prevent an administrator from accessing the full database/SQL backup.

The retired analytics/watchlist interface is no longer loaded or served. Fund Lens watchlists are account preferences stored under `fundLensWatchlists` in the existing SQLite `platform_preferences` row. App-owned validated routes enforce access and derive the owner from the authenticated session. Up to 10 lists of four exact scheme codes are supported. NAV history is public reference data cached separately; hypothetical investment amounts stay in browser memory. `analytics-engine.js` holds pure return/exposure/SIP calculations and `analytics-ui.js` owns their interface.

`packages/database/schema.sql` contains shared tables. `apps/advocate/database/schema.sql` contains Chambers tables and reporting views. Both are applied when opening the database, and both are included in the full SQL export. Existing names, IDs, rows, documents and the `data/chambers.sqlite` path are preserved.

These files are idempotent baseline schemas for version 2, not a general incremental migration framework. Future schema changes should add ordered, tracked migration files in the owning database directory and test upgrading an existing database. Future apps should use app-prefixed tables to avoid collisions. This is still one organisation, not tenant-isolated SaaS.

## Add another app

1. Create `apps/<app-id>/` with `frontend/`, `backend/`, `database/` when needed, `tests/` and a private `@synapse/<app-id>` package manifest.
2. Implement its handler with explicit app-access and role checks. Register it in `server/index.js` under `/api/<app-id>/`. Existing Chambers `/api/*` routes are retained for compatibility.
3. Add its public page and assets to `server/static-assets.js`; the server never serves arbitrary repository paths.
4. Register its catalogue entry in `packages/app-registry/index.js`. Keep the status Planned until its implementation is usable and verified.
5. Add isolated tests and update `docs/FUNCTIONALITY_LEDGER.md`. Keep business data and secrets out of Git.

## Commands from the repository root

```sh
npm ci
npm start
npm test
npm run test:e2e
npm run test:advocate
npm run test:portal
```

`server.js` is a compatibility launcher. The canonical entry point is `server/index.js`. Deployment still uses a single image and persistent database volume; see `DEPLOYMENT.md`.

National fund discovery uses MFapi; holdings use Tickertape with exact-family Groww fallback. Public reference versions live in DATA_DIR/fund-overlap-cache, never in Chambers business tables. SHA-256 version checks and atomic pointer publication preserve last-good data. Provider outages are explicitly marked; catalogue coverage and holdings coverage are separate.

## Timetable Lite ownership

`apps/timetable-lite/frontend` owns the public `/timetable-lite` planner. `engine.js` provides pure validation, bounded scheduling and atomic move/swap checks; `worker.js` keeps generation off the UI thread; `export.js` owns PDF, PNG, ZIP and print output. The user explicitly approved device-local storage for this app on 2026-09-27. Validated JSON imports/exports provide manual backup. No timetable API or database migration is installed; existing SQLite-backed apps retain their persistence and authorization boundaries.

## BatchFee Lite ownership

`apps/batchfee-lite` owns the private `/batchfee-lite` academy app and `/api/batchfee-lite` routes. `backend/engine.js` validates commands and deterministically generates fee obligations and payment allocations in integer paise. `backend/routes.js` persists the workspace snapshot and append-only command history in app-prefixed SQLite tables, with immediate transactions, optimistic revisions and idempotent request IDs. The additive version-1 schema is registered in full SQL exports. JSON app backups replay validated commands and cannot replace conflicting or newer history. Financial state stays in SQLite; browser storage holds theme preference only.

V1 is owner-only, represented by `ownerOnly` catalogue metadata and enforced by shared app access plus the app handler. One academy shares the existing platform deployment; this is not multi-tenant SaaS. Optional staff assignment and offline synchronization are deferred. No changes to Chambers records, schemas, legacy migration source or persistence path are required. The app has no runtime npm dependencies.

## Certificate app ownership

Current public implementation is under apps/moment-studio; /certificates and its assets are compatibility aliases. The original package source is retained as history.

`apps/certificates/frontend` owns the public `/certificates` page. `app.js` manages transient form and image state; `renderer.js` defines template geometry and bounded text fitting; `export.js` writes a single A4 PDF and downloads. Both image formats and print reuse that renderer. No backend handler, schema or certificate persistence is needed. The user explicitly approved device/browser storage for reusable organisations on 2026-09-27. App-owned, validated localStorage stores up to 10 organisation names, reduced-size logos and positions on explicit save; recipient details and signatures remain transient. Future account-synced branding, history or verification must introduce app-owned authenticated routes and additive migrations rather than storing recipient data in shared preferences.

## Daily Spark ownership

apps/daily-spark/frontend owns /daily-spark. engine.mjs supplies versioned deterministic IST puzzles, arithmetic and a bounded four-number solver. play.mjs owns the reusable transient game controller, hints and explicit sharing; app.js mounts it for the standalone page and view.mjs supplies markup for the hub. No backend, schema, persistence or external provider is used. Shared theme preferences are the only browser persistence. Static assets are allowlisted and both page routes bypass origin health checks in Cloudflare. Shared daily links preserve the v1 puzzle seed by date.

## Decision Wheel ownership

apps/decision-wheel/frontend owns /decision-wheel. engine.mjs validates bounded unique options, uses rejection-sampled browser cryptographic randomness and calculates exact pointer landing angles. app.js owns SVG rendering, animation locks, transient recent picks, winner removal and explicit result sharing. No backend routes, schema or persistent game/business state are introduced. Shared theme preferences are the only stored browser data. Both public page routes bypass Cloudflare origin health checks and all assets are explicitly allowlisted.

## Celebration Studio ownership

Current public implementation is under apps/moment-studio; /celebration-studio and its assets are compatibility aliases. The original package source is retained as history.

apps/celebration-studio/frontend owns /celebration-studio. renderer.mjs owns bounded field validation, English/Hindi starter copy, canvas geometry/text fitting, output sizes, design palettes and Unicode-safe filenames. app.js owns transient editor/photo state, version-guarded local image decoding/resizing, PNG download and explicit native file sharing with download fallback. No backend route, SQL schema, browser business-state persistence or external content provider is added. Only shared theme preferences persist. Both public page routes are independent of the Cloudflare origin health check; assets are explicitly allowlisted. Artwork is canvas-native rather than generated raster assets.

## Team Mixer ownership

apps/team-mixer/frontend owns /team-mixer. engine.mjs owns bounded Unicode name validation, rejection-sampled randomness, Fisher-Yates shuffles and balanced-size team allocation with randomized extra-member placement. export.mjs owns dynamically sized canvas cards with grapheme-aware full-name wrapping and local PNG downloads. app.js owns transient results, staggered/reduced-motion reveal, stale-result clearing, edit/export locks and explicit list/card sharing. No backend route, SQL schema, persistent participant state or external service is introduced. Only shared theme preferences persist. Both public page routes bypass Cloudflare origin health checks and all assets are allowlisted.


## Ritual Assist ownership

The app also owns `/ritual-assist/calendar`, `calendar.js`, the module worker, pure `panchang.mjs` and vendored MIT Astronomy Engine. Calculations run locally in tab memory; no backend persistence or provider connection is introduced. Static allowlisting and independent Cloudflare routing include the calendar. Tithi boundaries, Aparahna overlap selection, month convention and conditional/withheld dates are app-owned; third-party provenance and approximate accuracy limits live in the app README.

`apps/ritual-assist` owns public `/ritual-assist`, bilingual Hindu preparation content and pure search/text-export helpers in `frontend/guides.mjs`. The editor keeps per-guide checks in tab memory, with explicit text download, copying, guide-link sharing and print output. Only shared theme preferences persist. No backend, schema, business-state storage, provider calls, calculated muhurat or bookings are installed. Node static allowlisting and Cloudflare independent routing serve both page routes. References retain their tradition-specific scope; the guides do not claim a universal vidhi or priest approval. See the app README for content scope and operational limits.

## Moment Studio ownership

apps/moment-studio owns the combined public cards/certificates UI, both renderers, immutable platform branding and pure bilingual condolence suggestions. Legacy certificate/celebration pages and assets alias its implementations through the static allowlist. Old saved organisation branding uses its existing explicitly approved browser key. App registry aliases project legacy favourites/launches to moment-studio without database rewrites. No schema, payment service or removal entitlement exists; paid removal later requires trusted server exports.


## Take a Break ownership

`apps/take-a-break/frontend` owns `/take-a-break`, its hub, four new native games and original bilingual clues. `engine.mjs` supplies deterministic versioned daily boards, immutable memory/bracket operations and bounded validation. Make 24 reuses the Daily Spark engine/controller; Decision Wheel retains its existing page with return navigation. Daily dates are validated and use IST; practice state is transient. There are no backend routes, schema changes, game persistence or external content providers. Shared theme preferences are the only stored browser data.

The catalogue deliberately retains the existing `daily-spark` API ID for Take a Break to preserve SQLite preferences. Decision Wheel keeps its existing launch/favourite ID. The default catalogue and finder show one hub; favourites/recent entries remain intact. The portal normalizes older backend catalogues so this frontend-only release does not need a Node restart. All static routes are allowlisted and the Cloudflare page bypasses origin health checks.

Shared footer language: `packages/ui/language.js` remembers English/Hindi in device-local `synapse-language` storage. It translates shared navigation and public homepage copy and synchronizes existing Ritual Assist/DIGITAL SAMAJ selectors. Other app bodies and user-entered artwork/records retain their existing languages; the Hindi footer states this limitation. No external translation service or business persistence is involved.

Satire Arena at `/satire-arena` (alias `/arena`) is a public app owned by `apps/satire-arena`. Cloudflare serves its static page and proxies the API to app-owned Node routes, which reuse the ballot validation/identity contract in `backend/edge.mjs`. Its `satire` SQL schema stores all three historical ballot generations and a latest-ballot scoreboard view in the same platform database. Voting remains browser-based and informal, independent of account/person verification. A dedicated empty-target importer preserves D1 history and identities without replacing other apps; the existing signing secret must be transferred privately. Current live D1/deployment remains unchanged until verified cutover. Preview cannot proxy production votes; explicit legacy D1 mode remains for controlled migration. See `apps/satire-arena/README.md` and `docs/SQLSERVER_MIGRATION.md`.

Arena expansion (2026-10-10): six characters and six reactions share `frontend/catalogue.mjs`. Garland/Applause count as Fans, Shoe/Middle finger/Tomato as Critics, and Just laughing as Amused. New characters use original code-authored SVG artwork, with no added external assets/services. Additive `002-expanded-arena.sql` preserves the original vote table and introduces expanded ballots plus a latest-ballot view. Atomic batches replace legacy votes on changes and remove both storage generations on deletion. The view deduplicates deployment-overlap ballots by timestamp and prioritizes expanded storage on ties. Apply both schema files to fresh development databases. Existing browser identities, signing secret, rate limits and IST rounds are unchanged.
