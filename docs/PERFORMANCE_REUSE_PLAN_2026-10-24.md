# Performance and reuse implementation plan

Status: review and proposal only. No application implementation, production
change, benchmark or migration was performed for this review. Source sizes below
are uncompressed filesystem measurements, not browser transfer or latency gains.

## Existing improvements to preserve

The app registry, fingerprinted asset dependency graph, filtered delivery CSS,
early theme/layout reservation, shared initial authentication promise, lazy game
controllers, shared downloads/text/archive helpers, Satire light cast metadata,
shared card face and reaction controller already exist. Extend these boundaries
rather than replacing them. Node mode and live organisation-scoped Workers/D1
remain distinct adapters. Business validation stays app-owned.

## Priorities and concrete changes

| Order | Finding and source | Proposed change | Gain to verify | Risk/size |
| --- | --- | --- | --- | --- |
| 1 | `fund-sources.mjs` statically imports `fund-runtime-references.json` (15,577,154 bytes) and calls `prepareReferenceSearch` at module initialization. `worker.mjs` imports that module on the shared Worker path. | Export immutable, versioned public reference partitions and a small manifest; load only the Fund Lens partition needed by a request. Reuse the existing static-archive delivery approach and bounded request deduplication. Keep coverage provenance and last-good fallback. | Remove the large reference payload from Worker code and unrelated initialization. Measure final bundle size, initialization CPU and Fund Lens first-search/coverage latency; avoid merely moving the delay into the first search. | Medium/large |
| 2 | `theme.js` observes the whole document; `language.js` observes body mutations and traverses translation roots on every refresh. Home discovery, visitors and shell reconciliation add independent observers. Satire's second-based countdown creates repeated DOM mutations. | Add a small shared UI lifecycle that announces shell readiness, language/theme changes and replaced app roots. Translate only added/changed owned subtrees; initialize theme controls only when added. Keep one scoped fallback observer for legacy apps. Cache control/root references and skip unchanged text writes. | Count callbacks, nodes visited, DOM writes and scripting time on idle Arena, voting and large forms. A reaction count update should not cause a full chrome translation walk. | Medium/medium |
| 3 | Satire countdown writes two nodes every second although it displays minutes. A successful score poll calls `refreshResults`, producing a second request every 30 seconds. `edge.mjs` transfers retained ballots into JS and groups them using repeated array searches. | Update countdown at minute boundaries plus explicit visibility/year-rollover events. Add optional arena filtering and a compact today/yesterday summary to the existing score response, retaining the full history endpoint. Aggregate retained ballots in SQL with the same deduplication, IST dates and privacy-removal semantics. Inspect query plans before choosing indexes. | Steady countdown timer writes: about 120/minute to about 2, excluding explicit refreshes. Steady feed polling: 4 to 2 requests/minute if the compact summary is combined. DB rows returned should scale with groups, not individual retained ballots. These are proposed structural targets, not measured speedups. | Medium/medium |
| 4 | `edgeApi` constructs/begins the general repository and checks session before dispatching public services. Completed GETs then check the global revision. The Arena service uses its own DB operations underneath. | Classify routes first; construct only the adapters needed. Public editorial reads and Arena operations should avoid unrelated repository setup, while authenticated admin branches retain their checks. Introduce an explicit shared route context and transport contract. | For the current public Arena GET path, remove the two outer revision reads (`begin`/`unchanged`) only after proving they protect no state used by that route. Count queries for guest, signed-in and private routes separately. | Medium/medium |
| 5 | Many app-local API functions independently parse JSON, attach status errors, choose timeouts and manage stale responses. `availability.js` intercepts global fetch with app-specific exceptions. | Add a small `packages/http` browser transport: JSON/204 handling, explicit timeout, caller abort signal, credentials and status/code errors. Add optional deduplication for identical in-flight GETs, keyed by request scope. Keep auth invalidation, optimistic state and app outage messages in each app. Migrate incrementally before retiring interception. | Fewer inconsistent request/error implementations; cancellation prevents obsolete work. Verify each migrated screen retains its failure/reconciliation behaviour. No automatic retry of writes or persistent private-data cache. | Medium/medium |
| 6 | The existing `downloadBlob` helper has not been adopted throughout: a source scan finds 20 `createObjectURL` occurrences in 16 non-test, non-bundle JS files, including the Android bridge and shared helper themselves. | Migrate ordinary downloads in Arena, Ritual, Focus, BatchFee and Tournament to the existing helper. Reuse `escapeHtml` where its HTML text/quoted-attribute contract matches, and share clipboard/native-share transport with app-provided text and layouts. Do not alter the Android bridge hook or replace preview URLs indiscriminately. | Remove redundant URL creation/revocation code and unify cleanup behaviour. Expect maintenance gains; byte savings must be measured rather than promised. | Low/small |
| 7 | Node/edge route families and SQL/native organisation repositories repeat policy orchestration; Samaj's edge adaptation alone has about 72 KB of adapter modules. Some shared rendering markup is still copied across HTML entry points. | Extract proven pure validators, permission orchestration and shared view fragments into their current app/package owner. Repositories retain engine-specific transaction/SQL behaviour. Generate shared chrome/metadata and derived entry pages from one build-time source. Inventory generated versus maintained files before deleting anything. | Fewer parallel rule edits, lower drift and less post-load DOM reconciliation. Use cross-adapter contract tests, including denied access and conflicting writes. Source reduction does not automatically imply runtime reduction. | High/large; last |
| 8 | Chambers loads complete scoped state for operations and derives next hearing/payment totals through repeated filters. Feedback and Confessions read, parse and rewrite bounded settings documents. | First index current in-memory state by case/client/invoice once per request. Add scoped list/pagination/targeted-read endpoints only where actual payload/query measurements justify them. Consider normalized community records only when document sizes/contention warrant a separate migration. | Measure state payload, query count, aggregation CPU and conflict rates at representative dataset sizes. Retain atomic hearing/date changes, invoice balances, ownership checks and storage-backed preferences. | Medium/high; evidence-gated |

