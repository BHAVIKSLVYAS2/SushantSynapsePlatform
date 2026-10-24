# Vedic reference data and attribution (P02–P04)

## GeoNames

Contains modified [GeoNames](https://www.geonames.org/) data, retrieved
2026-10-24, licensed [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/).
No accuracy, completeness or timeliness warranty is provided. See the retained
`data/sources/geonames-readme.txt` for source fields and original terms.

Sources: [cities15000.zip](https://download.geonames.org/export/dump/cities15000.zip)
and [admin1CodesASCII.txt](https://download.geonames.org/export/dump/admin1CodesASCII.txt).
Retained raw extracts contain all country IN rows and IN admin1 rows respectively;
original worldwide ZIP/text bytes remain in ignored development capture files,
with their hashes retained in `data/sources/capture.json`. That manifest also
pins the retained extracts/readme. No source retrieval occurs at runtime.

Changes: retain only Indian populated-place rows; join state display names by
source admin1 code; stable IDs prefixed geonames:; WGS84 numeric coordinates;
deduplicate/sort aliases, omit empty/canonical-duplicate aliases and aliases over
100 characters; preserve source timezone while canonicalizing Asia/Calcutta to
Asia/Kolkata. No postal median, geocoding request or nearby-city substitution.
No source coordinates are rounded by the builder. Representative settlement
points remain approximate; printed decimals are not an accuracy guarantee.

Derived snapshot `geonames-india-cities15000-2026-10-24-v1` has 3,786 records.
Country membership comes from source IN, not an inferred rectangle or client
claim. This is a gazetteer classification, not a political boundary adjudication.
Alternate names are source aliases, not reviewed English/Hindi/Gujarati prose.
At public integration, retain visible GeoNames credit/licence link and description
of these modifications in the app's source/provenance view and notices.

## IANA timezone data

Pinned [Asia file](https://data.iana.org/time-zones/tzdb-2025b/asia) and
[distribution licence](https://data.iana.org/time-zones/tzdb-2025b/LICENSE),
retrieved 2026-10-24, retained in `data/sources/iana-2025b-*`. The relevant data
is public domain; no BSD-exception C files are copied.

Asia source SHA-256:
`9a8b7e640cb0692b9e50b9126f599bf89360a2f9ed9e54b722f3e5b6f631b419`.
`data/india-time.json` retains the source zone block and derived bounded rule.
The builder asserts the post-1945 terminal +05:30/no-DST rule and the source
hash. It intentionally supports only local years 1950–2098, not arbitrary
historical or foreign timezone transitions. Dataset version is reported in
results regardless of the host's ICU/tzdb version.

## Updates

Offline rebuild/check: `node infrastructure/prepare-vedic-data.cjs --check`.
An upstream change requires intentional acquisition, new hashes and version,
review of source terms/transformation, fixture/regression reruns and evidence.
No new npm dependency is included. P03 additions are documented below.

## Astronomy Engine 2.1.19 (P03)

By Don Cross, MIT; retained `vendor/LICENSE` and complete notice at the start
of `vendor/astronomy-engine-2.1.19.mjs`. This is a byte-identical copy of the
already-vendored Ritual Assist ESM bundle, not a new dependency or upstream
upgrade. Historical P03 copied the existing app bundle; P17 makes this the
canonical implementation with a Ritual compatibility re-export. Its public
URL/delivered engine input and existing calendar policies are preserved. Bundle SHA-256:
`6257fd34e7a74370767a98bf26d1724d748e5f71c1530be6730ff21336cc6607`.

Inspected [versioned source](https://github.com/cosinekitty/astronomy/tree/v2.1.19)
and [API reference](https://raw.githubusercontent.com/cosinekitty/astronomy/v2.1.19/source/js/README.md).
Retrieved unminified astronomy.ts to ignored development sources; SHA-256
`e043bba40da82c981d2952407c68975b60cd9d94675c91e1c0d3c8c148595fb3`.
No code was extracted into a differently licensed model or silently edited.
The duplicate app/package copies intentionally isolate validation from Ritual
Assist; a future shared extraction needs its own parity/regression evidence.

The runtime uses bundled analytic coefficients and lunar series, not downloaded
JPL kernels. Model provenance and exclusions are explicit in astronomyModel.
Independent accuracy results are sampled engineering measurements, not upstream
or NASA endorsement. Preserve the MIT notice in future exports/bundles.

## Leap-second data (P03)

Pinned [current IANA leap table](https://data.iana.org/time-zones/tzdb/leap-seconds.list),
retrieved 2026-10-24, public-domain status stated in the file, expires 2027-06-28.
Retained as `data/sources/iana-leap-seconds-20261024.list`, SHA-256
`db5a895f16853b03bfc865e8d68f9fc8710ef1740e3400c701cd46a5bbbc3433`.
Generated `data/leap-seconds.json` preserves source/version/expiry and effective
offsets. `prepare-vedic-astronomy.cjs --check` verifies its pinned bytes/output.
The earlier expired 2025b leap-table download is acquisition history only;
P02's independent civil timezone source remains pinned at 2025b.

## JPL reference responses and ERFA frame data (P03 tests only)

Credit NASA/JPL Solar System Dynamics and the model-producing teams identified
in each retained response. [Horizons manual](https://ssd.jpl.nasa.gov/horizons/manual.html),
[API documentation](https://ssd-api.jpl.nasa.gov/doc/horizons.html) and
[fair-use policy](https://ssd-api.jpl.nasa.gov/doc/) were reviewed. Raw scientific
numeric responses, source headers and query/hash manifest are retained under
`tests/fixtures/vedic-jpl`, not in public assets or runtime request processing.
No JPL images, branding, SPICE toolkit or runtime JPL kernels are distributed;
no permission/endorsement claim is inferred from API access or image policies.
Do not treat the MIT engine licence as a licence to unrelated JPL software.

Numerical IAU 2000 frame-bias matrix values come from
[ERFA 2.0.1 reference tests](https://raw.githubusercontent.com/liberfa/erfa/v2.0.1/src/t_erfa_c.c).
The exact source excerpt, full-source hash, matrix and ERFA licence are retained
beside the JPL fixtures. ERFA is derived from SOFA; copyright/redistribution
conditions are preserved in `ERFA-LICENSE`. Only the published constant matrix
is used by development comparisons; no ERFA library or C code runs in the app.
The reference matrix converts ICRF-aligned axes to mean J2000 axes before
comparison; no unacknowledged equation-of-equinox/epoch substitution is used.

Before public calculation release, resolve source/convention/tolerance acceptance
and maintain attribution for whichever model/data are actually selected. Fresh
reference acquisition must preserve raw headers/hashes, be sequential and respect
service errors/rate limits; ordinary tests do not contact upstream services.

## P04 IAU/IERS formulas, nutation data and reference values

ERFA 2.0.1, derived with permission from SOFA, supplies the permissively licensed
IAU1976 precession, IAU1980 obliquity/106-term nutation and IERS2003 mean lunar
ascending-node equations/reference data. Copyright (C) 2013–2023 NumFOCUS
Foundation. Retained original sources, copyright/terms and release licence:
`data/sources/erfa-2.0.1/`; each file's URL and SHA-256 are pinned in manifest.json.

References: [precession](https://raw.githubusercontent.com/liberfa/erfa/v2.0.1/src/pmat76.c),
[obliquity](https://raw.githubusercontent.com/liberfa/erfa/v2.0.1/src/obl80.c),
[nutation](https://raw.githubusercontent.com/liberfa/erfa/v2.0.1/src/nut80.c),
[mean node](https://raw.githubusercontent.com/liberfa/erfa/v2.0.1/src/faom03.c),
[numerical expected values](https://raw.githubusercontent.com/liberfa/erfa/v2.0.1/src/t_erfa_c.c).

The JS adaptation is **derived from ERFA**, not SOFA itself. Names/API and bounded
profile-specific use differ; do not represent it as an endorsed SOFA library.
No npm library or native binary was installed. Mathematical routines and the
full 106-term coefficient array were necessary to match the chosen historical
IAU1976/1980 frame, rather than silently substituting the existing engine's
modern precession/nutation frame. Existing Astro Engine remains the physical
position provider; no second planetary ephemeris is added.

`prepare-vedic-sidereal.cjs` verifies pinned sources and deterministically extracts
the runtime nutation table plus published ERFA expected values for offline tests.
The original files retain the complete conditions/disclaimer; the JS derivative
has a retained legal notice. Before any public binary/web distribution, include
the full ERFA copyright, conditions and disclaimer with the distributed legal
notices/documentation as required; a short bundled source notice alone is not
claimed to satisfy every distribution condition. No P04 public build is shipped.

## P04 Lahiri definition/reference prose

The [Astrodienst ayanamsha discussion and Appendix E](https://www.astro.com/swisseph/swisseph.htm)
provide mathematical convention descriptions and published numerical reference
facts. Retrieved 2026-10-24; captured page SHA-256
`7ca3f8863d31001f3a1411139d4759813cc8c3d3c51312fbc45aa84382f05aa2`.
Raw page is retained in ignored `.publish/vedic-p04-lahiri-reference.html`;
the compact factual reference fixture is under `tests/fixtures/vedic-sidereal`.

No Swiss Ephemeris software, AGPL code, library or source coefficient table was
copied or linked. Its software licence is not treated as a permissive licence.
Lahiri transport is an implementation of the documented mathematical definition
using the above ERFA-derived precession/nutation equations. No Spica lookup or
constant annual-drift surrogate is used. P01's mistaken mean-anchor wording was
corrected transparently after review of the true-anchor convention.

IAE numbers are accessed through a secondary reproduction; original IMD/IAE
fetches failed and independent original-source/human review remains pending.
Do not advertise the resulting sampled agreement as IMD approval or universal
precision. IERS fundamental Omega formally uses TDB centuries; the source
explicitly permits TT as a negligible approximation, recorded in the node ID.

## P05 reference facts and sunrise screening

Compact numerical facts from [Panchangam.org](https://panchangam.org/)
daily tables for 2026-05-31, 2026-09-26 and 2026-10-10 are manually transcribed
under tests/fixtures/vedic-panchang/published.json, with exact source URLs and
retrieval date. No publisher software or prose is copied. Raw capture failed;
no publisher raw-file hash, independent implementation, exact sunrise convention
or original PAC acceptance is claimed. The fixture's own hash is in the report.

The development-only independent low-order sunrise screening function implements
the numerical equations published by NOAA Global Monitoring Division in
[General Solar Position Calculations](https://gml.noaa.gov/grad/solcalc/solareqns.PDF),
viewed 2026-10-24. It is not a copied software module or runtime fallback.
Its constant 90.833-degree zenith differs slightly from the runtime's variable
solar radius. [USNO rise/set definitions](https://aa.usno.navy.mil/faq/RST_defs)
provide horizon/refraction context; no USNO calculated fixture was captured.
Failed PAC/USNO HTTP attempts are retained honestly in capture-manifest.json.

## P06 sidereal-time sources and horizon references

Additional ERFA 2.0.1 files `gmst82.c` and `eqeq94.c` retain their complete source
headers under data/sources/erfa-2.0.1, with URLs and hashes in manifest-p06.json.
The earlier P04 manifest is unchanged. The same retained BSD terms in LICENSE
apply. Sidereal-time equations in sidereal-time.mjs are identified adaptations,
not SOFA itself, and retain the NumFOCUS copyright notice. Independent expected
numerical values are extracted from the already pinned t_erfa_c.c; no expected
values are regenerated by executing the runtime implementation.

Primary [USNO altitude/azimuth equations](https://aa.usno.navy.mil/faq/alt_az)
support the development-only independent RA/Dec horizon scan/bisection in
infrastructure/vedic-horizon-reference.cjs. This is an independent numerical
geometry method with supplied angles, not a captured external Lagna golden.
The geometric cardinal expectations (equator at apparent sidereal angles
0/90/180/270 degrees) follow directly from the equator/ecliptic intersections.
No Swiss Ephemeris software or coefficient/source code is installed or copied.

## P11 calendar and editorial source facts

tests/fixtures/vedic-calendar/published.json retains twelve manually transcribed
PAC 2026 new-moon minute facts (https://www.packolkata.gov.in/phasemoon.php) and
two Adhika/Nija month samples from PAC regional-calendars. No raw publisher file
hash is claimed. See docs/vedic/P11_EVIDENCE.md for source URLs and limitations.
The new phase solver is project code reusing the existing pinned engine; no
external calendar implementation or new ephemeris is copied.

App-owned naming-data.mjs selects factual naming sounds from HTCS Bridgewater's
2026-27 Panchangam page 73, with its Roman regional spelling variant attributed.
No publisher prose, dosha/remedy claims or US timing tables are incorporated.
Two name glosses cite Monier-Williams dictionary scans at the Cologne Digital
Sanskrit Lexicon; scripts/short translations and catalogue selection are project
authored. This is a small attributed editorial seed, not a scraped name list.

## P12 editorial source context

The primary Brihat Jataka Sanskrit text chapter 1 verse 15 is linked as historical
house-vocabulary context at
https://sanskritdocuments.org/doc_z_misc_sociology_astrology/brihajjAtakam.html.
No text, translation, file, prediction or code is copied from this restricted-use
volunteer edition. The four-group mapping, reflection prompts and draft
translations are project authored; the source does not authenticate this new
editorial rule. Numerical factors reuse the existing attributed P04 engine/model.
Independent editorial and language review remains pending. See P12_EVIDENCE.md.
# P15 rulebook context (internal draft)

Factual scoring predicates/tables were consulted from Drik Panchang, Telugu
Calendar's published engine specification and Raman's Muhurtha chapter XI.
Authored rule discussions by Astro Saxena and Sarbani Rath identify additional
Yoga qualifications. URLs, locators and access dates live in rulebooks.mjs;
docs/vedic/P15_EVIDENCE.md records scope and table disagreements. No third-party
PDF, image, prose library, calculator code or service dependency is embedded.
Descriptions and translations are project authored. A small Prokerala sample
comparison records component facts and the Vashya discrepancy explicitly.
Independent traditional/editorial/source and public redistribution review remain
open; this does not grant a licence to reproduce publisher assets or predictions.
## P16 advanced mathematical source context

Factual D7/D10/D12 definitions, numeric contribution bits and small worked
examples cite P.V.R. Narasimha Rao's author-hosted Vedic Astrology: An Integrated
Approach, chapters 6 and 12. Deep-exaltation points and Uccha interpolation cite
Phaladeepika's G.S. Kapoor edition, chapter 1 and chapter 4 commentary. No source
PDF, figure, prose collection or third-party implementation is bundled. Source
URLs/locators and the captured PVR PDF checksum are in P16_EVIDENCE.md; limited
numeric fixtures are under tests/fixtures. Author permission to read a freely
shared book does not license bulk redistribution of publisher material. Source,
traditional and public-release review remain open. Temporary PDF inspection
tools were confined to ignored .publish and removed after capture; they are not
application dependencies.
