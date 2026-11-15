# Unused JS/CSS cleanup — 16 November 2026

Audited tracked app/shared JS and CSS for identical content and references, and
rechecked candidates from the 9 November analysis against current producers.
Earlier retired Home/Studio/component candidates have already been removed;
the historical audit is not evidence that those rules still exist.

Removed obsolete JapSeva Library-only audio, audio badge/settings and reference
styles from `apps/japseva/frontend/style.css`. Current Library markup has no audio
player or reference block. Preserved pronunciation headings and all current
practice audio styling. Mixed selectors retain their active pronunciation branch.

Measured UTF-8 stylesheet size: 30,148 → 28,769 bytes (1,379 saved).
Lightning CSS minification: 29,044 → 27,693 bytes (1,351 saved).
This is a size reduction, not a measured runtime-speed improvement.

No entire JS file was proven safe to delete. The identical Kiraya Saathi and
RozHisab care-engine modules are intentional 129-byte Node compatibility exports
of the shared implementation. Keep them. Extensionless backend imports,
automatically discovered tests, SQL recovery tools, generated bundles and public
route aliases are not unused merely because their filenames lack literal callers.
The Cloudflare builder clears its output before export; Kundali generated chunks
are selected by their manifest. Neither warrants deleting source modules.

Verification uses existing JapSeva browser workflows with an isolated temporary
SQLite data directory, plus Lightning CSS parsing/minification and diff checks.
No production data, deployment, commit, schema or persistence change.
