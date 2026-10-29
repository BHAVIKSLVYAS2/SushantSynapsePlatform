# Pandit booking app plan

Status: full target scope, 2026-10-29 (Asia/Kolkata). The first managed pilot is
implemented and locally verified; see `PANDIT_BOOKING_PROGRESS.md` for actual
completion, evidence and remaining work. The restricted pilot is deployed with
additive migration 0009; public onboarding remains gated. No external delivery
integration has been performed. Payments are excluded.

## Product and operating model

Build a mobile-first managed Pandit booking service within Curio. Start with one
operating organisation and administrator-approved Pandits. Keep organisation
ownership explicit so additional operators can be isolated later. Public visitors
can discover published services and profiles; sign-in is required to request a
booking. Customer and Pandit access must be designed explicitly: existing platform
membership or a Chambers Client assignment must never implicitly grant it.

Proposed app ID `pandit-booking`, route `/pandit-booking`, code under
`apps/pandit-booking/`. Reuse shared authentication, themes, languages, navigation
and app access policy where suitable. Keep it unavailable in the catalogue until
implemented and verified. No automatic activation or assignment of existing users.

The first release includes all core non-payment operations. External delivery,
maps and identity-verification services require their own integration and evidence.
No checkout, payment collection, card/UPI data, refunds, payouts or settlement.
An indicative service fee can be displayed and an agreed quote recorded, but this
must never imply a payment has been received.

## Roles and access

| Role | Permitted scope |
| --- | --- |
| Visitor | Published profile/service fields, approximate service areas and requestable availability |
| Customer | Own requests, conversations, preparations, cancellations and eligible reviews |
| Pandit | Own profile draft, availability, and bookings explicitly assigned to that Pandit |
| Dispatcher | Organisation booking operations and assignments; no identity-document access by default |
| Verification reviewer | Private verification queue and decisions; no blanket booking access |
| Organisation administrator | Own organisation configuration, role management and escalated operations |
| Platform Super Admin | Platform governance; no automatic access to customer addresses or conversations |

Authorisation is server-side on every request, file download, search, export and
background job. Customer ownership and Pandit assignment are additional checks
inside the organisation boundary. Privileged support access, if implemented,
requires a reason, narrow scope, expiry and audit history.

## Complete non-payment workflows

1. **Discover:** search by ceremony, city/area, language, date, service mode and
   tradition where voluntarily supplied. Show descriptions, duration, preparation,
   samagri inclusions, travel limits, price basis and cancellation terms. Public
   availability shows requestable windows, never another customer's event details.
2. **Pandit onboarding:** invitation/application, contact verification, experience,
   languages, service area, offerings, availability and profile photo. Reviewer
   approves publication. Badge wording states exactly what was checked; contact
   verification is not a background check or proof of expertise. Profile edits to
   reviewed fields require renewed approval. Suspension immediately blocks new
   requests and triggers review of upcoming bookings.
3. **Request:** ceremony, preferred date/time, location area, attendees, language,
   optional instructions and preparation needs. Collect the exact address only
   when required for the service. Review disclosures and cancellation terms before
   submitting. Offer an accessible manual address entry without requiring GPS.
4. **Confirm:** dispatcher assigns a suitable Pandit or Pandit accepts an offered
   request. Confirmation records the accepted schedule, duration/travel buffer,
   agreed scope, quote and version of terms. A submitted request is not confirmed.
5. **Prepare and communicate:** booking timeline, samagri checklist, responsibilities,
   in-app messages, and in-app reminders. Reveal necessary contact/address details
   to the assigned Pandit only after confirmation. Exclude family, birth and identity
   details from notification previews, URLs, analytics and routine logs.
6. **Change or cancel:** explicit reschedule proposal accepted by affected parties,
   cancellation reason, policy display and atomic calendar release. Preserve the
   current confirmed booking until a reschedule succeeds. Replacement Pandits need
   customer agreement; reassignment revokes the previous Pandit's private access.
7. **Complete:** completion confirmation, customer dispute/no-show reporting,
   support case, and one review per completed booking. Moderate abusive/private
   content. Publish neither addresses nor unreviewed allegations. Keep review
   eligibility and publication separate from a provider's approval status.
8. **Operate:** booking calendar, availability exceptions, publication queue,
   complaints, blocks, service catalogue, bounded reports, audited exports and
   retention tools. Provide customer/Pandit account recovery and session revocation.

Use English, Hindi and Gujarati through the shared language system. Preserve user
content as entered. Support light/dark/system themes, keyboard use and small phones.
Reuse Ritual Assist content only through an explicit content contract; do not
automatically share private inputs with Ritual Assist or Ritvayam. No birth data,
gotra, caste, government ID or family details are mandatory booking fields.

## Booking integrity

Persist an explicit state machine: Requested -> Offered -> Confirmed -> Completed,
with Declined, Expired, Cancelled and NoShow outcomes. Define who can make each
transition; complaint status is a separate workflow. Offers expire and do not imply
confirmation. Do not mark a ceremony completed solely because its time has passed.

The server checks interval overlap, travel/preparation buffers, availability,
assignment eligibility and current booking revision within one atomic operation.
Two concurrent confirmations for the same Pandit/time must yield one success.
Use retry-safe request keys and optimistic revisions for booking changes. Confirm,
reschedule, cancellation, assignment, audit and notification-outbox records commit
together. Test the actual D1 transaction/batch strategy before relying on it.

Store instants in UTC with the event's IANA timezone; display IST by default for
Indian events. Validate dates, durations and bounded future booking windows.
Scheduled jobs recheck current state and deduplicate reminders; cancelled or moved
events must not send obsolete messages.

## Security design and release requirements

