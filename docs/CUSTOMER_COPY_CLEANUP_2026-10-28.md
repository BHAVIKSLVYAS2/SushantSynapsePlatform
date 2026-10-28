# Customer-facing copy cleanup

User request: remove unnecessary information across the site, following the
discussion about optional Panchang references. Preserve useful instructions,
results, access checks, privacy information and required software/data notices.

The source scan covered frontend HTML/JavaScript and shared UI, excluding vendor,
generated production, backend and data files. Changes target shared repetition
and the calendar/reading interfaces where reference and internal-review text was
most prominent. This is a targeted cleanup, not a claim that every sentence on
every authenticated screen was independently usability-tested.

| Area | Change |
| --- | --- |
| Shared site notice | Shortened the repeated footer paragraph in English/Hindi/Gujarati; first-visit acknowledgement, AI limitations, review controls and information links retained. |
| Ritvayam daily timings | Removed the optional Drik method link; replaced atmosphere/horizon terminology with a concise timing limitation. |
| Ritvayam app header | Replaced internal review-status wording with an About disclosure; retained experimental-result and privacy information. |
| Rashifal | Removed publication/retrieval metadata and internal model/profile IDs from rendered reading details. Reading period, interpretation, observation controls and calculation evidence retained. |
| Ritual calendars | Removed optional external reference lists and shortened calculation-method prose; retained regional/uncertain-date guidance and GeoNames attribution. |
| Ritual guides and downloads | Removed optional source lists and dated review boilerplate; retained steps, materials, variants, completion, questions and safety guidance. Internal reference records remain. |
| Chambers | Replaced developer checkpoint/implementation wording in the feature-ledger description with feature/service availability wording. Ledger functionality remains. |
| Outage page | Replaced backend terminology and a redundant app inventory paragraph with a short recovery instruction; available-app links remain. |

Privacy/terms/licence pages, bundled licence headers, source metadata, news/fund
attribution, financial warnings, role enforcement and stored user data were not
removed. No provider connection, approval or universal Panchang accuracy is
implied by shortening the copy.

Verification: 17 shared/catalogue/calendar/production model checks, 4 ritual guide
checks, 6 beta/calendar/checklist browser workflows and 2 Rashifal reading browser
workflows passed. The public-page check passed 26 routes, checking shared notice
copy and legal links where those components are used, and retaining Ritvayam's
separate privacy-sensitive notice policy. Optional Panchang reference links are
absent from the changed rendered views. Builds and whitespace checks passed.

Evidence under ignored `.publish/`: `customer-copy-model.log`,
`customer-copy-guides.log`, `customer-copy-browser.log`,
`customer-copy-rashifal.log`, `customer-copy-routes.log`.
Release evidence: `deploy-customer-copy.log`, `customer-copy-live.log`.
