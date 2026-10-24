# P01 source and licence inventory

Reviewed 2026-10-24 (Asia/Kolkata). This is a technical source/attribution review,
not a legal opinion or clearance to relicense third-party software. No new
dependency, paid service, provider account or reference dataset was installed.

| Source | Observed terms/provenance | Decision and update policy |
|---|---|---|
| [Astronomy Engine repository](https://github.com/cosinekitty/astronomy), [MIT licence](https://raw.githubusercontent.com/cosinekitty/astronomy/master/LICENSE) | Upstream MIT notice reviewed; existing vendored 2.1.19 bundle retains its own original copyright/licence notice. | First P03 candidate. Retain notices if moved/shared; pin actual bundle hash/version, never identify a mutable master page as the vendored release. Upgrade only with reference and Ritual regressions. |
| [JS API reference](https://raw.githubusercontent.com/cosinekitty/astronomy/master/source/js/README.md) | Describes geocentric/light-time/aberration operations and true ecliptic-of-date transforms. | Method reference only. Confirm actual 2.1.19 implementation in P03; current docs do not prove old-bundle parity. |
| [JPL ephemeris export](https://ssd.jpl.nasa.gov/planets/eph_export.html), [Horizons manual](https://ssd.jpl.nasa.gov/horizons/manual.html), [API](https://ssd-api.jpl.nasa.gov/doc/horizons.html) | Official model/parameter documentation reviewed; no JPL numerical artifact captured in P01. | Offline independent references; retain query, headers, model identity, timestamp and hash. Before bundling data/code, record applicable artifact/tool terms and redistribution attribution. Documentation access is not a blanket software licence. No live birth-data API dependency. |
| [IANA Asia 2025b](https://data.iana.org/time-zones/tzdb-2025b/asia), [licence](https://data.iana.org/time-zones/tzdb-2025b/LICENSE) | Asia source is public domain; distribution licence identifies BSD exceptions for particular C files. | Pin relevant rule data only, with source/hash; no C code imported. P02 can derive a bounded India rule table. Changes require version bump, fixture review and regenerated provenance. |
| [GeoNames gazetteer readme](https://download.geonames.org/export/dump/readme.txt), [export overview](https://www.geonames.org/export/) | Gazetteer readme states CC BY 4.0 and no accuracy/completeness warranty; country extracts and alternate-name fields are documented. | Candidate offline India place source. Attribute GeoNames/link/licence and describe transformations. Pin selected extract date/hash during P02 acquisition; do not claim existing postal medians are precise birthplaces. |
| [IMD Panchang explanation](https://packolkata.imd.gov.in/panchang/en/explanation), [English publication index](https://packolkata.imd.gov.in/rashtriya-panchang-english.php) | Direct explanation and index requests returned 502; main page also timed out. Search results located official publication pages but no complete reference edition was fetched. | Required fixture source remains acquisition-pending. No tables/text copied or redistribution licence assumed. Capture edition/page/methodology and applicable terms before storing publication material. No IMD numerical validation pass. |
| [IMD 2025 release notice](https://internal.imd.gov.in/press_release/20250322_pr_3824.pdf) | Official notice identifies Rashtriya Panchang as a source of calendric/positional data. | Confirms source relevance only; a press notice is not positional reference data or a certified Kundli service. |
| [Astrodienst general documentation](https://www.astro.com/swisseph/swisseph.htm), [programming/licensing documentation](https://www.astro.com/swisseph/swephprg.htm) | Documents Lahiri variants and revised IAE baseline. Programming documentation describes AGPL/professional dual licensing. | Convention reference only. Do not copy/vendor/link Swiss Ephemeris code or data into this project under an assumed permissive licence. Alternative not selected. Any later adoption requires a separate concrete licensing decision. |

## Existing local artifact identities

These are SHA-256 hashes of existing files measured during P01, not hashes of
new downloads or numerical certification:

| Existing artifact | SHA-256 |
|---|---|
| `apps/ritual-assist/frontend/astronomy-engine.mjs` | `6257fd34e7a74370767a98bf26d1724d748e5f71c1530be6730ff21336cc6607` |
| `apps/ritual-assist/data/india-pincodes.json` | `c0ab2a6a312f29379eab62e3f6fd403b98bfd83892bee2dcbb20e1c55319d469` |

The existing postal JSON reports retrieval 2026-10-10 and original source ZIP
SHA-256 `59270782f0ad257353ede27123eff9d2776b2e7390a2505552f3d1756e5ceafa`.
That source hash was read from existing metadata; the source ZIP was not fetched
or independently rehashed in P01. See Ritual Assist `THIRD_PARTY.md` and
`data/README.md` for existing transformation/attribution details.

Local runtime measured: Node 22.17.0, ICU 77.1, tzdb 2025b. This is development
evidence, not an assertion about Workers' runtime timezone data. The versioned
rule-data decision avoids making that runtime difference invisible.

## Alternatives and release blockers

Reuse the existing MIT engine if measured results satisfy the contract. A direct
JPL offline kernel adapter remains an alternative if precision/model/data gates
fail, with storage/CPU/tool licensing to assess in P03. A new paid horoscope API,
Swiss runtime dependency, remote geocoding account or new infrastructure is not
selected. An unverified adapter returns unavailable, never a hidden approximation.

Pending before numerical acceptance: original IMD/IAE reference acquisition,
selected place-extract provenance, independently specified Lahiri/node equations,
time-scale model/version, numerical fixtures and measured residuals. These do not
prevent P01's design/test-plan deliverable; they do prevent claiming validated
calculations or activating the future app.
