# Performance investigation — 18 October 2026

Baseline source: `1e6fb25`; production implementation: `cb33370`.
Initially investigated and verified locally; the user subsequently authorised
commit and deployment on 18 October 2026. Publication and live measurements are
recorded below. Existing tenant routing, data, authentication, UI design and
advertising eligibility remain intact.

## Findings recorded before implementation

The platform uses app-owned plain HTML/JavaScript and shared CSS, served by
Cloudflare Workers/static assets with D1 for production APIs. Tailwind builds the
shared presentation bundle; individual apps already have separate entry points.
There is no framework hydration or monolithic SPA bundle to split. The build uses
Tailwind 4.3.3; this investigation ran on Node 22.17.0. The supplied GTmetrix 45%
and scoring contributions were not converted into timings or compared directly
with a Lighthouse score.

Production Lighthouse 12.8.2, standard mobile simulation, normal third-party
resources enabled: performance 4/100, FCP 4.05 s, LCP 9.95 s, TBT 11.23 s,
CLS 0.752 and Speed Index 15.39 s. This is one lab observation, not the supplied
GTmetrix score or a field Core Web Vitals result. Root document timing was 4.24 s;
this alone does not prove a persistent Worker/backend bottleneck.

Verified causes, in priority order:

1. **Language observer feedback loop.** `refresh()` replaces the help element's
   text even when unchanged, which triggers its own body MutationObserver and
   schedules another animation-frame traversal. A fresh-context browser sweep
   measured 20–21 idle mutations in 500 ms on affected routes. Lighthouse attributed
   1.58 s CPU time to the language script and 16.26 s to style/layout overall.
2. **Late homepage structure.** Entry paths, search, featured apps and dock are
   inserted after initial rendering. The homepage's measured CLS was 0.752 in
   production Lighthouse and 0.760 in the local browser sweep. The LCP node was
   featured-card copy, not an image; blindly preloading a hero image is inappropriate.
3. **Duplicate blocking CSS.** Every sampled app requests the 52,379-byte premium
   bundle twice: the direct HTML URL and the header's older `@import` URL. Actual
   source inspection confirms pages using the header also link the bundle directly.
4. **Oversized lossless artwork.** The homepage downloads the 2,285,413-byte
   `cartoon-cast.png` despite its lazy flag; browser lazy-load proximity thresholds
   include it. The Arena also loads the 2,603,487-byte original expression sheet.
5. **Eager game modules.** The Take a Break catalogue fetches the Chaos controller
   and Daily Spark renderer/controller before a game is opened.
6. **Third-party startup.** Production mobile Lighthouse attributed 1.19 s blocking
   time and 254,847 transferred bytes to Google advertising. Do not silently
   disable advertising or score an ad-blocked run as representative production.
7. **Shared shell installation.** Deferred shell insertion/hiding of local headers
   moves content after first paint. Several app routes have high startup CLS.

The 28-route local sweep covers public tools, games, legal/support pages and
signed-out private entry points. Its ads/tracking and writes are blocked equally
for functional safety; these timings are not equivalent to normal production
Lighthouse. Authenticated behaviour requires separate isolated fixture tests.
Raw baseline evidence: `.publish/performance-before.json`,
`.publish/lighthouse-production-mobile.report.json`, and
`.publish/lighthouse-local-before-{mobile,desktop}.report.json`.

## Implemented locally

