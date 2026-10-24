# SUSHANT SYNAPSE — VEDIC ASTROLOGY PLATFORM
## Master Product & Incremental Implementation Specification

**Working product name:** Synapse Vedic Engine (internal calculation capability)  
**Consumer experience:** Rashifal & Kundli (one Free Apps card in Sushant Synapse)  
**Related existing app:** Ritual Assist  
**Status:** Implementation-ready functional specification — **not** an instruction to modify the current platform  
**Version:** 1.0 | **Date:** 24 October 2026 | **Initial market:** India  
**Companion files:** `02_CODEX_STEP_BY_STEP_PROMPTS.md`, `03_PROGRESS_AND_ACCEPTANCE_TRACKER.md`

> **Non-negotiable technology instruction:** The existing Sushant Synapse repository is the sole source of truth for framework versions, application architecture, data storage, dependencies, authentication, design tokens, UI components, deployment practices and coding style. Codex must inspect and reuse these. This specification deliberately does not prescribe a new stack, database, framework, cloud provider or UI library.

---

# 1. Executive product decision

Create a new **free, no-mandatory-login** application within the existing Sushant Synapse **Free Apps** area. It should give visitors useful Indian Vedic astrology experiences while providing a reusable **engine** for other Sushant Synapse products. The engine must be independently testable and usable in future internal or external APIs, but **commercial API monetization is out of scope** for this implementation program.

The project has three separable assets:

1. **Calculation kernel** — astronomical coordinates, Vedic calendar and chart calculations, with explicit convention and data versions.
2. **Traditional interpretation knowledge base** — reviewed rules and prose for reading a chart or giving general Rashifal; not represented as empirically proven prediction.
3. **Consumer experience** — polished, mobile-first screens for Rashifal, Kundli, calendar, comparisons and learning.

The engine must make results **reproducible**: identical inputs + calculation profile + data versions produce equivalent output; no random horoscope on refresh.

## 1.1 Product promises

- Free at point of use; no paid horoscope/Kundli APIs; no mandatory sign-in.
- Privacy-conscious by default; birth details never appear in URLs, telemetry, third-party analytics or ordinary server logs.
- India-first: Indian place search, IST when appropriate, Hindi/Gujarati/English content, North and South Indian charts.
- Transparent: show input timezone, coordinates, calculation profile, reference-data version and limitations in advanced details.
- Accurate **within documented astronomical algorithms and chosen Vedic conventions**; no universal claim that different Jyotish traditions must return identical interpretations.
- Lightweight and accessible on a mid-range mobile device; integrate visually with current Sushant Synapse style.
- Reuse existing services; no new technology or design system without documented justification and approval.

## 1.2 Out of scope for initial release

- Payment, subscriptions, developer billing, external API key portal, SLA sales, public tenant management.
- Pandit booking (a separate project), direct consultations, live chat and matchmaking marketplaces.
- Forced account creation, storing all users' family birth details by default, ads, medical/financial/legal predictions.
- Claiming to 'correct' a user's birth time from events (birth-time rectification) without evidence.
- Guaranteeing predictions, predicting death or disease, fear-based dosha upselling, and unverified gemstones/remedies.
- Immediately implementing every advanced varga, Shadbala, Ashtakavarga and Muhurat system in one sprint.

# 2. Audiences and jobs to be done

| Persona | Job | First-class experience |
|---|---|---|
| Casual visitor | 'I know my Rashi; what is today's reading?' | Rashi selector + daily/weekly reading |
| Parent | 'Find baby's birth Nakshatra and naming syllable.' | Birth details -> Nakshatra/Pada -> syllable suggestions |
| Individual | 'Generate and understand my Kundli.' | Birth details -> D1/D9/Dasha -> explain -> download |
| Family member | 'Find a traditional lunar birthday and upcoming dates.' | Tithi birthday and export |
| Curious learner | 'Why did this result appear?' | Explain the method/rule and display chart details |
| Experienced practitioner | 'Inspect exact conventions and placements.' | Expandable professional detail / calculation provenance |
| Existing Ritual Assist user | 'Reuse Panchang without conflicting results.' | Shared calculation kernel; local observance configuration |

