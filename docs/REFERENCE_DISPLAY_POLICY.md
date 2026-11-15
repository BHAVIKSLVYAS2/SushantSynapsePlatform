# Reference display policy

User direction, 15 November 2026: keep the collection free of unnecessary
references; discuss wider removals before implementing them. Do not add a source
link, publisher name, bibliography or Sources section unless it helps users
complete a task, understand a material limitation, identify the text accurately
or access a required retained credit. Keep research provenance in app data and
repository review documents without displaying it by default.

## Released JapSeva scope

The approved release removes the library text-reference list, audio players,
audio badges/filter and unavailable messages. Practice playback keeps its
recording credits in Audio settings. Mantra texts and source metadata remain.

## Collection audit and approved cleanup

Reviewed app frontend code, the previous source-display audit and public notices.
The user explicitly approved the collection-wide cleanup after discussion on
15 November 2026. The changes below are implemented; release evidence is in the
functionality ledger. This approval covers these presentation changes without
requiring removal of functional data or retained credits.

- Ritual Assist: remove the separate Sources tab in Steps & prayers and its
  publisher-link list. Remove prayer-type captions repeated below the text;
  retain useful scripture identities such as Bhagavad Gita chapter/verse.
  Update legacy Sources-tab navigation so old URLs still open a useful section.
- Ritvayam: remove internal repository paths and source/acceptance-evidence
  commentary from user exports. Keep chart settings, selected methods, time
  accuracy, calculation limitations and concise data/software attribution.
- Public third-party notices: remove the internal `docs/JAPSEVA_AUDIO.md`
  breadcrumb; keep creators, licences, source URLs and modification notices.
- Photo Resize: retain the official requirement link and its verification date,
  since they help users check the selected form's actual specifications.
- Chambers, BatchFee, rent, finance and community tools: retain payment/document
  references, record identifiers and linked entity controls. These are business
  data rather than editorial references. Other scanned utility/game frontends
  had no comparable bibliography block requiring removal.

Do not introduce a new Credits or Sources card on every screen. Retain existing
central legal notices and contextual recording credits. Never remove source
metadata, change calculation results or erase user records as presentation cleanup.

Verification: 17 focused ritual/learning/export tests pass, including export
values and labels in all three languages. Two existing browser workflows cover
all 15 guides in English/Hindi, downloads/printing and preparation scope. An
isolated browser review also verifies old `learn=sources` URLs open Preparation,
retained verse labels, six bilingual viewport combinations, recording/software
credits and all 104 JapSeva entries, with no page errors. Frontend build exports
729 assets. No migration, provider activation or saved-record change.

Released from source `5a007e8`, Worker
`2e4bc326-8bda-4f3c-9dc6-3e718c644ae0`, 15 November 2026 IST.
Final source scan covered 25 frontend directories and 230 non-generated source
files; no internal documentation breadcrumbs or standalone HTML bibliography
headings remain in that scan. Five live JS modules match the tested build
byte-for-byte; home, health, Ritvayam and Photo Resize return 200. Nishi remains
AI-disabled, with no AI binding or new paid service. See the ledger for the
live browser result and retained-credit checks.
