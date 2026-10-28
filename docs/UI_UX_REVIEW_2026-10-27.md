# Curio product UI/UX review — 27 October 2026

Deployment follow-up: user subsequently requested deployment without committing.
Worker `85bb377c-53f6-43c0-bcdd-16f550234167` is live at
https://apps.sushantsynapse.com, deployed with `--keep-vars`. Six HTTP checks and
five browser flows passed, including matching results and production isolation.
No commit/push, migration or business-data write. The no-deployment statements
below describe the original local audit checkpoint and are superseded by this
follow-up. See the functionality ledger for deployment evidence.

## Executive assessment and method

Curio is a mixed public toolbox and permission-controlled workspace platform,
not a single-purpose astrology site. Its strongest product qualities are immediate
public-tool access, app-owned specialist workflows, shared en/hi/gu preferences,
light/dark/system themes, explicit privacy boundaries and detailed recovery/access
handling. Chambers targets advocates and chamber staff in India; the public tools
serve a broader Indian audience. This review retains both audiences and the Curio
brand. There were no user interviews or analytics experiments: impact below is
a design hypothesis, not measured conversion improvement.

The main weakness is task discovery and hierarchy, rather than a need for another
visual theme. Some tools live outside the launcher search model, the shared
switcher searches display text instead of task vocabulary, and Matching spends a
phone viewport on technical explanations before offering an actionable form.
Results, empty states and advanced controls need consistent presentation.

Architecture was inspected before product edits: server/index.js composes apps;
apps/<id> owns domain views; packages/ui owns shared presentation; app-registry
owns discovery; Node and Workers delivery differ. Existing business rules,
organisation authority, SQLite/D1, saved inputs and browser-only calculations are
preserved. No new UI library is justified. Pending matching explanations from
the preceding task remain part of this working tree.

Evidence is stored under `.publish/ui-ux-audit/`: machine-readable inventories
include routes, source owners, headings, controls (including hidden controls),
dialogs, visible links, runtime errors and layout observations. Each scanned
screen is checked at 320/390/768/1440px in light/dark; screenshots capture mobile
light and desktop dark. These are repeatable automated surveys, not a claim that
every possible state or assistive technology combination was manually tested.
Source-declared dialogs alone do not enumerate dynamically created UI; runtime
inventory and existing workflow tests supply the complementary evidence.

## Application inventory

Trailing-slash aliases share the canonical page unless routing says otherwise.
`server/static-assets.js`, generated `infrastructure/cloudflare/pages.json`,
app route handlers and app tests are the inventory sources. Parameterized pages
are route families, not a claim that every real record was visited.

