# Ritvayam content intelligence audit

2026-11-23. Audit and implementation history. The latest capability status below
supersedes the earlier audit's narrower D1/seventh-aspect-only boundary.

## Combined natal and period reading (2026-11-23)

### Authorised staged continuation: phase 1 — natal motion and combustion

Implemented `packages/vedic/planet-condition.mjs` as an additive feature, without
rewriting existing longitude/chart/dasha kernels. Seven physical bodies are
sampled at -60/-30 minutes, -30 seconds, the recorded instant, +30 seconds and
+30/+60 minutes. The five applicable planets use apparent geocentric tropical
longitude rates: backward/forward one-hour and symmetric half-hour differences.
Wraparound is handled. Disagreeing signs or a rate interval including zero are
near-station/unresolved, not an asserted exact station or full Chesta Bala.
The rate interval is a sampled screen, not a certified derivative error bound.

Combustion uses shortest longitudinal Sun separation. The declared Phaladeepika
2.36 commentary convention uses Moon 12°, Mars 17°, Jupiter 11°, Saturn 15°;
Mercury direct/retrograde 14°/12° and Venus direct/retrograde 10°/8°. An unresolved
direction retains both applicable thresholds. Recorded-minute samples and the
existing proposed positional guard produce an interval: a boundary overlap stays
uncertain. This does not calculate physical visibility, rise/set or eclipses.
Sun receives no combustion class; nodes receive neither of these physical-body
judgements. The convention is explicit, not an assertion that every school agrees.

Only admitted exact-time D1 inputs receive these birth conditions. Unknown or
approximate inputs and unavailable coverage remain withheld. A bounded 24-entry
memory cache uses birth instant/profile, never identity. Validation recomputes
all rows from the retained samples and compares center positions and timestamp
against natal data; forged direction, status, threshold or date is rejected.

Main topic and period prose now explains relevant natal motion/solar distance.
Confirmed combustion adds a review factor; competing sign/D9 support stays mixed.
Uncertain or absent qualifiers cannot establish the current-support category.
Retrograde status alone is neither a weakness nor a success/Chesta-Bala score.
Health remains non-diagnostic. Main reader, technical appendix and Hindi export
share the qualified context. Detailed seven-body values stay in the closed basis.

Twenty targeted tests pass: all six threshold boundaries, both Mercury/Venus
motion conventions, wraparound, stations, malformed observations, the NASA
2019-11-11 Mercury transit conjunction anchor, real station-neighbour samples,
coverage failure, forged evidence, unknown-time gating and existing reports.
The Swiss Ephemeris indexed station listing was consulted, but its full PDF was
blocked by the source's browser check; this is not full external ephemeris
acceptance. Astronomical/traditional expert review remains pending.

Next stages remain separate: (2) named Yoga/Dosha predicates, qualifications and
cancellations with explicit rule variants; (3) a complete selected Shadbala
method and independent numeric references; (4) continuous personal transit
windows with period relevance, without invented event promises; (5) independent
traditional/Hindi acceptance and translated parity. Phase 1 does not complete
those stages. Earlier phase boundaries below are historical where superseded.

Hindi chapters now lead with an original topic-specific conclusion instead of
concatenated placements. A pure app-owned synthesis module combines admitted D1
ownership/occupancy, classical full whole-sign aspects (including Mars/Jupiter/
Saturn), own/exalted/debilitated signs, admitted D9 dignity and same-sign D1/D9
comparison, mutual sign exchange geometry, and actual major/sub-period links.
Rahu/Ketu receive no invented special-aspect or dignity convention. Sign dignity
is not full Shadbala; exchange geometry is not a qualified Yoga verdict.

Current transits are calculated at the report's explicit timestamp with the
existing sidereal engine, relative to the admitted stable natal Moon. Existing
transit/vedha rules are reused without modification; no manually chosen general
Rashi report is substituted. Each row also retains the natal-Lagna sign count in
the technical appendix. Missing stable D1/Moon, unsupported dates or unavailable
calculation withhold this input. A bounded 12-snapshot memory cache contains no
identity. Preview D9/D1 never enter synthesis.

