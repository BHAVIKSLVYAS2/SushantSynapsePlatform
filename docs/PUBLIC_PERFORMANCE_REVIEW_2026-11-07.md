# Public performance review — 7 November 2026

Historical review snapshot, retained with the 14 November source-cleanup commit.
Its findings/measurements are dated; this commit does not implement or claim
resolution of the separate security/performance recommendations below.

Discussion only: no application implementation, build, commit or deployment.
Eight production public entry pages, no sign-in or business-data access. Prior
uncommitted Picksy/security-review work is preserved and not part of measurements.

## Method and current measurements

24 live Chrome runs: three fresh contexts per route, 390×844, 4× CPU slowdown,
100ms emulated latency, 200,000 bytes/sec download, cache disabled, advertising
script intercepted, beta notice acknowledged in the disposable contexts. Results
are lab medians, not field percentiles or official Core Web Vitals certification.
LCP means time until the largest visible content is painted during this capture.
No click, scroll, calculation or gameplay benchmark is implied by entry-page LCP.
News network/content state can vary between runs.

| Public entry | Median LCP | Stylesheet links |
| --- | ---: | ---: |
| Home | 2.56s | 6 |
| Take a Break | 2.06s | 12 |
| Picksy | 1.76s | 11 |
| Bill Splitter | 1.27s | 9 |
| Ritual Assist | 1.70s | 12 |
| Matching | 4.18s | 3 |
| News | 1.54s | 12 |
| Moment Studio | 1.49s | 10 |

No page exceptions recorded in these 24 runs. Timing is variable: Home samples
were 3.516/2.560/2.288s; Ritual 1.700/1.536/3.276s. These samples do not establish
that every user sees the median or that all screens of an app perform similarly.

## Ranked opportunities and honest gain bounds

1. **Stable first render across public tools.** A separate four-route source trace
   confirms large initial movements: Ritual calendar root moves from y=72 to y=252
   (180px), Picksy wheel moves down 114px then another 64px as controls mount,
   Bill Splitter initially visible hints/footer leave the viewport as the form
   initializes, and Moment Studio's initially visible panel leaves the viewport
   during initialization. Pre-render final navigation/control/form geometry and
   reserve dynamic content space. This targets visible jumping, not smaller
   downloads. Diagnostic unexpected-shift sums in the main run were Ritual 0.910,
   Bill 0.311, Picksy 0.251, Moment 0.235. These are sums over capture, **not the
   official session-window CLS metric**. No achieved reduction is claimed.

2. **Smaller shared header logo/favicon variants.** Live 192px PNG is 50,586 bytes,
   even where the header displays 32px. A proposed <=10KB combined asset budget
   would save about 40.6KB per unique logo asset on a cold visit. That is a target,
   not a tested image conversion; artwork quality/transparency must be reviewed.
   The cache-disabled traces fetch the same logo again for the favicon. Do not
   multiply the proposed saving by two or claim duplicate network downloads happen
   identically with normal caching. Preserve existing app-icon/PWA requirements.

3. **Load only the interface translation data needed for the current public app.**
   Shared language.js is 153,935 decoded bytes and approximately 45.4–45.6KB
   compressed, versus Take a Break's own controller at 9.1KB compressed. Keep a
   small immediate language/preference controller and load per-app dictionaries
   or the selected translation on demand. An exploratory <=15KB initial budget
   would save about 30KB from that request. This is a design target, not measured
   after output. Retain saved Hindi/Gujarati preferences and avoid translated-text
   flashes, missing dynamic strings, or delaying language accessibility.

   Logo + language targets therefore total **about 70KB per cold visit** on the
   sampled simple pages. At the test throughput this equals about 0.35s of payload
   transfer; it is **not a promised 0.35s LCP reduction**. Requests overlap and the
   critical path, decoding and rendering determine actual user benefit.

4. **Separate Matching's input screen from heavyweight dependencies.** Its largest
   initial chunk is 296,892 compressed / 726,990 decoded bytes, fetched before a
   comparison is requested. Source eagerly imports birthplace search plus birth
   matching/normalization; the compact local directory alone is 568,906 source
   bytes / 224,046 gzip bytes when compressed independently. Explore splitting
   optional directory/compute dependencies and loading them when needed, while
   preserving consent, on-device birth processing and offline place behaviour.
   The 297KB chunk is a measured investigation ceiling, **not an achievable saving
   established by this review**. Independently compressed source bytes cannot be
   subtracted directly from the live chunk. Calculation cost moves to interaction
   unless code/data can be avoided altogether. No algorithm change recommended.

5. **Simplify public CSS delivery after the above.** Several tools have 9–12
   stylesheet links. First-paint CSS coverage leaves 55–78% of loaded CSS unexecuted
   in sampled states, but other themes, languages, games, results, print and mobile
   states still need rules. Consolidate stable shared layers and prune only
   positively proven app-inapplicable/dead rules. Do not blanket-delete based on
   this coverage. HTTP multiplexing means fewer requests alone is not a guaranteed
   time saving; no byte/time reduction was established here.

Low priority: the old large shared icon-atlas observation is stale. Current source
atlas is 12,975 bytes / 3,262 gzip; splitting one symbol saves only about 2.6KB in a
standalone compression estimate with all definitions retained.

## Recommendation

Start with stable initial public layouts and the small shared logo, then split
translation data. Treat Matching as a separate, higher-complexity loading pass.
Measure the same routes before/after any approved implementation and verify all
three themes, languages and affected interactions. No achieved gain is claimed
because this review intentionally makes no runtime changes.

Evidence: `.publish/public-performance-review.json`,
`.publish/public-performance-review.log`, `.publish/public-shift-review.json`.
Reference: https://web.dev/articles/optimize-lcp and https://web.dev/articles/lcp
(the 2.5s good-LCP threshold applies to field evaluation, not certification from
these few lab samples).
