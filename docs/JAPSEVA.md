Pronunciation follow-up (2026-11-14): the learning library has an optional
English/Hindi sound guide with source links. Syllable aids remain approximate;
teacher sign-off is pending. Review packet: JAPSEVA_PRONUNCIATION_REVIEW.md.

Audio follow-up (2026-11-14): Gayatri, Shiva and Vasudeva now have locally
served freely licensed recordings with individual credits and independent saved
audio counts. Ganesha audio remains unavailable. Chanting/certificates stay
separate. Source evidence: JAPSEVA_AUDIO.md; release status: functionality ledger.

# JapSeva

Icon update (2026-11-14, source 66884f8): original japa-mala SVG artwork is used
for the platform home card, app heading and favicon. The home sculpture reuses
the shared amber gradient; the small badge is self-contained. No third-party
icon licence or image dependency. Icon routing is explicitly allowlisted.
Practice records, counters, storage, audio and certificate behavior are unchanged.
Deployment and verification are recorded in the functionality ledger.


Personal mantra practice on behalf of named clients, without login. The user
explicitly authorised browser-only storage on 12 November 2026, superseding the
initial undeployed account/SQLite/D1 implementation.

## Ownership and persistence

apps/japseva/frontend/storage.mjs owns the validated local model, IndexedDB
(synapse-japseva, version 3), atomic version checks and validated backup import.
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

## Compact request lists (15 November 2026)

History and Ongoing use compact rows showing client, mantra and saved count.
History also shows the IST completion date, sorts by completion time, and offers
one Certificate action. Tap the client name to open the request, large practice
counter, corrections and logs. Back to requests closes the certificate too.
Changing sections clears the search; no-match results include Clear search.
The first New request opens Add client automatically. Statistics are compact
inline totals. Counts, IndexedDB schema, backups, audio and certificate content
are unchanged. Release evidence is recorded in the functionality ledger.

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
- Gayatri (CC0), Shiva (CC BY-SA 4.0) and Vasudeva (CC BY-SA 3.0) have
  locally served verified audio with individual source/creator/licence credits,
  repeat and 0.75x playback;
  other recordings remain unavailable. See JAPSEVA_AUDIO.md for provenance.

Audio listening never increments client chanting counts. No expert pronunciation review or teaching
of Vedic intonation is claimed. Certificates acknowledge practitioner-entered
practice, with no digital signature, public verification or promised outcome.

Limits: 200 clients, 200 sankalps, 100 million repetitions per target, one million
per increment, 5,000 daily entries per sankalp and 1 MB backup input. No general edit/delete,
payments, client contact collection or automatic delivery. Product name is a
suggestion, not trademark clearance.

## Verification

Unit checks cover targets, overcounts, completion, IST boundaries and backup
integrity. Chrome checks cover no-login/reload, real PDF, backup transfer into
a fresh browser, stale tabs, malformed imports, denied storage, audio playback
and twelve viewport/theme combinations. Release evidence is in the ledger.

## Counted audio playback (12 November 2026)

Each of the three audio learning cards has Start auto play, Pause, Reset audio count and a
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

## Focused daily practice and corrections (14 November 2026)

Ongoing cards now show a compact progress summary and Continue practice. A single
focused request contains the larger tap counter, +108, custom additions, today's
IST additions/corrections, learning link and expandable history. Back to requests
returns to the list. Ongoing and History support client/mantra search; completed
cards have the completion date and direct certificate access. Creation immediately
opens the new practice. New clients can be added in a disclosure beside the setup
flow; targets accept repetitions or whole malas of 108.

Corrections remove a positive bounded amount, require a reason and confirmation,
and retain the original daily additions plus a separate dated correction trail.
The validated total is additions minus corrections. Removing from a completed
request reopens it and prevents new certificate generation until completed again.
Previously downloaded/printed certificates cannot be recalled. Today's additions
and corrections are displayed separately, including corrections to earlier work.

Backup schema 2 retains corrections and accepts schema 1 imports with empty
correction trails. IndexedDB upgrades in place to version 3; old version-2 app tabs
cannot reopen the upgraded store and silently discard corrections. Existing client,
practice and audio records remain. Stale-revision checks still apply. Audio plays
remain separate from chanting and certificate eligibility. Release evidence is in
the functionality ledger.
