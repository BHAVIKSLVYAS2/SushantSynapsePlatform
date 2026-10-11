# Azure deployment recommendation — 2026-10-10

> Historical review from 2026-10-10. Statements describe that review checkpoint, not current deployment status. Production now runs the implemented apps on Cloudflare Workers Free and D1, with a separate Focus workspace. See [the functionality ledger](FUNCTIONALITY_LEDGER.md) for current implementation and verification. This document does not authorize Azure provisioning or a database replacement.

Status: structure review and cost estimate only. No Azure resources created, credentials changed, production deployment performed or runtime data accessed/modified. Existing working-tree changes are outside this review.

## Recommendation

Keep the existing Cloudflare Worker/static frontend and its D1-backed Satire Arena. Move the Windows-hosted Node origin to one Ubuntu LTS Azure VM in Central India, initially Standard_B2s (2 vCPU, 4 GiB RAM), with Docker Compose and an attached persistent managed SSD. Keep one Node instance and the existing SQLite database. Budget INR 4,600–5,100/month before tax, approximately INR 5,400–6,000 if 18% GST applies. This is a planning estimate, not an Azure billing quote.

This removes the laptop dependency without rewriting storage, app access or authentication. It does require host patching, monitoring and backup ownership. The VM is one failure domain: maintenance and host failures can interrupt private APIs. Always-on hosting is not high availability.

## Findings from the repository

- npm workspace monorepo, app ownership under apps/, shared modules under packages/, composed by server/index.js. Node >=22.13; built-in node:sqlite; no runtime npm dependencies. Existing Dockerfile uses Node 22, non-root execution and /healthz.
- Platform home is / and Chambers is /advocate. Shared accounts, sessions, preferences and role/app-access enforcement must remain intact. This is one organisation, not tenant-isolated SaaS.
- packages/database/index.js opens DATA_DIR/chambers.sqlite with WAL and immediate transactions. Documents/photos and business data share SQLite; the whole platform needs consistent recovery, not only Chambers JSON backup.
- infrastructure/compose.yaml already supplies restart policies, a data volume, production PUBLIC_ORIGIN, SETUP_TOKEN and optional Caddy HTTPS. For Azure, explicitly bind /app/data to a directory on the attached managed disk; do not accidentally leave the default named volume on the OS disk.
- Cloudflare worker.mjs handles static pages and some public APIs independently, forwards remaining APIs/health to the same-host origin and keeps preview disconnected. Origin migration must preserve this routing, request host/origin and secure cookies.
- Satire Arena is an app-owned Cloudflare edge handler with a separate D1 database. The Node Docker image alone cannot replace it. A complete Azure-only migration would need additional implementation and data migration.
- Ritual calendar calculations run in Node worker threads. Public traffic can therefore consume origin CPU even though many other public tools run in the browser or at the edge.
- Existing daily JSON snapshots are Chambers-focused, unencrypted and have no automatic retention cleanup. They are insufficient as a sole full-platform off-device backup.

## Monthly estimate

Assumptions: Central India; Linux pay-as-you-go; 730 hours; existing domain/Cloudflare plan unchanged; 32 GiB OS disk plus 64 GiB data disk; 50 GiB total retained backup storage; light initial traffic. Actual database size, growth and load have not been measured. No free credits or reservation discounts included.

| Resource | Price basis | INR/month |
|---|---|---:|
| Standard_B2s | 4.3003/hour × 730 | 3,139 |
| OS SSD, E4 LRS, 32 GiB | 253.412/month | 253 |
| Data SSD, E6 LRS, 64 GiB | 506.824/month | 507 |
| Standard public IPv4 | 0.4799/hour × 730 | 350 |
| Blob Hot LRS backups, 50 GiB | 1.9198/GiB-month | 96 |
| Fixed subtotal | Rounded | 4,345 |
| Disk/blob transactions, bounded logs/alerts and contingency | Planning allowance, not a retrieved SKU price | 250–750 |
| Total before tax | Rounded | 4,600–5,100 |
| Total if 18% GST applies | Illustrative tax treatment | 5,400–6,000 |

The public IP is included for predictable outbound connectivity. A Cloudflare Tunnel does not eliminate Azure outbound-networking requirements; verify the chosen networking design when provisioning. No NAT Gateway, Bastion, Front Door, load balancer, paid container registry, Defender plan or Azure Backup protected-instance charge is included. Backup estimate assumes an implemented scheduled consistent SQLite backup uploaded to Blob, not Azure Backup VM protection. Domain renewal, existing Cloudflare charges, staff time and extra provider subscriptions are excluded.

Azure currently lists the first 100 GB/month internet egress free; account-wide usage and relevant transfer meters must be checked. Higher traffic is outside this estimate. Blob retention is aggregate retained size, not live database size: 30 full daily copies of a 5 GiB database would already exceed 50 GiB. Size retention from measured data.

Other VM sizes with the same storage/network allowances:

| Option | Approximate monthly cost before tax | Assessment |
|---|---:|---|
| B1ms, 1 vCPU / 2 GiB | 3,000–3,500 | Budget pilot; less headroom for calendar calculation, password hashing and bursts |
| B2s, 2 vCPU / 4 GiB | 4,600–5,100 | Recommended initial size; validate representative load before final selection |
| B2ms, 2 vCPU / 8 GiB | 7,700–8,200 | More memory if measured pressure warrants it |

