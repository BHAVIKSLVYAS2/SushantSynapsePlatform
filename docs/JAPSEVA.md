Header Back (2026-11-19, local): the shared arrow returns reading → contents,
certificate → request, request → list, and form/tab → previous app view, with
safe app/Home fallback. Duplicate in-content arrows are hidden with the shared
header. Counts/records stay unchanged. docs/HEADER_BACK_NAVIGATION_2026-11-19.md.
Not committed/deployed.

Book Library (2026-11-19, local): numbered searchable contents with category/
deity filters and same-tab continue-reading. Opening a reading hides index
controls; previous/next follow filtered results. Existing long-text chapter
selection, script aids, practice action and required licences remain. Subtle
cancellable page-turn respects reduced motion. Theme-token paper layout uses
one mobile column/two desktop columns, selectable text and normal long-chapter
scrolling. Details: docs/JAPSEVA_BOOK_UI_2026-11-19.md. Not committed/deployed.

Five puja collections (2026-11-16, deployed source b50dfe2): Shiva Rudrabhishek, Laghurudra,
Navchandi, Ganapati pujan and Satyanarayan pujan join the Library (109 entries).
Full named Sanskrit texts use the existing grouped reader with Sanskrit/Roman/
Gujarati script choices and original English/Hindi/Gujarati summary meanings.
Puja collections filter; compact rows show section counts. The five collections
contain 101 sections, reusing the canonical 22 Rudram anuvakas. Selected short
customary puja forms are explicit; regional homa/karmakanda manuals are not claimed.
Targets default to 1/121/9/1/1, with +1 meaning explained in each overview.
Same-tab reload restores chapter/script, never a count. Existing backup storage
and licensed audio remain unchanged. Required text attribution stays inside
closed Reading help. Scope, editions and licence:
docs/JAPSEVA_PUJA_SOURCE_REVIEW_2026-11-16.md. See ledger for release status.

Reference cleanup (2026-11-15, local): removed per-card Sources & notes,
comparison links and per-anuvaka source links from reading/practice screens.
Unique text references remain under the existing closed Reading help section;
recording credits/licences remain beside audio controls. Shorter three-language
help/status copy; Sanskrit, source metadata, all 22 chapters and counts unchanged.
Scope: docs/REFERENCE_CLEANUP_2026-11-15.md. Not deployed.

Complete Shri Rudram (2026-11-15, local): added all eleven Namakam and eleven
Chamakam anuvakas as one full reading, with chapter selection, previous/next,
three-language summary meanings and Sanskrit/Roman/Gujarati script choices.
The same reader works in practice. One count means one complete 22-anuvaka
recitation; setup defaults to one, with mala shortcuts omitted for this entry.
Records/certificates use the complete text's title and stable ID, preserving the
existing storage limits/schema. The library now has 104 entries. Unaccented
study edition; teacher recitation review pending. Source scope and verification:
docs/JAPSEVA_RUDRAM_FULL_SOURCE_REVIEW.md. Not deployed.

Rudrabhishek mantra additions (2026-11-15, local): added three chant entries,
bringing the library to 103: Rudra Invocation (Om Namo Bhagavate Rudraya),
Rudra Namaskara (Namaste Astu Bhagavan), and the first two riks of Namakam
Anuvaka 1. Existing Shiva Panchakshara, Mahamrityunjaya and Rudra Gayatri stay
canonical. Search accepts Rudrabhishek/Rudrabhishekam, Hindi and Gujarati;
entries use the existing cards, Shiva topic, meanings, reading aids and practice
action. No aarti or puja procedure is added. Deployment pending.

The Namakam entry is explicitly an opening excerpt, not the entire first
anuvaka or full Namakam–Chamakam. It follows Krishna Yajurveda, Taittiriya
Samhita 4.5.1, riks 1–2, as numbered in the linked Advaita Vedanta study. The
short invocation is a customary preface; Namaste Astu Bhagavan is accompanying
praise printed after Anuvaka 1, not attributed to the numbered Samhita mantras.
Traditional Sanskrit and original English/Hindi/Gujarati summaries are supplied;
shared Roman/Gujarati conversions are unaccented aids, not Vedic pitch notation.
Teacher recitation/pronunciation review remains pending. No new audio or schema.
Sources: https://www.advaita-vedanta.org/series/shri_rudram/verses_from_the_shri_rudram-1.htm
and https://ganeshatemple.org/wp-content/uploads/2020/02/Sri_Rudram_Namakam_Devanagari_Large.pdf.

