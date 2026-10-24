# Vedic kernel (P02 normalization, P03–P04 calculation candidates)

Pure ESM, no npm dependencies, network, persistence or request logging. P02
normalization, a P03 raw astronomy candidate and P04 sidereal positions are internal
modules only: no public route or discovery entry. Existing Ritual Assist is
unchanged. Versioned P01 contract: `docs/vedic/P01_CONVENTIONS.md`.

```js
import {searchPlaces, normalizeInput} from './index.mjs';

const candidates = searchPlaces('New Delhi', {limit: 10});
// A user selects a stable ID after reviewing name, state and country.
const normalized = normalizeInput({
  placeId: 'geonames:1261481',
  localDate: '2000-02-29',
  localTime: '12:00',
  timeZoneId: 'Asia/Kolkata',
  calculationProfileId: 'IN_LAHIRI_DEFAULT_V1',
  timeAccuracy: 'exact',
  language: 'en'
}, {now: Date.parse('2026-10-24T00:00:00Z')});
// normalized.utcInstant === '2000-02-29T06:30:00.000Z'
```

## Place selection

`searchPlaces(query, {limit=10, stateCode})` returns `{matches,total,truncated}`;
limit is 1–20, query maximum 100 characters, minimum two. Search covers canonical
names, included alternate names and state labels; it is not a translation service.
Each result has `geonames:<id>`, state/code, country, coordinates, timezone,
source/version and precision. Canonical exact names rank before aliases, then
population; no population-based automatic selection.

`getPlace(id)` selects a supported ID. `resolvePlaceName(name, {stateCode})`
requires a unique exact canonical/alias match. Duplicate names, including within
one state, produce AMBIGUOUS_PLACE. `searchPlaces` returns candidates without
claiming uniqueness. Unknown IDs/names never substitute a nearby city.

Directory: 3,786 GeoNames cities15000 entries with source country IN. Coverage
is incomplete: smaller villages and other missing places return UNKNOWN_PLACE.
Settlement coordinates are approximate representative points, not precise
birth addresses or a surveyed boundary. Every normalization warns accordingly.
Caller-supplied coordinates/country labels cannot override the directory.
`validateCoordinates` checks numeric ranges only; it never establishes country
eligibility. Source/attribution details: [THIRD_PARTY.md](THIRD_PARTY.md).

## Civil time and intervals

Supported local dates: 1950-01-01 through 2098-12-31 inclusive, canonical
Asia/Kolkata only. A bounded rule derived from pinned IANA 2025b data supplies
+05:30; runtime conversion never uses host timezone or host Intl. Earlier
wartime/history and foreign zones are rejected; ambiguous/skipped foreign civil
times cannot enter this profile. This is not a generic timezone resolver.
GeoNames' old Asia/Calcutta identifier is canonicalized at dataset build time;
request-side timezone spelling must be Asia/Kolkata.

Dates and HH:mm must match strict formats and actual Gregorian dates. Input
seconds, leap seconds, 24:00 and silent date rollover are rejected. Exact time
records one-minute resolution, not knowledge of the actual birth second.

- `timeAccuracy: 'exact'`: requires HH:mm and no uncertainty field. Returns one
  `utcInstant`, no interval.
- `'approximate'`: requires HH:mm and integer `precisionOfBirthTimeMinutes`
  1–720, meaning +/- minutes. Returns a closed UTC interval and null utcInstant.
- `'unknown'`: omit localTime and precisionOfBirthTimeMinutes entirely. Returns
  the whole half-open local day [midnight,next midnight), no noon substitution
  and null localTime/utcInstant.

The entire interval must fit coverage. The unknown day on the final supported
date may end exactly at the exclusive coverage bound; a closed approximate
interval may not include that unsupported instant. Intervals are not clipped.
Birth purpose is default and requires explicit finite safe-integer epoch
milliseconds in `{now}`. The entire birth interval must end no later than now;
unknown-time input for an unfinished current day is therefore rejected. Future
calendar/exploration normalization uses `purpose:'exploration'` within coverage
and does not require now. The caller supplies the clock; no hidden Date.now().

Optional elevationMetres accepts finite numbers -500 through 9000. Missing
elevation is explicitly assumed sea level with warning, not silently read from
a city DEM. Locale en/hi/gu only affects output metadata; numeric values match.
Pre-1962 dates warn that this is a proleptic civil timestamp, not certification
of historical atomic UTC. No UT1/TT/TDB conversion is implemented by P02.

