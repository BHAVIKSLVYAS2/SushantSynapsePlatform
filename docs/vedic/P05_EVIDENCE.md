# P05 Panchang evidence and handoff

Date: 2026-10-24 (Asia/Kolkata). PHASE COMPLETE within internal implementation
scope. Original PAC/IAE and public-production acceptance remain pending.

## Implemented

`packages/vedic/panchang.mjs` reuses P04 apparent Sun/Moon in the historical
IAU1976/1980 Lahiri profile. Tithi is normalized Moon-minus-Sun elongation in
30 half-open sectors, with Paksha/number within Paksha. Nakshatra/Pada use
sidereal Moon; Yoga uses the sum of sidereal Sun/Moon in 27 sectors. Karana
uses sixty half-tithi slots: Kimstughna, eight complete seven-name cycles,
then Shakuni/Chatushpada/Naga. Classification never uses rounded display angles.

`panchangSnapshot` accepts strict TT or UTC input and the required profile ID.
Each limb has its next crossing as lower/upper TT brackets at most 0.5s wide,
with the new-side endpoint and converted UTC. Hourly angular unwrapping has
checked positive rate <24 degrees/day, at most 72 hours of search, 20 bisections
per root and 256 cached evaluations per snapshot. Unsupported coverage or
nonconvergence is typed. These are domain/model checks and numerical convergence,
not independently certified physical accuracy or birth-time precision.

`panchangChangesBetween` enumerates each limb independently across up to three
days, capped at 16 knots per limb. Independent cursors prevent one limb's
approximate root from skipping a different limb in an overlapping bracket.
Intervals are end-exclusive. A root bracket intersecting the end is explicitly
`boundary-uncertain`; overlapping brackets do not establish physical order.

`panchang-observer.mjs` provides sunrise on a civil day, five-limb instant
Panchang with civil/sunrise Vara separately, and sunrise-day Panchang with both
defining sunrises, limbs at sunrise and intervening changes. Civil timezone is
explicit Asia/Kolkata, bounded 1950..2098. Requiring an unsupported adjacent day
withholds the complete result. Polar missing events return SUNRISE_UNAVAILABLE.
The reported millisecond UTC sunrise consistently defines the API's day switch.

`panchang-place.mjs` admits offline Indian GeoNames place IDs with approximate
settlement warnings; direct coordinate modules are low-level kernel primitives.
The place bridge rejects coordinate overrides and mutually supplied date/instant
fields. Declared elevation must be finite numeric -500..9000m; explicit null or
undefined is rejected. Missing height alone means sea level, with a warning.

No public route/UI/card, private cache, data persistence, schema change, new npm
dependency, Ritual Assist import change or deployment. Package version is 0.5.0
and workspace lock metadata matches. The normalized approximate/unknown birth
bridge remains withheld pending P14; an exploration instant is not a stable
birth-time result. No festival, regional observance or birthday rule is chosen.

## Sunrise and time conventions

The pinned MIT Astronomy Engine 2.1.19 SearchRiseSet uses topocentric upper
solar limb, its distance-dependent solar radius and 34-arcminute refraction
scaled by standard-atmosphere density at declared ground elevation. Observer
is at ground level (metersAboveGround=0), so horizon dip is zero; elevation is
not silently used as height above an unobstructed sea horizon. No terrain,
weather or elevated viewing-platform model. `sunriseModel` records these facts.
The native search is constrained to one model-converted civil day; pinned
upstream root iterations (20) and altitude subdivision depth (17) are bounded.

Engine Date/ut represents modelled UT1, not civil UTC. New `civilInstantFromTT`
inverts the same pinned leap/pre-1972 model used by resolveAstronomyTime, in
eight iterations with millisecond reporting. It never relabels AstroTime.date
as UTC. ISO cannot represent leap seconds; an unrepresentable inverse returns
TIME_DATA_UNAVAILABLE. Historical civil-as-UT1 and future expired-leap-table
warnings survive observer results and transition metadata. No observed EOP or
guaranteed future Earth rotation is claimed.

