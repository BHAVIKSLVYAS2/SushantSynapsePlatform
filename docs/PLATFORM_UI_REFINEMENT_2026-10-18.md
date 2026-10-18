# Platform UI audit and refinement

Scope: every maintained app, shared shell, generated editorial page, governance
screen and supported game. Existing vanilla JavaScript/CSS architecture retained.
Audit completed before product edits, using only disposable test workspaces.

## Audit coverage

Source inventory: every frontend HTML/CSS/module under `apps/`, static route
allowlist, generated Arena page template, guarded administration asset manifest,
shared theme/header/footer/premium/workbench layers and existing browser suites.
32 public/default routes, eight Pocket Pause modes, six embedded game routes,
signed-in portal views and private entry states were rendered at 390/1440px.
Additional governance audit covers seven routes across Super Admin, Master Admin
and Client roles at both widths (42 checks). Before captures: 100 main checks,
34 supplemental game/private checks and 42 governance checks; supplemental
private captures overlap the main audit. No horizontal overflow observed.

| Area | Screens and states reviewed | Findings / refinement ownership |
|---|---|---|
| Platform | Public hub, app finder, sign-in/setup, apps/favourites/recent/team/profile, unavailable states | Competing cyan/mint palettes, flat inner surfaces; shared tokens and portal adapters |
| Chambers | Overview, clients, cases/dossiers, diary, tasks, notes, documents, fees/payments, expenses, reports, settings/recovery, activity/ledger, dialogs | Small dense text, inconsistent panel/button depth; shared workbench, preserving table/calendar layout |
| Governance | Account, Super Admin, Master Admin, onboarding, org/platform audit, client access and portal | Missing premium stylesheet/body identity; include shared design layer without changing route guards |
| DIGITAL SAMAJ | Setup, community selection, directory, families, registry/tree, member/profile, messages/events/admin | Form/nav surfaces inconsistent; semantic family/tree geometry retained |
| BatchFee Lite | Academy setup, overview, batches, students, dues, payments/receipts, expenses, reports/settings | Flat metrics and forms; financial state colours remain semantic |
| Tournament Lite | Organizer setup/list, tournament editor, entrants/fixtures/scoring, public results | Toolbar/card hierarchy and table readability; bracket geometry retained |
| Timetable Lite | Setup, subjects/classes/teachers/allocations, generation, class/teacher/master views, export/help | Large introduction, fragmented toolbar styles; lesson colours and printable grids preserved |
| News / Fund Lens | Editions/archives/filters, reader and satire, outages; scheme search, selection, comparison, coverage and reports | Inconsistent heading/toolbar/card styles; publication/holding data and charts unchanged |
| Moment Studio | Certificates/designs, cards/occasions, branding, uploads, group export and previews | Warm UI overrides navy shell; unify workspace only, preserve all rendered artwork |
| Ritual Assist | Guides, English/Hindi, materials and preparation packs; remembrance calendar, results/tables/exports | Large headings, small disclosure buttons and repeated blur; use compact shared controls |
| Utilities | QR Maker, Photo Resize, Bill Splitter, Focus, Team Mixer, Decision Wheel | Different page backgrounds, button materials and field borders; retain canvas/export/wheel colours |
| Games | Take a Break hub; Chaos, Make 24, Code, Memory, Lights Out, Face-Off; standalone Daily Spark; eight Pocket Pause modes | Mixed chrome, oversized headings, long hover animation; retain all board/prop/score/state colours and timing |
| Satire Arena | Feed, six reactions, biography/illustration/sharing, editor, daily/category/post/sample/results | Editor/generated pages miss premium layer; excessive card glow; original art and vote semantics preserved |
| Public information | Support, sponsorship, contact, showcase, privacy, terms, legal notices, shared footers | Repeating glow/blur, inconsistent form/panel spacing; shared restrained materials |

## Main inconsistencies

