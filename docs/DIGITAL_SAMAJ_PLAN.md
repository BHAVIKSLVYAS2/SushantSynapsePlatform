# DIGITAL SAMAJ implementation

Status: integrated MVP implemented and locally verified (99 platform API tests, 49 browser workflows, final twelve-test Samaj privacy regression). Commit and deployment are authorized and in progress. See `apps/digital-samaj/README.md` for implemented behavior and operational limits, and the functionality ledger for release evidence.

## Architecture

Keep app ownership under `apps/digital-samaj`. Separate registry, authorization/privacy, review/import and messaging modules. Use REST endpoints with validated commands, transactions, optimistic concurrency and explicit response projections. Preserve the existing platform, accounts, SQLite preferences and Chambers data.

The user selected option 2: the existing Node/shared-auth/SQLite platform. DIGITAL SAMAJ therefore uses plain browser JavaScript, existing CSS/theme conventions, the composed Node server and additive app-owned SQLite tables. The originally proposed Next.js/.NET/PostgreSQL service is superseded by this explicit choice.

## Data model

- Samaj has Families and Persons. UUID primary keys are independent of unique human-readable FamilyCode and MemberCode.
- PersonFamilyMembership joins Person to Family with membership type, primary flag and effective dates. Marriage adds membership; it does not remove birth membership.
- PersonRelationship links two people, including cross-family links. Store canonical directed parent/child and guardian links and ordered symmetric spouse/sibling pairs. Derive inverses; reject self-links and ancestry cycles. Preserve ended links and deceased ancestors.
- UserPersonLink links an optional login to an existing Person. A Person requires no login. Claims require verification before linking.
- Role, Permission, RolePermission and scoped UserRole grants control actions. GeographicScope and memberships establish resource scope.
- PrivacySetting controls sensitive fields independently of stored values. VerificationRequest, ChangeRequest, Consent and append-only AuditLog retain review history.
- DuplicateCandidate and ImportJob support reviewable imports and explicit merges. Photo and Document store protected binary assets and validated metadata.
- Conversation, ConversationParticipant, MessageRequest, Message, MessageAttachment, BlockedUser, MessageReport and MessagingPreference are independent of genealogy. Only eligible linked users participate.

## Permission model

Evaluate authenticated user, permission, Samaj and resource scope on the server. Scopes: ALL, STATE, DISTRICT, VILLAGE, FAMILY and SELF. Role names select default permission bundles; business handlers check permissions, never role names. Deny by default.

Combine scope authorization with PRIVATE/FAMILY/SAMAJ/ADMIN/PUBLIC field visibility. Apply identical projections to directory, tree, profile, print/export and search filters; hidden fields must not be recoverable through filtering or counts. A broad action grant is not automatic access to private fields. Guests receive only explicitly public, verified information. Suppress small aggregate groups.

Requests affecting both people/families require authority over every affected resource. Approvals cannot be self-approved. Grants cannot exceed the grantor's scope. Audit and mutation commit atomically. Review applies only if the recorded original version still matches.

## Project structure

`apps/digital-samaj/frontend`, `backend`, `database`, `tests` and an app README. Keep deployment configuration app-owned until integration is selected. No live catalogue launch before usable, verified implementation.

## Implementation sequence and acceptance

1. Foundation, migrations, auth and scoped RBAC: build; isolated database tests for login, denial, scope isolation and migration preservation.
2. Family, Person, memberships and relationships: test identity reuse, multiple memberships, inverse uniqueness, ancestry cycles and deceased retention.
3. Ten-step saved registration wizard, private photos, consent and privacy: test reload, unauthorized assets, validation and mobile accessibility.
4. Verification, change requests, audit and duplicates: test stale approvals, rejection, transactional merge and retained history.
5. Directory and profiles: test every privacy level, search leakage and pagination.
6. Vanshavali: interactive pan/zoom, expand/collapse and cross-family navigation using authorized projections.
7. Hindi/English/bilingual print/PDF, safe aggregates and CSV/Excel preview imports: test Devanagari, privacy and import rollback.
8. Samaj Connect: requests, one-to-one conversations, receipts, mute/block/report, protected attachments and announcements; test participant-only access and abuse limits.
9. Security, performance and mobile regression: verify fresh deployment, migrations, backups, responsive themes and end-to-end workflows before production readiness claims.

External delivery, hosting and provider integrations remain unconnected until separately verified. Excluded future modules remain unimplemented.