## Diagnostics and downstream requirements

VedicInputError exposes safe fixed code/message and a safe JSON representation;
it never echoes supplied values. Unknown fields, arrays, nonplain objects and
accessor properties are rejected. No names, auth fields, birth-data caches or
log hooks are accepted. Results are deeply frozen, input remains unchanged.
Successful result objects intentionally contain the caller's normalized birth
data: later adapters must keep them out of URLs/logs/analytics and persistent
stores. A normal JS Error stack may identify source code/call sites; adapters
must not expose stacks as public error payloads.

Normalization returns no positions, charts, Lagna, Dasha, ephemeris provenance
or stability claims. Astronomy remains a separate explicitly labelled service.
P09 now provides the internal user review screen and no-third-party input flow. This
roughly 1.93 MB uncompressed JSON snapshot is not a public frontend asset; assess
partitioning/search delivery and actual Workers costs before public integration.

## Verification and source rebuilding

```powershell
node infrastructure/prepare-vedic-data.cjs --check
node --test tests/vedic-normalization.test.js
```

Run from repository root. `--check` uses retained raw India extracts and pinned
IANA source, verifies source hashes and exact generated bytes without network.
Run without arguments to regenerate from the same retained sources.

An intentional new source capture uses independently downloaded cities15000.zip,
extracted cities15000.txt, admin1CodesASCII.txt and geonames-readme.txt in an
isolated directory, then `node infrastructure/prepare-vedic-data.cjs <directory>
<YYYY-MM-DD>`. Review resulting source hashes/data changes before accepting a
new snapshot/version. Never replace pinned data as part of an ordinary test.

## P03 raw astronomy candidate

Import `@synapse/vedic/astronomy` / `@synapse/vedic/astronomy-time` (or their
source modules) for astronomy-only use without the settlement catalogue.
Aggregate index exports both services. No public calculation feature is enabled.

```js
import {astronomySnapshot} from './astronomy.mjs';
const atJ2000TT = astronomySnapshot({
  timeScale: 'TT', julianDay: 2451545,
  bodies: ['Sun', 'Moon', 'Mars'], correction: 'apparent'
});
const fromCivil = astronomySnapshot({
  timeScale: 'UTC', utcInstant: '2000-02-29T06:30:00.000Z'
});
```

Only timeScale TT with numeric julianDay, or UTC with strict ISO UTC seconds /
milliseconds, is accepted. Never supply both. Acceptable TT range is JD
2433280.5–2487706.5 inclusive. Civil evaluation is checked after conversion;
P02's narrower India civil-date/place policy remains a separate requirement.
Unknown/interval inputs cannot become a snapshot. There is no implicit current
date, representative noon, network fetch or fallback ephemeris.

Bodies are a unique subset of Sun, Moon, Mercury, Venus, Mars, Jupiter, Saturn,
in requested order; default all seven. Correction is geometric or apparent
(default). `modelId`, if supplied, must be `ae-2.1.19-geocentric-v1`. Invalid
models, unsupported bodies and nonfinite/out-of-range data produce safe typed
errors. The frame/correction/engine hashes and time models accompany each result.

Snapshots return geocentric EQJ J2000-mean-equator AU vectors and tropical
true-ecliptic/equinox-of-date longitude/latitude. The apparent track uses the
pinned engine's bounded BackdatePosition solver for every body, including Moon,
with first-order heliocentric aberration. It excludes gravitational deflection,
atmospheric refraction and topocentric parallax. Angles use observation time,
not the backdated emission time. A geometric track is separately available.

Runtime coefficients are analytic Astronomy Engine 2.1.19 data. The model says
`downloadedJplKernel:false`; it is not a JPL kernel interpolation engine. All
snapshots carry internal-candidate/approximate-model warnings and remain
unapproved for production. P03 reference measurements meet the proposed sampled
target; they do not establish an error bound at every instant or validate a
Kundli, sidereal transformation, node, chart, distance or motion quantity.

`resolveAstronomyTime` reports TT, modelled UT1 and civil Julian days separately;
TDB is null. The current pinned leap table expires 2027-06-28. After expiry,
last-offset conversion is explicitly unconfirmed. Pre-1972 civil input is
labelled as a civil-as-UT1/Delta-T approximation, not exact historical UTC.
The engine's Espenak–Meeus model supplies UT1, not observed Earth-rotation data.
Never reuse a modelled UT1 as a validated Lagna/horizon calculation.

