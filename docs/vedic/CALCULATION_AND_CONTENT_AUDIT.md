# Vedic app calculation and content audit

Reading-first follow-up (25 October 2026): `rashifal-gochar-6` adds a plain-language
outlook before the calculation summary/timeline. This is explicitly original
editorial guidance derived from actual factors and timing, not newly certified
classical domain prediction rules. Its trace is retained and uncertainty is not
silently promoted into a confident forecast. See READABLE_OUTLOOK.md. The
remaining rulebook/independent-review gaps below are unchanged.

Timing follow-up (25 October 2026): `rashifal-gochar-5` adds the nominal
sign/screen-edge timeline described in item 3, with station splitting, bounded
refinement and explicit contact/period-edge uncertainty. The search does not
certify arbitrarily short reversals or physical timing accuracy, and sampled
counts are still not durations. See TRANSIT_TIMELINE.md. Items 2 and 4–6 remain
unaccepted/proposed; disputed rules are still withheld.

Implementation follow-up (25 October 2026): fix sequence item 1 is implemented
in `rashifal-gochar-4`: one calculated summary, nine deduplicated graha entries,
no career/money/relationships/wellbeing groupings, and expandable rule evidence.
The numerical engine is retained. Items 2–6 below remain proposed work. The
findings table records the audited pre-change state; its editorial `domains`
mapping has now been removed. All four app screens also share the platform header
and expose settings once, using the shared language preference.

25 October 2026. Scope: Rashifal, Kundli, Time Machine, matching, tradition
tools and their homepage card. This is a source-code audit, not independent
certification of astronomy, traditional rules or life-event predictions.

## Findings

| Output | Current implementation | Remaining gap |
| --- | --- | --- |
| Homepage Vikram Samvat, Amanta month, current tithi | Computed from the current instant by `frontend/home-calendar.mjs`, `packages/vedic/panchang.mjs` and `lunar-calendar.mjs`; Chaitra-year convention is explicit. | Regional calendar conventions and sunrise-based festival decisions are separate. The duplicate small tile has been removed; the full-width calendar card remains. |
| Rashifal planetary positions and houses for all twelve signs | `rashifal-service.mjs` calls the in-house astronomy/Lahiri/mean-node pipeline; `rashifal-transits.mjs` computes relative houses and favourable-house/Vedha classifications. Eight observations per day, 56 per week. | Sampling can miss changes between observations; counts are not hours or probabilities. Some rules are deliberately unresolved. |
| Rashifal paragraphs | `rashifal-library.mjs:editorialSections` formats computed houses, status counts, blockers and source verses using shared sentence patterns. This is calculated evidence rendered through text templates. | Repetitive technical reporting is not a complete daily interpretation. Native-language editorial review remains pending. |
| Career, money, relationships and wellbeing sections | The `domains` object in `rashifal-library.mjs` is a fixed editorial list of planets for each topic. The displayed numbers are calculated, but putting them under these headings is an editorial association. | There is no separate source-backed domain interpretation engine, conflict resolution, personal outcome calculation or validated topic score. The same planet appears under several headings and repeats text. |
| Kundli positions, Lagna, D1/D9 and Dasha dates | Numerical engines in `birth-positions.mjs`, `lagna.mjs`, `d1.mjs`, `d9.mjs`, `birth-divisions.mjs` and `dasha.mjs`, with input/boundary checks. Chart SVG and report HTML are presentation templates. | Calculated geometry and timelines do not supply a personal narrative forecast. Uncertain birth times and model acceptance limits still apply. |
| Panchang, birth calendar and annual observance candidates | `birth-panchang.mjs`, `panchang-observer.mjs`, `lunar-calendar.mjs` and `observance-rule.mjs` calculate quantities and apply a declared Amanta/first-sunrise/skip-missing policy. | Regional and family policies are not interchangeable. Sunrise/source acceptance remains open; candidates are not certified ritual dates. |
| Matching | `matching.mjs` applies explicit Ashtakoota component rules and lookup tables to calculated classifications. Tables are traditional rule data, not canned reports. | Composite school conventions and exceptions need independent review. Raw scores do not calculate marriage success or health outcomes. |
| Yoga / Mangal | `traditional-checks.mjs` and `rulebooks.mjs` evaluate stated geometric prerequisites. | Final Yoga/Dosha verdicts are withheld. Combustion, dignity, aspects, strength, cancellations and activation are not fully assessed. |
| Advanced divisions, Ashtakavarga and strength | `advanced-vargas.mjs`, `ashtakavarga.mjs` and `strength.mjs` implement candidate D7/D10/D12, raw BAV/SAV and Uccha Bala. | Full Shadbala is unavailable. Raw components must not be presented as a complete strength or outcome assessment. Individual algorithm review remains open. |
| Time Machine | `gochar.mjs` calculates snapshots, whole-sign counts and shortest signed angular differences between endpoints. | No continuous transit timeline, retrograde speed determination, aspects or Sade Sati engine is supplied by that endpoint difference. |
| Naming suggestions | `naming-data.mjs` maps calculated nakshatra/pada to a sourced 108-sound table, then filters an explicitly curated list of **two names**. Meanings are sourced editorial content. | Not a comprehensive name generator. Names and meanings require a larger reviewed dataset, not astronomy calculations or invented glosses. |

