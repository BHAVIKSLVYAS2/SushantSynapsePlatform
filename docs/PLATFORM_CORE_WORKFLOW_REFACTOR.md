# Platform core workflow refactor

Review date: 2026-10-31 IST. Scope clarified by user: the entire application.
Implementation follow-up: a local workflow pass now implements translated task
entry/search, validated sign-in continuation, QR live preview, direct Focus start,
one visible Spin action, a draft-preserving Timetable workspace, next-observance
calendar hierarchy and dashboard hearing outcomes. Already efficient flows and
existing private contextual forms are retained. Shared discovery/intent helpers
are reused rather than adding an unused universal form framework. Unknown-time
calendar modes and two-location calculations remain separately scoped domain
increments; no guessing or new sensitive persistence is introduced. Verification
and release status are recorded in the functionality ledger. The blueprint below
records the original analysis and implementation boundaries.
Evidence: current registry, shell, public app controllers, account/edge routing,
calendar controllers, private-app ownership/contracts and the prior product/UI
audits. No fresh complete browser census, user interviews or conversion analytics
were run. Counts below describe code-defined paths, not measured user behaviour.

## Product decision

Curio currently contains 20 catalogue products with different domain workflows.
It is not one AI-generation loop: Moment Studio's runtime AI was removed. Do not
reintroduce AI, a chat box or a generic wizard to unify tasks that already work.
Unify task entry, context and result actions; preserve app-owned domain engines.

The target is two product stages: provide/review the necessary inputs, then use
the result or commit the action. A calendar with an unknown death time, a first
school timetable or a private booking cannot honestly be completed in two literal
taps. Permissions, data entry, consent and OS dialogs are separately accounted for.

## Shared bottlenecks

1. Discovery names apps before the user's intended job. A user wanting a birthday
   invitation, Barsi date or hearing update must infer the product and section.
   Keep catalogue browsing but add task entry points to existing destinations.
2. Known task context can be lost at authentication. Registry private cards use
   `/signin?next=<app>`, but the organisation-mode edge redirect forwards only
   `/account`. The legacy portal controller already recognises next/returnTo;
   use that evidence to preserve validated intent across the production account
   path instead of making users select the app again. This needs a routing test.
3. The first-visit beta acknowledgement adds a separate decision before task
   entry. It was previously rejected for removal by automatic approval review;
   leave the current control intact unless separately authorised. Do not count it
   as an app-domain requirement or create additional copies inside forms.
4. Result actions vary: downloads, sharing, previews, print and reminder files
   appear in different positions and with different meanings. Establish one
   primary next action per result and put alternative formats in a disclosure.
   Do not merge calendar text, ICS reminders and preparation packs into a single
   ambiguous Download button.
5. Private task context is often available on the selected record. Prefer actions
   there to reopening a general creation form and selecting the same parent.
   This is a domain-by-domain opportunity, not proof every private form currently
   repeats its parent fields: Chambers already prefills some invoice/payment data.
6. Persistence is inconsistent by design: some public tools use tab memory while
   others have explicit local saves; private apps use SQLite/D1. Do not turn every
   draft into localStorage. Preserve current in-session drafts; design any new
   sensitive persistence as an explicit, separately reviewed choice.
7. Dense instructions, configuration and long historical outputs compete with
   the immediate task. Lead with the next useful result; reveal technical evidence
   and full history without deleting necessary limitations or source credits.

## Application-by-application loop

