# Kundali chart additions — 15 November 2026

Exact-time boundary follow-up (15 November): the interactive explorer can show
recorded-instant D1/D9 previews when conservative boundary screening withholds a
strict result. These are visibly time-sensitive; strict report/export availability
is unchanged. No nominal preview is created for unknown/approximate time. The
results workspace has one chart selector and one section navigation bar.

Graha sign degrees (DMS) and Navamsha/D9 were already implemented. Added
Chandra Kundali, Parashari Hora/D2 and Shodashamsha/D16 to the birth workspace.
“Shodshi” is interpreted as D16; this does not implement all sixteen Shodashvarga.

The two direct D1/D9 buttons remain. A labelled chart selector also includes the
three new views, with unavailable calculations disabled. Diagram, table and
selected graha follow the selected chart. English, Hindi and Gujarati labels are
provided. Chandra uses Moon as the house reference, never as a physical ascendant.
All source degrees and nakshatra/pada remain D1 values; mapped divisional degrees
are not presented as physical longitudes. Existing reports remain D1/D9 reports;
the new chart previews are not silently added to saved exports.

## Method and scope

Source: P.V.R. Narasimha Rao, [Vedic Astrology: An Integrated Approach](https://www.vedicastrologer.org/articles/vedic_astro_textbook.pdf).

- Section 6.2.2, printed page 52: odd-sign first/second 15-degree halves use
  Sun/Moon Hora; even signs reverse these. This implementation uses the
  Parashari Leo/Cancer representation, not alternative cyclic Hora methods.
- Section 6.2.13, printed page 57: sixteen equal parts of 1°52′30″, counted from
  Aries/Leo/Sagittarius for movable/fixed/dual signs. Example 20 supplies the
  Gemini 11° → Taurus and Scorpio 19° → Gemini reference mappings.
- Section 7.3.2, printed page 70: Chandra Lagna counts houses from Moon. D1
  signs and physical sidereal longitudes are preserved.

D2/D16 use the same exact-minute admission and independent conservative
Lagna/planet cusp screens as the existing candidate D7/D10/D12 charts. A blocked
D16 does not block D2, D9 or Chandra. Unknown/approximate birth times remain
withheld. The new divisional algorithms retain the existing independent-review
pending status; no prediction or physical-error certification is claimed.

No persistence, database, organisation, authentication or astronomical profile
changes. Shared pure methods live in packages/vedic; app composition and UI
remain in apps/rashifal-kundli.

## Verification

`tests/vedic-extra-charts.test.js` checks published mappings, all D16 cusp
neighbours, Hora parity boundaries, Chandra invariants and independent birth
admission. The advanced Worker test includes D2/D16 mappings. Browser evidence
and release status are recorded in FUNCTIONALITY_LEDGER.md.