# 3. Information architecture and navigation

**Single Sushant Synapse Free Apps card:** `Rashifal & Kundli` (working title; final display name configurable). No second top-level Kundli card by default.

Within the application, four main destinations:

1. **Rashifal** — Today, Tomorrow, Week, optional Month; Rashi selection and interpretation.
2. **My Kundli** — Create, view, understand, D1, D9, dashas, save/export.
3. **Vedic Calendar** — Birth Panchang, Tithi Birthday, Astro Time Machine, later Gochar.
4. **Explore & Compare** — Baby Names, Kundli Milan, knowledge glossary, later advanced charts.

The first screen on mobile should make both 'Read Rashifal' and 'Create Kundli' visible without requiring scrolling through 12 huge cards. A default local Rashi may be remembered with clear reset. Sign-in must not be shown as a blocker.

## 3.1 Key journeys

**J1 — Fast Rashifal**: Open -> choose known Chandra Rashi -> Today -> category summaries -> Tomorrow/Week -> save preferred Rashi locally.

**J2 — Birth chart**: Open -> birth date/time/place -> choose from unambiguous places -> review local time + timezone -> generate -> view D1 -> planets/12 houses -> D9 -> Dasha -> printable report. Warn when input is ambiguous.

**J3 — No accurate birth time**: User selects 'time unknown' or an approximate interval -> show only defensible results -> flag unstable Lagna/houses/D9; never quietly assume noon or produce a purportedly exact chart.

**J4 — Baby name**: Birth details -> Nakshatra/Pada -> traditional syllables -> optional curated names -> copy/share. Parents can choose any name.

**J5 — Traditional birthday**: Birth Tithi -> select year + location + observance rule -> calculate occurrence -> calendar export -> explain local sunrise and regional rule.

**J6 — Compare Kundlis**: Input both persons' birth details with consent -> 8-koota breakdown + transparent rules + caveats; avoid a blunt 'compatible/incompatible' verdict.

# 4. Product sections and requirements

All feature IDs remain stable for Codex tasks, test cases and future tracking.

## 4.1 Rashifal (RF)

**RF-01:** Show 12 Rashis using correct English transliteration, Hindi/Gujarati names and accessible symbols.  
**RF-02:** Select Rashi manually without DOB. Distinguish Chandra Rashi from western/tropical Sun sign.  
**RF-03:** Today, Tomorrow and Weekly views. Date/time basis: India/IST editorial day in the initial release; timestamp and publication date visible.  
**RF-04:** Compact overview plus Career, Money, Relationships and Wellbeing sections. No implied medical or investment advice.  
**RF-05:** Readings created from a curated rule-and-template library with explicit inputs; deterministic selection and de-duplication; never random strings.  
**RF-06:** Cache publishable results by `date + rashi + language + ruleVersion + calculationProfile`.  
**RF-07:** Show 'traditional interpretation, not a scientific prediction' disclaimer unobtrusively but accessibly.  
**RF-08:** View source factors (such as the sign/transit assumptions used) when tapping 'Why this reading?'.  
**RF-09:** English, Hindi and Gujarati; real translations, not simply transliteration.  
**RF-10:** Handle missing/unreviewed translations safely: fallback with language label; never silently generate incorrect text.  
**RF-11 (later):** Monthly/annual reading only with reviewed content rules.

**Editorial rule:** The implementation must never invent statements like 'medical test will be positive', 'you will earn ₹X', 'your relationship will end' or dates of serious life events. Traditional interpretations should use qualified, empowering language.

## 4.2 Birth information and Rashi discovery (BI)

**BI-01:** Date of birth, exact time (24-hour / locale-compatible), city/place via search, optional name.  
**BI-02:** Birthplace selection returns display name, coordinates, time zone ID and provenance; disambiguate towns with same name.  
**BI-03:** Explicit controls for exact, approximate and unknown birth time.  
**BI-04:** Review confirmation displaying local date/time, determined time zone and resulting UTC instant.  
**BI-05:** Validate impossible dates/times, skipped/ambiguous local times, supported ephemeris boundaries and out-of-bounds coordinates.  
**BI-06:** No implicit browser-location requirement; location permission unnecessary for birth location.  
**BI-07:** Show when Moon sign/Nakshatra could change during an uncertain interval.  
**BI-08:** Clear input and local history safely.