Independent synthetic JPL fixtures are offline test data only, under
`tests/fixtures/vedic-jpl`. No runtime user data goes to JPL. Actual raw vector
comparisons use source model/observer/time/correction metadata and IAU frame bias.
The same engine angle transform on both sides is not independently certified;
this limitation remains explicit in `docs/vedic/P03_REFERENCE_RESULTS.json`.

```powershell
node infrastructure/prepare-vedic-astronomy.cjs --check
node infrastructure/vedic-jpl-fixtures.cjs --check
node infrastructure/verify-vedic-astronomy.cjs --check
node --test tests/vedic-astronomy.test.js tests/vedic-astronomy-worker.test.js tests/vedic-normalization.test.js
```

All commands are offline. Intentional fresh reference capture uses the fixed
synthetic query tool's `--capture`; it resumes existing captures and submits
sequential requests with a product User-Agent and bounded retry/backoff. Review
new raw hashes/model identifiers/results before replacing an accepted fixture.
Capture is never part of an ordinary test or runtime request. No astronomy
SDK/library was installed; existing esbuild/Miniflare validate the isolated bundle.

## P04 sidereal positions

`@synapse/vedic/sidereal` is an astronomy-only import without the settlement
directory. `@synapse/vedic/birth-positions` separately bridges normalized birth
input. Both are internal candidates; no public calculation page is registered.

```js
import {siderealSnapshot} from './sidereal.mjs';
const result = siderealSnapshot({
  timeScale: 'TT', julianDay: 2451545,
  calculationProfileId: 'IN_LAHIRI_DEFAULT_V1'
});
// Default: seven physical bodies plus computed mean Rahu and Ketu.
// Each has nominal siderealLongitude, Rashi 1–12, Nakshatra 1–27, Pada 1–4.
```

The time contract/range is inherited from P03. calculationProfileId is required;
bodies is an optional unique subset of nine supported names in requested order.
No arbitrary ayanamsha override, true-node substitution or geometric/apparent
switch is accepted: this profile uses apparent physical vectors consistently.

The revised Lahiri **true** anchor is 23°15′00.658″ at 1956-03-21 00:00 TT.
P01's earlier mean-anchor wording was corrected explicitly before release.
Subtract anchor nutation for the mean reference; transport using IAU1976 and add
IAU1980 nutation once for true ayanamsha. Raw P03 EQJ vectors are transformed
using this same frame model; P03's native modern tropical angles are not mixed
into it. See `ayanamsha.mjs` and the P04 evidence for the exact versioned method.

Mean nodes use IERS2003/Simon1994 Omega with the documented TT-for-TDB argument
approximation. They are labelled computed-mean-lunar-node; no physical distance,
vector or latitude is invented. Ketu is 180° opposite Rahu. Nodes and physical
positions share frame/ayanamsha definitions; no osculating-node claim is made.

Pure helpers `normalizeDegrees`, `classifySidereal`, `sectorBoundaryDistances`
and `lahiriAyanamsha` are exported separately. Classification is half-open and
uses unrounded nominal angles. A 61″ screening guard flags near boundaries;
it is not an approved physical error bound. Every result retains warnings and
`birthTimeStability:'not-evaluated'`. No stable birth Rashi/Nakshatra is inferred
from a single nominal instant or endpoint samples.

`siderealForBirth(input, {now})` accepts the original P02 request shape, validates
it again, and returns `{birth,sidereal,warnings}` in memory only. Exact HH:mm
has minute resolution, not a known birth second. Approximate and unknown time
return UNSTABLE_BIRTH_TIME pending continuous interval analysis. No names,
private persistence, logging, public share link or third-party call is added.

The fourteen published Lahiri checks are secondary reproductions of IAE values /
method results, not original IMD page review; original-IAE and independent review
remain release gates. ERFA numerical references separately check the selected
precession/nutation/obliquity/node formulas. No Swiss Ephemeris library or AGPL
source is copied. P04 does not implement Panchang, Lagna/houses, charts or Dasha.

