# P12 Rashifal editorial preview

Date: 2026-10-24 (Asia/Kolkata). Internal implementation only. Readings are
project-authored editorial drafts, not published predictions or a release pass.

## Factors and editorial convention

`packages/vedic/rashifal-factors.mjs` owns bounded IST day/tomorrow/Monday–Sunday
period selection and the sidereal Moon at 12:00 IST (06:30 UTC) for each date.
It reuses P04 unchanged and counts whole signs from the manually selected Chandra
Rashi: `(moonRashi-referenceRashi+12)%12+1`. This is neither a birth chart house
calculation nor a western tropical Sun sign lookup. No birth details are inputs.
Near-Rashi-model-boundary noon snapshots withhold the reading; they do not trigger
a plausible substitute. A weekly reading uses seven noon samples, not continuous
transit tracking or a claim that Moon sign remains fixed all day. Full period
coverage is required within pinned 1950..2098 civil rules; edge weeks/tomorrow
that exceed coverage are unavailable. Package/lock 0.12.0 adds this module only;
prior numerical rules remain unchanged and no dependency is added.

App-owned `rashifal-library.mjs` is versioned `rashifal-reflections-1`. Twelve
explicit relative-sign positions map to four original editorial groups. Each
group has five unique prompts (overview/career/money/relationships/wellbeing):
20 English baseline prompts plus 20 Hindi and 20 Gujarati draft translations.
Weekly groups rank by sampled-day count, then a fixed group order, and select
up to three distinct groups. Sentence IDs are deduplicated. There is no random
selection, horoscope scraping, runtime text generation, luck score, medical
outcome, investment forecast or serious-life-event prediction.

