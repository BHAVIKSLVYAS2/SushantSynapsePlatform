# P01 evidence and handoff

Date: 2026-10-24 (Asia/Kolkata). PHASE COMPLETE: design/reference-plan milestone.
Calculation profile validation and production activation are not complete.

## Delivered

- `P01_CONVENTIONS.md`: versioned India-first calculation contract, specified
  Lahiri variant, mean-node/whole-sign/365.25-day choices, uncertainty/boundary
  semantics, safe diagnostics and privacy rules.
- `P01_REFERENCE_PLAN.md`: provenance/acceptance states, independent JPL/IMD
  comparison tracks, phase-specific fixture matrix and proposed per-quantity
  tolerances. No invented golden positions or tolerance approvals.
- `P01_SOURCES.md`: primary-source links, observed terms, actual local bundle/data
  hashes, source-fetch failures, alternatives and downstream acceptance gates.
- `PROGRESS.md`: durable resume instructions, phase status and next actions.
- `FUNCTIONALITY_LEDGER.md`: actual scope and evidence, preserving prior edits.

## Verification boundary

Primary-source pages reviewed using web tools; initial IMD explanation/index
fetches failed with 502 and the root timed out. Official search results and the
release notice established the publication source, not golden values. No NASA
or IMD numeric fixture was acquired or compared. No Lahiri/node calculation was
implemented. The proposed tolerances remain unmeasured and unapproved for release.

Measured local runtime and artifact SHA-256 values are in `P01_SOURCES.md`.
Documentation checks passed: six project documents, four local Markdown links,
nine required convention entries and nine reference-plan gates. Verified no
P02 kernel/app directories were created. `git diff --check` passed. These are
documentation checks, not numerical tests. P00's 26 regression passes are historical
baseline evidence only; no repeat API/browser/full-suite/build pass is claimed
for this documentation-only phase. No runtime, package, schema, auth, account,
deployment or business-data changes.

## P02 handoff

Next scope is place + civil-time normalization only, following this baseline.
Read repository continuation rules, `PROGRESS.md`, P00 and all P01 documents.
Add pure normalization under `packages/vedic/`, with app code reserved for
`apps/rashifal-kundli/`; no public route/card yet. Freeze and retain source
artifacts/provenance before deriving a minimal offline place/rule dataset.
Reuse useful existing data with truthful approximate precision labels; do not
silently equate PIN medians to exact city/village locations.

Implement strict input validation, explicit exact/approximate/unknown time,
versioned India-range conversion, unambiguous place selection and safe typed
diagnostics. Use independent civil conversion fixtures, country/coordinate
validation, rejected range endpoints/invalid dates, interval midnight rollover,
duplicate place names, foreign-zone denial and no private logging/persistence.
Use disposable DATA_DIR values wherever any runtime fixture is started.
Do not implement P03 astronomy, expose precision claims or change Ritual Assist.

If work is interrupted, update `PROGRESS.md` with completed edits, command/results,
unresolved decisions and next concrete action before yielding when possible.
On resume inspect git status/diff and files first; do not replay migrations or
assume an in-flight test completed. P01 does not authorize production deployment.