| Product | Current evidence / friction | Proposed two-stage default |
| --- | --- | --- |
| Ritual Assist | Guide landing -> Open calendar -> default Vrats view -> Shraddha tab. On a known Shraddha journey, the calendar transition and wrong initial view are avoidable. Reminder/pack actions require scrolling; packs require opening another section. | Direct task link to `calendar?view=remembrance`; enter date/time/city -> show next observance, then clear reminder/print actions. Keep full first-year and 11-year outputs collapsed below. General Vrats still uses PIN while remembrance uses city; share the picker after a separately tested observance API extension. |
| Ritvayam | Kundli uses a guided input/review flow; matching requires two records and consent; results include optional calculation disclosures. Saved-input reuse already exists. | Inputs and review in one screen -> Calculate and read. Keep saved-input shortcuts and genuine matching consent/boundary checks. Do not duplicate a separate confirmation of identical inputs. Separate death/observance place is a Ritual domain change, not an astrology shell default. |
| Moment Studio | Cards already render live with direct PNG/share; certificates already expose quick PNG/PDF. Root opens certificates, so a greeting task can still land in the wrong editor. | Task/occasion link -> editable live preview -> Download/share. Retain this architecture; do not add a Generate or confirmation screen for ordinary non-destructive edits. |
| Photo Resize | Local file -> profile/custom settings -> process -> download. Exact crop/DPI are behind More size controls. Processing/validation is necessary. | File plus a visible requirement preset -> Resize & download reviewed output. Keep custom controls contextual and crop preview visible; never export an old result after settings change or auto-claim acceptance. |
| QR Maker | Explicit Create -> Download; every edit clears the preview and requires Create again. | Validate/render locally after a short debounce -> Download. Keep URL/Wi-Fi validation, quiet zone and explicit download; never persist Wi-Fi passwords. This is a small improvement to an already short flow. |
| Bill Splitter | Simple equal mode already exists. Advanced trip mode requires people, expenses and settlement; those are real inputs, not three needless pages. | People/amount/payer in one compact editor -> Split and copy settlements. Keep trip details optional, existing integer-paise engine and clear per-person accounting. |
| Fund Lens | Select funds -> Compare; changing selection clears the result. Coverage retrieval can be expensive and cached snapshots already exist. | One selection tray with persistent Compare action -> result with edit-in-place selections. Recalculate cached local basis/what-if changes; keep external retrieval explicit/bounded. Do not start network comparisons after every search keystroke. |
| News | Fetch/create an edition, then read/print; archives and editions are separate concerns. | Open today's available edition directly -> read/print; show Fetch/retry only when needed. Retain source links, temporary-edition labels and upstream rate limits; generating an edition is not an unnecessary click when no edition exists. |
| Focus | Focus on this selects a task and focuses Start rather than starting. Custom duration has Apply, then Start. | Start focus on a task in one explicit action; validate custom duration on Start. Preserve pause/resume and never infer task completion from elapsed time. |
| Decision Wheel | Update wheel appears beside Spin, but Spin already calls update(true). A separate Update is optional, not mandatory. Animation is 6.8 seconds. | Edit options -> Spin; remove/rename the redundant Update affordance. Offer a user-controlled quick result/reduced-motion path, preserving equal-chance selection and result history. |
| Team Mixer | Names/settings -> Mix -> copy/download. Constraints and manual swaps already exist. | Retain the core loop; keep constraints optional and result edits inline. An opt-in reusable roster is a separate privacy/storage feature, not an automatic default. |
| Timetable Lite | Six setup sections: Schedule, Classes, Subjects, Teachers, Allocation, Generate; entities are individually entered and constraints can invalidate the result. | One editable setup workspace with collapsible sections and existing backup import -> Generate/result workspace. Do not pretend classes/teachers/lesson allocations can be invented. Preserve conflict reporting, undo and local backup. |
| Take a Break | Collection selection plus individual game controls; modes depend on game. | Direct entry to the chosen/daily game -> Play/replay. Keep a collection switcher; do not force a hub return for each replay. New game mechanics are outside this refactor. |
| Confessions | Writing/publishing and scratch-to-reveal are distinct flows. Scratch is an intentional interaction, not automatically waste. | Compose inline -> explicit Post. Keep reading/reveal immediate and preserve moderation/privacy. Evaluate a read alternative separately rather than silently removing the core mechanic. |
| Satire Arena | Arena selection and reaction confirmation; public score mutation/privacy controls exist. | Deep-link to selected arena -> explicit reaction/result. Keep necessary confirmation/privacy/abuse protections; do not auto-submit a public reaction while browsing. |
| Chambers | Dashboard/lists/detail/form navigation, hearings and billing actions. Atomic hearing outcome/next date and payment validation already exist. | Today's work list -> inline record-specific update and Save. Reuse known case/client/invoice context; retain one server transaction and existing role checks. |
| BatchFee Lite | Organisation/academy/student context and collection/receipt workflow; financial events are immutable/reasoned. | Due-student row -> prefilled collection sheet and Record payment. Reuse scoped student context; keep amount review, request keys, allocation rules and immutable receipts. WhatsApp remains a draft. |
| Tournament Lite | Initial participants/format/setup precede fixtures; score entry is a repeat operational task. | Initial setup workspace -> Generate fixtures. Thereafter next match row -> score and Save. Preserve sport-specific validation and explicit publication/revocation of public links. |
| DIGITAL SAMAJ | Family/person editing, submission, consent and independent verification are deliberately separate. | Search/select person -> inline edit or scoped message. Keep draft-to-submission and verification boundaries; they are not redundant clicks. Reuse existing family links rather than asking for the same relationship twice. |
| Pandit Booking | Customer selects an approved named Pandit/service area; dispatcher confirmation uses availability/buffers. Managed pilot, not open marketplace. | Service/Pandit/slot selection in one request sheet -> Request booking. Dispatcher confirms in its separate role-specific task. Never label an unconfirmed request Booked or bypass pilot eligibility. |

## Streamlined blueprint

