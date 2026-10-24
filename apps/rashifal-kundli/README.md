# Rashifal and Kundli: internal birth, export and P11 traditions UI

Production verification preview authorised on 2026-10-25: the platform card opens
/rashifal-kundli with Kundli, Rashifal, Time Machine and Matching navigation.
Browser-only bundles and private-input page headers expose testing without a
birth API/database. Independent source/editorial/traditional gates remain open;
this is not a validated general release. See docs/vedic/PRODUCTION_PREVIEW.md and
PROGRESS.md for deployment/verification status. Earlier local-only entries below
describe previous checkpoints.

P17 adds a fixed no-referrer Ritual preparation-guide link, private-preview
security headers and read-only release-readiness policy. No birth information
or candidate dates transfer to Ritual. Both apps share the identical pinned
engine implementation while retaining distinct calculation/calendar profiles.
All Vedic public release plans remain blocked by documented gates; no app route,
card, birth API or deployment is enabled. Evidence: docs/vedic/P17_EVIDENCE.md.

P16 adds an explicit advanced preview below birth results (loopback 4178):
D7/D10/D12 with reused North/South graphics/tables, raw D1 BAV/SAV counts and
Uccha Bala only. Complete Shadbala stays unavailable; all methods remain
candidates awaiting individual/source acceptance. Each division can withhold
independently. No persistence/public route; panel is excluded from P10 export
and print. en/hi/gu controls disclose method/source diagnostic fallback.
See docs/vedic/P16_EVIDENCE.md and P16_REFERENCE_RESULTS.json.

P15 matching preview: `node infrastructure/preview-vedic-matching.cjs`, port
4181. Both blank birth cards stay disabled until explicit permission. Review
both local/UTC records, then calculate eight raw components under the stated
composite draft convention. Swap axes requires new review. Clear/revoke/navigation
remove both records. No storage, network birth requests or marriage verdict.
Birth preview also offers geometric Yoga/Mangal bases with final assessments
withheld pending independent review. en/hi/gu controls disclose English rule-text
fallback. Source/table disagreements and evidence: docs/vedic/P15_EVIDENCE.md.

P13 adds Astro Time Machine and Gochar foundations:

```powershell
node infrastructure/preview-vedic-time-machine.cjs
```

Open http://127.0.0.1:4180. Enter an explicit date/time/Indian city, review the
local/UTC instant, then calculate nominal positions and Panchang. Future
exploration is allowed within coverage. Optional manual Moon/Lagna references
show whole-sign counts; after creating a P09 birth report, its embedded Time
Machine can explicitly compare with that birth input. Birth future/uncertainty
rules remain enforced. No reference is selected by default. Near-boundary counts
and unsupported observer results remain unavailable independently.

Endpoint differences are shortest signed angles, not travelled distance, motion
or retrograde. No aspects, Sade Sati or continuous timeline is inferred. Clear/
edits/navigation remove exploration; nothing enters storage, URLs or network.
P10 print/export excludes this new private panel. See docs/vedic/P13_EVIDENCE.md
and PROGRESS.md. Next P14 birth-time sensitivity; public source gates remain open.

P12 adds a separate Rashifal editorial preview:

```powershell
node infrastructure/preview-vedic-rashifal.cjs
```

Open http://127.0.0.1:4179. Manually choose a known Chandra Rashi without birth
details; Today/Tomorrow use IST editorial days, weekly uses Monday–Sunday noon
Moon samples. Five sections use 20 original versioned reflection prompts, with
source factors/group counts and draft publication status. These are traditional
interpretive reflections, not scientific predictions or medical/investment advice.
Hindi/Gujarati controls and 40 authored draft reading translations are present;
reading text explicitly falls back to English until independent translation
review. Opt-in remembers only Rashi, with clear/reset. No network/analytics or
public release. See docs/vedic/P12_EVIDENCE.md; next P13 Time Machine/Gochar.

P11 adds birth-instant Panchang (civil/sunrise weekdays kept separate), Amanta
month/Adhika, explicit yearly first-sunrise Tithi candidates, and private all-day
ICS download. Choose the rule before calculating; missing/repeated or uncertain
sunrise cases remain visible. Purnimanta/other family rules and Kshaya month
naming are unavailable. Month queries have narrower search coverage; yearly
queries cover 1951..2097. The sunrise discrepancy remains unresolved: these are
exploration candidates, not certified ritual dates.

Name guidance uses a versioned regional 108-sound table and a small two-name
catalogue (Ravi/Tara) with sourced meanings. Search/filter/copy works without
copying birth details. Empty sound matches are intentional; no generated meanings.
Unknown time withholds guidance/calendar but permits catalogue browsing. Content
corrections live in frontend/naming-data.mjs, outside the numerical kernel.
See docs/vedic/P11_EVIDENCE.md and PROGRESS.md. Next P12 Rashifal content.

