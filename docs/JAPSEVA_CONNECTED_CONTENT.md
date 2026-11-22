# Connected Mantra Granth: audit and implementation

## Existing system and root causes

Audit date: 2026-11-23. The catalogue is a static ES-module graph rooted in
`apps/japseva/frontend/library.mjs`, not an API/database content service. It
composes 110 entries from short invocations, expanded/Gayatri/Rudra collections,
long readings, full Rudram and puja collections. `collection-view.mjs` mounts
the existing index/book shell; `chapter-reader.mjs` handles long readings.
Meaning/reading-aid fields are maintained in modules; some script aids are
algorithmic transliterations. No runtime translation or Sanskrit TTS service
exists. Nishi only supplies a reviewable practice-form draft; production AI is
disabled. The backend directory has no content implementation. Explicit static
routes in `server/static-assets.js` and the Cloudflare build publish modules.

Practice records live in the existing IndexedDB workspace (`storage.mjs`), with
schema-1/2 backup compatibility. Counts reference stable mantra IDs and compact
text snapshots. Local reading settings/position are separate preferences.
No content migration belongs in Chambers SQLite or organisation D1.

Three local, attributed recordings (Gayatri, Shiva, Vasudeva) feed HTMLAudio and
`audio-practice.mjs`. Whole completed recording plays are counted separately
from japa. There are no reviewed line/word timestamps, no pilot recording and
no evidence of pronunciation-expert signoff. A licensed recording is not proof
of matching text, completeness, accent tradition or pronunciation correctness.
The existing player handles errors, targets, repeat and speed; retain it.

Disconnection comes from flat whole-entry meaning/pronunciation fields, chapter
summaries mistaken for full translation, no line/word identities or independent
verification for text versus interpretation versus audio. Whitespace and
syllable aids are not Sanskrit padaccheda. Recension/accent provenance is often
unspecified. Title similarity cannot establish duplication. Several long puja
entries intentionally reuse texts; never merge them automatically.

## Architecture and safe compatibility

Add a read-only canonical adapter to each existing entry. Preserve every source
string, ID, URL, order, chapter and practice field. Canonical units reference
the original entry/chapter by identity; exact contiguous line slices reconstruct
each text byte-for-byte. Content-derived IDs remain stable across reordering and
change when their text changes; approved editorial IDs can override this for a
reviewed revision. This is a versioned compatibility layer, not a second edited
copy of the legacy catalogue. Tokens are explicitly orthographic surface spans,
not inferred words. Padaccheda/grammar remain nullable reviewed annotations.

Each annotation records line/word references, kind (literal, natural,
contextual, traditional, reflection, usage), language, provenance, review state
and version. Missing content stays missing. Review states: draft, ai-assisted,
source-checked, expert-reviewed; publication is a separate release decision so
shipping UI never upgrades scholarly review. Expert claims require named review
evidence. Source metadata inherited from legacy content remains unverified.
Pilot text is compared with RV 7.59.12; Om is the existing devotional preface,
and Vedic accents are absent. This is not an accented Vedic chanting edition.

Pilot meanings are original, AI-assisted editorial drafts, explicitly pending
independent Sanskrit/Hindi review. No borrowed modern translation/commentary is
republished. Preserve the existing full-mantra summary separately. No ritual
benefit, grammar, padaccheda or traditional commentary is invented.

Audio metadata binds the exact content version and recording identity. Empty
timestamps disable synchronization, segment replay and word highlighting. Both
text and recording versions must match before a reviewed timing map is usable.
Changing modes never creates/restarts an audio element. Manual line selection
works without audio. Existing full-recording playback remains available.

## Migration batches and acceptance

1. Inventory and freeze exact legacy text/chapter/meaning hashes before UI work.
2. Pilot Mahamrityunjaya: explicit line boundaries, surface-word interactions,
   line-linked draft meanings and source/context disclosure in existing Learn.
3. Adapt remaining short readings conservatively, without distributing a whole
   translation among guessed lines; mark mappings pending.
4. Adapt chapter texts as exact structural units. Keep existing reader and
   honest chapter-summary labels. Do not render thousands of annotation panels.
5. Validator checks identities, reconstruction, span integrity, references,
   review evidence and audio bindings. Inventory reports duplicate exact texts,
   repeated meanings and pending annotations for human review, never auto-merges.

No destructive database migration, paid service, generation endpoint or new
practice schema. Rollback is removal of adapter/UI imports; source data stays
unchanged. New modules require explicit static exports. No offline guarantee:
there is no JapSeva service worker; browser HTTP cache is not offline support.

### Canonical schema v1 (implemented, not a database schema)

`canonical-content.mjs` is the schema constructor and executable validator.
`library.mjs` exports `canonicalMantras` and a non-enumerable compatibility
`entry.canonical` property; existing serialization and practice records stay small.

| Record | Fields and invariants |
| --- | --- |
| Mantra | `schemaVersion`, stable `id`, `titleSanskrit` (null if unknown), `alternativeNames`, association/category, source evidence, scripture reference, tradition/recension (nullable), language/script, verification, publication state, text version/history, variants, ordered units, audio, review queue |
| Unit | Stable section ID, order, exact original text, original source reference, lines, existing whole-entry/chapter summary with empty line mapping |
| Line | Stable ID, order, UTF-16 start/end offsets into unit text, exact text, optional verse ID, boundary review status, nullable pronunciation/padaccheda, surface words, annotations |
| Surface | Stable ID, exact span in line text, `orthographic-surface` kind, nullable reviewed grammar, individually reviewed glosses; never asserted to be a linguistic word merely because whitespace exists |
| Annotation | Exact line ID and relevant surface IDs, mantra version, language, literal/natural/contextual/traditional/reflection/usage kind, text, source references and independent verification |
| Audio | Existing asset/source/creator/licence, exact text version, SHA-256 recording version, nullable duration/tradition, independent verification, nullable reviewed alignment |
| Alignment | Matching text and recording versions, named reviewer/evidence, monotonic in-range start/end per stable line ID; missing/stale/unreviewed data is unusable |