```powershell
node infrastructure/prepare-vedic-sidereal.cjs --check
node infrastructure/verify-vedic-sidereal.cjs --check
node --test tests/vedic-sidereal.test.js tests/vedic-sidereal-worker.test.js
```

Source tables and expected ERFA values are extracted from pinned licensed source
files without executing the implementation under test. Ordinary checks remain
offline. Source/provenance and measured residuals: `docs/vedic/P04_EVIDENCE.md`
and `P04_REFERENCE_RESULTS.json`.

## P05 Panchang (internal candidate)

Direct `./panchang` exports `panchangSnapshot`, `classifyPanchangAngles` and
`panchangChangesBetween`. Snapshots accept the P04 TT/UTC time shape and required
`calculationProfileId: 'IN_LAHIRI_DEFAULT_V1'`. They return unrounded geocentric
Tithi/Paksha, Nakshatra/Pada, Yoga and the nonuniform Karana sequence, with each
limb's next transition. Each transition has a TT bracket at most 0.5s wide and
the new-side endpoint in TT and model-converted UTC. This is solver convergence,
not physical or birth-time precision. Near-boundary guards are proposed targets.
Transition `fromIndex`/`toIndex` are zero-based sector indices; limb `number`
values remain one-based. Karana `halfTithiIndex` is zero-based 0..59.

`panchangChangesBetween({startTtJulianDay,endTtJulianDay,calculationProfileId})`
enumerates each limb independently over at most three days. Separate cursors
preserve events in overlapping brackets. The end is exclusive; a bracket across
it has `intervalMembership:'boundary-uncertain'`. Overlapping brackets do not
establish physical ordering. No endpoint-only stability inference is made.

Direct `./panchang-observer` exports `sunriseOnCivilDay`, `panchangAtInstant` and
`panchangBySunrise`: low-level numeric coordinate primitives, optional elevation
-500..9000m, explicit `timeZoneId:'Asia/Kolkata'`, civil range 1950..2098. A
request requiring an unsupported adjacent day is withheld. Polar missing events
return `SUNRISE_UNAVAILABLE`, never a fabricated sunrise/noon. Instant results
separate civil and sunrise Vara. The reported UTC millisecond defines the day
switch. Sunrise-day results include both sunrises, limbs at sunrise and changes.

Use `./panchang-place` for the offline Indian-place admission boundary:

```js
import {panchangForPlace} from '@synapse/vedic/panchang-place';
const result = panchangForPlace({placeId: 'geonames:1261481',
  localDate: '2026-09-26', calculationProfileId: 'IN_LAHIRI_DEFAULT_V1'});
// Or replace localDate with an explicit utcInstant for instant Panchang.
```

This wrapper adds approximate-settlement warnings and rejects coordinate
overrides or ambiguous date/instant inputs. It is calendar/exploration logic,
not birth-input normalization or uncertain birth-time stability analysis.

Sunrise uses the engine's upper solar limb/distance-dependent radius, 34-minute
refraction scaled by standard atmosphere at ground elevation, and a ground-level
observer with zero horizon dip. No weather, terrain or platform-height correction.
`civilInstantFromTT` inverts the declared TT/civil model; engine Date is modelled
UT1 and is never relabelled UTC. Pre-1972/future-leap uncertainty stays explicit;
non-representable leap-second roots return a typed diagnostic.

Twelve publisher transition checks have max residual 93.808s. Publisher sunrise
differs by 177-234s, outside the proposed 120s gate: exact point/convention are
undisclosed and the mismatch is open. Twenty independent NOAA low-order sunrise
screens agree within 59.754s. These do not replace original PAC validation.
The saved report retains mismatches, 596 internal crossing brackets and 24
seasonal sunrises. PAC/USNO raw capture failed; no nonexistent source hash is claimed.

```powershell
node infrastructure/verify-vedic-panchang.cjs --check
node --test tests/vedic-panchang.test.js tests/vedic-panchang-worker.test.js
```

Ordinary checks/runtime stay offline. Facts and failed-capture manifest are in
`tests/fixtures/vedic-panchang/`. Explicit capture uses fixed synthetic queries;
never send birth inputs to reference services. No public API, UI, Ritual Assist
import, private persistence or deployment. See `docs/vedic/P05_EVIDENCE.md`.

## P06 Lagna, whole-sign houses and numeric D1

