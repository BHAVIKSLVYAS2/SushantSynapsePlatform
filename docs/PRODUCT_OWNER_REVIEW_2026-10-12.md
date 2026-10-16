# Sushant Synapse Platform: product owner review and commercial roadmap

**Review date:** 12 October 2026, India time.

**Scope:** the full platform, including implemented apps, shared services, customer journeys, operational readiness, monetisation and possible additions.

**Deliverable:** recommendations only. No application, schema, deployment, existing account, payment configuration or existing user data was changed.

## 1. Product verdict

The platform has a useful working foundation. It already offers considerably more than a catalogue of prototypes: private business workflows, shared authentication, meaningful validation, document handling, financial safeguards, public exports, bilingual tools and a consistent visual shell.

Its strongest commercial opportunity is to sell a specific outcome to a specific customer: help an advocate prepare and follow up on court work; help a coaching centre collect fees; help an organiser run an event; help an institution issue attractive certificates. The full catalogue can support the brand, but these buyers have different needs and purchasing decisions.

**My recommendation is to strengthen the customer operating model and one paid workflow before building another broad app.** Customer separation, usable capacity, recovery, onboarding, support and accurate promises are the immediate priorities. More templates, games or dashboard decoration will have less effect on saleability.

The current product is suitable for its intended managed workspace and useful public tools. It should not yet be offered as self-service software where unrelated chambers, academies and communities all join the existing shared installation. Dedicated customer deployments could support an initial managed offer after the launch gates below are met.

Chambers is the default first paid-pilot candidate because the repository explicitly targets Indian advocates and chamber staff. BatchFee is a strong alternative if customer interviews show clearer demand and lower support costs. Moment Studio and Tournament deserve smaller, event-based pricing experiments. DIGITAL SAMAJ has substantial depth, but needs more governance and administrator support. These are product judgments, not evidence of established demand or revenue.

## 2. What was reviewed, and what the evidence means

The review covered the mandatory architecture, functionality ledger and README; the app registry; app frontend/backend implementations and schemas; shared authentication and permissions; Node and Cloudflare composition; deployment and recovery documentation; legal/contact/support pages; monetisation; CI and relevant tests. Earlier product reviews were checked against current source so that completed recommendations were not repeated as missing features.

Fresh headless Chrome checks used an isolated temporary `DATA_DIR`, SQLite explicitly selected, and synthetic account details. External browser requests were blocked. The checks covered **19 page states and 152 combinations of page, width and theme**, at 320, 390, 768 and 1440 pixels in light and dark modes. They found **no horizontal overflow and no page errors**. Mobile screenshots of home, sign-in, the certificate editor, condolences and Chambers were inspected.

Those page states included public discovery, Moment Studio, Focus, Take a Break, Timetable, Team Mixer, Decision Wheel, Ritual guides/calendar, contact/privacy/terms, sign-in, the authenticated catalogue and initial Chambers, BatchFee, Samaj and Tournament screens. This was a rendered layout review, not a fresh complete workflow test of every app or populated screen. News, Fund Lens and Arena were reviewed through source, documentation and recorded verification.

A separate **in-memory SQLite probe** used the actual Chambers schema, Free capacity triggers and edge UPSERT statement. It reproduced failures when editing existing records near capacity; details appear below. It wrote no files. Native D1 reproduction is still required.

Fresh live-site Chrome navigation was blocked by the execution environment with `ERR_NETWORK_ACCESS_DENIED`. That is not evidence of a platform outage. Production status in this report comes from current composition/configuration and the latest recorded deployment evidence, not a new authenticated production audit. No real workspace records, private recovery bundles or credentials were inspected.

Official competitor and infrastructure sources were checked online. Pricing proposals, customer demand, effort estimates and acceptance targets below are explicitly hypotheses. No customer interviews, penetration test, legal opinion or production load test was performed.

## 3. Current product reality

| Area | Current position | Product implication |
|---|---|---|
| Portfolio | Registry has 15 Available entries and three Planned entries; some entries are activities within a hub | Available entries are not automatically 15 separate products people will buy |
| Production | Latest ledger records Free Cloudflare Workers/D1 deployment, including the heavier apps, with no private-API laptop fallback | The old diagnosis that all private apps require the laptop is outdated |
| Customer model | One Chambers workspace and one BatchFee academy; app access is managed by the platform owner | App grants do not create separate customer organisations |
| Shared experience | Persistent header, app switching, shared theme, favourites/recents and account management | Preserve this foundation; another global navigation redesign is unnecessary |
| Data ownership | Private business records use backend persistence; some public tools intentionally use browser or tab state | Explain each app's storage lifetime and audience at the point of use |
| Planned apps | Projects, Finance and Knowledge remain clearly unavailable | Keep them labelled Planned until useful and verified |
| External connections | Court sync, automatic message delivery, payment processing and client portals are not established | Manual records, message drafts and external links must retain accurate labels |
| Verification | Latest release records 199 API regressions, 10 Studio/Celebration workflows and 11 distinct portal scenarios; separate edge/staging evidence exists | These are recorded results for defined releases, not proof of every future workload |

Sources: [registry](../packages/app-registry/index.js), [current ledger](FUNCTIONALITY_LEDGER.md), [architecture](ARCHITECTURE.md), [Free deployment guide](CLOUDFLARE_FREE_DEPLOYMENT.md), [README](../README.md).

### Strengths worth preserving

- Server validation, app grants, role checks and session revocation give business workflows a credible foundation.
- Hearing outcome and next date remain atomic; payment balances are enforced server-side.
- BatchFee uses integer paise, idempotent commands and history-preserving corrections.
- Private documents have authenticated access and byte-integrity checks.
- Public tools often provide immediate value without sign-in or uploading personal inputs.
- Useful print, CSV, PNG, PDF and calendar exports reduce dependence on the application.
- Themes, mobile layouts, touch controls, keyboard support and reduced-motion handling already have substantial implementation and test evidence.
- The ledger distinguishes implementation, local verification, deployment and external dependencies. That discipline should continue.

## 4. Priorities before selling a dependable workspace

