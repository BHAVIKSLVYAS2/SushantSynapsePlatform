# Curio product and technical audit

Audit date: 31 October 2026. Baseline implementation: `50a32b8` (production
implementation `2d80b9a`, Worker `d99da508-da11-4ca4-aba9-c26a5569e165`).
The user requested an inventory before implementation, then clarified: implement
only needed, confirmed and practical changes. The supplied Phase 2 prompt stops
within Photo Resize; no additional app-specific requirements were invented.

Release update: user subsequently authorised commit/deploy. Implementation
`640e4db` is live as Worker `fcc3df9c-bea0-4bb5-9c6c-aacd9ee82eac`. Live synthetic
image/download/crop/density checks, eight layout/theme states and all 14 utility
sitemap entries pass, with no page errors, production accounts or business writes.
Evidence: `.publish/curio-growth-deploy.log`, `.publish/curio-growth-live.log`.
This supersedes the historical local-only implementation status below.

## Implementation outcome

Completed locally after the baseline/research: Photo Resize now offers explicit
proportional fit or exact crop, in-form mobile crop preview/position/zoom/rotation,
JPEG/PNG/WebP conversion, minimum and maximum byte checks, reviewed output,
explicit enlargement warnings, debounced local size estimates, cancellation and
separate source/output revisions. It preserves the existing simple fit workflow.
Real JPEG JFIF density supports the named physical-size example; output below a
minimum is visibly marked for review rather than padded or falsely accepted.

Only two official profiles were admitted: current Indian e-Visa square-image
guidance, and explicitly historical SSC CHT 2026 signature guidance. The chosen
working pixels and conservative byte caps are identified as implementation choices,
not official pixel requirements or acceptance guarantees. General passport work
uses custom requirements. Background/face/blur approval and bulk unattended crops
were not added. Every source image still stays local.

Added Photo canonical/OG/help content; updated the existing registry/search/home
copy to discover photo/signature functionality and regenerated its delivery files.
The root sitemap now includes a reviewed public utility route list; Arena's own
sitemap is unchanged. Private/governance/client routes, Vedic noindex previews,
retired products and duplicate certificate/game aliases are excluded from that
addition. No licence, permission, schema, production data or provider changed.

Final focused evidence: 18/18 Node checks and 12/12 browser workflows pass,
including existing fit/discovery compatibility. Browser tests inspect actual
PNG/WebP bytes, JPEG JFIF density, crop color pixels/dimensions, conservative
byte ranges, under-minimum failure, impossible exact PNG limits, decode/settings
races, cancellation/stale output, keyboard controls and width/theme layouts.
Artifacts: `.publish/curio-growth-unit.log`,
`.publish/curio-form-final-browser.log`. Mobile crop light/dark screenshots were
visually inspected. Production-config Worker dry run passes with `--keep-vars`
(`.publish/curio-growth-packaging.log`); final estimate-label checks also pass
2/2 (`.publish/curio-estimate-browser.log`); the optional blank-minimum/WebP
follow-up passes 1/1 (`.publish/curio-optional-minimum-browser.log`). No commit
or deployment performed.

Live GET-only baseline confirmation: home, Photo Resize, sitemap and robots all
returned 200; the deployed Photo page lacked a canonical and its URL was absent
from the deployed sitemap. Evidence: `.publish/curio-live-baseline.log`; no accounts
or business writes used. This live baseline does not verify the unshipped changes.

## Evidence and limits

Inspected the app registry, explicit public asset maps, app READMEs, controllers,
engines/adapters, schemas, auth, shared navigation/theme/language, edge routing,
production build/configuration, SEO responses and relevant browser tests. Directory
names alone do not establish a live app. The inventory reconciles 20 catalogue
products, operational surfaces, additional public routes and retired workspaces.