`./sidereal-time` provides `localSiderealTime`, `greenwichMeanSidereal1982`
(UT1 Julian day -> degrees) and `equationEquinoxes1994` (TT Julian day -> radians).
Runtime Earth rotation uses modelled UT1, with IAU1982 mean sidereal time and
IAU1994 equation of equinoxes evaluated from TT. The latter's TDB argument is
approximated by TT explicitly. Nutation is the P04 106-term IAU1980 model.
Two additional ERFA 2.0.1 sources and published expected values are pinned
separately, preserving the earlier P04 source manifest and its reproducibility.

`./lagna` exports `lagnaAtInstant` and the pure `ascendantGeometry` primitive.
Instant input is TT or UTC plus latitude, east-positive longitude, required
calculationProfileId and optional finite elevation -500..9000m. True obliquity
and apparent sidereal time select the eastern geometric horizon intersection;
subtract true Lahiri exactly once for sidereal Lagna. It does not reuse a mean
ayanamsha against true longitude. No refraction, terrain, horizon dip, polar
motion or topocentric solar/lunar radius applies to this mathematical direction.
Geodetic latitude defines the local tangent horizon; elevation has no effect.
Polar-circle/near-degenerate cases are deliberately LAGNA_UNAVAILABLE. Nominal
sign/Nakshatra/Pada labels are not a claim of birth-time stability.

`./d1` exports `d1ChartAtInstant`, `wholeSignHouses` and
`wholeSignHouseForLongitude`. Only `houseSystem:'whole-sign'` is supported (the
profile default). D1 includes nine P04 positions (seven physical bodies and
mean Rahu/Ketu), twelve house rows with body IDs, and per-body house numbers.
House 1 is the whole sign containing Lagna, beginning at its 0 degrees; the exact
ascendant longitude is separate. House/sign numbers are 1..12, sign intervals
are start-inclusive/end-exclusive, and Pisces ends at zero with wrapsZero:true.

```js
import {birthChartForBirth} from '@synapse/vedic/birth-chart';
const result = birthChartForBirth({localDate: '2000-01-01', localTime: '12:00',
  placeId: 'geonames:1261481', timeZoneId: 'Asia/Kolkata', timeAccuracy: 'exact',
  calculationProfileId: 'IN_LAHIRI_DEFAULT_V1'}, {now: Date.now()});
// result.chart.houses and result.chart.planets are the numeric D1 tables.
```

This separate birth bridge repeats P02 validation (place ID, timezone, future
limits and metadata). Approximate/unknown inputs are UNSTABLE_BIRTH_TIME.
Exact HH:mm still has minute resolution: the wrapper applies a conservative
sign-boundary screen using the analytic geometric sensitivity bound over a
minute and proposed model targets. Planet sign screening adds a 24deg/day rate
allowance. A near-boundary result is withheld. Passing that screen is not P14
birth-time stability or a certified physical error bound; warnings remain.
Direct coordinate/instant functions are low-level nominal exploration kernels,
not the public place/birth admission boundary. The core bundle excludes places.

Three ERFA numerical expectations, 576 independent numerical horizon-root
checks, 894 sampled annual D1 charts/8,046 positions and six daily 12-sign sweeps
are reproducible offline. Horizon roots are independently solved using USNO's
altitude equation at supplied angles, not external full astronomical goldens.
Original PAC/IAE, full matched-time/place Lagna validation, modelled Earth
rotation limitations and the earlier sunrise discrepancy remain release gates.
No graphic charts, D9, Dasha, UI, interpretations, persistence or deployment.

```powershell
node infrastructure/prepare-vedic-lagna.cjs --check
node infrastructure/verify-vedic-lagna.cjs --check
node --test tests/vedic-lagna.test.js tests/vedic-lagna-worker.test.js
```

Ordinary tests and runtime are offline. `--capture` on the prepare utility is
an explicit development-only operation downloading the two fixed licensed
source URLs; do not rerun capture as a test. Evidence: `docs/vedic/P06_EVIDENCE.md`.

## P07 D9 and chart presentation

`./d9` exports `navamsaForLongitude`, `d9ChartAtInstant` and
`divisionalChartsAtInstant` (returns `{d1,d9}`, reusing one D1 calculation).
Input matches P06. Parasari Navamsa uses the movable/self, fixed/ninth and
dual/fifth rule. Classification uses the existing canonical 108 half-open
boundaries, not floor(longitude*9/30), which can misclassify adjacent doubles.