| Area and routes | Major screens and interactions | Owner |
|---|---|---|
| `/`, `/signin` | Public launcher; search, filters, mobile dock, favourites, private cards; setup/login, profile/account/admin dialogs | portal |
| `/account`, `/admin`, `/super-admin` | Account memberships, password form, invitation acceptance/account activation; organisation/member/licence/seat/access forms, one-time secret, refresh/switch-account states | admin |
| `/organisation-audit`, `/platform-audit` | Scoped history, action filters, older/refresh pagination, denied/expired states | admin |
| `/client-access`, `/client-portal` | Explicit client links/entitlements; read-only approved cases, empty/denied/grace states | advocate + admin shell |
| `/advocate#dashboard` | Overview, upcoming hearings, open tasks, collections | advocate |
| `#cases`, `#clients` | Search/filter lists; add/edit/detail dialogs; case hearing history | advocate |
| `#hearings`, `#tasks` | Hearing diary/outcome and next date; task add/edit/complete; calendar download | advocate |
| `#documents`, `#notes` | File upload/download, communication notes, archive confirmation | advocate |
| `#billing`, `#reports` | Invoice/payment/expense forms, balances, statement/CSV/report filters | advocate |
| `#activity`, `#archive`, `#settings`, `#ledger` | Audit, restore archived records, staff/preferences/backups and recovery confirmations, availability ledger | advocate |
| `/digital-samaj` | Community chooser, registry/directory filters, five-step family registration and resume, photos, profiles/Vanshavali, messaging and role gates | digital-samaj |
| `/batchfee-lite` | Academy chooser/setup, batches/students/fees, recurring dues, payment/receipt dialogs, WhatsApp drafts, settings/staff | batchfee-lite |
| `/tournament-lite` and shared tournament URL | Organizer list/create/edit, participants, rules, fixture generation, scores/brackets, public results/share dialog | tournament-lite |
| `/rashifal-kundli` | Segmented birth input, city combobox, optional details, saved inputs, Generate/Edit, everyday topics, charts/Dasha, expert disclosures, report/download | rashifal-kundli |
| `/rashifal-kundli/rashifal` | Rashi choice, readable outlook, city/almanac/Choghadiya, technical timeline/evidence | rashifal-kundli |
| `/rashifal-kundli/matching` | Two-person consent, saved choices, paired birth forms, review/calculate, swap/clear, eight-factor results and sources | rashifal-kundli |
| `/rashifal-kundli/time-machine` | Moment/compare exploration, date/time/city, review/calculate, summary and advanced tables | rashifal-kundli |
| `/fund-overlap` | Fund search/selection, coverage and dates, compare/retry, shared holdings/industries, what-if and exports | fund-overlap |
| `/news` | Editions, dates/archives, search, article/source reading and temporary edition states | news |
| `/timetable-lite` | Setup/import, classes/teachers/subjects, constraints, generation/conflict repair, weekly grids, print/export, substitute/absence planning | timetable-lite |
| `/focus` | Timer/settings, task add/edit/complete, priorities/estimates, browser-local recovery limits | focus |
| `/qr-maker` | Type/content form, live QR, PNG download and validation | qr-maker |
| `/photo-resize` | Photo input, dimensions/target size/quality, preview, local JPEG download/error | photo-resize |
| `/bill-splitter` | Equal/custom/percent/share modes, participant/expense editing, balances/settlements, copy/export | bill-splitter |
| `/moment-studio`, `/moment-studio/certificates` | Certificate templates, details editor, preview/expand dialog, batch CSV, PNG/PDF controls/status | moment-studio |
| `/moment-studio/cards` | Occasion/design/personalisation, photo and text, live preview, export | moment-studio |
| `/team-mixer` | Names/counts, random teams, reveal, copy/share and PNG | team-mixer |
| `/decision-wheel` | Options/presets/import, spin/result, remove winner, share/export | decision-wheel |
| `/take-a-break`, `/daily-spark` | Game chooser, daily/practice modes and puzzles; Make 24, code, memory, Lights Out, Face-Off, Chaos; challenge/share | take-a-break + daily-spark |
| `/confessions` | Scratch-to-reveal stream, submit form/CAPTCHA, cooldown/error states | confessions |
| `/satire-arena` | Four-category chooser | satire-arena |
| `/satire-arena/{politicians,news-anchors,actors,corporates}` | Character cards/reactions, scores, ranking/filter controls, browser vote feedback | satire-arena |
| `/satire-arena/characters/:slug`, `/satire-arena/results` | Character detail/history, aggregate results | satire-arena |
| `/satire-arena/editor` | Authenticated editorial lists/forms and protected actions | satire-arena |
| Legacy `/satire-arena/daily...`, `/certificates`, `/celebration-studio` | Compatibility redirects/aliases; no new independent products | owning apps |
| `/feedback` | Search/status/sort, ideas/votes, public submission and detail dialog | feedback |
| `/showcase` | Demonstration chooser/player and explanatory sections | portal |
| `/support`, `/contact` | Sponsorship/manual placement requests, contact forms and confirmation/errors | portal |
| `/privacy`, `/terms`, `/legal`, `/legal/third-party-notices` | Long-form policy/source information and disclosures | portal |
| Every shared-header page | App-switch dialog/search, language menu, theme switch, account link, navigation loading cue, footer, beta acknowledgement/reopen | packages/ui |

Private pages must be distinguished from their signed-out gate. Local owner and
governance fixtures allow review without touching live records; local availability
does not establish a production tenant adapter for additional private apps.

## Competitor comparison

