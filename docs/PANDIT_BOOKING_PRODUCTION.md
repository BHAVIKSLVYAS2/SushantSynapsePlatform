# Pandit Booking production operations

This is an invitation-only managed pilot. Deploying code does not grant a licence,
create an operating organisation, assign users or publish providers.

## Release and recovery

Use `infrastructure/cloudflare/wrangler.free.production.jsonc` and preserve live
variables with `--keep-vars`. Apply only pending additive migrations; never repeat
organisation bootstrap or legacy mapping. Migration 0009 adds one workspace table.
Before migration, export production D1 into an ignored, restricted `.publish/`
path and run `free-recovery.cjs` against it. Verify the post-release export too.
Keep recovery artifacts private: they contain credentials and business records.
Do not import a recovery SQL file over a running production database.

## Operator activation

1. Super Admin grants the intended organisation a Pandit Booking licence and
   explicit staff/client seat limits through the existing administration screen.
2. Its Master Admin invites the named operators, reviewers, Pandits and customers,
   checks their contact details manually, and assigns the appropriate app roles.
   Customer assignments require Client membership and a client seat. A Chambers
   assignment or Super Admin status grants no booking access.
3. Operators publish reviewed ceremony descriptions, preparation, samagri,
   indicative price basis and cancellation terms in the languages they support.
   Interface translation does not translate service descriptions or messages.
4. A separate reviewer checks provider identity/contact through the documented
   manual pilot process, reviews public text for private information, and approves
   profiles. Publish only city/service areas, never provider home addresses.
5. Providers publish availability. Use invited pilot participants and explain that
   a request requires confirmation. There is no payment collection or external
   message delivery. Check in-app concerns and upcoming bookings daily.

## Language acceptance

Use the platform header to select English, Hindi or Gujarati. Interface labels,
status, date display and validation guidance follow that preference. Changing
language preserves draft fields; it does not translate service terms, descriptions,
names or messages. Operators must author/review those in their offered languages.
Preparation input accepts either English or translated role/state words and saves
canonical API values. Dates remain IST; changing language does not change schedules.
The restricted pilot tests cover Hindi/Gujarati requests, confirmation, messages,
preparation, error recovery, draft preservation and mobile light/dark layouts.

Getting started shows role-specific progress and links to the next available step.
Publish real service terms and review real provider submissions; the checklist
does not create demonstration bookings or mark a provider verified. Availability
uses IST start/end controls and preparation uses task rows with checkboxes.

Chat checks for updates every ten seconds while the page is visible. Unread counts
are local to the open page, without delivery/read receipts across devices. Hidden
or denied views clear drafts and private content; those drafts are not saved to
browser storage. Conversation capacity remains 80 messages and is shown in the UI.
After a concurrent-edit warning, review the latest booking before resubmitting;
no chat message or business operation is retried automatically.

## Incident handling and capacity

Suspend a provider to prevent new requests; review and contact affected upcoming
bookings through the agreed manual process. Suspension does not cancel bookings.
Revoke app assignments or sessions after an account incident. Resolve concerns
with an audit trail; avoid private customer details in free-text audit reasons.
There is no automatic replacement or external emergency notification.

Per workspace limits are 40 services, 100 profiles, 400 bookings, 200 concerns,
3,000 audit events and 850 KB. At capacity, writes fail without pruning evidence.
Plan an indexed relational migration before increasing these limits.

## Broad launch gates

Keep broad public onboarding closed until privileged MFA/identity and account
recovery review, a defined retention/deletion policy, independent security review,
operator training/contact escalation and restricted off-device recovery custody
are verified. These are operational gates, not capabilities implied by deployment.
Weekly recurring availability, replacement agreement, uploads, automated retention,
private export UI and external delivery are separate future increments.
