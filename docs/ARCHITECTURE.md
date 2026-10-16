# Code ownership and adding apps

Landing discovery (2026-10-16, local): portal-owned `home-discovery.js` enhances
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

Focus owns `/focus` under `apps/focus`. By the user's explicit browser-only preference, its timer and daily tasks need no account. Task state persists in localStorage (`synapse-focus-plan-v1`), with validation, capacity limits, cross-tab refresh and safe write-failure handling. `task-model.mjs` owns optional per-lane order metadata, backwards-compatible task commands and validated priority/reorder/edit changes. `app.js` owns the priority board, pointer dragging with cancellation/autoscroll, keyboard/touch alternatives, completed/carry lists and native task editor. `focus-timer.mjs` owns 15/25/50/custom 5–120-minute preferences (`synapse-focus-duration-v1`) and transient wall-clock sessions; duration controls stay locked until reset/completion. Presentation stays app-owned and uses shared theme tokens. This exception applies only to Focus; shared authentication, preferences and other app business records remain database-backed. Existing account-scoped cloud Focus plans and their authenticated legacy API are preserved. Task validation is an app-owned frontend module reused by that legacy API. Pocket Pause stays separate for breaks. Shared registry, home discovery and app switching expose Focus.

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

## Pocket Pause ownership

apps/pocket-pause owns the public page, transient bubble/canvas/audio state and pure elapsed-time circle engine. No backend, persistence or schema. Both page routes bypass Cloudflare origin health checks; no business data is written.

Pocket Pause scenes.mjs owns bounded fictional prop progression and canvas rendering for computer, TV, crockery and memo scenes. app.js owns per-tab states, explicit rebuilds, shared opt-in audio and bounded/reduced-motion fragment effects. No new service or persistence.

## Ritual Assist ownership

The app also owns `/ritual-assist/calendar`, `calendar.js`, the module worker, pure `panchang.mjs` and vendored MIT Astronomy Engine. Calculations run locally in tab memory; no backend persistence or provider connection is introduced. Static allowlisting and independent Cloudflare routing include the calendar. Tithi boundaries, Aparahna overlap selection, month convention and conditional/withheld dates are app-owned; third-party provenance and approximate accuracy limits live in the app README.

`apps/ritual-assist` owns public `/ritual-assist`, bilingual Hindu preparation content and pure search/text-export helpers in `frontend/guides.mjs`. The editor keeps per-guide checks in tab memory, with explicit text download, copying, guide-link sharing and print output. Only shared theme preferences persist. No backend, schema, business-state storage, provider calls, calculated muhurat or bookings are installed. Node static allowlisting and Cloudflare independent routing serve both page routes. References retain their tradition-specific scope; the guides do not claim a universal vidhi or priest approval. See the app README for content scope and operational limits.

## Moment Studio ownership

apps/moment-studio owns the combined public cards/certificates UI, both renderers, immutable platform branding and pure bilingual condolence suggestions. Legacy certificate/celebration pages and assets alias its implementations through the static allowlist. Old saved organisation branding uses its existing explicitly approved browser key. App registry aliases project legacy favourites/launches to moment-studio without database rewrites. No schema, payment service or removal entitlement exists; paid removal later requires trusted server exports.


## Take a Break ownership

`apps/take-a-break/frontend` owns `/take-a-break`, its hub, four new native games and original bilingual clues. `engine.mjs` supplies deterministic versioned daily boards, immutable memory/bracket operations and bounded validation. Make 24 reuses the Daily Spark engine/controller; Decision Wheel and Pocket Pause retain their existing pages with return navigation. Daily dates are validated and use IST; practice state is transient. There are no backend routes, schema changes, game persistence or external content providers. Shared theme preferences are the only stored browser data.

The catalogue deliberately retains the existing `daily-spark` API ID for Take a Break to preserve SQLite preferences. Wheel/Pocket entries carry `catalogueParent` metadata and remain valid legacy launch/favourite IDs. The default catalogue and finder show one hub; favourites/recent entries remain intact. The portal normalizes older backend catalogues so this frontend-only release does not need a Node restart. All static routes are allowlisted and the Cloudflare page bypasses origin health checks.

Shared footer language: `packages/ui/language.js` remembers English/Hindi in device-local `synapse-language` storage. It translates shared navigation and public homepage copy and synchronizes existing Ritual Assist/DIGITAL SAMAJ selectors. Other app bodies and user-entered artwork/records retain their existing languages; the Hindi footer states this limitation. No external translation service or business persistence is involved.

Satire Arena at `/satire-arena` (alias `/arena`) is a public app owned by `apps/satire-arena`. Cloudflare serves its static page and proxies the API to app-owned Node routes, which reuse the ballot validation/identity contract in `backend/edge.mjs`. Its `satire` SQL schema stores all three historical ballot generations and a latest-ballot scoreboard view in the same platform database. Voting remains browser-based and informal, independent of account/person verification. A dedicated empty-target importer preserves D1 history and identities without replacing other apps; the existing signing secret must be transferred privately. Current live D1/deployment remains unchanged until verified cutover. Preview cannot proxy production votes; explicit legacy D1 mode remains for controlled migration. See `apps/satire-arena/README.md` and `docs/SQLSERVER_MIGRATION.md`.

Arena expansion (2026-10-10): six characters and six reactions share `frontend/catalogue.mjs`. Garland/Applause count as Fans, Shoe/Middle finger/Tomato as Critics, and Just laughing as Amused. New characters use original code-authored SVG artwork, with no added external assets/services. Additive `002-expanded-arena.sql` preserves the original vote table and introduces expanded ballots plus a latest-ballot view. Atomic batches replace legacy votes on changes and remove both storage generations on deletion. The view deduplicates deployment-overlap ballots by timestamp and prioritizes expanded storage on ties. Apply both schema files to fresh development databases. Existing browser identities, signing secret, rate limits and IST rounds are unchanged.
