# P01 reference and acceptance plan

Version `vedic-reference-plan-1`; frozen 2026-10-24. Status: plan only.
No astronomical expected positions or golden fixture pass is asserted.

## Fixture provenance contract

Every future reference fixture must have: stable ID, quantity, synthetic/non-user
input, profile version, source URL/publication/page or section, retrieval time,
raw-artifact relative path and SHA-256, source model/version, input/output time
scales, observer and coordinates, frame/equinox/epoch, corrections, units,
rounding/resolution, expected values, tolerance ID, capture method and independent
review status. Keep separate author/reviewer identities; agent-authored plans
must not masquerade as independent numerical review.

States: planned -> captured -> normalized -> reviewed -> accepted. `expected`
must remain null for planned/capture-failed records. A capture requires preserved
raw evidence; an acceptance requires measured residuals against the implemented
adapter and an explicit reviewer decision. Do not regenerate expected outputs
from the implementation under test or mark source snippets as full fixtures.
Raw book pages/code may only be redistributed when terms permit; otherwise
retain citation and permitted numeric extracts, with retrieval/review evidence.

Fixture capture is an offline development task using synthetic epochs. Runtime
users never send birth details to Horizons, GeoNames or a Panchang provider.

## Independent comparison tracks

1. **JPL geometry**: Sun 10, Moon 301, Mercury 199, Venus 299, Mars 499,
   Jupiter 599 and Saturn 699; Earth geocenter `500@399`. Capture vector tables
   with ICRF equatorial frame (`REF_PLANE=FRAME`), AU/day, Gregorian, explicit
   TT epoch, `VEC_CORR=NONE`, and full headers/model identity. Compare geometric
   vectors before light-time/aberration. If a model supplies barycentres rather
   than target centres, record and resolve this difference; do not relabel it.
2. **JPL apparent**: separately capture matched light-time/aberration vectors
   and observer output. Horizons quantity 31 has its own ecliptic/correction
   convention; do not directly compare it to Astronomy Engine Ecliptic output
   without a documented common-frame/correction transformation. Frame/model
   residuals are discrepancies to investigate, not a reason to silently widen
   tolerances. Keep gravitational deflection excluded in both sides of a matched
   comparison or quantify the remaining mismatch separately.
3. **IMD**: obtain stable Rashtriya Panchang/IAE editions with page-level
   numerical definitions, stated IST reference and exact city/central coordinates.
   Compare tithi/Nakshatra/Yoga transitions, mean/true ayanamsha, sunrise and Lagna
   separately. Resolve printed times above 24:00 onto the following civil date.
   Do not copy a dynamic 'today' page as a dated reference without raw capture.
4. **Time/place**: pinned IANA data, independent civil conversion expectations,
   place IDs and coordinates. Postal areas may provide labelled approximate
   suggestions, never evidence of precise birthplace coordinates.

