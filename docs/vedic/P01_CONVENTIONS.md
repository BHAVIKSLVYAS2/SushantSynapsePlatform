# P01 calculation conventions

Version: `vedic-conventions-1-anchor-erratum-20261024`. Date: 2026-10-24 (Asia/Kolkata).
Status: design baseline frozen for implementation; not a validated production
profile. P01 defines the contract/test plan. Numerical acceptance and public
activation remain gated by independent fixtures in later phases.

## Decisions and scope

Use `IN_LAHIRI_DEFAULT_V1` as the initial profile identifier. Mean lunar nodes,
whole-sign houses and a 365.25-day Vimshottari year are selected design defaults,
not universal statements about Jyotish traditions. A change to numerical
conventions requires a new profile version, updated fixtures and release notes.
Implement only the current phase; this document does not install a library,
publish an app or change Ritual Assist calculations.

| Item | Frozen design decision |
|---|---|
| Civil calendar | Proleptic Gregorian; four-digit year, strict ISO date and 24-hour local time; reject normalized invalid dates, 24:00 and leap-second input. |
| Initial coverage target | Local dates 1950-01-01 through 2098-12-31, inclusive, India only. Actual support is the intersection of civil-time, place, astronomy and event-search coverage. This target is not validated coverage. |
| Birth versus exploration | Birth input cannot be after the request's current instant; future calendar/Time Machine requests use the coverage bounds, not the birth rule. |
| Timezone | Canonical Asia/Kolkata for verified Indian places in this initial range; never derive a timezone solely from a bounding rectangle or the device timezone. Reject foreign/unsupported places. |
| Time data baseline | IANA tzdb 2025b Asia/Kolkata rules, with source identity recorded. Initial range is deliberately after wartime changes. Host Intl is a cross-check, not the normative dataset. |
| Coordinates | WGS84 geodetic latitude, east-positive longitude, degrees; validate finite latitude [-90,90], longitude [-180,180]. Country eligibility is a separate check. Elevation metres, explicitly user supplied or assumed sea level with warning. |
| Planet origin | Geocentric for Sun, Moon, Mercury, Venus, Mars, Jupiter and Saturn. Birthplace does not apply lunar parallax to the default planetary table. |
| Position convention | Apparent direction with one-way light time and annual aberration; precession/nutation to true ecliptic/equinox of date. No atmospheric refraction or gravitational light deflection in planetary longitudes; record these exclusions. |
| Zodiac | Nirayana longitude = normalized tropical longitude minus the ayanamsha expressed in the same frame. Do not mix J2000 and of-date angles. |
| Lahiri variant | IAE post-1985 revised Lahiri baseline; not exact-Spica-at-180, Lahiri 1940, or original ICRC. True ayanamsha anchored at 23 degrees 15 minutes 00.658 seconds at 1956-03-21 00:00 TT. Subtract IAU1980 longitude nutation at that epoch to obtain the mean anchor; transport using IAU1976 precession and add date nutation exactly once for true-of-date ayanamsha. Implementation must publish its full algorithm/version and pass independent mean/true reference vectors before P04 acceptance. |
| Nodes | Mean ascending lunar node Rahu, using a separately documented TT polynomial/model with provenance and tests in P04; Ketu = normalized Rahu + 180 degrees. No true-node substitution. No physical-planet labels or geocentric distance for nodes. |
| Lagna | Eastern intersection of the ecliptic with the local geometric horizon, using local apparent sidereal time and true obliquity, converted to the same sidereal frame. No refraction; polar/degenerate geometry returns a diagnostic. |
| Houses | Whole-sign D1: the sign containing Lagna is house 1; successive signs are houses 2–12. Exact ascendant degree is separate from house boundaries. |
| D9 | Movable signs start Navamsa in themselves; fixed signs in the ninth sign; dual signs in the fifth, advancing one sign per 3 degrees 20 minutes. Do not equate a D9 sign with a D1 house. |
| Dasha | Vimshottari sequence and years from master section 5.3; year = 365.25 uniform 86400-second days, no Gregorian year addition or DST adjustment. Periods are [start,end), with a single shared boundary per adjacent period. |
| Panchang | Geocentric tithi, sidereal Nakshatra/Pada/Yoga; nonuniform Karana sequence specified below. Birth-instant values and sunrise observance are separate outputs. |
| Vara | Return civil weekday and sunrise-day weekday as explicitly named values; do not silently interchange them before sunrise. |
| Sunrise | Observer-local upper solar limb, standard 34-arcminute horizon refraction, solar angular radius from the selected model, sea-level unobstructed horizon unless elevation is declared. No weather/terrain correction. P05 must document the implemented height/dip model. |
| Birthday observance | Separate versioned regional rule, not selected by this astronomical profile. Keep birthday dates unavailable until P11 defines repeated/skipped tithi and month policy. |

