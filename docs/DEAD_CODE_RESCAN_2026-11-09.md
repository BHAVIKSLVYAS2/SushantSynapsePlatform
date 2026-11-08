# Dead-code rescan after Fund Lens and Times retirement

Implemented locally at the user's request; no commit or deployment in this pass.
Unrelated untracked OWASP/performance reports were left untouched.

## Analysis and removals

Reinventoried 1,204 tracked files and 590 runtime/configuration sources. Parsed
442 maintained JS/MJS/CJS files with Node's bundled Acorn parser, without installing
a scanner or dependency; all parsed successfully. Checked local declarations and
import bindings, followed references and existing test/compatibility contracts,
and screened 68 authored stylesheets against 526 markup/script/config/SVG sources.

Removed confirmed unused declarations/imports/helpers across fifteen JS modules:
Admin's unused formatter; BatchFee's obsolete reminder formatter; Samaj's unused
field list, validation/async-array imports and unused membership result bindings;
Portal's old sculpture helper; Ritual's unused theme helper, unattached illustration
and navigation binding; the fullstack Worker's unused frontend-proxy import;
unused SQL-generator bindings; an unused theme-option binding; and a lunar-calendar
constant. Also removed unreferenced `codeSecret` and `civilBoundary` wrappers.

Samaj membership calls and their awaits remain intact. Node's required roles and
permissions seed import is retained; only its unused edge counterpart was removed.
The initial startup check caught an over-broad import removal, which was restored
before the final complete suite passed. Existing validation and role rules remain.

Removed 548 unreachable CSS selector branches and 66 obsolete simple alternatives
across 27 authored stylesheets, reducing authored CSS by 45,848 bytes. Covers old
authentication, catalogue/card, heading artwork, ritual dashboard/checklist and
small utility layouts left behind by prior redesigns. Generated Home/premium
bundles were rebuilt through their owning pipeline, not edited manually.

Selector pruning preserves live branches and specificity: only equal-specificity
simple class alternatives are pruned from mixed functional lists. Negations and
complex lists retain their semantics; a wholly impossible selector can be removed.
Template/concatenation prefix/suffix screening protects dynamically constructed
classes, including game sprites/particles, wheel slices, theme swatches, Hisabio
rows and generated calendar/astrology states. Vendor CSS/data are excluded.

## Intentionally retained

- The two flagged `beforePositions`/`afterPositions` destructuring bindings in
  Rashifal intentionally exclude internal fields from the returned object; removing
  their omission would change the output contract.
- Tested engine exports, public compatibility modules, operational/development
  entry points and extensionless CommonJS dependencies remain active contracts.
- Existing accounts, business records, archives, documents, databases, caches,
  immutable schemas, recovery metadata and migrations remain unchanged.

This is removal of confirmed dead code, not a guarantee of exhaustive reachability
proof for arbitrary dynamic JavaScript. No whole application was retired here.

## Verification

- Final full isolated Node/API suite: **560/560 pass**.
- Focused Samaj Node/edge and BatchFee checks: **32/32 pass**.
- Initial focused recovery/catalogue/policy checks: **11/11 pass**.
- Playwright CLI: **192 public/signed-in width/theme/layout states**, zero matches
  for removed selectors against rendered DOM, no overflow or page errors. Both
  Home modes, reader chapter navigation, public utilities and signed-in Chambers,
  BatchFee, Samaj and Tournament were exercised using a temporary DATA_DIR.
- Existing fee/theme browser suite: eight cases passed initially; its sole
  cross-tab click timeout passed on an isolated rerun (**nine distinct cases pass**).
- Isolated production-profile organisation/D1 dry build passes: 644 exported
  public frontend assets, no deployment. Syntax and diff whitespace checks pass.

Source-byte reduction is not a measured network/latency improvement. Generated
bundle compression and page behaviour were verified separately; no production
requests or business writes were made.

Evidence: `.publish/ast-rescan.json`, `.publish/css-dynamic-forms.json`,
`.publish/dead-css-rescan-removal.json`, `.publish/rescan-node-final.log`,
`.publish/rescan-business-rerun.log`, `.publish/rescan-focused.log`,
`.publish/rescan-browser-results.json`, `.publish/rescan-browser-workflows.log`,
`.publish/rescan-theme-rerun.log`, `.publish/rescan-production-build.log`,
`output/playwright/rescan-home.png`.