Here, **P0** means a prerequisite for the affected paid offer; **P1** means the next adoption or reliability improvement; **P2** means an enhancement to pursue after pilot evidence. This does not mean public tools need to be withdrawn while the commercial foundations are developed.

### P0: separate independent customers

All authorised Chambers staff currently see the same practice records. Assignment is a workflow field, not an access boundary. BatchFee similarly has one academy. Samaj scopes and tournament ownership provide app-specific controls, but do not establish tenant isolation across the platform.

For the first commercial pilot, choose between a managed deployment/database per customer and a properly designed organisation model. Dedicated instances are a practical initial option; they still require repeatable provisioning, upgrades, backup, support, cancellation and a cost model. A shared multi-customer service requires scoped queries, documents, settings, audit, exports, restores, account administration and support access.

**Acceptance:** provision two independent customers and prove that neither can read, modify, search, download, export, restore or administer the other's data. Preserve the existing workspace during this work.

Evidence: [shared schema](../packages/database/schema.sql), [Chambers schema](../apps/advocate/database/schema.sql), [Chambers edge state](../apps/advocate/backend/edge.mjs), [BatchFee edge workspace](../apps/batchfee-lite/backend/edge.mjs), README's single-organisation boundary. This is an intended-scope limitation, not a demonstrated breach of the current one-workspace design.

### P0: make the capacity promise commercially usable

The selected Free profile has deliberate application limits:

| Limit | Actual scope | Customer consequence |
|---|---|---|
| 250 Chambers records | All nine business record types combined, including archives | This is not 250 cases |
| 262,144 bytes aggregate Chambers JSON | All saved Chambers record payloads | Capacity can be exhausted before the record-count limit |
| 8,192 bytes per record | Encoded record JSON | Long notes and Hindi text can exceed the byte limit despite a larger visible character allowance |
| 25 accounts | Shared platform account budget | Community membership and staff accounts can compete for the same allowance |
| 1,000,000 bytes per private file | Each supported BLOB | Many scanned legal PDFs will need a larger tested profile or explicit preparation guidance |
| 100,000,000 bytes private BLOBs | Chambers documents plus Samaj photos/message attachments | One app's growth can reduce capacity available to another |
| 49 D1 statements per full-app request | Application request budget | Large operations need bounded processing and clear rejection behavior |

Source: [Free guide](CLOUDFLARE_FREE_DEPLOYMENT.md), [capacity triggers](../infrastructure/cloudflare/d1-free-migrations/0002-free-guards.sql), [BLOB capacity triggers](../infrastructure/cloudflare/d1-free-migrations/0004-samaj-blobs.sql), [D1 storage](../packages/storage/d1.mjs).

An illustrative matter with one client, one case, three hearings, three tasks, three notes, two documents, one invoice and two payments consumes **16 records**. Fifteen such matters consume 240 records; sixteen consume 256. This is a counting example, not observed customer usage. A paid practice can outgrow the current profile with a small casebook.

Add an owner-visible capacity meter, warnings before the limit, accurate file-size guidance and a documented growth path. Archiving retains records and therefore does not reclaim this quota. Establish workload and cost targets before proposing infrastructure changes; this review does not authorise a paid upgrade.

**A capacity-accounting defect also needs attention.** The edge helper uses `INSERT ... ON CONFLICT DO UPDATE`; the `BEFORE INSERT` trigger checks capacity before the conflict becomes an update. The isolated SQLite probe found:

| Boundary operation | Result |
|---|---|
| Insert a 251st record | Rejected as expected |
| Edit an existing record at 250 records | Rejected, although count would not grow |
| Archive an existing record at 250 records | Rejected, although count would not grow |
| Read at 250 records | Allowed |
| Replace an 8,000-byte row at 256,000 aggregate bytes with the same-sized row | Rejected, although final bytes would not grow |
| Reduce that row to 6,000 bytes | Accepted |

This is reproduced using actual source SQL in Node SQLite, **not newly reproduced on native D1 or production**. Investigate and correct the accounting without weakening atomic validation. Current Free tests check rejection/rollback of an additional hearing at the count cap but do not cover existing-record edits at that boundary.

**Acceptance:** native D1 checks for insert/edit/archive, Unicode payloads, hearing outcomes and preparation batches at count/byte boundaries; no partial commits; existing records remain usable within the agreed policy. Evidence: Chambers `edge.mjs`, line 14; capacity trigger SQL, lines 2–9; [Free test](../tests/cloudflare-free.cjs), around line 134.