Gayatri expansion (2026-11-15, local): 60 new source-linked deity Gayatris;
100 library entries in total, including 62 under the new Gayatri category.
Existing Savitri/Surya IDs, practice records and three licensed recordings remain
unchanged. New entries have original English/Hindi/Gujarati summaries and shared
unaccented Roman/Gujarati script aids; no new recordings. See
docs/JAPSEVA_GAYATRI_SOURCE_REVIEW_2026-11-15.md for scope, sources and admission
limits. Deployment pending.

Released 2026-11-15: source fc0f0a7, Worker
8ad99e07-5674-4706-bb4a-b33a6dd7c50d. Consolidation, filters, one-toggle guides
and WhatsApp request drafts below are deployed. Earlier local status notes are
superseded. Live 27-case library/request matrices pass; WhatsApp is a user-sent
draft, with no automatic delivery or new audio recordings.

Collection consolidation (2026-11-15, local): JapSeva now owns the 19 reviewed
Shloki readings in shloki-content.mjs. Seventeen become new entries; existing
Mahamrityunjaya/Purnamadah IDs remain canonical, with the additional references
retained. The library has 40 unique entries. Complete four-verse Gita/Bhagavata
groups, Sanskrit, English/Hindi meanings and source locators are preserved.
Gujarati editorial summaries and unaccented Roman/Gujarati script conversions
complete the existing guide format; teacher pronunciation review remains pending.
The two previously unverified readings remain excluded. No new audio.

Category, deity/topic and audio filters combine with search. Category options:
name mantras, Vedic mantras, prayers/salutations, scripture readings, peace
invocations and Navagraha. Reset/empty states clear filters. Guide entries retain
one disclosure and the existing client-practice action. Old Shloki query links
are forwarded by the Ritual Prep library link to the matching JapSeva reading;
duplicate aliases open their existing entry. Ritual Prep's separate reader and
public reader assets are removed. Records/storage schemas are unchanged.
Not deployed yet.

Mantra requests (2026-11-15, local): Request a mantra opens a short modal with
name and optional text/reference. Continue to WhatsApp prepares a message to the
platform's existing +91 78741 66009 contact; the user must press Send in WhatsApp.
There is no automatic delivery, request database or automatic library publication.
Drafts contain only entered suggestion content and the public JapSeva URL, never
client practice data. English/Hindi/Gujarati supported. Not deployed yet.

Disclosure follow-up (2026-11-15, local): one toggle per mantra. The opened guide
shows text, meaning, pronunciation, audio controls and references as plain
sections. Reading help also has one level. Consistent right-aligned CSS chevrons
replace mixed native/glyph arrows throughout JapSeva; keyboard semantics remain
native. Practice audio docking/restoration and client counts are unchanged.
Verification is recorded at the top of the functionality ledger. Not deployed.

Released 2026-11-15: source 67dfb82, Worker
4b7659a0-ca0b-44c2-9560-6531562b0507. The library simplification and guide expansion
below are live at https://apps.sushantsynapse.com/japseva. All 27 live library
language/theme/width checks and practice-prefill checks pass. Earlier local-only
status notes below are superseded by this release; recording scope is unchanged.

Library simplification (2026-11-15, local): compact, full-width native disclosure
rows replace always-expanded cards. One guide opens at a time. Browsing shows
name, one-line Sanskrit preview and an audio indicator where available. The
opened guide has a Use for practice action that prefills the existing request
form; creating a request still requires the normal client/target submission.
Full text/meaning remain readable, with pronunciation, sources and repeat/audio
settings in secondary disclosures. Script choice lives inside pronunciation;
reading help follows the list. The library header is shorter on phones. Existing
audio nodes/sessions still move into active practice and restore into their
guide without duplicates. Closing a guide stops its library audio. Themes,
keyboard controls and reduced motion use shared conventions. Not deployed yet.

