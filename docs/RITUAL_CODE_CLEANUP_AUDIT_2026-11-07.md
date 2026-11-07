Implementation status (2026-11-07): the pending fixes in this report have now been implemented for release. See the top of FUNCTIONALITY_LEDGER.md for precise scope, verification and deployment. Measurements and audit-only statements below describe the original baseline. Tested preparation-pack exports and shared translations are retained. Ritvayam search shares the API; its existing calculation/birth-form directory dependencies remain.

# Ritual Assist cleanup audit — 2026-11-07

Analysis only. No application code, assets, database, commit or deployment changed.
Scope: Ritual Assist and the shared assets imported by its current calendar and
preparation pages. This is not a whole-platform unused-code certification.

Measurements use source files and the production build archived for `ece7431`.
Compressed sizes below are local gzip estimates, not observed network transfers.
No browser CSS coverage or load-time benchmark was run. A selector absent from
one screen is not proof it can be deleted: print, dialogs, Hindi, themes, errors,
keyboard focus and responsive states all need preserving.

| Candidate | Evidence | Gain and qualification |
| --- | --- | --- |
| Retired dashboard and reminder UI | `calendar-dashboard.mjs` and `calendar-tools.mjs` have no current page/import callers. Remaining references are public asset registration/documentation. | 25,808 source bytes; about 20,672 built bytes removed from published inventory. No ordinary page-download saving: these modules are already outside the page graph. Update allowlist/docs together. |
| Preparation-pack module | `preparation-pack.mjs` is reached only through retired UI in the application, but unit tests still exercise its pure exports. | 2,404 source bytes. Optional retirement requires an explicit decision about retaining those export capabilities and associated tests; do not delete as an unreferenced UI file. |
| Retired CSS families | Old date steppers, observation dashboard/table, sticky remembrance actions, preparation pack, export previews/options and removed next/reminder panels remain in loaded CSS. | Conservative family scan found about 13,690 source bytes across `calendar.css` and `mobile-workspace.css`, roughly 2,372 gzip bytes. Fourteen mixed rules in calendar.css and three in mobile-workspace.css require manual selector edits; never remove the whole rule merely because one selector is obsolete. This is a candidate estimate, not an automatic purge list. |
| Duplicate Panchang module URL | The production calendar graph imports the same hashed `panchang.mjs` both with `?v=20261104-festivals` and without a query. Browser module identity includes that query. | One redundant module identity/request: 15,934 production bytes, approximately 6,672 gzip bytes. Canonicalise imports while retaining content-hashed asset invalidation. |
| Heavy calculation dependency in browser display code | Calendar controllers/cards import `panchang.mjs` and `lunar-core.mjs` for tithi/month names, date helpers and row selection; those modules import the astronomy engine. Calculations themselves use the server API. | The three underlying built files total 124,333 bytes, about 51,599 gzip bytes, before allowing for replacement display helpers. Approximate opportunity: 110–120 KB uncompressed / 45–50 KB gzip. Refactor presentation helpers away from computation. Keep the actual engine and server calculation modules. This overlaps the duplicate-module opportunity; do not sum naively. |
| Eager location directory | The calendar's static import graph includes a bundled `places.mjs` at 573,266 production bytes (228,629 gzip bytes). It is used for supported-city lookup, search and detection. | Defer approximately 229 KB compressed from initial calendar loading if data loads on search/detection or restored-location hydration. This defers useful data; it does not reduce total transfer once the lookup is needed. Preserve supported-city resolution, restored preferences, canonical/generated directory files and attribution. |
| Shared translations | Both pages include `shared/language.js`, 153,935 production bytes / 43,446 gzip bytes. | Worth a separate per-app dictionary audit. The module is active, not established dead code. No deletion-size claim until shared headers and all supported languages are traced. |

Additional small candidates: unused `formatDate`, `instant` and `notice` helpers
in `calendar.js`; exported legacy PNG conversion/copy helpers now superseded by
`share-result.mjs`; old export-option labels; the uncalled `load({next:true})`
branch in `observance-calendar.mjs`. Inspect their exact references before removal.
Per-event ICS buttons still call `download`, `observanceIcs` and
`reminderOccurrences`; those functions are active and must not be deleted as part
of an unused-code cleanup. Pure calendar text/ICS functions also have tests.

Recommended implementation order:

1. Retire the two unused UI modules, their public mappings and exclusively retired
   styles; retain shared/mixed rules. Keep preparation-pack retirement separate.