| Threat | Required controls and verification |
| --- | --- |
| Cross-account or organisation data access | Session-derived actor, trusted organisation resolution, ownership/assignment predicates, allowlisted response fields; negative tests across every private resource and export |
| Account takeover | Reuse reviewed password/session handling; secure HttpOnly cookies, session rotation/revocation, bounded login/recovery attempts, generic recovery responses; require verified MFA for privileged production access |
| Address/contact scraping | Public/private projections, bounded pagination, edge and application rate limits, no public contact/address fields, no bulk customer export for Pandits |
| Fake profiles and harassment | Manual approval, precise verification labels, report/block flows, suspension and escalation; no claim of guaranteed physical safety |
| Booking spam and resource exhaustion | Verified customer contact before requests, per-account and abuse-source quotas, bounded bodies/search/ranges, duplicate-request protection and limits on pending requests |
| Forged or conflicting writes | Same-origin/CSRF controls, strict input schemas, parameterised SQL, server-owned roles/state/quote, revision checks and atomic overlap guards |
| Script injection and private caching | Escaped plain text, restrictive CSP, no arbitrary rich HTML, no-store private responses; no private API caching by service workers or shared caches |
| Malicious files | Initially allow only bounded, validated profile images; decode/re-encode and strip metadata. Keep identity-document uploads and message attachments disabled until private storage, malware handling and access tests exist |
| Staff misuse | Least privilege, reasons and step-up checks for sensitive operations, separate verification permissions, audited reads of sensitive verification material and audited exports |
| Leaks through integrations | No ads/third-party trackers on private booking/account pages; minimal notification payloads, secrets held server-side, verified/signed and replay-protected provider callbacks when connected |
| Data loss | Additive migrations, organisation-scoped recovery coverage, encrypted restricted backup storage and a successful isolated restore drill before production writes |

MFA, customer verification and account recovery need a capability assessment against
the current shared authentication implementation; this plan does not assert they
already exist. Do not build an insecure app-specific bypass while those are pending.
Phone/email verification requires a real provider or a documented restricted pilot
process; a development code or mock transport must never appear as live verification.

Collect the minimum personal data and publish clear purpose, access and retention
notices. Define retention separately for expired requests, bookings, conversations,
verification evidence, complaints, audits and backups before launch. Explain any
retention exception during deletion requests. Mask contact data in ordinary admin
lists. Application encryption, if required for addresses/evidence, needs a separate
key, rotation and recovery design; platform storage encryption alone is insufficient
protection from an authorised but compromised application account.

## Storage and platform integration

App-owned relational entities: services, profile drafts/published projections,
provider-service mappings, service areas, weekly availability, exceptions,
verification decisions, bookings, booking participants, schedule reservations,
booking events, preparation items, messages, notification outbox, reviews,
moderation reports and access grants. Use existing shared user identities rather
than duplicating password storage. Separate private addresses/contact details from
public profile queries and avoid cascading deletion of booking/audit evidence.

Use additive, app-owned schema contributions following platform conventions, with
shared schema composition and versioned D1 migrations. Preserve the existing
`apps/advocate/database/schema.sql`, `packages/database/schema.sql`, SQLite records,
document blobs and legacy migration source. Production targets Workers/D1; default
Node/native SQLite remains separately supported and tested where enabled. Compose
Node adapters through `server/index.js`; do not extend the compatibility launcher.
Include all new private entities in scoped recovery and isolation review.

## Delivery sequence and acceptance gates

1. **Foundation:** settle operator/customer model and cancellation rules; map current
   auth/MFA/recovery capabilities; threat model, data classification, permission
   matrix, schema and API contracts. No public booking writes yet.
2. **Secure core:** isolated SQLite and real local D1 repositories, role checks,
   booking state machine, concurrent scheduling, audit/outbox and recovery. Negative
   security tests precede UI exposure.
3. **Full app:** discovery, onboarding/review, customer booking, Pandit dashboard,
   dispatcher/admin screens, messages, preparation, changes, completion, complaints
   and reviews. Use in-app notifications until external delivery is verified.
4. **Hardening:** account abuse, recovery, attachment restrictions, export privacy,
   session revocation, retention jobs, accessibility and mobile/theme/language
   tests. Review dependencies and secrets; resolve critical/high findings before
   launch. Perform an independent security review of identity and private booking
   access before a broad public release.
5. **Restricted pilot and release:** approved Pandits and invited customers first.
   Verify restore, monitoring and incident/suspension procedures. Review additive
   migration and rollback compatibility, then deploy with existing variables and
   bindings preserved. No legacy mapping/bootstrap rerun. Record live evidence
   separately from local checks; broaden access after pilot issues are resolved.

Test only with isolated temporary DATA_DIR values and disposable D1 fixtures.
Cover visitor/customer/Pandit/staff permissions, cross-org and same-org cross-user
attacks, revoked assignments/sessions, suspended providers/licences, simultaneous
confirmation/rescheduling, retry/expiry, private field projections, malicious input,
rate limits and notification deduplication. Browser checks cover full journeys,
320px upward, light/dark/system, supported languages and stale-response clearing.
Run the appropriate API and Playwright suites and document actual results in the
functionality ledger. No tests have been run for this documentation-only plan.

## Decisions to settle during implementation

Recommended starting model: one managed organisation, invite/approve Pandits,
signed-in customers, request-and-accept booking, in-app communication and no message
attachments. Decide whether customers later browse multiple operating organisations,
whether booking is by named Pandit or dispatcher allocation, which initial cities
are served, who performs verification, and which external delivery channel to fund.
These choices affect onboarding, privacy and operations; they do not justify
weakening access controls or describing unconnected services as available.
