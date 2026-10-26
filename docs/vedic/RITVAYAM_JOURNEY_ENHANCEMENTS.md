# Ritvayam journey enhancements — 26 October 2026

Implemented in the current app, following the supplied UX brief. No framework,
route, backend, schema, calculation engine or saved-input format was replaced.
The original deployment was made without a commit, as requested. The user later
authorized committing and redeploying the verified implementation.

## Audit and changes

| Journey | Previous friction | Enhancement |
| --- | --- | --- |
| New Kundli | Review submission followed by a second Calculate action | One Generate action validates, normalizes and calculates |
| Returning user | Open saved input, review, then calculate | Up to three saved-profile shortcuts each reopen a fresh Kundli in one tap |
| Birth form | Optional name/elevation and an empty saved library take space | Essential date/time/city controls first; optional details expand; empty library hidden |
| Results | Full input form remains above the reading | Form collapses after success; Edit retains inputs and focuses the date control |
| Common insights | All topics behind a picker | Direct Nature, Career, Relationships and Life periods links |
| Expert information | Open picker then select charts/timing | Direct Charts, Dasha and Advanced section links |
| Download | Scroll past the full reading | Download alongside Edit and Save, retaining redacted defaults |
| Printable preview | Entire report DOM built while hidden | Built when preview/print is requested; downloads still use the existing projection |
| Matching | Retype details already saved on this device | Optional saved-profile selectors, enabled only after both-person permission |
| Mobile navigation | Route links and preview notice occupy separate rows | Compact existing route navigation; review/privacy details remain expandable |

## Boundaries retained

- Birth dates/times are never invented. Unknown/approximate time retains the
  existing conditional fields, normalization and withholding checks.
- Saved profiles remain explicitly opted-in, browser-local birth inputs and an
  optional name. Reports, readings and calculated charts are not persisted.
- Clear/history behavior, comparison permission, directional axes and the
  comparison review step are retained. Reusing saved inputs does not imply
  permission to calculate a comparison.
- Readings, chart rendering, Dasha, advanced checks, Time Machine, Rashifal,
  print/download and the shared language/theme header remain available.
- Language changes rerender the current calculated report without another
  astronomical calculation. No durable report cache or new API was introduced.
- Duplicate Generate taps are ignored while pending. Clear/edits/language
  changes cancel pending work. Validation opens hidden optional details where
  necessary, and errors preserve the entered inputs for correction.

## Verification

Focused coverage exercises single-action generation in English/Hindi/Gujarati,
direct navigation, edit/regenerate, one-tap saved profiles, consented matching
reuse, invalid dates, unknown birth time, rapid Generate/Clear, export/privacy,
320–1024px themes and existing advanced tools. Final test and deployment results
are recorded in the functionality ledger.
