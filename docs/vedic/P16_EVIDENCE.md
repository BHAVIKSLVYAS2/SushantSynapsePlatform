# P16 optional advanced calculations — internal candidate subset

Implemented 2026-10-24. Package/lock 0.16.0. This increment implements D7, D10,
D12, raw D1 Ashtakavarga and Uccha Bala. Full Shadbala, other vargas, reductions
and interpretive rankings are unavailable. Individual algorithm sign-off and
independent source/model acceptance remain open. No public release, production
route/card, storage, auth/schema or Ritual Assist change.

## Source and mathematical definitions

Primary source: [P.V.R. Narasimha Rao, Vedic Astrology: An Integrated Approach](https://vedicastrologer.org/articles/vedic_astro_textbook.pdf),
chapter 6 sections 6.2.7/6.2.10/6.2.12 and chapter 12 tables 19–25. The source is
the author's freely shared 2000 textbook with a 2010 update, not an open-source
software licence. Captured PDF SHA-256:
`1cafa828f34764ed5e85816882df2e8f0bc014c5c57ccdb27169416e117fd4db`.
The local PDF and rendered Chart 6 remain ignored research artifacts under
`.publish/`; they are not bundled, exported or committed as app assets.

`advanced-vargas.mjs` defines three separately identified candidate methods:

| Chart | Divisions per sign | Starting sign, counted inclusively |
| --- | --- | --- |
| D7 | 7 | Self for odd signs; seventh for even signs |
| D10 | 10 | Self for odd signs; ninth for even signs |
| D12 | 12 | Self for all signs |

Classification compares the normalized original longitude with canonical
`sign*30 + i*30/N` boundaries, start inclusive/end exclusive. No rounded degree
or epsilon shifts a classification. Output supplies original longitude, source
sign, division number, mapped sign and boundary distance; no fictional physical
longitude in a second sky. Divisional houses are counted from mapped Lagna.
D1/D9 astronomical/profile kernels are unchanged. The app-owned chart adapter
now accepts these three types and reuses existing North/South graphics, keyboard
house selection, full names and accessible numeric table.

`ashtakavarga.mjs` transcribes factual contribution bits from tables 19–25:
seven recipients, eight references in Sun/Moon/Mars/Mercury/Jupiter/Venus/Saturn/
Lagna order. Relative house 1 is the contributor's own sign. Positive contribution
is explicitly 1; source terminology differs between bindu and rekha. PAV bits
sum to BAV counts 0..8, then seven BAVs sum to SAV. Row totals are
48/49/39/54/56/52/39, overall 337. Nodes and a separate Lagna recipient row are
excluded. No Trikona/Ekadhipatya reduction, Sodhya Pinda, thresholds, predictions
or divisional-chart AV extension is claimed.

`strength.mjs` implements only Uccha Bala, using the shorter arc from deep
debilitation divided by three, 0..60 virupas (60 virupas = one rupa).
[Phaladeepika, G.S. Kapoor translation/commentary](https://www.panchanga.lv/wp-content/uploads/2020/06/Phaladipika_Shri-Mantreswara.pdf)
chapter 1 supplies the seven deep-exaltation points; chapter 4 opening commentary
supplies linear interpolation. These are source-defined traditional points, not
astronomical observations. Nodes are unsupported. Full six-fold Shadbala remains
typed unavailable: the complete Sthana, Dik, Kala, Cheshta, Naisargika and Drik
methods and credible validation set are not implemented/accepted. Uccha Bala is
never represented as the complete strength score, rank or prediction.

## Private birth composition

`birth-advanced.mjs` forces strict birth admission, rejects purpose overrides,
explicit invalid elevations, uncertain time and future exact-minute tails.
Each varga separately uses the P06 D1 screen plus its own division distances;
an unstable D7 does not discard supported D10/D12. Raw AV needs screened D1
signs/Lagna. Uccha Bala is continuous and retains nominal values with a range
derived from its 1/3-Lipschitz angular rule and proposed 121-arcsecond minute/model
guard. These ranges and screens are conditional candidates, not certified physical
error bounds. Approximate/unknown time does not fabricate any advanced chart.

The en/hi/gu panel requires explicit calculation. Edits, clear, parent reset and
navigation remove results and cancel pending tasks. Data stays in tab memory,
never storage, logs, URLs or network requests. Only existing theme preferences
persist. Source links use no-referrer. Shared theme tokens and focusable table
overflow support mobile layouts. Methods/source titles and diagnostics explicitly
retain English fallback pending language review. P10 export projection is
unchanged and print hides the supplemental advanced panel.

## Verification

- Six independently published worked mappings match exactly (examples 14/17/19).
- Chart 6 input signs were read from the source figure on printed page 107
  (zero-based PDF page 118), rather than fitting a computed chart. Sun/Mercury
  BAV and all twelve SAV values match the answers on printed page 163 (PDF 174):
  36 independent discrete values. This does not validate source birth ephemerides.
- All 348 divisional cells and adjacent representable values at every cusp pass
  half-open assignment checks. Twelve AV rotations preserve counts/totals;
  contribution reconstruction and all seven fixed row totals pass.
- Seven Uccha extrema/opposites/quadratures pass; complete Shadbala stays
  unavailable. Strict input/admission and independent withholding checks pass.
- Eight focused Node tests plus actual workerd test pass. Workerd compares 348
  divisional mappings, one complete raw AV case and seven strength values with
  exact equality. Final pure bundle: 7,225 bytes, excluding astronomy/place data.
- Full isolated repository regression passed 518/518, zero failures, 320.465s
  (.publish/vedic-p16-full-tests.log). All 25 Chrome checks passed
  (.publish/vedic-p16-browser.log), including two P16 scenarios for graphic/table
  parity, locales, mobile themes, per-division withholding, privacy and print.
  Gujarati mobile reviewed (.publish/vedic-p16-advanced-390-gu.png).
- Offline report --check, package/lock metadata and whitespace checks pass.
- Reproducible report includes source/model identities, hashes, fixtures and two
  synthetic birth cases. Generated results/property checks/runtime parity do not
  substitute for independent astronomical or traditional acceptance.

```powershell
node infrastructure/preview-vedic-birth.cjs # loopback port 4178
node --test tests/vedic-advanced.test.js tests/vedic-advanced-worker.test.js
node infrastructure/verify-vedic-advanced.cjs --check
npx.cmd playwright test apps/rashifal-kundli/tests --output=.publish/p16-browser-results
```

No application dependency was added. A temporary PDF inspection tool in ignored
`.publish` was used only to inspect the source figure locally, then removed along
with its downloaded wheel. It is not part of the app or its lockfile. The captured
source PDF and chart image remain ignored research evidence. Previous IAE/PAC,
positional, sunrise, editorial, rulebook and
physical-stability gates remain open. P16 is an optional candidate subset, not
completion of every advanced strength system. P17 sharing/regression/release
hardening may be taken next when requested; no deployment is implied.