## 4.3 Kundli / charts (KU)

**KU-01:** Display geocentric sidereal longitude, Rashi, degree within sign, Nakshatra/Pada and motion indicator for relevant grahas where supported.  
**KU-02:** Core grahas: Sun, Moon, Mars, Mercury, Jupiter, Venus, Saturn, Rahu and Ketu. State whether nodes are true/mean; state that Rahu/Ketu are computed lunar nodes, not physical planets.  
**KU-03:** Compute Lagna/Ascendant and all 12 houses with an explicit house convention.  
**KU-04:** D1 chart; North Indian and South Indian graphic representations, clearly labelled houses/signs, mobile legible, screen reader fallback table.  
**KU-05:** D9/Navamsa from verified divisional mapping rules; versioned and fully tested against reference vectors.  
**KU-06:** Planet table, house summary, optional retrograde state, aspects/relations only after rule definition.  
**KU-07:** Tap planet/house/Yoga for 'What does this traditionally mean?' with a definition and result provenance.  
**KU-08:** Print/export with optional redaction of full DOB, time, place and name.  
**KU-09:** Do not emit precise D1/D9/Lagna when birth time is unavailable/uncertain enough to alter it; show stability classifications.  
**KU-10 (later):** D7, D10, D12 and additional vargas, only after individually signed-off algorithms.  
**KU-11 (later):** Traditional Yoga definitions with explicit detection and source/variant settings.  
**KU-12 (later):** Shadbala and Ashtakavarga with methods and credible validation data.

## 4.4 Dashas and transits (DT)

**DT-01:** Vimshottari Mahadasha start/remaining period from Moon's Nakshatra fractional position at birth.  
**DT-02:** Major/minor timeline with Mahadasha and Antardasha; show UTC/local event boundaries where relevant and convention-version.  
**DT-03:** Configurable but explicitly documented Dasha-year convention (e.g., 365.25-day vs traditional 360-day), not user-hidden.  
**DT-04:** Current active period and upcoming transitions; deterministic timeline.  
**DT-05:** Interactive, accessible time axis; printable table fallback.  
**DT-06 (later):** Transits/gochar against Moon/Lagna reference with explicitly defined mapping.  
**DT-07 (later):** Traditional Sade Sati/Dhaiya visual timeline, without fear framing.

## 4.5 Birth Panchang and Vedic Calendar (VC)

**VC-01:** At the birth instant compute Vara, Tithi, Nakshatra, Yoga, Karana and relevant transitions.  
**VC-02:** Show exact-instant Panchang values separately from sunrise-based day observance.  
**VC-03:** Birth Tithi yearly calendar: use a documented, location-aware observance convention; show cases with missing/repeated tithis (kshaya/vriddhi) and regional variation.  
**VC-04:** Astro Time Machine: choose date/time/place and display calculated positions, Panchang and birth-chart comparison if inputs exist.  
**VC-05:** Export annual occurrences to `.ics` with correct timezone semantics and description of observance rule.  
**VC-06:** Link to Ritual Assist, without duplicating conflicting Panchang calculations.  
**VC-07 (later):** Muhurat search (e.g., Griha Pravesh/Namkaran) only after ceremony-specific rulebooks and locality rules are reviewed.

## 4.6 Baby names (BN)

**BN-01:** Determine Nakshatra/Pada from birth Moon; show traditional starting syllable(s).  
**BN-02:** Name lists are curated, attributed/licensed and categorized by language/meaning. Do not scrape or auto-generate unverified meanings.  
**BN-03:** Search/filter/copy, no birth data included in copied names by default.  
**BN-04:** Explain that syllable guidance is a custom, not an obligation.  
**BN-05:** Allow curated language corrections without redeploying the astronomical kernel.

## 4.7 Matching and traditional checks (MC)