No public route, catalogue entry, account/persistence integration or production
deployment is implemented. This folder owns the birth/review/results UI and
chart presentation; astronomy/D9/Dasha remain in `packages/vedic`.

P09 local birth preview (blank input; memory only):

```powershell
node infrastructure/preview-vedic-birth.cjs
```

Open http://127.0.0.1:4178. Review local/UTC or interval details before
calculation. Results independently show available positions, D1, D9 and Dasha;
unknown/approximate times do not fabricate precise charts. English/Hindi/Gujarati,
North/South views, mobile themes, keyboard controls, birth balance and selected
major/minor periods are supported. The calendar convention and nominal precision
are explicit. Source labels/diagnostics retain original names; independent
translation review and earlier astronomical acceptance remain pending.

Birth details never enter storage, URLs or network calls. Clear/reload/history
remove them; shared theme preferences alone may persist. The preview clock is
local; a future API must provide authoritative current time. No print/export
feature was included in P09. P10 now adds a redaction-first report preview,
standalone offline HTML download and Print / Save as PDF. Identity requires
explicit opt-in and resets with rebuilt results. Chart values/Dasha dates can
still reveal birth information. Browser print headers/footers should be disabled.
See `docs/vedic/P10_EVIDENCE.md` for provenance, privacy and verification limits.

```powershell
node --test tests/vedic-birth-ui.test.js
npx.cmd playwright test apps/rashifal-kundli/tests
```

The reusable chart API below also accepts `d9:null` with D9 disabled, and an
optional `language` (`en`, `hi`, `gu`).

`frontend/chart-view.mjs` exports `mountCharts(element,{d1,d9},options)`.
Both charts must come from the numeric kernels (or explicit synthetic tests).
Options: initialChart D1/D9, initialStyle north/south. It returns a destroy
function in an object. Mounting replaces only the supplied element's contents;
destroy removes its owned root. No fetch, input persistence or analytics.

`chart-model.mjs` validates sign/house/body occupancy before drawing. North
Indian houses are fixed counterclockwise from the top diamond; South Indian
signs are fixed clockwise from Aries in the second top cell. The same checked
model supplies both graphics, their accessible labels, selected-house details
and the visible numeric table. Crowded cells show three codes plus a count;
full names/occupancy remain in accessible labels and the table. Keyboard users
can focus each house and use Enter/Space. Toggles expose aria-pressed states.
D9 labels/longitudes identify divisional signs and their source D1 longitude.

Load `frontend/chart-view.css` with shared theme tokens from packages/ui;
component colours use existing --ui-* tokens. Shared theme.js remains the owner
of light/dark/system preferences. Future public UI must preserve platform
authentication, availability and privacy; do not export the dev harness.

Local synthetic preview:

```powershell
node infrastructure/preview-vedic-charts.cjs
```

Open http://127.0.0.1:4177. Optional numeric argument selects the port. The
server binds only loopback, serves a fixed asset allowlist, bundles in memory,
denies runtime connections through CSP and never reads/writes birth data. The
fixture is 2000-01-01 12:00 IST at a synthetic Delhi coordinate. Its nominal D9
is exploration output, deliberately not a certified birth chart (the strict
birth bridge withholds this minute's D9). Theme preferences alone may persist.

```powershell
npx.cmd playwright test apps/rashifal-kundli/tests/browser.spec.js
```

Browser checks use fresh isolated contexts, fixed synthetic data and a temporary
loopback server. Screenshot/log evidence is ignored under .publish. See
`docs/vedic/P07_EVIDENCE.md` and `docs/vedic/PROGRESS.md` for acceptance limits
and next-phase handoff. Do not treat nominal charts as P14 birth-time stability.

P08 adds the separate packages/vedic Dasha engine and birth-Moon bridge, without
changing this chart-only development preview. Its active indices, date labels,
selected-cycle rows and next transitions are ready for P09 composition. A
future UI must show the named 365.25-day convention and nominal date precision,
preserve typed unavailable local projections and avoid presenting a Dasha for
unknown/unstable birth input. No interactive timeline or public integration is
claimed by the P08 engine phase.
# P14 local birth sensitivity

The birth preview now offers explicit interval analysis in a cancellable browser
Worker. Exact-minute, approximate and unknown-day results remain conditional on
declared candidate bounds. No precise unknown-time chart/Dasha is fabricated.
The panel uses shared themes and en/hi/gu controls, clears with birth edits and is
excluded from P10 print/export. No persistence or public route is added.
See docs/vedic/P14_EVIDENCE.md. Next requested phase: P15 rulebooks.
