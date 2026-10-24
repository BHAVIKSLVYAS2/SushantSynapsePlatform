# Astronomy Engine

The same vendored engine executes on the platform Node server for the simplified calendar. This adds no Drik Panchang API or scraping. Expanded preparation summaries and source-review limits are documented in `docs/RITUAL_CONTENT_REVIEW_2026-10-10.md` at the repository root.

`frontend/astronomy-engine.mjs` is a compatibility re-export of the shared pinned
**Astronomy Engine 2.1.19**, by Don Cross, under the MIT license, at
`packages/vedic/vendor/astronomy-engine-2.1.19.mjs`. Its full license and copyright
notice remain at the beginning of that bundle. The existing public engine URL
serves the identical original bytes directly from the shared source. Official
source: https://github.com/cosinekitty/astronomy

Input: npm `astronomy-engine@2.1.19`, SHA-512 integrity
`8yWKNf7UeNbH458h3sAJ6ZgAjE5jTXp/mNNRFoC20j2SHwZIjAQeEsBB2Q3uCFRaTCCJRv33K2XhkhZQMXoX6w==`.
Built with esbuild, ESM format, minification and inline legal comments; bundle
SHA-256 `6257fd34e7a74370767a98bf26d1724d748e5f71c1530be6730ff21336cc6607`.
No runtime CDN, new dependency or provider credentials. The implementation is
shared; Ritual's existing calendar/time/correction policies remain unchanged.

The engine's approximate astronomical accuracy does not constitute priest approval or exact equivalence to a regional Panchang. The app uses a five-minute guard around death-tithi and Aparahna boundaries and flags uncertain sidereal month classification.

## GeoNames India postal locations

The offline server-only PIN directory is derived from GeoNames India postal data, retrieved 10 October 2026, under CC BY 4.0. Attribution, source hash, median-coordinate transformation and uncertainty limits are in [data/README.md](data/README.md). Public attribution appears in the calculator and third-party notices. GeoNames provides approximate postal coordinates without an accuracy warranty.