**MC-01:** Ashtakoota Guna Milan: Varna, Vashya, Tara, Yoni, Graha Maitri, Gana, Bhakoot, Nadi — per-component points + rules + total out of 36.  
**MC-02:** Declare matching convention/region/version, and recognize disagreements between schools.  
**MC-03:** Individual comparison details, not merely a score.  
**MC-04:** Mangal Dosha and other named checks only when mathematically defined, reviewed and appropriately contextualized.  
**MC-05:** Do not use result as a determinant of marriage quality or endorse discrimination; avoid binary approval/rejection messaging.  
**MC-06:** Require consent before processing a second person's birth data; default to no permanent storage.

## 4.8 My Family (FM; optional)

**FM-01:** Optional local-only family chart vault; explicit opt-in, clear-data button, client-side export/import.  
**FM-02:** If authenticated cloud syncing is eventually added, require a separate privacy and threat-model design, not a silent feature extension.  
**FM-03:** No public sharing links that expose raw birth details by default; redact controls on image/PDF export.  
**FM-04:** Warn that clearing browser storage or switching devices removes local profiles without an exported backup.

# 5. Functional calculation contract (engine-agnostic)

Calculation **contracts** are fixed here; implementation mechanics follow the existing codebase. These contracts must be versioned so future platform/third-party consumers can reproduce historical results.

## 5.1 Common calculation request

Required normalized fields: `localDate`, `localTime` or explicitly unknown time, `placeId` or `latitude/longitude`, `timeZoneId`, `calculationProfileId`; optional `precisionOfBirthTimeMinutes` and user-facing `language`. Inputs use unambiguous ISO civil dates and signed coordinates.

Returned provenance: `utcInstant`, resolved `offset`, `tzdbVersion`, `placeSourceVersion`, `ephemerisId`, `ephemerisCoverage`, `calculationProfileId`, `ayanamshaModel/version`, `nodeModel`, `houseModel`, `engineVersion`, `warnings`, `precisionClass`.

Examples of expected normalized output shape (illustrative **contract**, not a selected programming language):

```json
{
  "birthInstantUtc": "2000-01-01T06:30:00Z",
  "birthplace": {"label":"Example location", "latitude":22.0, "longitude":73.0, "timeZoneId":"Asia/Kolkata"},
  "profile": {"id":"IN_LAHIRI_DEFAULT_V1", "ayanamsha":"Lahiri", "nodes":"mean", "houses":"whole-sign"},
  "versions": {"engine":"TBD", "ephemeris":"TBD", "tzdb":"TBD", "rules":"TBD"},
  "positions": [],
  "warnings": []
}
```

The example timestamp and location are syntactic placeholders, **not tested astronomical reference data**.

## 5.2 Astronomical foundation

A correct kernel must explicitly manage:

- Proleptic Gregorian date policy and accepted historical period.
- Local civil time -> timezone/historical offset -> UTC, including ambiguity handling.
- Julian Day and appropriate time scales: UTC/UT1/TT/TDB as required by the chosen ephemeris and method; do not treat them as interchangeable.
- Earth/Sun/Moon/planet position interpolation and coordinate-frame transformations.
- Geocentric vs topocentric position choices, light-time/apparent-vs-geometric position conventions, ecliptic reference and epoch.
- Tropical -> sidereal/Nirayana conversion using versioned Lahiri ayanamsha as default for India; do not mix incompatible coordinate frames.
- Sidereal time and local horizon / Lagna calculation.
- Sunrise/sunset where required, with documented horizon/refraction/altitude assumptions and high-latitude fallbacks.
- Angles always normalized to [0, 360), with careful floating-point boundary tests.

**Proposed calculation profile:** `IN_LAHIRI_DEFAULT_V1` = Lahiri sidereal zodiac, mean node (tentative), whole-sign D1 display (tentative), geocentric planetary positions with documented apparent/geometric convention, Gregorian civil dates. **No tentative value becomes a production standard until phase 1 convention review and golden tests pass.** Persist the selected profile with each exported report.

## 5.3 Core traditional angular rules (definition-level)

