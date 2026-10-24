# P08 Vimshottari Dasha engine

Date: 2026-10-24 (Asia/Kolkata). PHASE COMPLETE within internal engine scope.
Full regression passes 459/459. No public activation.

## Implemented rule and contract

`packages/vedic/dasha.mjs` implements the frozen P01 Vimshottari order and
weights: Ketu 7, Venus 20, Sun 6, Moon 10, Mars 7, Rahu 18, Jupiter 16,
Saturn 19, Mercury 17 years, totalling 120. Unrounded birth Moon Nakshatra
and its elapsed fraction determine the first lord and remaining balance.
Classification reuses canonical half-open Nakshatra boundaries, without an
angular epsilon or rounded display coordinates.

Each full Mahadasha has nine Antardashas, starting with its own lord and
continuing in the canonical order. Child duration is major duration times
child lord weight / 120. The full major origin can precede birth: children
are calculated there, not restarted at birth. Query lookup selects [start,end)
membership. Simultaneous child/major transitions report the correct next major
and its first child, including cycle wrap.

The low-level API requires birthUtcInstant, already-computed nominal
moonSiderealLongitude, calculationProfileId, yearConventionId and timeZoneId.
Optional atUtcInstant defaults to birth, never a hidden host clock. Supported
birth instants match P02 India civil 1950..2098; query instants are restricted
to [birth,birth+240 arithmetic years). A single bounded calculation returns
the full nine-major/81-child cycle containing that query, cycleIndex 0/1/2,
original birth balance/Mahadasha, active row indices and upcoming boundaries.
Some full displayed periods can precede birth or exceed query coverage; the
query envelope is distinct from those mathematical periods.

One explicit convention is implemented: VIMSHOTTARI_365_25_DAY_V1, 365.25
uniform 86,400,000ms days = 31,557,600,000ms/year. Alternate year IDs are
MODEL_UNAVAILABLE, not silently substituted. This preserves the selected P01
baseline; no multi-convention UI is claimed. No Gregorian-year addition, DST
adjustment or implicit timezone is used.

P08 makes the calendar arithmetic axis explicit: uniform Unix/POSIX
milliseconds anchored at the supplied civil birth timestamp. UTC ISO labels
are projections of that arithmetic, not observed SI-duration measurements or
future leap-second predictions. This is separate from P04 TT/modelled-UT1
astronomy used to calculate the Moon. Arithmetic does not extend ephemeris
coverage or assert future Earth-rotation accuracy.

The birth-major origin is rounded once to integer milliseconds. For a positive
birth balance below one millisecond, one millisecond is retained so rounding
cannot assign the birth instant to the wrong unrounded Nakshatra lord; this
<=1ms adjustment is warned explicitly. Thereafter whole-major and child
durations are exact integers because yearMilliseconds/120 = 262,980,000.
Adjacent periods reuse the same boundary object/value; the last child ends
exactly at its parent. Numerical precision is not physical date precision.

Each boundary includes milliseconds, UTC projection and a pinned Asia/Kolkata
local projection with tzdb/rule provenance. Outside local 1950..2098 coverage,
the local field is status:unavailable with TIME_DATA_UNAVAILABLE. It never
extrapolates a local date/offset. Long arithmetic timelines are still available
with that typed limitation, including periods before birth/after coverage.

## Birth admission and uncertainty

`birth-dasha.mjs` repeats P02 normalization (offline Indian place ID, civil
timezone, exact/approximate/unknown state, future limit and metadata), then
calculates only the P04 Moon. Unknown and approximate inputs are withheld as
UNSTABLE_BIRTH_TIME. A conservative 121-arcsecond Nakshatra-edge screen adds
a minute's 24deg/day allowance to the proposed 61-arcsecond model target.
Near-edge exact-minute inputs are also withheld.

The bridge defaults its query to explicitly supplied context.now, or accepts
an explicit atUtcInstant option; its default year is the named frozen P01
convention. It preserves birth/Moon/time/source provenance and warnings.
Passing the starting-lord screen does not certify Dasha dates or active-period
stability: Moon/birth-time errors can materially move dates. Active periods
are labelled nominal, birthTimeStability remains not-evaluated and P14 remains
unimplemented. This phase adds period arithmetic, not interpretations.

## Reference evidence and gates

