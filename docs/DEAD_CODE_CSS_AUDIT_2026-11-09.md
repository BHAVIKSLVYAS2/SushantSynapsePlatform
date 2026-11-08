# Dead code and unused CSS audit — 9 November 2026

Analysis only. No application edits, removal, build, deployment or data changes.
Baseline: committed source through `557bb59`. Previous October/November removal
batches were read and checked; their already removed findings are not counted again.

## Scope and limits

Inventoried 1,927 tracked files across all 28 app directories, packages, server and
infrastructure. Existing lexical source screening covered 649 non-test source/
configuration files and flagged 14 single-occurrence declarations and 59 basename
reference candidates. These are discovery counts, not confirmed dead files.
Extensionless CommonJS, worker entry points, operational scripts, tests and public
compatibility exports require separate checks. No whole app/module is established
as safe to delete by this pass.

CSS screening examined 74 authored stylesheets against 580 non-test JS, HTML,
configuration and SVG sources, excluding data/dist/vendor paths and generated CSS
bundles. It flagged 984 selector occurrences across 42 stylesheets containing at
least one class/ID token absent from that source corpus. This is NOT 984 unused
rules: dynamic names, mixed selectors, `:is()` branches, embedded/generated markup
and external compatibility can defeat token matching. Missing a token from one
branch does not make its entire declaration block removable. Conversely this scan
does not detect all unreachable combinations or overridden declarations.

No runtime CSS coverage or exhaustive AST/scope analysis was performed. A default
page-load coverage percentage would misclassify menus, validation, print, themes,
responsive states and lazy sections. No size saving or performance gain is claimed.

## High-confidence source cleanup findings

| Area | Evidence | Safe cleanup boundary to verify in implementation |
| --- | --- | --- |
| Ritual Prep unused import | `apps/ritual-assist/frontend/app.js:7` imports `mountLanding`; no read/call follows | Remove this binding. Keep the module: `illustration`, `categoryIcon` and `updateLanding` are active. |
| Home retired presentation | `apps/portal/frontend/home.css:25` onward retains `.home-welcome`, `.home-features`, `.home-daily`, `.home-paths` and `.public-hero` branches. Current HTML/controllers have no producers; portal tests explicitly assert welcome/features are absent. Matching dead branches also exist in platform/shared CSS. | Remove identified branches individually, preserving Comfort/Compact cards, discovery controls and current artwork. Rebuild home CSS through its owner. |
| Older Moment Studio bento | `packages/ui/workbench.css:3` onward retains blocks gated by `:has(.studio-bento)`, plus `.studio-featured`, `.tool-tile`, `#studio-command`. No current runtime producer found; shared shell/refinement CSS contains related branches. | Remove the obsolete component branches. Do not delete the entire shared stylesheet or its active rules. |
| News old index | `apps/news/frontend/style.css:475` onward styles `.headline-index`, including responsive and print branches; no current markup/controller producer found. | Remove only that component's branches, retaining live edition navigation, reader and print styling. |
| Fund Lens retired portfolio/analytics presentation | `apps/fund-overlap/frontend/style.css:7` and `:14` retain `.analytics-controls`, `.portfolio-entry`, `.portfolio-transactions`, `.portfolio-preview`, `.my-portfolio`, `.rolling-panel` and `.sip-panel` families with no current UI producer; previously retired UI files remain removed. | Remove verified absent UI selectors. Preserve current calculators, local performance UI, private APIs, portfolio core, records and test-covered analytics engine. |
| Admin old grid | `apps/admin/frontend/style.css:1` retains `.panel-grid`, `.panel-grid>.card`, and a mixed `form,.panel-grid` media rule without a current producer. | Remove the grid selectors; retain `form` responsive declarations. |
| Certificate wording panel | `apps/moment-studio/frontend/certificates.css:4` and `:8` retain `.wording-tools` rules without current markup/controller creation. | Remove those rules, retaining the certificate editor and wording controls that use other selectors. |
| Daily Spark old celebration element | `apps/daily-spark/frontend/style.css:3` retains `.spark-celebration` and `.spark-solved .spark-celebration`; no current element producer found. | Remove these selector branches, not all `.spark-solved` styling. |
| Ritual older dashboard/arrangement presentation | Calendar CSS retains `.summary-grid` and `.remembrance-dashboard`; arrangements CSS retains `.arrangement-fields` and `.checklist-toolbar`. Current controllers/templates do not produce these structures. | Remove verified component branches, preserving date results, current item editor, remembered checks, export/print states and current reader. Recheck older browser assertions against the actual current markup. |

These are source-reachability findings, not a deletion patch that has passed tests.
Public asset compatibility should be reviewed before retiring exported helpers.

## Code candidates requiring a contract decision

- `mountLanding()` in `apps/ritual-assist/frontend/landing.mjs:21` has no caller
  besides the unused import binding. Its language-reparenting role now overlaps
  the active workspace controller. Candidate for removal after checking startup,
  shared language control and legacy guide entry routes.
- `codeSecret()` in `apps/take-a-break/frontend/engine.mjs:14` has no repository
  caller/test found; current game and tests use `codePuzzle()`. It is exported
  from a public browser module, so distinguish compatibility from internal dead code.
- `civilBoundary()` in `packages/vedic/lunar-calendar.mjs:54` has no repository
  caller/test found and is not re-exported by the package index. Candidate helper;
  preserve `civilInstantFromTT`, which other calculations actively use.
- `messages.mjs`, `analytics-engine.js`, preparation-pack helpers, `calendarIcs`,
  seat-admission policy and other test/compatibility exports remain intentionally
  retained. Test-only reachability does not by itself justify deleting a contract.

## False positives explicitly checked

- Fund Lens `heat-${...}` classes: generated by `frontend/app.js:308`; keep.
- Decision Wheel `slice-${index%8}` classes: generated by its controller; keep.
- Theme `swatch-` plus theme key: generated by `packages/ui/theme.js:29`; keep.
- Vendor `$4` declaration and `hugs` in certificate message prose are not reliable
  dead-code findings from lexical matching.
- Backend modules reached by extensionless requires, astronomy/SQL workers,
  ingestion generators and manual verification scripts are not orphan components.
- SVG artwork, vendor attribution, historical migrations, legacy source data and
  recovery/transfer tools are outside deletion scope.

## Priorities and implementation validation

Largest raw CSS candidate concentrations (not confirmed unused-rule counts):
Home 248; portal platform 91; Ritual calendar 84; Arena 81; Fund Lens 73; shared
workbench 63. Arena artwork/dynamic class families need deeper inspection before
removal. The highest-value first batch is Home/shared retired component branches,
then Ritual and Fund Lens obsolete UI styling, then small app-specific leftovers.

`infrastructure/build-home.cjs:9` combines platform/header/footer/WhatsApp/premium/
home/location/shell CSS into `home.bundle.css`; `premium.tailwind.css` imports
workbench CSS. Generated bundles must be rebuilt from source, not hand-edited.
After cleanup, verify both Home modes, three languages/themes, 320px/mobile/desktop,
menu/error/empty/lazy states, Ritual language/reader/checklist/export, Fund Lens
search/performance/calculators, Studio exports and private administration. Use
isolated DATA_DIR fixtures, then build/export integrity checks. Production remains
unchanged until a separately authorised implementation/deployment request.

Evidence: `.publish/dead-code-audit.json`, `.publish/dead-code-audit-2026-11-09.log`,
`.publish/css-audit-2026-11-09.py`, `.publish/css-audit-2026-11-09.json`,
`.publish/css-audit-2026-11-09.log`, `.publish/import-audit-2026-11-09.json`.
