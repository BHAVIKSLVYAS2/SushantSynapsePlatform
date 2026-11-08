# Ritual Prep content expansion: research and discussion

Date: 8 November 2026, Asia/Kolkata.
Status: research only. No application changes or deployment authorised by this document.

## Product direction

Help a family prepare, understand and follow the reading associated with its
selected ritual. Keep the current ritual selector and materials checklist. Add
relevant reading support instead of a large unrelated devotional feed or a
complicated ritual editor. Content depth and trustworthy versions matter more
than the number of items in a library.

No new external API is necessary. Reviewed text and original explanations can
be app-owned static content, loaded only when a reader opens. New audio, video,
offline installation and account sync are separate capabilities, not established
by this proposal.

## Actual current coverage

Reviewed `guides.mjs`, `learning-content.mjs`, `learning.mjs`, `learning-view.mjs`,
the app README and the earlier learning source review. There are fifteen guides:
eight Shubh and seven mourning/remembrance guides. Existing learning already
provides some steps, Sanskrit text, IAST transliteration, meanings and source
notes. The problem is incomplete ritual-specific coverage, not a total absence
of prayers.

| Guide | Current learning | Main gap / sensible expansion |
| --- | --- | --- |
| Daily home puja | Five simplified household steps; Gita 9.26 and short peace refrain | A clearly labelled choice of relevant aarti, common closing prayers and explanation of offerings; no universal deity-specific default |
| Ganesh puja | Six simplified steps; salutation, flower offering, closing formula, peace refrain | Complete reviewed Hindi Ganesh aarti, meaning and where it fits in this sequence |
| Lakshmi / Diwali | Six simplified steps; welcome, flower formula, peace refrain | Reviewed Lakshmi aarti; preparation-to-closing explanation; distinguish ordinary household worship from new-image installation |
| Satyanarayan | Four preparation steps; general offering reflection and peace refrain | Major gap: full versioned katha, chapter navigation, related aarti and original preparation/prasad guidance |
| Griha pravesh | Five preparation steps; same two general prayers | Family/officiant coordination, ceremony stages and relevant optional readings; avoid calling this complete vidhi |
| Namkaran | Four preparation steps; same two general prayers | Explain participants, preparation and stages; family-specific procedure remains explicit |
| Vivah | Four preparation steps; same two general prayers | Explain ceremony stages and roles; avoid mixing regional wedding traditions or claiming a generic complete wedding script |
| Havan / homam | Four preparation steps; same two general prayers | Explain materials and participant roles; officiant-specific mantra and procedure packs need separate review |
| Antyeshti | Eight preparation/support steps; Gita 2.20 and peace refrain; existing male/female/shared notes | Supportive explanations, clearly optional reflections and tradition-specific references; no mandatory generic death-rite text |
| Prarthana sabha | Four gathering preparation steps; same two reflections | A short optional reading programme, readable prayers and simple meanings; do not require public speaking or a prescribed aarti |
| Shraddha / Barsi / Samvatsari | Four preparation steps; two reflections and existing Seedha Chadhava notes | Explain actual guide scope, family/officiant roles and regional differences; no universal annual remembrance script |
| Asthi planning | Four preparation steps; two reflections | Clarify support/planning and optional readings; location-specific procedures require their own sources |
| Day 10 | Four preparation/support steps; two reflections | Better explanation of the family's selected observance; no universal day-number requirement |
| Day 11 | Four preparation/support steps; two reflections; expanded material list already exists | Stage/context notes for materials and roles, reviewed for the selected tradition |
| Day 12 | Four preparation/support steps; two reflections; expanded material list already exists | Same approach; do not invent a common day-12 liturgy |

There is currently no complete katha/aarti collection. The existing optional
learning disclosure can be easy to overlook. Existing material lists and earlier
source checks are not proof of full liturgical completeness or practitioner approval.

## Source research

These are references and candidate sources, not redistribution permissions.

