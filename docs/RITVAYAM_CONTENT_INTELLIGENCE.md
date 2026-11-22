# Ritvayam content intelligence audit

2026-11-23. Audit before implementation.

## Current flow and root cause

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
