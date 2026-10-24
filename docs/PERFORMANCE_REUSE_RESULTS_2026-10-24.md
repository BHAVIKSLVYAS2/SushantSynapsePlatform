# Performance and reuse implementation — 24 October 2026

Implemented the concrete changes in [the review plan](PERFORMANCE_REUSE_PLAN_2026-10-24.md). Production deployment and live measurements are recorded below when verified. No schema migration, account remapping or production data reset is involved.

## Measured gains

| Measurement | Before | After | Interpretation |
| --- | ---: | ---: | --- |
| Comparable local Worker bundle | 19,257,390 bytes | 3,482,004 bytes | 81.9% smaller; identical esbuild settings, not browser transfer |
| Wrangler upload, raw | 18,826.34 KiB | 3,421.09 KiB | Production deploy output; 81.8% smaller |
| Wrangler upload, gzip | 2,757.20 KiB | 567.13 KiB | Production deploy output; 79.4% smaller |
| Chambers summary calculation | 0.490 ms | 0.137 ms | 72.1% less time in a synthetic local benchmark; not API latency |
| Arena guest polling queries per cycle | 7 | 3 | Scores and two-day results share one request |
| Arena steady polling requests per minute | 4 | 2 | Existing full results endpoint remains available |
| Duplicated footer source | 28 copies | 1 helper | Net source reduction of 24,255 bytes |
| Idle language TreeWalker scans / 30 seconds | 128 | 0 | Same read-only live browser instrumentation |
| Countdown DOM mutations / 30 seconds | 62 | 2 | Minute-boundary writes; count depends on sampled boundary |

The calculation benchmark used 250 rows, 1,000 iterations per sample, seven samples after warm-up, and asserted matching results. Before/after browser transfer observations are individual runs and should not be interpreted as controlled latency benchmarks.

## Implementation and ownership

- Fund Lens no longer imports the 15.6 MB reference JSON into the executable Worker. The build publishes immutable hashed public partitions: a compact base, lazy offline search and coverage indexes, and bounded coverage row chunks. Binding-specific promise caches deduplicate reads and discard failures. Complete coverage/provenance fields remain available.
- The early theme script owns one shared mutation subscription hub. Language and shell consumers inspect only relevant changes. Arena countdowns update at minute boundaries and pause while hidden; score changes do not trigger full language scans.
- Arena reads use grouped SQL, lightweight cast metadata, and a combined scoped score/today/yesterday response. Public dispatch avoids unrelated session/repository setup while retaining origin, maintenance, rate and ballot safeguards.
- `/shared/http.mjs` owns JSON/error/timeout/abort behavior, with optional scoped in-flight GET deduplication. Arena, editorial, Support, Feedback and organisation administration use it. App-specific state, permissions and error presentation remain with each app.
- Existing shared download and HTML escaping helpers replace repeated implementations. A canonical server-composed legal footer supplies real HTML before JavaScript starts.
- Chambers read summaries use linear Maps, preserving the existing payment-rounding conventions. Chambers and Tournament share fresh organisation-scope reads; role decisions remain in their respective services.
- Delivery builds minify module-local identifiers while preserving public exports and classic-script globals.

Full-state API replacement, pagination and normalized Feedback/Confessions persistence were conditional proposals. They are deferred until volume/query evidence justifies their compatibility and migration cost. No storage format was changed in this release.

## Verification

- 379 API/unit/contract tests passed in the complete suite.
- 49 Arena/portal browser workflows passed, including 31 profiles across widths/themes, reactions, sounds, shares and failure rollback.
- 18 cross-app browser workflows passed for scoped Chambers, Focus and Ritual Assist.
- 11 administration/Feedback browser workflows passed after transport adoption.
- 13 language/beta browser checks, 15 Cloudflare tests, four static chrome checks and the focused delivery/HTTP contracts passed.
- A targeted browser assertion verified zero translation scans for Arena score mutations.
- Generated production assets passed 15 routes in both themes (30 checks), with zero page errors, against an isolated temporary API database.
- Production Wrangler dry-run passed. Tests and preflight used isolated data; production ballots/accounts were not modified.

Measurement scripts/logs are ignored local artifacts under `.publish/reuse-*`. Release verification below records the published Worker and live read-only observations.

## Release verification

Implementation commit: `5c7fef1`. Deployed with the existing production config and
`--keep-vars`; Worker version `22893e03-8326-4dc9-8527-7547db9a2354` serves
`https://apps.sushantsynapse.com`. No database migration was run.

Read-only live checks passed for Fund Lens index, default/text/numeric coverage
queries, and an official mapped scheme (152073, 52 holdings). Hashed partitions
return immutable JSON; a missing partition returns 404 with no-store. All three
new arena scopes return scores plus two days of results. Public editorial remains
available; anonymous legacy private APIs retain their scoped-adapter 409 boundary.

Nine live mobile routes passed light/dark checks with zero page errors, including
all arena types, the Adalat detail page, Fund Lens, Ritual Assist, Focus and
Feedback. The shared language menu works. Arena loads use the combined summary
and do not request the separate full-history endpoint at startup.

| Live arena observation | Encoded bytes before | Encoded bytes after | Requests before → after |
| --- | ---: | ---: | ---: |
| Politicians | 436,596 | 437,507 | 27 → 30 |
| News anchors | 550,262 | 550,502 | 28 → 30 |
| Actors | 653,658 | 653,899 | 28 → 30 |
| Corporates | 618,517 | 618,649 | 28 → 30 |

These individual same-origin, non-API resource observations show roughly flat
page bytes and a few additional shared-module requests, not a page-transfer
reduction. They are not controlled load-time benchmarks. All four still have zero
card-layout removals, one light cast module, no rich persona startup requests and
no applause audio startup download. The demonstrated improvements are Worker
upload size, summary calculation/query work and background DOM activity.
