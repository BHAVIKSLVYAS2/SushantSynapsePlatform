# Frontend performance audit — 28 October 2026

Status: targeted implementation, full test/build verification and before/after
measurement complete. User authorized commit and deployment on 28 October 2026.
Release output: `.publish/deploy-performance-release.log`; production deployment
uses --keep-vars to preserve existing configuration and bindings.

## Architecture and measurement

This is a multi-app vanilla HTML/CSS/JavaScript platform, not a React application.
App modules live under apps/, shared navigation/language/theme code under packages/.
Node serves an explicit static allowlist. Cloudflare production exports that
allowlist, minifies assets and assigns immutable content hashes. esbuild produces
the Vedic browser bundles and language runtime; Tailwind supplies shared design
tokens and components. Home already has a stylesheet bundle, pre-rendered app cards
and a lazy astronomy import. The game hub already defers game controllers.
Those existing optimizations were preserved.

`node infrastructure/frontend-performance-audit.cjs before` / `after` uses a
disposable SQLite fixture and installed Chrome, 390×844, cold cache, 4× CPU slowdown,
100 ms network latency and 200,000 bytes/sec download throughput. Three fresh
contexts per route; ads are blocked consistently. LCP/CLS observers, CDP CPU
metrics, stylesheet coverage, resources and synthetic search/refresh workloads are
recorded under `.publish/frontend-performance/`. The raw JSON's `cls` field is
the sum of unexpected layout-shift values during capture, not the official
session-window maximum; it is labelled **shift total** in the results below.

These are local lab measurements, not production Core Web Vitals. The Node server
does not compress these fixture responses; production compression, caching, edge
latency, real devices and ads can materially change results. The synthetic search
workload is main-thread execution time, not INP. No field-INP or field-percentile
claim is made. CSS coverage of one state is not proof that a rule is unused.

## Findings ranked before implementation

| Priority | Observed issue | Impact / risk | Action |
| --- | --- | --- | --- |
| 1 | Language bundle 268,712 bytes, gzip 52,419, on every sampled route; multilingual source escaped as ASCII | Broad transfer/parse reduction; low risk | Emit UTF-8 in language/Vedic builds and production delivery transforms |
| 2 | Matching initial JS 1,743,671 bytes; offline directory normalization built at module evaluation even without a name search | High on astrology routes; low risk for equivalent output and deferred indexing | UTF-8 bundles and a once-only lazy search index; retain complete offline data and synchronous search API |
| 3 | 30 alternating home searches produced 1,381 synchronous mutations in the first sample; repeated no-op attribute/text writes also triggered translation work | Responsiveness and allocations; low risk | Cache search text per app, use ID lookup and write DOM state only when changed |
| 4 | Five same-state pageshow events produced 60 synchronous almanac child/text mutations | Avoidable rebuilds of timing tables; low risk with date/interval/language/city tests | Skip unchanged render keys; avoid repeated calendar text writes and same-minute forced recalculation |
| 5 | Ritvayam used 15 blocking stylesheet requests, 133,891 bytes; many rules explicitly scoped to other apps | Critical path and CSS size; moderate cascade risk | One stylesheet in exact link order, remove only explicitly different app scopes using the existing proven filter |
| 6 | Home search toolbar moved from two source rows to its settled one-row layout during mount; baseline median shift total 0.0565 | Initial visual stability; moderate risk | Pre-render the existing settled toolbar and hydrate it; keep the old-markup fallback and no-JavaScript catalogue |
| 7 | Score-only changes could still cause one translation walk; replacing the catalogue accumulated outside-click listeners | Avoidable work/lifetime retention; low risk | Ignore mutations already inside protected content/score totals; abort prior discovery listener on remount |
| Remaining | Ritual Assist loads a 461,960-byte icon atlas and 184,184-byte calendar hero; baseline Newsroom shift total 0.3371 | Significant but higher design/loading-state risk | Retain existing artwork/loading behaviour; document follow-up rather than change pixels or hide functionality |

## Files and implementation boundaries

| Files | Purpose |
| --- | --- |
| infrastructure/build-language.cjs, infrastructure/cloudflare/build-delivery.cjs | UTF-8 output, including the final production transform so it does not reintroduce escapes |
| apps/rashifal-kundli/build.cjs, public-assets.cjs | UTF-8 entry/worker bundles; one public application stylesheet; exact stylesheet order and cache invalidation include CSS inputs and scope-filter source |
| packages/vedic/places.mjs | Delay normalized search-index allocation until searchPlaces/resolvePlaceName needs it; validation, ranking, ambiguity and frozen returned records unchanged |
| infrastructure/build-catalogue.cjs, apps/portal/frontend/index.html | Idempotent pre-rendering of the current toolbar; generated static cards remain shared with signed-in rendering |
| apps/portal/frontend/home-discovery.js | Hydrate instead of relocate; skip unchanged writes; cached search vocabulary; abort previous document click listener |
| apps/portal/frontend/home-vedic.js, apps/rashifal-kundli/frontend/daily-almanac-view.mjs | Same-state render/calculate guards, retaining city, language, visibility and date/Choghadiya boundary updates |
| packages/ui/language-runtime.js, language.js | Avoid translation scans within existing protected content and score-only totals; rebuild generated language output |
| apps/portal/frontend/home.css, home.bundle.css | Preserve no-JavaScript hiding after pre-rendering the toolbar; existing layout/colors/typography retained |
| apps/portal/tests/performance/browser.spec.js, daily-almanac/browser.spec.js | Test unchanged DOM, full original CSS parity and current two-row mobile timing design |
| infrastructure/frontend-performance-audit.cjs | Reproducible, read-only local measurement harness |