Mantra guide expansion (2026-11-15, local): 23 entries now include nine Navagraha
nama invocations (Surya, Chandra, Mangala, Budha, Brihaspati, Shukra, Shani, Rahu,
Ketu) and Saraswati, Lakshmi, Durga, Hanuman, Rama and Krishna nama mantras.
Each follows the existing Sanskrit, IAST, English/Hindi/Gujarati meaning and
reading-aid format and can be selected for client practice. Search accepts
Navagraha, navgrah and nav grah. These are short nama invocations, not a complete
Navagraha stotra or bija series. Source reference: Pandit Sri Rama Ramanuja
Achari's [Namavali Sangraha](https://www.australiancouncilofhinduclergy.com/uploads/5/5/4/9/5549439/asthottara_sangraha.pdf),
individual deity sections and Navagraha section (PDF pages 29–37). Traditional
names are transcribed independently; meanings and reading aids are editorial.
No new recordings: audio remains available only for the existing three entries.
Teacher pronunciation review remains pending. Not deployed yet.

Practice audio follow-up (2026-11-15, deployed source a7d45fb): repeat/pause now belongs to the
active request alongside its counter. Meanings and pronunciation expand inline.
One persistent player survives counter redraws and language changes; leaving
practice stops it. Audio remains separate from japa/certificates. Exact text must
match the verified recording. See JAPSEVA_PRACTICE_AUDIO_2026-11-15.md for design,
verification and the installed external frontend-design skill. Live playback and
27 language/theme/width cases pass; Worker dbb9da7f-c455-4059-a12a-5a9b3f454117.

Collection follow-up (2026-11-15, deployed source 1b80b63): eight searchable entries, English/
Hindi/Gujarati meanings and independently selected Roman/Devanagari/Gujarati
reading aids. Audio controls and sound guide follow app language. Three verified
recordings are unchanged; five entries have no verified audio. Teacher review
is pending for all entries. See JAPSEVA_COLLECTION_REVIEW_2026-11-15.md and the
functionality ledger for scope and verified production release evidence.

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
Mobile library filters (2026-11-15, local): search and one labelled Filters
button share a row. All/Gayatri/Navagraha quick chips keep the initial browse
view short; every category remains available as full-label chips in a native
filter dialog (bottom sheet on phones, centred on desktop). Deity/topic uses
a native select; audio uses exclusive chips. Active extra filters have individual
remove actions, the trigger shows the active count, and Show mantras displays
the matching result count. Selection and search combine without changing the
catalogue or practice records. English/Hindi/Gujarati, shared themes, 44px touch
targets, Escape and focus return are preserved. Request a mantra remains beside
the result total as a quiet action. No new package, service or model call.
Local review evidence: .publish/japseva-library-{before,after}.png,
.publish/japseva-filters-{en,hi,gu}.png and existing browser regressions under
.publish/japseva-library-mobile-final/. Not committed or deployed.
Production release (2026-11-15 IST): source 29acc75, Worker
9d7ab57e-47dd-4e40-82c8-334f532c5c9f. Mobile library filters and content cleanup
are live. Three live browser workflows and six route/asset checks pass, with
internal files blocked and AI disabled. No database migration or paid service
activation. This supersedes the local-only status in checkpoints below.

Library content cleanup (2026-11-15, local): removed the text-reference list
from Reading help, library audio players/badges/filter, and repeated audio-
unavailable notices. Texts, meanings, pronunciation aids and all 104 entries
remain intact, with source provenance retained in catalogue metadata and review
documents. Audio cleanup is scoped to the library; existing current-practice
playback and separate audio-play records remain. Players stay detached until
needed by the selected practice instead of returning to library cards.
Recording creators, source links, licences and modification notices remain
accessible inside current-practice Audio settings. No server, schema, migration,
provider or paid service change. This supersedes the audio-filter part of the
mobile-library checkpoint below. Not committed or deployed.
