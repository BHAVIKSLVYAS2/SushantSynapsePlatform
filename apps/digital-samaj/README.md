# DIGITAL SAMAJ

Integrated family registry at `/digital-samaj`, using the existing Node server, shared account sessions and `data/chambers.sqlite`. The user selected the existing platform stack instead of the original Next.js/.NET/PostgreSQL request. No additional runtime dependency or separate database is required.

## Start and account access

Run `npm.cmd start` from the repository root. Open `/digital-samaj` or its homepage sign-in card. The platform owner creates a Samaj; this creates an explicit SUPER_ADMIN app grant. Other platform owners do **not** automatically receive community permissions.

1. In platform Team access, create or select an account and grant DIGITAL SAMAJ access.
2. In DIGITAL SAMAJ Administration, grant a role and scope to that account.
3. Add a second Samaj administrator or area coordinator for independent verification. Requesters cannot approve their own submissions or profile claims.
4. Register a family. Drafts autosave in SQLite and reopen from the same account. Submission atomically creates the family, people, memberships, relationship links, photo and consent record.
5. Review submissions before they appear to directory-only readers. Claim an existing verified person to enable messaging; a person record alone is never a chat account.

Roles are permission bundles: SUPER_ADMIN, SAMAJ_ADMIN, AREA_COORDINATOR, FAMILY_ADMIN, FAMILY_MEMBER, VERIFIED_MEMBER and GUEST. Business handlers enforce permission and scope rather than role names. Platform ownership is checked only for community bootstrap. Geographic scope values use `State`, `State|District` or `State|District|Village`; FAMILY uses a family UUID, and SELF uses an approved account/person link.

## Implemented workflows

- Person-centred registry with independent human-readable member/family codes; multiple birth/marital/guardian memberships; living and deceased ancestors; canonical parent and symmetric spouse/sibling links; cycle rejection and no deletion API.
- Five-section registration with SQLite autosave/resume, head/contact details, members and ancestors in one list, private defaults with individual visibility overrides, and combined review/consent. Each new person has their own optional photo beside their details, with preview, change and remove. Photos retain the whole image and compress locally (registration: up to 640px and 120 KB per person). Existing profiles are selected through authorized name/code search; their details, photos and privacy remain unchanged. Relationships can point to the head or another person in the registration, allowing multiple generations without treating every ancestor as the head's parent. Removing a member clears relationships pointing to them rather than silently assigning a different relative. Legacy ten-step drafts map to the new sections without losing their fields or stored group-photo data. No group-photo selection is offered.
- Person profiles show photos alongside family member cards and offer preview-before-save replacement or removal. Removal detaches the current photo with permission/revision checks and retains its original SQLite blob. Optional profile details and privacy settings use expandable sections; linking family members, changing heads and adding relationships use authorized name/code search. Family group-photo controls are removed. PNG/JPEG input is limited to 8 MB and 24 megapixels; full profile uploads compress to at most 1600px and 2 MB. Draft JSON is bounded to 7.8 MB (8 MB request limit) to support the head plus 40 member photos; other app requests retain their existing bounds.
- Member cards show compact photo/name/relationship summaries and expand one editor at a time. Draft actions prevent overlapping edits while saving, and delayed API responses cannot replace a newer section. Photos must be added before submission or after review: pending/archived profiles reject photo replacement/removal so verification revisions remain valid. Switching language keeps current consent checked without persisting consent in the draft.
- Revision-checked edits, independent verification, correction/rejection, withdrawal of own pending reviews, and approval requests for verified names, DOB, gotra and family/relationship associations. Private fields are omitted from reviewer projections; changing a private DOB requires making it visible to the reviewer first.
- Directory search, family/member codes, gotra, village/city/district/state, occupation, qualification, marital status and age filters. Filtering happens **after** privacy projection. Age is calculated from DOB, never stored. Unpublished profiles are limited to editors in scope.
- Family/person profiles; Vanshavali with generational columns, explicit relationship table, profile navigation, zoom, drag/scroll pan and relative collapse. Tree traversal is bounded to eight hops and 250 people; no unrestricted graph dump.
- Authorized English/Hindi/bilingual print layouts with permitted relatives and photos. Use the browser's Print / Save PDF action. Devanagari uses installed system fonts; no external font download or paid PDF service.
- Private photos as SQLite blobs with authenticated, privacy-checked downloads. PNG/JPEG uploads are bounded; chat also accepts PDF as download-only attachments.
- Duplicate match scores, explicit ignore and explicit merge. No automatic merge. Merges archive the source and preserve its rows, files, relationships and audit history, copy associations to the target, transfer one account claim and refuse conflicting parents, ancestry cycles, dual claims or pending reviews. Target profile values win; comparison happens before merging.
- CSV and XLSX first-sheet import: map headings, validate, review duplicates, then commit once. Up to 500 rows, 60 columns and 2 MB per upload; bounded ZIP inflation, no macros/formula evaluation or filesystem extraction. Potential duplicates are skipped for manual comparison; imports do not overwrite existing people. Excel date serials are converted during mapping. Imported records start as drafts.
- Scoped dashboard totals and aggregates. Groups below five are suppressed; age aggregates use only DOB values visible to the requester. Gotra counts families; other demographic groups count people.
- One-to-one messaging requests with contact reasons, recipient accept/decline, read/unread, mute, block/unblock, report, attachments, messaging preferences and administrator announcements. Both accounts need app access, a chat grant and a claimed verified living person. Conversation access is participant-only, including for administrators. Moderation exposes only the individual reported message, not the conversation.
- App-specific append-only audit, versioned consent and additive migrations registered in full SQL backup/restore.