2. Canonicalise duplicate module URLs. Combined with CSS cleanup, the initial
   candidate saving is about 9 KB gzip on calendar pages and one module request;
   deleting the unused UI modules itself provides no normal page-transfer gain.
3. Separate display-only date/tithi helpers from server calculation dependencies.
4. Consider lazy location-directory loading with a deliberate loading/error flow
   and saved-location hydration. Benchmark before promising faster interactions.

Before implementation is released, verify Vrat and Shraddh calculation results,
single-year and multi-year PNGs, location search/detection/restore, guide selection,
saved checklist state, print/PDF and light/dark/deep themes in English and Hindi.
Update stale tests only where a deliberately retired UI has removed its feature;
do not weaken checks for remaining functionality.

## Additional live UX checks

Read-only browser review at 390 x 844 confirmed two further issues:

1. Vrat → Shraddh retains the same document and a temporary in-memory marker.
   Opening Ritual Prep requests `/ritual-assist/guides` as a new document and loses
   that marker. `workspace-nav.mjs` creates calendar buttons with an in-page
   callback, but uses an ordinary anchor for Prep; the reverse trip uses anchors
   too. The global shell's Opening app transition may also appear. This is real
   page navigation, not merely a visual animation.
2. With both `data-theme=dark` and `data-theme-style=deep` intact, the calendar
   platform header computes to `rgb(8,8,8)` while Prep computes to
   `rgb(10,32,50)` (`#0a2032`). The Prep gallery has its own navy dark palette and
   `!important` header/control backgrounds tied to `--ritual-panel`. These override
   the shared Deep Black presentation; the saved preference is not being lost.
   Screenshot: `.publish/ritual-deep-prep-audit.png`.

Recommended fixes, before cosmetic transition work:

- Give all three sections one persistent Ritual workspace/header and local section
  navigation. Mount Prep lazily, retain the existing calendar controllers and
  results, and preserve guide selection, checked items, scroll positions, language,
  deep links, reload entry points and Back/Forward behavior. Explicit mount/cleanup
  contracts are needed: current controllers query document-wide IDs and install
  global event handlers. Do not inject another page's HTML/scripts into the DOM or
  add an iframe. Loading feedback should be limited to first Prep loading, with
  reduced-motion support. This is a scoped architectural change, not a one-line
  anchor replacement.
- Map Prep-specific palette tokens to shared Deep Black tokens when deep is
  selected; remove app ownership of shared-header colours. Keep the existing Light
  and Dark palettes. Apply saved theme before first paint to avoid an additional
  colour flash during entry.
- Verify zero document navigation across all three tabs, retained calculations
  and drafts, correct Back/Forward, direct URLs, and computed neutral header colours
  on mobile and desktop. Header colour can be fixed independently of navigation.

No runtime implementation or deployment was performed during this review. The
browser emitted a blocked Cloudflare Insights beacon CSP error; it is separate
from these two reproduced issues and should not be addressed by weakening CSP.

### Three-tab selection styling

Live mobile checks covered each section in Light, Dark and Deep Black. Colours
were measured after finite CSS transitions completed, not during interpolation.

| Theme | Active Vrat/Shraddh surface | Active Prep surface | Observation |
| --- | --- | --- | --- |
| Light | `#edf5f4` | `#ffffff` | Vrat/Shraddh active surface equals the strip background, weakening the selection cue. |
| Dark | `#1d393c` | `#142a3d` | Different active fills depending on which section is open. |
| Deep Black | `#1d393c` | `#080808` | Calendar tabs retain a teal surface instead of the neutral Deep Black treatment. |

Measured active-text contrast is above 4.5:1 in these settled states. The verified
problem is weak/inconsistent active-state distinction, not failing text contrast.
Calendar tabs use buttons with both `aria-pressed` and `aria-current`; Prep uses
links with `aria-current`. General button/pressed rules and page-specific palette
rules compete with the common tab selector. These active styles are not dead CSS:
replace/normalise their ownership before deleting legacy rules.

Use one component-owned active selector and theme tokens for all three controls,
with a consistent selected fill/on-fill pair and a persistent underline or border
plus stronger type weight. Keep inactive tabs neutral, keyboard focus distinct
from selection, 48px touch targets and reduced-motion behavior. Test settled and
transitioning colours, exactly one selected section, and keyboard/Back behavior
on mobile and desktop. Audit data: `.publish/ritual-tab-colour-audit.log`.
No application changes or deployment performed.