Sources: [Horizons manual](https://ssd.jpl.nasa.gov/horizons/manual.html),
[API parameter reference](https://ssd-api.jpl.nasa.gov/doc/horizons.html),
[IMD publication index](https://packolkata.imd.gov.in/rashtriya-panchang-english.php).
Horizons TT versus historical UT must be explicit; pre-1962 UT is not simply
modern atomic UTC. For each captured artifact, preserve returned model identifiers
instead of assuming the service always uses one DE generation.

## Planned coverage matrix

| ID family | Inputs/cases | Expected evidence / gate |
|---|---|---|
| TIME-INDIA | 1950-01-01 00:00, 2000-02-29 12:00, 2098-12-31 23:59 in Asia/Kolkata | Independently specified +05:30 conversion, UTC date rollover and strict range endpoints; P02. |
| TIME-REJECT | 1942 wartime date, 1900-02-29, invalid month/day, 24:00, leap second, unknown zone, foreign place | Typed rejection under initial coverage; no silent coercion. Generic future-zone resolver design also rejects skipped/ambiguous times; no foreign service support implied. |
| PLACE | Delhi/New Delhi aliases, Ahmedabad, Chennai, Kolkata, Srinagar, Leh, identical village names, missing coordinates, foreign bounding-box candidate | Stable IDs, state/country disambiguation, source/version, approximate-coordinate warnings, no nearest-city substitution; P02. |
| JPL-POS | All seven physical bodies, TT epochs at 1950-01-01 noon, 2000-01-01 noon, 2026-10-24 noon, 2098-12-31 noon; additional monthly grid in P03 | Captured independent geometric and corrected references, signed/circular residual report and range-edge support; P03. |
| POS-EVENT | Equinox/solstice, lunar perigee, conjunction, retrograde station and sign crossing epochs selected from captured references | Add event IDs only after locating actual events; search errors and coordinate parity; P03/P04. |
| AYAN | Reference epoch 1956-03-21 00:00 TT plus independently sourced 1950/J2000/current/end-range mean and true values | Verify Lahiri variant, precession, nutation once and units; P04. No approximate linear drift substitute. |
| ANGULAR | Every 30-degree sign, 360/27 Nakshatra, 360/108 Pada, 12-degree tithi and Yoga sector boundary | Definition-derived boundary vectors below/exactly/above and wrap at 0/360; P04/P05. |
| KARANA | Every k=0..59, exact and neighbouring 6-degree boundaries | All four fixed and seven repeating names, cycle continuity; P05. |
| PANCHANG | At least 12 dated IMD days across seasons; transitions near midnight/sunrise; matching coordinates | Five limbs, transition instants and day conventions separately; P05. |
| SUNRISE | Four seasons, Delhi/Ahmedabad/Chennai/Kolkata/Leh, declared height; impossible polar event diagnostic in core | Matched atmosphere, limb and horizon convention; P05. Foreign polar fixture is core failure-path testing, not enabled place search. |
| LAGNA | All 12 signs, equatorial/Indian latitudes, boundary +/-5 and +/-10 minutes, geometric degeneracy | Eastern solution and independent angles; P06. |
| D9 | All 108 divisions and sign boundaries | Independent movable/fixed/dual mapping table, numeric/visual parity; P07. |
| DASHA | Every starting lord, exact Nakshatra edges, fractional start, adjacent boundaries | 120-year cycle, period-sum invariants and year convention; P08. |
| UNCERTAIN | Single/multiple internal crossings including equal endpoint sectors; unknown-time full day | Withhold unstable components; dependency propagation; P14 plus earlier safe withholding gates. |
| OBSERVANCE | Skipped/repeated tithi, leap lunar month, city change and regional convention | Separately reviewed birthday rules; P11. |

Coverage edges above are *requested* fixtures. An adapter must acquire sufficient
search/interpolation margins, or lower its declared output coverage and reject
unsupported requests. Never extrapolate merely to match the target range.

## Proposed tolerances (not approved or measured)

| ID | Quantity | Proposed maximum absolute residual | Notes |
|---|---|---|---|
| T-POS | Physical-body geocentric longitude/latitude | 60 arcseconds each | Circular longitude distance; separately inspect component/vector residuals. Target inspired by candidate engine, not proof. |
| T-AYAN | Mean/true Lahiri ayanamsha | 1 arcsecond | Same convention/time; independent IAE references required. |
| T-LAGNA | Ascendant longitude | 60 arcseconds | Matched sidereal time/obliquity/location; boundary uncertainty can exceed classification tolerance. |
| T-LIMB | Tithi/Nakshatra/Yoga/Karana transition | 180 seconds | Printed reference resolution recorded separately; names away from uncertainty boundaries must agree exactly. |
| T-RISE | Sunrise/sunset | 120 seconds | Same limb/refraction/height. Atmospheric reality is not a deterministic numerical fixture. |
| T-ROOT | Numerical crossing solver residual in time | 1 second | Algorithm convergence target, not astronomical event accuracy; finite evaluation and timeout bounds required. |
| T-CIVIL | Civil normalization in supported zone | 0 milliseconds | Exact conversion for accepted minute-resolution input; no astronomy uncertainty included. |
| T-DISCRETE | Sector index, D9 mapping, Karana sequence, period lord | Exact | Inputs outside declared boundary uncertainty; no tolerance on wrong classifications. |
| T-DASHA | Shared period boundary arithmetic | 1 millisecond | Against the chosen 365.25-day definition, not a cross-tradition agreement claim. |

Node/Workers numerical parity target: 1e-9 degree for identical pinned input and
model, 1 millisecond for timeline arithmetic, exact diagnostics/classifications.
This is separate from reference accuracy and must be measured on the actual
Workers bundle. No blanket three/five-minute inherited Ritual tolerance.

For each metric report sample count, max/RMS/percentile residuals, worst fixture,
quantity-specific mismatch diagnosis, coverage, resource costs and acceptance
decision. Review positional uncertainty at boundaries rather than accepting
incorrect sectors because the angle happens to pass tolerance. Unvalidated
derivative/speed/distance/node quantities remain unavailable until they have
their own source-backed targets; T-POS does not certify them.

## Regression, privacy and release gates

P02: deterministic normalization/invalid inputs/place disambiguation, no logs,
no persistence, bounded data. P03: reference capture and model/coverage/resource
report; no fallback coefficients. P04–P08: unit/property/reference comparisons
and propagation of safe unavailable states. P09–P10: guest flows, real locales,
320–1440px themes, keyboard/table alternatives and redacted downloads. P17:
Ritual Assist parity before import changes, existing API/full/browser checks,
Workers build and deployment-specific rate-limit/performance evidence.

In every phase use isolated temporary DATA_DIRs, synthetic inputs, explicit
source/model versions and a phase evidence report. No runtime birth details in
logs, telemetry, external requests or persistence. Golden tests are offline and
must not depend on live providers. Runtime code remains unmodified by P01.
