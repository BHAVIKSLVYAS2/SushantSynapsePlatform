# P09 birth details and Kundli UI evidence

Completed 2026-10-24 within the internal, local-preview scope. No public release
or production deployment is claimed. Earlier numerical/source acceptance gates
remain open; results are nominal and do not certify P14 birth-time stability.

## Implementation

App-owned `frontend/birth-app.mjs` provides blank, memory-only birth entry,
offline city/state selection by explicit place ID, optional name/elevation,
exact/approximate/unknown time modes, and a separate review before calculation.
Review shows local civil time, timezone/offset and resolved UTC or possible
interval. Unknown times are never replaced by noon. Edits invalidate results.

`birth-report.mjs` composes existing pure kernels independently: sidereal
positions, D1, D9 and Vimshottari. A withheld D9 does not hide an available D1.
Uncertain or boundary-sensitive inputs retain typed per-feature diagnostics.
The preview uses the device clock; a future HTTP adapter must supply trusted
current time for authoritative future-date validation. Names stay outside math.

English, Hindi and Gujarati labels share unchanged numeric data. North/South
charts, keyboard house selection, positions table and selectable Dasha major/
minor periods use shared theme tokens. The Dasha display includes balance at
birth, pre-birth period origin, current/next transition, local/UTC labels and
the explicit 365.25-day uniform Unix arithmetic convention. Unsupported civil
projections remain unavailable. Source names and technical diagnostics retain
their original labels; independent human translation review remains pending.

Clear cancels queued calculations and removes private input/review/results.
Reload and history restoration do not restore birth details. Only shared theme
preferences may persist. No birth URLs, analytics, geolocation, network API or
storage were added. Provenance exposes profile, data versions and warnings.

`infrastructure/preview-vedic-birth.cjs` binds only loopback (default 4178),
bundles in memory and uses a fixed asset allowlist/no-store/CSP denying runtime
connections. Existing P07 synthetic preview remains separate. Public static
allowlist, registry, authentication, SQLite schemas, Ritual Assist and live
data are unchanged. Kernel/package version remains 0.8.0; no new dependency.

## Verification

- Full isolated `npm.cmd test`: 464/464 passed, zero failures, 210.096 seconds;
  `.publish/vedic-p09-full-tests.log`.
- Focused Chrome suite: 8/8 passed (three existing chart checks and five new
  birth UI checks); `.publish/vedic-p09-browser-final.log`.
- After final localized birth-balance/origin copy, focused Node tests passed
  5/5 and the five birth UI Chrome tests passed again in 28.6 seconds;
  `.publish/vedic-p09-form-final.log`. Full regression preceded that copy edit.
- Tests cover feature-specific withholding, invalid/future input, language
  numeric parity, explicit review, ambiguous places, stale result removal,
  keyboard controls, light/dark/system at 320/390/1440 widths, scoped table
  scrolling, safe literal names, no external/write requests or birth storage,
  clear during calculation, reload and history privacy.
- Final 390px form/chart screenshots visually inspected. Full-page English
  and Gujarati dark screenshots retained under `.publish/vedic-p09-*`.
- Whitespace and absence from the public static allowlist checked.

## Next: P10

Read P01 privacy/provenance contracts and master KU-08, FM-03, export journey
and P10 first. Implement privacy-safe printable/downloadable report controls
with redaction of name, full DOB, time and place by default, and explicit choice
for identifiable output. Preserve provenance, warnings, partial availability,
calendar convention and accessibility. Prefer direct local downloads; no raw
birth public URLs or server logging/persistence. Existing print CSS is not a
completed export feature. Do not change prior math rules, claim source acceptance
or deploy publicly as part of that work without satisfying release gates.