## Privacy and review boundaries

Sensitive fields default to PRIVATE. FAMILY, SAMAJ, ADMIN and PUBLIC remain subject to field permission and resource scope. PRIVATE is available to the linked person; authorized creators can manage unverified submissions, and linked family editors can manage their own family's private fields. Administrative role alone does not expose PRIVATE fields. PUBLIC is a visibility level within this authenticated application; no anonymous directory endpoint is provided.

Names, demographics, profession and native location are ordinary directory fields. Contact details, DOB, birth information, exact address/PIN, photo, blood group and achievements have individual privacy settings. Account emails and phone numbers are never used as chat identifiers in API projections.

The platform owner can download the full SQL database, and the machine/database administrator can inspect it. Application privacy is not encryption against those operators. Chambers JSON backups remain Chambers-only; use **full SQL export** to back up DIGITAL SAMAJ. Import SQL into a new database, not the live database.

## API and verification

Authenticated OpenAPI 3.1 metadata: `/api/digital-samaj/openapi.json`. Business endpoints are under `/api/digital-samaj/{samajId}`. See the app backend modules and tests for request bodies. Shared sessions use HttpOnly/SameSite cookies; the composed server enforces host/origin checks and CSP. App writes are limited to 120 per minute per account; chat adds persistent limits of ten requests/day and twenty messages/minute.

```powershell
node --test tests/digital-samaj.test.js
npx.cmd playwright test apps/digital-samaj/tests
npm.cmd test
```

Tests create isolated temporary SQLite workspaces. `node apps/digital-samaj/seed-demo.js` creates a **new temporary** fictional workspace with two random-password accounts and verified sample ancestry. It prints the temporary path and launch command and never opens or resets the live database.

## Operational limits

The MVP is deployed at https://apps.sushantsynapse.com/digital-samaj with shared login and the original SQLite data directory. Release checks cover public assets, anonymous API protection, responsive themes and English/Hindi sign-in. This is not an independent security audit. Backup scheduling and hosted availability remain subject to the platform deployment process; authenticated workflows require the Windows backend and tunnel to remain running.

Claims currently use administrator approval with supplied evidence. SMS/email OTP providers and automated outbound delivery are not connected. Chat refresh is manual; there are no push notifications or real-time transport. The mute preference is saved, but there is no notification-delivery service. File validation does not include antivirus scanning. Directory matching currently scans scoped records in memory before pagination; large deployments need measured indexing/query optimization. XLSX supports conventional `sheet1.xml`, not every Excel workbook layout, and legacy `.xls` is not supported. Imports create people only; they do not infer family relationships from ambiguous spreadsheet columns.

Matrimonial, business directory, donor matching, scholarships, events, birthdays, anniversaries, obituary publishing and advanced genealogy remain outside this MVP.