- `elongation = normalize(moonLongitude - sunLongitude)`; **Tithi** index = `floor(elongation / 12°) + 1` (1..30), Paksha derives from the half-cycle. Transition detection must solve continuous crossing, not sample one time per day.
- **Nakshatra** index = `floor(normalize(moonSiderealLongitude) / (360°/27)) + 1` (1..27); **Pada** = `floor(remainderWithinNakshatra / (360°/108)) + 1` (1..4).
- **Rashi** = `floor(normalize(siderealLongitude) / 30°) + 1` (1..12); degree within Rashi = remainder modulo 30°.
- **Yoga** index = `floor(normalize(sunSiderealLongitude + moonSiderealLongitude) / (360°/27)) + 1` (1..27).
- **Karana** is a 6° elongation half-Tithi with a **nonuniform traditional naming sequence** (four fixed and seven repeating); the mapping must be separately specified and tested, never simply calculated as a 1..60 name array.
- **Vara** is the weekday according to the applicable sunrise/civil-day context; do not assume all observance calendars define a 'day' by midnight.
- **D9/Navamsa**: 108 equal 3°20′ divisions of the ecliptic, mapped by the traditional movable/fixed/dual sign rules; must test mapping across each sign boundary.
- **Vimshottari**: Ketu 7, Shukra 20, Surya 6, Chandra 10, Mangal 7, Rahu 18, Guru 16, Shani 19, Budha 17 years = 120-year repeating cycle. Starting lord and remaining fraction derive from birth Nakshatra longitude. Calendar conversion conventions must be explicit.
- **Matching/Yoga/Dosha:** Mathematical formula alone is insufficient; use a separately versioned, reviewed rulebook with rule examples and source metadata.

## 5.4 Precision and uncertainty policy

- For exact times, report actual chosen input resolution and data-source limitations; never promise universal '100% accurate Kundli'.
- Approximate interval: calculate sign, Nakshatra, Lagna and divisional chart at boundaries and detect crossings *within* interval (not endpoints only). Show `stable`, `changes within interval` or `unsupported` by feature.
- Unknown time: return only components that are provably invariant over plausible interval, otherwise show uncertainty; don't fabricate a Lagna.
- Dates outside the downloaded ephemeris, unreliable historic time zones, missing coordinates or impossible polar sunrise must return a typed diagnostic instead of a plausible-looking value.

# 6. Screens and UX specification (mobile first)

**Screen S0 — App landing:** Compact branded heading; top-level `Rashifal | Kundli | Calendar | Explore`; two prominent actions: 'See today's Rashifal' and 'Create free Kundli'; brief privacy statement. Avoid oversized hero.

**S1 — Rashi picker:** 12 accessible 2/3/4-column tiles responsive to width; local-language labels; 'I don't know my Rashi' leads to finder; current selection accessible via keyboard and screen reader.

**S2 — Daily Rashifal:** Selected Rashi compact header; Today/Tomorrow/Week segment; concise lead paragraph; four small categories; expandable 'Why this reading?' and copy/share; clearly visible date/language.

**S3 — Birth-details entry:** Date/time/place, accuracy selector, place autocomplete with state/country coordinates, no location permission. Review screen prevents ambiguous timezone/date mistakes.

**S4 — Kundli results:** Summary strip (Rashi/Nakshatra/Lagna if stable); North/South chart switch; D1/D9 tab; planet table; current Dasha; 'Explain' cards; actions print/share; advanced provenance accordion.

**S5 — Chart explorer:** Tap planets or houses; show symbol, local-language name, degree, sign/house and interpretation with 'traditional' tag. Accessible text-table alternative.

**S6 — Dasha timeline:** Major-period tracks, selected Antardasha, dates, calendar-year convention disclosure, responsive scroll/printable table.

**S7 — Vedic birthday:** birth Tithi & Paksha, future-year list, city choice for observance, explanation of regional rule, ICS download.

**S8 — Baby names:** calculated syllables, language filter, manually curated names, clipboard action, source note.

**S9 — Time Machine:** choose date, **time and city**; planetary snapshot, Panchang, optional compare with birth chart; no false claims from date alone.

**S10 — Matching (later):** dual birth-input cards; clear consent; 8-component report; score detail and limitations.