Entry: a task shortcut, app switcher, direct link or relevant workspace row opens
the actual editor with its safe context. The launcher remains available but is
not required between related tasks. Public tools stay public. Authentication
returns to a validated intended task; auto-select an organisation only when live
access checks yield exactly one eligible choice. Multiple eligible scopes require
an explicit choice.

Stage 1: show only task-critical fields and a live/local preview where possible.
Reuse approved presentation preferences and existing explicitly saved inputs.
Keep current domain defaults visible: equal split, 25-minute timer, current month,
current calendar conventions with overrides. Never infer historical location,
death time, consent, payment amount, privileged role or booking confirmation.

Stage 2: one primary action appropriate to the task: Calculate, Start, Download,
Save payment, Save hearing update or Request booking. Results replace the waiting
area inline. For a calculation followed by export, Calculate is primary action one
and Download is primary action two after data entry. Browser permissions and OS
print/share/calendar-import dialogs are outside the two-product-action target.

Errors stay beside their fields and retain drafts. Loading uses cancellation and
revision checks. An edited input invalidates its old result but should not discard
unrelated checklist/assignment work without a reason. Back restores in-session
context while still revalidating private access.

## Modular implementation instructions

1. Extend `packages/app-registry/index.js` with task descriptors: stable task ID,
   app ID, localized label, existing entry path, capability and allowed preset keys.
   Start with birthday card, certificate, photo resize, Shraddha, hearing update
   and fee collection. Keep app IDs/routes and catalogue availability unchanged.
   Filter private entries using existing server projections; the descriptor is
   presentation metadata, never authorisation. Rebuild catalogue/home outputs.
2. Fix intent retention in `infrastructure/cloudflare/fullstack-worker.mjs` and
   the account experience (`apps/admin/frontend/app.mjs`): forward an allowlisted
   app/task intent through `/signin` -> `/account`; validate same-origin returns
   against the destination app route. Never forward arbitrary external URLs,
   credentials, birth/death data or freeform drafts. Resolve scope through the
   existing live membership/licence/assignment checks, then open that destination.
3. Add small `packages/ui/task-shell.mjs` and `result-actions.mjs` helpers using
   existing CSS tokens: title, compact input region, status/error region, result
   region, one primary action and optional secondary disclosure. Do not build a
   universal domain form, new framework or generic replacement API.
4. Extract app-owned controllers from DOM-heavy modules. Use an explicit state
   contract: draft, draftRevision, resultRevision, status, errors and result.
   `edit` increments revision and cancels obsolete work; `submit` validates a
   snapshot; a response applies only if its revision/scope still matches. Separate
   calculation state from optional preparation/assignment state. A shared helper
   may handle requests; domain validation stays in each app and on the server.
5. Make app-owned changes incrementally: QR debounce rendering; Focus explicit
   startTask action/duration validation; Wheel one obvious Spin action; Timetable
   single setup workspace; Ritual next-observance result and clear export actions.
   Preserve the already efficient Moment Studio/Team Mixer flows.
6. Add contextual action sheets in private apps using their current endpoints:
   Chambers hearing+next-date atomic save; BatchFee payment+receipt; Tournament
   score; Samaj edit/submission; Pandit request/confirmation. Pass stable IDs and
   expected revisions, then re-read authoritative results after successful writes.
   Keep server validation, idempotency where present, version conflicts and roles.
7. Treat unknown death time and separate death/observance locations as additional
   Ritual domain increments. The lower engine can return partial unknown-time
   results, but the current public API requires exact time. Implement explicit
   partial/confirmed-tithi modes only with validation and date-boundary fixtures;
   do not replace unknown time with noon. Two locations require separate sunrise/
   Aparahna inputs and export semantics; do not silently relabel one location.
8. Keep persistence app-specific. Preferences may use current shared services;
   private records remain in SQLite/D1. Do not save medical/legal/family/birth/
   death inputs, Wi-Fi credentials or names merely to reduce typing. Any new
   opt-in restore format needs versioning, validation and a clear delete action.

## Delivery order and acceptance

First: task links, auth intent preservation, clear primary actions and the small
Focus/Wheel/QR improvements. Next: Timetable and Ritual result hierarchy, tested
as separate increments. Then private contextual action sheets one app at a time.
Do not combine a cross-platform rewrite, database migration and deployment.

Use isolated fixtures and exact-bundle browser tests to record each task's actions,
navigation transitions and successful output. There is no measured baseline yet;
do not promise a percentage improvement. Acceptance: at most two primary product
actions after required inputs, no intermediary landing page for known-task links,
no duplicated parent selection, no stale exports/results, preserved drafts and
correct failures at mobile widths/themes. Private suites must cover denied and
revoked access, wrong organisation, duplicate saves and conflicting revisions.
Validate real image/ICS/PDF outputs, not just visible success labels. A changed
state must never silently publish, send a message or move money.

No production change is authorised or performed by this analysis alone.
