# Kundali and Rashifal language review — 26 October 2026

The request was to generate Hindi/Gujarati Kundali, check calculation accuracy,
and make both readings sound natural and feel organised.

## Calculation review

The offline reference/calculation suite passed 58 checks spanning astronomy,
sidereal conversion, Lahiri conventions, Lagna, Navamsa, Dasha, Rashifal and its
outlook projection. Existing independent JPL fixtures comprise 25,116 vector
comparisons across the retained geometric/apparent tracks. Reproducing
P03_REFERENCE_RESULTS.json gives a maximum angular separation of 22.467118
arcseconds under that comparison's frames, dates and corrections. This is a
sampled engineering comparison, not a universal error bound or certified Kundali.
ERFA transformation/Lagna references and rational Dasha fixtures also reproduce.
No numerical kernel, birth inputs, timezone conversion, planet positions, chart
values, boundary withholding or Dasha dates were changed for this language work.

The existing acceptance status remains internal candidate. Source, convention,
sunrise and full classical-interpretation limitations are not waived. Correct
astronomical positions do not validate personality or future-event predictions.

Reference context:

- [JPL Horizons manual](https://ssd.jpl.nasa.gov/horizons/manual.html)
- Local retained comparison: P03_REFERENCE_RESULTS.json
- Existing source/acceptance records under docs/vedic and tests/fixtures/vedic-*

## Changes

- kundli-reading-prose.mjs owns versioned, complete en/hi/gu topic sentences,
  shared by the screen and exported report. Personality retains admitted Moon/
  rising-sign themes, career/resources retain the calculated house ruler, and
  relationship/learning/home guidance describes the actual house sign's element.
  These are original traditional/editorial associations, not new calculations
  of aspects, strength, profession or event timing.
- Removed concatenation of a topic prefix with an unrelated complete personality
  sentence. Context about house rulers and technical limitations is available
  in each topic's evidence disclosure; practical actions have consistent styling.
- Redacted and explicitly identified reports now include all seven everyday
  topics in the selected language before the existing numerical sections. The
  projection copies only display text and retains existing identity opt-in.
  No birth name/place/time is added to the everyday projection. Chart-derived
  material can still reveal birth information, as the existing export warns.
- Rashifal puts artwork and the main headline in a dedicated row, followed by
  full-width paragraphs. Mixed-period paragraphs remain separate instead of
  being concatenated. Work/money/relationships use aligned topic cards; the
  single practical action and technical disclosure retain their hierarchy.
- Shared header remains the sole language/theme control. No AI API, external
  birth-data submission, additional preference or dependency was introduced.

Verification results and production release evidence are in FUNCTIONALITY_LEDGER.md.

## Consultation prose revision (26 October, evening)

`kundli-prose-3` replaces the earlier vocabulary tables with authored
English/Hindi/Gujarati consultation paragraphs. Nature, presence, career, money,
relationships, learning and family use complete sentences; career no longer
repeats an unrelated sign-personality paragraph. Repeated tip boxes are removed.
Dasha cards identify their actual major/minor lords and give a complete reading
rather than two keyword lists. Screen and printable life topics share one
composer. No LLM endpoint, birth-data transfer, calculation change or new
classical assessment is introduced. Existing uncertainty and method statements
remain. This is an editorial voice revision, not a claim of pandit authorship
or independent linguistic/classical certification.
