# Kundali export review — 15 November 2026

Implemented locally; not committed or deployed.

The report previously drew only a fixed South Indian grid. It did not receive
the explorer's selected style, and its projection contained only positions,
D1, D9, Dasha and everyday topic readings.

Export now reads the current chart style and selected division at the time of
download/print. A report layout selector allows an explicit override. The selected
chart appears first among chart sections; all available report charts share the
selected North/South geometry. Charts and graha tables precede longer readings.
The static SVG renderer reuses `chart-model.mjs` geometry without interactive
buttons, and retains house/sign associations and native-language abbreviations.
HTML downloads remain standalone and script-free. Print uses the same model and
markup; PDF is produced through the browser's Print / Save as PDF function.

Included sections:

- Graha signs, degrees within the sign, source longitudes, Nakshatra and Pada.
- Screened D1/D9, Chandra, Parashari Hora/D2 and Shodashamsha/D16, with explicit
  unavailable diagnostics and method/candidate notices.
- Existing seven-topic readings, current/upcoming Bhavishyafal themes and Dasha.
- Birth Panchang limbs, civil/sunrise weekday and Amanta/Adhika month when available.
- Opt-in calculated advanced results: screened D2/D7/D10/D12/D16 charts, Uccha
  Bala with conditional ranges and raw BAV/SAV. No invented full Shadbala.
- Opt-in recorded-instant Exact-time D1/D9 previews, prominently labelled
  time-sensitive. Strict feature availability is unchanged; unknown/approximate
  time never gains a nominal chart.

Advanced results come from the existing in-memory calculation, not from a new
export-time calculation. If they have not been calculated, the report says so.
Birth edits clear the results. Gochar explorations, optional rule/sensitivity
experiments and annual observance searches have separate input contexts and
remain outside this birth report; the export controls state this scope.

English, Hindi and Gujarati report headings, charts and reading prose use the
chosen report language. Technical model IDs, source identities, UTC timestamps
and abbreviations such as D9/BAV/SAV retain their precise identifiers; existing
localized fallback guidance explains technical English. No external font,
translation or PDF service receives birth details.

Redaction remains the default. New chart/advanced projections select numeric
fields explicitly and exclude raw birth/time/observer objects. Redaction does
not anonymize the astronomical values or period dates; the existing notice is
retained. No database, stored Kundali, or numerical kernel changes.

Verification:

- 11 export/production model checks pass, including geometry selection, numeric
  preservation, no mutation, redaction, translations and preview opt-in gating.
- Four final production-bundle practitioner/saved workflows pass.
- CLI verifies 18 language/style/width combinations at 320/390/1280px, six actual
  HTML downloads and six standalone PDFs; advanced inclusion and explicit report
  layout override pass. The checks were repeated against final built assets.
- App print flow preserves all seven available North charts in a separate PDF.
- Build exports 699 assets; `git diff --check` passes.

Evidence: `.publish/kundali-export-{validation-final,browser,final-review,
print-review,build}.log`; `output/playwright/kundali-export-*.{html,pdf,png}`.

Next requested topic: Mantra collection and pronunciation aids in other
languages. No mantra content or translations were changed in this increment.
