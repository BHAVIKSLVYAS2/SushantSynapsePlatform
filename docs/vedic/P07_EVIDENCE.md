# P07 D9 and North/South chart views

Date: 2026-10-24 (Asia/Kolkata). PHASE COMPLETE within internal implementation
scope. Full regression 447/447 and focused Chrome 3/3 pass. No public activation.

## Implemented scope

`packages/vedic/d9.mjs` maps P04/P06 unrounded sidereal longitudes into the
standard Parasari Navamsa rule: movable starts from itself, fixed from ninth,
dual from fifth. It uses canonical i*360/108 start-inclusive boundaries via
the existing classifier. Multiplying longitude by nine and flooring is avoided
at adjacent-double boundaries. Returned indices are 0..107 globally and 1..9
within natal Rashi; mapped Rashi is 1..12.

D9 ascendant and all nine grahas are mapped separately; house numbers refer to
D9 Lagna. Source Rashi/longitude are retained, mean-node labels survive, and
no physical D9 longitude, distance/vector or interpretation is invented.
`divisionalChartsAtInstant` returns a D1/D9 pair from one D1 snapshot. Source
boundary screens and all inherited time/model/release warnings remain visible.

`birth-divisions.mjs` repeats P06 birth/place admission and conservative minute
screening, adding D9 source-division boundary checks using the same angular
guards. Approximate/unknown and near-boundary minutes return UNSTABLE_BIRTH_TIME.
Passing is nominal screening, not certified P14 sensitivity. The unchanged D1
bridge remains separately usable when D9 is withheld.

App-owned `apps/rashifal-kundli/frontend/chart-model.mjs` checks nine-body,
twelve-house sign/occupancy consistency. Its immutable model supplies both
layouts and the visible numeric table. North Indian houses are fixed
counterclockwise from the top diamond; South Indian signs are fixed clockwise
from Aries in the second top cell, Pisces top left. Exact/source ascendant
longitude is a separate summary. D9 table longitudes are explicitly source
values; display rounding never determines placement.

`chart-view.mjs` adds D1/D9 and North/South pressed-state controls, focusable
house buttons (Enter/Space), full-name accessible labels, selected-house details
and row highlighting. Crowded cells show three codes and a remaining count;
all nine bodies stay in the table and accessible names. CSS uses shared --ui-*
tokens; shared theme.js owns light/dark/system preferences. No birth details
enter storage, analytics, third-party requests, DOM HTML strings or public links.

The explicit `infrastructure/preview-vedic-charts.cjs` development harness
bundles in memory, binds 127.0.0.1 only and serves a fixed public-file allowlist
with a restrictive CSP (connect-src none). The dev page uses a synthetic
2000-01-01 12:00 IST Delhi exploration instant, clearly labelled nominal; this
minute's D9 is withheld by the strict birth bridge. The preview does not bypass
that boundary for real birth input. P07 files are absent from the platform's
public static allowlist and no app card/route or production export was added.

Package/lock version is 0.7.0. No new npm dependency, chart library, production
schema/account/data change, private persistence or Ritual Assist import change.
P09 birth-entry/public integration and P08 Dasha remain separate phases.

## Verification and source limits

The compact mapping fixture contains 108 hand-enumerated expected signs from
the frozen P01 modality rule, independent of the runtime global-index shortcut.
It is agent-authored design data, not independently reviewed source goldens;
the fixture/report state that explicitly. No external chart software or code
was copied. The earlier PAC/IAE, full Lagna and sunrise acceptance gates remain
open; D9 is not an empirical prediction or a claim of production readiness.

Six focused Node tests pass: every division against the separate table; all
108 boundaries at before/exact/after doubles (324 inputs); D9's own Lagna and
house mapping/source coordinates/opposite mean nodes; stricter birth-minute
withholding (including D1-pass/D9-fail cases); checked view model and injection/
occupancy rejection; and report reproduction.

Saved P07_REFERENCE_RESULTS.json verifies 894 D1/D9 pairs (1,788 numeric tables,
16,092 body rows) across six cities and annual 1950..2098 samples. The annual
fixed-time grid sees only D9 ascendant signs 6,7,8,9,11, recorded as such. It is
an internal consistency grid, not full-domain astronomical certification.

Actual isolated workerd parity passes four chart pairs plus all 324 boundary
inputs, 3,244 numeric comparisons, max numeric difference 5.10e-11; compiled
kernel is 71,931 bytes, excludes places and retains NumFOCUS notice. This
cross-runtime evidence is not an independent astronomical reference.

Three headless Chrome checks pass (final rerun, .publish/vedic-p07-browser.log):

- D1/D9 x North/South x 320/390/1440px x light/dark/system (36 combinations),
  plus system theme responding to OS light/dark changes. Graphics/table values
  agree with numeric kernels, no global horizontal overflow, no external
  requests or browser page errors.
- Keyboard house selection, selected-house details, focused/exclusive controls,
  source-longitude headings, South Aries/Pisces fixed cells and theme-only
  storage keys.
- All twelve explicitly synthetic rising signs, both styles and nine-body
  crowded-cell stress cases, with complete occupants in labels/table.

Screenshots were visually inspected, including refreshed larger SVG labels:
`.publish/vedic-p07-north-390-light.png` and
`.publish/vedic-p07-south-320-dark.png`. Text/table remain visible independently
of the compact diagram. These are local screenshots, not a public release.

Full isolated repository regression passes **447/447**, zero failures, 211.969s.
Log: .publish/vedic-p07-full-tests.log (includes all seven new Node/Worker tests).
Final focused browser rerun passes **3/3** under concurrent regression load,
log .publish/vedic-p07-browser.log. Offline P07 report, P06 source fixture,
public-allowlist absence, package/lock and whitespace checks pass. No commands
or preview servers remain running. No commit/push/deployment is claimed.

Reproduce without network/source capture:

```powershell
node infrastructure/verify-vedic-d9.cjs --check
node --test tests/vedic-d9.test.js tests/vedic-d9-worker.test.js
npx.cmd playwright test apps/rashifal-kundli/tests/browser.spec.js
```

Review the local fixture using `node infrastructure/preview-vedic-charts.cjs`
then http://127.0.0.1:4177 (stop with Ctrl+C). No preview process is left running
after checks; test servers own their temporary lifetime. Existing user data,
accounts, documents and records were not reset or used as fixtures.

## P08 handoff

Read PROGRESS, this report and P01 conventions/reference plan, inspect the
working-tree changes and rerun cheap offline P07 checks. Next increment is P08
Vimshottari Dasha: use the frozen 365.25-day year convention, birth Moon's
unrounded Nakshatra/balance and explicit period boundaries. Verify lord order,
balances, nested periods and timezone/epoch handling against independent
fixtures; do not fabricate a Dasha from unknown/unstable birth inputs or infer
traditional predictions from period arithmetic. Preserve current nominal/
birth-time distinctions and all earlier acceptance gates. No public birth form,
deployment, interpretation or Ritual Assist migration is part of P07.
