# Free cloud deployment preparation

The user selected free limits with reduced features on 2026-10-11, then authorized D1 document changes, commit and deployment. This profile is prepared locally; **it is not deployed**. Free-plan confirmation and Access setup remain pending. The existing production frontend and Node/SQL Server workspace remain active.

The target is Workers **Free**, D1 **Free**, static assets, and Cloudflare Access **Free** email-code sign-in. No R2 bucket, Workers Paid upgrade, paid login service, paid logs, or payment enrollment is performed by the code. Account plans are shared with other applications: deploying this configuration to an already-paid account does not make its usage free.

## Reviewable changes

- Chambers clients, matters, hearings, tasks, fees and payments use D1. Existing roles, app access, account IDs and preferences remain. Payment checks and hearing outcome + next date remain atomic.
- Login changes from passwords to an approved email code. The Worker verifies Access JWT signature, issuer, audience, time and token type, then loads the current active account and role from D1. Headers claiming an email or role are not trusted. Original password hashes remain preserved in recovery data.
- Private Chambers documents are stored in D1 BLOBs, limited to 1,000,000 bytes each and 100,000,000 bytes total. SQL triggers enforce aggregate capacity inside the same transaction as file metadata, record and audit writes. Downloads verify byte length and SHA-256 and require current app access. Existing larger files and Samaj files remain in the full local recovery bundle and original databases; the import report lists omissions.
- DIGITAL SAMAJ, BatchFee and Tournament workspaces, private Fund workflows, saved News generation and the heavy ritual calendar API are disabled. Their source records remain preserved. Public static tools, Fund comparison/source handlers and temporary News remain available. Arena requires its own secret before shared votes work.
- The initial workspace limit is 250 Chambers records, 256 KiB of aggregate record JSON, 8 KiB per record, and 25 accounts. SQL triggers enforce capacity inside every atomic write, including a new hearing. These are deliberately conservative application limits, distinct from Cloudflare's account quotas.
- Each private request may issue at most 45 D1 statements, below the Free limit of 50. An oversized batch fails before execution. The configured maintenance switch stops APIs. Workers Free's 10 ms CPU cap may still reject some operations: local emulation does not prove production CPU suitability.

## Cost and payment

Expected incremental hosting/API/database/login cost: **US$0 per month while these services remain on their Free plans**. Domain renewal and other account subscriptions are separate.

Workers Free permits 100,000 dynamic requests per day and 10 ms CPU per invocation; requests fail at its limits. D1 Free includes 5 million rows read/day, 100,000 rows written/day and 5 GB total account storage; queries fail when daily allowances are exhausted. Static assets can remain available when APIs stop. Free limits apply across the account, not just this app.

There is nothing to pay for Workers Free or D1 Free. Cloudflare's Zero Trust onboarding documentation says **payment details are still required for the Free plan, but it will not charge for that plan**. Enter any required details only in Cloudflare's own dashboard. Do not choose a paid Access plan or enable usage-based extras. A payment method on file may still pay other existing subscriptions; those have not been audited or cancelled.

The rejected complete backend would need Workers Paid (US$5/month minimum), with D1/R2 usage beyond included allowances billed separately. R2's 10 GB-month free allowance is not a storage hard stop. Paid billing automatically charges the primary payment method. Rate limits, CPU caps and billing alerts do not guarantee a monthly monetary cap.