**S11 — Local chart library (optional):** locally stored profiles with storage warning, import/export and wipe.

### Accessibility/visual checks

- Use existing platform components, typography, theme (including dark mode), icons, card spacing, breakpoints and translation mechanism. Do not introduce a new theme.
- 320px screens must not require horizontal page scrolling; charts may use labelled internal zoom/scroll if necessary.
- Maintain meaningful contrast; symbols never communicate critical facts alone; tap targets sized per platform accessibility convention.
- Respect reduced-motion, keyboard traversal, focus order, screen-reader labels and translated date/number formatting.
- No blocking ad, no mandatory marketing consent, no 'fear alert' badges.

# 7. Localization and editorial governance

Supported UI languages: **English, Hindi and Gujarati**. Codes must follow existing platform locale conventions. Adopt one glossary for Rashi, Nakshatra, Graha, Tithi, Paksha, Yoga, Karana, Mahadasha and Lagna; translation cannot alter numeric values.

The knowledge base is versioned independently of astronomy calculations. Each explanation should have `ruleId`, title, `locale`, body text, source/reference, reviewer, status (draft/reviewed/published), effective/version timestamps. If there is no approved content, show a transparent fallback: do not generate synthetic confident statements.

**Daily content workflow:** calculate conventional features -> select curated interpretation rules -> apply deterministic priority/conflict rules -> review preview (initially) -> publish a cache by date/Rashi/locale/profile -> retain source and rule version for audit. Avoid claims of scientific predictive accuracy.

# 8. Privacy, safety and data retention

1. Default to **stateless** calculations. Guest input can be held in short-lived UI memory only. Avoid storing names, dates of birth and location in logs or URL/query strings.
2. Opt-in local storage is permitted for Rashi preference or family charts, using existing platform storage conventions. Provide clear wipe/export and shared-device warning; sensitive profile data should not be silently persisted.
3. If a chart is printed/exported, the user can choose an identifiable or redacted version. Direct download instead of public links by default.
4. Separate public analytics from identifiable birth records. Never include birth inputs in exception breadcrumbs or tracing payloads.
5. Rate-limit computation fairly without requiring account creation. Validate request lengths, dates and geographic coordinates; hard-bound ephemeris time ranges.
6. Security review before any server-side chart storage or future API access. A future monetized API must pass a separate privacy, security and licence review.
7. Content policy: nonfatalistic traditional language, no health diagnosis, guaranteed financial outcome or coercive marital compatibility wording.

# 9. Performance, reliability and operational design

- The API should be pure/deterministic where possible; maintain boundaries between calculation and presentation.
- Cache immutable ephemeris interpolation inputs and Rashi content where appropriate, not guest's personal birth details by default.
- Operate using existing hosting initially; avoid separate infrastructure until profiled limits justify it.
- Incomplete dataset or engine initialization produces explicit, actionable error, never substitute rough approximate positions unnoticed.
- Observability: request count, duration, error category, cache hit ratio, engine/profile version; no personal request payloads.
- Safe feature flags allow Rashifal and birth-chart tools to roll out separately; no breaking Ritual Assist until regression gates pass.

# 10. Functional service boundaries (conceptual, no stack prescription)

| Logical capability | Inputs | Outputs | Consumer |
|---|---|---|---|
| PlaceSearch | Text + country/region | Place ID, disambiguated names, lat/lon, timezone | Birth forms |
| ResolveCivilTime | Local date/time + place | UTC instant or ambiguity error | Every precise calculation |
| AstronomySnapshot | UTC instant + profile | Raw positional vectors/angles + provenance | Vedic kernel |
| VedicPositions | Snapshot + ayanamsha | Nirayana longitudes, signs, nakshatras | Chart, Rashifal |
| BirthChart | Instant + location + profile | Ascendant, houses, D1, D9 + warnings | Kundli |
| PanchangAtInstant | Instant + location + profile | Five Panchang limbs, changes | Birth Panchang |
| PanchangBySunrise | Civil day + location + rule | Sunrise, tithi-at-sunrise, observance | Ritual Assist, Vedic birthday |
| DashaTimeline | Birth Moon + convention | Mahadasha/Antardasha periods | Kundli |
| RashifalReading | Rashi + date + locale + content version | Reviewed reading + trace | Free app |
| KundliMilan | Two birth charts + tradition rules | 8 scores + caveats | Compare |
| ExportView | Presentable data + redaction settings | Printable report, SVG/ICS as applicable | User download |