The [Brihat Jataka primary Sanskrit text, chapter 1 verse 15](https://sanskritdocuments.org/doc_z_misc_sociology_astrology/brihajjAtakam.html)
provides historical context for house vocabulary only. Its website's usage
restrictions are respected: no source text, translation or file is copied into
the product. The initial incorrectly cased URL failed; the correct indexed
primary-text URL was found. A separate historical scan request timed out; no
scan/raw-page artifact or fabricated hash is claimed. The four thematic groups,
neutral reflection prompts and applying them to noon Moon signs are explicitly
project editorial choices, not a classical transit algorithm attributed to the
verse. Source identification never certifies a reading or its scientific value.

All baseline text remains a draft awaiting independent editorial review. The
authored Hindi/Gujarati reading translations are stored with review status and
are not silently presented as approved. RF-10 fallback renders English with an
explicit translated explanation and `lang=en`; UI controls, sign names and
category labels support en/hi/gu. Real native reading publication under RF-09
remains gated by independent translation review. No pending review is labelled
passed. Custom templates cannot be selected through unvalidated user fields.

## Composition, cache and publication semantics

`rashifal-service.mjs` validates only rashi/view/language/ruleVersion/profile and
explicit current time. Birth/name fields, accessors, invalid signs/locales and
unknown rule/profile IDs fail safely. Generic reading cache keys contain canonical
editorial date, daily/weekly period, Rashi, requested language, rule version,
profile and factor model. Today and tomorrow that resolve to the same day share
a daily cache entry. The per-service memory caches cap at 120 readings and 56
date/profile factors. Cached records are deeply frozen. There is no shared HTTP,
CDN, database or private calculation cache. Requested locale stays in the key
even when its content falls back to English.

Responses expose editorial date/period, catalogue date, draft publication status,
null publishedAt and actual retrieval timestamp. The catalogue date is not
misrepresented as a historical daily publication time. Why-this-reading includes
all noon factors, relative signs/groups, selection counts, rule/model/profile,
source/context and inherited warnings. It does not hide P04 source acceptance.

## Local UI and privacy

`rashifal-view.mjs` provides all twelve symbols/names, English Rashi transliteration
with zodiac equivalent, translated manual selection, Today/Tomorrow/This week,
five sections and accessible source details. It explains Chandra versus tropical
Sun signs, draft state and traditional interpretation rather than scientific
prediction. Native controls, 44px targets, shared theme tokens and mobile layouts
are used. Visibility/history restoration and a minute timer refresh a changed
IST day (within one minute while active); pending renders cancel on clear/destroy.
Same-day refresh does not repeatedly close source details.

Only explicit opt-in stores `{version:1,rashi}` in `synapse-vedic-rashi`.
Invalid records are discarded; clear removes both preference and memory cache.
No birth date, time, place, name, URLs, analytics, geolocation, external requests
or server writes are used. The shared theme owner is preserved. This standalone
preview never imports the birth form or its private report. Public preference
storage does not change the P09 birth-memory policy.

`node infrastructure/preview-vedic-rashifal.cjs` serves only loopback port 4179
(optional numeric port). The shared preview harness adds its fixed CSS/entry
allowlist, no-store and connect-src none. Existing chart/birth previews remain
separate. No public app/card/static route, account/schema/data, Ritual Assist,
provider connection or production deployment is added.

## Verification

Six focused Node checks pass, covering IST/UTC midnight, tomorrow/year/leap day,
Monday weeks/coverage bounds, all twelve relative-sign counts, all three periods,
five sections/deduplication, canonical bounded immutable caches, safe private-field
rejection and explicit translation fallback. Actual local workerd parity passes
13 requests across twelve signs/three locales plus a cache hit: 440 numeric
comparisons, zero difference; 85,951-byte minified bundle excludes birth/place
data. This is runtime parity, not new astronomical goldens or production CPU
evidence.

Initial focused Chrome suite 14/14 passes (P07–P11 twelve plus two P12). Final
three editorial checks add IST-midnight refresh, preference validation/clear,
source factors and language parity, explicit English fallback, privacy and
320/390/1440px light/dark/system overflow checks. Mobile English reading inspected.
The saved P12 report checks 108 sign/period/locale compositions, prompt selection
and implementation hashes; it is deterministic-consistency evidence, not human
editorial acceptance.

Full isolated repository suite **484/484 passed**, zero failures, 224.098s
(`.publish/vedic-p12-full-tests.log`). It includes six new Node checks and one
actual workerd check. Full tests had permission for the generated build hook;
no live-data test or deployment occurred. Focused logs:
`.publish/vedic-p12-focused.log` (6/6), `vedic-p12-worker.log` (1/1), and
`vedic-p12-browser.log` (14/14, 1.5m). The final P12-only rerun after transliteration,
day-refresh and source-detail refinements passes 3/3 in 12.6s
(`.publish/vedic-p12-editorial-verified.log`), including the added midnight check.
Thus fifteen unique browser scenarios are covered across runs; a single full
fifteen-test run is not claimed. No numerical changes followed full regression.

Saved report regeneration and offline `--check`, package/lock version agreement,
absence from public static mappings and whitespace checks passed. Screenshots:
`.publish/vedic-p12-reading-en-390.png` and `vedic-p12-rashifal-gu-390.png`.
The mobile English reading was visually inspected; theme/width/locale behavior
is covered in Chrome. No commands/preview servers remain running. Changes stay
local/uncommitted; no publication, production or private-data changes.

Offline reproduction:

```powershell
node infrastructure/verify-vedic-rashifal.cjs --check
node --test tests/vedic-rashifal.test.js tests/vedic-rashifal-worker.test.js
npx.cmd playwright test apps/rashifal-kundli/tests
node infrastructure/preview-vedic-rashifal.cjs
```

## Next: P13

Read master Astro Time Machine/Gochar requirements, P05/P06 observer models and
P12 noon-sampling limitations. Implement explicit exploration date/time/place
and sourced/versioned transit foundations, separate from the birth future-date
rule and editorial templates. Do not claim continuous transits, aspects, Sade
Sati or interpretive rulebooks merely from P12 noon snapshots. Preserve all
source/stability gates, private birth separation and public-availability limits.