| Area | Change | Main files |
| --- | --- | --- |
| Homepage | Render existing entry paths, search and featured apps in initial HTML; reuse those nodes instead of moving/rebuilding them at mount. Keep fallback rendering, finder, filters, workspaces and no-JavaScript discovery. Use one SVG sprite URL. | `apps/portal/frontend/index.html`, `platform.js`, `home-discovery.js`, `home.css` |
| Homepage CSS | Bundle existing styles in their original cascade order, using the already-installed esbuild tool. Nine initial CSS requests become one. Source styling, tokens and responsive rules remain authoritative. | `infrastructure/build-home.cjs`, `infrastructure/cloudflare/build.cjs`, `package.json`, generated `apps/portal/frontend/home.bundle.css` |
| Shared language | Stop the help-text observer feedback loop; avoid redundant language attributes and use inherited language where equivalent. Mixed Hindi/English and native selectors remain functional. | `packages/ui/language.js` |
| Shared header | Remove the duplicate premium CSS import. Reserve the existing shell geometry before deferred installation. Static annotations in 32 HTML entry points use scripting-aware CSS; no-JavaScript and print retain their existing header behaviour. | `packages/ui/platform-header.css`, `platform-shell.css`, app HTML entry points |
| Advertising | Start the same anonymous-home async script after a paint opportunity and bounded idle wait (1 second maximum idle wait). Preserve publisher, nonce, CSP, cookie eligibility and absence from tool/private pages. No user-agent or audit detection. | `packages/ui/adsense.cjs` |
| News | Render the public masthead/cover immediately; retain disabled data-dependent controls, loading/error/retry and temporary/shared-edition behaviour. Put the existing reading control in initial markup. | `apps/news/frontend/index.html`, `app.js` |
| Take a Break | Load Chaos and Daily Spark controllers only on selection. A revision guard prevents an older pending launch replacing a newer choice; failures keep the catalogue usable. | `apps/take-a-break/frontend/app.js` |
| Other app layouts | Put Arena sections in their existing final positions before enhancement; reserve loading space for empty Daily Spark and Ritual Assist panels without keeping extra spacing after load. | `apps/satire-arena/frontend/index.html`, `enhancements.js`; `apps/daily-spark/frontend/style.css`; `apps/ritual-assist/frontend/style.css` |
| Artwork | Add full-size, pixel-identical lossless WebP copies for Arena portraits/expression sheets and a 768px losslessly encoded homepage derivative. Keep originals and use the same expression URL for CSS and preloading. | Arena `style.css`, `feedback.mjs`, three new `.webp` assets; `server/static-assets.js` |

No application/runtime dependency was added. Lighthouse and Pillow were used as
isolated audit/conversion tools under ignored temporary artifacts. No business
logic, schema, role enforcement or private-data persistence was changed.

## Lighthouse before and after

The comparison below uses Lighthouse **12.8.2 / Chrome 155**, default mobile and
desktop simulation, fresh browser storage, and **normal third-party resources
enabled**. Mobile uses Lighthouse's 150 ms RTT, 1,638.4 Kbps throughput and 4× CPU
settings. Both revisions use the same local URL, gzip static delivery, production
HTML preparation (including the availability helper), and an isolated Node API
fixture. Baseline static source comes from `1e6fb25`; the final source comes from
this working tree. Baseline advertising uses the original loader. This avoids
comparing uncompressed development delivery with compressed production delivery.

These are single lab observations, not medians, GTmetrix results, a real-user
Core Web Vitals assessment or a claim of production improvement. Third-party
responses vary. These were pre-deployment measurements; see the production
follow-up below for the subsequently authorised publication.

| Metric | Mobile before | Mobile after | Desktop before | Desktop after |
| --- | ---: | ---: | ---: | ---: |
| Performance | 15 | 50 | 57 | 100 |
| FCP | 2.98 s | 3.21 s | 0.96 s | 0.33 s |
| LCP | 8.17 s | 6.40 s | 3.56 s | 0.52 s |
| TBT | 2,383 ms | 728 ms | 124 ms | 47 ms |
| CLS | 0.774 | 0.0013 | 0.383 | 0.0028 |
| Speed Index | 5.00 s | 5.38 s | 1.68 s | 0.98 s |

Desktop met all requested targets in this run. **Mobile did not:** its blocking
time and LCP improved, but FCP and Speed Index did not improve in the final paired
observations. Do not describe this as achieving 90+ mobile performance. Earlier
compressed post-change runs ranged from 1.34–3.21 s mobile FCP and 50–54 performance; those
intermediate reports remain available rather than being substituted for final
results. Ads remain a material mobile CPU/network cost; no provider or commercial
configuration was silently removed.

The initial uncompressed-development comparison is also retained: mobile score
27 → 48, TBT 8,158 → 703 ms; desktop score 52 → 82. Those after files represent an
intermediate implementation, not the final compressed comparison above.

Raw final comparisons:
`.publish/lighthouse-compressed-{before,after}-{mobile,desktop}.report.{json,html}`.
Reproduction harness: `.publish/performance-compressed-benchmark.cjs`. It keeps
both revisions' snapshots and identical compression settings; no benchmark-only
resource exclusions are applied. The earlier live production baseline remains
`.publish/lighthouse-production-{mobile,desktop}.report.{json,html}`.

## Payload and loading comparison