All six interpretation kinds have separate identities; absent traditional,
reflective and usage annotations are omitted, not invented. Future reviewed
padaccheda must keep its own source/evidence and never replace sandhi text.
Line IDs derived from text change with a changed surface; pilot IDs are explicit
and its exact-text guard requires review on edits. Text revision fingerprints
are deterministic change labels, not security hashes; the inventory uses SHA-256
for independent preservation checks. No punctuation/Unicode normalization writes
back into a source. Display groups are not claimed to be authenticated verse or
metrical boundaries. The pilot's three groups preserve joined sandhi intact.

Workflow: an author submits a draft (AI-assisted if applicable), a source checker
records field-specific evidence, and an independent expert records reviewer and
evidence before an expert state can validate. Publication is separate. There is
no automatic promotion when building/deploying. Validation checks structural
consistency, not Sanskrit grammatical or theological truth. Semantic claims and
lexical uncertainty remain in the explicit review queue.

## Sources and review queue

Pilot text comparison: [existing RV Mandala 7 edition](https://sanskritdocuments.org/doc_veda/r07.pdf)
and [RV 7.59 primary text/commentary transcription](https://sa.wikisource.org/wiki/ऋग्वेदः_सूक्तं_७.५९).
Only the traditional verse already in the catalogue is used. Modern source
copyright/licences remain separate; links do not license republishing a book.
The preface, unaccented text, and sandhi are preserved, not normalized away.

The inventory finds an identical *opening* `text` field among five puja entries;
their complete chapter sequences differ. This is reuse, not proof of duplicate
collections. No exact repeated whole-entry English meanings were found; that
does not prove semantic accuracy or rule out templated/generic explanations.
No automated grammar inference or semantic-source verification is claimed.

Every legacy interpretation needs independent review. Pilot lexical glosses,
singular/plural voice in the closing prayer, fruit/bond imagery, sandhi analysis
and Shiva/Rudra contextual identification require Sanskrit reviewer signoff.
All approximate pronunciation aids need teacher review; all three recordings
need text/recension/completeness audit before segment alignment. Long readings
need line translations, word boundaries, source/recension review and any missing
licence evidence. Automated checks cannot establish spiritual or linguistic truth.

## Verification and remaining limits

Reading-first correction (2026-11-23): the default Learn view again retains the
complete primary mantra, existing whole-mantra meaning and pronunciation aid.
Only the annotated Mahamrityunjaya pilot offers a closed-by-default “Study line
by line” disclosure after the meaning. Unannotated short readings no longer
mount numbered duplicate text or mapping-pending notices. Pilot draft status,
word glosses, source details and saved line selection remain inside study.
Study text uses the full available width instead of a permanent 50px number
gutter. Contents availability sits beside entry titles rather than adding an
extra row; redundant group-summary margins are removed. No content, recording,
canonical identity or practice storage changes. This supersedes the earlier
default replacement of primary Sanskrit and mapping notice on every short entry.
Twelve Node checks and eighteen mobile language/theme browser cases pass,
including whole-text visibility, closed study default, optional glosses, scripts,
audio continuation, repeat/speed, practice prefill, saved line and Rudram.

`node tools/audit-japseva-content.mjs --baseline=3ffb75f --write` compares the
previous library exports and SHA-256 inventory: 110 entries, 231 units, 4,065
structural lines; zero structural/Unicode errors or warnings. Exact original
text, chapter order, meanings, aids and audio references match the baseline.
Rudram's sections use stable book/anuvaka identities, not missing legacy `id`s.
The audit verifies the three actual recording-file SHA-256 digests. No source
is promoted to expert-reviewed and no old practice record is migrated.

Twelve focused Node tests cover preservation, Unicode/conjuncts/accents, line
ordering, word spans, review evidence, version invalidation, real audio hashes,
counts, backups, corrections and full Rudram/puja sequences. Chrome checks 18
360/390px language/theme combinations, manual selection/glosses, explanations,
scripts, Recite/Learn, source absence of pilot audio, practice prefill and existing
Rudram. A real existing recording plays while switching modes; speed/repeat and
saved pilot line/deep-link reload work. Screenshots inspected. No production
business writes; isolated browser/database and non-GET API requests blocked.

Only the pilot has new line-linked meanings; other short readings retain a
clearly labelled whole-mantra interpretation and one pending-mapping note.
Long readings keep the existing chapter UI and summaries. No missing word gloss
gets a fake action. There are no authenticated padaccheda, grammatical analyses,
traditional commentaries or new ritual rules. The three recordings are retained,
not independently certified for full textual/recensional/phonetic agreement.
No measured duration or verified segment timings are supplied. Timestamp
validation/invalidation exists, but there is deliberately no synchronized or
segment-replay UI until reviewed timing data and an integration are supplied.
Full-recording repeat/count behavior remains the established implementation.
No offline service worker or runtime AI generation was added.

Changed implementation groups: `canonical-content.mjs` (schema/validator),
`mahamrityunjaya-connected.mjs` (guarded pilot drafts), `connected-reader.mjs`
(in-place Learn), `library.mjs`/`collection-view.mjs` (compatibility/integration),
`book-reader.css` (theme-token study typography), static allowlist, focused tests,
audit tool and documentation. Independent linguistic/audio acceptance remains
pending; publishing this software does not publish those drafts as verified.