The combined judgement separates natal-only, active-but-ungraded, current support,
review and mixed evidence. Current support requires a direct period relationship
and a supportive current transit of the topic's primary ruler; it never follows
from a good transit alone. Conflicting dignity/D9/transit factors remain mixed.
These are declared editorial categories, not probability or complete strength.
Period topics are ordered by declared ownership/occupancy/aspect relevance, not
predictive confidence. The overview and conclusion avoid repeating the same
primary house as several independent headline factors. Future period summaries
use their own lords and exact computed boundaries; the current transit snapshot
is never extended across a future period or labelled continuous event timing.

The health chapter explains habits/routine symbolism and explicitly states that
specific disease likelihood, risk percentages and freedom from disease cannot
be derived. It does not convert a sixth-house contact into a medical assessment.
No clinical diagnosis or treatment recommendation is generated.

Evidence validation recomputes full aspects, synthesis factors, period-topic
connections and transit classification/reference/time from the supplied snapshot.
Forged context and clinical prediction phrases fail validation. The same validated
chapters reach the on-screen reading and Hindi export. No remote AI calls, birth
data transfer, schema migration or saved-record mutation.

Combined-reading release verification before phase 1: 16 targeted tests pass,
covering hand-checked full-aspect/dignity
reference cases, competing D9 evidence, supportive versus obstructed current
signals, exact dasha boundaries, all 12 general Rashis, multiple birth charts,
unknown/approximate time, withheld previews, forged evidence and export parity.
These are software checks, not external acceptance of predictive accuracy.

Still not implemented in this reading: complete Shadbala, qualified Yoga/Dosha
and cancellation judgements, full motion-strength qualifications, D10/D16-based
life-outcome synthesis, continuous personal event windows, monthly/yearly general
Rashifal, independent traditional/Hindi review and English/Gujarati synthesis
parity. The earlier Lal Kitab/KP/Varshaphal/36-year backlog remains deferred.
The original astronomy engine and existing English/Gujarati fallback are retained.

Rule comparison: Phaladeepika chapter 1 sign dignity and full-aspect convention,
chapter 3 divisional context, and the existing chapter 26 transit table. Source:
https://www.panchanga.lv/wp-content/uploads/2020/06/Phaladipika_Shri-Mantreswara.pdf
Modern topic prose and combined editorial categories are authored here; they are
not claimed to be translations, externally reviewed rules or medical evidence.

## Original audit (historical): flow and root cause

Birth form -> reviewed civil/place input -> browser `calculateBirthReport` ->
independently admitted positions/D1/D9/dasha -> `buildKundliReading` -> local
`composeKundliTopic`/period templates -> `mountKundliReading` and export.
There is no interpretation API or external AI completion in this path. Saved
kundalis retain consented input locally; report models are recomputed. Nishi is
disabled in production and does not generate these narratives. No prompt or
token-output limit is truncating the current reading.

| Suspected cause | Finding |
| --- | --- |
| Missing adapter data | Yes: most chart relationships never entered prose |
| Weak rules / combination analysis | Yes: mainly independent sign/house selections |
| Prompt or token truncation | No runtime generative provider or prompt in this path |
| Narrative/organisation | Short cards and concatenated placement statements |
| Validation | Existing calculation guards strong; narrative trace/duplicate checks absent |
| Repeated static content | Shared element/planet paragraphs without cross-topic deduplication |
| Incorrect cache reuse | No demonstrated defect; retain and extend version keys |

The old reading adapter retains Moon/Lagna, six selected house/ruler placements
and only three future antar periods. Its prose chiefly selects a sign/element
paragraph and concatenates planet placements. It does not combine house
ownership, shared lords, conjunction context or differing Moon/Lagna themes.
The UI then exposes several short standalone cards. Export uses the same older
composer. This is information reduction/rule/composition structure, not evidence
that the astronomical engine should be rewritten.

Rashifal is separate: selected Moon sign and IST date -> worker/local service ->
eight real transit samples per day, source-table favourable/vedha classification,
computed timeline changes -> authored sections/outlook/story -> browser UI.
It supports today/tomorrow/weekly only. Its bounded cache keys already include
date, sign, language, profile and model versions. No monthly/yearly calculation
contract exists; do not rebrand a daily snapshot as annual coverage.

Birth D1 admission is conservative; nominal previews are not admitted readings.
Unknown/approximate times must not acquire invented houses. Existing full
Shadbala, retrograde/combustion, final Yoga/Dosha judgements and qualified natal
transit activation are not inputs to this report. Optional advanced panels do
not establish a complete strength/combination judgement. Their absence must
remain explicit. External astronomical/traditional acceptance is still pending.

