# Appreciation Certificate Generator

Certificate Type includes a Fun & personal awards group: Best Friend, Best Wife, Best Husband, Best Partner, Best Mom, Best Dad, Best Sibling, Office MVP, Chai Champion and Legendary Latecomer. These provide humorous suggested titles, descriptions and messages. Enter a recipient and leave the description blank to use the suggestion, or personalize the wording. Custom text is preserved when switching types. All seven designs and PDF/PNG/print use the same award wording.

Open `/certificates` after starting or restarting the platform with `npm.cmd start`. No login is needed. Enter recipient, contribution and date, choose a template, generate, then download PDF/PNG or print. Optional fields and images expand inline. Edits update the preview and require Generate again before downloading.

All certificate content remains in tab memory; refreshing clears it. Images are decoded and resized locally. No certificate data enters SQLite or any API. Only shared theme preference persists. The generated reference is an identifier, not proof of authenticity.

- `frontend/renderer.js`: A4 geometry, seven distinct templates and text fitting.
- `frontend/export.js`: local single-page raster PDF and download lifecycle.
- `frontend/app.js`: transient form state, image validation, theme and actions.
- `tests/browser.spec.js`: isolated Chrome workflows, output dimensions, privacy, responsive print and multilingual bounds.

Run `npm.cmd run test:e2e -- apps/certificates/tests`. PDF/print use 3508 × 2480 pixels, approximately 300 DPI; PDF text is not selectable. Lossless PNG defaults to Ultra (7016 × 4961 pixels, 600 DPI); Standard (3508 × 2480 pixels, 300 DPI) uses less memory and produces smaller files. PNG embeds the selected print density. Artwork and text render directly at export resolution. Uploaded images retain their own source-resolution limits, and saved organisation logos are compact browser copies; upload a clear original for best results. Browser/system fonts support local scripts without remote font requests. Select A4 landscape and disable browser headers/footers if your print dialog overrides the page styling.

The formal list has seven distinct purposes. Social Service is covered by Community Service, sponsorship by Donation Appreciation, and Outstanding Contribution/Custom by editable General Appreciation. All types still support custom wording. The design picker keeps Classic, Minimal, Community and Aurora, and adds Confetti (party crown), Sweetheart (hearts) and Comic (bold banner). Similar Modern, Elegant and Corporate designs are removed from the picker. Fun awards suggest a matching design until you manually select one; your manual choice survives type changes. Playful designs have fixed artwork palettes, so the accent control is hidden for them.

Donation Appreciation has a donor-focused layout and an optional, dedicated INR amount panel. Words are calculated automatically using lakh/crore and exact paise; blank omits the panel. Switching to any other certificate type clears and disables the amount and its words, so they do not carry into other awards. The text below the preview does not repeat the amount; the canvas accessible description retains it for screen readers. Accepted range: INR 0.01 to 99,99,99,999.99, with up to two decimal places.
