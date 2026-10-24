# P03 astronomy adapter and reference evidence

Date: 2026-10-24 (Asia/Kolkata). PHASE COMPLETE: internal astronomy adapter and
reference measurements. Internal candidate only; no public
calculation route, Kundli release, P04 logic or Ritual Assist refactor.

## Delivered

- `packages/vedic/astronomy.mjs`: bounded raw geocentric snapshots for Sun, Moon,
  Mercury, Venus, Mars, Jupiter and Saturn, explicit geometric/apparent tracks,
  tropical true-of-date angles, raw AU vectors and model/source provenance.
- `astronomy-time.mjs`: explicit TT inputs, UTC-to-TT with a pinned leap-second
  table, labelled modelled UT1 and unsupported TDB, guarded TT coverage and a
  bounded eight-iteration inverse Delta-T calculation.
- Byte-identical MIT Astronomy Engine 2.1.19 copy under package-owned `vendor/`;
  original Ritual Assist file/imports/data/behaviour unchanged. No npm dependency.
- 28 retained JPL responses, 25,116 synthetic TT vector rows, source/parameter
  manifest and hashes; separate geometric and light-time/aberration tracks.
- Reproducible comparison report `P03_REFERENCE_RESULTS.json`, focused tests,
  actual local workerd parity test, pinned source/attribution and resume notes.

P03 selects the existing analytic model as an **internal candidate** after
measurement. It is not described as a downloaded DE441 kernel or certified
Panchang. Runtime data are bundled VSOP87/lunar-series coefficients; downloaded
JPL data are independent offline reference fixtures, never runtime lookups.
Any requirement for direct JPL-kernel interpolation remains unsatisfied by this
analytic candidate and must be resolved explicitly before public activation.
No silent fallback or claim of production convention approval is made.

## Reference acquisition and comparison

Official Horizons was queried sequentially for physical body centres 10, 301,
199, 299, 499, 599 and 699, Earth geocenter 399, TT epochs, ICRF equatorial
coordinates and AU units. The monthly grid is January 1950–December 2098;
six extra anchors include J2000, 2026-10-24, final-year and coverage margins.
Some anchor/monthly epochs overlap; 25,116 is row count, not unique-epoch count.
All inputs are synthetic and fixed by the capture tool, not user birth data.

Raw response size totals 3,301,598 bytes. `tests/fixtures/vedic-jpl/manifest.json`
retains full query parameters, response hashes, actual target/centre models,
API signatures and EOP identifiers. Returned models: DE441 for Earth/Sun/Moon/
Mercury/Venus, mar099 for Mars, jup365_merged for Jupiter, sat441l for Saturn.
These identify the reference sources, not the runtime analytic model.

Before comparison, apply published IAU 2000 frame bias (ERFA 2.0.1 reference
matrix) from ICRF-aligned axes to mean J2000 equator/equinox. Compare vector
direction using normalized-vector chord angle. Do not equate ICRF and EQJ axes.
Geometric and LT+S tracks remain separate; no atmospheric/gravitational-deflection
correction is mixed into either vector track.

Longitude/latitude residual diagnostics rotate both vectors with the same pinned
engine's true-ecliptic-of-date transform. They test positional residuals in that
frame, **not independent accuracy of the rotation itself**. A later independent
coordinate-transformation/IMD comparison remains required. JPL observer quantity
31 is not silently treated as interchangeable with these true-of-date angles.

Maximum apparent direction differences after frame bias, in arcseconds:

| Body | Maximum | RMS | 95th percentile |
|---|---:|---:|---:|
| Sun | 2.781 | 0.867 | 1.464 |
| Moon | 3.444 | 1.128 | 2.055 |
| Mercury | 11.431 | 3.004 | 5.464 |
| Venus | 20.629 | 3.351 | 7.495 |
| Mars | 16.878 | 3.038 | 6.552 |
| Jupiter | 14.081 | 5.130 | 8.892 |
| Saturn | 22.467 | 11.402 | 19.168 |