`navamsaForLongitude` returns the source longitude/Rashi, zero-based
divisionIndex (0..107), divisionWithinRashi (1..9), mapped rashi (1..12) and
source-boundary distance/screen. D9 house numbers are relative to D9 Lagna,
never copied from D1. D9 rows deliberately have sourceSiderealLongitude rather
than a purported physical siderealLongitude; Rahu/Ketu retain computed-node
labels. No D9 physical distances, vectors, degree measurements or predictions.

`./birth-divisions` exports `birthChartsForBirth`, using the P06 birth admission
and minute-resolution screen, then applying its angular guards to all D9
division boundaries. Unknown/approximate or near-boundary minutes withhold
results as UNSTABLE_BIRTH_TIME. Passing remains nominal screening, not certified
P14 stability. A caller may separately request D1 through the unchanged P06
bridge when D9 is withheld. The local preview uses a synthetic exploration
instant and clearly labels it accordingly.

Presentation belongs to apps/rashifal-kundli/frontend: North fixed-house and
South fixed-sign SVG views, keyboard house selection and a shared visible
numeric table. No public routes/card, birth-input form, persistence or Ritual
Assist changes. Development preview: `node infrastructure/preview-vedic-charts.cjs`.
It binds loopback only and serves no production data; see the app README.

The separately enumerated 108-entry mapping fixture follows P01; it is
agent-authored, not independent human/source acceptance. All 108 boundaries
are tested at adjacent doubles. Saved report checks 894 chart pairs/1,788
numeric tables/16,092 rows; the annual sample's D9 ascendants cover only the
five explicitly listed signs. Browser layout stress checks separately cover
all twelve synthetic ascendants. Prior astronomical acceptance gates stay open.

```powershell
node infrastructure/verify-vedic-d9.cjs --check
node --test tests/vedic-d9.test.js tests/vedic-d9-worker.test.js
npx.cmd playwright test apps/rashifal-kundli/tests/browser.spec.js
```

No new npm dependency or third-party chart library. Runtime/checks stay offline;
graphics use DOM text/attributes rather than user-supplied HTML. Evidence and
resume instructions: docs/vedic/P07_EVIDENCE.md and PROGRESS.md.

## P08 Vimshottari period engine

Direct `./dasha` exports `vimshottariBirthBalance`, `vimshottariTimeline` and
`vimshottariModel`. Lord order/weights: Ketu 7, Venus 20, Sun 6, Moon 10, Mars 7,
Rahu 18, Jupiter 16, Saturn 19, Mercury 17 years. Birth Nakshatra and unrounded
Moon progress determine the lord and elapsed/remaining share. Antardashas begin
at the full Mahadasha origin, which can precede birth; they do not restart at
birth. Each major has nine children, starting with its own lord, weighted by
child lord years / 120. No interpretations or predictions are generated.

```js
import {vimshottariTimeline} from '@synapse/vedic/dasha';
const timeline = vimshottariTimeline({birthUtcInstant: '2000-01-01T00:00:00Z',
  moonSiderealLongitude: 20 / 3, calculationProfileId: 'IN_LAHIRI_DEFAULT_V1',
  yearConventionId: 'VIMSHOTTARI_365_25_DAY_V1', timeZoneId: 'Asia/Kolkata',
  atUtcInstant: '2026-10-24T12:00:00Z'});
```

This low-level API expects an already computed nominal birth Moon. The birth
range matches P02's India civil 1950..2098 range. `atUtcInstant` defaults to
birth, never the host clock. Queries cover [birth,birth+240 arithmetic years).
The result lists the full nine-major/81-minor 120-year cycle containing the
query instant, with cycleIndex (0,1 or 2), plus the original birth balance and
birth Mahadasha. Some listed full periods can precede birth or extend beyond
query coverage. Active indices identify the row/child in that returned cycle;
next child/major transitions name both lords correctly when they coincide.

The one supported yearConventionId is explicit: 365.25 uniform 86,400,000ms days
= 31,557,600,000ms. Other year choices are MODEL_UNAVAILABLE, never silently
substituted. No Gregorian-year addition, host timezone or DST adjustments.
This is arithmetic on the Unix/POSIX millisecond axis. UTC ISO strings are
projections of those timestamps, not observed SI durations or future-leap
predictions. The time-basis choice is declared in model metadata, distinct from
the TT/modelled-UT1 astronomy used to obtain the birth Moon.

