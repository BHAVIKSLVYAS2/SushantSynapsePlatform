# Shared accounts and email OTP MFA

Status: agreed direction; implementation has not started.
Updated: 8 November 2026 (Asia/Kolkata).

## Current sequence

1. Fix the Moment Studio issues identified by the user before authentication work.
2. Implement and verify the shared account/MFA foundation for the main platform
   and existing workspaces.
3. Connect personal app storage later, one app at a time: Hisabio, Timetable Lite,
   then Moment Studio. No free-app authentication or storage changes in phase 2.

Google sign-in is out of the current scope. Its unfinished implementation was
removed without deployment or database migration.

## Agreed account model

One person has one platform account, with email and password followed by an
email-delivered one-time code during sign-in. Keep existing identities, account
IDs, records, app assignments, organisation memberships, roles and licences.
Do not create a parallel identity system just for public apps.

Account identity, personal app records, workspace membership and app permissions
are distinct boundaries. Signing in or registering never grants workspace access.
Joining an organisation requires an invitation or authorised assignment. A person
can belong to multiple organisations with different roles; leaving one must not
remove their identity or unrelated records.

Production remains Workers/D1 with organisation-scoped APIs. Default Node mode
remains separate. Do not repeat bootstrap, legacy mapping or production cutover.
Read ORGANISATION_LICENSING_PLAN.md, ORGANISATION_PRODUCTION_CUTOVER.md,
ARCHITECTURE.md and FUNCTIONALITY_LEDGER.md before implementation.

## Workspace-first implementation

- Review current sign-in, invitations, activation, profile/email changes,
  password changes, recovery, session revocation and Super Admin access together.
- Use email + password, then email OTP. Grant a fully authenticated session only
  after both steps succeed. A pending MFA challenge grants no private API access.
- Verify email ownership during account activation. Preserve the existing managed
  invitation flow; public self-registration is a separate decision, not an
  automatic consequence of this plan.
- Bind each short-lived, single-use challenge to its account and purpose. Store
  protected verification material rather than plaintext codes; enforce expiry,
  attempt limits, resend cooldowns and rate limits. Avoid account enumeration.
- Define password reset and email change flows so neither can silently bypass
  MFA. Revoke affected sessions as appropriate. Never link accounts merely because
  an email string matches an unverified address.
- Select and configure an email delivery provider before enabling production MFA.
  Do not represent messages as sent without provider acceptance; verify receipt
  during rollout. Keep credentials out of source, logs and documentation.
- Define safe existing-user enrolment, administrator recovery and rollout controls
  before enforcing MFA. Avoid locking out staff or the Super Admin. No permanent
  password-only bypass should be introduced as a recovery shortcut.
- Review actual protections and limitations of email-based MFA when implementing;
  do not describe it as phishing-resistant or equivalent to an authenticator.

Exact code lifetime, session lifetime, resend policy, provider, recovery method
and rollout sequence remain implementation decisions to review with evidence.

## Deferred personal apps

After the workspace foundation is verified, reuse the same identity and session
model for account-owned records. Add app-owned validated APIs and additive schema
changes; never store personal business records in shared preferences.

1. Hisabio: account-owned services, attendance, bills and payments.
2. Timetable Lite: account-owned setups and schedules.
3. Moment Studio: explicitly saved branding and editable drafts; define media
   storage and limits before introducing uploads.

Keep public tools available to try. Account saving is explicit. Existing browser
records require a preview/confirmation before import, remain preserved until the
server save is verified, and must not overwrite existing account records silently.
Define conflict handling, offline behaviour, export and deletion for each app.
Do not mix personal records with organisation records or infer workspace access.

## Verification and release gates

Use isolated temporary DATA_DIR values and isolated D1 fixtures. Cover correct,
incorrect, expired, exhausted, resent and replayed codes; mail failure; recovery;
session expiry/revocation; CSRF; user enumeration; and simultaneous requests.
Verify that pending challenges and ordinary personal accounts cannot read private
workspace data, and that existing membership/role/licence enforcement is preserved.

Exercise existing-user, invitation and Super Admin flows in mobile Chrome and
supported themes/languages. Test default Node and production D1 paths separately.
Prepare an additive migration and recoverable rollout without resetting accounts,
records or document blobs. Update the functionality ledger with actual verification
and deployment status. No account/MFA deployment is recorded by this planning file.
