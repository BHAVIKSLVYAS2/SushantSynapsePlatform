# Dead code and retired implementation scan — 2026-10-11

## Cleanup implemented after this scan

Final affected browser verification passes 31/31 in Chrome; Playwright's last-run file independently reports `passed` with no failures. The PowerShell redirected stderr wrapper returns exit 1 because it formats Node's NO_COLOR/FORCE_COLOR warning as a native error record; the test runner reports all passes. API runner exits 0 with 184/184 passing. Export alias comparisons, removed-asset exclusions, syntax and diff whitespace checks pass.

Removed all 12 confirmed unused files plus the old Celebration renderer (13 files total). Celebration validation/filename tests now import the active Moment Studio card renderer. Removed Samaj's unused `parseCSV`, Ritual's unused `scheduleLabel` and its dependent import, and the two removed scripts' static allowlist entries. Legacy public routes, compatibility browser tests/workspaces, private Fund APIs/core/data, test-covered analytics engine, provenance, SQL migrations and recovery remain. Updated architecture and legacy workspace READMEs to clarify ownership. All 184 API checks pass with permitted export access, including Cloudflare; the previous EPERM was an execution-permission issue. Final browser verification status is recorded in the functionality ledger. No deployment or data migration performed.

## Scope and result

Reviewed tracked app/package source against the Node composition, public asset allowlist, HTML/script/import/CSS references, npm commands, worker construction and test imports. No implementation was removed. A textual reference scan is candidate discovery, not proof of arbitrary dynamic reachability; manual follow-up corrected false positives for worker filenames, extensionless CommonJS imports and command entry points. This is not an AST-based exhaustive unused-variable/export or CSS coverage analysis.

There are 12 whole files with no current application consumer that can be considered for removal, totalling 97,719 bytes (about 95.4 KiB). One additional old renderer can be retired after moving its tests. Two unused functions (one exported) and a dependent import are also identified below. Public URL compatibility must remain.

## Removal candidates

| Candidate | Evidence | Cleanup requirements |
|---|---|---|
| All five files in `apps/certificates/frontend/`: `app.js`, `export.js`, `index.html`, `renderer.js`, `style.css` | `server/static-assets.js` maps `/certificates` and its script/renderer/export/style URLs to Moment Studio. No current source consumer loads this old implementation. Its internal imports only connect the obsolete files. `export.js` is an exact duplicate of the active Moment Studio certificate export. | Remove old implementation while retaining all `/certificates/*` aliases. Retain browser tests under `apps/certificates/tests`: they exercise the active URL, not the old filesystem implementation. Keep package/test ownership until those workflows are deliberately relocated. |
| `apps/celebration-studio/frontend/app.js`, `index.html`, `style.css` | All corresponding public URLs are mapped to Moment Studio; old editor/page/style have no live consumer. | Remove these three files, preserving `/celebration-studio/*` routes and its active compatibility browser tests. |
| `apps/fund-overlap/frontend/portfolio-ui.js`, `analytics-ui.js` | Neither is allowlisted, loaded by current Fund Lens HTML, nor mounted by current `app.js`. Their UI was explicitly retired. | Remove retired UI modules. Preserve backend portfolio/watchlist APIs and stored records. Do not remove `portfolio-core.js` with the UI: the backend imports it. |
| `packages/ui/workbench.js` | Only current source reference is its static allowlist entry; served HTML loads `platform-shell.js` instead. Architecture explicitly labels it legacy and unloaded. | Remove legacy heading-decoration script and `/shared/workbench.js` allowlist entry together. Keep `workbench.css`, which is still compiled into the premium bundle. Previously cached/outside pages are not audited by this scan. |
| `apps/ritual-assist/frontend/calendar-worker.js` | Only current consumer reference is its public asset allowlist entry. Calendar frontend requests Node calculation; backend constructs `calendar-thread.mjs`, not this browser worker. | Remove old browser worker and its allowlist entry together. Preserve backend worker, calendar engine and PIN/date validation. |

The counts above include five certificate files, three Celebration files, two Fund UI files and two unloaded scripts. Their source size does not equal frontend download savings: most are already excluded from deployment. Only the allowlisted unloaded scripts currently enter the export.

## Retire after dependent cleanup