These are decoded resource bytes and requests from fresh-context Chrome sweeps,
excluding the HTML document. Ads/visitor tracking and API writes were blocked
equally in these **functional sweeps only**, not in Lighthouse.

| Page | Resources before → after | Decoded bytes before → after |
| --- | ---: | ---: |
| Home | 26 → 17 | 2,721,985 → 610,759 (78% smaller) |
| Take a Break catalogue | 25 → 20 | 363,480 → 294,796 (19% smaller) |
| News | 27 → 25 | 483,063 → 382,187 (21% smaller) |
| Satire Arena | 26 → 25 | 5,254,935 → 3,702,981 (30% smaller) |

The homepage previously fetched 215,158 bytes across nine CSS responses, including
the duplicate premium bundle. Its compiled stylesheet is 161,971 bytes in one
response. It includes the same rules, not a new visual theme. Raw concatenation of
the current eight source stylesheets is 164,837 bytes; minification alone saves
only 2,866 bytes. Most benefit comes from removing the duplicate and the request
chain, not a claim of extensive unused-CSS elimination.

| Artwork | Original PNG | Optimized WebP |
| --- | ---: | ---: |
| Homepage cast (2172px → 768px) | 2,285,413 | 235,820 |
| Full-size cast, pixel-identical | 2,285,413 | 1,533,768 |
| Full-size expression sheet, pixel-identical | 2,603,487 | 1,852,964 |

The 768px image preserves the artwork at the homepage's small rendered dimensions;
the full-size originals remain available. Full-size lossless derivatives were
decoded and compared byte-for-byte as RGBA pixels.

The shared language helper's monitored idle mutations fell from 20–21 per 500 ms
to zero. Separate startup-layout observations show:

| Page | CLS before → after |
| --- | ---: |
| Home | 0.760 → 0.0018 |
| News | 0.692 → 0.0020 |
| Take a Break | 0.030 → 0 |
| Satire Arena | 0.774 → 0.031 |
| Daily Spark | 0.612 → 0 |
| Ritual Assist | 0.653 → 0.0063 |

These layout observations use the browser sweep, not the Lighthouse table's
simulated network conditions. Do not combine them into one benchmark.

## Delivery findings

Read-only production checks confirm gzip compression, CDN HIT responses for
sampled static assets, ETags and `Cache-Control: no-cache`; HTML and health/API
responses remain `no-store`. No cache lifetime was extended and no private API
cache was introduced. Content-hashed immutable assets remain a future increment;
dated query strings alone are not a reason to apply long browser cache lifetimes.

A fresh connection took 2.70 s for the homepage; three immediate repeat requests
took 168/181/162 ms. Another probe measured 106–129 ms asset response times.
This supports investigating cold connection/edge path timing, not claiming a
persistent slow database or changing hosting providers. Static allowlist export
contains 807 assets. No hosting plan, binding, migration or provider changed.

## Regression verification

- **339/339 full Node/API checks pass**, including tenant/D1, authentication,
  recovery, validation and data isolation. Final log:
  `.publish/performance-full-final.log`. Initial sandbox runs could not replace a
  generated build directory; the final run with the required access passed.
- Final production frontend build passes and exports **807** allowlisted assets.
- **29 distinct browser workflows pass** across the two final runs (32 successful
  executions, including three repeated performance checks). Includes all 12 Take
  a Break workflows; four new loading/failure regressions; News retry/loading;
  Arena expression/ballot/layout checks; bilingual Ritual guides, downloads and
  print; homepage search/filter/no-JavaScript; AdSense nonce/eligibility; shared
  materials across 31 public routes and signed-in governance/client fixtures.
- Theme/layout checks cover narrow phones, tablet and desktop (including
  320/390/768/1440px); the Take a Break matrix also covers 360/430/1280px. These
  are Chrome viewport checks, not native-device Safari measurements.
- A separate 28-route cold-load sweep had no page JavaScript errors. Expected
  empty-edition 404 and unavailable local Arena-score 503 states remain honest;
  they were not hidden to improve the report. Final targeted sweeps also have
  no page errors or monitored idle-language mutations.
- Visual review preserves existing glossy materials, icons, spacing and themes.
  Before/after full-page dimensions match for Home, Take a Break and News; News
  screenshot pixels match exactly. Homepage raster resampling and transient
  rendering states are not represented as a global pixel-identical claim.