Provider limits are separate from these application caps. Cloudflare documents daily Free Worker quotas, CPU limits and D1 query/storage/recovery bounds. Public traffic and private operations can share constrained resources. Measure demand and define quota exhaustion behavior before advertising availability guarantees. [Workers limits](https://developers.cloudflare.com/workers/platform/limits/), [D1 limits](https://developers.cloudflare.com/d1/platform/limits/).

### P0: offer a defined recovery service

Cloud interactive backup/restore is disabled in the selected profile. Verified offline export/recovery tooling exists, but requires operator access, an isolated restore target and binding changes. Old laptop sources do not receive new cloud writes and are not current backups.

Before selling confidential-record hosting, define backup frequency, retention, protection, key custody, acceptable data loss, recovery time and the responsible person. Show the last successful backup and restore drill when that service actually exists. Provide a customer exit/export package with records, IDs, relationships, documents and a manifest.

**Acceptance:** restore a fresh cloud backup into a new isolated target, verify account recovery, relationships and exact document bytes, measure elapsed recovery time, and record the result. A proposed initial target could be a 24-hour recovery point and one-working-day restoration; validate these operationally before putting them in an agreement. Offline validation alone is not a completed remote restore drill.

Evidence: [edge route restrictions](../server/edge-index.mjs), line 29; [recovery procedure](CLOUDFLARE_FREE_DEPLOYMENT.md); [recovery tool](../infrastructure/cloudflare/free-recovery.cjs).

### P0: complete the operator and data lifecycle

WhatsApp contact is configured, but complete operator identity, dedicated support/complaint information and several retention/rights workflows remain pending. Paid customers need a clear agreement covering the service, limits, support, data ownership, exit and cancellation.

Define category-specific retention, correction, removal, guardian authority and legal-hold handling. Samaj's person/photo lifecycle and academy data about children deserve particular attention. Deletion from an active screen must be distinguished from archival retention, replaced files and backup copies. Have qualified counsel assess the current Indian data-protection requirements and their commencement/application to the actual service; this review makes no legal compliance finding. [MeitY rules resource](https://www.meity.gov.in/documents/act-and-policies/digital-personal-dataprotection-rules-2025gDOxUjMtQWa?pageTitle=Digital-Personal-Data-ProtectionRules-2025).

Evidence: [privacy](../apps/portal/frontend/privacy.html), [contact](../apps/portal/frontend/contact.html), [legal information](../apps/portal/frontend/legal.html), [source/rights register](LEGAL_SOURCE_REGISTER.md), [Samaj lifecycle boundaries](../apps/digital-samaj/README.md).

### P1: make account continuity a supported workflow

Password reset currently depends on the platform owner. Document and test owner-led staff recovery, identity checks, staff onboarding/offboarding and ownership transfer or succession. A database restore procedure does not by itself tell a locked-out customer how to regain authorised access.

Preserve the selected email/password mode without requiring OTP. Self-service recovery, invitation acceptance or optional stronger authentication can follow a separately chosen provider/security flow. Do not imply that invitation email delivery or automatic recovery already exists. Account continuity must be part of the paid service acceptance.

Evidence: [sign-in recovery guidance](../apps/portal/frontend/platform.js), line 62; [edge authentication](../packages/auth/edge.mjs).

### P1: make reliability and support observable

Production Worker observability is disabled; the health endpoint is a basic database check. Business audit is valuable but does not establish uptime, error, latency or quota monitoring. The shared D1 revision also makes unrelated concurrent writes a potential source of conflicts; this is a source-derived risk, not a measured production incident.

Introduce privacy-safe error/latency/quota monitoring, external health checks, alert ownership and an incident/support workflow. Measure concurrent staff use alongside public traffic on staging. Include session expiry, interrupted saves, conflicting edits and retries. Never log passwords, confidential request bodies or document contents.

Release verification must include the actual production backend. The current CI runs API/browser checks but omits `npm run test:cloudflare`; SQLite browser fixtures alone do not verify Workers/D1 behavior. Add edge-profile acceptance alongside compatibility checks.

Evidence: [production configuration](../infrastructure/cloudflare/wrangler.free.production.jsonc), line 22; [edge composition](../server/edge-index.mjs), lines 27 and 47; [D1 transaction guard](../packages/database/d1.mjs), lines 8–15; [CI](../.github/workflows/test.yml).

### P1: publish one trustworthy current capability matrix

Documentation contains contradictory current and historical statements: D1 versus laptop-backed APIs; 1 MB versus 5 MB uploads; available versus disabled interactive backups; delegated BatchFee staff versus owner-only copy; removed versus compatible legacy URLs; and certificate batches versus “no bulk tools.” The public BatchFee card and sign-in copy still say owner-only while the registry/backend describe delegated staff.

Create one dated capability matrix for sales, help and support: route, audience, storage location, limits, role restrictions, export/recovery, connected services and current verification. Keep historical deployment records, but label them clearly. Accuracy here will reduce failed onboarding and support disputes.

Evidence: [README](../README.md), [public home](../apps/portal/frontend/index.html), [sign-in and home renderer](../apps/portal/frontend/platform.js), [registry](../packages/app-registry/index.js), current ledger and individual app READMEs.

## 5. Product positioning and the customer journey

Keep Sushant Synapse as the umbrella brand and the current app launcher. Give the commercial apps separate use-case pages and offers: “prepare tomorrow's court work,” “know which fees need follow-up,” “run a tournament and publish results,” and “issue a consistent set of certificates.” Keep the current requested homepage app order; a separate sales page does not require changing it.

The existing app finder, public/private labels, demos and sign-in destinations already solve basic discovery. The missing journey is:

**Understand the offer → try a relevant demonstration → request access → get an isolated workspace → import real work safely → complete the first useful task → receive support → renew or leave with data.**

On mobile, shorten the sign-in introduction so that the form is the immediate task. The reviewed sign-in screen spends substantial space on branding before credentials. Home's two-column cards also truncate some descriptions; test whether buyers can identify the tool without opening it. These are focused refinements, not reasons to redesign all apps.

For private apps, show a first-use checklist, a useful empty state and one next action. The fresh review saw reasonable empty states, but a customer still needs a guided sequence and access explanations. In Samaj, being signed in, having app access, having a community role and having an approved profile claim are different stages; show the next responsible person and action.

Offer demonstration data only in separate disposable workspaces. Do not seed examples into a customer's existing practice, fee ledger or community registry. Provide sample imports as explicit downloads and validate before adding records.

Expand Hindi support according to actual regional pilot demand. Shared Hindi navigation does not translate all Chambers/BatchFee forms. Tell users the actual language coverage, then prioritise the daily forms, validation messages and printed outputs they need.

## 6. Review and improvements for every app

### Chambers — strongest default candidate for a managed subscription

**Already useful:** clients, dossiers, CNR validation, hearings, atomic adjournment/outcome, tasks and preparation templates, notes, authenticated documents, fees/payments, expenses, reports, audit, print/CSV/ICS and staff roles.

The next improvements should make the daily workflow more dependable:

1. **Court-day plan and unresolved work queue — P1.** Group today's/tomorrow's appearances by court and advocate, with purpose, preparation, documents and a printable daily sheet. Surface past Scheduled hearings without outcomes, active matters without a future date and unassigned appearances. Allow an explicit “awaiting listing” review state. Call it a chambers-maintained plan; official court synchronisation is separate.
2. **Hearing-specific readiness and order compliance — P1.** Existing templates already create preparation tasks. Link readiness to the particular hearing, and link order-driven tasks to an order/document version, manually confirmed due date, responsible person, completion evidence and date-change reason. Statutory limitation calculation remains a separate validated project.
3. **Assignments, clashes and closure — P1.** Warn about the same advocate's conflicting appearances and duplicate entries. Limit relevant assignment choices to users with the appropriate access/role. Case closure should review outstanding tasks, hearings and fees with explicit decisions rather than silently cancelling history.
4. **Document history and case bundles — P1/P2.** Replacement currently overwrites the stored document bytes. Preserve future versions with uploader/date and draft/filed/order status; provide an ordered document index, selected downloads and handover brief. Earlier versions are not available through the app; recovery backups may contain copies, but should not be promised as version history.
5. **Collection and expense recovery — P1.** Add receivable ageing, promised-payment dates and follow-up history. Recoverable expenses need unclaimed/claimed/part-recovered/recovered/waived states and server-validated allocation so the same expense cannot be charged twice.
6. **Faster intake and non-destructive imports — P1.** A quick client-and-matter form, collapsed optional details, CSV mapping/preview and duplicate/CNR checks would reduce setup effort. Preserve existing records and return an error report before committing invalid imports.

Validate milestone fees, advances, refunds and cheque status during pilots before expanding billing. Keep professional-fee statements accurately described; GST invoicing is not currently provided. Restricted matters and financial visibility need server-enforced permissions across search, state, downloads and exports, not just hidden buttons.

**Proposed success measures:** time to create the first usable matter/hearing; weekly court-plan use; unresolved-hearing backlog; preparation completed before appearance; collection follow-up completion; four-week active retention.

Sources: [field definitions/validation](../apps/advocate/backend/schema.js), [edge workflows](../apps/advocate/backend/edge.mjs), [Node workflows](../apps/advocate/backend/routes.js), [frontend](../apps/advocate/frontend/app.js), [stored documents/state](../apps/advocate/backend/store.js), [earlier Chambers review](CHAMBERS_FEATURE_REVIEW_2026-10-10.md).

### BatchFee — strong recurring-value education product

**Already useful:** recurring dues, partial/advance payments, family balances, receipts, expenses, CSV import, WhatsApp drafts and delegated Viewer/Collector/Manager roles. The compatibility runtime also has validated app backups; deployed Free cloud recovery is operator-led, with interactive backup/restore disabled. Paise arithmetic and idempotency are important strengths.

1. **Concessions and fee policy — P1.** Named recurring concessions, effective dates, previews and joining/leaving policies. Current joining months are charged in full; a whole-balance waiver plus replacement charge is awkward for recurring discounts.
2. **Refunds and corrections — P1.** Distinguish undoing a mistaken entry from returning actual money. Preserve links to original payments and show the resulting ledger.
3. **Collection worklist — P1.** Ageing, collector assignment, promised dates and follow-up history beside the existing manual message drafts. Do not label a prepared WhatsApp draft as delivered.
4. **Staff scope and scale — P1.** Optional batch/student visibility where customers need it. Measure multi-year event history and whole-workspace JSON before promising large academies; use indexed idempotency lookup and paginated views where measurements justify them.
5. **Attendance — P2, demand dependent.** Record sessions, attendance and make-up classes using canonical student/batch IDs. Attendance must not silently recalculate fees; require an explicit fee policy and preview.

**Commercial fit:** small coaching centres seeking collections discipline, rather than a full school ERP. Parent access and online collection follow scoped identities, reconciliation and customer separation.

Sources: [BatchFee rules/roles](../apps/batchfee-lite/README.md), [financial engine](../apps/batchfee-lite/backend/engine.js), [edge persistence](../apps/batchfee-lite/backend/edge.mjs).

### DIGITAL SAMAJ — differentiated, with substantial governance needs

**Already useful:** family/person registration, independent review and claims, scoped directory, Vanshavali, privacy projections, photos, bilingual printing, imports, participant messaging and scoped events/RSVP.

1. **Onboarding status — P1.** Show account, app grant, community role, family submission, review, claim and messaging eligibility, with a next action and responsible reviewer.
2. **Visibility and lifecycle — P0/P1.** Plain-language “who can see this” previews; guardian authority, consent updates, correction/withdrawal and a governed retention/removal process. Current PRIVATE/PUBLIC terminology must be explained in the authenticated-community context. Replaced photos and backups require deliberate treatment.
3. **Review operations — P1.** Queue age, reviewer responsibility, duplicate-family handling, reasons for decisions and member-visible progress. Preserve independent review rather than bypassing it to simplify onboarding.
4. **Events and coordinated preparation — P2.** Extend the existing events with revision history, responsibilities and calendar export where useful. Do not create a duplicate community event system.
5. **Account and directory capacity — P0/P1.** A 25-account platform allowance is restrictive for messaging membership. The ledger's 1,000-profile synthetic directory result is encouraging, but not proof of production load or large-community governance.

**Commercial fit:** assisted community deployments with administrator training and a defined support agreement. Avoid adding matrimonial or donor matching until consent, moderation, access and lifecycle operations are settled.

Sources: [Samaj boundaries](../apps/digital-samaj/README.md), [directory](../apps/digital-samaj/backend/directory.js), [events](../apps/digital-samaj/backend/events.js), [messaging](../apps/digital-samaj/backend/messaging.js), ledger's earlier audit-addition evidence.

### Tournament Lite — promising per-event product

**Already useful:** six sports, four formats, fixtures/BYEs, scoring, standings/brackets, corrections, public result links, winner cards and conflict-aware scheduling.

1. **App-specific organiser and scorer access — P1.** The current gate uses global Owner/Advocate roles and a tournament belongs to one account. Sports users should have relevant tournament memberships and delegated score entry/approval.
2. **Registration, check-in and exceptions — P1/P2.** Participant confirmation, withdrawals, no-shows and score approval/correction history. Keep public viewers separate from participant identity and private contact details.
3. **Tie rules — P1.** Explain and configure reviewed sport-appropriate policies. Original entry order currently acts as the final tie-break, which can decide qualifiers/champions.
4. **Publishable scheduling — P2.** Build on existing conflict checks with multiple-court/rest-time policies and participant calendar exports. Ball-by-ball cricket, DLS and Swiss chess are separate commitments, not small additions.

**Commercial fit:** clubs, schools and community organisers who need simple administration and public results. Pilot a per-event service before an annual organiser plan.

Sources: [Tournament rules](../apps/tournament-lite/README.md), [edge access](../apps/tournament-lite/backend/edge.mjs), [scheduling](../apps/tournament-lite/frontend/scheduling.js).

### Moment Studio — useful acquisition tool and premium experiment

**Already useful:** certificates and greeting/condolence editors, English/Hindi wording, local images, saved browser organisation branding, PNG/PDF/print, and **CSV/PDF-ZIP batches of up to 20 recipients**. The recently simplified card editor should be preserved.

1. **Export preflight and print guidance — P1.** Extend existing file, text-fit and branding validation with clearer source-image quality, missing-information, DPI/paper and Hindi-font guidance. Provide examples for schools, clubs, workshops and community acknowledgements.
2. **Better institutional reuse — P2.** Professionally reviewed templates, reusable issuer presets and optionally saved drafts with explicit consent and storage explanations. Recipient/signature privacy should remain deliberate.
3. **Larger batch workflow — P2.** Validate demand for more than 20 recipients; add row-level previews/error handling and bounded export performance. Do not recommend basic bulk certificates as an absent feature.
4. **Premium value — P2.** Test paid institution branding, approved reusable packs, batch review and issuer-controlled workflows. Browser-side branding removal alone is a weak enforceable entitlement; stronger verified exports require trusted server authorisation.

**Commercial fit:** retain useful free exports; test occasional event/institution purchases before assuming a monthly subscription. Certificate references are not proof of issuer verification or accreditation.

Sources: [batch editor](../apps/moment-studio/frontend/certificate-app.js), around lines 194–198; [batch limits](../apps/moment-studio/frontend/batch.mjs); [brand policy](../apps/moment-studio/frontend/branding.mjs); current ledger.

### Timetable Lite — strong companion for the education offer

**Already useful:** constraint-based generation, class/teacher/master views, moves/swaps/undo, exports, validated local backups and dated absence-cover suggestions.

1. **Explain scheduling failures — P1/P2.** Distinguish invalid demand, incompatible constraints and a bounded search timeout; suggest the specific allocation or availability to review.
2. **Versioned publication — P2.** Draft/approved/published schedules, change reasons and a clear effective date. Preserve a published timetable while experimenting with a new draft.
3. **Teacher access and cover approval — P2.** Read-only staff views and an approved substitution history. This introduces a backend collaboration product; it must not be described as existing browser sync.

**Commercial fit:** companion to BatchFee/attendance if education customers ask for it. Keep the current device-local option and JSON backup behavior clear.

Sources: [Timetable app](../apps/timetable-lite/frontend/app.js), [solver](../apps/timetable-lite/frontend/engine.js), [ownership](ARCHITECTURE.md).

### Fund Lens — useful analysis, dependent on trustworthy supply

**Already useful:** holdings/industry comparisons, what-if analysis, dated provenance, freshness handling, identity checks and last-good public data. The removed portfolio/watchlist interface should not be treated as a missing promised feature; preserved private APIs/data are a compatibility boundary.

1. **Coverage and comparability — P1.** Selected-fund date/NAV coverage and Check coverage already exist. Build on these with aligned disclosure-date comparisons, clearer source-quality differences and understandable debt/gold/fund-of-funds exclusions before presenting a strong numerical conclusion.
2. **Refresh and provider operations — P1.** Monitor source failure/staleness and maintain a reviewed refresh process. September reference snapshots in the index supersede stale July README wording.
3. **Method explanation — P1/P2.** Explain overlap and unique contribution using small examples; overlap is not a portfolio risk score or investment recommendation.

**Commercial fit:** public complement initially. A paid reliability promise requires verified commercial data rights and dependable supply; public website availability is not a service contract.

Sources: [Fund scope/method](../apps/fund-overlap/README.md), [reference index](../apps/fund-overlap/data/fund-index.json), [providers](../apps/fund-overlap/backend/national-provider.js), [rights register](LEGAL_SOURCE_REGISTER.md).

### News — requires an editorial operating model

**Already useful:** dated source checks, credited short excerpts, archived editions, explicit fictional satire, bounded publication and source fallback/light reading.

1. **Reliable publication process — P1.** Define who publishes, when, how source failures are handled and what “edition unavailable” means. The edge budget is shared: 20 attempts/day, cooldown and five attempts/edition. The ten-story requirement can fail when verified coverage is sparse.
2. **Corrections and provenance — P1.** Attach dated corrections/addenda to archived editions rather than silently rewriting them. Clearly separate reported facts, excerpt source and fictional comic dialogue.
3. **Rights and commercial scope — P0 for the affected monetised offer.** Resolve publisher/provider caching, excerpts and export permissions, including sponsorship-supported distribution where relevant; attribution alone does not settle usage rights.

**Commercial fit:** public editorial complement, with measured sponsorship later. Avoid selling guaranteed daily coverage or advertising reach before editorial/source operations and audience evidence exist.

Sources: [News scope](../apps/news/README.md), [edge budgets](../apps/news/backend/edge.mjs), [publication](../apps/news/backend/publication.js), [rights register](LEGAL_SOURCE_REGISTER.md).

### Ritual Assist — prioritise reviewed accuracy and care

**Already useful:** 15 bilingual guides, uncertain-date handling, stateless calendar calculation, individually resolved ICS events and a selectable bilingual preparation pack.

1. **Expert and regional review — P1.** Name the reviewed tradition/region, review date and unresolved cases. Expand fixtures for boundary times and regional conventions before adding more calculations.
2. **Coordination — P2.** Improve responsibility/checklist exports and handover to selected invitation/remembrance designs. Saved family records should be optional and separately permissioned.
3. **Expectation management — P1.** Keep approximate dates and conditions visible in the on-screen plan, print and reminders. Do not convert a lunar observance into a fixed annual Gregorian recurrence.

**Commercial fit:** useful free community service; paid certified-date accuracy or provider booking is not supported by current evidence. Avoid monetisation that interferes with sensitive mourning workflows.

Sources: [Ritual scope](../apps/ritual-assist/README.md), [reminders](../apps/ritual-assist/frontend/calendar-export.mjs), [preparation pack](../apps/ritual-assist/frontend/preparation-pack.mjs).

### Focus, Take a Break, Daily Spark, Decision Wheel, Team Mixer and Pocket Pause

These tools provide low-friction discovery and repeat usefulness. Focus deliberately saves tasks in the browser without sign-in; keep that choice. Daily Spark and Pocket Pause retain direct routes within the wider break collection. Wheel already has reusable list import/export; Team Mixer has keep-together/apart constraints; Pocket Pause includes quilt export. Those are not new backlog items.

- **P1/P2:** concise task-specific help, clear state lifetime, robust local export/import where useful, accessible touch/keyboard controls and optional contextual discovery.
- **P2:** Focus could gain configurable timer lengths and a local weekly completion view if interviews show value; recurring tasks belong in the existing app rather than another task manager.
- **P2:** Team Mixer could offer reviewed skill balancing only if coaches need it, with transparent rules and consent for any extra participant attributes.
- Keep free, quick access. Do not create separate subscriptions for every small utility or introduce competitive streaks/leaderboards without a clear user benefit and appropriate identity/moderation model.

Sources: app-owned READMEs/engines; [Focus task model](../apps/focus/frontend/task-model.mjs); [shipped audit additions](PLATFORM_AUDIT_IMPLEMENTATION.md); current ledger.

### Satire Arena / Garland or Roast

**Already useful:** daily reactions, public aggregate scores, private choice handling/removal and branded result sharing. It is browser-based informal voting, not verified one-person voting.

Prioritise understandable reset/score rules, content reporting, reviewed moderation and clear separation from professional workspace marketing. Treat source/licensing and reputational concerns deliberately. Do not sell polling accuracy or verified political sentiment. Its likely role is entertainment and discovery, not the primary paid business product.

Sources: [Arena scope](../apps/satire-arena/README.md), [ballot rules](../apps/satire-arena/backend/edge.mjs), [artwork provenance](../apps/satire-arena/ARTWORK.md).

### Projects, Finance and Knowledge — keep Planned

Projects would duplicate several existing task/workflow features without a proven new buyer. Finance risks duplicating Chambers and BatchFee ledgers while introducing broader accounting expectations. Knowledge is more promising if narrowed to approved chamber templates and references. Validate that focused use case before turning any of these entries into a general-purpose app.

## 7. Useful connections between existing apps

These are proposed workflows; existing winner cards, Samaj events and standalone exports should be reused.

| Connection | Useful outcome | Required boundary |
|---|---|---|
| Tournament → Moment Studio | Select approved results and issue consistent appreciation certificates | Explicit selection; preview names/results; no private contacts in public exports |
| BatchFee + Timetable | One academy setup can inform schedules and later attendance | Canonical IDs, workspace ownership and explicit import/sync semantics; no silent local/cloud merging |
| Samaj events → Moment Studio | Event announcements/acknowledgements without retyping selected details | Sharing preview and appropriate event/profile visibility |
| Ritual plan → Moment Studio | Chosen remembrance event becomes an editable invitation/card | Only user-selected confirmed details; keep uncertainty conditions |
| Chambers → Template Desk | Selected matter facts populate an approved office template | Authorised access, field preview, template version and advocate review |

Build small, explicit handoffs before a generic platform-wide integration engine. A recipient's name or private event detail should not silently move between apps. Backend business writes still need validation and role enforcement.

## 8. New apps or modules worth considering

### First candidate: Intake & Engagement / Client Desk

**Buyer:** a small chamber. **Problem:** enquiries, consultations, missing papers and accepted matters are handled separately.

Start as a Chambers module: enquiry source, consultation, potential-party conflict review, required-document checklist, engagement scope/agreed fee, accept/decline and an explicit conversion into the existing client/matter. An expiring external intake link and approved client status/documents can follow once client identities and sharing permissions exist.

**MVP acceptance:** an enquiry cannot create a canonical matter without approval; conversion does not duplicate clients; client-visible content excludes internal notes and other matters; withdrawn links stop working; actions are auditable. Name matching is a prompt for professional conflict review, not a definitive legal clearance.

**Why prioritise it:** extends the existing commercial workflow and reduces repeated entry. **Dependency:** customer separation, capacity, recovery and appropriate public-input validation. Test a chamber's willingness to pay for reduced intake effort before separating it into a standalone app.

### Second candidate: Academy Attendance / Institute Desk

**Buyer:** a coaching centre already using BatchFee. **Problem:** attendance, make-up classes and fee follow-up do not share a reliable student/session record.

Start with student/batch/session attendance, absence reasons, make-up tracking and a teacher's daily list. Reuse BatchFee IDs; a published timetable is an optional input. Add parent views later with properly scoped identities. Attendance-based charges require an approved policy and a preview, never an automatic surprise.

**MVP acceptance:** repeated attendance entry cannot duplicate a session; corrections retain history; teachers see only assigned batches; fee history is preserved; reports work for joining/leaving students. **Dependency:** an isolated academy, roles, child-data governance and policy validation.

**Why prioritise it conditionally:** strong adjacency if education is the winning pilot segment. Prefer a module until separate demand is demonstrated.

### Third candidate: Chambers Knowledge / Template Desk

**Buyer:** a chamber reusing office templates and practice notes. **Problem:** staff use different versions of notices, checklists and internal references.

Narrow the existing Planned Knowledge idea to approved templates, source/jurisdiction/review dates, versions, tags, restricted access and manually reviewed case-field insertion. Useful starting content is engagement letters, client update formats, document indexes and office checklists.

**MVP acceptance:** staff can identify the approved version, older versions remain traceable, restricted matter fields stay protected, and exports show the chosen issuer/template. AI drafting is an optional later experiment with explicit review, not the initial value proposition.

### Fourth candidate: Event Desk — only after repeated demand

**Buyer:** organisers running workshops, community events and competitions. **Problem:** registration, attendance/check-in and certificate issuance span several tools.

First extend existing Tournament/Samaj event workflows. If repeated non-sports demand appears, a separate Event Desk could own registration, capacity/waitlist, check-in, approved participant lists and certificate handoff. It should not duplicate schedules, scoring or family registries.

**MVP acceptance:** clear data ownership and consent, idempotent check-in, restricted attendee details, dependable capacity rules and no implied online collection. A payment gateway is an optional later integration.

**Defer:** broad CRM, general Projects/Finance, a marketplace, matrimonial/donor matching, another task manager, standalone AI tools, automatic court scraping, legal limitation engines and offline shared financial editing. Each adds a substantial operating surface before the existing paid journeys are proven.

## 9. Commercial offers and monetisation

Do not bundle all apps into one paid subscription simply because they share a login. Sell a relevant workspace or event outcome, with free public tools supporting discovery.

The following are **interview/pilot price hypotheses**, not market benchmarks, confirmed prices or revenue projections. Storage, seats and support terms must be agreed against a tested capacity profile; the current Free limits are not implied to support these offers.

| Offer hypothesis | Initial customer | Price to test | Value to validate |
|---|---|---|---|
| Managed Chambers pilot | Small chamber, roughly 3–5 staff | ₹999–₹1,999/month, with import/setup quoted separately | Daily preparation/follow-up, usable document capacity, recovery and support |
| BatchFee coaching pilot | Small coaching centre | ₹499–₹999/month | Fewer untracked dues, faster receipts and organised follow-up |
| Institution/event certificate pack | School, club or workshop | ₹299–₹799/event or pack | Approved branding, batch review and predictable output |
| Tournament event service | Club/community organiser | ₹299–₹999/event | Setup, scorer collaboration, understandable results and schedule publication |
| Samaj deployment | Community committee | Bespoke pilot after scope review | Administrator/reviewer training, governance, migration and support |

A paid pilot can use a documented manual invoicing/confirmation process; a payment gateway is not required for every initial sale. Before self-service checkout or subscriptions, add server-authoritative entitlements, verified payment state, expiry, cancellation/refunds and customer receipts. A contribution link or WhatsApp enquiry is not payment confirmation.

Retain free useful creative/play tools. Direct sponsorship is a secondary experiment after audience evidence exists. AdSense script installation does not establish account approval, impressions or income. Verify the actual account/site approval, relevant privacy-message configuration and affected source/asset rights before expanding advertising. Donations are not a substitute for a product offer or a verified subscription system.

Calculate contribution per customer as **revenue minus hosting/storage, messaging/provider fees, payment costs, support/onboarding time and acquisition costs**, with applicable taxes assessed separately. Price storage and hands-on support explicitly. Track whether support cost falls after onboarding; a low subscription price can be uneconomic if it requires frequent operator intervention.

Evidence: [current monetisation scope](MONETIZATION.md), [support backend](../apps/portal/backend/support.js), [sponsorship rules](../packages/ui/sponsorship-engine.mjs), current ledger.

## 10. Proposed delivery sequence

This is a dependency-based roadmap, not a commitment or implementation authorisation. The suggested periods assume a small team and will need estimates after requirements are agreed.

| Stage | Suggested period | Work | Exit evidence |
|---|---|---|---|
| Establish the offer | First 2 weeks | Reconcile capability claims; reproduce capacity on D1; choose customer isolation/recovery model; interview roughly 4 chambers, 4 academies, 3 organisers and 3 community administrators | One selected paid segment, ranked problems, actual workload sizes, explicit service limits and support responsibilities |
| Prepare one safe pilot | Following 2–4 weeks | Correct capacity boundaries; provision isolated workspaces; establish backup/restore and monitoring; improve onboarding/import; verify production profile | Isolation and native edge acceptance, successful restore drill, observed first-use completion |
| Improve the winning daily workflow | Following 4–6 weeks | Chambers: court-day/outcome/compliance; or BatchFee: collections/concessions/refunds; run 3–5 customer pilots in the selected segment | Four-week use, payment willingness, useful outcome measures, manageable support load |
| Add one adjacency | After pilot evidence | Intake, attendance or institution export pack; add explicit cross-app handoffs | Customers use the addition and value it enough to justify maintenance |
| Expand the business | After operating model works | Second vertical or self-service tenancy/payment lifecycle | Repeatable provisioning, recovery, upgrades, renewals and customer exit |

Do not run paid pilots for every vertical simultaneously with limited support capacity. The full-platform review can inform the shortlist while delivery remains focused.

### Initial backlog with acceptance outcomes

| ID | Priority | Suggestion | Acceptance outcome | Primary owner |
|---|---|---|---|---|
| R01 | P0 | Customer isolation/provisioning | Two independent customers cannot cross-access any private surface | Shared auth/database + app owners |
| R02 | P0 | Capacity accounting and policy | Existing edits work within policy at count/byte boundaries; no partial writes | Chambers + D1 guard owners |
| R03 | P0 | Recovery service | Verified cloud restore in isolated target; documented responsibility and objectives | Platform operations |
| R04 | P0 | Operator/customer agreement and lifecycle | Published service/support details; reviewed retention/rights procedure | Product/operator |
| R05 | P1 | Current capability matrix | Sales, home, sign-in and help agree on access, limits and connections | Portal + documentation |
| R06 | P1 | Production release/monitoring gates | Edge suite in CI; privacy-safe alerts and a named responder | Platform operations |
| R07 | P1 | Guided onboarding and import | Observed user reaches a useful first workflow without unsafe demo data | Winning app owner |
| R08 | P1 | Court-day and unresolved outcomes | Past Scheduled hearings remain actionable until reviewed/resolved | Chambers |
| R09 | P1 | Hearing readiness/order compliance | Task evidence corresponds to a specific hearing/order and confirmed date | Chambers |
| R10 | P1 | Appearance/closure checks | Clashes and unfinished work are reviewed with traceable decisions | Chambers |
| R11 | P1 | Financial follow-up | Ageing, promised dates and recoverable allocations remain consistent | Chambers / BatchFee separately |
| R12 | P1 | Concession/refund lifecycle | Effective-date previews and preserved linked financial history | BatchFee |
| R13 | P1 | Samaj onboarding/review/visibility | Member understands next action and who can see each field | DIGITAL SAMAJ |
| R14 | P1 | Tournament roles/tie policies | Delegated scoring and published tie rules are enforced server-side | Tournament |
| R15 | P1 | Creative preflight | Sample English/Hindi print/export tasks succeed with clear diagnostics | Moment Studio |
| R16 | P0/P1 | Source/content operations | P0 rights evidence for the affected monetised offer; P1 dated freshness/corrections | Fund / News / Ritual owners |
| R17 | P2 | Document versions/bundles | Future versions preserved; selected index/export works within limits | Chambers |
| R18 | P2 | One adjacent module | Repeat pilot use and demonstrable customer value | Chosen app owner |
| R19 | P1 | Account continuity | Tested staff recovery/offboarding and owner succession without bypassing identity checks | Shared auth + platform operator |

## 11. Evidence needed to call the product saleable

Engineering pass counts and attractive screenshots matter, but saleability also needs observed customer and operating evidence.

- **Workload fit:** realistic case/fee/community history, document sizes, staff concurrency and shared public traffic operate within the offered limits. Measure save latency, CPU/query budgets, conflict rate and failure behavior on the chosen deployment.
- **Confidentiality:** role revocation, restricted customer boundaries, private downloads, search and exports behave as promised. A client portal has independent identities and explicit sharing.
- **Account continuity:** a legitimate locked-out owner or staff member can follow a supported identity-checked recovery process; ownership transfer and staff departure preserve the correct access boundaries.
- **Recovery:** an operator can restore fresh data and exact files within the stated objectives; the customer has a portable exit route.
- **Usability:** real advocates/clerks or academy staff complete primary tasks on midrange Android phones and relevant desktops. Test session expiry, poor connections, retries, long Indian names, Hindi text, keyboard and assistive navigation.
- **Activation:** propose first usable matter/hearing or student/receipt within 10–15 minutes during observation. This is a target to measure, not a result already achieved.
- **Retention:** propose at least 3 of 5 pilot organisations still using the main workflow weekly after four weeks. Use this as a learning threshold, not a statistically established success rate.
- **Value and willingness to pay:** customers can describe the recurring problem solved, use the product on their own and accept a concrete paid continuation offer.
- **Support economics:** onboarding time, requests per customer, resolution time and direct costs are recorded; recurring revenue covers the service provided.
- **Honest marketing:** no invented customers/testimonials, court connections, delivered messages, certified calendar dates, verified certificates, payment receipts or guaranteed uptime.

Measure aggregate product events such as first workflow completed, return use and export success without collecting confidential names, document text or unnecessary personal identifiers. Separate app metrics: hearing-outcome resolution for Chambers; aged dues/follow-up for BatchFee; approved family/claim progress for Samaj; completed/published events for Tournament; successful exports for Studio. Raw page views across unrelated apps are not a sufficient product metric.

## 12. External benchmarks and what they imply

These official pages provide feature context. Their marketing claims were not independently audited, and their pricing/features do not establish local willingness to pay.

| Reference | Relevant observation | Implication for this platform |
|---|---|---|
| [Clio practice features](https://www.clio.com/features/) and [client portal](https://www.clio.com/features/legal-client-portal-software/) | Intake, calendar, documents, billing and client collaboration form a connected practice workflow | Differentiate through a simpler Indian chamber's daily workflow; a case list alone is not a complete offer |
| [Legodesk](https://legodesk.com/) | Current positioning concentrates on legal collections/recovery workflows | Avoid treating every legal product as the same buyer; define the small-chamber niche explicitly |
| [Teachmint fee management](https://www.teachmint.com/en-us/fee-management) | Fee structures, discounts, collection options and pending-dues visibility are part of the education comparison set | Prioritise policy and collection depth in BatchFee; do not attempt a full ERP immediately |
| [Challonge pricing/features](https://help.challonge.com/pricing) | Free tournament administration competes with paid branding/support and registration capabilities | Charge for a useful organiser outcome and service, rather than bracket generation alone |
| [Canva Brand Kits](https://www.canva.com/help/brand-kit/) | Reusable brand assets are an established creative-workflow capability | Studio needs institution reuse, output confidence and workflow value rather than competing on template quantity |
| [Official eCourts services](https://ecommitteesci.gov.in/service/ecourts-services-portal/) | Official services expose case status, cause lists, orders and judgments | Useful official links/manual tracking already have value; automatic access rights and sync must be separately verified |
| [Cloudflare Workers](https://developers.cloudflare.com/workers/platform/limits/) and [D1 limits](https://developers.cloudflare.com/d1/platform/limits/) | Free resources have explicit quotas; D1 also offers provider recovery functionality | Distinguish provider capabilities, application caps and the actual operated customer service |

## 13. Review-session implementation and verification status

| Item | Status in this session |
|---|---|
| Full-platform source/document product review | Completed |
| Fresh local rendered review | 19 page states / 152 width-theme checks; no overflow or page errors |
| Mobile screenshots | Home, sign-in, Studio and Chambers reviewed |
| Capacity issue | Reproduced in isolated in-memory SQLite using actual source SQL; native D1 verification pending |
| Official external references | Checked; linked alongside relevant findings |
| Complete API/E2E/edge regression rerun | Not performed for this documentation-only deliverable; recorded prior results are labelled as such |
| New application features or fixes | Not implemented; all roadmap items remain suggestions |
| Production/live authenticated workflows | Not performed; no production data or account changes |
| Repository changes | This report only; existing untracked runtime data was left untouched |
| Functionality ledger | Read and used as evidence; left unchanged under the user's explicit review-only instruction |

Browser evidence was retained in an isolated temporary review directory outside the repository. It is a local review artifact, not a production acceptance certificate. This report preserves the distinction between working code, recorded verification, new observations and proposed product work.
