# Ritvayam Kundali: practitioner workflow review

## Implementation following user approval

Deployed source `8d9f1c0`, Worker `8fef4080-710a-4b77-ab91-218b5a8237fe`.
All three live practitioner journeys and 13 live asset/route checks passed.

The user approved fixing and deploying this review on 14 November 2026. The
implemented increment defaults to the Jyotish workspace, with D1/D9 side by side
on desktop, one selectable diagram on mobile, full graha labels, a linked
Graha Spashta table and current Mahadasha/Antardasha summary. Native abbreviations,
completed-arcsecond sign degrees, expanded-chart keyboard handling, compact
navigation and retained chart/Dasha selection across translation are implemented.
Existing analysis tools have separate named destinations. Detailed calculation
notes and exact Dasha boundary times remain available through disclosures.

Verification: all 11 affected chart, journey and practitioner browser scenarios
have passing results across the final run and focused correction; final six
chart/practitioner scenarios pass together. Includes 24 language/theme/width
combinations in the practitioner test, crowded houses for all twelve ascendants,
keyboard selection/modal focus, report downloads and existing save/consent flows.
All 20 targeted Node checks pass, including DMS boundaries, birth feature admission,
Dasha worker parity and production privacy. No calculation kernels, availability
rules, provider integration, database or saved-input format changes. Actual
practising-jyotish usability validation remains outstanding. The review below
describes the earlier interface and is retained as the implementation rationale.

Reviewed 14 November 2026 IST against the live release at
https://apps.sushantsynapse.com/rashifal-kundli and current source.
Review only: no application implementation or deployment in this increment.

## Assessment

The theme is coherent and controls are generally legible, but the result
workspace prioritises an occasional reader's explanatory report. It is inefficient
for a jyotish comparing placements, divisions and timing. Successful calculation,
responsive rendering and passing browser tests do not establish that this is a
practical consultation workspace. This is an evidence-based heuristic review,
not a usability study with practising jyotish participants or an astronomical
accuracy assessment.

Used the requested UI/UX Pro Max skill and Playwright CLI. The skill's hierarchy
search and its narrower retry returned off-topic matches; no specialised expert
workflow recommendation was taken from those results. General skill guidance
on navigation hierarchy, persistent navigation, state preservation and text
readability comes from its quick-reference defaults. The separate table-handling
query returned relevant responsive-table guidance. Practitioner-specific layout
proposals below are review judgements, not claims made by the skill database.

## Evidence and findings

Synthetic input: 15 August 1990, 10:30 AM IST, New Delhi. Generated without saving
a Kundali. Inspected desktop 1280 x 720 and mobile 390 x 844, English/light;
also inspected Dasha and the language/theme transition. Screenshots in ignored
output/playwright/ritvayam-review/. No client records were used.

| Priority | Observation | Practical consequence | Recommended change |
|---|---|---|---|
| High | Default result is `Your Kundli, in everyday words`; Charts, Planets and Dasha are mutually exclusive views. | A chart cannot remain beside the detailed graha positions or Dasha while analysing. | Offer a Jyotish workspace as a primary result destination; keep the existing simple reading available. |
| High | At 1280 x 720 after selecting Charts, the actual chart top measured y=850px; navigation was y=176px. Several headings, notices, controls and a house selector precede it. | The core result is entirely below the first viewport. | Compact context/header; chart first; consolidate calculation details into an accessible disclosure. Keep availability/uncertainty indicators next to affected results. |
| High | Sample D1 house 11 contains Sun, Venus, Jupiter and Ketu; diagram renders `Su Ve Ju` and `+1`. Source explicitly slices at three planets. | Ketu disappears from the diagram's readable placement labels. Full details require an extra interaction/table lookup. | Fit every graha using tested per-cell arrangements; provide an expanded chart for crowded houses. Do not silently abbreviate a graha into a count. |
| High | Chart labels are `H1 S6 Lg`, `H11 S4`, etc., with a separate decoding legend. Codes are fixed English strings. | Extra decoding while reading familiar North/South layouts; native-language UI still has technical English codes. | Use conventional sign numbers with a clear Lagna marker and a consistent, localised graha abbreviation system. Preserve full accessible names. Validate these conventions with practitioners. |
| High | Charts table shows Sun in Cancer at 118.3949 degrees; Planets table shows the within-sign degree 28.3949. Both are valid representations, shown in different views. | A reader must mentally reconcile two coordinate presentations. | Primary Graha Spashta table: sign, within-sign DMS, house, nakshatra and pada from existing admitted data. Keep total sidereal longitude in secondary detail. Correctly handle rounding carry at sign boundaries. |
| High | D1 and D9 share one chart slot. D7/D10/D12 are generated separately under Advanced. | Comparing Rashi and Navamsa requires repeated switching; related vargas are hard to discover. | Desktop D1 + D9 side by side, one shared graha table, named varga selector. Mobile one legible chart at a time with fast D1/D9 switching and expand action. |
| Medium | Desktop chart's right-hand panel defaults to an empty first-house description for this sample. | Prime adjacent space carries little working information. | Put the graha table/current Dasha beside the chart; show selected-house detail in a compact contextual panel. |
| Medium | Mobile Dasha first viewport contains two Birth details blocks, status/actions, six section buttons and introductory text. Current period prints raw ISO UTC `2026-11-14T06:02:43.117Z`. | Significant scrolling before useful timing data; technical timestamp is difficult to scan. | One persistent birth-context strip; concise current Mahadasha/Antardasha card with readable local as-of date and next boundary. Keep exact timestamps/model definitions in details. |
| Medium | Mahadasha selector is duplicated as select plus nine buttons; birth balance is 3.3026 decimal years; detailed period rows use date and time in every cell. | Excess controls and precision compete with period comparison, especially on mobile. | One primary selector, clear major/minor hierarchy, date-first rows with optional exact time, a readable birth-balance duration derived from the existing model. |
| Medium | Result navigation is not sticky; section changes only toggle visibility. Export controls are rendered at the bottom of every result view as well as in the action block. | Navigation requires returning upward; export setup competes with ongoing analysis. | Persistent compact result navigation and one export destination; preserve scroll/context on return. |
| Medium | Selected D9 and South Indian, then changed language to Hindi: the chart reset to D1 and North Indian. Hindi chart still displays H/S/Lg and English graha codes. | Changing reading language loses the working chart configuration. | Retain varga/style/house state across translation and provide consistent native-language chart labels. |