The existing isolated survey ran with disposable temporary SQLite fixtures:
`node infrastructure/ui-ux-audit.cjs curio-20261031`. Evidence:
`.publish/curio-product-browser-audit.log` and
`.publish/ui-ux-audit/curio-20261031/inventory.json`.
It visited **70 screens / 560 initial width-theme states**, using 320, 390, 768
and 1440px in light/dark themes, public/legacy-owner/synthetic Master Admin and
Super Admin contexts. No surveyed page errors or document horizontal overflow.
This is not 560 functional tests, a WCAG certification, a penetration test, or
field Core Web Vitals. Authenticated D1 workflows were inspected in code and
existing tests; this survey's authenticated runtime uses isolated Node fixtures,
not production accounts. No production records/configuration were changed.

Expected fixture responses include private/editor 401s, Arena 503s without the
fixture's production cookie-secret configuration, and visitor-counter 429s during
the automated burst. These are recorded, not misrepresented as successful API
checks or evidence of production outages. Existing functional tests are cited
where appropriate; they were not all rerun as part of this baseline survey.

## Product inventory

Common mobile/SEO notes are expanded below. “Responsive surveyed” means initial
layouts only. Local tools still load the shared shell, preferences, visitor
counter and eligible advertising: “files processed locally” does not mean zero
network traffic across the whole page. No paid API is required for their core work.

