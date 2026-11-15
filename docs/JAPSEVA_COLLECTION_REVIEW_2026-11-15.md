# JapSeva collection — 15 November 2026

Deployed from source `1b80b63`, Worker `3c8ab073-c8e4-45b7-afec-0de58b9df4b4`.
Live verification and release evidence are recorded in the functionality ledger. The collection contains eight
entries, retaining the original four IDs/texts and their recording associations.

| Added entry | Text reference checked | Form displayed |
| --- | --- | --- |
| Mahamrityunjaya | [Rigveda 7.59.12, Mandala 7](https://sanskritdocuments.org/doc_veda/r07.pdf), printed p. 36 | Unaccented traditional verse; customary Om preface is identified |
| Narayana Ashtakshara | [Narayana Upanishad](https://sanskritdocuments.org/doc_upanishhat/nArAyaNopaniShat.html), third section | Om namo narayanaya |
| Saha Navavatu | Same Upanishad's opening and closing invocation | Study invocation with the peace refrain; unaccented |
| Purnamadah | Brihadaranyaka Upanishad 5.1.1; customary prayer form cross-checked against [VHP of America daily prayers, 2004](https://sanskritdocuments.org/doc_z_misc_general/DAILY_PRAYERS04.pdf), p. 2 | Om preface and customary closing peace refrain |

These are ancient public-domain devotional texts, independently transcribed
without Vedic accent notation. Reference editions/PDFs and their volunteer
metadata are linked for study, not redistributed as assets. No modern translation
or recording was copied from those editions. Meanings, approximate aids and UI
translations are original editorial work. No efficacy, medical or guaranteed
outcome claim is made.

Each entry now has an English/Hindi/Gujarati name and meaning, Roman
transliteration, and approximate reading aids in Roman/Devanagari/Gujarati.
Changing script represents the same Sanskrit, not a translation of the mantra.
The Sanskrit source remains visible separately. Joined recitation forms are
retained where separating underlying words could change the reading. Script
mapping is not a pronunciation certification or Vedic-accent lesson.

All eight entries and all three recordings still require qualified teacher
pronunciation review. The earlier four-entry review packet is historical and
remains useful for teacher questions; its pending status is not superseded by
these implementation checks.

The library follows the shared app language and exposes an independent script
selector. Search matches names, Sanskrit, transliteration, meanings and aids in
all three languages. Clearing an empty search restores the collection. Opening
learning from a request clears the collection filter before showing its mantra.
Hidden audio cards pause instead of playing behind filtered results.

The sound guide and audio controls/status are localized. Language/script changes
update text in place without rebuilding players, replacing saved records, or
writing preferences into the practice backup. A typed audio-target draft survives
language changes. The new-request mantra selector uses localized labels while
retaining IDs and leaving entered Sanskrit/custom text alone.

Only Gayatri, Shiva and Vasudeva have recordings, with the existing verified
creators, assets and licences from [audio provenance](JAPSEVA_AUDIO.md). Ganesha
and the four new entries explicitly show audio unavailable. No generated speech
or unrelated recording is presented as Sanskrit instruction. Audio counting,
chanting/certificate separation and storage schema remain unchanged.

Verification:

- Five model checks pass, including eight unique IDs, complete three-language
  content, correct scripts and unchanged recording allowlist.
- All nine existing browser workflows pass: audio completion/reload/seeking,
  certificates/PDFs, backups, stale tabs, storage failure, upgrades and counts.
- CLI checks 27 language/theme/width combinations at 320/390/1280px, script
  override, Gujarati search, empty recovery and exact saved-state preservation.
- A complete counted Gujarati recording passes; target draft and chanting
  records remain unchanged.
- Production build exports 707 assets. New public modules are explicitly
  registered; no schema, database, account or production changes.

Evidence: `.publish/japseva-collection-{model-final,browser,review,audio-review,
build}.log`; `output/playwright/japseva-collection-gu.png`.
