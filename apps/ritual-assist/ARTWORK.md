# Ritual Assist landing artwork

Generated with the built-in imagegen tool on 22 October 2026, using the supplied
landing-page reference for visual direction. The images are decorative; titles,
counts, dates, controls and accessible labels remain real HTML. No external image
service is called by the app. The originals remain in Codex generated-image storage;
the project copies use WebP encoding with alpha preserved (existing Sharp tool,
quality 88). No new runtime dependency was added.

- `frontend/calendar-hero.webp` — calendar, diya and leaves, 184,184 bytes.
- `frontend/guide-icons.webp` — 4 × 4 illustration atlas, 461,960 bytes.
- `frontend/landing.mjs` maps existing guide IDs to atlas cells. Guide names and
  counts still come from the existing guide data. The calendar hero links directly
  to the independent calendar route.

Final hero prompt:

> Use case: stylized-concept. Asset type: transparent website hero illustration for an Indian Hindu ritual calendar. Create a premium polished 3D still-life: an ivory desk flip calendar with thick rounded pages, warm gold top edge and three metallic gold binder rings, a small raised sacred Om symbol centered above a simple grid of square date cells with one warm orange highlighted date. A small brass diya with a single luminous flame sits in the lower right foreground, a few tasteful dark green leaves behind the calendar and near its base. Three-quarter perspective, calendar faces slightly toward left. Soft warm studio lighting, detailed ceramic-like ivory and brushed brass textures, subtle realistic contact shadows. Composition centered, tightly framed complete objects, square canvas, ample 5% transparent padding. No UI, no text apart from the Om, no numerals, no frame, no background, no watermark. Intended as the large illustration on the right of a navy landing-page hero. Save the generated image locally for use in the project.

Final atlas prompt:

> Use case: stylized-concept. Asset type: one transparent 4 by 4 UI illustration sprite atlas, square canvas, exactly sixteen equally sized cells. Each isolated icon is centered strictly in its cell, occupies 65% of cell, with generous transparent padding and no overlap. Polished premium 3D miniature objects, warm gold and ivory with restrained green and orange, detailed soft surfaces, subtle contact shadow, consistent three-quarter front view. No grid lines, no tiles, no backgrounds, no letters, no numerals, no captions. Exact row-major subjects: Row 1: brass diya with flame; friendly seated golden Ganesh statuette; pink lotus blossom; golden kalash pot topped with coconut and green leaves. Row 2: small elegant temple/home doorway; smiling baby face; gold wedding mandap pavilion; small contained havan fire in copper square bowl. Row 3: paired green leaves; respectful white flower; brass urn; single crescent moon. Row 4: small brass offering plate with rice; small bowl of fruit; folded cream ceremonial cloth; two joined hands in namaste. This entire image is a production sprite atlas for a Hindu preparation guide website. Keep all sixteen icons separate, equal scale, fully within their 4x4 cell boundaries and crisply recognizable at small sizes. Genuine transparent background.
