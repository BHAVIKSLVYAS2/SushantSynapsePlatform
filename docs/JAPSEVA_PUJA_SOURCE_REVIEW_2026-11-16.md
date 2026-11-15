# Five puja reading collections — 16 November 2026

## Implemented scope

The Library adds five collections (109 entries total), available without login:

| Collection | Included reading | Default practice target |
| --- | --- | --- |
| Shiva Rudrabhishek | Preparation, short sankalpa, Rudra dhyana, Laghunyasa, abhishek/bilva mantras, all eleven Namakam and eleven Chamakam anuvakas, sixteen short customary offerings, dedication and Shanti | 1 full selected reading |
| Laghurudra | Shared complete Rudra text and preparation, with the selected 11 × 11 recitation order explained | 121 full Namakam recitations, each with its scheduled Chamakam anuvaka |
| Navchandi | Preparation, short offerings, Navarna viniyoga/kara-nyasa/anga-nyasa, full Devi Kavacha, Argala, Kilaka, Tantroktam Ratri Sukta and all thirteen Devi Mahatmya chapters, forgiveness and Shanti | 9 complete readings |
| Ganapati pujan | Preparation, short offerings, opening Shanti, all fourteen Atharvashirsha sections including phalashruti, closing Shanti and dedication | 1 full selected reading |
| Satyanarayan pujan | Preparation, dhyana, short offerings, all five Sanskrit vrata-katha chapters, dedication and Shanti | 1 full selected reading |

This is a named-text reading collection and a selected customary short puja form.
It does not claim to reproduce every regional karmakanda manual, Mahanyasa,
homa/havan, mandala/avarana worship or every optional supplementary stotra.
The scope is explicit in each collection's three-language overview and reader note.
Short upachara offering formulae are labelled as such, not as full Vedic mantras.
Sankalpa explains where actual place/date/name/purpose belong; it does not invent
a user's gotra or a calendrical date. No paid provider, AI generation or new audio.

English/Hindi/Gujarati chapter meanings are original summaries, not complete
translations. Sanskrit, Roman and Gujarati script choices are reading aids;
Vedic accents are omitted, and teacher recitation/proofreading review is pending.
The Sanskrit katha includes the chosen edition's final six later-birth verses.

## Editions and reuse

The new Devi/Katha transcription is adapted from **Sanskrit Wikisource
contributors**, under **CC BY-SA 4.0**. Derivative text is distributed under the
same licence. The closed Reading help includes attribution, licence and links to
each exact source revision. Full source metadata with revision IDs and SHA-256
digests is retained in `puja-text.mjs`; no per-card reference panel is added.

Source revision IDs:

- Devi Kavacha: 310223; Argala: 305095; Kilaka: 305048; Ratri Sukta: 305050.
- Markandeya Purana 81–85: 410281; 86–90: 363171; 91–93: 363170.
- Skanda Purana, Reva Khanda 233–237 (katha chapters 1–5): 404769,
  404765, 404766, 404767, 404768.

Changes: strip navigation, HTML/wiki markup, external commentary and modern
interleaved translations; split named chapters; remove Purana chapter prefixes
from verse markers; normalize whitespace. Keep speaker lines, all numbered
verses and unnumbered terminal lines. The Wiki chapter counts differ from the
conventional Saptashati 700-mantra numbering, which also numbers speaker and
partial-verse units. The app does not invent a 700-verse numbering conversion.

Checked transcription repairs include मुनिश्ष्य → मुनिशिष्य, बन्धुभैः → बन्धुभिः,
मृगृपक्षिणाम् → मृगपक्षिणाम्, खडिगनी → खड्गिनी, जगत्स्त्रष्टा → जगत्स्रष्टा,
महामीशान → महमीशान, विलोक्यं ताभ्यां → विलोक्य ताभ्यां,
सूर्येन्द्रग्नि → सूर्येन्द्राग्नि, अधितिष्ठिति → अधितिष्ठति,
केशा बहवो → केशा बाहवो, माशं चाम्बु → पाशं चाम्बु,
कालख्च → कालश्च, कृत्स्त्र → कृत्स्न, छिन्नखिरसः → छिन्नशिरसः,
शड्गादिभि → खड्गादिभि, चोल्कामुखो → उल्कामुखो,
नृपश्चासी:महामति: → नृपश्चासीन्महामतिः and restoration of the missing negation
in the Brahmin's sleepless-night sentence. Classical spelling comparison:
https://sanskritdocuments.org/doc_devii/durga700.html (no modern translation or
editorial commentary copied). Edition variants were not silently standardized.

The Atharvashirsha, Laghunyasa, dhyana, peace and customary offering formulae are
traditional Sanskrit. The full fourteen-section Atharvashirsha is compared with
Wikisource's Ganapati Upanishad (in Upanishads 91–100) and the standard recitation;
its opening/closing Shanti is expanded in full rather than left as “bhadram …”.
Laghunyasa comparison: https://mahanyasam.com/21-laghu-nyasam/.
Existing Rudram text/source review remains canonical and is reused by reference:
`JAPSEVA_RUDRAM_FULL_SOURCE_REVIEW.md`.

Selected counting traditions checked against:

- Laghurudra: https://archive.sssmediacentre.org/journals/Vol_04/01SEP06/Prasanthi-Diary.htm
  (121 Namakam, eleven complete Chamakam). Other naming conventions exist.
- Navchandi: https://www.kanchimuttseva.org/contribution-to-ati-rudram.php
  (nine Chandi recitations). Homa and local additions remain with the conducting
  priest's paddhati and are not counted as automatically completed by the app.

## Reader, storage and verification

One card disclosure, a Puja collections filter, grouped section selector and
previous/next controls. Section headings and summaries follow the interface
language. Reading script is independent. Per-collection position/script survive
reload in the same tab via sessionStorage, with in-memory fallback. This preference
never changes a japa count. Counter/backup/certificate records store a stable ID
and short practice title, not hundreds of kilobytes of scripture. Existing
IndexedDB/schema/record limits and the three licensed audio recordings remain.

Node checks verify every chapter and verse-marker sequence (including full
Atharvashirsha and all five katha chapters), all sixteen offerings, translated
summaries, the 1/121/9/1/1 targets, backup round-trip and completion certificates.
Browser verification evidence and deployment status are in the functionality ledger.

Research artifacts remain ignored under `.publish/puja-*`; no client information
was sent to a text service.