## Implementation sequence

1. Establish a reproducible baseline on home, all Arena routes, one profile,
   News, Fund Lens search/coverage and Ritual calendar. Measure private Chambers
   with isolated fixtures, not production records. Use cold/repeat cache, mobile
   CPU/network settings, external ads consistently included/excluded, and several
   runs. Capture request/byte totals, LCP/CLS, scripting/long tasks, DB query and
   returned-row counts, Worker bundle/initialization, build time and page errors.
2. Deliver low-risk changes separately: countdown write guards, existing helper
   adoption and scoped observer work. Give each change its own before/after result.
3. Split Fund Lens runtime data; then optimize Arena summary and SQL reads. Keep
   these independent releases so data-loading and polling regressions are clear.
4. Introduce shared HTTP transport and route contexts one app at a time. Handle
   public routing first; refactor protected operations only after adapter parity.
5. Consolidate business services and shared page templates last. Leave schema
   migrations and full-state API replacement as separate, evidence-led work.

## Verification and reporting

- Compare median and slower-run results under the same conditions; report actual
  improvements, unchanged metrics and any regressions. Do not reuse historical
  Satire savings as gains from this plan.
- Keep focused failure-path, responsive/theme, keyboard, language, sharing,
  Android download and first-paint checks. Use isolated temporary data for API
  tests and prove scoped access, stale-response handling and atomic write parity.
- Add CI budgets for per-route startup bytes/requests, unexpected rich-module
  loads, duplicate assets and Worker reference-data growth. Use deterministic
  counts for required checks; timing budgets need tolerances.
- Repair stale affected test expectations explicitly. The earlier broad run's
  Take-a-Break assertion expects eight cards while the current catalogue has
  seven; this is a known test-maintenance item, not evidence of a new performance
  regression.
- Commit/deploy only after the user authorizes implementation. Review contains
  no new app code, migrations, production writes or deployment.

## Extensions worth sharing

`packages/http`: transport, abort/timeout and typed status errors.
`packages/ui`: scoped lifecycle hooks, existing downloads/text helpers and thin
share/copy helpers. App-owned presenters retain card, export and message content.
`packages/database`: adapter contracts and query instrumentation; app-specific
queries and tenant policy remain in their existing owners. Build tooling owns
shared chrome generation and versioned public reference manifests.

Avoid a universal CRUD layer, a framework rewrite, a platform-wide state store,
or caching authentication/licensing decisions to claim performance gains.
# Implementation status

The concrete performance/reuse work is implemented and verified. See
[results and release verification](PERFORMANCE_REUSE_RESULTS_2026-10-24.md).
The proposal below is retained as the original review; evidence-gated persistence
and API redesign remain deferred as explained in the results.