No dependency added, framework rewrite, API/schema/storage change, numerical
astrology change, consent relaxation, image replacement, font replacement or
production data modification. Native search remains immediate; no debounce was
introduced for this small app catalogue. Lazy indexing moves its cost to the first
actual place-name lookup; it does not eliminate that work. Existing one-second
boundary checking remains; fewer timer wakeups are not claimed.

## Verification and results

- Full suite: 554/554 passed (`.publish/performance-full-tests-final.log`). The
  initial sandboxed run failed build hooks because generated asset writes were
  denied; the authorized rerun passed without weakening permissions in code.
- Production frontend build passed (`.publish/performance-production-build.log`).
- JavaScript syntax and whitespace checks passed. No lint or TypeScript script
  exists in package.json; none is claimed.
- Signed-in favourites/recent/sign-out, access restrictions, no-JavaScript
  catalogue, mobile categories/touch scrolling, multilingual matching and
  bilingual Ritual Assist checklists/downloads/printing passed.
- Daily almanac city retention, language changes, current-period transition,
  midnight rollover and explicit no-event state passed.
- Same-state DOM regression: repeated identical searches and unchanged almanac
  refreshes produced zero synchronous mutations.

Final performance browser suite: **8/8 passed**
(`.publish/performance-browser-final.log`). Complete computed-style/geometry
parity passed for all four Vedic routes at 320/768/1440px in light/dark (24
combinations), plus home at 320/390/768/1440px in light/dark (8 combinations).
Only test contexts bypass CSP to inject reference CSS; production privacy and
CSP tests remain active and passed. Old mobile-row assertions were updated to
the already-approved 2×2 timing layout. Test stylesheet toggling uses the loaded
CSSStyleSheet directly, avoiding refetches that previously invalidated comparisons.

| Asset/workload | Before | After | Change |
| --- | ---: | ---: | --- |
| Shared language JS, raw | 268,712 B | 157,491 B | 41.4% smaller |
| Shared language JS, gzip | 52,419 B | 44,375 B | 15.3% smaller |
| Matching JS, raw | 1,743,671 B | 1,458,877 B | 16.3% smaller |
| Vedic CSS, raw total | 133,891 B | 106,858 B | 20.2% smaller |
| Vedic CSS, sum of individually gzipped original files vs bundle | 29,881 B | 19,062 B | 36.2% smaller |
| Vedic blocking stylesheet requests | 15 | 1 | Original cascade preserved |
| Home CSS, raw | 160,667 B | 160,785 B | +118 B to preserve no-JavaScript behaviour |
| 30 alternating home inputs, synchronous mutations | 1,381 | 153 | 88.9% fewer |
| Same workload, median execution time | 68.9 ms | 38.7 ms | 43.8% lower in this synthetic workload |
| Five unchanged almanac refreshes, synchronous mutations | 60 | 0 | No redundant table rebuilds |

Observed cold-cache lab medians, **three samples per route**, not production SLAs:

| Route | LCP before → after | Shift total before → after | JS execution before → after |
| --- | --- | --- | --- |
| Home | 3.064 → 2.252 s | 0.0565 → 0 | 297.5 → 334.1 ms |
| Ritual Assist, day 11 | 8.072 → 4.160 s | 0.0399 → 0.0399 | 275.2 → 366.2 ms |
| Kundali matching | 13.084 → 10.484 s | 0.0014 → 0.0014 | 619.0 → 503.7 ms |
| Take a Break | 2.160 → 2.152 s | 0.0014 → 0.0014 | 413.5 → 404.2 ms |
| Newsroom | 2.168 → 2.064 s | 0.3371 → 0.3266 | 247.2 → 257.0 ms |

Timing variability matters: Ritual Assist's original LCP samples ranged
4.108–8.272 s; the after samples ranged 3.984–4.188 s. Its observed median change
must not be presented as a guaranteed 48% production improvement. Home's ranges
were 2.832–4.364 s before and 2.236–3.680 s after. Matching's were 12.548–13.584 s
before and 10.260–10.632 s after. Sample size is too small for field-percentile
or statistical significance claims. Whole-page JS CPU and long-task totals did
not improve uniformly; no global CPU/INP win is claimed. The DOM-work and asset
byte reductions are directly reproducible; LCP results are conditional on this lab.

Raw evidence: `.publish/frontend-performance/before.json`, `after.json`,
`.publish/frontend-performance-before.log`, `.publish/frontend-performance-after.log`.

## Remaining limits

The local Newsroom shift total remains a priority to investigate through loading
state source attribution; this pass does not redesign its loading state. The
Ritual Assist atlas/hero should be evaluated for lossless per-guide assets or
responsive delivery with pixel comparison. Astronomy/offline place data remain
large because computations work without sending birth details to a server.
Broad state-dependent/shared CSS is retained unless exclusion is provable.
Real-user INP and production mobile LCP/CLS need field measurement with normal
cache/CDN/ads behaviour before making service-level claims.
