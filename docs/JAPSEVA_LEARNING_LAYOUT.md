# Mantra Library learning layout — 2026-11-23

The existing library reader owns this change; there is no separate learning page.
Learn presents each passage in this order:

1. The source text in Devanagari, with the largest type and reader-controlled spacing.
2. Roman and Gujarati script aids, visible together with small, localized labels.
3. Its meaning, with the actual language stated when it differs from the interface.

Recite retains its script picker. Learn hides that picker because its original text
stays in Devanagari and both alternative scripts already appear below it. Existing
reading settings, chapter/reading navigation, place saving, practice actions and
licensed audio remain in the existing flow. No extra disclosure opens the aids.

One shared passage component generates aids from the exact displayed source span,
so short prayers and long chapters receive the same coverage. It does not infer
phonetic syllables, word boundaries, sandhi separation, Vedic accents or recordings.
These are script aids, not expert-certified pronunciation. Existing source strings,
practice counts and records are unchanged. Imported image captions remain excluded
from display through the existing cleanup function.

Coverage: 110 entries, 128 sections (126 Sanskrit-bearing and two instruction-only),
1,715 displayed learning passages including reused passages. Eight missing Gujarati
verse meanings in the four-verse Gita and Bhagavata entries now have original,
locator-aligned editorial text. Long-book complete passage meanings remain Hindi;
English/Gujarati interfaces label them as Hindi rather than inventing translations.
Independent Sanskrit/translation and pronunciation review remains pending.

Comparison consulted: [Quran.com reading/study update](https://quran.com/sw/product-updates/interact-with-words-in-arabic-reading-mode)
places optional word translation/transliteration close to the source and distinguishes
reading from study. Our adaptation keeps assistance immediately under each passage
in Learn; it does not add unverified word-level content or another settings layer.
UI/UX Pro Max readability guidance informed type hierarchy and contrast; Devanagari
keeps the existing minimum 1.9 line height rather than generic Latin body spacing.

Verification: `tests/japseva-study-passage.test.js` audits every passage in all three
interface languages, script coverage, conjuncts/vowels and unchanged source records.
Existing chapter mappings, canonical bindings, practice/backup and audio model tests
also pass (17 targeted tests). Browser evidence: `.publish/mantra-study-review.cjs`.
