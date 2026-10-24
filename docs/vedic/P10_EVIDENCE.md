# P10 privacy-safe Kundli export

Implemented 2026-10-24 in the internal local preview. No public release,
production deployment or numerical acceptance is implied.

## Implementation and privacy

`apps/rashifal-kundli/frontend/export-report.mjs` owns a versioned, explicit
export projection (`vedic-export-1`), printable report markup, standalone HTML
download and report controls. It does not serialize the source report, observer,
Julian days, aliases or hidden instant-bearing model objects. Pure math remains
unchanged in packages/vedic 0.8.0. No dependency added.

Default export removes name, full DOB, birth time, place identity/coordinates
and resolved birth UTC/interval. A labelled checkbox explicitly includes those
fields. Every result rebuild, edit, recalculation and language switch resets the
choice to redacted. Export labels warn that chart values and Dasha boundaries
may reveal birth information: redaction is not anonymization.

The report contains available sidereal positions, D1/D9 South Indian fixed-sign
diagrams with ascendant, all twelve houses and numeric planet fallback tables.
D9 identifies source longitude and divisional meaning. Dasha includes current/
next state, birth balance, pre-birth origin explanation, all nine majors and 81
minor periods. UTC/local projections and unavailable local dates are retained.
Unknown/approximate/unstable features remain explicitly withheld; no noon or
fabricated charts. Display rounds degrees to four decimals without changing
stored numeric values. Named 365.25 uniform-day year and nominal precision remain.

Provenance includes profile/conventions, engine version/hash, ephemeris/coverage,
ayanamsha/node/house/Lagna models, time conversion/UT1/leap source identities,
tzdb and place source hashes, coordinate/elevation basis, input precision,
calculation timestamp, export version and deduplicated warning codes. Configured
model identities are distinguished from features not calculated. GeoNames and
Astronomy Engine attribution is retained. Source/technical labels retain their
original names with disclosure; independent translation review is pending.

English/Hindi/Gujarati controls and report labels preserve numeric data. Print
uses the same reviewed projection and hides the birth form, original results,
review and controls, including native browser printing. beforeprint/afterprint
preserve preview state and tolerate repeated events. A4 styles repeat table
headers and avoid splitting rows/diagrams. PDF is generated through the browser's
Print / Save as PDF dialog, not a separate PDF service/library. Users are told
to disable browser headers/footers. HTML filename/title contain no identity.

HTML is an offline self-contained download with escaped text, inline CSS and a
restrictive CSP; no scripts, remote assets, URLs containing birth data, analytics
or server requests. Object URLs are short-lived and revoked on reset/destroy.
Clear/navigation removes preview and listeners. Explicit downloaded/printed
files remain under user control; clearing the form cannot delete those files.
The dev harness serves report CSS from its fixed loopback-only allowlist. Public
static mappings, registry/auth, SQLite/data and Ritual Assist are unchanged.

## Verification

Five export Node tests pass; combined with P09 composition, ten focused Node
tests pass. They check direct-field omission, safe explicit identity/escaping,
unchanged numerical values and all 81 child boundaries, partial/unknown states,
and complete en/hi/gu labels.

- Full isolated repository run: 469 tests, 453 passed and 16 failed in 298.832s
  (`.publish/vedic-p10-full-tests.log`). Fifteen failed in a shared Cloudflare
  build hook because the sandbox denied generated-page writes (EPERM); one
  existing timetable solver reached its 12-second search limit under load.
- Permitted sequential rerun of `tests/cloudflare.test.js` and
  `tests/timetable.test.js`: 21/21 passed, 50.527s, including all sixteen failed
  checks (`.publish/vedic-p10-regression-rerun.log`). Thus all 469 repository
  checks passed across runs, not in one uninterrupted full run.
- Focused Chrome suite: 10/10 passed (three P07, five P09 and two P10),
  `.publish/vedic-p10-browser-final.log`. Repeated print events initially exposed
  preview-state restoration; the idempotent handler fix is covered by this run.
- After the final mobile table/font improvement: five export Node tests passed
  again (`.publish/vedic-p10-export-node.log`) and both P10 browser tests passed
  again in 28.1s (`.publish/vedic-p10-export-final.log`). Full repository run
  preceded these final presentation changes; no kernel changes were made.
- Browser checks download and inspect HTML for omitted direct fields, generic
  filename, absence of scripts, offline rendering/no requests, both charts,
  complete numeric/Dasha tables, actual Chromium PDF generation, identity opt-in,
  default reset after recalculation, partial D9, clear, native print isolation,
  preview restoration, en/hi/gu and 320/390px overflow containment.
- Final chart and Gujarati mobile screenshots visually inspected. Tables use
  focusable horizontal scroll regions on narrow screens and expand for print.
  Evidence: `.publish/vedic-p10-{chart-390,gujarati-320,report-390}.png` and
  `{redacted,app-print}.pdf`. Generated PDFs are synthetic fixtures only.
- Whitespace/public-allowlist checks passed. No commands/preview servers remain
  running; changes remain local/uncommitted. Human translation, independent
  astronomical references and P14 stability gates remain open.

## Next phase: P11

Read the master P11/VC/BN requirements, P05 Panchang evidence and P01 conventions.
Implement birth Tithi separately from yearly location/observance rules and baby
name suggestions. Define and source regional observance variants before returning
yearly dates; keep missing/repeated Tithi cases and unresolved sunrise acceptance
visible. Do not infer an exact birth Panchang from unknown time. Preserve local
privacy, pure-kernel ownership and all outstanding independent acceptance gates.
