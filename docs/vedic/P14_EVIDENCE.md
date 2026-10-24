# P14 birth-time sensitivity — internal candidate

Implemented 2026-10-24. Package/lock 0.14.0. No production deployment or public
route; prior source and numerical acceptance gates remain open.

`interval-sectors.mjs` covers the entire input interval with adaptive closed
angular envelopes. A sector is stable only when every envelope stays inside it.
Different certified bands establish changes; ambiguous cells remain unsupported.
Equal endpoint or midpoint values alone never establish stability. Possible
boundary windows enclose ambiguity, not exact roots or a count of transitions.
Excluded final instants are conservatively included in envelopes.

`sensitivity.mjs` derives Moon Rashi/Nakshatra/Pada, Lagna Rashi/D9, individual
planet Rashi/D9 and aggregate chart statuses. The declared 24 degree/day planetary
rate, 61 arcsecond guard and geometric Lagna rate are candidate assumptions,
not independently certified bounds. Lagna uses a minimum vector norm
cos(abs(latitude)+26 degrees), with proposed sidereal/obliquity/ayanamsha rates
370/1/1 degree/day. Polar geometry fails independently of planetary output.
These results must not unlock precise interval charts or Dasha dates.

Each traversal has a 4096-cell budget and five-second refinement floor; shared
astronomical snapshots are limited to 4096. Exhaustion retains parent envelopes
over uncomputed children, preserving coverage while widening uncertainty.
UTC leap steps are withheld. Whole January intervals overlapping Delta-T join
years 1961, 1986, 2005 or 2050 are conservatively withheld because the engine's
approximate-year polynomial switch occurs near mid-January.

`birth-sensitivity.mjs` preserves P02 admission: exact minute is a half-open
60-second interval, approximate time uses its closed stated uncertainty, unknown
time uses the complete local day. Future interval tails fail admission. Unknown
output has no representative birth instant, noon chart or precise Dasha epoch.
Possible birth lords derive from possible Nakshatras. A stable Nakshatra permits
only an enclosed remaining-years range using P08's 365.25-day convention.

The app mounts a separate en/hi/gu analysis panel in private birth results.
Explicit analysis uses a cancellable browser Web Worker; edits, clear and destroy
terminate it. Worker failure stays unavailable, without a synchronous fallback.
Inputs/results remain in memory, never URLs, logs, storage or network requests.
P10 export projection remains unchanged; print excludes this supplemental panel.
Only the loopback development harness serves the worker/CSS through fixed paths.

Validation:

- Full isolated repository regression: 500/500 pass, zero failures, 243.260s;
  `.publish/vedic-p14-full-tests.log`. No production/user fixtures modified.

- Eight Node checks pass: guarded constants, wrap, hidden internal excursions,
  tangent ambiguity, budget fallback, minute/approximate/unknown admission,
  leap/model joins, polar independence and Dasha range containment.
- Actual workerd parity passes two intervals/130 numeric comparisons, zero
  difference; 78,082-byte pure bundle excludes the place directory.
- All 20 Chrome tests pass, including two P14 cases, language numeric parity,
  320/390/1440 widths, light/dark/system, print isolation, unknown day,
  cancellation, clear and network/storage privacy.
- `P14_REFERENCE_RESULTS.json` records three internally generated regression
  cases and source hashes. It is not independent astronomical reference data.
  Offline `--check`, package/lock metadata and whitespace checks pass. Gujarati
  mobile screenshot reviewed: `.publish/vedic-p14-sensitivity-390-gu.png`.

Reproduce:

```powershell
node --test tests/vedic-sensitivity.test.js tests/vedic-sensitivity-worker.test.js
node infrastructure/verify-vedic-sensitivity.cjs --check
npx.cmd playwright test apps/rashifal-kundli/tests --reporter=list
```

Next increment is P15 matching, Yogas and Dosha rulebooks. Read the master
requirements and version/source/consent contracts before implementing rules.
P14 does not approve earlier source gates or production publication.
