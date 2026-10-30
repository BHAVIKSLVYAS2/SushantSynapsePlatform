# Pandit Booking

Managed, invitation-only booking pilot at `/pandit-booking`. No payments or external
message delivery. See `docs/PANDIT_BOOKING_PROGRESS.md` for verification and limits.

Workers/D1 requires organisation mode, additive migration 0009, an active app
licence and explicit assignments. Customers use Client memberships and Customer
app assignments; staff roles are Owner, Dispatcher, Reviewer and Pandit. Shared
administration handles invitations, membership and seat limits. Super Admin alone
does not grant business access. No new public registration or OTP bypass exists.

Default Node/SQLite has an independent local workspace: existing Owner is booking
operator, explicitly app-assigned Advocate is Pandit, explicitly app-assigned Clerk
is Customer. Node organisation-preview mode and SQL Server are not supported by
this pilot. Runtime state is in `pandit_booking_workspaces` inside SQLite/D1.
The bounded aggregate commits availability, booking changes and audit together;
global D1 revisions and local SQLite version checks reject conflicting saves.
Capacity: 40 services, 100 profiles, 400 bookings, 200 concerns, 3,000 audit events,
850 KB per workspace; no silent pruning. This is a small pilot storage model,
not a high-volume marketplace database. Migrate to individual indexed entities
before increasing limits. SQLite full SQL export includes this app; Chambers JSON
backups do not. D1 recovery uses the existing restricted offline full export.

Customer requests select a named approved Pandit and published service area.
Dispatcher confirms against published windows and a one-hour buffer. Pandits see
bookings and venue/contact only after confirmation. No GPS, Pandit home address,
government IDs, birth data or attachments are collected. User-entered public bio,
service text and reviews must be checked for contact/address details by operators.
Reviews require a completed booking and separate publication approval.

Role-specific Getting started steps show actual service/profile/availability and
booking progress, without generating sample approvals or bookings. Pandits enter
availability using IST date/time slots; preparation uses task rows, responsibility
selectors and completion checkboxes. Server validation and version checks remain
authoritative, including overlaps, existing reservations and concurrent edits.

In-app messages update by conditional polling every ten seconds while the page is
visible. Unchanged checks still revalidate access and participant eligibility.
Incoming updates preserve open forms and draft messages; sending keeps the booking
open and does not clear text typed while a send is in flight. Unread indicators are
held only in this page's memory, not cross-device read receipts. Hidden/expired or
revoked views clear private content and stop polling. A conversation remains capped
at 80 messages; the UI displays usage and the capacity warning. There is no automatic
send retry. Edited checklists/availability retain their original version so incoming
updates cannot silently overwrite concurrent changes.

In-app event history and computed reminders for confirmed ceremonies within 24
hours update with the open page. There is no automated reminder scheduler,
SMS/email/WhatsApp transport or push.
Rescheduling requires opposite-party agreement and rechecks availability. There
is no automatic replacement/reassignment, public operator directory, profile photo
upload, private export UI or automatic deletion/retention job. No feature claims
identity/background verification. Pilot invitations require manual operator contact
checks; shared account MFA is not implemented here. Broad public release remains
blocked on identity/MFA, retention policy and independent security review.

The app uses platform UI/theme tokens and shell. App-owned authored interface copy
supports English, Hindi and Gujarati through the shared language preference.
Dates use localized IST display; API enums remain English protocol values.
Checklist role/state input accepts English or the translated terms. User names,
service descriptions, terms, addresses, messages and reviews remain as entered.
Language switching preserves current drafts rather than rebuilding forms.
Production operations and broad-launch gates: `docs/PANDIT_BOOKING_PRODUCTION.md`.