| Product, route and audience | Verified existing functionality | Identity, data and integrations | Confirmed gap or scoped opportunity; mobile/performance/SEO |
|---|---|---|---|
| **Photo Resize** `/photo-resize`; Indian applicants and anyone preparing images | JPEG/PNG/WebP decode, 12 MB/24 MP bounds, target 10–5000 KiB, proportional maximum dimensions, iterative JPEG compression, white transparency flattening, original/result canvases, byte/dimension comparison, stale-result guards, local download | No login/upload/persistence; browser Canvas/ImageBitmap; shared download helper | Baseline has no exact crop, minimum-byte validation, official form profiles or selectable export format. Reducing dimensions to reach KB can silently violate a form's pixel requirement. Responsive via shared CSS; encoding can make up to 96 asynchronous quality trials. Description exists, canonical/OG absent. **Selected for implementation.** |
| **QR Maker** `/qr-maker`; households, teachers, small businesses | Static link/text **and Wi-Fi** codes, SSID/security/password/hidden network, escaping, 1200 UTF-8-byte bound, quiet zone, local PNG, branded credit | No account/storage/redirect; existing vendored MIT encoder; no remote QR generation | SVG/print-size export is missing; Wi-Fi is already implemented despite a shorter README. Shared responsive styling; encoder work grows with payload. Baseline description, no canonical/OG. |
| **Bill Splitter** `/bill-splitter`; trips/friends/households | Equal, exact, percent, weighted splits; integer-paise/BigInt remainder allocation; up to 100 expenses/20 people; stable payer IDs; live remainder feedback; settlement cards; deletion undo; copy fallback | No login, payment provider, cloud writes or persisted trip; tab memory | Opt-in private trip backup/resume is a real retention gap. Do not rebuild percentage/weighted splits. Responsive surveyed; bounded calculations; baseline lacks canonical/OG. |
| **Focus** `/focus`; students and workers | 15/25/50/custom timer, pause/resume/reset, wall-clock background recovery; saved dated priority task board, drag + keyboard reorder, estimates, edit/reopen/carry unfinished tasks, JSON merge backup and undo | No login; browser task/duration keys; storage-denial handling and cross-tab changes. Legacy account API preserved separately | Actual elapsed focus-session history/task association is missing; estimates are not tracked focus time. Backups already exist. Responsive surveyed; no runtime framework. Baseline lacks canonical/OG. |
| **Timetable Lite** `/timetable-lite`; schools/coaching | Classes/subjects/teachers, qualifications/availability, periods/breaks/holidays, weekly allocations, constraint validation, cancellable worker generation, clash-safe manual moves/undo, teacher/class views, PDF/image/CSV, validated JSON backup/import, **dated substitute cover** | No login; device-local setup; worker solver; no cloud scheduling provider | Do not propose substitution, backup or manual adjustment as new. Better conflict explanations require a separate feasibility review. Solver complexity is bounded but can be substantial. Responsive surveyed; source metadata exists, canonical/OG absent; app README missing. |
| **Ritual Assist** `/ritual-assist`, `/ritual-assist/calendar`; families planning observances | 15 bilingual Shubh/Ashubh guides; learning/mantra/vidhi sections with bounded scope; editable materials, responsibilities/quantity/date, personal additions and removal/restore; opt-in checkmarks; print/text/preview; general vrat and remembrance calendars; PIN/location/rule checks; **ICS/reminder exports and preparation packs** | Public; browser checklist preference/state; bounded public calculation APIs, offline PIN data, pinned astronomy primitives. No external reminder delivery | Editable checklist JSON portability is missing; ICS already exists. Calendar policy/admission and local-custom caveats must remain. Large icon atlas/hero and calculation costs are known audit risks. Initial layouts pass; no standalone canonical/OG at baseline. |
| **Ritvayam** `/rashifal-kundli`, `/rashifal-kundli/rashifal`, `/matching`, `/time-machine` under the same prefix; astrology users | On-device chart/timing calculations, daily local timings/Choghadiya, everyday planet/house prose, Dasha context, eight-factor matching with boundary ranges, consent/admission checks, saved birth-input opt-in, en/hi/gu views and exports | Public verification preview; local validated birth inputs, not report persistence; pinned Astronomy Engine and app-owned rules/worker bundles; no paid horoscope API | Traditional/source validation remains unfinished. **Intentionally noindex/nofollow**; do not market certified accuracy or add to public SEO sitemap. Large lazy bundles/place search remain measurable costs, with recent optimizations already present. Layouts surveyed. |
| **Moment Studio** `/moment-studio`, `/certificates` and `/cards` under that prefix; families/teachers/community organizers | Existing branded certificate/card editors, bilingual starter wording, photo/logo/signature handling, CSV batch certificates, PNG/PDF/print, stored organisation branding, memorial gathering regions; real local-AI adapter and all rewrite controls **behind empty language approval gate** | Public; draft content in memory; optional local branding; native model candidate only, no external AI server; no language approved | Real model/output/font/export qualification remains blocked by unavailable model, not a missing Generate button. Do not re-enable unverified languages. Exports can be memory-intensive; initial layouts pass. Canonicals already exist; certificates alias points to root. |
| **Fund Lens** `/fund-overlap`; Indian mutual-fund researchers | National MFapi catalogue, family/variant grouping and verified aliases, dated official holdings library, identity-checked secondary retrieval, basis-aware overlap/industries/unique holdings, what-if removal and share links | Public; no personal portfolio account; Node immutable/checksummed public reference cache and browser/Worker public source adapters; Python refresh tooling; sources can fail | Automated verified-source freshness operations are not scheduled. No claim of complete/live holdings or investment advice. Request/cache cost and third-party availability matter. Layouts pass; baseline canonical/OG absent. |
| **News / Sushant Synapse Times** `/news`; readers | Dated editions, credited source excerpts, immutable shared archives, date/search/category controls, temporary tab editions when backend unavailable, print/PDF and reading controls | Public reading/generation; Owner operational preview. SQLite shared editions in Node; cloud public source-metadata/RSS fallback; fixed upstreams, response/date bounds and quotas | Do not claim complete historical coverage or cloud-shared archives where only temporary editions exist. Publisher denial/copyright/source budget are risks. Existing local performance audit records layout movement/artwork cost. Two source H1s; canonical/description absent at baseline. |
| **Chambers** `/advocate`; Indian advocates/staff | Cases/clients/hearings/tasks/documents/notes, fees/payments/expenses, reports/activity/archive, atomic hearing outcome + next date, server balance validation, documents, backups, client portal boundaries, **hearing ICS export** | Production licensed organisation + app assignment/role; SQLite default mode separate; D1 tenant record/file ownership. No automatic court sync/payment/message provider | Optional reminder alarms on the existing ICS export are a candidate, not a new calendar. Scoped D1 recovery UI still separate. Do not index private record routes or grant governance business powers. Responsive surveyed; potentially growing record lists require measured pagination work. |
| **BatchFee Lite** `/batchfee-lite`; teaching academies | Batches/students/enrolment/family, scheduled obligation catch-up, oldest-dues allocations and traceable credit, request keys, immutable receipts/reasoned reversals, waivers, CSV/backup/reports/expenses, editable WhatsApp drafts/templates | Organisation-licensed Owner/Manager/Collector/Viewer roles on D1; separate legacy SQLite; integer-paise finances and revisions | Manual follow-up outcome/history could improve retention; drafts already exist and do not confirm delivery. No payment/WhatsApp automation connected. Growth must preserve financial history; bounded aggregate/event size merits monitoring. Private SEO exclusion appropriate; layouts pass. |
| **Tournament Lite** `/tournament-lite`; small organizers/public viewers | Six sports, knockout/round-robin/league/group stages, seeds/BYEs, court/IST schedules, partial racket/board scoring and resumption, standings, explicit public read-only links, polling, stop-sharing, winner PNG | Licensed organisation + app role to organize; public link viewers need no account; D1 event ownership and separate legacy Node mode | Swiss/DLS/ball-by-ball are not implemented; lower priority than organizer usability. Public views must retain revocation/privacy. Bounded 64-entry scheduling; layouts pass. Public result links are distinct from private workspace indexing. |
| **DIGITAL SAMAJ** `/digital-samaj`; private family communities | Person/family registry, multi-generation links/cycle checks, drafts, five-section consented submission, independent verification, directory visibility/grants, profile photos/claims, Vanshavali, in-app member messaging | Licensed organisation + app role **and** Samaj scope grant; D1/SQLite, consent/privacy and account-person link; no public family-index feed | Cross-device access already exists; don't replace with browser storage. Messaging delivery and private-data growth require capacity checks. Initial layouts pass; no private records should enter SEO. |
| **Pandit Booking** `/pandit-booking`; managed pilot customers/operators/Pandits | Approved profiles/service areas, published availability, named requests, buffered confirmation, preparations, role-specific onboarding, concerns/review approval and participant-scoped in-app conversation polling | Licensed organisation/client membership + explicit Owner/Dispatcher/Reviewer/Pandit/Customer role; bounded D1/SQLite aggregate, 850 KB, 400 bookings, 80 messages/conversation; no public registration/payment/external delivery | Public conversion marketplace is **not** ready merely because a route exists. Preserve pilot availability. At-scale indexed entities/recovery/operations need separate design. Responsive surveyed; conditional ten-second polling; private shell not an SEO landing page. |
| **Decision Wheel** `/decision-wheel`; classes/meetings/choices | 2–30 normalized unique options, equal cryptographic random choice, exact animation, reduced motion, opt-in sound, remove/undo winner, last 20 results, explicit sharing/fullscreen | Public; transient options/history; no API or saved wheels | Opt-in local saved lists could support repeat work; weighted odds not currently offered and would change equal-chance positioning. Not unique versus competitors. Responsive surveyed; canvas/SVG motion controlled. Baseline canonical/OG absent. |
| **Team Mixer** `/team-mixer`; teachers/groups | 2–100 names, balanced team sizes, together/apart constraints, max people/team, manual constraint-safe swaps/undo, restore previous result/settings, PNG/copy/share/fullscreen | Public; tab memory; cryptographic allocation, local exports | Reusable opt-in rosters are a possible gap, not “constraints” or swapping. Random balance is headcount, not skill. Responsive surveyed; bounded constraint search/export height. Baseline canonical/OG absent. |
| **Take a Break** `/take-a-break` (`daily-spark` catalogue ID); short breaks | Chaos, Make 24, Code, Memory, Lights Out, Face-Off, embedded Decision Wheel; daily/practice modes, hints/undo/solution honesty, replay/share, reduced-motion celebrations and visibility lifecycle | Public; mostly transient state, deterministic daily seeds, no paid game API | Small Expert bank limits true variety; entertainment is secondary to utility acquisition. Embedded and standalone games share owners, not new products. Layouts pass; source has two H1s and no canonical. |
| **Satire Arena** `/satire-arena`, `/politicians`, `/news-anchors`, `/actors`, `/corporates` under that prefix; humour audience | Fictional cast, yearly changeable browser ballots, shared counts, character pages/copy/artwork, reactions, public results, editorial categories/posts/sample noindex preview and Owner editor | Public reading/ballots; signed HttpOnly browser cookie and SQL/D1 aggregate; governance-controlled editorial writes; metrics opt-in | Moderation/editorial operations and image costs; traffic/repeat-use benefit unmeasured. No new parody scope prioritized. Existing HTML canonical/OG and dynamic sitemap exceed tool-page SEO. Layouts pass in configured sources; fixture missing-secret API 503 is not a live outage claim. |
| **Confessions** `/confessions`; anonymous public stream | Scratch and keyboard reveal, public CAPTCHA-gated submission, bounded messages/expiry, shared polling, legacy pending moderation, report API and removal/reapproval | Public; no stored author identity; SQL/D1 bounded setting, 300 entries/seven-day expiry; transient technical limiter/log data still exists | **Public browser report action is missing**, despite report API; moderation/abuse cost makes growth inappropriate before safety improvement. No claim of anonymity from host logs. Layouts pass; not prioritized for acquisition. |

