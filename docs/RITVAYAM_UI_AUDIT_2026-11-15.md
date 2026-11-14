# Ritvayam and home layout review — 15 November 2026

Scope: Kundali entry, saved details, all ten Kundali destinations, Daily Rashifal,
Graha Sthiti by Date, Kundali Milan and the platform home. Review uses the
UI/UX skill's mobile layout, touch target, clear navigation and disclosure guidance.
The changes retain existing theme tokens and calculation/access boundaries.

## Findings and fixes, in order

| Finding | Change |
| --- | --- |
| Four narrow tool links inherit nowrap and run into each other on phones. | Two columns with wrapping labels and 44px minimum targets; current-page indication retained. About remains a labelled information disclosure. |
| Menu names disagree with old headings, including Astro Time Machine. | Entry headings use the shared menu copy; secondary Kundali headings match their destinations. |
| Date-based graha instructions occupy most of the phone screen. | Expandable instructions, shorter task description, compact disclosure spacing; methods/limits retained. |
| Edit, Save and Download hide inside collapsed birth details. | Actions appear alongside the birth summary, with save/error status visible. |
| Saved Kundalis repeat large cards and a separate quick-access row. | One semantic list, latest entries first, name opens/recalculates; Edit/Delete expand in each row. Date/time and place wrap naturally. |
| Long saved-history explanation repeats ahead of the records. | About saved details disclosure; search appears for six or more entries. No stored inputs or IDs change. |
| Home repeats catalogue apps in Pinned and Recent. | Remove the device shortcut block and recent-app tracking. Existing shortcut preferences are preserved. Catalogue search, categories, Comfort/Compact and account favourites remain independent. |

## Verification and limits

Before/after CLI screenshots cover the four Ritvayam pages and home at
320/390/1280px in English, Hindi and Gujarati. Home is also reviewed in light and
dark mode after its beta notice is acknowledged. The secondary-section review
checks all ten destinations in three languages and both themes, heading/menu
agreement, saved-input preservation, chart selection and landscape/larger text.

Existing saved-record browser checks cover save/reopen/update/delete, storage
failure and approximate/unknown input restoration. Practitioner checks cover
D1/D9 diagrams/table switching, menu dismissal, Dasha and downloads. The home
regression covers absence of repeated shortcuts, retained preferences and filters.
Exact completed test counts and release status are recorded in the functionality
ledger. This is a focused UI review, not a claim of a formal accessibility audit.

No database/schema, astronomical calculations, report content, authentication,
licensing or production records are changed. Local browser examples are synthetic;
Node tests use isolated temporary SQLite directories.
