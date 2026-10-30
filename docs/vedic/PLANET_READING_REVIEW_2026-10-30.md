# Planet-based reading review

30 October 2026 (IST). Scope: the Rashifal, Kundli and matching readings in
Ritvayam. Public product pages and technical references were reviewed; no real
birth details were submitted to another service. All new prose is original.

Production release: implementation commit `e1b117a` deployed on 31 October 2026
as Worker `d667f36f-dbda-42b0-a5b3-ed3ab4f16d09`. All five live public Vedic Chrome
workflows pass, including native printable exports and private saved inputs.
See `docs/ORGANISATION_PRODUCTION_CUTOVER.md` for release evidence.

## Research and decisions

| Reference | Observation | Decision for Ritvayam |
| --- | --- | --- |
| [Drik Panchang Kundali](https://www.drikpanchang.com/jyotisha/kundali/kundali.html) | Exposes ayanamsha, graha and bhava details, sign rulers and planetary placements. | Keep the existing declared Lahiri/whole-sign conventions and explain the actual placement behind each reading. Do not silently switch conventions to match another product. |
| [AstroSage reading guide](https://www.astrosage.com/kundli/how-to-read-kundli.asp) | Presents chart interpretation through houses and planets. | Kundli narrative must use the house ruler's actual natal house/sign and occupants, rather than stopping at its generic planetary theme. |
| [AstroSage matching](https://www.astrosage.com/freechart/matchmaking.asp) and [Prokerala sample report](https://api.prokerala.com/reports/sample/guna-milan-en.pdf) | Present the eight differently weighted Ashtakoota factors. | Explain all eight calculated checks, identify their actual inputs, and keep the points distinct from a complete two-chart interpretation. Do not adopt marriage-success, health or fertility claims. |
| [Telugu Calendar method](https://thetelugucalendar.com/marriage-matching/method/) and [Drik Varna definition](https://www.drikpanchang.com/tutorials/jyotisha/kundali-match/ashta-kuta/varna-kuta.html) | Explicit lookup direction and school variants matter. The published method includes alternative Vashya/Yoni conventions. | Preserve the named composite rulebook, A/B axes, directional tables and raw score. Display classification alternatives even when their score remains unchanged. |
| [Astronomy Engine upstream](https://github.com/cosinekitty/astronomy) | States an approximate one-arcminute design target and independent reference comparisons. | An upstream target is not a measured application-wide guarantee. Retain pinned engine and existing measured reference fixtures. |
| [JPL Horizons manual](https://ssd.jpl.nasa.gov/horizons/manual.html) and [Swiss Ephemeris documentation](https://www.astro.com/swisseph/swisseph.htm) | Reference frame, apparent/geometric track, time scale, ayanamsha and node convention affect comparisons. | Numerical regression must use like-for-like retained fixtures. Other apps' prose and displayed scores alone cannot certify numerical or predictive accuracy. No new ephemeris dependency is introduced. |

The Raman PDF linked by the existing rulebook timed out in this review. Its
earlier retained evidence remains the source of the existing Yoni table; no new
claim of having independently rechecked that edition is made.

## Implemented

- **Kundli:** `kundli-prose-4` incorporates admitted ruler house/sign and actual
  occupants into the visible topic prose and the existing privacy-filtered report
  export. Dasha prose also identifies the natal house/sign of the major and minor
  lords when D1 is available. House connections use existing authored house
  symbolism. No new aspect, strength or event-prediction rule is implied.
- **Matching:** all eight components have localized explanations of their actual
  factors, method and result. Stable points with multiple possible classifications
  no longer imply a single certain pair. A separate, consented chart-context
  section shows each person's seventh house/ruler and Venus/Mars placements, using
  the existing conservative D1 admission screen. An unavailable D1 context does
  not discard an available Moon-based score. No extra points, adjusted total,
  final Manglik status or marriage verdict is added.
- **Rashifal:** the visible reading now explains the sampled Moon and selected
  supporting/obstructed planet placements, grouping houses by their actual rule
  status and identifying blockers only from obstructed observations. Moon-relative
  houses are explicitly distinguished from personal Ascendant houses. Sample
  classifications are never described as continuous durations or probabilities.
- **Languages/privacy:** English, Hindi and Gujarati use the same calculated
  projections. No runtime AI service, network transmission of birth inputs,
  new persistence, account, API or schema is introduced. Existing clear, revocation,
  expiry, private printing and optional saved-input behaviour remain applicable.

## Accuracy boundaries and follow-up

This release improves the correspondence between prose and calculated factors;
it does not change astronomical positions, 36-point tables or Dasha dates.
The existing source/independent-review gates remain open. Astronomical agreement
does not establish scientific accuracy of personal predictions.

Full chart synthesis still needs individually documented aspect, dignity,
combustion, strength, cancellation, Navamsa and combined Dasha/transit rules, plus
counterexamples and qualified traditional review. Do not infer those assessments
from displaying placements. Native sentences are checked for completeness and
script consistency; independent Hindi/Gujarati editorial review remains pending.

Verification completed 31 October 2026: 21 focused checks, 11 Chrome workflows
and the final organisation-mode build pass. The full suite passed 585/586;
the sole packaging file-count assertion passed on isolated rerun after removing
the overlapping-build condition. The retained 25,116-row JPL comparison passes.
Native Kundli, matching and dark Rashifal screenshots were visually reviewed.
Detailed evidence and the production deployment status are maintained
in `docs/FUNCTIONALITY_LEDGER.md`.
