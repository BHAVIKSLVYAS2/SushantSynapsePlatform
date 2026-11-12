# JapSeva

Personal mantra practice on behalf of named clients, without login. The user
explicitly authorised browser-only storage on 12 November 2026, superseding the
initial undeployed account/SQLite/D1 implementation.

## Ownership and persistence

apps/japseva/frontend/storage.mjs owns the validated local model, IndexedDB
(synapse-japseva, version 1), atomic version checks and validated backup import.
app.mjs owns the workflow; library.mjs owns learning content; certificate.mjs
owns the print renderer. packages/ui/canvas-pdf.mjs is shared with Moment Studio.

All clients, names, sankalps, counts and history stay in this browser profile,
shared by anyone using that profile. No account or device sync. Clearing site
data removes records. Export JSON backups to retain or transfer them. Import
validates schema, IDs, limits, client references, history totals and completion
before asking to replace the browser workspace. Replacement and ordinary writes
use an IndexedDB version check so stale tabs cannot overwrite newer work.
Denied/corrupt storage reports an error without a false saved state.

No JapSeva business API, login requirement, organisation assignment, schema
migration or D1/SQLite business writes. Other apps retain their existing storage.
Shared platform chrome can independently read account metadata but receives no
practice data. Browser persistence does not guarantee offline asset loading.

## Available flow

- Add named clients, including yourself for personal practice.
- Create a library/custom mantra sankalp with a target and practitioner name.
- Add one, 108-mala or manual positive repetitions. Overcounts fail; completion
  saves with the count. Daily history uses IST boundaries.
- Complete the target to generate an ivory/gold personal certificate with client,
  full mantra, count, practitioner, date and stable ID. Download PDF or print.
- Export/import backup files for retention or transfer between browsers.
- Learn four traditional mantras with Sanskrit, transliteration, original
  English/Hindi meanings and introductory pronunciation aids.
- Gayatri has locally served verified CC0 audio with repeat and 0.75x playback;
  other recordings remain unavailable. See JAPSEVA_AUDIO.md for provenance.

Listening never increments counts. No expert pronunciation review or teaching
of Vedic intonation is claimed. Certificates acknowledge practitioner-entered
practice, with no digital signature, public verification or promised outcome.

Limits: 200 clients, 200 sankalps, 100 million repetitions per target, one million
per increment, 5,000 daily entries per sankalp and 1 MB backup input. No edit/delete,
payments, client contact collection or automatic delivery. Product name is a
suggestion, not trademark clearance.

## Verification

Unit checks cover targets, overcounts, completion, IST boundaries and backup
integrity. Chrome checks cover no-login/reload, real PDF, backup transfer into
a fresh browser, stale tabs, malformed imports, denied storage, audio playback
and twelve viewport/theme combinations. Release evidence is in the ledger.
