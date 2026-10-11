# Chambers feature review — 10 October 2026

> Historical review from 2026-10-10. Statements describe that review checkpoint, not current deployment status. Production now runs the implemented apps on Cloudflare Workers Free and D1, with a separate Focus workspace. See [the functionality ledger](FUNCTIONALITY_LEDGER.md) for current implementation and verification. This document does not authorize Azure provisioning or a database replacement.

This is a source review and proposed backlog, not implementation or fresh runtime verification. Reviewed the architecture, README, functionality ledger, Chambers frontend, validation/routes/store, SQL schema and existing API/browser test coverage. No production records were inspected or changed. Prior Ritual Assist edits remain separate.

## Existing foundation

Chambers already supports client profiles, case dossiers, CNR uniqueness, assigned advocates, a hearing diary, atomic outcome/next-hearing writes, tasks, notes, document uploads, professional fees, partial payments, expenses, search, reports, printing, calendar export, roles, audit events and backups. General/civil/criminal preparation templates already create three case-linked tasks; proposing basic preparation checklists as a new feature would duplicate that implementation.

## Recommended additions

| Priority | Addition | Evidence of gap | Useful first release | Relative effort |
|---|---|---|---|---|
| 1 | Court-day sheet | The diary lists hearings but has no grouped printable daily work sheet or listing serial number. | Today/tomorrow/date view grouped by court and attending advocate, manually entered item number, purpose, preparation status, latest recorded order and print/PDF. Label it a chambers plan; its entries are not an official cause list. | Small–medium |
| 2 | Hearing follow-up queue | Overview and nextDate exclude past Scheduled hearings; the reminder modal covers today's hearings and due tasks. Unrecorded past outcomes need a dedicated queue. | Show past Scheduled hearings, active matters without a future hearing, upcoming unassigned appearances and incomplete preparation tasks. Each item opens the relevant existing action. Allow a dated review note for matters legitimately awaiting a date. | Small–medium |
| 3 | Order-linked compliance register | Orders are note/document categories; tasks have only a case link and date, without an originating order or approval trail. | Link an uploaded order to an action, manually confirmed due date, responsible person, advocate verification and completion proof. Keep date-change reasons/history. This does not calculate statutory limitation periods. | Medium |
| 4 | Document versions and case bundle index | Store.addFile replaces the blob for the document ID; the current database has no file-version table. Case documents can be downloaded separately. | Preserve prior blobs on future replacement, mark draft/filed/order versions, and print an ordered document index. Start with selected-file downloads and an index; merging/annotating PDFs requires a separately chosen library. | Medium–large |
| 5 | Recoverable-expense settlement | Expenses have a billable flag, but no invoice allocation or recovered balance; existing invoice balances reflect fees/payments. | Link recoverable expenses to an explicit reimbursement statement, distinguish claimed/unclaimed/recovered/waived, support partial recovery and prevent duplicate charging server-side. Keep reimbursements distinguishable from professional fees. | Medium–large |
| 6 | Fee ageing and collection follow-up | Reports show current balances and invoices have an Overdue filter, but no ageing buckets or follow-up history. | Current, 1–30, 31–60, 61–90 and 90+ days overdue; client grouping; promised-payment date; recorded follow-up and an explicitly reviewed client-message draft. | Small–medium |
| 7 | Unified case timeline and handover brief | The dossier separates hearings, tasks, notes and documents; the audit log stores actor/action/label rather than field changes. | A chronological case timeline, a one-page handover brief with latest order/next hearing/pending work and a case-specific edit history for new changes. Do not present inferred links as confirmed links. | Medium |
| 8 | Advocate appearance warnings | Hearing fields include attending advocate/date/time; Chambers routes do not check clashes across different matters. Same-case duplicate protection is currently limited to the next-hearing outcome route. | Warn for same advocate/date/time and multiple courts that day, with a reviewed override and reason. Add estimated duration/travel buffers only if users enter them; court timings are not guaranteed appointments. | Small–medium |

Relative effort is a scope comparison, not a delivery estimate. Priorities are inferred from the current workflows, not measured staff usage.

## Suggested sequence

First deliver the court-day sheet and follow-up queue. Most of their initial data can derive from existing hearings/cases/tasks, and they give immediate daily value without an external provider. Then add order-linked compliance and document version history. Follow with reimbursement/ageing workflows and the case timeline.

Keep these inside the existing Diary, Overview, Case dossier and Billing areas instead of adding eight top-level navigation items. Use mobile cards and a printable desktop sheet, existing theme tokens and shared authentication.

## Operational priorities and implementation boundaries

Always-on backend availability and an explicitly authorized encrypted off-device backup destination are operational priorities alongside features: the current private app depends on the Windows host/tunnel and local snapshots. Their external setup remains pending in the ledger.

All new business writes must use role-enforced validated APIs and SQLite, optimistic revisions and transactional money/date operations. Additive migrations must preserve accounts, records, document blobs and the legacy source; update JSON restore/SQL exports for any new records. Document history can preserve future replacements, but cannot reconstruct versions already overwritten. Business state must not move to localStorage.

Current Owner/Advocate/Clerk roles permit broad workspace visibility. A client portal or restricted-matter access would need a separate authorization design before sharing documents. Automatic messages, court synchronization and legal deadline calculation remain separate projects requiring verified providers/rules and explicit product decisions.

The official eCourts service already offers case status, cause lists and court orders: https://ecommitteesci.gov.in/service/ecourts-services-mobile-application/ . That supports prioritizing internal preparation and follow-up around manually verified court information. It does not establish an integration API or authorize scraping.

## Verification status

Read-only code review completed; proposals checked against the owning schemas, routes and UI to avoid duplicating existing features. No app code changed and no new tests run for this analysis. Implementation, browser verification and deployment of these proposals have not occurred.
