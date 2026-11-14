# Ritvayam Kundli layout and feature queue

The user approved the first experience phase after the AstroSage comparison,
then prioritised JapSeva. JapSeva was committed and deployed first. The experience
phase is committed as 9f2744b and deployed. Exact release and live verification
are recorded in FUNCTIONALITY_LEDGER.md.

## Implemented experience phase

- Six result destinations: Overview, Charts, Planets, Dasha & calendar,
  Life areas and Advanced. One destination is visible at a time; calculated
  components remain mounted so navigation does not recalculate or persist them.
- Overview retains chart identity, topic shortcuts and current/upcoming periods.
  Topic shortcuts open Life areas and focus the requested reading. A language
  change preserves the selected destination and existing disclosure state.
- Generation focuses the reading title while scrolling the result navigator
  below the shared header. Edit, explicit Save and redacted Download remain.
- Charts retain North/South and D1/D9 choices, with a native house selector for
  touch/keyboard users and full selected-house planet names/source positions.
  Desktop puts chart and details beside one another; phones stack them. Crowded
  SVG houses retain complete accessible names, the detailed list and numeric table.
- Chart controls distinguish selected/unselected choices. Numeric chart tables
  scroll within their region instead of splitting names or overflowing the page.
- Dasha dates use localized readable dates with exact projections in time titles
  and datetime attributes. Return to current period restores the active major
  period and its highlighted sub-period after exploration.
- Standalone/print reports gain a restrained Ritvayam header, clearer section
  spacing and page-break rules. Identity remains explicit opt-in, and no charts
  or computed readings are saved with browser-local birth-input profiles.
- Shared theme tokens and English/Hindi/Gujarati remain in use. Numerical kernels,
  calculation conventions, uncertainty withholding and review gates are unchanged.

## Next calculation phases, still queued

1. Sade Sati and reviewed Yoga/Mangal explanations, with explicit rules and
   boundary/source verification before publishing final assessments.
2. Annual charts, full Shadbala/Bhavbala, additional divisions and Dasha systems.
3. KP and Lal Kitab as separately specified and verified calculation systems.

Existing D7/D10/D12, Ashtakavarga and Uccha Bala candidates must not be described
as complete verified strength/divisional support. AstroSage's published catalogue
is a comparison of available tools, not evidence of comparative predictive accuracy.
Sources: https://www.astrosage.com/freechart/ and https://www.astrosage.com/free/.

Verification results and deployment status belong to FUNCTIONALITY_LEDGER.md.
