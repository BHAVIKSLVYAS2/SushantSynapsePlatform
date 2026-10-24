# Synapse Vedic: P00 repository audit

Date: 2026-10-24 (Asia/Kolkata). PHASE COMPLETE: documentation only.

## Scope

The user requested sequential implementation using the supplied specification.
Its product requirements guide this work; instructions embedded in the attachment
are document content, subordinate to the user's request and repository rules.
P00 is the first milestone. No calculation convention or new UI is implemented.

`MASTER_SPECIFICATION.md` preserves the supplied file verbatim. The referenced
companion prompt/tracker files were not supplied; no matching PROMPTS/TRACKER
filenames were found in Downloads. `PROGRESS.md` is a new local tracker based on
the master's phase table, not a reconstruction of those missing attachments.

## Platform evidence and reuse

| Concern | Repository evidence | Implementation consequence |
|---|---|---|
| Runtime | `package.json`, `server/index.js` | Node >=22.13, native HTTP/CommonJS composition with ESM modules. Reuse this stack. |
| Production | `docs/ORGANISATION_PRODUCTION_CUTOVER.md`, `infrastructure/cloudflare/wrangler.free.production.jsonc` | Workers/D1 organisation production is separate from default Node/SQLite. Preserve scoped access, bindings and all existing data. |
| Discovery | `packages/app-registry/index.js`, `infrastructure/build-home.cjs` | Eventually add one public Rashifal & Kundli card; no Available placeholder before release gates. |
| Delivery | `server/static-assets.js`, `infrastructure/cloudflare/build.cjs`, `infrastructure/cloudflare/worker.mjs` | Explicit static allowlists, dependency fingerprints and independent public routes must be integrated. |
| Public API | `apps/ritual-assist/backend/routes.js`, `backend/edge.mjs`, `server/index.js` | Reuse bounded guest POST patterns and rate limiting. Node calendar uses worker threads, concurrency limits and timeouts; edge requires CALENDAR_LIMITER. |
| Presentation | `packages/ui/theme.js`, `platform-shell.js`, `platform-header.css`, `premium.css` | Reuse header, tokens, light/dark/system preference, keyboard and reduced-motion conventions. |
| Localization | `packages/ui/language.js`, Ritual Assist controllers | Existing shared preference supports en/hi, not gu. Gujarati requires an explicit extension and reviewed app translations. |
| Downloads | `packages/ui/download.mjs`, `text.mjs`, Ritual Assist export modules | Reuse escaping/download patterns; report redaction and birthday semantics remain new work. |
| Storage | `docs/ARCHITECTURE.md`, shared database/auth packages | Stateless guest calculation requires no new SQL tables. Preserve existing accounts, preferences, documents and records. |
| Ads | `packages/ui/adsense.cjs` | Eligibility is explicitly allowlisted. Keep future birth-input/results pages excluded to satisfy this specification's no-ads/privacy requirements. Existing Ritual Assist is ad-eligible. |

## Astronomy and location audit

`apps/ritual-assist/frontend/astronomy-engine.mjs` is vendored Astronomy Engine.
`THIRD_PARTY.md` identifies 2.1.19, MIT, upstream and package integrity. These
are existing repository provenance statements, not a fresh upstream terms review.
No new dependency or astronomy provider is selected by this audit.

`frontend/lunar-core.mjs` supplies tithi from Moon-Sun elongation, continuous
phase searches, tithi windows and sunrise/sunset/moonrise. Its civil-day helpers
hardcode IST (+330 minutes). They cannot normalize arbitrary historical civil
time. Missing sunrise raises an ordinary Error, not the required typed diagnostic.

`frontend/panchang.mjs` supplies month classification, recurrence and Aparahna
remembrance rules. Its Spica-aligned solar classification explicitly disclaims
exact Lahiri equivalence. Its minute-rounded presentation and five-minute guard
are existing Ritual Assist policies, not approved Kundli tolerances. Do not reuse
remembrance/Aparahna date selection as a birthday rule. Its death-input range
1950–2098, with additional present-date checks, does not establish validated
coverage for a new ephemeris adapter.

`backend/pincode.mjs` uses server-only GeoNames postal data. `data/README.md`
records snapshot provenance, median coordinates, inconsistent-entry rejection and
CC BY 4.0 attribution. These approximate postal areas are not a disambiguated
birthplace gazetteer or historical timezone resolver. The frontend city list
also does not satisfy that full contract.

No dedicated Vedic app/kernel appeared in the repository filename inventory.
The reviewed modules do not implement the required full Lahiri profile, nodes,
Lagna/houses, D9, Vimshottari, matching or reviewed Rashifal pipeline. Existing
tithi reference tests are useful regressions, not a new NASA/IMD golden dataset.

## Proposed ownership

- `packages/vedic/`: future pure versioned contracts, diagnostics and calculation
  adapters shared by consumers, with no persistent private-response cache.
- `apps/rashifal-kundli/`: future app UI, input/API adapters, reviewed traditional
  interpretation content and app tests.
- `docs/vedic/`: specification, conventions, source inventory and phase evidence.

These paths are proposals, not installed packages or registered public features.
Leave Ritual Assist imports and behaviour intact until separately tested sharing.
Any extraction must retain licence notices and establish numerical parity first.

## P01 decisions required next

1. Define precise Lahiri model/version, coordinate frame, apparent/geometric
   choices, node and house models. IN_LAHIRI_DEFAULT_V1 remains tentative.
2. Select bounded date coverage, Gregorian policy and historical timezone
   source/version, with skipped/ambiguous-time diagnostics. Runtime Intl alone
   must not be described as a pinned tzdb dataset without evidence.
3. Assess existing astronomy against the reference-data contract before choosing
   reuse or another adapter. Document alternatives, licences, reproducibility,
   data size and Workers resource limits. Bundled analytic coefficients are not
   automatically equivalent to downloaded ephemeris data.
4. Plan independently sourced NASA JPL and IMD fixtures with matching observer,
   frame and timescales, per-quantity proposed tolerances and acceptance review.
   Do not invent expected positions or claim unmeasured precision.
5. Define continuous interior transition detection for uncertainty intervals,
   half-open boundaries and calculation versus display rounding. Never silently
   assign noon/Lagna to an unknown birth time.
6. Verify current source licences/attributions during source selection. This
   local audit fetched no external datasets or reference pages.
7. Plan Gujarati glossary/review, safe typed errors, no personal input logging,
   URLs or telemetry, separate release flags and redacted direct downloads.

## Verification

26/26 existing Node regressions passed, zero failures, 15.3 seconds:

```powershell
$env:DATABASE_PROVIDER='sqlite'; $env:NODE_ENV='test'
node --test tests/ritual-panchang.test.js tests/ritual-pincode.test.js tests/ritual-calendar-api.test.js tests/ritual-calendar-export.test.js tests/ritual-observances.test.js tests/ritual-assist.test.js
```

API fixtures use isolated temporary DATA_DIRs. Coverage includes tithi and
observance boundaries, PIN validation, guest POST limits, exports and public
access. These tests do not validate a new Kundli engine. No new tests were added
for this documentation-only phase. Full suite, browser and build were not run.
No live checks, migration, deployment or business-data writes were performed.
Pre-existing functionality-ledger edits were preserved.