### Non-catalogue, operational and legacy inventory

| Surface/workspace | Actual status, features and ownership | Improvement scope |
|---|---|---|
| Portal `/`, `/signin`, `/showcase`, `/support`, `/contact`, `/privacy`, `/terms`, `/legal`, `/legal/third-party-notices` | App registry/filter/search/favourites/recent; shared auth/preferences; demo page; support settings/payment links only when configured; static legal/contact information. No standalone business database. Existing support links and WhatsApp drafts are not a new payment/delivery integration. | Clarify practical task entry and indexable app metadata, measure discovery/export funnels without personal inputs. Operator/legal details remain acknowledged incomplete in privacy copy. |
| Feedback `/feedback` | Non-catalogue public requests/bugs/ideas board: search/filter/sort, submit, vote/unvote, comments/report, browser-identity cookie; admin hide/status workflow; SQL/D1 bounded setting, no public account needed. | Already a customer-demand channel. Closing the loop can use existing status/share links; automatic email is not connected. Feedback content is public, not a place for private records. Responsive surveyed; metadata but no canonical baseline. |
| Admin `/account`, `/admin`, `/super-admin` | Separate Worker-enabled asset map; account product cards, organisation home/People/Apps & access/Settings, guided creation/review, licence/date/grace/seats, new-vs-existing app state, confirmations/audit reasons/invitation secrecy/stale versions. Super Admin governs; Master Admin manages own membership, neither automatically receives business roles. | Existing redesign must be reused; do not introduce self-serve licensing/payment assumptions. No indexing of private workspaces. Synthetic role layouts surveyed. |
| Audit and client surfaces `/organisation-audit`, `/platform-audit`, `/client-access`, `/client-portal` | App-owned extensions in guarded Node preview and enabled Worker deployment. Scoped activity, invitation/client record association, separately gated client read projection. | Not missing just because absent from homepage. Recovery/UI completeness remains separate. No public SEO; synthetic allowed/denied states surveyed. |
| `/daily-spark` | Live standalone Make 24 alias/entry reuses its engine in Take a Break; dated/difficulty links retain v1 compatibility and v2 bank properties. | Avoid counting as another catalogue app; consolidate canonicals deliberately rather than break existing challenge links. |
| `apps/certificates`, `apps/celebration-studio` | Historical README/tests; product IDs resolve to Moment Studio for saved preferences. Old public routes/assets return 404; these are not additional working apps. | No resurrection or duplicate landing pages. |
| `apps/pocket-pause` | Empty/non-serving workspace in current file discovery; no explicit public route or package entry found. | Do not advertise or count as implemented. |
| `apps/android-wrapper` | Java/WebView direct-install project; website file picker/download/share/back policy bridges, API 26+, wrapper tests/release tooling. Current README says 1.0.2/version code 3. | Not a Google Play launch. Website changes usually need no APK; native bridge changes do. Physical-device coverage is not implied by desktop Chrome. |
| Dynamic editorial `/satire-arena/characters/:id`, `/posts/:slug`, `/categories/:category`, `/results` | Server/Worker HTML responses, canonical/OG, sample content noindex, public published projections and genuine result data. `/daily` redirects. | Keep publication validation and noindex samples; grow practical tools' discoverability without copying editorial publication semantics. |