Expose internal interfaces independent of front-end concerns. Preserve backward compatibility and stable versioned contracts; add public API wrappers only later if requested.

# 11. Validation and test strategy

## 11.1 Golden datasets (required)

- Planet positions and relevant coordinate transformations: independently verify multiple dates with NASA JPL Horizons under **matching observer, reference plane, time scale and apparent/geometric conventions**.
- Indian Panchang: cross-check selected days/transitions against the India Meteorological Department/Positional Astronomy Centre Rashtriya Panchang under the same location/convention; differences must be recorded and explained, not hidden.
- Indian birthplace/timezone: test commonly named cities, identical village names, dates before/after historical offset changes, standard IST and ambiguous foreign birth places if enabled later.
- 12 signs x transition boundaries; 27 Nakshatras x 4 Padas; tithi 1..30, Karana mapping; sign boundary rollover at 0°/360°.
- D1/D9: chart rendering parity with numeric table; Lagna changes with 5–10-minute birth-time changes near rising-sign boundary.
- Dasha: deterministic 120-year cycle, exact Nakshatra starts/ends, inclusive/exclusive boundary semantics.
- Tithi birthday: skipped/repeated Tithi, leap months, location sunrise shifts and convention changes.
- Matching: 8 score components verified individually and bounded 0–36.
- Birth time uncertainty: events inside interval detected even when endpoints happen to share the same sign/value.

## 11.2 Test classes

**Unit:** normalization, indexing and formulas.  
**Property-based:** periodicity, bounds, monotonic boundary searches and total dasha length.  
**Golden/reference:** expected coordinates, tithi and chart outcomes at published fixtures.  
**Cross-module:** Ritual Assist and Kundli must agree given the same profile/instant/location.  
**API contract:** stable response schema, typed errors, no leaked PII, input validation.  
**UX/e2e:** guest flow, locale switch, offline/no-service state, date/time ambiguity, export and mobile rendering.  
**Nonfunctional:** CPU/memory profiling, rate-limit behavior and failure modes.

Never invent golden expected positions or claim tests were run without reports. Numerical tolerance limits are to be **proposed, measured and approved** for each quantity in phase 1/validation; one tolerance does not fit all outputs.

# 12. Release gates and phase order

| Phase | Milestone | Release role | Blocking prerequisites |
|---|---|---|---|
| P00 | Repository/platform audit | Read-only discovery | None |
| P01 | Calculation conventions + reference test-plan freeze | Document/design | P00 |
| P02 | Place + civil time normalization | Engine | P01 |
| P03 | Astronomy reference-data adapter | Engine | P02 |
| P04 | Sidereal positions, Rashi, Nakshatra | Engine | P03 |
| P05 | Tithi, Yoga, Karana and sunrise Panchang | Engine | P04 |
| P06 | Lagna, houses and D1 Kundli | First usable chart | P04, P05 |
| P07 | D9 + North/South visual charts | Kundli complete basics | P06 |
| P08 | Vimshottari Dasha engine | Core report | P07 |
| P09 | Birth-details UI and free Kundli results | First UI release candidate | P08 |
| P10 | Privacy-safe printable/PDF Kundli + provenance | First downloadable release | P09 |
| P11 | Birth Tithi, yearly observance and baby names | Everyday usefulness | P05, P09 |
| P12 | Daily/tomorrow/weekly Rashifal content | Free app core | P04, P09 |
| P13 | Astro Time Machine and Gochar foundations | Calendar | P05, P09 |
| P14 | Birth-time sensitivity | Trust/quality | P06, P07, P09 |
| P15 | Matching, Yogas and Dosha rulebooks | Advanced | P07, P09 |
| P16 | Advanced vargas/strength calculations | Optional later | P15 |
| P17 | Ritual Assist sharing/regression and release hardening | Platform rollout | P05, P09–P14 |

