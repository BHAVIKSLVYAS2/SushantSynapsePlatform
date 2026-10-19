# Tournament organisation setup

Tournament uses the platform account and organisation in the cloud workspace.
Default Node mode keeps its existing account-owned tournaments.

## Current setup

1. Sign in at `/account` with your existing account. Existing active members do
   not need another invitation.
2. Open **Tournament Lite** under your organisation. If more than one workspace
   is available, choose one. The organisation name remains visible above the app.
3. Create a tournament, add participants, generate fixtures and enter scores.
4. **Share tournament** publishes a viewer link. Viewers need no account or
   invitation. Names, fixtures and results are public; organiser contact and
   participant rosters remain private. **Stop sharing** withdraws publication.

## Administration

- Super Admin: `/super-admin`, select the organisation, then **Manage an app
  licence**, choose Tournament Lite, and save its dates and staff seats. Super
  Admin authority alone does not grant access to tournaments.
- Master Admin: `/admin`, select the organisation, then **App access**, choose
  Tournament Lite and an active staff member, choose Owner or Advocate, and save
  an Active assignment. Both roles currently organise tournaments within that
  organisation. Clerk and Client cannot organise tournaments.
- A current licence, active organisation, active membership and active app
  assignment are all required. An expired licence can permit reading until its
  configured read-only deadline; writes stop immediately. Public sharing stops
  when the licence expires or the organisation is suspended.

Invitations currently activate membership for a new member/account. They are
separate from an app assignment and from a public tournament link. Existing
active members can receive app access directly. Invitation and hierarchy design
is deferred at the user's request.

## Data and release boundary

`tournament_lite_ownership` binds each tournament to one organisation; the
original event rows, creator IDs, revisions and share tokens are preserved.
New cloud writes save the event and ownership in one revision-guarded D1 batch.
Unscoped private writes remain blocked. Accounts with Tournament assignments in
the same organisation share its workspace. No cross-organisation access or
implicit Super Admin business access is granted.

`infrastructure/cloudflare/tournament-cutover.cjs` prepares an offline patch from
an authorised private D1 export. It refuses ambiguous/inactive owners, existing
mapping, absent/expired source licences and capacity overflow; it reuses the
existing Chambers licence terms and restores only legacy-authorised organisers.
The patch is revision guarded and must run after migration 0006. It is a
one-time cutover, not a bootstrap or normal startup action. Offline recovery
includes the added ownership table and verifies checksums. Never publish exports
or generated patches under `.publish/`.
