# Appreciation Certificate Generator

Open `/certificates` after starting or restarting the platform with `npm.cmd start`. No login is needed. Enter recipient, contribution and date, choose a template, generate, then download PDF/PNG or print. Optional fields and images expand inline. Edits update the preview and require Generate again before downloading.

All certificate content remains in tab memory; refreshing clears it. Images are decoded and resized locally. No certificate data enters SQLite or any API. Only shared theme preference persists. The generated reference is an identifier, not proof of authenticity.

- `frontend/renderer.js`: A4 geometry, six templates and text fitting.
- `frontend/export.js`: local single-page raster PDF and download lifecycle.
- `frontend/app.js`: transient form state, image validation, theme and actions.
- `tests/browser.spec.js`: isolated Chrome workflows, output dimensions, privacy, responsive print and multilingual bounds.

Run `npm.cmd run test:e2e -- apps/certificates/tests`. Exports use 3508 × 2480 pixels, approximately 300 dpi; PDF text is not selectable. Browser/system fonts support local scripts without remote font requests. Physical print quality also depends on uploaded image resolution and printer settings. Select A4 landscape and disable browser headers/footers if your print dialog overrides the page styling.

Donation Appreciation includes an optional INR amount. Words are calculated automatically using lakh/crore and exact paise; blank omits both lines. Other certificate types hide the amount. Accepted range: INR 0.01 to 99,99,99,999.99, with up to two decimal places.
