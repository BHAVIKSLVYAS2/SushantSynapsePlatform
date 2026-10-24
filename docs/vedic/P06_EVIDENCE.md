# P06 Lagna, whole-sign houses and numeric D1

Date: 2026-10-24 (Asia/Kolkata). PHASE COMPLETE within internal implementation
scope. Full regression passes 440/440. No public activation.
Original PAC/IAE and independent full astronomical Lagna acceptance remain open.

## Implementation and conventions

`sidereal-time.mjs` implements IAU1982 Greenwich mean sidereal time from the
package's modelled UT1 and IAU1994 equation of equinoxes from TT, then adds
east-positive geographic longitude. The equation's TDB argument is explicitly
approximated by TT. It uses P04's IAU1980 nutation/obliquity, with the original
IAU1980 node argument in the equation of equinoxes (not P04's different IERS2003
mean-node polynomial). No UTC-as-UT1 assumption or modern-frame substitution.

Two additional licensed ERFA 2.0.1 sources (`gmst82.c`, `eqeq94.c`) are retained
with complete headers and SHA-256 manifest-p06.json. Original P04 manifest is
unchanged. The builder extracts three expected numerical values from the
already retained upstream test file without executing our implementation.
Legacy GST94's same-time-scale example is checked explicitly, while runtime
uses the physically distinct UT1/TT arguments. Copyright/licence attribution is
retained in source, package THIRD_PARTY.md and the existing ERFA LICENSE.

`lagna.mjs` computes the eastern intersection of the ecliptic with the local
geometric horizon using local apparent sidereal time and true obliquity. The
direction must have positive east projection and a near-zero horizon residual.
True tropical longitude minus true P04 Lahiri gives the sidereal ascendant;
nutation is neither omitted nor subtracted twice. It returns nominal Rashi,
Nakshatra/Pada, geometry/time/model provenance and boundary screening warnings.

Geodetic latitude defines the local tangent horizon. Refraction, terrain,
elevated viewing-platform dip and polar motion are not modelled. Elevation is
validated/recorded but has no effect on this mathematical horizon direction.
At/beyond the true-obliquity polar circle, or if the conservative geometry norm
or east projection is <=1e-6, return LAGNA_UNAVAILABLE. This is a deliberate
conservative supported-domain policy, not a claim all polar ascendants are
mathematically impossible; no 180-degree or alternate-house-system fallback.

`d1.mjs` composes nine P04 positions with the ascendant. Whole-sign house 1 is
the complete sign containing Lagna, beginning at that sign's zero degrees.
Exact Lagna longitude is a separate field. Twelve houses provide sign-start,
exclusive sign-end (including Pisces-to-zero wrap) and body IDs; each body row
has its house number. Mean Rahu/Ketu retain their mathematical-point labels and
have opposite houses. Other house systems are MODEL_UNAVAILABLE.

`birth-chart.mjs` is the separate P02 admission bridge. It revalidates offline
Indian place ID, civil timezone/time, future limits, language/purpose/height
metadata. Approximate and unknown times withhold D1 as UNSTABLE_BIRTH_TIME.
For exact HH:mm, the wrapper conservatively screens a minute of angular
movement using |d lambda/d theta| <= cos(phi)/cos(|phi|+eps), with eps<=26deg,
Earth rotation <=361deg/day and the proposed 61-arcsecond model guard. Planet
sign screening uses a conservative 24deg/day rate allowance plus the P04
61-arcsecond screen. Near sign boundaries are withheld. This is a screening
policy, not certified physical accuracy or P14 birth-time sensitivity; all
results retain birthTimeStability:not-evaluated and approximate-place warnings.

Direct instant/coordinate routines are low-level exploration kernels; they do
not bypass the birth/place wrapper's admission contract for future UI use.
All public functions reject unknown fields/accessors and use fixed safe errors.
Outputs are frozen. Package/lock version is 0.6.0, with new direct exports.

No new npm dependency, UI/graphic chart, D9, Dasha, interpretations, route/card,
private persistence, schema, account, Ritual Assist import or production change.
Numeric D1 belongs to P06; North/South graphics and D9 remain P07.

## Evidence and limits

Three ERFA expected-value comparisons pass: GMST82 error 2.22e-16 radians,
equation of equinoxes error 1.08e-18 radians, same-scale GST94 error 4.45e-16
radians. This checks the declared formulas, not observed historical/future EOP.