## Implemented architecture boundary

Add an app-owned, pure adapter; editable JSON editorial/rule data; factual
whole-sign relationship evaluation; combination/conflict findings; topic
prioritisation; deterministic Hindi composition; quality validation; bounded
versioned in-memory cache; and existing-view/export integration. No kernel,
saved-input schema, organisation database or API authentication changes.

A finding records ID/topic, exact supporting snapshot, rule/source scope,
modifiers, support/conflict IDs, editorial importance (not scientific confidence),
period, review status and limits. Narrative paragraphs reference finding IDs.
No model may create a body, house, Yoga, date, medical or financial prediction.
Missing evidence withholds the affected section rather than inventing prose.
Narrative version, JSON rules, snapshot and language enter the fingerprint;
no names or raw birth details are logged or persistently cached.

Verified-source scope is deliberately small: Phaladeepika chapter 1 house-topic
associations and chapter 4.9 seventh-sign aspect convention. Original modern
Hindi counselling/appearance/personality composition remains editorial and
independent traditional/Hindi review pending. Same-sign conjunction is labelled
whole-sign co-location, not a degree-orb conjunction or Yoga. No disease,
complexion/measurement, relative's behaviour, lifespan or promised event is inferred.

Source comparison: https://www.panchanga.lv/wp-content/uploads/2020/06/Phaladipika_Shri-Mantreswara.pdf
(chapter 1 house definitions, chapter 4.9; existing repository reference).
Only concise rule facts are reused; the modern translated prose is not copied.

## Compatibility and pending work

Retain existing English/Gujarati readings and chart workspace; enhanced narrative
is Hindi-first. General Rashi transits are never passed as personal natal facts.
The existing full technical charts, dashas and export controls remain available.
No paid provider, remote rewriting, birth-data logging or new database migration.
AI requests/tokens/retries are zero; deterministic local generation is the fallback
and normal path. A future optional AI rewrite must consume validated findings and
pass the same constraints, with separately reviewed privacy/budget/time limits.

Monthly/yearly Rashifal requires an admitted long-range sampling/event contract,
not padded daily copy. Full aspects, strength, qualified yogas, precise natal
transits and source-reviewed life-outcome rules remain pending. Earlier deferred
Lal Kitab, KP, Varshaphal and 36-year chakra remain out of scope. Source-checked
symbolic associations are not scientific validation of prediction.

## Implemented contracts and editorial workflow

`jyotish-adapter.mjs` projects admitted D1, exact planet positions and existing
computed major/sub-period intervals. It never consumes nominal previews as
stable natal facts. `jyotish-content.json` holds topic priorities/house selections,
original Hindi framing/practical text, planetary editorial themes and supported
combination pairs. Editors can revise these data without changing application
logic; increase its version, keep source/review scope honest, then run the tests.
Adding a new astronomical/traditional predicate still requires reviewed code and
reference cases; arbitrary prose does not create a validated Jyotish rule.

`jyotish-intelligence.mjs` evaluates house ownership, occupants, seventh-sign
relationships and shared lords, then evaluates a small declared set of mixed
editorial themes. It suppresses duplicate paragraphs and retains shared-factor
chapter references instead of counting the same factor as several assurances.
Each finding stores evidence, rule/source scope, modifiers, support/conflict IDs,
importance, actual period, Hindi interpretation, verification and limitations.
Importance controls presentation only, never a predictive probability.

`jyotish-finding.schema.json` is the machine-readable contract; its used subset
(type, required/properties, enum, items, minLength and numeric bounds) is validated
locally. This is not advertised as a complete general-purpose JSON Schema engine.
Additional quality checks compare evidence/ownership/aspects and period lords/
boundaries against the snapshot, require finding links, reject exact duplicate
paragraphs and selected prohibited certainty/diagnosis phrases. These structural
checks do not certify language quality or detect every possible unsafe paraphrase.
Affected chapters are withheld on failure; calculation data is never rewritten.

The immutable in-memory cache is limited to 24 reports, fingerprinted by actual
snapshot, full rule content and narrative version; it is not a new database.
Rashifal retains its existing bounded service/worker cache and adds the actual
editorial-data digest to its version. There are no prompt calls, tokens, provider
retries, remote timeouts or birth-data logs because remote generation is absent.

