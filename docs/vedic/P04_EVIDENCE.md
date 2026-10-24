# P04 sidereal positions, Rashi and Nakshatra

Date: 2026-10-24 (Asia/Kolkata). PHASE COMPLETE: internal sidereal implementation.
Internal candidate only, with source/production acceptance gates intact.

## Implemented scope

- `angles.mjs`: bounded angle normalization and half-open nominal Rashi,
  Nakshatra/Pada classification from unrounded angles, plus boundary distances.
- `iau1976.mjs` and source-derived 106-term nutation data: IAU1976 precession,
  IAU1980 obliquity/nutation and IERS2003 mean lunar-node longitude, with retained
  ERFA attribution/licence and original versioned source/reference files.
- `ayanamsha.mjs`: revised post-1985 Lahiri anchor, full precession transport,
  mean/true ayanamsha and explicit model/version provenance. No Spica substitute
  or constant annual-drift approximation.
- `sidereal.mjs`: seven apparent physical-body longitudes plus mean Rahu/Ketu,
  Rashi/Nakshatra/Pada and screening warnings. No houses, Lagna, D9, Panchang,
  Dasha, interpretations or public route.
- `birth-positions.mjs`: separate P02 bridge for exact-time inputs; approximate
  and unknown times return UNSTABLE_BIRTH_TIME rather than a nominal noon result.
  This keeps place data out of astronomy-only/sidereal-only bundles.

No new npm dependency, service, private storage, account/schema changes, Ritual
Assist import/refactor, public app or production deployment.

## P01 correction and frame decisions

Source review of Astrodienst's ayanamsha discussion/Appendix E identified a
P01 wording error: 23 degrees 15 minutes 00.658 seconds at 1956-03-21 00:00 TT
is the **true** revised Lahiri anchor. It is not the mean anchor. P01 now records
the erratum as `vedic-conventions-1-anchor-erratum-20261024`. No deployed chart
or stored calculation was affected; this was a pre-release design correction.

Subtract IAU1980 longitude nutation at the anchor to obtain its mean value:
23.245524742543473 degrees. Transport the date's mean equinox through inverse
IAU1976 precession to J2000, then into the anchor's mean ecliptic. Subtract its
signed displacement from the mean anchor. Add date longitude nutation once for
true ayanamsha. This matches the selected revised Lahiri convention within the
published references; no Swiss Ephemeris code/library is installed or executed.

Physical positions start with P03 apparent **EQJ vectors**, not its precomputed
modern-model tropical angles. Transform those vectors with the selected IAU1976
precession and IAU1980 obliquity, then apply IAU1980 longitude nutation to obtain
the profile's true tropical longitude. Sidereal longitude uses mean tropical
minus mean ayanamsha, algebraically equivalent to true minus true without
double-counting nutation. This avoids mixing the native P03 angle frame with
the chosen historical Lahiri frame.

Mean Rahu uses the IERS2003/Simon1994 ascending-node polynomial from the retained
ERFA faom03 source. Its nominal TDB century argument uses TT as expressly allowed
by that reference; this approximation is named in the model. Ketu is the opposite
node. Mean-node longitudes receive the same mean/true frame treatment. Nodes
have no fabricated physical vector, distance or latitude; their latitude is null.
This is not a true/osculating-node model or a physical-body ephemeris validation.

## Independent evidence and precision

Versioned ERFA 2.0.1 sources and original numerical expected values are retained
under `packages/vedic/data/sources/erfa-2.0.1`. A deterministic builder extracts
the full 106-term table and published precession-matrix, obliquity, nutation and
node expected values. Tests do not derive those expected values from the JS
implementation. Matrix/obliquity residual targets are 1e-14 radians/components,
nutation 1e-13 radians, node angular residual 1e-7 arcsecond at the reference epoch;
these are implementation checks against the chosen formulas, not new physical
accuracy claims.

