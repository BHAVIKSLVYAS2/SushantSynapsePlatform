# English, Hindi and Gujarati

Scope: the four Vedic production-preview screens at /rashifal-kundli, including
their embedded results and offline exports. Other platform apps are unchanged.

The shared header offers हिन्दी, English and ગુજરાતી. Selection updates the
document language/title, navigation, warnings, theme choices and active screen.
Only the validated language code is remembered under synapse-vedic-language.
The same choice applies on navigation/reload; denied storage leaves the current
screen usable. Embedded selectors are hidden in production. Local development
harnesses retain their independent language controls.

Presentation ownership:

- frontend/language-shell.mjs: shared header, preference and validation messages.
- Existing component catalogues: forms, controls and explanations.
- display-text.mjs: classical terminology, weekdays/months, metadata and rules.
- diagnostic-text.mjs: human explanations plus original diagnostic identifiers.
- place-text.mjs: native aliases from the pinned GeoNames directory, translated
  states/country and retained canonical city spelling for explicit review.

Personal names are never translated. Source titles, URLs, version strings,
checksums, model IDs, chart symbols and scientific time standards retain their
identity. Numeric positions, scores, calculation rules, UTC instants and privacy
withholding are unchanged. Names use the selected script where supplied; regional
naming sounds retain their sourced Roman spelling rather than invented phonetics.

Rashifal reflection content now displays the existing authored Hindi/Gujarati
translations. Rule version is rashifal-reflections-2; prompt selection/IDs and
planetary factors are unchanged. Every language discloses draft editorial status.
Independent content/native-language review remains pending; displaying a draft
does not mark it reviewed or close any release gate.

HTML/print reports localise headings, metadata, diagnostic explanations and title,
while preserving existing identity redaction and escaping. Calendar downloads
localise summary/description and fold complete UTF-8 characters below RFC 5545's
75-octet line limit, without adding birth identity or location.

No network translation, translation provider, birth API or new birth persistence.
Browser-provided calendar pickers and print/download dialogs use the browser or
device language; application labels, previews and downloaded report content use
the selected application language.
The existing no-store/no-transform, no-referrer and connect-src none policies are
preserved. Verification/deployment results: PROGRESS.md and FUNCTIONALITY_LEDGER.md.
