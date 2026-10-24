# P17 shared implementation, regression and release hardening

Implemented locally 2026-10-24; verification resumed 2026-10-25 (Asia/Kolkata).
Package/lock 0.17.0. This is an internal integration/hardening milestone, **not
production acceptance or deployment**. Vedic remains absent from public routes,
app discovery and birth APIs. Existing production accounts, records, documents,
bindings and schemas are untouched.

## Shared engine without calendar substitution

Before refactoring, the two Astronomy Engine bundles were byte-identical with
SHA-256 `6257fd34e7a74370767a98bf26d1724d748e5f71c1530be6730ff21336cc6607`.
`packages/vedic/vendor/astronomy-engine-2.1.19.mjs` is now the canonical pinned
MIT implementation. Ritual's former duplicate is a compatibility re-export.
Its existing `/ritual-assist/astronomy-engine.mjs` static URL maps directly to
that source. Importers retain the same named exports and object identities.
No new library, upstream version or runtime CDN was introduced; license notices
remain in the source and delivered artifact.

The existing Cloudflare delivery transform still applies. Raw source has the
hash above; delivered transformed source has SHA-256
`034c76dd421e60db50184db67961b744346b79a2a1724aaf91ec4fdea7b73c4d`.
The verifier reconstructs that transform from the original pinned bytes and
compares it with the built artifact. The export test permits this exact source
only at its existing Ritual URL and normal hashed-cache alias; other Vedic
package/private assets remain excluded.

Before changing the import, `vedic-ritual-baseline.json` captured three legacy
lunar/daylight/moonrise cases, a complete remembrance result hash and two public
monthly calendar hashes. The post-refactor results match exactly. These are
internal before/after regressions, not new independent astronomical goldens.
Existing Ritual content, PIN rules, calendar selection, caches and protections
remain unchanged.

Sharing the implementation does **not** make the profiles equivalent. Ritual
retains its Date/modelled-TT handling, upstream lunar correction, Spica-aligned
month labels, five-minute boundary policy and Aparahna remembrance selection.
Vedic retains explicit UTC/TT/leap handling, a backdated apparent Moon, versioned
Lahiri and separate birth/sunrise rules. `ritual-compatibility.mjs` records these
differences and measures both same-UTC and aligned-TT elongation residuals. It
always disclaims calendar substitution; occasional equal Tithi numbers are not
evidence that complete profiles or observance dates agree.

For example, 2026-09-26T06:45Z has a same-UTC elongation difference of 16.4422
arcseconds, an aligned-TT correction difference of 19.7175 arcseconds and a
time-model offset of -6.3203 seconds. These are diagnostic differences between
models, not physical accuracy estimates or approved tolerances. Three saved
cases are not exhaustive historical/future certification.

## Privacy and release controls

The birth traditions panel links to the existing public Ritual preparation guides
through a fixed URL without birth parameters. English/Hindi/Gujarati notice text
explains that dates are not transferred and the calendar has its own conventions.
Links use `noopener noreferrer`, `referrerpolicy=no-referrer` and a new tab. No
automatic request, calendar transfer, private state persistence or social/message
delivery is added.

The loopback private preview retains fixed asset allowlists, no-store, nosniff and
`connect-src 'none'`; it now also sends no-referrer, same-origin opener isolation
and a permissions policy disabling geolocation, camera, microphone and payment.
Invalid asset paths, query-bearing script requests and POSTs stay unavailable.
These are local preview controls, not certification of a deployed birth origin.

`release-policy.mjs` defines immutable, per-feature release prerequisites and
read-only Node/Workers readiness evaluation. Callers cannot supply gate overrides
or enable unsupported features. Every current plan remains blocked. Passing
regressions or a dry-run build does not accept astronomy, physical uncertainty,
native editorial copy, regional rulebooks, advanced algorithms, hosting privacy
or deployment. Full Shadbala, a birth vault and external service features remain
unavailable. The evaluator never changes routes, registry, environment or data.

