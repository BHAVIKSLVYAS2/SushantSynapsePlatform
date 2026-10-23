# Satire Arena loading and reuse review

24 October 2026. Baseline: live production before the cleanup. Final production
measurements will be recorded after deployment.

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

373 API tests and all 36 Satire browser workflows pass. The production-config
dry-run and syntax/whitespace checks pass. Final production verification follows.
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