Every adjacent boundary is the same shared integer-millisecond value; intervals
are [start,end). Whole-year and child durations are exact integers for this
convention. The birth epoch is rounded once to the nearest millisecond. At a
submillisecond positive birth balance, the remaining time is quantized to 1ms
to retain the unrounded Nakshatra lord; a warning records that <=1ms adjustment.
No angular epsilon changes the birth classification.

Boundaries include raw milliseconds, UTC projection and pinned Asia/Kolkata
local projection/source version. A local boundary outside the 1950..2098 civil
rules returns status:unavailable and TIME_DATA_UNAVAILABLE, not an extrapolated
offset/date. Arithmetic periods may extend beyond astronomical/civil coverage
without claiming new ephemeris support. Current/next states remain nominal and
explicitly not birth-time-stability verified.

Use `vimshottariForBirth` from `./birth-dasha` for actual normalized requests.
It takes the existing P02 birth input/context and optional third argument
`{atUtcInstant,yearConventionId}`. Default query is explicit context.now and
default year is the named P01 convention. It computes only the P04 Moon,
preserves provenance and rejects unknown/approximate time. A 121-arcsecond
minute-resolution Nakshatra screen withholds near-edge starting-lord results.
Passing is not certified period-date accuracy or P14 stability; small Moon/time
errors can materially shift dates, and active periods are labelled nominal.

Independent BigInt/rational fixtures cover nine midpoint lords, 81 children
and 180 boundary comparisons (max residual 0ms). They verify the frozen design
rule, not original astronomical goldens. Saved report covers 81 synthetic and
149 annual birth-Moon timelines; no original/human source acceptance is claimed.

```powershell
node infrastructure/prepare-vedic-dasha.cjs --check
node infrastructure/verify-vedic-dasha.cjs --check
node --test tests/vedic-dasha.test.js tests/vedic-dasha-worker.test.js
```

No new dependency, external runtime call, UI, public route, persistence or Ritual
Assist refactor. The arithmetic-only bundle excludes astronomy and places.
Evidence and P09 handoff: docs/vedic/P08_EVIDENCE.md and PROGRESS.md.

P09 application composition is implemented under apps/rashifal-kundli/frontend,
without changing this 0.8.0 kernel or dependencies. birth-report.mjs independently
validates/composes positions, D1, D9 and Dasha; typed withholding remains specific
to each feature. Names never enter kernel inputs. The memory-only review UI,
localized chart/Dasha views and loopback preview are documented in the app README
and docs/vedic/P09_EVIDENCE.md. Full regression: 464/464; focused Chrome: 8/8.
P10 export is next; all prior numerical/source release gates remain open.

P10 is now implemented in app-owned export-report.mjs, with an explicit
redaction-first projection, standalone HTML and browser Print / Save as PDF.
Numeric kernels/version/dependencies remain unchanged. Reports retain source
identities, precision/warnings and typed feature withholding. Five export Node
tests and ten app Chrome checks pass; all 469 repository checks are covered
across full/targeted reruns (see docs/vedic/P10_EVIDENCE.md for precise results).
Next P11 birth Tithi/observance/names; existing astronomical release gates remain.

P11 adds pure birth-panchang.mjs, lunar-calendar.mjs, observance-rule.mjs and
birth-observance.mjs (package/lock 0.11.0, no dependencies). Existing astronomy,
positions, sunrise, D1/D9 and Dasha rules are unchanged. Birth Panchang requires
admissible exact input. Amanta months/search margins and the explicitly selected
AMANTA_FIRST_SUNRISE_SKIP_MISSING_V1 rule return named exploration candidates,
including repeated/missing/uncertain statuses and explicit Adhika policy.
Month coverage is narrower than civil coverage; yearly queries are 1951..2097.
Kshaya naming and other regional schemes are typed unavailable. Editorial names,
localized UI and private ICS remain app-owned, separate from numerical kernels.
Original PAC spot checks: twelve 2026 new moons, maximum residual 35.368 seconds,
and two Adhika/Nija month samples. These do not resolve P05 sunrise or other
release gates. See docs/vedic/P11_EVIDENCE.md and P11_REFERENCE_RESULTS.json.

