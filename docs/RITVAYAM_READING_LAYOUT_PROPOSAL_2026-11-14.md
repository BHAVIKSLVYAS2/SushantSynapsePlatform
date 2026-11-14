# Kundali: make reading easier

Proposal only, 14 November 2026. The user asked for further thought and review,
not another immediate Kundali implementation. No Kundali runtime changes belong
to this increment. The JapSeva icon change is independent.

Layout sketch: [primary chart with an adjacent graha table](design/ritvayam-reading-proposal.svg).
The sketch uses a synthetic illustrative chart and is not a deployed interface.

## What remains difficult

The released workspace fixes fragmentation, missing graha labels and language
resets. It still gives two large charts equal emphasis and places the detailed
table below them. A reader can see more, but must still move attention and
remember information while looking elsewhere. More visible content is not the
same as less reading effort. Large diagrams, repeated headings and control rows
also consume the first mobile screen.

The earlier recommendation to show D1 and D9 equally should be refined. Start
with a clear primary reading surface. Enable comparison deliberately instead
of making every visit a comparison exercise. This is a design hypothesis to
validate, not a universal claim about jyotish practice.

## Organise around four reading actions

1. **Locate:** see the chart pattern and Lagna immediately.
2. **Inspect:** select a graha and read its exact sign, degree, house,
   nakshatra and pada without losing the chart.
3. **Compare:** trace that same graha in D9 or another supported varga.
4. **Time:** inspect the current Dasha or another period while retaining the
   selected graha and chart context.

The same data should retain the same name, units and spatial position throughout
these actions. Do not make a reader reconstruct a connection between panels.

## Desktop direction

One compact birth-context line and one tool row. The main body has a large
primary chart on the left and a compact Graha Spashta table on the right. The
table combines sign and degree into one readable column, with house and
nakshatra/pada nearby. The right panel can scroll independently on short screens
while retaining its headings; keyboard focus must remain visible.

Selecting a graha from either surface selects the same graha in the other.
Use a consistent outline/selected state plus text, not colour alone. A small
selection strip states the connected facts: D1 placement, D9 placement and star
details. Avoid expanding a large empty-house card by default. Selecting an empty
house should deliberately switch to house context; it should not imply that a
graha was selected.

`Compare D9` opens a readable comparison arrangement while retaining the table
and selection. Do not squeeze two diagrams and a seven-column table into a
narrow three-column screen. At widths that cannot support readable comparison,
use a comparison drawer or switch the primary diagram with an explicit D1/D9
label. Preserve the chart's footprint and scroll position on return.

A short Dasha strip remains close to the working area. Detailed period rows
open when requested, with the chart context retained. Life-area prose, model
notes, configuration and report export are secondary destinations.

## Mobile direction

Prioritise the chart's first useful view: short birth context, D1/D9 selector,
one style control and the chart. Combine or move repeated toolbars. The other
Ritvayam tools should remain discoverable without occupying a second full
navigation row during chart reading.

Use three working destinations: Chart, Grahas, Dasha. Preserve the selected
graha when moving between them. Tapping a graha can open a short detail sheet
with D1/D9 placements and a clear close action; returning must reveal the same
chart, position and selection. Keep the existing expanded-chart option. Do not
shrink two full diagrams side by side on a phone.

## Readability rules

- One primary focal point, predictable placement, restrained borders and
  whitespace between related groups. Do not add another decorative card layer.
- Sign numbers and Lagna marking must be unambiguous in each chart style.
  Use consistent native graha abbreviations and full names in accessible detail.
- All occupants remain visible. Crowded houses need adaptive placement or an
  expanded view; smaller and smaller text is not an acceptable fix.
- Main tables use one degree convention, explicit D1/D9 labels and aligned
  numeric text. Exact source precision remains inspectable.
- Selected graha, selected house, active chart and active Dasha are distinct
  states. A language or theme change must preserve them.
- Keep unavailable results labelled. Never substitute a different chart or
  infer motion, dignity or new strength results to fill space.
- UI colours indicate interaction state, not an unsupported good/bad judgement.

## What the next prototype should prove

Compare the current layout and a non-production prototype with a few readers,
including a practising jyotish. Ask them to locate Lagna, read one graha's exact
position, compare it in D9, inspect a period and return to the same graha.
Observe time, wrong selections, scroll distance and whether they lose context.
Also inspect a crowded chart and unknown-time input on a small phone.

The implementation decision should follow those results. No new calculation
features are needed to test this reading layout. This proposal is based on the
current interface and first-principles reading tasks; no competing app layout
is being used as a template.
