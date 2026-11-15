# Complete Shri Rudram reader

15 November 2026. Local implementation; not deployed.

## Scope and text

The `rudram-complete` entry contains all eleven Namakam anuvakas (Krishna Yajurveda, Taittiriya Samhita 4.5) followed by all eleven Chamakam anuvakas (4.7). It is not the earlier two-verse excerpt. Invocation, Namaste Astu Bhagavan and the explicitly named opening excerpt retain their existing IDs for compatibility. There are now 104 library entries.

This is the complete core Namakam–Chamakam, not a complete regional Rudrabhishek ritual manual. Nyasa, dhyana, supplementary closing prayers and repetitions/interleaving used in particular traditions are not silently incorporated into the 22 numbered anuvakas. Existing short invocations are available separately. No aarti or puja instructions were added.

The local traditional Sanskrit is an unaccented study edition, with per-chapter citations. The sourced Vedic nasal sign `ꣳ` remains in Sanskrit. Roman/Gujarati aids approximate it with `ṃ` / `ં`; these conversions are not Vedic svara notation or certified phonetic instruction. Teacher recitation review remains pending. No new recording is claimed or shipped.

## Sources and extraction checks

- [Namakam · Vedshala](https://vedshala.org/rudram): use only the 27 consecutive `TS 4.5.*` source units. This page also includes Shukla Yajurveda material; the `VS 16.*` units are excluded, so different recensions are not mixed or counted twice.
- [Chamakam · Taittiriya Samhita 4.7](https://vedshala.org/taittiriya-samhita/4/7): use the complete text on each of the eleven anuvaka pages, `/4/7/1` through `/4/7/11`. There are 20 consecutive source units in total. The chapter index alone does not contain the full text.
- [Independent Namakam study](https://www.advaita-vedanta.org/series/shri_rudram/verses_from_the_shri_rudram-1.htm): comparison of the opening riks and invocation.
- [Namakam temple text](https://ganeshatemple.org/wp-content/uploads/2020/02/Sri_Rudram_Namakam_Devanagari_Large.pdf) and [Namakam/Chamakam compilation](https://sanskritdocuments.org/doc_shiva/rudram.html): comparison of scope and section boundaries; these also contain customary supplementary material that is distinguished from the core.

Every anuvaka has its complete sequence of source-unit citations. All 47 units are accounted for. Section parsing checked consecutive source numbering and eleven chapters in each book. Only the ancient Sanskrit text is transcribed; modern source translations, commentaries, typography and recordings are not copied. English/Hindi/Gujarati chapter meanings are original concise summaries, explicitly labelled summaries rather than word-by-word translations.

Normalization is limited to HTML/whitespace decoding, display line breaks at danda punctuation, and three word-spacing repairs. The unit boundary `अस्मि` + `न्ननातुरम्` is joined to `अस्मिन्ननातुरम्` in Namakam 10; `मेऽपान` + `श्च` is joined to `मेऽपानश्च` in Chamakam 1. Internal `इष वे` is displayed as `इषवे` in Namakam 1, compared with the independent opening text. Recensional spelling and other source word forms are preserved. This is not a claim of specialist proofreading of every Vedic word or accent.

## Reading and practice behaviour

One library disclosure opens a reader with a grouped selector for all 22 anuvakas, one displayed passage, script selection, a chapter summary and the current source link. Previous/next buttons sit at the end of the passage so a phone reader can continue after finishing it; navigation returns focus to the new chapter heading below the shared header. Chapter and script position survive language changes and counter renders within the current tab; they are not a new persistent reading-progress feature. Reading/navigation alone never increases a count.

The same reader is available inside an ongoing full-Rudram practice's Mantra text panel. Each manually entered `+1` is one complete Namakam plus Chamakam recitation. Setup defaults to one complete recitation; the mala option and `+108` shortcut are disabled/omitted for this entry, and the progress line uses complete recitations. Short-mantra practice keeps its existing behaviour.

Saved practice uses a stable Sanskrit title in `mantra` and `rudram-complete` in `mantraId`, referencing the bundled complete library text. It does not truncate the Vedic text to the existing 1,000-character custom-mantra limit or duplicate 11,648 characters into every record. This keeps backups within existing limits and makes certificates identify the complete text by title. The title is read-only when this complete reading is selected. No schema migration or existing-record rewrite occurs.

## Verification

Model checks cover chapter order, all 47 citation units, first/last text anchors, the two split-word joins, script conversion and a full-recitation count/certificate/backup round trip. Browser coverage exercises all 22 chapter passages, boundary navigation, three languages/scripts, mobile themes, unchanged counts while reading, in-practice chapter selection, reload and completion certificate. Final run results are recorded in the functionality ledger.

## Content inventory

The source-reviewed Sanskrit resides in `apps/japseva/frontend/rudram-text.mjs`; original summary metadata is in `rudram-full.mjs`. Rendering belongs to `chapter-reader.mjs` and reuses existing platform CSS tokens. All three assets are explicitly allowlisted. Runtime fetches of external sacred-text websites are not needed for the reader.