Primary explanatory sources: [USNO rise/set definitions](https://aa.usno.navy.mil/faq/RST_defs)
and the retained, versioned Astronomy Engine source inspected during P03/P05.
USNO explains why actual weather/terrain can materially change observed sunrise.

## Reference evidence, including failed gates

`tests/fixtures/vedic-panchang/published.json` preserves numerical facts manually
transcribed from publisher pages for Hyderabad on May 31, September 26 and
October 10, 2026, with exact dated URLs and retrieval date. These are small
publisher spot checks: their implementation independence, exact observer point
and Lahiri/sunrise convention are not established. Browser-readable numeric
extracts are retained; raw HTTP fetch failed, so no raw-page hash is invented.
The report records the fixture's own hash, not a publisher artifact hash.

All twelve limb identities and twelve next transitions agree with the tables;
maximum transition residual is **93.808 seconds**, within the proposed 180s
screen. The table itself prints simultaneous tithi/Karana ends one minute apart
on May 31 and two different Yoga change minutes on October 10; these issues are
retained. No month/adhika/observance expectations are imported from those pages.

**Publisher sunrise comparison does not pass the proposed 120s gate.** The
three residuals are -234.129, -201.479 and -177.184 seconds. Exact coordinates
and sunrise convention are undisclosed; the discrepancy remains unresolved.
Do not label this a matched-convention pass or widen the target to hide it.

Independent development-only screening implements NOAA's published low-order
[solar-position/sunrise equations](https://gml.noaa.gov/grad/solcalc/solareqns.PDF).
Twenty sea-level city/season cases differ by at most **59.754 seconds**, within
the proposed 120s screen. NOAA uses a constant 90.833-degree zenith; runtime
uses a variable solar radius. This approximate formula screen supports basic
horizon/time handling but cannot replace original PAC/location-matched goldens.
No external software code was copied; reference attribution is in THIRD_PARTY.md.

Direct fixed synthetic USNO and PAC downloads failed (ECONNRESET; browser PAC
timeout), including the system HTTP client check. The development capture
utility and failed request manifest retain URLs and failure status, not fake
expected values. Do not repeat failed network captures as ordinary verification.
Original PAC/IAE, matched-observer sunrise, independent review and accepted
production thresholds remain public-release gates.

Saved `P05_REFERENCE_RESULTS.json` additionally contains 149 annual June samples
from 1950..2098 and **596 internally verified crossing brackets**; maximum width
0.439466536s and maximum 80 snapshot evaluations. It also records 24 seasonal
sunrises across Delhi, Chennai, Kolkata, Ahmedabad, Leh (declared 3500m) and
Kanyakumari. Internal bracket and locality consistency are not independent
ephemeris goldens or full continuous-range accuracy certification.

## Verification

- Eleven focused Node tests pass: all 252 sector edges with adjacent doubles
  (756 boundary inputs), all sixty Karana slots, report reproduction, TT/civil
  inversion including leap-second rejection, sunrise millisecond Vara switches,
  instant/sunrise distinction, polar/bounds diagnostics, height/time warnings,
  place admission, safe invalid/accessor inputs and three-day new-moon changes.
  The new-moon interval traverses Shakuni, Chatushpada, Naga and Kimstughna;
  clipped end brackets retain uncertainty instead of dropping the event.
- Actual local workerd parity passes nine cases/663 numeric comparisons,
  including pre-1972/future dates, sunrise-day changes, pre-sunrise Vara and polar
  failure. Maximum numeric difference 5.69e-14, bundle excludes place data and
  retains NumFOCUS notice. Final bundle is 81,207 bytes; batch wall time 1,557ms;
  local wall time is not production CPU evidence or a certification.
- Full isolated repository suite: **428/428 pass**, zero failures, 189.813s,
  `.publish/vedic-p05-full-tests.log`. Final focused rerun after rejecting explicit
  null/undefined elevation: **12/12 pass**, 6.590s,
  `.publish/vedic-p05-focused.log`. The small final validation change was checked
  with focused tests; the full suite preceded that tightening.
- Offline P05 report, P04 coefficient/source hashes, P03 engine/leap source and
  whitespace checks pass. No production or user record was reset for tests.

Reproduction (offline):

```powershell
node infrastructure/verify-vedic-panchang.cjs --check
node infrastructure/prepare-vedic-sidereal.cjs --check
node infrastructure/prepare-vedic-astronomy.cjs --check
node --test tests/vedic-panchang.test.js tests/vedic-panchang-worker.test.js
```

## P06 handoff

Read PROGRESS.md, this report, P01 conventions/reference plan, P04 anchor
erratum and P03 time-model limitations. Inspect existing working-tree changes
and preserve earlier phases; these files are local, with no claimed commit/push.
Next requested phase is P06 Lagna, houses and D1. Use consistent sidereal frames
and explicit modelled Earth rotation; validate horizon/Lagna/house conventions
independently. Reject polar/unstable cases and avoid guessing a Lagna for
unknown/approximate birth time. Keep P05 source/sunrise acceptance gates visible.
No D9/chart UI, Dasha, birthday observance, Ritual Assist migration or public
deployment is part of this completed phase.
