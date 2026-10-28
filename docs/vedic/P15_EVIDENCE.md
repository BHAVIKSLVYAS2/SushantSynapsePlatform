# P15 matching, Yoga and Dosha rulebooks — internal draft

## Recorded-minute boundary correction (2026-10-27)

The historical all-or-nothing Rashi/Nakshatra/Pada screen below is superseded
for two-person matching. A user reported its generic error despite both inputs
being recorded minutes. The eight composite rules use Rashi and/or Nakshatra,
not Pada. `matching-screen.mjs` now leaves clear/Pada-only pairs unchanged and
enumerates classifications inside the same proposed ±121-arcsecond margin at
relevant edges. No recorded input is shifted or replaced. For each person,
endpoints and nominal longitude cover every relevant classification: distinct
Rashi/Nakshatra edges are separated by at least 3 1/3 degrees, exceeding the
242-arcsecond interval width. The cross-product retains correlated total scores.

Components with differing possible scores have `score:null` plus `scoreRange`;
their possible factors are explicit. A varying total is `null` with `totalRange`,
never the sum of independent component minima/maxima. Clear pairs retain the
unchanged raw result. The private envelope is version 2; the screened result
uses version 2 only when needed. UI shows ranges and person/edge explanations in
en/hi/gu. These are classification possibilities under the existing proposed
screen, not certified physical bounds or statistical confidence intervals.
Unknown/approximate-time inputs remain withheld; consent, future/range validation,
Yoga/Mangal checks, raw table rules and no-marriage-verdict policy are unchanged.
Birth details remain in tab memory with no requests/persistence.

Regression examples are synthetic: 2000-01-01 11:52 IST (Pada-only),
2000-01-01 18:32 IST (Nakshatra), and 2000-01-02 14:34 IST (Rashi), using New Delhi.
Dense pure-angle samples include the zero/360 crossing and two-person ambiguity;
actual Worker parity checks cover clear, Pada and meaningful-boundary cases.
The historical reference-source hashes below predate this correction.

Implemented 2026-10-24. Package/lock 0.15.0; no new dependency, production
deployment, route/card, persistence, auth/schema or Ritual Assist change.

## Calculation and source boundary

`rulebooks.mjs` separates versioned rule metadata from astronomical profiles.
`SYNAPSE_ASHTAKOOTA_COMPOSITE_V1` is an explicitly composite North Indian
eight-component framework, not a canonical school. A is the traditional column /
groom calculation axis, B the row / bride axis. These are calculation roles,
not required gender identities. The interface can swap them and requires review
again. No caste or social category is collected or inferred: Varna is displayed
as chart-symbol groups V1..V4, with no judgement of human worth.

Source facts were consulted online, not treated as implementation instructions:

- [Drik Panchang Varna](https://www.drikpanchang.com/tutorials/jyotisha/kundali-match/ashta-kuta/varna-kuta.html)
  supplies the Moon-sign grouping/comparison formula only. Source claims about
  caste, obedience or superiority are not adopted.
- [Telugu Calendar's published engine method](https://thetelugucalendar.com/marriage-matching/method/)
  supplies the selected four-class full-sign Vashya, directional Tara/Gana,
  natural-friendship Maitri, Bhakoot and Nadi conventions. This operator's
  specification is evidence of its convention; its classical-print attribution
  is not independently authenticated here.
- [Raman, Muhurtha, chapter XI](https://www.panchanga.lv/wp-content/uploads/2020/06/Muhurta_Raman.pdf),
  PDF pages 36/38, supplies factual Yoni symbols/points. The selected printed
  table has asymmetric horse/hare and buffalo/lion cells; they are retained and
  disclosed rather than silently symmetrized. It is not claimed to match every
  edition or school. No biological/sexual inference is generated.

All eight components return factor details, raw points, maxima, definitions and
source IDs; total is the sum out of 36 without rounding. Half-points remain exact
in binary arithmetic. Tara uses inclusive cyclic counts reduced to 1..9. Nadi
uses symbolic groups only, with no medical, hereditary or fertility claims.
No cancellation, exception adjustment, pass band, approval/rejection or marriage
quality verdict is produced. Source/table, editorial and independent traditional
review remain pending; this is an internal draft, not accepted predictive output.

The primary [Prokerala sample](https://api.prokerala.com/reports/sample/guna-milan-en.pdf)
provides a deliberately recorded convention disagreement: Magha/Leo on A and
Ashwini/Aries on B have seven equal components, but its Vashya is 0 versus this
four-class variant's 2. Published total is 20, selected-variant total is 22.
Fixtures use lunar-class interior angles, not a reconstructed birth ephemeris.
This is not a whole-report golden match. The other two fixtures are manually
specified rule arithmetic; generated sweeps and runtime parity are internal
regressions, not independent astronomical/traditional certification.

## Named checks remain geometric previews

`SYNAPSE_GEOMETRIC_RULE_PREVIEW_V1` defines Sun/Mercury same-sign and
Moon/Jupiter quadrant predicates. See [Astro Saxena](https://www.astrosaxena.com/articles/budhaditya)
and [Sarbani Rath](https://sarbanirath.com/jyoti%E1%B9%A3a/advanced/saka%E1%B9%ADa-muku%E1%B9%ADa-gajakesari-yoga/)
for additional and differing qualifications. Matching a base predicate does not
assert a fully formed or effective Yoga. Dignity, strength, combustion, aspects,
degree conjunctions, other occupants and activation are not evaluated.

Mangal previews explicitly choose one of [1,4,7,8,12], [2,4,7,8,12] or
[1,2,4,7,8,12], counted inclusively in whole signs from Lagna, Moon and Venus.
[Drik Panchang](https://www.drikpanchang.com/jyotisha/mangal-dosha/mangal-dosha-calculator.html)
documents these house-set disagreements and references. Cancellation/severity
are not evaluated; final Dosha/Manglik labels and harmful predictions are withheld.
No remedy, paid intervention, death, health or relationship-outcome claim appears.
Independent traditional review is required before offering final named assessments.

## Admission and privacy

`birth-matching.mjs` requires literal consent `true` before inspecting either
nested birth record. It forces birth purpose, rejects purpose overrides/future
tails, and admits only exact recorded minutes. Matching uses the existing proposed
121-arcsecond Moon Rashi/Nakshatra/Pada boundary screen. Approximate/unknown
input stays withheld even when P14 offers conditional coarse stability. These
screens are not independently certified physical error bounds.

Single-birth geometric previews require the proposed sign screen; unavailable
Lagna does not invalidate supported Moon/Venus references. The pure rule APIs
accept nominal longitudes and cannot substitute for birth admission.

The separate loopback matching preview has two blank birth cards disabled until
permission is checked, explicit local/UTC review, calculation, axis swap and clear.
Edits invalidate reviews/results; revocation clears both records. Pending tasks,
navigation and lifecycle clear do not resurrect private results. No names are
requested, and no birth details are stored, logged, sent, embedded in URLs or
exported. Only the existing theme preference persists. Source links use
`no-referrer`. No server data-processing endpoint is introduced.

English/Hindi/Gujarati controls and contextual limits work; component names,
factor symbols, definitions and source titles deliberately disclose English
fallback pending language review. Numeric values are invariant. Shared tokens,
mobile layout, focusable table overflow and all themes are preserved. The birth
preview embeds only single-birth geometric checks; P10 export whitelist remains
unchanged and print hides these supplemental panels.

## Verification and continuation

Eight focused Node checks pass: 11,664 quarter pairs, component arithmetic,
directionality, printed Yoni disagreements, Vashya variant, strict consent,
unsafe input, all 36 Mangal house-set cases and exact/uncertain birth gates.
Actual workerd passes five matching/three geometric cases with exact object
equality; pure bundle 10,683 bytes excludes astronomy and the place directory.
Saved report reproduces three fixtures, 11,664 pairs, 36 geometric cases and
source hashes. Full isolated regression passed 509/509, zero failures, 332.996s
(.publish/vedic-p15-full-tests.log); main Chrome run passed all 23 cases
(.publish/vedic-p15-browser.log). Gujarati mobile reviewed. A final focused run
overlapped the first run's trace cleanup and hit an ENOENT on context close;
three P15 cases passed again with separate output after final presentation edits
and pending-clear coverage (3/3, 35.0s; .publish/vedic-p15-browser-verified.log).
Offline reference --check, package/lock metadata and whitespace checks pass.
Implementation phase complete within this internal draft scope; independent
traditional, language and public-release acceptance remain open.

```powershell
node infrastructure/preview-vedic-matching.cjs # http://127.0.0.1:4181
node infrastructure/preview-vedic-birth.cjs # http://127.0.0.1:4178
node --test tests/vedic-matching.test.js tests/vedic-matching-worker.test.js
node infrastructure/verify-vedic-matching.cjs --check
npx.cmd playwright test apps/rashifal-kundli/tests --reporter=list
```

Next requested phase: P16 optional advanced vargas/strength calculations. Read
KU-10/KU-12 and their individually defined algorithm/source acceptance gates.
Do not infer acceptance of P15's draft rulebooks or earlier numerical sources.