`infrastructure/vedic-horizon-reference.cjs` is an independent numerical method:
convert trial ecliptic longitudes to RA/Dec, evaluate the primary
[USNO altitude equation](https://aa.usno.navy.mil/faq/alt_az), scan in 5-degree
steps, bisect both horizon intersections and select the eastern root using hour
angle. It does not use our closed-form ascendant. Across 576 cases (eight
equatorial/northern/southern latitudes and 72 sidereal angles) max longitude
difference is 8.19e-9 arcseconds; maximum horizon residual 3.34e-16, minimum east
projection 0.606125. Supplied sidereal angle/obliquity are shared inputs, so this
is independent geometry evidence, not an external full astronomical golden.
Four analytic equatorial/cardinal goldens independently catch the 180-degree
east/west ambiguity; north/south antipodal geometry is also checked.

Saved P06_REFERENCE_RESULTS.json contains 894 annual D1 charts at six Indian
test locations over 1950..2098, with 8,046 body/house consistency checks and
zero true-Lahiri subtraction residual. Six full civil-day sweeps at five-minute
steps see all twelve rising signs. These are internal invariants and sampled
domain coverage, not independent accuracy measurements for every instant.

The proposed matched-observer 60-arcsecond Lagna gate remains unaccepted pending
original/source-matched full Lagna references and independent review. P03
modelled UT1/pre-1972/future-leap limitations, P04 original IAE gate and P05
unresolved publisher sunrise discrepancy remain visible. A minute-resolution
or approximate settlement point is not exact birth knowledge. No stability,
interpretation or production-readiness guarantee is inferred from numeric parity.

## Verification

Eleven focused Node tests pass: source/hash/reference extraction, cardinal east
goldens, report reproduction, mean/true frame consistency, explicit modelled
UT1/historical/future warnings, all 12 rising-sign whole-house mappings and
half-open cusp/wrap behaviour, nine-body occupancy and opposite mean nodes,
Lagna changes +/-5 and +/-10 minutes around a located crossing, minute-boundary
withholding, birth admission/unknown/approximate/future inputs, conservative
polar policy, fixed diagnostics, strict finite height and accessor rejection.

Actual isolated local workerd parity passes 167 cases/2,870 numeric values,
including ten charts, 12 whole-house sets, 144 house-boundary mappings and a
polar diagnostic. Maximum numeric difference 5.10e-11; compiled kernel 70,577
bytes excludes place data and retains the NumFOCUS notice. Local batch wall
time 552ms is not production CPU evidence or astronomical accuracy certification.

Full isolated repository regression passes **440/440**, zero failures, 186.589s.
Log: `.publish/vedic-p06-full-tests.log`; it includes all twelve new Node/Worker
checks and records the in-suite Worker batch wall time (1,280ms under full-suite
load). Offline P06 source/report, P05 report, P04 source/report, P03 engine/leap,
package/lock and whitespace checks pass. No commands remain running.

Reproduction, offline:

```powershell
node infrastructure/prepare-vedic-lagna.cjs --check
node infrastructure/verify-vedic-lagna.cjs --check
node --test tests/vedic-lagna.test.js tests/vedic-lagna-worker.test.js
```

The prepare utility's explicit --capture is for two pinned public source URLs,
never a runtime/test request. No private birth details were sent to a reference
service. Tests preserve user/production data and own isolated temporary fixtures.
No browser/e2e run is needed for a phase with no UI or public-route changes.

## P07 handoff

Inspect git status/diff and preserve earlier uncommitted phases. Read PROGRESS,
this evidence, P01 conventions/reference plan, P04 anchor erratum and P05 limits.
Next requested increment is P07 D9 plus North/South visual charts. D9 math stays
in the pure package; app presentation belongs under apps/rashifal-kundli per
architecture, with labelled houses/signs, mobile accessibility and a numeric
table fallback. Graphic positions must agree with numeric D1/D9 tables. Preserve
shared authentication/themes/app availability and do not publish a card/route
or claim birth-time stability prematurely. Unknown/approximate and divisional
boundary uncertainty must not become an invented precise D9.

No Dasha, birth-input public UI, interpretations, birthday selection, Ritual
Assist migration or production deployment is part of the P06 milestone.
