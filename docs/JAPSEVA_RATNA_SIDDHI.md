# Ratna Siddhi implementation and research review

23 November 2026, deployed to the existing production Worker with --keep-vars.

## Audit

The existing Mantra Library entry `puja-ratna-abhimantran` had five shared
chapters and nine alternative mantras in one japa passage. It had no individual
gemstone selection, specific wearing/care comparison or in-guide counter.
Its cautions were honest; it did not claim a complete traditional paddhati.
The library has 110 stable entries. Practice records reference stable IDs and
short titles. No gemstone prescription or gemstone-muhurta contract exists in
this reader. The separate shared Vedic/Panchang engine cannot itself establish
ritual eligibility, so the guide does not manufacture auspicious dates from it.

## Implementation

`ratna-content.mjs` owns nine structured gemstone profiles, reused mantra IDs,
five connected household steps, source metadata and claim-level verification.
`ratna-reader.mjs` owns overview selection, collapsible preparation/introduction,
inline mantras/IAST/pronunciation/meaning, a personal sankalpa form, optional
counter, wearing guidance and references. It composes the existing book reader
interface, previous/next controls and script selection. English and Hindi guides
are available; Gujarati explicitly identifies the Hindi fallback. Personal
sankalpa fields stay in memory. Only selected gem, position and per-gem counters
use the existing local reading-preference store; they never write practice totals.
The legacy chapters remain as compatibility content, preserving exact Sanskrit
meaning mappings, canonical adapters and older source checks. The active Ratna
reader displays one selected graha rather than the legacy nine-mantra passage.

The entry, practice target (one session), certificate logic, other 109 entries,
audio and database schemas are retained. New browser modules are explicitly
allowlisted in `server/static-assets.js`. Layout reuses app CSS/theme tokens.

## Content matrix

All associations, colour offerings, weekdays, metals and fingers are labelled
customary with source review pending. They are not universal scriptural rules.
All five-step sequences are editorial devotional adaptations.

| Gem | Individual content and corrected practice | Care evidence |
| --- | --- | --- |
| Ruby | Responsible Surya devotion; separate arghya; avoid direct Sun viewing; gold/ring-finger custom | GIA ruby: filled material needs gentler care |
| Pearl | Gentle Chandra remembrance; separate milk offering; string and necklace guidance | GIA pearl: organic softness, chemicals and string care |
| Coral | Responsible courage; pigment offered separately; copper irritation and provenance | GIA general organic/treated jewellery guidance |
| Emerald | Thoughtful speech; leaf juice kept separate; protected setting considered | GIA emerald: fractures/fillers and cleaning limits |
| Yellow sapphire | Teacher gratitude; turmeric separate; no marriage/wealth promise | GIA sapphire, applied to yellow corundum |
| Diamond | Considerate relationships; secure tray; alloy variation | GIA diamond: chipping and treated material |
| Blue sapphire | Patient Shani devotion; separate oil lamp; no fear-based trial or omen test | GIA sapphire, applied to blue corundum |
| Hessonite | Rahu as lunar node; no automatic eclipse/Rahu-kala muhurta | GIA garnet, applied to grossular variety |
| Cat's eye | Ketu/detachment; distinguish chatoyancy from mineral identity; no scratch/heat test | GIA general treatment disclosure; specific chrysoberyl care review pending |

## Source checks and limits

Research used publicly accessible sources on 23 November 2026:

- [GIA care guidance](https://www.gia.edu/articles/gia-news-research-tips-caring-jewelry),
  with individual ruby, pearl, emerald, sapphire, diamond and garnet pages linked
  in app-owned metadata. This establishes physical-care scope only.
- [SriMatham Navagraha Shanti](https://www.srimatham.com/pujas--yajnas.html),
  section 7, describes puja and homa alternatives. It does not establish
  gemstone-specific consecration steps, extended totals or homa ratios.
- Existing library name invocations retain their
  [Namavali Sangraha reference](https://www.australiancouncilofhinduclergy.com/uploads/5/5/4/9/5549439/asthottara_sangraha.pdf).
  These were reused verbatim, not newly certified as a gemstone paddhati.
- Bṛhat Saṃhitā, Iyer translation: gem examination chapter 80, ruby chapter 82
  and emerald chapter 83 were inspected via Wisdom Library. These address
  gem qualities/valuation; they do not authenticate this ritual sequence.
  Numbering varies by edition. Historical benefit claims are not adopted as
  scientific effects. The historical source is retained in research metadata,
  rather than offered as authority for the household steps.

No invented Sanskrit sankalpa, deity-idol prana-pratishtha, bijas, graha Gayatris,
Vedic verses, exact nakshatra rules, extended japa totals or homa ratios are
added. The sankalpa form produces explicitly editorial vernacular prose and
allows unknown gotra to be omitted. 108 is an optional private target only.

Genuine remaining research: a named, edition-specific Ratna paddhati; independent
Sanskrit/ritual review; sourced graha-gem/weekday/metal/finger variants; verified
nakshatra restrictions and regional exceptions; authenticated extended mantras
and counts; a complete Gujarati guide. Brihat Parashara Hora Shastra and
Ratnapariksha literature have not been verified for these procedures. This
implementation does not meet the requested fully authenticated nine-paddhati
content acceptance; it implements the supported experience and exposes the gaps.

## Verification

Eighteen Node checks pass across `japseva-ratna`, `japseva`, `japseva-connected`,
`japseva-chapter-meanings` and `japseva-study-passage`. The Ratna Chrome workflow
passes all nine profiles, connected Learn meanings, personal sankalpa fields,
five-step navigation, counters and reload resume, eight width/theme cases and
Hindi/Gujarati fallback with no page errors. The mobile screenshot was visually
inspected. Existing no-login backup/PDF/certificate and complete Rudram Chrome
workflows pass. The Navagraha browser workflow also passes after its expectations
were updated to match
the already-released inline reading aids and hidden Learn script picker.
Frontend build passes with 765 public assets, including both new modules;
`git diff --check` passes. These are focused checks, not the full platform suite.
Tests use an isolated temporary DATA_DIR and browser profile. No production
business writes. Live Chrome verification passes 26 checks: four exact asset
matches, home/health/protected API boundary, all nine guides, counters/resume,
eight width/theme cases and Hindi/Gujarati fallback without page errors. Mobile
screenshot inspected. Initial Worker: 137cf940-57c6-444e-8f11-1575b7c84a27.
Organisation/auth/D1 and disabled Nishi settings preserved; no migrations.
Evidence: `.publish/ratna-live-verification.json` and `ratna-live-check.cjs`.
The documentation follow-up identifier is in `.publish/ratna-documentation-deploy.log`.
