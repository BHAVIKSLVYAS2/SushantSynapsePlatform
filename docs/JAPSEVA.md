# JapSeva

Personal mantra practice on behalf of named clients, without login. The user
explicitly authorised browser-only storage on 12 November 2026, superseding the
initial undeployed account/SQLite/D1 implementation.

## Ownership and persistence

apps/japseva/frontend/storage.mjs owns the validated local model, IndexedDB
(synapse-japseva, version 2), atomic version checks and validated backup import.
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

The workspace now separates Ongoing, New request, History and Mantra library.
Only active counters appear in Ongoing; completion moves a request to History
with its completion date and certificate action. Creation has its own screen.
Full mantra text, custom count entry and per-request logs expand on demand.
Mobile navigation fits four destinations without horizontal scrolling. Section
entry and button feedback use short animations disabled for reduced motion.
Existing IndexedDB records, audio counters and backup format are unchanged.
This UI revision is deployed; exact release and verification are in the functionality ledger.

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

Audio listening never increments client chanting counts. No expert pronunciation review or teaching
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

## Counted audio playback (12 November 2026)

The Gayatri learning card has Start auto play, Pause, Reset audio count and a
playback target. Each naturally completed recording adds one audio play and
restarts until that target is reached. Seeking within a recording invalidates
that play. Pausing or leaving the page/section stops automation; starting again
restarts the unfinished recording. A blocked play, media error or failed save
does not claim a successful count. Counts are audio plays, separate from client
chanting counts and certificate eligibility. Other mantras have no verified audio.

Audio counts and targets are included in local backups. Existing version 1
backups remain valid, defaulting to no audio counts. IndexedDB upgrades to version
2 without recreating or deleting the workspace, preventing an old open app from
saving a model that drops the newly added audio field. audio-practice.mjs owns
the player lifecycle; storage.mjs validates bounded audio targets/counts.

Each sankalp includes a direct Meaning, pronunciation & audio button. No login,
external speech provider, server business write or production database migration.

## Platform layout and themes

Screen UI uses the shared premium stylesheet and --ui-* theme tokens. App CSS
is scoped to #main; it does not restyle shared navigation or theme controls.
Learning/player content is side by side on desktop and stacked on phones.
The fixed print certificate palette is independent of screen theme.