- `apps/celebration-studio/frontend/renderer.mjs` (8,002 bytes) is not served. Its only external current source consumer is `tests/celebration-studio.test.js`; the old editor also imports it. Move the bounded bilingual validation/filename tests to `apps/moment-studio/frontend/card-renderer.mjs`, checking current contracts first, then remove the renderer. Tests against retired code do not establish active renderer correctness.
- `apps/fund-overlap/frontend/analytics-engine.js` is retained by `tests/fund-analytics.test.js` and the retired analytics UI, with no active backend/frontend consumer found. It is a candidate if the retired calculators are permanently out of scope, but deleting its tests is a product/test-scope decision. Do not classify `portfolio-core.js` in the same way.
- Old `apps/certificates` and `apps/celebration-studio` package manifests are workspace members and still contain useful browser tests/README context. Remove entire workspace directories only after relocating tests and resolving documentation/package-lock references. Removing the stale frontend files does not require removing their public URLs or app-ID preference aliases.

## Unused helpers and imports

- `apps/digital-samaj/frontend/app.js:61`: `parseCSV()` has no call or export reference. Current `import-file` handler sends file bytes to `/imports/file`; backend spreadsheet parsing is active. Remove this browser parser without changing the import workflow or backend parser.
- `apps/ritual-assist/frontend/preparation-pack.mjs:21`: exported `scheduleLabel()` has no importer/call in tracked source or tests. Its `occasionTitle` import on line 3 exists solely for this function; remove both together. Keep the module's active preparation-pack exports and source/conditional-date content.

No unused third-party dependency was established. `mssql` serves SQL connectivity, `msnodesqlv8` supports local Windows integrated authentication, and Playwright/Tailwind/Wrangler serve test/build/deploy commands. Azure Linux deployment can omit the optional Windows driver without removing local support from the repository.

## Unused at runtime, intentionally retained

- `apps/satire-arena/frontend/extra-cast.svg` is no longer displayed; README/ARTWORK explicitly retain it as original artwork provenance. Keep the source artifact. Its public allowlist entry is an export cleanup candidate, separate from deleting provenance.
- SQL/SQLite schemas, immutable migration history, transfer tools, database recovery sources and `data/records.json` remain required. One SQL database with schemas does not make compatibility/recovery implementation disposable.
- Private Fund Lens records/APIs remain intentionally preserved despite the retired interface.
- Legacy `/certificates`, `/celebration-studio`, `/arena` and related asset routes remain used compatibility interfaces. Browser tests verify them. Old stored app IDs are mapped by the registry/portal; retain those mappings.
- `sqlserver-worker.js` and Ritual `calendar-thread.mjs` are dynamically constructed worker entry points. Both are active.
- `refresh-national.js`, ingestion scripts, provisioning commands and `seed-demo.js` are operational/manual entry points rather than page imports. The demo script creates an isolated temporary workspace; lack of an API caller is expected.
- `premium.tailwind.css`, generated `premium.bundle.css`, `workbench.css`, vendor QR/astronomy code and legal notices are active build/runtime/attribution assets.
- Current Arena PNG portraits/expression sheets are used by CSS, feedback and sharing. Do not remove artwork based on missing static ES imports.
- Ignored `.publish`, `dist`, `.wrangler`, logs, traces and screenshots are build/release evidence, not dead app code. Release directories may be running backend entry points; inventory processes and retention before any artifact cleanup. Runtime data is excluded from removal.

## Verification and proposed cleanup sequence

Focused `node --test tests/moment-studio.test.js tests/celebration-studio.test.js tests/ritual-calendar-export.test.js` passed 10/10, including legacy URL ownership and preparation pack exports. These checks verify current contracts and expose the old renderer's test dependency; they do not prove a deletion patch safe because no deletion patch was made. No browser or live deployment verification was performed for this scan. The earlier full-suite Cloudflare export EPERM failure remains unresolved; the full suite was not repeated.

For implementation: first remove the 12 unused files and the two helper functions/import, with associated allowlist cleanup; then move legacy renderer tests to the active renderer and retire test-only code as scoped above. Run relevant API/engine checks and certificate/celebration/Samaj/Ritual browser workflows against isolated data. Rebuild/export into an isolated permitted directory and confirm aliases still map to Moment Studio, private Fund data remains protected, and no removed file is requested. Preserve runtime data, schemas and release evidence throughout.