Both tracks pass the proposed sampled 60-arcsecond engineering gate, including
longitude/latitude residual checks. The report retains all fourteen body/track
groups, per-metric max/RMS/p95 and worst source/epoch. This is not a mathematical
error bound between samples or independent human acceptance. Distances, motion
derivatives and sector classifications are not certified by this angular test.

## Time scales and computational boundaries

TT evaluation is accepted from JD 2433280.5 (1949-12-30 00:00 TT) through
2487706.5 (2099-01-03 00:00 TT), inclusive. These declared analytic evaluation
margins cover P02 India dates plus limited boundary work, not arbitrary event
search outside the range. Every public-facing future consumer must still
intersect its own civil/place/event coverage and uncertainty policy.

The first downloaded IANA 2025b leap table was expired; it is retained only as
acquisition history. Runtime uses the separately pinned current IANA snapshot
retrieved 2026-10-24, expiring 2027-06-28. SHA-256:
`db5a895f16853b03bfc865e8d68f9fc8710ef1740e3400c701cd46a5bbbc3433`.
For supported post-1972 civil instants, TT = UTC + table TAI-UTC + 32.184 seconds.
After the table's expiry, results explicitly say the last offset is unconfirmed;
they do not assume future leap seconds are known. The USNO/IERS direct download
attempts failed; no claim of a retrieved current USNO/IERS file is made.

For pre-1972 input, civil time is explicitly approximated as UT1 using the
vendored Espenak–Meeus Delta-T model, with warning. Historical fractional UTC
drift is not implemented. UT1 is always model-derived, not observed EOP. TDB is
null with warning rather than relabelled TT. These time-scale approximations
have not been independently measured as civil-to-UT1 historical/future accuracy.
The TT reference comparisons deliberately isolate position-model accuracy from
that additional uncertainty. Horizon/Lagna features cannot yet claim precise
Earth-rotation results.

The upstream apparent solver uses a first-order heliocentric aberration method
and at most ten light-travel iterations. For Moon, call BackdatePosition too:
upstream GeoVector special-cases Moon and otherwise omits this correction. Reset
the returned vector timestamp to the observation epoch before angle conversion.
All such choices are explicit in the adapter model ID; no upstream code changed.

## Verification and operational limits

P02 startup: 14/14 normalization tests and offline source reproduction pass.
Focused astronomy + normalization: 23/23 pass (3.83 seconds). Actual local
workerd test: 1/1 pass (3.50 seconds including setup), 41 synthetic snapshots /
287 vectors. Max Node/workerd angle difference 5.684341886080802e-14 degrees,
vector difference 8.881784197001252e-16 AU, matching warnings/time provenance.
The minified astronomy-only bundle is 55,775 bytes and excludes the place data.
Local workerd batch wall time was 156 ms; not production CPU or quota evidence.
There are no database/storage bindings and outbound service is blocked in this
fixture. This is an actual local workerd run, not a real Cloudflare deployment.

Logs: `.publish/vedic-p03-baseline.log`, `vedic-p03-focused.log`,
`vedic-p03-worker.log`, `vedic-p03-jpl-capture.log`. Full `npm.cmd test` passes
405/405 with zero failures in 177.69 seconds, using the suite's isolated fixtures
and the workspace write permission required by its existing build hooks.
Log: `.publish/vedic-p03-full-tests.log`. Source/leap-table byte checks, 28-response
manifest verification, exact saved report reproduction and `git diff --check`
also pass. No UI change, browser workflow or production deployment is claimed.

## Review gates and next action

No sidereal conversion, Lahiri/node model, Rashi/Nakshatra, birth-time stability,
Panchang, Lagna/houses or interpretation is implemented by P03. No public route,
app card, persistence, account/business-data write, migration or production
deployment occurred. Internal status remains explicit on every snapshot.

P04 next: independently implement/validate the frozen revised Lahiri and mean
node model, source-backed ayanamsha/coordinate references, sidereal sectors and
boundary tests. Do not use old Spica classification as Lahiri. Resolve model/
frame/source uncertainty and retain unapproved numerical gates until actual
acceptance; do not infer that passing a tropical-vector test validates a Kundli.
