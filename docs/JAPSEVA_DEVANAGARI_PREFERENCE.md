# JapSeva Devanagari preference

23 November 2026; included in deployed book-navigation release aa0261be.

The user requested Devanagari in preference to Roman text. The audit found
English-interface book titles, practice selectors and request headings using
Roman mantra names; chapter labels followed the interface script; Learn showed
Roman and Gujarati before meaning for every passage; Ratna repeated Roman text
inline. Existing source Sanskrit was present and is preserved.

Changes:

- Existing Hindi/Devanagari names lead book titles, practice selection, ongoing
  request names and recording labels. English search aliases are retained.
- Chapter titles and section options use the existing Devanagari labels, while
  explanatory instructions and meanings retain the selected interface language.
- Chapter readers open in Devanagari; users can explicitly select another script
  in Recite. A prior Roman-script preference no longer overrides initial opening.
- Learn presents original Devanagari followed immediately by meaning. Roman and
  Gujarati aids remain available in a closed, labelled reading-help disclosure.
- Ratna Learn follows the same hierarchy, with optional Roman pronunciation;
  its graha cards now use existing Devanagari names.
- Practice meaning/pronunciation help leads with Devanagari and keeps Roman help
  optional. Saved custom text, stable IDs, targets, counts, certificates, source
  content and audio are not rewritten.
- Reduced-motion readers skip creating unused animated page snapshots; the
  browser sweep exposed this unnecessary work while traversing long collections.

No automatic Roman-to-Sanskrit back-transcription, new Sanskrit text, translation,
database schema change or production write. Existing linguistic-review limits
still apply. Frontend ownership remains under apps/japseva/frontend.

Eighteen focused Node checks and the frontend build pass (765 public assets).
The all-entry Chrome audit passes all 110 entries and their 128 chapter
labels/text, optional reading help, practice selector names and three interface
languages. Mobile screenshot visually inspected; no page errors or mobile
overflow. Ratna, no-login backup/PDF/certificate and complete Rudram browser
regressions pass. Rudram's request-row assertion now uses its Devanagari name.
Tests use isolated temporary DATA_DIR values and browser storage. Deployed with
the book navigation release; no production business writes. See the ledger.
