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

In-app event history, messages, preparation checklists and a computed reminder for
confirmed ceremonies within 24 hours provide coordination when the page refreshes;
there is no automated reminder scheduler, SMS/email/WhatsApp transport or push.
Rescheduling requires opposite-party agreement and rechecks availability. There
is no automatic replacement/reassignment, public operator directory, profile photo
upload, private export UI or automatic deletion/retention job. No feature claims
identity/background verification. Pilot invitations require manual operator contact
checks; shared account MFA is not implemented here. Broad public release remains
blocked on identity/MFA, retention policy and independent security review.

The app uses platform UI/theme tokens and shell. Initial app copy is English;
complete Hindi/Gujarati authored coverage is pending and must not be claimed.