The current mobile chart fits the page but its SVG scales down, including labels.
Fitting the viewport alone is not a sufficient chart-readability acceptance test.
The language-switch reset was reproduced live and matches the source state
initialisers: D1/North/house 1 and chart handles recreated on language changes.

## Proposed workspace

One compact header: name or unnamed Kundali, date, time, place, time accuracy,
Edit, Save and Export. A concise calculation summary remains visible:
Lahiri / mean nodes / whole-sign; detailed provenance is expandable.

Desktop main area: D1 Rashi and D9 Navamsa beside each other, followed by a
shared Graha Spashta table. Adjacent or immediately below: current
Mahadasha/Antardasha and next transition. Selected graha/house highlights link
the chart and table without hiding either. Additional destinations use explicit
names: Vargas, Dasha, traditional checks, readings and report. Avoid one large
undifferentiated Advanced collection. Keep unavailable calculations labelled.

Mobile: compact sticky birth context and at most four main workspace destinations
(Charts, Grahas, Dasha, More). One large chart with D1/D9 toggle and expand control;
house/graha detail opens on selection. Date-first Dasha rows and a contained
scroll region for genuinely tabular detail. Maintain North/South preference,
selected varga/house, language and useful scroll context across navigation.

Retain platform light/dark/system theme tokens. Use a denser analytical layout,
restrained card borders and typographic hierarchy. Animation should communicate
selection or panel transitions and respect reduced motion; decorative animation
does not solve the workflow problem.

## Implementation boundaries and acceptance

First increment should rearrange existing admitted results and correct display
formatting. Chalit, additional vargas, full Shadbala, new Dasha depths, motion or
combustion calculations require separate supported calculation work; do not add
their labels as though they already exist. Existing advanced output explicitly
distinguishes limited Uccha Bala from full Shadbala. UI changes must retain that
distinction and existing unknown/approximate-time availability checks.

Acceptance should include: all nine grahas readable in a crowded-chart fixture;
D1 and D9 simultaneously inspectable on desktop; chart and graha table coordinated;
current Dasha visible without leaving the workspace; DMS sign-boundary rounding;
no guessed data for unavailable features; stable chart/style selection on language
change; keyboard selection and labelled controls; native-script labels; mobile
320/390/768px and desktop light/dark checks. A jyotish should then complete a
short task study (identify Lagna/lord, compare a graha in D1/D9, inspect current
period and return to the same chart) before calling the workflow validated.

Reference: AstroSage's own Kundli page describes professional chart saving and
worksheets as well as Kundli/Navamsa concepts:
https://www.astrosage.com/kundli/ . This supports considering a working chart
workspace, but does not establish universal practitioner preferences or validate
Ritvayam's calculations.

Source anchors: frontend/birth-app.mjs (default section, exclusive navigation,
tables and chart recreation); chart-view.mjs (labels, three-graha truncation,
longitude display); chart-view.css (chart scaling and detail-panel layout);
dasha-view.mjs (selectors, dates and balance); kundli-reading-view.mjs
(reader-first content); advanced-view.mjs (additional vargas/checks).
