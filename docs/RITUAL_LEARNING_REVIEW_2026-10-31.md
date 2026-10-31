# Ritual Assist learning sections — source review, 31 October 2026

User requested optional mantras and vidhi sections with authentic information,
and deployment without committing. This release includes the pending mobile
navigation work documented in `MOBILE_NAVIGATION_REVIEW_2026-10-31.md`.

## Editorial scope

Three simple household sequences cover daily devotion, Ganesh and Lakshmi worship
using an existing image. They are explicitly simplified learning sequences, not
new-image installation, prana-pratishtha or a complete festival manual. The formal
procedures in the linked Drik Panchang sources include additional rites which
must not be silently represented as included in the simplified version.

Satyanarayan, house-entry, naming, wedding and havan entries explain their scope
and expose the existing, ceremony-specific preparation outline. They do not invent
a universal samskara script, fire ritual, vow, ahuti count or full katha. The seven
mourning/remembrance guides offer optional Gita/peace readings; these are not
labelled as prescribed funeral, immersion, tarpan or shraddha mantras.

The eight included texts are traditional/public-domain Sanskrit. English/Hindi
meanings and learning notes are original editorial explanations. Published modern
translations, purports and whole ritual manuals are not copied. IAST is a reading
aid, with vowel-length guidance, not synthesized audio or a certification of
recitation. No unsupported repetition counts, guaranteed results or promises of
wealth, healing or spiritual outcomes are introduced.

## Checked sources

| Text or subject | Source and exact location | Treatment |
| --- | --- | --- |
| Ganapati salutation | [Ganapati Sankshipta Puja](https://www.drikpanchang.com/puja-vidhi/lord-ganesha/ganesha-puja-vidhi.html), Dashopachara-Pujanam | Short salutation excerpt `ॐ गणपतये नमः`; not a claim to reproduce a full initiation or installation mantra. |
| Ganapati flower offering | Same source, Dashopachara-Pujanam, Pushpa line | Sanskrit formula checked; original short meaning and IAST supplied. |
| Ganapati conclusion | Same source, Prarthana | `अनेन पूजनेन श्रीगणपतिः प्रीयताम्` checked against the displayed Sanskrit. |
| Lakshmi welcome | [Lakshmi Puja Vidhi](https://www.drikpanchang.com/festivals/lakshmipuja/info/lakshmi-puja-vidhi.html?lang=en), Swagatam | Short welcome only. |
| Lakshmi flower offering | Same source, Pushpa-Samarpanam, short offering line | `श्रीलक्ष्मी-देव्यै नमः पुष्पं समर्पयामि` checked; longer accompanying verses are not reproduced. |
| Peace refrain | [Chinmaya Mission Calgary, Opening Prayers PDF](https://chinmayacalgary.org/Resources/PDF/OpeningPrayersD.pdf), p. 1, ending of opening invocations | `ॐ शान्तिः शान्तिः शान्तिः` labelled as a refrain/excerpt, not the full invocation. |
| Gita 9.26 | [BBT VedaBase, Bhagavad Gita 9.26](https://vedabase.io/en/library/bg/9/26/) | Classical verse checked; editorial explanation distinguishes devotional reflection from a substitute for Satyanarayan Katha. |
| Gita 2.20 | [BBT VedaBase, Bhagavad Gita 2.20](https://vedabase.io/en/library/bg/2/20/) | Classical verse checked; split-word line wrapping normalized without changing the words. Optional reflection, without dismissing grief. |
| Household puja | [Smithsonian, Worship in Homes](https://archive.asia.si.edu/pujaonline/puja/homes.html) | Supports the distinction between household devotion, family-selected images and offerings. Our sequence is an editorial simplification, not a universal injunction. |

The existing guide references remain separately visible below the checklist,
including their regional and temple-specific scope. Material lists alone are not
presented as evidence for a full liturgical sequence. Some source terminology and
traditions differ; we preserve explicit scope rather than claiming universal
agreement. These are source-checked editorial notes; no priest or Sanskrit-scholar
certification is claimed.

## Implementation and verification

App-owned files: `learning-content.mjs` (static sourced data), `learning-view.mjs`
(safe DOM rendering and UTF-8 downloads), `learning.mjs` (small lazy controller).
The collection and renderer load only when the optional learning disclosure opens.
The source registry explicitly allowlists all three files. No external content,
audio, tracking or business API is fetched to read the learning material.

Vidhi, Mantras and Sources use accessible tabs and real `learn=` URLs, with direct
refresh and browser Back/Forward restoration. Closing a direct-entry learning
section returns to its guide locally. Sanskrit/IAST remain untranslated; meanings
and controls follow the existing English/Hindi guide language. The checklist and
learning notes have separate exports so a materials printout stays compact.

Tests cover all fifteen guide mappings, source links, Sanskrit offering formulas,
Hindi completeness, exports, lazy loading, keyboard tabs, nested history, refresh,
language switching, and narrow/light/dark layouts. Final source/export checks:
**8/8 passed**, `.publish/ritual-learning-unit-final.log`. The isolated final Chrome
run passed **5/5**: all three complete Chambers workflows, the new learning journey,
and a nineteen-route platform frame/switching sweep (four widths, both themes).
Evidence: `.publish/ritual-learning-verified-browser.log` and its dedicated artifact
directory. Earlier concurrent browser runs collided on default trace output;
the final run used a separate output directory and completed cleanly.

The small disclosure controller is 2,258 unminified bytes; the 23,484-byte content
collection and 6,893-byte renderer load only when opened. These are source sizes,
not claims about compressed production transfer or measured Core Web Vitals.
Existing private records, organisation licences and calendar/planetary
calculations are unchanged. Physical Android/iOS recitation typography and keyboard
behavior remain device verification; no native APK update is part of this release.

## Deployment and live verification

Deployed, without committing, as production Worker
`a0fc697f-f684-4d95-9eca-f748fb4e3aab` using
`infrastructure/cloudflare/wrangler.free.production.jsonc --keep-vars`.
The exact production-config dry run passed; 1,195 public frontend assets were
exported. Existing organisation/D1/rate-limit bindings were retained. Git HEAD
remains `ec6f37a`. No migration, account/licence change or business-data write.

Live Chrome verifies Ganapati and Lakshmi Sanskrit formulas, direct learning-tab
refresh, Hindi meanings, UTF-8 download, nested guide/learning/checklist Back and
Forward, game board retention and app-switcher history. Nine live routes passed
54 width/theme combinations. Short-dialog geometry, `/healthz` 200 and unscoped
`/api/records` 409 passed. No page errors or business writes; the visitor counter
was stubbed in the verification browser to avoid metric writes. The live mobile
Sanskrit/Hindi screenshot was visually reviewed.

Evidence: `.publish/ritual-learning-mobile-{dryrun,deploy,live}.log`,
`.publish/mobile-ux-live-verification.json`,
`.publish/mobile-ux-live-ritual-dark.png`, and
`.publish/ritual-learning-live-hi.txt`. Verification script:
`.publish/verify-mobile-ux.cjs` (blocks production business writes).