Fourteen published Lahiri checks comprise three mean values reproduced from
IAE1989/2019 and eleven January 2019 true values published in Astrodienst's
reproduction discussion. Max measured residual: **0.03957508706662338 arcsecond**,
below the proposed 1-arcsecond ayanamsha target. The 1956 anchor is a separate
definition check, not counted as independent accuracy evidence.

The reference fixture explicitly states that access to IAE figures is secondary.
Original IMD/IAE publication fetches failed again (502/timeout); there is no claim
of original-page verification or independent human review. The published true
series uses UT0; nominal UTC midnight is converted using P03's leap table. UT1/
UTC distinctions prevent a sub-milliarcsecond accuracy claim. Inconsistent printed
mean rows were excluded rather than silently repaired. HTML capture hash and
source URLs/precision/context are retained; no AGPL software or data tables from
its source code were copied into the runtime.

`P04_REFERENCE_RESULTS.json` records all fourteen measured residuals. A separate
1,788-month invariant grid covers 1950–2098 with 16,092 nominal graha positions.
Max mean/true cancellation residual is 0 arcseconds in this run; max Rahu/Ketu
opposition residual is 4.092726157978177e-10 arcsecond. Those are consistency
checks, not 16,092 independent astronomical reference comparisons.

## Boundaries and uncertainty

Half-open sign/quarter boundaries use canonical doubles `i*360/count` and a
binary search. No arbitrary epsilon shifts classifications. Positive near-360
values are not destroyed by a double-modulo normalization. Negative sub-ULP
angles whose addition to 360 rounds out of range use the largest representable
double below 360, maintaining the half-open domain.

Tests cover immediately below/exactly/above every 108 Pada and 12 sign boundary,
wrap at 0/360, 27 Nakshatra boundaries through the shared four-Pada structure,
and 2,000 deterministic periodicity/range cases. Nominal classification is not
birth-time stability. Every snapshot declares that stability is unevaluated.
A 61-arcsecond screening guard (proposed physical 60 plus ayanamsha 1) flags near
sign/Nakshatra/Pada boundaries without changing indices. It is not a certified
error bound; 148 nominal positions were flagged in the consistency grid.
Approximate/unknown birth input remains withheld until continuous interval
stability analysis is implemented; no endpoint-only stability shortcut exists.

## Verification and operational limits

P03 startup source/report checks and 23 existing focused tests pass. P04 focused
suite: 10/10 pass, 7.28 seconds under concurrent full regression load. Actual
local workerd: 1/1 pass, 19 snapshots / 171 positions plus 324 boundary angles.
Max Node/workerd angular difference: 5.684341886080802e-14 degrees; all nominal
sector indices match. Sidereal-only minified bundle: 64,546 bytes, excluding
the place directory and retaining the NumFOCUS derivative notice. Local batch
wall time 825 ms, not production CPU/quota evidence. No storage bindings and
external runtime requests blocked in the test fixture.

Logs: `.publish/vedic-p04-baseline.log`, `vedic-p04-focused.log`,
`vedic-p04-focused-final.log`, `vedic-p04-worker.log`. Full `npm.cmd test` passes
416/416, zero failures, 164.84 seconds, using isolated fixtures and the existing
build hooks' required workspace write access. Log:
`.publish/vedic-p04-full-tests.log`. Pinned source/table/reference extraction,
saved report reproduction and `git diff --check` also pass. No browser UI change
or production deployment was performed.

## P05 handoff

Next is Panchang only: tithi, Yoga, Karana, Vara and location-aware sunrise,
using the same profile/frame/time conventions. Define boundary/observance rules
and independent source fixtures before computing transitions. Preserve raw
model/time/source provenance and existing Ritual Assist behaviour; no shared
import switch yet. Do not treat modelled UT1 as observed Earth rotation or the
guard as a physical error guarantee. Birthday observance, Lagna/charts and
uncertain-time continuous stability remain their separate phases.
