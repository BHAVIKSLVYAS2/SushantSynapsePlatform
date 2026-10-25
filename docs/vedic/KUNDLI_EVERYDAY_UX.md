# Kundli: everyday reading and expert detail

Reviewed 25 October 2026. Reading rule version: `kundli-everyday-1`.

## Market review and product decisions

This review covers public entry pages and published feature descriptions, not
paid reports, private accounts or a claim of comparative predictive accuracy.

| Public product/source | Observed pattern | RITVAYAM decision |
| --- | --- | --- |
| [AstroSage Kundli](https://www.astrosage.com/kundli/) and [reading guide](https://www.astrosage.com/kundli/how-to-read-kundli.asp) | Charts, Dasha and topic reports alongside a large navigation/service catalogue; published sign-ruler and house associations | Preserve numerical depth, give everyday topics priority, and expose the actual basis of each reading |
| [Astroyogi Kundli](https://www.astroyogi.com/kundli) | Personality, career and relationship questions frame the product; further interpretation is linked to consultations | Address those questions in the on-device reading without requiring a consultation or another birth-data submission |
| [Prokerala Kundli](https://www.prokerala.com/astrology/kundli/) | Birth form and descriptions of the life areas associated with each house | Use ordinary topic names and show an accessible chart basis on demand |
| [Astroyogi planetary career overview](https://www.astroyogi.com/blog/planets-which-governs-your-career.aspx) | Planetary symbolism is associated with illustrative work domains; a full reading requires additional chart context | Offer work directions to explore, not a job guarantee or an automated vocational assessment |

The previous RITVAYAM result began with technical tables and numerous expert
widgets. It lacked a lay reading, an immediately visible life-topic structure,
and a clear distinction between calculated positions and editorial meaning.

## Implemented experience

- Start with Moon/rising sign and admitted birth-star identity, then nature,
  appearance/presence, career, resources, relationships, learning and home life.
- Two compact native menus provide topic jumps and chart/timing/tool shortcuts.
  The interpretation itself is visible without opening technical panels.
- Each available life-topic card has a plain-language interpretation, practical
  reflection and an expandable actual house/sign/ruler/placement basis.
- Current and following Dasha periods use the engine's dates and named lords,
  with localized IST presentation only when the pinned local projection exists.
- Charts/positions, Dasha/calendar, and advanced/exploration are separate native
  details sections. Open groups survive language changes. Existing controls,
  chart interactions and redacted calculation export remain.
- Birth review uses long-form civil date/time and time accuracy. Exact civil/UTC
  values, coordinates and model caveats are retained behind optional details.
- Focus and scroll move to the result heading after calculation. Menus/summary
  touch targets are at least 44px, with responsive one/two-column reading cards.
- The saved-input library is compact and collapsible. Opening a profile returns
  focus to its birth fields; saving exposes the saved entry. Nothing adds a
  second language/theme controller.

## Interpretation contract and limits

`kundli-reading.mjs` is a pure projection of an already calculated report.
`kundli-reading-copy.mjs` contains original authored en/hi/gu wording;
`kundli-reading-view.mjs` renders it. There is no remote AI, random score,
numerical-kernel change, favourable/unfavourable score or inferred event date.

Personality combines a sufficiently separated nominal Moon sign with an admitted
rising sign when available. The Moon-sign guard is the existing conservative
121-arcsecond minute-resolution sign screen, not a certified physical bound.
Birth-star identity requires an admitted Dasha starting Nakshatra. Appearance
uses rising-sign first-impression symbolism and the first-house ruler context;
it does not purport to determine height, complexion or actual body shape.

House 10 supplies career context, 2 resources, 7 partnership, 5 learning and 4
home. Each uses that house's sign, traditional seven-planet sign ruler and its
actual whole-sign house placement. Occupants are disclosed as facts, not silently
treated as a complete strength/aspect judgement. Work examples are editorial
associations, not a validated profession classifier.

Dasha themes use broad symbolism of the computed major/sub-period lords, with
the current interval and up to two following intervals in the loaded cycle.
Boundaries are half-open and approximate under the existing 365.25-day model.
They are not job, marriage, wealth or other life-event dates. No medical,
fertility, body measurement, caste/status or guaranteed outcome inference is made.
Aspects, planetary strength and a full classical interpretation are not assessed.
These traditional interpretations are not established scientific predictions.

Unknown/approximate and independently boundary-sensitive features remain
withheld. One unavailable calculation does not fabricate a replacement or hide
another independently available reading. Inputs alone can be explicitly saved
in the existing browser store; this reading/report is never persisted.

## Verification

Model checks cover all twelve actual rising signs, direct topic-to-chart traces,
unchanged report inputs, independent feature failures, Moon/Nakshatra admission,
exact Dasha transition boundaries and complete/distinct three-language copy.
Browser checks cover reading-first disclosure, technical navigation, native
language rerenders, unchanged numeric values, unknown/approximate times, mobile
themes, touch targets, no birth-data requests, saved-input reuse and redacted
calculation export. Production/live status is recorded in FUNCTIONALITY_LEDGER.md.