Frontend paths in the table are relative to `apps/rashifal-kundli/`.
No random prose, sign-name substitution or four-group reflection compositor drives
the current Rashifal. Shared wording can still look similar because it describes
the same rule vocabulary and repeats planets across topic sections. Different
signs can also legitimately share an individual classification.

## Fix sequence and acceptance criteria

1. **Make the reading understandable first.** Replace duplicated topic paragraphs
   with one concise summary and a deduplicated planet breakdown. Until topic rules
   are accepted, present these as general transit observations. Keep source-linked
   numerical evidence available. Verify no unsupported money, relationship or
   wellbeing outcome is inferred from a planet's generic favourable-house status.
2. **Complete the declared Rashifal rulebook.** Resolve Mercury H11 transcription
   differences, nodal Vedha scope and blocker conventions through documented
   edition comparison and independent traditional review. Keep disputed results
   withheld until resolved. Version the chosen rules and test every membership,
   blocker, exemption and boundary case against retained reference cases.
3. **Calculate change times.** Add bracketed, refined sign-ingress and rule-state
   change searches with explicit tolerances and date-range limits. Handle boundary
   uncertainty and possible multiple crossings. Verify before/at/after fixtures
   and Worker parity before showing time windows or durations. Retain sampled
   labels until this exists; do not turn observation counts into percentages.
4. **Add domain interpretations only with explicit rules.** Each proposed claim
   needs a source, required calculated inputs, exclusions, contradiction policy,
   uncertainty behavior and reviewed en/hi/gu text. Implement missing prerequisites
   such as aspects, combustion or motion only where the selected rule requires
   them. Test counterexamples as well as positive cases. Do not invent weighted
   scores to make each sign look different.
5. **Keep personal forecasts a separate feature.** Current Rashifal accepts a Moon
   sign, not a private birth chart. A personal reading would require consented
   in-memory chart inputs, birth-time uncertainty, Dasha/transit combination rules
   and separate validation. Do not silently label general transits personalised.
6. **Close other feature gaps independently.** Expand the reviewed name dataset;
   accept a documented matching school; complete individual advanced algorithms
   and any proposed full-strength method before enabling their final verdicts.
   Preserve the existing unavailable states until each is actually implemented.

For each release, retain numerical reference fixtures, per-rule positive/negative
cases, all-twelve-sign checks, period-boundary checks and native-language review.
Astronomical agreement and internally consistent traditional rules cannot establish
scientific accuracy of predictions about a person's life.

## Existing evidence

- [Current Rashifal calculation contract](RASHIFAL_CALCULATION.md) and its retained
  generated `RASHIFAL_CALCULATION_RESULTS.json` cover the implemented transit scope.
- `P03_EVIDENCE.md` and `P04_EVIDENCE.md` describe numerical reference comparisons.
- `packages/vedic/release-policy.mjs` retains open acceptance gates; the public
  deployment remains a verification preview.

The original audit change removed the duplicate homepage tile. The follow-up
implements item 1 above; remaining items must not be represented as implemented.
