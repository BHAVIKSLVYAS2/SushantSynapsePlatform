# Satire Arena loading and reuse review

24 October 2026. Baseline: live production before the cleanup. Implementation
commits `6c5a5af` and `965cffd` are deployed as Worker
`977d2244-99ed-483d-b31f-545c6464963b`, with existing variables retained and no
database migration. Final measurements are from that live deployment.

## Measured gain

Cold-context encoded resource bodies, decimal KB. Four-arena averages:

| Metric | Before | After | Change |
| --- | ---: | ---: | ---: |
| First-party startup JavaScript | 53.9 KB | 43.8 KB | -18.7% |
| All first-party startup resources | 624.4 KB | 577.3 KB | -7.5% |
| Metadata module URLs per arena | 2 | 1 | One module instance |
| Rich-profile script requests at entry | 2 | 0 | Removed |
| Applause transfer at entry | 36.4 KB | 0 | Deferred to interaction |
| Card-layout moves/removals, politicians | 52 | 0 | Removed |
| Card-layout moves/removals, each other arena | 24 | 0 | Removed |

| Arena | First-party bytes before | After | Reduction | Requests before/after |
| --- | ---: | ---: | ---: | ---: |
| Politicians | 483,471 | 436,608 | 9.7% | 30 / 28 |
| News Anchors | 650,002 | 603,194 | 7.2% | 30 / 28 |
| Actors | 699,708 | 652,806 | 6.7% | 30 / 28 |
| Corporates | 664,540 | 616,714 | 7.2% | 30 / 27 |

These are transfer/DOM-work reductions, not a claimed percentage reduction in
page-load time. Small differences in shared lazy resources account for the
request/JS-byte variation between arenas.

## Changes

- One final card renderer and one fragment insertion replace the temporary
  portrait-stage/card-meta layout and the subsequent moves/removals.
- One canonical lightweight cast supplies names, IDs, card copy, reaction and
  sprite mappings. Full profile scripts remain server-owned and do not enter
  the voting-page module graph. Existing public compatibility URLs remain.
- Consistent source imports eliminate duplicate query/non-query module instances.
  The production exporter continues to provide fingerprinted immutable assets.
- One shared reaction controller owns optimistic ballots, stale-read protection,
  rollback, reconciliation, polling, privacy removal and sound/animation hooks.
- Daily results refresh after successful score reads, including saved votes,
  polling, manual refresh and return from a hidden tab. Superseded results
  requests are cancelled; editorial copy refreshes once per IST day.
- Applause is fetched on sound-enabled interaction rather than module import.
- Native HTML owns the navigation/static panels. The shared platform shell owns
  the header/theme control. Old expand/burst controls, tracking and unused
  temporary-layout styles are removed; overridden CSS declarations are pruned.
- The shared header reservation and compact hero layout apply before shell JS
  arrives as well as afterward; a delayed-script check confirms no hero movement.

## Measurement method

Headless Chrome, a fresh browser context for each of the four arenas, no voting,
and the same scripts before/after deployment. Reported network bytes are encoded
first-party resource bodies, excluding the main HTML document, API responses,
third-party advertisements and browser overhead. Measurements are individual
cold-context observations, not a latency or LCP benchmark. Timing varies with
network conditions and Google-managed advertisements.

An early MutationObserver counts removals/moves of `.portrait-stage`, `.card-meta`,
`.portrait` and `.card-body` elements during initial rendering. It excludes text
updates, reaction effects and third-party DOM work.

The baseline records two catalogue module URLs, two rich-script dependencies
and one 36,360-byte applause request on every arena. Politicians remove/move 52
layout elements at startup; each other arena removes/moves 24.

CSS equivalence was checked at the same stylesheet position with transitions
disabled, across all four arenas and four representative profiles, light/dark
themes and 320/390/768/1440px: 64 combinations, no computed-style differences
for the sampled interface elements. The shared action-button rule is retained.

## Validation and tradeoffs

373 API tests and the complete 36-workflow Satire browser suite pass. The final
lazy-share, early-theme/lean-entry and added delayed-shell checks pass too (37
distinct browser workflows covered across the full suite and focused checks).
The production-config dry-run and syntax/whitespace checks pass. Live verification
passes all eighteen non-political reaction portraits, all six reaction types,
three detail-page examples and 56 theme/viewport combinations: zero page errors,
duplicate expression URLs or arena writes. All four arenas show one metadata URL,
no rich scripts/audio at entry and no layout-node moves/removals. Applause's live
asset/playback is checked separately without submitting a vote.
Actual existing records, character IDs, portrait originals, privacy boundaries
and ballot schemas are preserved. No database migration is needed.

Fresh daily totals require a results GET alongside successful score refreshes;
this corrects the old once-per-day summary behavior. It is a correctness tradeoff,
not a reduction in polling traffic. Hidden tabs still pause score polling.

Raw measurement artifacts are ignored under `.publish/`: `satire-network-before.json`,
the after-release counterpart, `satire-css-equivalence.json`, and verification logs.

CSS delivery (same esbuild settings before/after): 48,518 to 44,235 minified
bytes (-8.8%); 8,438 to 7,917 gzip bytes (-6.2%). Source is now formatted for
maintenance; source-file byte size is not the delivery measurement.