Sources checked 2026-10-11: [Workers pricing](https://developers.cloudflare.com/workers/platform/pricing/), [Workers limits](https://developers.cloudflare.com/workers/platform/limits/), [D1 pricing](https://developers.cloudflare.com/d1/platform/pricing/), [D1 quota errors](https://developers.cloudflare.com/d1/reference/faq/), [Zero Trust onboarding](https://developers.cloudflare.com/learning-paths/clientless-access/initial-setup/create-zero-trust-org/), [Zero Trust plans](https://www.cloudflare.com/plans/zero-trust-services/), [R2 pricing](https://developers.cloudflare.com/r2/pricing/), [automatic billing](https://developers.cloudflare.com/billing/understand/how-billing-works/).

## Remaining deployment steps

1. Owner confirms **Workers Free** and **Zero Trust Free** in the dashboard. Current OAuth credentials authenticate successfully but cannot read subscriptions or configure Access. R2 is not enabled. Do not upgrade or cancel other account services automatically.
2. Select a separate staging hostname first; do not replace the production route before acceptance. The user's latest commit/deploy instruction authorizes this work.
3. Configure Access email one-time PIN. Create a self-hosted Access application protecting staging `/access-login` and `/signin` paths. Allow only the active workspace accounts' exact email addresses, with a short session duration. Do not use an unrestricted “all email” policy. Copy the application audience into `ACCESS_AUD` and the exact `https://<team>.cloudflareaccess.com` issuer into `ACCESS_TEAM_DOMAIN` in `wrangler.free.jsonc`. Unprotected APIs independently verify the signed cookie/JWT and enforce current database access. Protect the login path on every hostname that can serve it.
4. Create a **new** staging D1 database, set its UUID and exact HTTPS `PUBLIC_ORIGIN`, then apply `d1-free-migrations`. There are no R2 bindings. Use the free configuration, not `wrangler.fullstack.jsonc`.
5. Export the authoritative SQL Server source using the existing full backup command. Run `node infrastructure/cloudflare/free-import.cjs --bundle <full-bundle> --output <new-directory>`. This validates the full backup and produces D1-only SQL plus an omission report without changing source data. It imports eligible Chambers document bytes, using statements below D1's 100 KB SQL limit. It refuses excess record/account/aggregate document capacity rather than truncating records. Keep the full bundle securely for omitted original files and disabled apps.
6. Import the generated SQL only into that fresh, unbound staging database. Verify row checksums/counts, account IDs, record insertion order, preferences and foreign keys before deploying. Remote import/verification remains pending; the local import checker is not evidence of a live migration.
7. Deploy the free staging Worker and verify real Access login, mobile Chambers, role revocation, payment concurrency, hearing rollback and CPU use. If valid operations exceed 10 ms, reduce work further instead of enabling Paid. Configure Arena's secret only if shared votes are enabled; preserve the production secret during an eventual cutover.
8. After acceptance, freeze old writes, take a fresh verified export, import a new production D1 target and switch the reviewed route. Retain the old database/recovery bundles. New cloud writes must be reconciled before rolling back to the old database.

## D1 document recovery

Freeze writes with maintenance mode, then export the remote D1 database using `wrangler d1 export <database> --remote --output <private-snapshot.sql>`. Run `npm.cmd run db:cloudflare:free-recovery -- --sql <private-snapshot.sql> --output <new-private-directory>`. This offline tool validates foreign keys, table checksums and exact document hashes, excludes sessions, and generates a verified restore with chunked SQL statements. Restore only into a new unbound D1 database with all free migrations applied; verify its remote export before switching bindings. Recovery files include account hashes and private records and must never be committed or published. Local verification does not establish successful remote recovery.

Local commands: `npm.cmd run build:cloudflare:free`, `npm.cmd run db:d1:free:local`, `npm.cmd run dev:cloudflare:free`, `npm.cmd run test:cloudflare`. The initial free schema is a copy of the shared initial migration; future changes need new numbered migrations in both targets where applicable. Never regenerate an applied migration.

## Current evidence

A read-only source export verified **54 tables / 328 rows, including 4 accounts and 19 Chambers records**. Its D1-only preparation fits the free caps. SQL Server returns record insertion ordinals as strings; the exporter now normalizes and validates safe integer ordinals before checksum comparison. Original SQL Server, SQLite recovery and legacy JSON remain untouched. Private evidence is in ignored `.publish/cloudflare-free-source-review.json` and `data/backups/`; do not commit or publish these bundles.

No cloud resources were created, no account upgraded, no payment method added, no records uploaded, and no live route switched in this preparation session. Final local verification is recorded in the functionality ledger. Production CPU, Access delivery and quota enforcement are still external acceptance checks.