## Architecture and data

The stack is vanilla HTML/CSS/ES modules, shared token CSS/Tailwind build, Node
HTTP composition (`server/index.js`), app-owned business engines/adapters,
native SQLite in default Node mode and Cloudflare Workers/D1 in production.
`server.js` is compatibility only. Explicit `server/static-assets.js` and app
asset maps control delivery; `infrastructure/cloudflare/build.cjs` exports and
transforms them. esbuild bundles Vedic/shared language sources, with generated
outputs not intended for direct edits. No framework/database replacement is needed.

Shared database schema owns identities/sessions/access/settings/audit; Chambers
schema owns legal records/blobs and app migrations own other domain entities.
Production uses additive D1 migrations and tenant ownership/revision guards.
Do not run bootstrap/legacy mapping again, equate default Node mode with production,
or replace authoritative records with browser state. Local file tools are intentionally
ephemeral; Focus/Ritual/Timetable local persistence is an explicit product choice.

Auth uses salted scrypt password hashes, random session tokens stored hashed,
12-hour expiry, HttpOnly/SameSite=Strict cookies and Secure cookies in HTTPS/edge
delivery. Origin/host/fetch-site checks and rate limits protect mutations. Governance,
organisation membership, enabled product licence and business role remain distinct.
Default Node Owner shortcuts are not the production organisation policy. Audit
reasons, invitation secrecy, tenant checks and CAS/stale-version errors must remain.
This inspection does not certify every possible authorization path or supply-chain risk.