The Hindi reader has fourteen ordered chapters when admitted evidence exists,
including appearance/presentation, personality, education, work, resources,
relationships, family, wellbeing symbolism, home/travel, values, chronological
stages and current/upcoming periods. Stage age windows are editorial, use existing
major-period overlap, and do not assert milestones or lifespan; the final window
ends only where the supplied arithmetic timeline ends. Unknown times get one
availability notice rather than fourteen copies. The Hindi `फलादेश` entry is a
primary compact action. Charts remain immediately available and retain selection.
Detailed numeric/rule evidence follows in one expandable appendix. Hindi export
uses the same validated chapters before technical tables and carries finding
references afterward. Redaction and consented saved-input formats are retained.

`jyotish-rashifal.mjs` creates separate general Moon-sign findings from existing
graha observations, relative-house themes and supportive/obstructed/uncertain
classes. It composes date/period-specific daily and weekly Hindi sections. Sample
counts, rule IDs and actual transit tables stay in the technical basis; counts
are neither probabilities nor continuous duration. Birth dashas are never added
to a general Rashi report. Existing English/Gujarati prose remains available.

## Verification and remaining acceptance

### Authorised continuation: phased delivery (2026-11-23)

1. Reading consistency and evidence integrity: implemented. Injected editorial
   rules now reach house themes, chronological stages, period interpretations and
   review status consistently; narrative version is bumped to invalidate caches.
   Validation also rejects forged co-location, modifier/support links and missing
   period placements/ownership. Eleven focused regression tests pass, including
   edited-knowledge propagation and five additional adversarial mutations.
2. Monthly/yearly general Rashifal: pending. First extend the period contract and
   bounded transit sampling with explicit coverage tests, then add summaries and
   controls. Do not stretch seven-day samples into a year or label this Varshaphal.
3. Richer natal synthesis: pending. Admit separately verified aspect/strength/Yoga
   capabilities before interpreting them; personalised transits require their own
   natal-to-transit evidence contract and birth-time uncertainty handling.
4. Editorial acceptance and language expansion: pending independent Jyotish/Hindi
   review, then reviewed English/Gujarati parity. Software tests cannot grant
   traditional or linguistic expert acceptance.

Lal Kitab, KP, annual Varshaphal and the 36-year cycle remain the separately
deferred backlog. This continuation does not reopen those systems implicitly.

Ten focused tests pass: six distinct birth-time charts (at least four ascendants),
all twelve rising-sign house traces, actual dasha transition boundary, unknown/
approximate/missing inputs, immutable engine output, modified-rule/date cache
invalidation, zero-provider generation, adversarial finding/narrative validation,
all twelve Rashis on two dates, seven-day/56-sample weekly scope, unsupported
yearly rejection, and matching/redacted Hindi narrative-first export. These are
synthetic regression cases, not independently expert-reviewed predictive cases.

Independent traditional/Hindi editorial review is required for all new modern
interpretation text. No height/complexion measurements, clinical diagnoses,
lifespan, guaranteed marriage/wealth/job dates, religion or relatives' actual
behaviour are inferred. A rich section is not an assurance of accuracy. Partial
strength and geometric Yoga panels remain separate; no missing qualifiers are
filled by AI. Full monthly/yearly timelines, full aspect/strength/Yoga synthesis,
qualified natal transits and broader translated narrative expansion remain future
work with their own evidence and acceptance requirements.

Changed-file groups: adapter, editable JSON knowledge and finding schema,
intelligence/cache/quality engine, separate Rashifal composer, Hindi reader,
existing reading/service/view/export integration, theme-token CSS, focused tests
and this audit. No persistence schema, API access-control or kernel changes.

Chrome verification passes nine Hindi viewport/theme cases at 360/390/768px
in light/dark/deep black, all fourteen chapters, chapter-heading visibility below
sticky navigation, evidence disclosure/focus, north-chart house selection,
unchanged saved-input bytes, English/Gujarati fallback, fourteen-section report
preview, and actual distinct Rashi rendering. Final mobile screenshots inspected.
The browser uses an isolated profile/database and blocks non-GET API calls.
The production bundle exports 755 assets. Full astronomical/expert acceptance
and semantic review are not implied by these software regression checks.