- Syntax and `git diff --check` pass. During this local implementation stage, no
  production deployment, account changes, migration or Chambers/business-data
  writes were performed. Subsequent publication is recorded below.

Browser evidence: `.publish/performance-final-browser`,
`.publish/performance-games-final`; sweeps:
`.publish/performance-{before,after,final}.json`,
`.publish/performance-ritual-final.json`; delivery:
`.publish/performance-delivery.json`. Screenshots:
`.publish/performance-{before,final}-{home,take-a-break,news}.png`.

## Remaining work

1. Mobile does not meet the requested performance targets. Repeat normal-ad
   measurements on a stable physical mobile/network profile, then evaluate
   provider loading/commercial tradeoffs and remaining first-party style/layout
   work. Do not postpone resources beyond the audit window to manufacture a score.
2. Continue app-specific startup-layout work on Pocket Pause, Timetable Lite,
   Moment Studio and the separate remembrance calendar. The shared-header fix
   helps, but the broader sweep still shows delayed app-content shifts there.
3. Profile the astronomy/calendar module and other large optional app data before
   adding further code splitting. Keep calculations and source/data integrity
   separate from delivery changes.
4. Add dependency-aware content hashes before immutable caching. Existing
   revalidation remains intentional. Public/private API cache boundaries must
   remain unchanged.
5. Publication and normal production mobile/desktop follow-up audits are now
   complete. Continue repeating production checks after future changes, retaining
   the current tenant-aware Worker configuration.

## Production publication and follow-up

User-authorised performance commit `536b143` and loading-meter correction
`e883c29` are live at https://apps.sushantsynapse.com. Final Worker version:
`3e2f2830-a42d-4a0e-adc9-cc7672c5eda3`. The first performance publish used Worker
`a4b33c90-bf77-465b-9541-5e7fb1173ef0`; verification found the transient issue
described below and the final publish includes its fix. The existing production
configuration and `--keep-vars` preserve organisation mode, D1 and rate limits.
No migration, bootstrap, account or Chambers/business-data mutation ran.

Live checks confirm ten exact asset matches, healthy storage, initial homepage
markup, working search, zero monitored language-helper mutations, 48 responsive
light/dark layouts across six routes, Daily Spark and Lights Out launch. Account
entry still redirects to `/account`; unscoped `/api/state` returns 409 and internal
`/_pages/home.html` returns 404. The functional browser blocked ads, tracking and
API writes and observed no page errors or attempted writes. Live screenshot
review confirms the existing design.

The initial live narrow-screen check exposed a loading-only Arena issue: three
scoreboard segments defaulted to 50% each before the app module assigned real
values. At 320px they could extend the document to 422px. Initial widths now start
at zero; real totals and the final visual presentation are unchanged. A held-module
browser regression plus cinematic-layout and optimistic-ballot tests all pass
(**3/3**). The complete live layout matrix then passed without waiting away this
loading state. This adds one distinct regression workflow to the earlier 29.

Normal-ad production Lighthouse follow-up, same tool/default form-factor settings
as the initial live baseline:

| Metric | Mobile live before | Mobile live after | Desktop live before | Desktop live after |
| --- | ---: | ---: | ---: | ---: |
| Performance | 4 | 64 | 43 | 69 |
| FCP | 4.05 s | 2.94 s | 1.65 s | 2.32 s |
| LCP | 9.95 s | 3.68 s | 2.65 s | 2.56 s |
| TBT | 11,229 ms | 813 ms | 144 ms | 56 ms |
| CLS | 0.752 | 0 | 1.250 | 0.0028 |
| Speed Index | 15.39 s | 4.04 s | 4.80 s | 4.19 s |

These are single live lab observations, not field measurements or an equivalent
environment to the local compressed fixture. The local desktop score of 100 did
not reproduce on the live delivery path. **The live 90+ targets remain unmet on
both form factors**, and desktop FCP did not improve in these observations.
Normal third-party resources remain enabled in both live Lighthouse runs.

Evidence: `.publish/performance-release-live.cjs`,
`.publish/performance-release-live.json`, `.publish/performance-release-home.png`,
`.publish/performance-release-break.png`, `.publish/performance-meter-tests`,
`.publish/lighthouse-production-after-{mobile,desktop}.report.{json,html}` and
`.publish/performance-release-lighthouse.cjs`.