**Release principle:** P09–P10 may ship as beta once all their gates are satisfied; P11–P17 are independently feature-flagged. Do not hold the first useful Kundli hostage to advanced modules. P12 (Rashifal) may be piloted independently if its astronomical/content dependencies pass.

# 13. Codex working agreement (mandatory every phase)

1. Read this specification and the companion prompt file, **and inspect the actual repo**; do not assume versions, style, route patterns or infrastructure.
2. Implement **only** the named phase; do not start later phases on your own.
3. Before changes, summarize intended files, reused components, identified unknowns, calculation convention and test strategy.
4. Follow the current platform's existing source layout, components, coding standards, localization, dependency management, error conventions and testing strategy.
5. Do not add a new library, service or storage facility unless necessary; explicitly document licence, alternatives and platform fit, and request approval if the repo conventions prohibit it.
6. No paid APIs, vendor keys, unapproved personal-data persistence or hard-coded approximate astronomical values masquerading as production calculation.
7. Provide tests, reference fixtures, documented rounding/precision assumptions and a phase-specific evidence report.
8. Run applicable tests/build/lint if available. If a command cannot run, state exact blocker and **never claim pass**.
9. Keep new features behind appropriate flags where possible, and preserve existing Ritual Assist behavior unless a separately approved change requires it.
10. Finish with `PHASE COMPLETE / BLOCKED`, changed files, execution/results, residual risks and **stop for review**.

# 14. Acceptance definition ('done')

A phase is complete only when the scope-specific criteria in its Codex prompt pass, existing application checks remain green or their pre-existing failures are disclosed, meaningful tests exist, no birth details leak into logs, calculations match approved fixtures, UI follows current platform styling, and no later phase has been silently implemented.

**No phase has been implemented merely because this document exists.** After approving the repository audit and calculation conventions, execute prompts sequentially one at a time.

# 15. Glossary and invariant domain distinctions

- **Rashi:** 30° sidereal zodiac sign; **Chandra Rashi** is the sidereal Moon sign.
- **Nakshatra / Pada:** 27 equal sidereal lunar sectors and four quarters each; interpretations vary by tradition.
- **Tithi:** One of 30 intervals of 12° elongation between Moon and Sun.
- **Lagna:** Ascendant calculated for the actual instant and birthplace, sensitive to time.
- **D1 / D9:** Rashi birth chart and Navamsa divisional chart, respectively.
- **Vara:** Weekday in a selected civil/sunrise tradition.
- **Mahadasha / Antardasha:** Traditional period subdivisions using an explicitly defined time basis.
- **Ephemeris:** Numerical astronomy data to calculate positions, not itself a horoscope interpretation.
- **Calculation profile:** Versioned choices (ayanamsha, nodes, houses, calendar/time conventions).
- **Golden fixture:** Input and independently validated expected output, tagged with provenance and tolerance.
- **Birth Panchang:** Snapshot at a birth instant; not interchangeable with a sunrise-based daily observance.

# 16. Evidence and reference sources

Sources below support the feasibility and validation plan; **they are not a ready-made test fixture library** and must be matched for timescales/conventions before use.

- NASA JPL Planetary and Lunar Ephemerides: https://ssd.jpl.nasa.gov/planets/eph_export.html
- NASA JPL Horizons manual: https://ssd.jpl.nasa.gov/horizons/manual.html
- IMD Positional Astronomy Centre, Rashtriya Panchang: https://packolkata.imd.gov.in/panchang/en/explanation
- IANA timezone database: https://www.iana.org/time-zones
- GeoNames downloadable data and attribution terms: https://www.geonames.org/export

**Compliance checkpoint:** Review current terms of all datasets and embedded components during P01; keep an attribution and licence inventory. Provenance and update policies are mandatory even when source data is free.

---

**Document authority:** This file specifies **what** to build, the rules and completion criteria; `02_CODEX_STEP_BY_STEP_PROMPTS.md` specifies **how to instruct Codex to deliver one phase at a time**. In any conflict with the deployed platform's technology, review the repository and adapt the implementation—not the user's functional goals—subject to explicit approval.
