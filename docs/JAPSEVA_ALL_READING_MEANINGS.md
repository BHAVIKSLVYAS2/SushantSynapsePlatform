# JapSeva: simple Hindi meanings throughout the library

Implemented 2026-11-23 after the user requested the same Sanskrit → meaning flow
for every reading, including the seven long collections.

## Actual coverage

All 110 existing entries use the simple reader. The 103 short entries keep their
existing meanings; the four-verse Gita/Bhagavata groups and two-verse Namakam
selection interleave their individual existing/new concise meanings. The seven
long collections contain 128 sections: 126 contain Sanskrit and two Ratna steps
are instructions without Sanskrit. Every non-empty section now has a complete
source-bound Hindi mapping. Shared texts are stored once: 66 unique sources,
1,188 source passages, rendered 1,605 times across the seven collections.

The units are not asserted to be 1,188 independently verified metrical shlokas.
Numbered verses, prose mantras, paired Namakam salutations, offering formulae,
prefaces and colophons have different boundaries. Chamakam's continuous request
lists remain complete prose prayer units with corresponding Hindi meanings.
Coverage means the text already supplied by this library, not certification that
the inherited edition is complete or textually correct.

## Content and layout

`chapter-meanings-hi.json` contains exact source text, contiguous start/end spans,
concise original Hindi meanings and explicit AI-assisted editorial status. The
runtime rejects changed sources, gaps, overlap, invalid offsets or empty meanings.
It does not attach a chapter summary to each verse. All Sanskrit remains exactly
preserved in the records; display alone removes inherited `thumb|` image captions
and an underscore divider. Outer whitespace and blank lines are reduced inside
display passages. Repeated Sanskrit verses in the inherited source are preserved,
not silently replaced from a different edition (e.g. Saptashati 9.9/9.10).

Learn shows Sanskrit followed immediately by the Hindi meaning, then the next
passage. No line-number buttons, word-click requirements or repeated study
disclosures. Recite retains the original uninterrupted script text. Script choice,
chapter stepping, outer reading navigation, reduced motion, reader settings and
saved reading position stay in the existing book. The original chapter summaries
and all English/Gujarati content remain in the data. New long-reading interleaved
meanings are Hindi, including when the surrounding interface is English/Gujarati;
they are not presented as new English/Gujarati translations.

## Editorial status

These are newly authored AI-assisted simple interpretive meanings, not copied
Gita Press text and not a certified literal, grammatical or traditional commentary.
Independent Sanskrit/Hindi review remains required, particularly rare Vedic
epithets, ritual terminology, inherited transcription defects and source divisions.
Review status is in the existing closed reading-context help, away from the main
reading flow. Traditional health, lifespan, wealth and supernatural fruit claims
are described as assertions/prayers within the text, not verified app predictions
or treatment promises. Narrative depictions of self-injury are not ritual advice.
No new ritual requirements, audio, timestamps, provider calls or paid services.

## Verification

Fifteen focused Node tests pass: all section coverage, exact reconstruction,
revision/gap/overlap/missing-meaning rejection, display-only markup cleanup,
canonical Unicode/audio preservation, complete existing collection sequences,
compact practice records, backups, dates and corrections. Existing content audit
against `3ffb75f` reports 110 entries, 231 units, 4,065 structural lines, zero
errors/warnings and baseline text preservation.

Chrome checks every entry and all 128 sections, comparing each displayed Hindi
meaning with its mapped source, no study controls, Recite/Learn and no horizontal
overflow. Additional mobile/theme/script/audio checks and release results are
recorded in the functionality ledger. These checks establish software coverage,
not expert acceptance of every interpretation.

Repeat coverage audit: `node tools/audit-japseva-chapter-meanings.mjs`. It emits
per-book counts, missing mappings and SHA-256 digests of each source/meaning set.
App code stays under `apps/japseva`; no database, account, practice schema or
organisation boundary changes.
