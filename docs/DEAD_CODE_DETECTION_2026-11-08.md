# Repository dead-code detection — 8 November 2026

## Authorised cleanup continuation

User subsequently requested fixes and deployment. Removed the eight confirmed
source targets listed below: unused shuffle import, obsolete hub category marker,
retired filter/Surprise/featured-art CSS selector branches, obsolete round-controls
disclosure styles, old English/Hindi sharing-copy assignments and the three unused
helper/constant exports. Mixed selectors retain their live branches. Source removal
totals 6,998 bytes relative to the pending interface-fix tree; this is not an HTTP
payload or timing measurement. Tested compatibility and operational candidates
remain retained. Take a Break language/Options fixes are included in this release.
Verification and deployment results are recorded in the functionality ledger.

Detection only, before removal or deployment. Pending Take a Break language and
Options fixes are preserved. No application code was deleted during this audit.

## Scope and method

Inventoried 1,888 tracked files, including 1,534 JS/MJS/CJS/CSS/HTML/JSON/Python
sources and 627 non-test source/configuration files under apps, packages, server
and infrastructure after excluding data/dist paths. All 27 app directories were
included, alongside shared packages, composition, build tooling and tests.

Local lexical screening produced 17 single-occurrence declaration candidates and
57 files without another source containing their complete basename. These are
triage results, not deletion counts. Screening is not an AST/scope analysis: strings,
comments, dynamic property access and extensionless imports can produce misleading
results. Example: "hugs" in certificate prose was incorrectly recognized as a
declaration. Manual searches checked importers, explicit asset mappings, generated
delivery, dynamic mounts and test/compatibility uses for the findings below.

Raw evidence and disposable screening script: `.publish/dead-code-audit.json` and
`.publish/dead-code-audit.cjs`. No new dependency or external scanner was installed.

## Confirmed first removal batch

| Area | Evidence | Removal boundary |
| --- | --- | --- |
| Take a Break unused import | `frontend/app.js:5` imports `shuffle`; no other use in that controller | Remove the import binding, retain the engine export for other consumers |
| Take a Break retired filter components | `frontend/style.css` retains `.filters`, `#surprise`, `.break-toolbar` and `#hub[data-category=choose]` rules; current markup/controller have no filter toolbar, Surprise action or category switching | Remove those selectors and obsolete `data-category=all`; retain `#break-filter-status`, which displays lazy-load errors |
| Take a Break retired feature component | `.spark-feature`, `.feature-play`, `.spark-detail`, `.hub-meta`, old `.play-art`/art-decoration selectors remain without matching markup or controller creation | Remove verified absent component rules, preserving active `.spark-setup` and embedded Daily Spark controls |
| Take a Break obsolete disclosure styling | `usability.css` styles `.round-controls details button`, but round options are native popover divs | Remove obsolete rules; retain game instructions' summary chevrons and popover lifecycle |
| Ritual Assist retired checklist-sharing copy | `frontend/app.js:64–65` assigns English/Hindi keys for old guide links and text-snapshot sharing; those keys have no reads in the controller | Remove the two obsolete assignment blocks; retain active image sharing, PDF/print preview and shared `share-result.mjs` |
| Pandit Booking unused formatter | `frontend/locale.mjs:5` exports `checklistLine`, with no consumers or tests found | Remove this helper only; retain the locale module and canonicalization |
| Moment Studio unused template list | `frontend/certificate-renderer.mjs:13` exports `playfulTemplates`, with no consumers or tests found | Remove the list only; retain supported templates and renderers |
| Ritvayam unused constant export | `frontend/language-shell.mjs:7` exports `languagePreferenceKey`, with no consumers or tests found | Remove the export only; retain the actual language preference implementation |

Line references describe the audited working tree. No whole application or active
component is established as removable by this first batch.

## Candidates to retain pending separate compatibility decisions

- `satire-arena/frontend/spotlight.mjs` has no current in-repository consumer of
  `spotlightCast`, but is explicitly served and documents an existing-import
  compatibility purpose. Do not silently delete its public URL.
- Bill Splitter `splitExpenses`, Daily Spark `practicePuzzle`, Photo Resize
  `profileOptions`, organisation seat admission, and other older exports have
  focused tests or stated compatibility contracts. Runtime import absence alone
  does not establish dead functionality.
- Ritual `calendarIcs` remains tested; `calendar-export.mjs` also provides active
  occasion titles and ICS folding. Preparation-pack exports are retained by the
  documented architecture. Do not delete these modules as unused screens.
- Moment Studio `messages.mjs` and Arena `ad-policy.mjs` retain tests and public
  asset/policy responsibilities despite missing current runtime callers.
- Vedic `dev/*.html`, verification/preview scripts, Android test bridge and live
  verification scripts are development/operational entry points. They need not be
  imported by the production runtime to be useful.
- Node SQL Server, DIGITAL SAMAJ, News and Fund Lens modules flagged by basename
  screening are reached through extensionless require calls. They are not dead.
- Generated bundles, dictionaries, place-directory data, vendor astronomy code,
  schemas, migrations, recovery tooling and retained legacy data are not deletion
  targets. Rebuild generated output through its owning pipeline after source edits.

## Verification required after removal

1. Review each selector against authored markup, dynamic templates and shared
   embedded app markup; remove individual dead selector branches, not mixed live rules.
2. Run focused Take a Break/Daily Spark, Ritual exports, Pandit locale, certificate
   and Ritvayam language checks. Check language controls and Options in all themes.
3. Run the complete isolated Node/API suite and relevant browser workflows; build
   the organisation-enabled production bundle and inspect registry/asset integrity.
4. Record actual removals and results before a separate deployment step.

This is a repository-wide first detection pass, not proof that every unused symbol,
CSS rule, image, dependency or dynamically resolved component has been identified.
No runtime coverage, dependency advisory scan, production access, build or test
execution was performed for this detection-only pass. No size/performance saving
is claimed until source cleanup and rebuilt assets have been measured.