- Shared premium, workbench, shell and app CSS redefine overlapping colour tokens.
  Runtime dark canvases ranged from near-black/charcoal to warm brown and navy.
- Administration/client pages lack the shared premium CSS and `data-ui-app`;
  generated editorial pages and the Arena editor omit premium CSS too.
- Nested panels retain 14–18px backdrop blur. Support cards have perpetual glow.
- Component radii span 9–28px; hover transitions last up to 400ms and scale all
  buttons, including game controls. Some compact disclosure controls are <40px.
- App introductions, game cards and workspace headings consume inconsistent
  space. Table/field typography differs between app-owned layers.

## Implementation strategy

One reusable, screen-only design layer provides canonical light/dark tokens,
navy/slate surfaces, mint interaction accents, subtle top reflections, restrained
shadows, compact typography and control states. Shared shell consumes the same
tokens. App adapters target working chrome rather than generated graphics, game
pieces or business state. Missing pages opt into the shared CSS explicitly.
Do not change engines, validation, permissions, persistence, print/export renderers
or provider integrations. Existing full API/browser suites provide workflow
coverage; repeat the visual audit after changes and fix observed regressions.

## Implementation

- `packages/ui/refinement.css` is imported after premium/workbench CSS into the
  existing compiled bundle. It owns canonical light/dark materials, typography,
  shadows, radii, native accents, controls, focus, motion and app adapters.
- Every maintained frontend HTML page and generated Arena editorial template
  references the shared bundle with a refreshed asset version. Administration,
  audit and client pages gain their missing body identity and shared stylesheet.
- The shared header/switcher uses opaque glossy surfaces and subtle reflections.
  Header geometry, account state, app finder and navigation logic are unchanged.
- Moment Studio's high-specificity warm workspace overrides now resolve to
  shared tokens. Export/canvas renderers and authored design palettes are intact.
- Take a Break retains its grid and game routes, with smaller hub cards, sans
  headings and restrained decorative texture. All board mechanics are unchanged.
- Confessions retains its existing 48px control minimum through an app token;
  generic controls use a 44px minimum. No button state or posting logic changes.
- Existing no-business-API browser assertions now distinguish the independently
  implemented visitor counter from app data requests. Contextual sign-in/catalogue
  selectors distinguish header and featured links from the actual app controls.

## Verification checkpoint

Full Node/API suite: **339/339 passed**. New design-system tests: **2/2 passed**,
covering 31 public routes × 3 widths × 2 themes and seven governance/client routes
at the same sizes (228 combinations). Shared background/material and overflow
checks detect competing per-app overrides, rather than testing CSS source text.

Post-change audit: 112 main page/game/private checks and 42 role-scoped governance
checks, with no horizontal overflow or page errors. Reviewed final Moment Studio,
Take a Break and portal screenshots after fixing two remaining app-level theme
overrides; the focused review adds 40 checks without overflow or page errors.
Repeated inner-surface blur counts dropped from 16 to 2 across initial matched
audit captures; the remaining Arena mini-score blur belongs to a hidden element.

The complete existing browser suite ran all 242 cases: 216 passed initially,
24 failed and two were blocked by a fixture build permission failure. Focused
reruns cover the failures and the blocked hosting checks. Corrections include
stale catalogue counts, passive visitor/auth requests in privacy assertions,
reference-data fixtures, navigation waits and an adequate timeout for the full
route/theme matrix. Product fixes preserve Confessions' 48px controls, fit the
closing showcase scene and suppress misleading outage notices for passive
public-page chrome. Actual API responses are unchanged.

The organisation-enabled production build exports 803 public assets. Focused
Cloudflare Node tests pass 14/14; hosting fallback tests pass 3/3; shared-shell
tests pass 8/8. Final evidence is in `.publish/platform-*-final.log`,
`.publish/platform-last-checks.log` and `.publish/platform-refinement-build.log`.
All fixtures use temporary DATA_DIR values. No records, schema, credentials,
organisation boundaries, authentication or game engines were changed.