```powershell
node infrastructure/verify-vedic-calendar.cjs --check
node --test tests/vedic-calendar.test.js tests/vedic-calendar-worker.test.js
```

Next P12 Rashifal content; no public activation or deployment is implied.

P12 adds rashifal-factors.mjs (package/lock 0.12.0), with strict IST day/tomorrow/
Monday-week periods and P04 Moon classification at 12:00 IST. Relative sign counts
use only a manually chosen Chandra Rashi; no birth/place input or Lagna/aspect
claim. Near-model-boundary samples and periods crossing civil coverage are typed
unavailable. Existing numerical rules/dependencies remain unchanged. App-owned
versioned editorial templates, generic caches and explicit translation fallback
compose these factors; noon snapshots are not continuous Gochar analysis.
See docs/vedic/P12_EVIDENCE.md and P12_REFERENCE_RESULTS.json for limits.

```powershell
node infrastructure/verify-vedic-rashifal.cjs --check
node --test tests/vedic-rashifal.test.js tests/vedic-rashifal-worker.test.js
```

Next P13 Time Machine/Gochar foundations; public/editorial acceptance stays open.

P13 adds exploration-place.mjs, gochar.mjs and birth-gochar.mjs (package/lock
0.13.0, no new dependency). Explicit hypothetical minute/place snapshots reuse
P02/P04/P05 unchanged and admit covered future exploration independently of birth
future admission. Observer-dependent failures do not discard planetary positions.
Pure Gochar counts are reference-sign-inclusive, with near-boundary withholding;
endpoint differences are in [-180,180), never a velocity/retrograde estimate.
Private birth references keep exact/future/uncertainty screens; no purpose override.
App composition/UI/clear/print privacy remain under apps/rashifal-kundli. See
docs/vedic/P13_EVIDENCE.md and P13_REFERENCE_RESULTS.json for evidence and limits.

```powershell
node infrastructure/verify-vedic-gochar.cjs --check
node --test tests/vedic-exploration.test.js tests/vedic-gochar-worker.test.js
```

P14 adds interval-sectors, sensitivity and birth-sensitivity (0.14.0). Complete
adaptive covers produce feature-specific conditional statuses and possible
boundary windows; unknown time never selects a representative birth epoch.
Candidate rate/guard bounds are not independently certified. See
docs/vedic/P14_EVIDENCE.md and verify-vedic-sensitivity.cjs --check.
Next P15 rulebooks; previous physical/source acceptance gates remain open.
# P15 internal rulebooks

Version 0.15.0 adds rulebooks.mjs, matching.mjs, traditional-checks.mjs and
birth-matching.mjs. Pure rule bundles exclude astronomy/places; birth bridges
enforce explicit consent and exact-minute screens. Composite conventions,
source disagreements and independent-review limits are explicit. No final
Yoga/Dosha assessment or marriage verdict. Reproduce:
`node infrastructure/verify-vedic-matching.cjs --check`.
See docs/vedic/P15_EVIDENCE.md. Next requested phase is P16, subject to its
individual algorithm/source gates; earlier release gates remain open.
# P16 optional candidate subset

Version 0.16.0 adds advanced-vargas.mjs (D7/D10/D12), ashtakavarga.mjs (raw D1
seven-recipient/eight-contributor BAV/SAV), strength.mjs (Uccha Bala only) and
birth-advanced.mjs (strict per-feature composition). No new dependency or earlier
kernel change. Full Shadbala is unavailable; unsupported components are not
estimated or combined into a misleading strength total. Individual algorithm,
source/model and public-release review remain open. Evidence and reproduction:
docs/vedic/P16_EVIDENCE.md; `node infrastructure/verify-vedic-advanced.cjs --check`.
# P17 integration and release readiness

Version 0.17.0 adds ritual-compatibility.mjs and release-policy.mjs. Ritual now
imports the identical canonical vendor engine through its legacy module; its
public URL and calendar policy remain compatible. Profile diagnostics explicitly
reject substituting Ritual and Vedic Panchang conventions. Read-only readiness
plans stay blocked by independent source, privacy and deployment gates.
`node infrastructure/verify-vedic-integration.cjs --check` verifies preserved
baselines, model differences, source hashes, delivery bytes and private bundles.
P17 is the last named master phase; review/resolve acceptance blockers before
any public-release work. See docs/vedic/P17_EVIDENCE.md.