## Routing, shared UX and accessibility

Real page links and route aliases coexist with app-owned history in private apps,
Ritual/calendar, News and Fund Lens; shared `navigation.mjs` handles selected
dialog/history lifecycles. A grep without `pushState` does not establish broken
Back behavior: simple tools use native document navigation. Audit/client routes
have their own access states. Unsaved editors already warn before selected navigation.
Workers organisation mode redirects `/signin` to `/account`; default Node/static
source entry behavior is separate. Source metadata inventory is not proof of all
headers in every served hosting mode. The Android wrapper restricts in-app pages
to the exact production HTTPS origin and handles approved external schemes through
its native navigation policy. A web manifest exists, but no general offline
service worker for these tools was found; loaded local computation is not a
promise that every app works offline.

Shared shell, platform theme and en/hi/gu language preference own global controls.
App-local content/render/export languages can be narrower. User-entered content
must not be translated by generic UI walks. Existing beta acknowledgement can
block interaction until accepted; tests acknowledge it without changing deployment.
Native labels, skip links, status regions, keyboard alternatives, reduced motion
and dialogs exist, but initial layout survey does not validate screen-reader order,
contrast under every state, target sizes or keyboard traps. Focus has keyboard task
controls; Confessions has keyboard reveal but lacks a visible report action.

