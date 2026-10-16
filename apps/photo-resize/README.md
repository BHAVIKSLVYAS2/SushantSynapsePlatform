# photo-resize

Decodes JPEG/PNG/WebP locally (12 MB and 24 MP limits), preserves aspect ratio, bounds output to requested dimensions and reduces JPEG quality/dimensions to meet a target in KB (1 KB = 1024 bytes). Output is JPEG; transparent pixels become white and canvas rendering omits source metadata. Revision guards discard stale asynchronous output. No upload or persistence. Real download/dimension/target-size browser coverage is in `apps/qr-maker/tests/browser.spec.js`.

App-owned frontend, public registry entry and static allowlist. Shared presentation and download/copy helpers are in packages/ui/local-tools.*. No backend, database schema or provider setup is required. Deployed and live-verified on 2026-10-16; release details are in docs/FUNCTIONALITY_LEDGER.md.
