# Export design review — 6 November 2026

Scope: Ritual Assist PDF/print layouts and Moment Studio certificate/greeting
artwork. These changes remain local with the pending workspace improvements;
no combined commit or deployment has been made.

## Findings and implemented changes

- Ritual print rules mixed theme and print colours. A dedicated print palette
  now supplies white paper, dark body text and deep green rules independently of
  Light/Dark/Gold. Printed dates have stronger weight and colour than explanations.
- Checklist PDF now uses a title rule, clearer table headings, subtle alternate
  rows, repeating table headers and readable cell spacing. Existing full checklist
  data and brand credit remain. The screen preview retains its normal dialog.
- Shraddh print output now carries death date, IST time and selected city even
  though the editable input form is excluded. Entry pagination avoids splitting
  individual observances; calculation timings open for complete-calendar print.
  Screen-only period help, action cards and badges are excluded from the PDF.
- Greeting designs previously used the same centred serif treatment regardless
  of design. Bold now has left-aligned sans-serif text and a matching accent bar;
  Confetti has sans-serif typography. Bloom and Bold lose the universal outer
  frame; Quiet and Elegant retain their appropriate restrained borders.
- Jubilee and Fun Card certificates lose competing vertical stripes and stock
  trophy decoration, using a simple geometric accent. Recipient, issuer,
  signatures, donation information, brand credit and disclaimer remain.

## Visual direction

Use three clear export families: formal certificates with disciplined typography;
warm celebrations with a single focal decoration; and restrained remembrance
documents with generous legibility. Keep body text dark, reserve accent colour
for headings/rules, and give names/dates more prominence than ornamental details.
Dark Nocturne is intentionally a dark artwork; its exported PDF should preserve
that selected design. Ritual planning documents use the white print palette.

## Review evidence and limits

Used isolated local SQLite data and local Chrome, generated representative
English PDFs and contact sheets, and visually inspected print-mode screenshots
and before/after template sheets. A Gold-theme sample rendered white print paper
with dark text. This is a targeted design review, not the postponed regression
suite. Long multilingual inputs, every palette, every template/content combination,
multi-page printer output and physical printer colour reproduction remain for
the combined release checks. Moment certificate PDFs remain high-resolution
raster artwork, not selectable vector text.

Local review artifacts (ignored, not committed):

- `output/playwright/templates-before.png`
- `output/playwright/templates-refreshed.png`
- `output/playwright/checklist-refreshed.pdf`
- `output/playwright/shraddh-refreshed.pdf`
- `output/playwright/checklist-print-refreshed.png`
- `output/playwright/shraddh-print-refreshed.png`
- `.publish/export-pdf-review.log`
