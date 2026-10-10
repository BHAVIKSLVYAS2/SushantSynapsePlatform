# Astronomy Engine

The same vendored engine executes on the platform Node server for the simplified calendar. This adds no Drik Panchang API or scraping. Expanded preparation summaries and source-review limits are documented in `docs/RITUAL_CONTENT_REVIEW_2026-10-10.md` at the repository root.

`frontend/astronomy-engine.mjs` is a minified ESM bundle of **Astronomy Engine 2.1.19**, by Don Cross, under the MIT license. The full license and copyright notice are retained at the beginning of the bundle. Official source: https://github.com/cosinekitty/astronomy

Input: the npm `astronomy-engine@2.1.19` package, SHA-512 integrity `8yWKNf7UeNbH458h3sAJ6ZgAjE5jTXp/mNNRFoC20j2SHwZIjAQeEsBB2Q3uCFRaTCCJRv33K2XhkhZQMXoX6w==`. Build with esbuild, ESM format, minification and inline legal comments. No runtime CDN or provider credentials are required. The package is vendored only inside Ritual Assist.

The engine's approximate astronomical accuracy does not constitute priest approval or exact equivalence to a regional Panchang. The app uses a five-minute guard around death-tithi and Aparahna boundaries and flags uncertain sidereal month classification.

## GeoNames India postal locations

The offline server-only PIN directory is derived from GeoNames India postal data, retrieved 10 October 2026, under CC BY 4.0. Attribution, source hash, median-coordinate transformation and uncertainty limits are in [data/README.md](data/README.md). Public attribution appears in the calculator and third-party notices. GeoNames provides approximate postal coordinates without an accuracy warranty.