B-series CPUs use credits; these sizes do not promise sustained full-core throughput. Monitor credits, RAM, API latency, disk latency and worker load. If sustained compute rises, price a non-burstable D-series VM rather than assuming a RAM upgrade solves CPU pressure. Confirm SKU quota/availability in the subscription before provisioning.

## Azure service alternatives

| Service | Fit for current implementation |
|---|---|
| Azure VM + managed disk | Best immediate fit: preserves local filesystem SQLite and existing container |
| Linux App Service | Requires a redesigned durable database arrangement; Azure advises against mounted storage for SQLite/file-locking workloads |
| Container Apps | Ephemeral container storage is unsuitable for the live database; Azure Files does not resolve the WAL constraint. Reassess after moving business persistence to a managed database |
| Static Web Apps | Can host public assets, but cannot run this persistent Node/SQLite origin or unchanged Cloudflare edge/D1 handlers |
| AKS | Adds operational complexity and baseline cost without a demonstrated need for this single-workspace deployment |

SQLite WAL requires local-host filesystem semantics; do not place the live database on Azure Files/SMB/NFS or Blob. Managed disks attached to the VM and formatted/mounted locally satisfy the intended topology. A later PostgreSQL/Azure SQL migration requires app repository, transaction, schema and recovery changes; it is not a connection-string swap.

## Deployment sequence

1. Inventory the exact active Node/frontend releases from the latest ledger and supervisor, not an old deployment heading. Measure DATA_DIR usage, blob growth and representative CPU/memory/API latency. Retain current app ownership and planned-app availability statuses.
2. Provision a dedicated resource group, Ubuntu VM, managed disks and private Blob backup container in Central India. Enable disk/storage encryption, managed identity for narrowly scoped backup upload, budget alerts and automatic reboot startup. Restrict SSH to administrator IP/key access; keep port 3000 private. Set a starting INR 5,000 pre-tax budget with 50/80/100% alerts; budget alerts do not cap spending.
3. Build an immutable release using the existing Dockerfile; pin the validated runtime/image. Bind DATA_DIR=/app/data to /srv/synapse/data on the data disk, verify ownership for the container user and use restart policies. Require the data-disk mount before app startup to prevent booting into an empty directory. Preserve PUBLIC_ORIGIN=https://apps.sushantsynapse.com and private SETUP_TOKEN. No fresh-owner setup over a migrated database.
4. Choose one origin transport: move the dedicated Cloudflare Tunnel to a boot-managed connector on Azure, or configure a locked-down HTTPS origin. Keep the production Worker same-host proxy semantics. When moving the tunnel, do not leave the Windows connector serving the separate writable database: multiple connectors can distribute requests across diverging copies.
5. Implement full-platform consistent SQLite backups with integrity checks, protected off-device uploads, measured retention and scheduled restore drills. Preserve data/records.json and required reference/cache files. Do not copy a live chambers.sqlite file alone: use SQLite backup facilities or a stopped, checkpointed database. Daily recovery target is up to 24 hours of data loss; propose an initial four-hour recovery-time target and prove it in a restore drill. Use more frequent backups if required.
6. Stage using an isolated DATA_DIR; run npm.cmd test and npm.cmd run test:e2e on the supported test workstation, and equivalent npm commands plus container checks on Linux. Include startup/health, shared login, account roles, app access, atomic hearing changes, fee balances, private document downloads and full SQL recovery. Keep staging private, disable external side effects and avoid real-data writes during checks. Establish that new hosts reject unauthorized API calls.
7. Schedule a brief cutover write freeze. Stop the old Node writer, take and validate the final consistent copy, securely transfer all required data, and compare table counts/content hashes, integrity, foreign keys, document blobs and legacy-file checksum. Start Azure with this data, switch only the intended origin route, and perform read-only production checks. Retain the previous host/data as a recovery copy, not a second active writer.
8. Verify restart after VM reboot, backup upload/restore, alerts and frontend/backend health. Confirm /, /advocate, secure cookies and private APIs; confirm independent Cloudflare public apps/D1 continue functioning. Once Azure accepts writes, rollback must reconcile or restore the latest Azure data before routing to the old host; never reactivate the stale copy blindly.

No court sync, payment provider, message delivery, client portal or automated backups become connected merely by moving hosting. Mark Azure and backup statuses verified only after actual provision/cutover/restore evidence.

## Pricing evidence and sources

Exact retrieved meter rates, query filters, currency and effective dates are retained in AZURE_RETAIL_PRICES_2026-10-10.json. Microsoft states non-USD retail API results are reference estimates, so the subscription calculator/checkout remains the final quote. Rates were queried on 2026-10-10; estimates are not guaranteed future prices.

- https://learn.microsoft.com/en-us/rest/api/cost-management/retail-prices/azure-retail-prices
- https://azure.microsoft.com/en-in/pricing/details/virtual-machines/linux/
- https://azure.microsoft.com/en-in/pricing/details/managed-disks/
- https://azure.microsoft.com/en-us/pricing/details/bandwidth/
- https://learn.microsoft.com/en-us/azure/app-service/configure-connect-to-azure-storage
- https://www.sqlite.org/wal.html
- https://learn.microsoft.com/en-au/azure/virtual-machines/sizes/general-purpose/b-family