The Lahiri target follows the distinctions documented in Astrodienst's
[ayanamsha discussion and Appendix E](https://www.astro.com/swisseph/swisseph.htm).
This is a reference to mathematical conventions, not permission to copy Swiss
Ephemeris code or a claim of bitwise equivalence. Its implementation remains
independent of that library.

P04 erratum: the original P01 table called the 1956 anchor mean. Source review
of the ayanamsha discussion and Appendix E establishes that it is true; the
wording is corrected above. This changes a pre-release design error, not any
deployed calculation or stored chart. No Swiss Ephemeris code/library is used.

The initial timezone scope is based on the versioned
[IANA Asia file](https://data.iana.org/time-zones/tzdb-2025b/asia). Earlier Indian
offset changes are outside the initial range; historical/foreign expansion
requires a new reviewed coverage policy, not extension of a fixed IST assumption.

## Adapter selection and time scales

Evaluate the already-vendored Astronomy Engine 2.1.19 first in P03: no new
dependency, MIT notices retained, Node/Workers fit, deterministic offline
coefficients. Its upstream describes an approximately one-arcminute design
target; that is not measured Synapse accuracy. Its
[JS reference](https://raw.githubusercontent.com/cosinekitty/astronomy/master/source/js/README.md)
distinguishes geocentric vectors and true ecliptic-of-date conversion.

This is a candidate adapter, not an approved substitute for a downloaded JPL
kernel. P03 must compare its coefficients/model and precision against fixtures
and record whether the master's reference-data requirement is satisfied. If not,
evaluate a bounded offline JPL-data adapter without silently loosening targets.
No paid API or runtime Horizons request may process a user's birth input.

Public input is local civil time. Normalization produces an explicitly labelled
UTC-compatible civil instant plus offset; 1950–pre-UTC instants are identified as
proleptic civil timestamps, not historical atomic UTC. Astronomy adapters expose
JD(UT1), JD(TT) and, where needed, TDB conversion/model versions separately.
Never pass a TT Julian day as UTC or equate TT, UT1 and TDB. P03 must freeze its
Delta-T/Earth-rotation/leap-second models with measured historical/future limits.
Unknown future Earth rotation/leap seconds receive a modelled-time warning.
Any accuracy claim excludes unbounded future Earth-rotation uncertainty.

## Angular, calendar and uncertainty boundaries

Use finite double-precision calculations in degrees normalized to [0,360).
Sectors are [start,end); an exact crossing belongs to the new sector. Compute
indices from unrounded values; display rounding never changes classification.
No universal epsilon may shift a planet into the neighbouring sign.

Rashi = floor(longitude/30)+1. Nakshatra = floor(longitude/(360/27))+1;
Pada uses the remainder within that Nakshatra divided by 360/108. Tithi uses
normalized Moon-Sun elongation in 12-degree sectors; Yoga uses normalized sum
of sidereal Sun and Moon in 360/27-degree sectors. Keep signs 1–12, Nakshatras
1–27, Padas 1–4, tithis 1–30 and yogas 1–27 in the public domain contract.

Karana uses zero-based half-tithi index k = floor(elongation/6): k=0 Kimstughna;
k=1..56 repeat Bava, Balava, Kaulava, Taitila, Garaja, Vanija, Vishti using
(k-1) modulo 7; k=57 Shakuni, 58 Chatushpada, 59 Naga. These are design mapping
requirements from the traditional model; P05 must verify names/mapping against
the independent Panchang reference before accepting them.

Exact input HH:mm records minute resolution, not second-level knowledge.
Approximate input is a closed interval around the stated time, with the caller
explicitly supplying +/- minutes. Unknown time is the whole local civil day
[midnight,next midnight); no representative noon instant. Search all internal
crossings, including multiple crossings with equal endpoint classifications.
If stability cannot be established, mark that component unsupported; never infer
stability from samples alone. Position-error bounds near a sector crossing also
require a boundary warning, even if the input time is exact.

Return feature-specific `stable`, `changes-within-interval` or `unsupported`.
Withhold unstable Lagna/houses, D9 and dependent interpretations. Unknown time
must not return a fabricated singular `utcInstant`, Dasha start or precise table.
Show interval bounds and ranges where defensible. Calendar event searches require
a coverage margin; never extrapolate beyond an adapter's declared coverage.

Calculation precision and display precision are distinct. Retain raw numeric
values. Display degrees/minutes/seconds only with precision warnings; local times
may be rounded to the nearest minute with explicit label. Dasha boundaries retain
milliseconds internally; exported civil dates are projections, not new boundaries.

## Versioned service contract and privacy

Contracts are internal, transport-neutral and versioned `vedic-contract-1`.
Precise requests contain localDate, localTime, verified place identity/coordinates,
timeZoneId, calculationProfileId, timeAccuracy and optional interval/language.
Locale is en/hi/gu and cannot alter numerical results. Optional display names
stay outside the mathematical kernel. Unknown-time requests carry no invented time.

Successful results carry resolved offset, instant or interval, tzdb source/version,
place source/version and coordinate precision, engine/build hash, model/data
identity and coverage, profile/ayanamsha/node/house versions, time-scale models,
warnings and per-feature precision classification. An unimplemented model must
produce `MODEL_UNAVAILABLE`, not plausible-looking fallback values.

Diagnostics use stable codes and safe messages: INVALID_INPUT,
UNSUPPORTED_PLACE, UNKNOWN_PLACE, AMBIGUOUS_PLACE, UNSUPPORTED_TIMEZONE,
AMBIGUOUS_LOCAL_TIME, NONEXISTENT_LOCAL_TIME, OUT_OF_RANGE,
TIME_DATA_UNAVAILABLE, EPHEMERIS_UNAVAILABLE, MODEL_UNAVAILABLE,
SUNRISE_UNAVAILABLE, UNSTABLE_BIRTH_TIME, REFERENCE_MISMATCH,
COMPUTATION_LIMIT. Diagnostic details must not echo names, birth inputs or tokens.
Transport status mapping belongs to later app adapters.

No birth inputs in URLs, request/exception logs, tracing, cache keys or analytics.
Guest inputs remain in request/tab memory. No server chart persistence, ads,
third-party tracking or public chart links. Public curated Rashifal caching is
separate from private calculations. Reuse existing stateless public validation
and rate-limiter patterns; preserve all organisation/auth boundaries.

## Acceptance boundary

P11 implementation extension (internal candidate): the separate explicit
AMANTA_FIRST_SUNRISE_SKIP_MISSING_V1 rule and Adhika policy are now defined in
P11_EVIDENCE.md/observance-rule.mjs. This does not amend the astronomical profile
or declare a universal regional birthday convention. Other schemes/Kshaya remain
unavailable, and sunrise/reference/human acceptance gates are still open.

This phase freezes design choices and the reference plan. It does not certify
the profile. Proposed tolerances require measurement and explicit acceptance
before public calculations. Missing reference pages, model equations, fixture
data or licensing evidence remain named downstream gates in
[P01_REFERENCE_PLAN.md](P01_REFERENCE_PLAN.md) and
[P01_SOURCES.md](P01_SOURCES.md), never implied passes.
