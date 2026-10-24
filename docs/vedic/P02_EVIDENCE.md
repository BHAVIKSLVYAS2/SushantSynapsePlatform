# P02 place and civil-time normalization

Date: 2026-10-24 (Asia/Kolkata). PHASE COMPLETE: internal normalization kernel.
No public integration or astronomy in this phase.

## Implemented scope

`packages/vedic/` provides pure ESM place search, ID selection, safe diagnostics,
strict civil conversion and input normalization. No npm dependency, network,
request logging, private response cache, persistence or app route was added.
Workspace package/lock metadata records the new internal package only.

- Frozen offline GeoNames directory: 3,786 India populated-place entries, source
  IDs, state/country disambiguation, aliases including native-script names,
  source coordinates/timezones, provenance and approximate-point warnings.
  Duplicate names require IDs; a state filter does not imply uniqueness.
- Pinned IANA 2025b source-derived +05:30 India civil rule for local dates
  1950-01-01 through 2098-12-31. No host-timezone dependence, arbitrary foreign
  zone resolution, pre-1950 extrapolation or DST guessing.
- Exact minute-resolution instant; approximate closed +/-1–720 minute interval;
  unknown half-open whole local day with null instant/time/resolution. No noon
  substitution or claim of feature stability.
- Strict real dates/times, whole-interval coverage and future-birth enforcement,
  explicit caller clock, locale en/hi/gu metadata, explicit elevation basis and
  safe typed failures. Raw coordinates/country strings cannot bypass place IDs.
- Retained public source extracts, original capture hashes, attribution and a
  deterministic offline dataset build/check utility. No live data touched.

See `packages/vedic/README.md` for the callable contract, examples and intentional
limits; `THIRD_PARTY.md` for source provenance/terms and transformations.

## Source capture and reproducibility

Public sources downloaded into ignored `.publish/vedic-p02-source/`; India
country/admin extracts and source readme retained under package `data/sources`.
Pinned full IANA Asia source/licence also retained. No ordinary test downloads
or refreshes sources. Source URLs and capture metadata:
`packages/vedic/data/sources/capture.json` and `india-time.json`.

GeoNames ZIP SHA-256:
`eae619fcbf5e519f47a6d52340247485811ed3333b8b02b442c752d6b4058b60`.
Retained city extract SHA-256:
`d84e173778177b50fe6d1ab03ddb32e8da8ea63a65b429b4094965df000ba019`.
IANA Asia source SHA-256:
`9a8b7e640cb0692b9e50b9126f599bf89360a2f9ed9e54b722f3e5b6f631b419`.

GeoNames current extracts are mutable upstream; recorded hashes identify this
snapshot. Original worldwide ZIP/text are not needed for offline reproduction
from the retained raw India extracts. The builder verifies source hashes and
exact JSON output bytes with `node infrastructure/prepare-vedic-data.cjs --check`.

## Verification

Focused command: `node --test tests/vedic-normalization.test.js` (14 tests).
Includes five explicit synthetic civil-reference cases, 447 Intl cross-checks
(three days in every supported year), separate host TZ subprocesses, all 3,786
source-backed place records, duplicate-name/state collisions, native aliases,
leap/invalid dates, coverage/future intervals, source byte reproduction and privacy
failure checks. Civil fixtures are author-specified arithmetic checked against a
separate runtime implementation, not independent astronomical golden approval.

First focused run: 14/14 pass, 1.89 seconds. Final focused run: 14/14 pass,
7.70 seconds under concurrent full-suite load, including the unknown-time
resolution correction. Log: `.publish/vedic-p02-focused.log`.

`npm.cmd test`: 380 pass, 15 fail at the Cloudflare setup hook due to EPERM
writing existing generated Satire Arena HTML (186.25 seconds). All 15 affected
checks then pass with workspace build-write permission using the same test file
and isolated SQLite test environment (39.70 seconds):
`node --test tests/cloudflare.test.js`. All 395 checks are covered successfully
across the run/rerun; this is not claimed as a single clean full-suite pass.
Logs: `.publish/vedic-p02-full-tests.log` and
`.publish/vedic-p02-cloudflare-rerun.log`. No remaining assertion failures.

Offline source regeneration/check and workspace-lock entry/version/uniqueness
checks pass. `git diff --check` passes. Existing esbuild successfully compiles
the kernel for browser/ES2022, with normalization and duplicate-name search
parity against source modules when run under Node. Minified bundle 1,457,610
bytes, ignored at `.publish/vedic-p02-kernel.mjs`; not added to public assets.
This is a bundler compatibility check, not actual browser/Workers execution.
No UI changed; browser workflows and a separate deployment build were not run.

Development-only local timing sample under concurrent regression load:
603 ms module import, 351 ms for 100 searches, 274 ms for 1,000 normalizations,
approximately 19 MiB heap. One Node sample, not a benchmark, Workers CPU measure
or public performance guarantee. The roughly 1.93 MB uncompressed directory JSON
is internal, unexposed and not added to the frontend export. Assess partitioning
and actual edge resource use before public integration.

## Limits and next phase

The directory is incomplete; absent villages/custom coordinates stay unsupported.
Settlement coordinates are not a precise birth address. The fixed civil offset
is restricted to the pinned post-war India range; foreign skipped/ambiguous times
are rejected as unsupported, not solved by a generic timezone implementation.
Unknown input for an unfinished current birth day is rejected rather than clipped.
No public search API, review UI, translation prose, angular accuracy, ephemeris,
Lagna, houses, chart or birth-time stability has been released.

P03 is next: evaluate the already-vendored Astronomy Engine candidate using
offline independent JPL/reference capture, freeze time-scale/model/coverage
metadata, measure Node/Workers numerical/resource behaviour and retain typed
unavailable diagnostics. Read P01 reference/tolerance gates first. Do not infer
that P02's civil-time tests validate astronomy, nor expand date/place coverage
without source and regression evidence. Ritual Assist remains unchanged.