## Performance, caching, integrations and hosting limits

Recent optimizations already provide static cards, home/style bundles, lazy place
index/almanac work, minified UTF-8 assets, image variants and edge asset hashes.
See `docs/FRONTEND_PERFORMANCE_AUDIT_2026-10-28.md`; do not claim those as missing.
No field INP/LCP/CLS, Search Console, paid SEO export or conversion/retention cohort
data was available to this audit. Lab measurements from earlier audits are not
current field metrics. New baseline survey measured layout, not response-speed scores.

| Risk / bottleneck | Evidence / practical action |
|---|---|
| Heavy local image/export work | Photo iterative encoding and up to 24 MP decode; A4 300/600 DPI and batch certificates; bound input/output, sequential work, stale-result cancellation; no huge automatic batch expansion. |
| Calendar/astronomy work | Bounded worker APIs, policy-version caches and lazy bundles already exist. Ritual icon atlas/hero remain documented large assets. Do not replace verified numerical engines for cosmetic performance. |
| News and fund dependencies | Fixed upstream fetches/cache limits, RSS fallback, dated holdings and refresh CLIs exist. Providers can block/change; no invented results or live freshness claim. Scheduling/operations are follow-up work. |
| Bounded SQL aggregates | Feedback, Confessions, booking and fee aggregates have explicit limits/revisions. A high-volume launch needs measured capacity/indexed entity planning before raising limits. |
| Polling and third parties | Visibility-aware feeds/conversations/results already reduce idle work. Shared anonymous ads/visitor requests affect page cost and privacy; no blanket zero-tracking claim. |
| Cloud quotas/configuration | Production Worker+D1, fixed limiter bindings and public assets; no always-on Windows dependency for all public tools. Free-tier budgets and CPU/source quotas are finite. Do not alter bindings, secrets, production accounts or observability in this pass. |
| Recovery | Retained legacy data, full export procedures and schema history exist. Scoped D1 recovery screens remain a separate increment; don't represent them as ready or overwrite old recovery artifacts. |

## SEO and acquisition audit

Most practical tools have a title and description but no source canonical/Open Graph
metadata. Private shell source can omit noindex; a sign-in barrier/robots rule is
not an authorization boundary. Vedic deliberately emits noindex/nofollow and must
remain excluded until its separate verification programme permits change.

Root `/sitemap.xml` is currently generated by
`apps/satire-arena/backend/public-pages.mjs` and lists home/Arena content, not
the utility catalogue. This is a **confirmed crawl-discovery omission**, not proof
that Google has failed to index those pages. Arena's specific sitemap, canonical
character/posts/category HTML and noindex samples already exist. Utility SEO can
be improved without fake ratings, invented traffic, doorway pages or indexing
private workspaces. Photo's new help text should explain real pixel/KB checks and
sources rather than promise acceptance or universal exam specifications.

## Duplication, unfinished flows and selected scope

Do not rebuild existing Wi-Fi QR, percentage splits, substitute cover, Focus JSON
backups, hearing ICS, Ritual ICS, batch certificates or Team Mixer constraints.
Keep the game hub/standalone shared engines and historical app-ID aliases. Avoid
new anonymous entertainment growth before moderation/operational evidence.

Selected implementation after this audit and competitive review:

1. Extend the existing Photo Resize engine/UI with explicit exact crop versus
   proportional fit, crop review, validated format/range checks and narrowly sourced
   form guidance. Preserve the old simple KB workflow and local-only processing.
2. Correct utility discovery in the root sitemap without changing the Arena-only
   sitemap, exposing private routes or indexing the Vedic verification preview.
3. Add useful Photo Resize canonical/social/help content; do not duplicate every
   exam keyword into unsupported landing pages.

Other ranked opportunities are recommendations, not silently authorized product
policy changes. Results, precise implemented profiles and focused verification
are appended to this document and the ledger after implementation.
