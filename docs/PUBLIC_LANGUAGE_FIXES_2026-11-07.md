# Public Hindi/Gujarati interface fixes — 7 November 2026

Implemented locally following the Gujarati review and the request to fix Hindi in
the same pass. No commit, deployment, database/schema change or production business
write. Private authenticated workflows were not comprehensively translated in this
increment. Earlier read-only reviews remain historical checkpoints.

## Implementation

- Shared authored catalogue expands from 986 to **1,464 paired entries**. The
  public copy modules supply 486 entries including eight existing-key overrides;
  the net addition is 478. Every entry has both Hindi and Gujarati text.
- 74 explicit full-message templates cover counters, dates, game progress, photo
  sizing results, selection state and selected UI messages. Captured names and
  choices remain opaque, with narrowly defined difficulty labels localised as
  an explicit enum. No generic word substitution, translation API or new package.
- Static and dynamic controls/instructions covered in Take a Break, Make 24,
  Picksy, Bill Splitter, Photo Resize, Ritual, Moment Studio, Timetable, Fund Lens,
  News and home discovery. UI dropdowns are explicitly opted in; stored option
  values, numeric engines and URL identities are unchanged.
- Shared attribute translation retains the original placeholder/accessible-name/
  title source, so locale round-trips do not depend on ambiguous reverse mappings.
  Accessible SVG labels can translate while SVG artwork/text remains excluded.
- App-owned confirmation calls use the current locale. Bill Splitter renders
  names separately from translated payment instructions and keeps copied summaries
  in the selected locale. Photo validation results use independently translatable
  fragments so later language switches update them correctly.
- Picksy validation exposes duplicate values/line numbers as structured error
  metadata while retaining its existing English error.message contract. The UI
  translates its instructions and preserves literal entered option names. Face-Off
  also protects literal titles, choices, history values and winners.
- Ritual's protected header/tabs now have app-owned Gujarati copy and respond to
  the shared preference. The hidden native English/Hindi calendar bridge remains
  separate; header changes do not change calculations, saved fields or checklist
  checks. Visual review found and corrected this gap after the first text scan.
- Generated `packages/ui/language.js` rebuilt from authored sources. No translation
  module is exposed as a new request-controlled server path.

## Verification

30 focused unit/catalogue/engine checks pass: locale template round-trips and
opaque values, catalogue completeness, duplicate metadata, wheel validation,
integer-paise settlement, photo rules and game engines.

26 focused Chrome cases passed across the shared-language, public-workflow and
Picksy suites. Four targeted final-delta cases passed again after the protected
Ritual header and duplicate-option changes. Checks cover both languages, native
dropdown values, confirmation cancellation, selected puzzle progress, literal
Home/Options names in Bill Splitter/Picksy/Face-Off, photo validation/results,
checklist checks, calendar inputs, reload/navigation, cross-tab settings and
blocked storage. Two additional theme/layout cases pass (28 unique browser cases
total), covering 72 combinations across both locales, four tools, 320/390/1440px
widths and Light/Dark/Deep. Final mobile screenshots reviewed.

Historical tests were corrected to the current QR validation action, Picksy Spin
workflow and optional sound setting, relative animation duration, and current
Ritual checklist/month input. These corrections do not change app behaviour.

Production frontend build passes with 1,247 exported public assets. Syntax and
whitespace checks pass. No wider platform/API suite or live deployment verification
is claimed. Logs: `.publish/public-languages-final-unit.log`,
`.publish/public-language-final-verified.log`, `.publish/public-language-delta.log`,
`.publish/public-language-theme.log`, `.publish/public-languages-final-build.log`.
Local mobile Hindi/Gujarati screenshots reviewed; Gujarati Ritual header and tabs
were checked after their app-owned correction.

## Content boundaries

App/design brands, entered names and choices, financial scheme/security identities,
source diagnostic reports and original news/legal/reference documents retain
their original text. Artwork/export language choices remain app-owned; this pass
does not assert every PDF/PNG or all technical astrology results are translated.
The residual scan is a candidate inventory, not a proof of universal coverage or
independent native-speaker editorial review.