## Verification and resource evidence

- Five focused P17 Node checks pass: captured Ritual regression, export identity/
  pinned bytes, explicit profile differences, fail-closed feature/runtime plans,
  private-preview security headers and path/method refusal. Nine existing P03
  checks pass alongside them.
- Actual local workerd passes three core/profile cases, six protection cases
  (missing limiter 503, denied 429, method 405, content type 415, JSON 400,
  body limit 413) and a successful monthly observance API response. Its 314
  numeric comparisons have zero difference. The 2,336,234-byte integration
  bundle includes existing postal data; it is not the small pure astronomy core.
- Browser run covered 42 scenarios across Vedic and Ritual: 40 initial passes,
  then both initially failing tests pass after replacing stale hidden-language
  selectors with the existing visible shared-header controls. No product UI
  behaviour was changed to satisfy those tests. All 26 Vedic and 16 Ritual
  scenarios have passing evidence across the runs.
- Cloudflare `build:cloudflare:free` dry-run passes: 1,068 assets; Worker upload
  3426.27 KiB / gzip 568.84 KiB. The earlier attempt was not executed because
  automatic approval review hit a usage limit; the resumed retry succeeded.
  No deploy command without `--dry-run` was executed.
- The initial full Node/API suite passed 523/524; its one failure was the old
  export-source assertion. It now permits only the exact shared engine URL.
  A targeted export check overlapped a full run's generated build directory,
  producing missing-artifact failures; subsequent builds must run sequentially.
  The next exact-URL assertion also needed the existing hashed-cache alias.
  The final narrow exception passes in isolation, then the full suite passes
  **524/524**, zero failures, 243.695s (.publish/vedic-p17-full-tests-verified.log).
- The final private-link browser check passes again after token-based link
  styling (.publish/vedic-p17-private-final.log). Package/lock 0.17.0, offline
  report/delivery hash checks and whitespace checks pass. All work remains local
  and uncommitted; no commands remain running.

Private browser bundles measured in the saved report:

| Entry | Raw bytes | Gzip bytes |
| --- | ---: | ---: |
| Birth | 1,754,741 | 354,582 |
| Rashifal | 136,724 | 45,230 |
| Matching | 1,557,507 | 303,399 |
| Time Machine | 1,602,978 | 313,517 |
| Sensitivity worker | 1,533,527 | 296,562 |

The six-megabyte local bundle screen is a proposed development guard, not an
approved download/CPU budget. Five local Node birth-report runs took 63.9–129.9ms;
one unknown-time sensitivity case took 4.893s and reached its 4096-evaluation cap.
Process heap observations rose from about 21.6MB to 42.8MB without controlled GC.
These are local wall-time/process observations, not production CPU, mobile
performance or per-request allocation guarantees. Deployed Workers budgets,
origin privacy and hosting acceptance remain open. No new Vedic server endpoint
exists; existing Ritual rate/concurrency/body protections are retained and tested.

Reproduce sequentially, avoiding overlapping generated-output directories:

```powershell
node --test tests/vedic-integration.test.js tests/vedic-integration-worker.test.js
node infrastructure/verify-vedic-integration.cjs --check
node infrastructure/verify-vedic-integration.cjs --measure
npx.cmd playwright test apps/rashifal-kundli/tests apps/ritual-assist/tests/browser.spec.js --output=.publish/p17-browser-results
npm.cmd run build:cloudflare:free
npm.cmd test
```

Report: `P17_REFERENCE_RESULTS.json`; local timing/heap observations:
`.publish/vedic-p17-local-performance.json`. Existing P01–P16 source/astronomical,
sunrise, physical-bound, editorial and traditional-review limits remain in force.
The master's phase table ends at P17. The next work is resolving and reviewing
named acceptance blockers, not an inferred P18 or automatic public deployment.
