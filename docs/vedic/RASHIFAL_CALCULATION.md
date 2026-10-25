# Calculation-backed Rashifal

25 October 2026. Supersedes the four-group P12 reflection compositor. P12's
original reference report is retained as historical evidence, not a current
interpretation specification.

## Calculation contract

`packages/vedic/rashifal-transits.mjs` uses the existing in-house astronomy and
sidereal adapters for all seven physical grahas and mean Rahu/Ketu. It calculates
00:00, 03:00, 06:00, 09:00, 12:00, 15:00, 18:00 and 21:00 IST, for each daily
period or all seven Monday–Sunday dates. Each of the twelve selected Chandra
Rashis has its own whole-sign counts, rule outcomes and evidence. No randomly
varied sentences, sign-name substitution or hashes generate interpretations.

The public request remains sign + period + language + explicit rule/profile
version; birth fields are rejected. Generic sky dates are reused in a bounded
56-day memory cache; 120 reading entries separately key sign, locale, day/week,
rule version and sampling model. Clear removes both caches. No new database,
API, account, geolocation, birth storage or external runtime service is introduced.

## Traditional rule scope

Source: Mantreswara, Phaladeepika 26.1–8, numerical favourable-house and Vedha
rules. The implementation owns original explanatory text; it does not reproduce
the translation's predictive prose. Reference editions:

- [1950 V. Subrahmanya Sastri transcription](https://www.wisdomlib.org/hinduism/book/phaladeepika-by-mantreswara-text-and-translation/d/doc1621598.html)
- [Sanskrit/transcription cross-check](https://vedicreader.com/s/shl?s=2c4c239e57b)

Favourable membership and obstruction are evaluated independently at each
observation. Sun/Saturn and Moon/Mercury exemptions apply in both directions.
The chosen obstruction convention includes all nine grahas; this convention is
explicit and awaits independent traditional review. No reverse Vedha is inferred.

Mercury's H11 blocking house differs between the transcriptions (H11/H12), so
its final favourable classification is **unresolved**, not silently repaired.
Nodes use the 26.2 membership list but have no inferred Vedha table; favourable
node placements likewise have no final assessment. A planet within the existing
61-arcsecond sign screen is uncertain. A near-boundary possible blocker prevents
a clear supportive finding; a definite blocker is reported directly.

Outcomes distinguish supportive, obstructed, outside the listed favourable
houses, uncertain and rule-unresolved. Outside the list is not a prediction of
harm. Aspects, retrograde strength, combustion, Ashtakavarga, Dasha and personal
birth-chart predictions are not assessed. Topic groupings are editorial navigation,
not classical domain scores. Raw counts are neither probabilities nor durations.
Three-hour sampling does not certify every crossing or intra-step reversal.

## Evidence and limits

The runtime astronomy is the retained MIT Astronomy Engine analytic model with
our explicit frame, Lahiri and mean-node adapters. Existing P03 retained JPL
references cover 25,116 rows and fourteen body/correction tracks; P04 verifies
ERFA formula values and published Lahiri anchors. These independent numerical
fixtures are rerun; Worker parity separately checks delivery consistency. They
do not establish scientific life-event predictive accuracy or complete ephemeris
accuracy at all instants. Existing astronomical acceptance warnings remain.

Rule tests cover all 108 graha/house memberships, every resolved Vedha pair,
exemptions, unresolved rules and possible boundary blockers. All twelve signs
are compared across three dates and daily/tomorrow/weekly periods; each has its
own numerical house vector and calculated content. Service tests cover stable
localisation IDs, period rollover, immutability, cache bounds and invalid inputs.
Browser tests inspect all signs, nine-row evidence tables and 8/56 observation
choices. New reproducible composition report:
`RASHIFAL_CALCULATION_RESULTS.json` via `node infrastructure/verify-vedic-rashifal.cjs`.
It is implementation evidence, not independent human rule approval.

General-release traditional/translation review is still pending. The app remains
an explicit verification preview and must not be advertised as a certified or
scientifically accurate predictor of personal outcomes.