Public sources accessed 27 October 2026. These four products represent the main
overlapping categories; none is a direct competitor for Curio's entire combination.
Only public pages/documentation were reviewed. Their signed-in products, keyboard
behavior, contrast, performance and breakpoints are not independently certified.
Chrome screenshots of all four public references were also captured at 390px
and 1440px under `.publish/ui-ux-audit/competitors/`; all returned HTTP 200.
Zoho's captured page is its documentation, not its signed-in launcher.

| Public visual observation | Appropriate interpretation |
|---|---|
| Zoho documentation: prominent search, article headings and a contents sidebar | Long policy/reference pages benefit from local contents navigation |
| Smallpdf: a dominant red file-entry area, short task heading and breadcrumb | Lead public tools with the task action; retain Curio's own palette |
| AstroSage: dense amber navigation, compact birth form and commercial sidebar | Borrow advanced-settings grouping; avoid adding competing promotions |
| RazorLex: large coral hero, product illustration and demo CTA | Show clear product context; a demo gate does not suit Curio's free tools |

| Dimension | Curio | Zoho One | Smallpdf | AstroSage | RazorLex |
|---|---|---|---|---|---|
| Relevance | Mixed tools + workspaces | Suite navigation reference | Public-tool UX reference | Direct Ritvayam overlap | Direct Chambers category overlap |
| Discovery | Search + filters + switcher; two search omissions found | Docs show searchable assigned-app grid, separate unassigned/request flow | Tools page pairs task names with brief purposes | Kundli page links matching, reports and languages | Public navigation names matters, billing and documents |
| Task entry | Public tools often immediate; private access explicit | Login/assignment flows documented | Compressor starts with Choose Files/drop zone | Birth form; advanced Settings disclosure | Demo-led product access; actual onboarding uninspected |
| Progressive disclosure | Strong in Kundli; weak Matching preamble | Permissions affect available actions, per docs | Simple start with format and workflow help | Birth details before advanced coordinate/settings controls | Module-specific public pages, actual drawers uninspected |
| Results | Detailed evidence; Matching needs readable hierarchy | Actual app results uninspected | Public instructions explain compress → download/share | Public copy describes reports; matching endpoint timed out | Matter/case page describes tasks/documents/billing; actual result UI uninspected |
| Privacy/trust | Local-only tools explicitly distinguished from server workspaces | Assignment/request model documented | Cloud processing and file retention described publicly | Birth input/public astrology content | Product security/integration claims are marketing, not independently tested |
| Responsive/a11y | Local automated layout + targeted keyboard checks | Not browser-certified in this review | Not browser-certified | Not browser-certified | Not browser-certified |
| Appropriate lesson | Keep no-login local tools and scoped workspaces | Use consistent discovery vocabulary and access labels | Lead with task, reveal help next | Group advanced details below essential birth input | Keep matter context across related work; avoid unsupported integration claims |

Sources and verified scope:

- [Zoho One Tools documentation](https://help.zoho.com/portal/en/kb/one/user-guide/spaces-ui/spaces/articles/tools-inzo): assigned/unassigned tools, search and permission-dependent requests; documented behavior, not a signed-in session.
- [Smallpdf tools](https://smallpdf.com/pdf-tools) and [compressor](https://smallpdf.com/compress-pdf): task names, short descriptions, file entry and documented output flow; no file submitted.
- [AstroSage Kundli](https://www.astrosage.com/kundli/): birth fields, Settings grouping, report/language links. The linked matching calculator timed out, so its actual generated results are not evaluated.
- [RazorLex](https://www.razorlex.com/) and its public Matter & Case Management page: module names and case-context positioning. No trial, authenticated workflow or advertised integration was verified.

## Screen-by-screen findings and backlog

P0 = broken primary journey/serious accessibility barrier; P1 = major friction;
P2 = meaningful efficiency/consistency improvement; P3 = minor optional polish.
Effort is engineering estimate excluding content review: Low <1 day, Medium 1–3
days, High >3 days. Findings marked candidate require further state-specific
validation before a broad implementation. Absence of a confirmed P0 in the sample
is not a certification that none exists.

| ID / screen | Issue and evidence / reproduction | Why it matters / proposed change | Pattern / expected impact | Priority / complexity |
|---|---|---|---|---|
| U01 Home search | Search `kundli`; feature panel sits outside iterated `.public-app,.workspace-card`, so count/empty state ignores it | Include featured app in the same matching predicate and counts; filter unrelated feature content | Zoho task discovery; find an existing tool without knowing its brand | P1 / Low |
| U02 Shared app switcher | Search `kundli` from QR Maker; matching uses only anchor text, unlike home metadata | Search canonical app metadata/native names and task keywords; preserve native anchors/access checks | Zoho searchable apps; consistent search across pages | P1 / Low |
| U03 Shared switcher | Empty search has only a sentence; trigger omits expanded state; stale query persists on reopening | Visible reset action, live feedback, expanded state and reset/re-focus on open | Recovery and keyboard orientation across every shared page | P1 / Low |
| U04 Matching entry | Mobile screenshot: long title and five paragraphs before paired fields; technical axis names in legends | Short task title, essential privacy/consent visible; convention/limits in labelled details; plain Person A/B legends | AstroSage essential/advanced separation; reach inputs sooner | P1 / Low |
| U05 Matching actions/results | Review, Swap, Clear share filled visual weight; output below a long form with no focus handoff | Group actions; only Review primary; summary/cards before technical table; announce calculation and focus result heading | Smallpdf task→result sequence; reduce perceived failed calculation | P1 / Medium |
| U06 Kundli saved library | Saved items explicitly live only in this browser; general platform account can imply cloud sync | Preserve existing local-storage wording near saved actions; future export/restore only after privacy design | Trust/expectations; existing behavior is preferable to implicit sync | P2 / Medium; candidate |
| U07 Rashifal/almanac | Rashi/current city and technical evidence coexist; domain terms need language review | Keep readable outlook/current locality first; do not turn editorial content into certified predictions | Protect existing strengths; review with Hindi/Gujarati users | P2 / Medium; candidate |
| U08 Time Machine | Multiple exploration modes and technical result tables | Retain three-step guide/human-readable snapshot; standardise success focus after verifying all modes | Lower cognitive load; no forecast claims | P2 / Medium; candidate |
| U09 Chambers overview/casebook | Many modules; mobile secondary modules are inside More | Keep Overview/Casebook/Diary/Tasks persistent; add contextual return links only where user tests show loss of context | RazorLex matter context; faster case-centered work | P2 / Medium; candidate |
| U10 Chambers forms/dialogs | Add/edit/outcome/billing/recovery dialogs have different risk levels | Keep atomic hearing/payment rules; consolidate non-destructive feedback; retain explicit recovery confirmations | Error prevention; test keyboard and validation per dialog | P1 / High; candidate |
| U11 Admin/account/audits | Many technical roles/states and version-conflict recovery | Add concise role/seat explanations beside controls; retain reasons and explicit refresh for stale changes | Zoho assignment labels; fewer administrative mistakes | P2 / Medium; candidate |
| U12 Client links/portal | Membership, app entitlement and record link are distinct | Explain the missing prerequisite in each existing denial; preserve released-field scope | Trust; never infer links by name/email | P1 / Medium; candidate |
| U13 Digital Samaj | Long registration has resume/verification/privacy boundaries | Preserve five-step progress/resume; user-test required/optional labels and generation linking; no silent auto-verification | Completion and safety; local flow tests required | P2 / High; candidate |
| U14 BatchFee | Financial filters, collection/receipt/WhatsApp actions | Keep balances and receipt state prominent; label WhatsApp as prepared draft rather than delivered | Less collection confusion; delivery remains unconnected | P2 / Medium; candidate |
| U15 Tournament | Organizer editing and public results use different authority | Keep public/read-only state obvious; promote actionable repair when fixtures blocked | Faster repair; no permission change | P2 / Medium; candidate |
| U16 Fund Lens | Reference coverage/reporting dates may be mistaken for fresh universal coverage | Keep dates/coverage adjacent to compare; retain selection on source error/retry | Confidence with explicit evidence; do not imply investment recommendation | P1 / Medium; candidate |
| U17 News | Editions/archive/search have different dates and source context | Make selected edition date and credited source persistent while reading; test empty archive | Faster orientation; no invented connected publisher status | P2 / Medium; candidate |
| U18 Timetable | Setup, constraints, unresolved allocations and substitute planning are complex | Keep conflict repair action adjacent to failed allocation; preserve unsaved work and downloadable samples | Task completion; do not hide unscheduled lessons | P1 / High; candidate |
| U19 QR Maker | Preview/download state depends on input validity | Keep valid preview and download readiness aligned; retain clear offline/local statement | Smallpdf immediate-task pattern; no server upload needed | P2 / Low; candidate |
| U20 Photo Resize | Target size cannot always be achieved without quality/dimension trade-off | Keep output KB/dimensions and unmet-target explanation beside download | Useful output and honest constraints | P2 / Low; candidate |
| U21 Bill Splitter | Four methods plus trip expenses produce different totals | Keep outstanding allocation and exact paise visible; label copy success and no-payment boundary | Fewer arithmetic misunderstandings | P2 / Medium; candidate |
| U22 Moment Studio certificates/cards | Template/design/personalization and batch export can overwhelm | Preserve side-by-side desktop/stable preview and expandable controls; use export status without modifying canvas branding | Smallpdf output flow; no visual overhaul needed | P2 / Medium; candidate |
| U23 Focus | Timer and browser-saved tasks have different state lifetimes | Keep active timer/action first; preserve task text on settings/errors and local persistence wording | Lower resumption effort | P2 / Low; candidate |
| U24 Decision Wheel/Team Mixer | Animated reveal and sharing can imply authority/randomness guarantees | Preserve explicit user action and reduced motion; retain names/options through recoverable errors | Simple play flow; no fabricated fairness guarantee | P2 / Low; candidate |
| U25 Games hub/daily games | Daily/practice/challenge states can be confused | Keep current mode/result/restart explicit; test share restores intended challenge only | Engagement hypothesis, not measured retention | P2 / Medium; candidate |
| U26 Confessions | Anonymous public submission is not private draft storage | Keep public/CAPTCHA/cooldown explanation near submit; keyboard alternative to scratch if not already sufficient | Trust/accessibility; moderation review remains separate | P1 / Medium; candidate |
| U27 Arena categories/detail/results/editor | Long category pages and shared votes have local/network failure states | Preserve local choice and expose score loading/retry; signed-out editor is a gate, not a broken workspace | Avoid false vote delivery claims | P2 / Medium; candidate |
| U28 Feedback | Search empty state and first-ever empty collection share generic copy | Distinguish no ideas vs no matching ideas; keep submission privacy visible | Discover existing requests before posting | P2 / Low; candidate |
| U29 Support/contact/showcase | Introductory sections, request forms and demos compete | Lead with user's intended action; retain honest manual-placement/provider status | Trust; no fabricated sponsorship/payment integration | P2 / Low; candidate |
| U30 Policy/source pages | Long paragraphs and small footer links require deliberate reading | Add in-page contents for long policies; assess line length/zoom and link target spacing | Faster reference, accessible navigation | P2 / Low; candidate |
| U31 Shared materials | premium.css → workbench.css → refinement.css plus platform-shell mappings repeat color/radius/control definitions | Name refinement's ss tokens as canonical; migrate incrementally with app checks, not a global selector rewrite | Maintainable consistent states; protect print/canvas | P2 / High |
| U32 Shared headers | At narrow widths visible app names are truncated; switcher remains full-name access | Keep accessible full names and test 200% text zoom, native scripts and menu bounds | Keyboard/screen-reader clarity; no brand change | P2 / Medium; candidate |
| U33 All pages | Small-target detection is only a geometric heuristic; inline links have exceptions | Manually review flagged controls and spacing under WCAG 2.2 target-size rules | Accessibility; do not claim automatic AA compliance | P2 / Medium |
| U34 Timetable step navigation | At 320px, Subjects/Generate extend to x=338px; reproduced in both themes | Use bounded grid tracks, two columns on narrow phones and wrapping labels | All six steps remain visible without horizontal page scrolling | P1 / Low; implemented |
| U35 Arena landing | Source omits shared material stylesheet; existing cross-app test reproduces missing stylesheet | Load shared materials before the app's illustration/layout styles | Consistent canvas/controls with retained Arena identity | P2 / Low; implemented |
| U36 Arena unavailable results | `/satire-arena/results` returns HTTP 503/raw JSON when the local shared-arena secret/service is unavailable | Keep 503 but render a readable unavailable state with Retry and Back to Arena, consistently in Node and Workers | Recoverable navigation; never invent scores or enable a missing service | P1 / Medium; deferred pending both delivery adapters |

## Design-system direction

Keep the current teal/navy identity. `--ss-*` in refinement.css is the latest
canonical material system; `--ui-*` and app tokens remain adapters. Add future
semantic success/warning/error tokens centrally with light/dark pairs and text
labels, never status color alone. Verify measured contrast before release.

Use a documented 4/8/12/16/24/32 spacing scale, existing 44px minimum controls
(48px when appropriate), 16px body/input text, 1.5 body line height and bounded
reading widths. Existing compact home cards are an intentional exception, not a
reason to remove their introductions. Standardize primary/secondary/quiet/danger
actions, field help/error association, loading/success feedback, searchable
dialogs, recoverable empty states and overflow-table regions one app at a time.
Keep focus outlines and reduced-motion handling; leave print/canvas/game geometry
app-owned. Prefer original SVG artwork; no new image library or dependency.

## Roadmap

| Phase | Work | Impact / effort | Affected screens / dependency |
|---|---|---|---|
| 1 Critical and major friction | U01–U05 discovery, recovery and matching hierarchy/focus | High / 1–2 days | Registry, shared shell, home discovery, Matching; localization and focused browser checks |
| 1 Verification | Review target/contrast/error findings, role-specific private flows, failed/slow-source states | High / 2–3 days | Cross-app tests, disposable datasets; no production data writes |
| 2 Workflow consistency | U09–U18 contextual navigation, prerequisite explanations, complex-form conflict repair | High / >1 week incrementally | Domain-owner review; API validation and tenant scope remain authoritative |
| 2 Components | U28–U33 empty states, role labels, policy contents and token consolidation | Medium / 3–5 days | Shared and app-owned styles; native-language and print regression coverage |
| 3 Polish | Measured typography/spacing refinements, restrained feedback/motion, text zoom and device testing | Medium / 2–4 days | Verified design-system baseline; physical-device/assistive-tech access |

## Implementation and validation

Implemented U01–U05 and U34–U35 in the existing stack:

- `packages/app-registry/index.js`: reusable search vocabulary, native names and
  domain aliases; consumed by both discovery surfaces.
- `apps/portal/frontend/home-discovery.js`, `home.css`: include featured Ritvayam
  in search/filter results and counts; hide unrelated featured content.
- `packages/ui/platform-shell.js`, `platform-shell.css`, `interface-copy.mjs`:
  task-aware search, visible localized reset, expanded state and keyboard focus
  recovery. Generated shell/language/home delivery bundles rebuilt.
- `apps/rashifal-kundli/frontend/rulebook-view.mjs`, `matching-summary.mjs`,
  `rulebook.css`: retained the preceding eight-factor explanation work; shorter
  entry text, expandable conventions/limits, plain person legends, primary versus
  secondary actions, busy/success feedback and review/result focus. Exact-time,
  consent, cancellation, privacy and numerical rules remain intact.
- `apps/timetable-lite/frontend/style.css`: bounded step grid and narrow-phone
  layout. `apps/satire-arena/frontend/entry.html`: shared materials before local
  styles, preserving app artwork/layout.
- Browser regressions cover discovery, focus, result visibility and narrow step
  navigation. Existing test expectations were brought into line with the already
  released Curio title, content-dependent launcher heights, insignificant report
  stylesheet line breaks and the shared language menu.
- `infrastructure/ui-ux-audit.cjs` / `ui-ux-report.cjs`: repeatable fixture-only
  survey and local evidence gallery; never point these fixtures at production.

The report does not claim a full redesign, every candidate fixed, provider
connectivity, or production deployment. Business/API/storage changes were not
needed for the implemented UI fixes.

### Evidence and coverage

The final merged survey covers **69 route/role observations and 552 viewport/theme
checks**, including every canonical static page, public dynamic examples, all 13
Chambers sections, local Owner workspaces and Master/Super Admin states. No page
overflow or uncaught script errors were recorded in those surveyed states. News
initially timed out under concurrent load and passed its focused repeat; both
records are retained. Arena unavailable results remains a **503**, not a passed
functional result. API denials expected from the selected role are retained in
the inventory rather than relabelled as public data access.

The gallery is `.publish/ui-ux-audit/index.html`; `coverage.json` retains the
merged observations. `before/`, `final/` and `retry/` contain original screenshots
and surveys. Very tall pages use viewport captures instead of exceeding browser
screenshot limits. The before survey's network-idle waits were unsuitable for
hash navigation/background requests; the final survey waits for document/app
chrome and records those states. Screenshot evidence is not a pixel-perfect test.

Before/after examples:

- `home-search-before.png` / `home-search-after.png`: `kundli` no longer produces
  a contradictory no-results state while Ritvayam exists.
- `switcher-before.png` / `switcher-after.png`: the same task finds Ritvayam;
  the after dialog exposes recovery instead of a dead-end sentence.
- `before/public-_rashifal_kundli_matching-390-light.png` /
  `final/public-_rashifal_kundli_matching-390-light.png`: technical preamble moved
  into a disclosure, consent appears earlier, secondary actions are distinct.
- Per-language result captures from the matching browser flow show all eight
  explanations. `timetable-steps-after.png` verifies the narrow step layout.

Static canonical-token contrast calculations (foreground/background only):
light body 12.36:1, light muted 5.22:1, light primary button 6.36:1; dark body
16.41:1, dark muted 9.16:1, dark primary button 8.99:1. Evidence:
`token-contrast.json`. This does **not** certify all app-specific text, gradients,
disabled controls or focus indicators. Real screen-reader testing, physical
devices, 200% text zoom, every dynamic modal state and live private accounts were
not comprehensively tested. The small-target inventory is a desktop heuristic,
not a WCAG conformance audit.

### Executed validation results

| Check | Executed result / evidence |
|---|---|
| `npm.cmd test` | Final **552 pass, 0 fail**; `api-tests-final.log` |
| `npm.cmd run build:frontend` | Passed; **1,162 public assets** exported; `build.log` |
| Selected catalogue, design-system, language, Ritvayam platform/usability and Timetable suites | Main batch **45 pass / 6 fail**. Five Timetable cases were blocked by an unacknowledged first-visit modal in an outdated test import. The global-language case assumed the production Chambers entry in default Node and needed the canonical Gujarati setup wording. After test-adapter corrections, all six passed focused reruns: `final-recheck.log`, `timetable-regression.log`, `language-recheck.log`. Thus all **51 distinct selected cases** have passing results, not a single clean full-suite run. |
| Private/admin sample | **Eight distinct flows passed** across `private-flows.log` and `private-recheck.log`: three administration/role flows, two Chambers workflows, BatchFee payment/receipt/export, Samaj registration/photos and Tournament organizer/public permissions. Initial Chambers load timeout passed in isolation; Samaj's hidden legacy language control was replaced by the visible shared menu in the test. |
| Source checks | `node --check` on changed shared/app/audit modules and `git diff --check` passed |
| Evidence gallery | Opened locally in Chrome; 69 observations rendered and route search reduced matching to one observation |
| Canonical contrast pairs | Six static pairs exceed 4.5:1; app-specific/disabled/focus contrast remains outside this measurement |

This totals **59 distinct selected browser cases with passing results across
batches**. It does not mean every application E2E test was run. Initial failures,
their traces and rerun logs remain available. Tests use isolated temporary data;
no production changes or deployment were performed. There is no configured
project-wide lint/typecheck script; syntax, existing tests and build were used.

### Remaining opportunities

U06–U33 need app-specific evaluation and incremental releases; they are documented
recommendations/candidates, not observed defects in every state. U36 is a confirmed
local error-presentation gap with a Node/Workers consistency dependency. No shared
arena secret was created and no service was falsely represented as connected.
Retain the existing browser-local storage boundaries and explicit unavailable
states while pursuing those improvements. Moderated research with advocates,
staff and Hindi/Gujarati public-tool users is the next source of evidence; no
conversion or retention improvement is claimed without measurement.