`infrastructure/prepare-vedic-dasha.cjs` creates independently computed BigInt/
rational synthetic expectations without importing/executing the runtime. Nine
Nakshatra midpoint cases cover every starting lord and all 81 first-major
children. All 180 boundary comparisons agree exactly (max residual 0ms),
within the proposed 1ms arithmetic target. The fixture is agent-authored design
data with a distinct integer/rational method, not independently reviewed
original astronomical goldens. Its hash and review status are in the report.

No matched external full-timeline golden was accepted. A browsed
[publisher timeline](https://jyotishpath.org/dasha/) declares 365.2425 days/year,
so its dates were excluded from the frozen 365.25-day numeric acceptance track.
A searched vendor PDF redirected to its home page rather than providing the
referenced artifact. No old snippet was treated as a captured PDF, no nonexistent
source hash or original-source acceptance is claimed, and tolerances were not
widened. No third-party Dasha software/code/dependency was copied.

Saved P08_REFERENCE_RESULTS.json additionally checks 81 synthetic timelines
across all 27 starting Nakshatras and 149 annual P04 birth-Moon samples over
1950..2098. These cover 2,070 majors/18,630 children, with zero cycle/child-sum
drift and all nine annual starting lords represented. 120 annual timelines
carry typed unavailable local projections; that is expected coverage evidence,
not a hidden failure or a claimed historical/future timezone extrapolation.
Sampled internal consistency is not independent astronomical certification.

Earlier PAC/IAE, full Lagna, sunrise discrepancy and birth-Moon/time accuracy
acceptance gates remain open. No empirical prediction or production-readiness
guarantee follows from correct traditional-period arithmetic.

## Verification

Eleven focused Node tests pass: independent rational fixtures; all 27 Nakshatra
edges and their adjacent doubles (81 balance inputs); submillisecond lord
preservation; exact 120-year/child sums/shared boundaries; pre-birth child origin;
all 81 child transitions at exact/just-before instants and cycle wrap; local
projection coverage; deterministic/immutable/bounded clock-free output; birth
admission and en/hi/gu numeric parity; minute-edge withholding; unsupported
conventions/malformed/private/accessor inputs; saved-report reproduction.

Actual isolated workerd parity passes 12 timelines/81 boundary balances and
7,404 numeric comparisons with zero numeric difference. The 8,202-byte
arithmetic-only bundle excludes astronomy and place data. This is runtime
parity, not a physical-accuracy or production CPU certification.

Full isolated repository regression passes **459/459**, zero failures, 194.366s,
including all twelve new Node/Worker tests. Log: .publish/vedic-p08-full-tests.log.
Offline P08 fixture/report, P07 report,
P06/P05 reports, public-allowlist absence, package/lock and whitespace checks pass.
No browser/e2e run is required: this phase changes no UI or public route.
No commands or preview servers remain running.

Reproduction, offline:

```powershell
node infrastructure/prepare-vedic-dasha.cjs --check
node infrastructure/verify-vedic-dasha.cjs --check
node --test tests/vedic-dasha.test.js tests/vedic-dasha-worker.test.js
```

Package/lock version is 0.8.0. No new npm dependency, public route/card, timeline
UI, persistence, account/schema change, Ritual Assist import or production
deployment. Tests own isolated temporary fixtures and do not reset user records,
accounts, documents or data/records.json. No commit/push is claimed.

## P09 handoff

Inspect existing working-tree changes and preserve all uncommitted phases.
Read PROGRESS, this evidence, P01 privacy/locale/time conventions and P07 chart
component instructions. Next requested increment is P09 birth-details and
Kundli UI: compose P02 place/time admission, per-feature D1/D9/Dasha availability,
the P07 accessible chart component and P08 period data/current/next states.
Expose the selected year/time basis, local projection diagnostics and nominal
date precision. Do not restart Antardashas at birth or infer stable dates from
the starting-lord screen. Keep D1 usable when a stricter D9/Dasha result is
withheld. Unknown time must not invent noon, Lagna, D9 or Dasha.

Reuse platform theme/auth/access conventions and memory-only guest birth input.
No private birth persistence, ads/tracking, public share/export or automatic
production activation. A public app/card/route remains subject to the existing
release gates; local UI composition is distinct from live availability. Do not
re-download source captures or describe pending numerical acceptance as passed.
