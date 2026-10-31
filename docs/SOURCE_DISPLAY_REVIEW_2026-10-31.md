# Public source display review

User requested a site-wide check for unnecessary third-party names, retaining
required attribution. This is a presentation change, not a new scripture review.

Reviewed app frontend sources, shared UI, public legal pages, and existing
third-party notices. Repeated optional publisher branding was concentrated in
Ritual Assist. Its guide, materials, donation and learning reference labels now
use document titles. Mantra cards show prayer types or Bhagavad Gita chapter and
verse, without repeated external links. Verified research URLs and source scope
remain available in optional source sections and exported notes. Traditional
offering formulas are not relabelled as Vedic verses or assigned invented
scripture citations. Internal research provenance remains intact.

Calendar reference labels and general legal/privacy/terms text no longer single
out an unrelated Panchang publisher. GeoNames credits, software copyright/licence
notices, news publisher identities and external-service names needed to explain
actual data use remain. No engine, calendar rule, business API or data changed.

Focused ritual text/export checks: 8/8 pass. Chrome learning verification passes,
including Sanskrit/IAST, absence of publisher branding on mantra cards, optional
source links, Hindi, downloads, Back/Forward and direct refresh. Deployment and
live verification status are recorded in the functionality ledger.

Production-config dry run and deployment passed with `--keep-vars`. Worker:
`1dc78702-5ae0-46be-84d4-ccdaf2c24f32`; HEAD remains `ec6f37a`, no commit.
Live Chrome confirms the citation cleanup, optional source links, updated public
legal/privacy/terms pages, Hindi text/download, nested history and 54 responsive
light/dark layouts. Health 200; unscoped records 409; no page errors or business
writes. Evidence: `.publish/source-cleanup-{dryrun,deploy,browser,live}.log` and
`.publish/source-cleanup-live-verification.json`.