| Source | What was established | Proposed use / limitation |
| --- | --- | --- |
| [Drik Panchang Satyanarayana collection](https://www.drikpanchang.com/vrat-katha/satyanarayana/satyanarayana-vrat-katha.html?lang=en) | Separates materials, vidhi, five katha chapters and associated aartis | Useful reference structure and cross-check; do not copy its modern narrative/translation or media without clearance |
| [Sri Mandir Satyanarayan Katha PDF](https://www.srimandir.org/wp-content/uploads/2022/01/Satyanarayan-Katha-English-V.pdf) | Temple-hosted English narrative reference, 18 pages | Compare story structure and temple practice; publication online does not establish reuse permission |
| [Drik Panchang aarti collection](https://www.drikpanchang.com/lyrics/aarti/aarti-collection.html) | Deity-specific collection, including multiple Ganesh aartis and Hindi/English presentation | Identify candidate titles/versions and distinguish aarti from other readings; artwork, recordings and translations are separate works |
| [Drik Panchang Ekadashi collection](https://www.drikpanchang.com/legends/ekadashi/ekadashi-vrat-katha.html) | Separate named Ekadashi stories rather than one interchangeable story | Future collection; only connect to the calendar after named observance mapping is independently verified |
| [BAPS London: Arti](https://londonmandir.baps.org/worship/arti-the-hindu-ceremony-of-light/) | Explains the ceremony and links its own Swaminarayan text/audio | A useful tradition-labelled explanation; do not present Swaminarayan wording as universal or reuse its audio without rights |
| [BAPS practices](https://www.baps.org/About-BAPS/WhoWeAre/BasicBeliefs/Practices.aspx) | Current existing guide reference for one devotional tradition | Preserve its scoped attribution when revising household explanations |
| [Sanskrit Documents](https://sanskritdocuments.org/) and [reuse FAQ](https://www.sanskritdocuments.org/faq/) | Large text index; FAQ restricts website/promotional/commercial reposting without permission | Cross-check/reference and permission candidate; not a ready-to-import free content dump |
| [Gita Press](https://gitapress.org/) | Publisher catalogue contains devotional editions, e-books and audio offerings | Identify an exact edition for possible source review/permission; catalogue access does not clear reuse |
| [Columbia Hindu Students Organization booklet](https://www.columbia.edu/cu/hso/BhajanBook2012.pdf) | Additional published reading collection surfaced in research | Candidate cross-check; no publisher endorsement or reuse clearance established |

Do not treat modern editions, editorial Hindi/English/Gujarati translations,
recordings or illustrations as reusable merely because underlying devotional
traditions are old. Each chosen edition and each media asset needs a recorded
reuse basis. Where appropriate, prepare original plain-language explanations and
independently reviewed transcriptions from an established permissible source.

## First useful content release

Four integrated packs would give the clearest benefit without attempting every
ceremony at once:

1. **Satyanarayan:** a named/versioned five-chapter katha for reading, chapter
   navigation and resume, relevant aarti, a short original story overview,
   preparation order, prasad ingredients/context and completion guidance.
   Clearly distinguish the full reading from a summary or original retelling.
2. **Ganesh:** existing simplified sequence plus one reviewed Hindi aarti
   (candidate: Jai Ganesh Deva), simple meaning and when to read it. Other
   versions, such as Marathi Sukhkarta Dukhaharta, are separately labelled editions.
3. **Lakshmi / Diwali:** existing simplified sequence plus a reviewed Lakshmi
   aarti (candidate: Om Jai Lakshmi Mata), original offering/closing explanations
   and practical preparation notes. Do not silently add a full installation rite.
4. **Daily household puja:** short optional opening/closing prayers, original
   meanings, and relevant aarti choices. If Om Jai Jagdish Hare is included, label
   its Vishnu/Jagdish context rather than calling it mandatory for every deity.

The existing selected ritual should surface the matching readings. For example:
Satyanarayan -> checklist -> preparation order -> katha chapters -> aarti -> prasad.
This is a proposed navigation aid, not an assertion that all traditions use one
fixed sequence. Preserve the selected version's actual order and optional steps.

Candidate aarti titles are a research shortlist, not yet approved transcripts.
Every full text needs edition-level checks before implementation. Avoid treating
Satyanarayan aarti and Lakshmi aarti as interchangeable because names overlap.

## Later content, after the first packs are reviewed

- Shiva, Hanuman and Devi aartis; Hanuman Chalisa as a separately labelled text,
  not a synonym for Hanuman aarti.
- Named Ekadashi stories and selected other vrat kathas, individually versioned.
  Do not attach a generic katha automatically to all dates with the same tithi.
- Gujarati readings, potentially including a reviewed Jay Adhya Shakti edition,
  if this matches the language preference and a suitable source is established.
- More detailed explanations for Griha pravesh, Namkaran and wedding stages,
  without claiming to replace a tradition-specific officiant.
- Optional prayers/reflections for remembrance gatherings, with a separate tone
  from celebratory worship. Preserve the family's choice of readings and ceremony.

Do not expand all fifteen guides into supposed complete ritual manuals in one
release. Material quantity, day numbering, fasting, participants and mantra
practice cannot be made universal by combining unrelated sources.

## Reading experience: simple and practical

Keep the current selector/checklist. Provide one obvious ritual-specific entry,
such as **Read katha & aarti**, near the selected ritual. Within the reader, show
only the relevant content: chapters, aarti or short prayers. Replace/reuse the
existing optional learning area rather than adding another competing outer app
navigation row.

Use large adjustable text, clear verse/stanza breaks, chapter navigation and a
return-to-checklist action. Show the full reading first; transliteration and
meanings can expand on demand. Record a reading position separately from arranged
materials; a reading position must not mark a ritual as spiritually complete.
Reuse appropriate print/save-PDF behavior for reading pages. Do not promise that
existing checklist image sharing can export a long katha.

Possible helpers: plain explanations of aarti/mantra/stotra/katha, an optional
reading overview, relevant ingredient notes, and small context-specific questions.
Avoid repeatedly interrupting every verse with disclaimers or source panels;
keep concise scope/version information near the title and details at the end.

Language priority was asked asynchronously. Pending the user's answer, the
baseline remains existing Hindi/English support, not an assumed Gujarati rollout.
Gujarati script, Hindi transliteration into Gujarati and a Gujarati translation
are different content products; label each accurately. Do not auto-translate
mantras or imply a generated translation is a traditional recitation text.

Audio is a separate later decision. A text-only first release needs no media API.
Device speech, if added, is a reading aid with voice availability limitations,
not verified chanting. Human recordings need permission, pronunciation review
and deliberate playback; no automatic third-party embeds.

## Content acceptance criteria

For each reading record: stable ID, exact title, deity/ritual association,
language/script, edition/version, chapter/stanza ordering, complete/summary flag,
source locator, reuse basis, original meaning author, variation notes and actual
review status. Do not claim pandit/scholar approval without a recorded review.

Cross-check chosen text against suitable editions and obtain a competent reader's
review where required. Keep refrain repetitions, narrative order and punctuation
deliberate. Never silently mix variants into a synthetic 'complete' katha.
Prepare clear correction handling and version history for later fixes.

Verify long Hindi words and conjuncts, scripts, chapter links, keyboard navigation,
large-text mobile layout, print pagination, copying and saved-position behavior.
Protect current checklist IDs, edits, checkmarks, material assignments, themes,
language selection, calendar rules and previously saved state.

## Decisions for the next discussion

1. Confirm the four-pack first release or choose a smaller starting pack.
2. Confirm reading languages/scripts and whether transliteration is needed first.
3. Choose permissible full-text editions and who will review them. Source
   identification has progressed; full-text rights and practitioner approval
   remain unresolved, not presumed.
4. Agree on the single reader entry and defer audio/media unless specifically needed.

No app implementation, source text import, permissions outreach, calendar change,
schema change or deployment occurred in this research session.

## Authorised implementation — 8 November 2026

The subsequent implementation uses newly authored English/Hindi prose only:
four reading packs (daily, Ganesh, Lakshmi and Satyanarayan), with a five-part
Satyanarayan summary explicitly distinguished from a complete ritual katha.
Daily/Ganesh/Lakshmi closing prayers are labelled original, not traditional aarti.
No modern source wording, translations, scans, recordings or artwork were imported.
Historical editions were investigated but no full third-party aarti or katha was
accepted: edition verification and review remain unresolved. Existing short
mantras and their existing editorial meanings are unchanged.

Content version: `readings.mjs`, authored 2026-11-08. Stable associations use the
existing four guide IDs; chapters are ordered editorial summaries, not claimed
canonical chapter boundaries. Reuse basis: original editorial authorship. No
priest/scholar certification. Future corrections use normal source version control.
The reader identifies this scope visibly and includes it in downloadable notes.
Position is saved separately in browser storage; no API or account sync is added.
Chapter navigation, accessible large text and the existing notes download are
included. Dedicated reading print layouts, full liturgical texts and audio remain
deferred. No copyright clearance or zero-liability guarantee is represented.
